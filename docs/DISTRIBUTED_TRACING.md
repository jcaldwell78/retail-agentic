# Distributed Tracing Guide

This document describes the distributed tracing implementation for the Retail Agentic platform using OpenTelemetry and Micrometer Tracing.

## Overview

Distributed tracing allows you to track requests as they flow through the entire system, from the initial API call through all downstream services and databases. This is especially valuable in reactive, multi-tenant architectures where understanding request flow is critical.

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Backend   │────▶│ OpenTelemetry│────▶│   Zipkin    │
│  (Spring)   │     │   Collector  │     │  (UI/Query) │
└─────────────┘     └─────────────┘     └─────────────┘
       │
       │ OTLP
       ▼
┌─────────────┐
│   Jaeger    │
│  (Optional) │
└─────────────┘
```

## Key Concepts

### Trace
A complete request journey through the system. Each trace has a unique **trace ID**.

### Span
A single unit of work within a trace (e.g., database query, HTTP request, service method). Each span has:
- **Span ID**: Unique identifier
- **Parent Span ID**: Links to parent span
- **Trace ID**: Associates span with its trace
- **Tags**: Key-value metadata
- **Events**: Timestamped events within the span
- **Duration**: Start and end time

### Context Propagation
The mechanism that passes trace context between services and asynchronous boundaries.

## Configuration

### Backend Configuration

The backend is configured with OpenTelemetry tracing in `application.yml`:

```yaml
management:
  tracing:
    enabled: true
    sampling:
      probability: 1.0  # 100% sampling in dev/test
  zipkin:
    tracing:
      endpoint: http://localhost:9411/api/v2/spans
  otlp:
    tracing:
      endpoint: http://localhost:4318/v1/traces
```

**Production Settings** (in `application.yml` under `prod` profile):
```yaml
management:
  tracing:
    sampling:
      probability: 0.1  # 10% sampling in production
```

### Dependencies

The following dependencies are included in `pom.xml`:

```xml
<!-- Micrometer Tracing with OpenTelemetry -->
<dependency>
    <groupId>io.micrometer</groupId>
    <artifactId>micrometer-tracing-bridge-otel</artifactId>
</dependency>
<dependency>
    <groupId>io.opentelemetry</groupId>
    <artifactId>opentelemetry-exporter-otlp</artifactId>
</dependency>
<dependency>
    <groupId>io.opentelemetry</groupId>
    <artifactId>opentelemetry-exporter-zipkin</artifactId>
</dependency>
```

## Automatic Instrumentation

Spring Boot automatically traces:
- **HTTP Requests**: All incoming requests to `@RestController` endpoints
- **WebClient Calls**: Outgoing HTTP requests (if using WebClient)
- **Database Queries**: MongoDB, Redis, PostgreSQL (R2DBC)
- **Messaging**: Reactive message processing

### Trace Context Headers

Traces are propagated via HTTP headers:
- **W3C Trace Context** (default): `traceparent`, `tracestate`
- **B3 Propagation** (Zipkin): `X-B3-TraceId`, `X-B3-SpanId`, `X-B3-Sampled`

## Custom Tracing

### Using TracingUtils

The `TracingUtils` class provides helper methods for custom spans in reactive code:

```java
@Service
public class ProductService {
    private final TracingUtils tracingUtils;
    private final ProductRepository productRepository;

    public Mono<List<Product>> searchProducts(String query, String tenantId) {
        return tracingUtils.traceReactiveMono("product.search", span -> {
            // Add custom tags to span
            span.tag("search.query", query);
            span.tag("tenant.id", tenantId);
            span.tag("search.type", "full-text");

            return productRepository.findByNameContaining(query, tenantId)
                .collectList()
                .doOnSuccess(results -> {
                    span.tag("search.results.count", String.valueOf(results.size()));
                    span.event("search.completed");
                });
        });
    }
}
```

### Tracing Flux Operations

For streaming operations, use `traceReactiveFlux`:

```java
public Flux<Product> streamProducts(String tenantId) {
    return tracingUtils.traceReactiveFlux("product.stream", span -> {
        span.tag("tenant.id", tenantId);

        return productRepository.findAllByTenantId(tenantId)
            .doOnComplete(() -> span.event("stream.completed"));
    });
}
```

### Adding Tags to Current Span

You can add tags to the currently active span without creating a new one:

```java
tracingUtils.tagCurrentSpan("operation.type", "bulk-update");
tracingUtils.tagCurrentSpan("items.count", String.valueOf(items.size()));
```

### Adding Events

Events mark significant moments within a span:

```java
tracingUtils.eventCurrentSpan("validation.started");
// ... validation logic ...
tracingUtils.eventCurrentSpan("validation.completed");
```

### Logging Correlation

Get the current trace ID for log correlation:

```java
String traceId = tracingUtils.getCurrentTraceId();
String spanId = tracingUtils.getCurrentSpanId();

log.info("Processing order {} [trace={}, span={}]", orderId, traceId, spanId);
```

## Trace Enrichment

### Tenant and User Context

The `TracingConfiguration` automatically enriches all traces with tenant and user information:

```java
@Bean
public WebFilter traceEnrichmentFilter(Tracer tracer) {
    return (exchange, chain) -> {
        return Mono.deferContextual(contextView -> {
            var currentSpan = tracer.currentSpan();

            if (currentSpan != null) {
                String tenantId = contextView.getOrDefault("tenantId", "unknown");
                String userId = contextView.getOrDefault("userId", "unknown");

                currentSpan.tag("tenant.id", tenantId);
                currentSpan.tag("user.id", userId);
                currentSpan.tag("http.path", exchange.getRequest().getPath().value());
                currentSpan.tag("http.method", exchange.getRequest().getMethod().name());
            }

            return chain.filter(exchange);
        });
    };
}
```

This ensures every trace includes:
- `tenant.id`: Current tenant identifier
- `user.id`: Current user identifier
- `http.path`: Request path
- `http.method`: HTTP method

## Viewing Traces

### Zipkin UI

1. Start Zipkin:
   ```bash
   docker run -d -p 9411:9411 openzipkin/zipkin
   ```

2. Access UI: http://localhost:9411

3. **Search Traces**:
   - Filter by service name: `retail-backend`
   - Filter by tags: `tenant.id=tenant-1`
   - Filter by duration: `>1s`
   - Filter by time range

4. **View Trace Details**:
   - Click on a trace to see the full span tree
   - View span duration and dependencies
   - Inspect tags and events
   - See error details if span failed

### Jaeger UI (Alternative)

1. Start Jaeger:
   ```bash
   docker run -d \
     -p 6831:6831/udp \
     -p 6832:6832/udp \
     -p 16686:16686 \
     -p 14268:14268 \
     jaegertracing/all-in-one:latest
   ```

2. Access UI: http://localhost:16686

3. Configure backend to send to Jaeger (OTLP):
   ```yaml
   management:
     otlp:
       tracing:
         endpoint: http://localhost:4318/v1/traces
   ```

## Common Use Cases

### Debugging Slow Requests

1. Search for slow traces in Zipkin (e.g., `>1s`)
2. Open the trace to see span tree
3. Identify the slowest span(s)
4. Check span tags for additional context
5. Review events within the span

**Example Query**:
```
serviceName=retail-backend AND minDuration=1000ms
```

### Tracking Multi-Tenant Requests

Filter traces by tenant:

```
serviceName=retail-backend AND tenant.id=tenant-1
```

### Analyzing Error Patterns

1. Filter by error status:
   ```
   serviceName=retail-backend AND error=true
   ```

2. Group by error type using tags:
   ```
   serviceName=retail-backend AND error=true AND error.type=DatabaseException
   ```

### Monitoring Service Dependencies

Zipkin's dependency graph shows:
- Which services call which
- Call volumes
- Error rates
- Average latency

Access: Zipkin UI → Dependencies

## Best Practices

### 1. Meaningful Span Names

Use descriptive, hierarchical span names:

```java
// Good
span.name("product.search.elasticsearch");
span.name("order.payment.process");
span.name("cart.item.add");

// Bad
span.name("search");
span.name("process");
```

### 2. Tag Everything Important

Add tags for filtering and analysis:

```java
span.tag("tenant.id", tenantId);
span.tag("user.id", userId);
span.tag("product.id", productId);
span.tag("order.id", orderId);
span.tag("payment.method", paymentMethod);
span.tag("operation.type", "create");
span.tag("database.collection", "products");
```

### 3. Use Events for Milestones

Mark significant points in execution:

```java
span.event("validation.started");
span.event("payment.authorized");
span.event("inventory.reserved");
span.event("order.confirmed");
```

### 4. Adjust Sampling Rates

- **Development**: 100% sampling (`probability: 1.0`)
- **Staging**: 50% sampling (`probability: 0.5`)
- **Production**: 10% sampling (`probability: 0.1`)
- **High-traffic production**: 1% sampling (`probability: 0.01`)

### 5. Correlate Logs with Traces

Include trace ID in logs:

```java
String traceId = tracingUtils.getCurrentTraceId();
log.info("Processing order [trace={}]", traceId);
```

Then search logs by trace ID to see the full picture.

### 6. Handle Errors Properly

Always record errors in spans:

```java
return tracingUtils.traceReactiveMono("order.create", span -> {
    return orderRepository.save(order)
        .doOnError(error -> {
            span.error(error);  // Marks span as error
            span.tag("error.type", error.getClass().getSimpleName());
            span.tag("error.message", error.getMessage());
        });
});
```

## Troubleshooting

### Traces Not Appearing

1. **Check sampling rate**: Ensure `management.tracing.sampling.probability > 0`
2. **Verify exporter endpoint**: Confirm Zipkin/Jaeger is running and accessible
3. **Check logs**: Look for trace export errors in application logs
4. **Test connectivity**: `curl http://localhost:9411/api/v2/services`

### Missing Spans

1. **Verify context propagation**: Ensure Reactor context is being propagated
2. **Check async boundaries**: Use `Mono.deferContextual()` to access context
3. **Review custom instrumentation**: Ensure `TracingUtils` methods are used correctly

### High Overhead

1. **Reduce sampling rate**: Lower `probability` in production
2. **Limit tag cardinality**: Avoid tags with unbounded values (e.g., timestamps, UUIDs in values)
3. **Batch span exports**: Configure exporter batch size and timeout

### Incorrect Parent-Child Relationships

1. **Use deferContextual**: Ensure context is captured correctly:
   ```java
   return Mono.deferContextual(ctx -> {
       // Capture context here
       return operation();
   });
   ```

2. **Check operator ordering**: Tracing operators should wrap the entire operation

## Performance Considerations

### Overhead

Distributed tracing adds minimal overhead:
- **CPU**: <1% for 10% sampling
- **Memory**: ~100 bytes per span
- **Network**: Asynchronous batch export

### Optimization

1. **Use adaptive sampling**: Sample more errors and slow requests
2. **Configure batch exports**: Reduce network calls
3. **Set span limits**: Limit attributes, events per span
4. **Monitor exporter**: Watch for export failures

## Integration with Monitoring

### Linking Metrics to Traces

In Grafana, link from metric panels to traces:

```
https://zipkin.example.com/zipkin/?lookback=1h&serviceName=retail-backend&tags={"tenant.id":"${tenant}"}
```

### Linking Logs to Traces

Include trace ID in structured logs (already configured in `logback-spring.xml`):

```json
{
  "timestamp": "2025-01-15T10:30:45.123Z",
  "traceId": "abc123def456",
  "spanId": "789ghi012jkl",
  "message": "Order created successfully"
}
```

Then search logs by trace ID in Kibana or similar.

## Examples

### Complete Order Processing Example

```java
@Service
public class OrderService {
    private final TracingUtils tracingUtils;
    private final OrderRepository orderRepository;
    private final PaymentService paymentService;
    private final InventoryService inventoryService;

    public Mono<Order> createOrder(Order order) {
        return tracingUtils.traceReactiveMono("order.create", span -> {
            span.tag("tenant.id", order.getTenantId());
            span.tag("order.id", order.getId());
            span.tag("order.total", String.valueOf(order.getTotal()));

            span.event("order.validation.started");

            return Mono.just(order)
                .flatMap(this::validateOrder)
                .doOnSuccess(v -> span.event("order.validation.completed"))
                .flatMap(o -> inventoryService.reserveItems(o.getItems())
                    .doOnSuccess(v -> span.event("inventory.reserved")))
                .flatMap(o -> paymentService.processPayment(o)
                    .doOnSuccess(v -> span.event("payment.processed")))
                .flatMap(orderRepository::save)
                .doOnSuccess(saved -> {
                    span.tag("order.status", saved.getStatus());
                    span.event("order.created");
                })
                .doOnError(error -> {
                    span.error(error);
                    span.tag("error.type", error.getClass().getSimpleName());
                    span.event("order.creation.failed");
                });
        });
    }
}
```

This creates a trace with spans for:
1. Order validation
2. Inventory reservation
3. Payment processing
4. Order persistence

Each span includes relevant tags and events for debugging.

## References

- [OpenTelemetry Documentation](https://opentelemetry.io/docs/)
- [Micrometer Tracing Documentation](https://micrometer.io/docs/tracing)
- [Zipkin Documentation](https://zipkin.io/pages/quickstart)
- [Jaeger Documentation](https://www.jaegertracing.io/docs/)
- [W3C Trace Context Specification](https://www.w3.org/TR/trace-context/)

## Contact

For questions about distributed tracing, contact the DevOps/Observability team or refer to the project documentation.
