# Monitoring & Observability Guide

This document outlines the monitoring and observability strategy for the Retail Agentic platform.

## Overview

Our monitoring strategy provides comprehensive visibility into:
1. **Application Health** - Service availability and health checks
2. **Performance Metrics** - Response times, throughput, resource usage
3. **Business Metrics** - Orders, payments, user activity
4. **Error Tracking** - Exception monitoring and debugging
5. **Logs** - Structured application logs

## Architecture

```
┌─────────────────┐     ┌──────────────┐     ┌────────────┐
│   Backend API   │────▶│  Prometheus  │────▶│  Grafana   │
│  (Spring Boot)  │     │   (Metrics)  │     │(Dashboard) │
└─────────────────┘     └──────────────┘     └────────────┘
        │
        │  JSON Logs
        ▼
┌─────────────────┐     ┌──────────────┐
│   Logback       │────▶│  Log Stream  │
│  (Structured)   │     │ (Stdout/File)│
└─────────────────┘     └──────────────┘

┌─────────────────┐     ┌──────────────┐
│  Frontend Apps  │────▶│ Error Track  │
│ (React/TypeScript)│   │  Endpoint    │
└─────────────────┘     └──────────────┘
```

## Backend Monitoring

### 1. Health Checks (Spring Boot Actuator)

**Endpoint**: `GET /actuator/health`

**Health Indicators:**
- MongoDB connectivity
- Redis connectivity
- Elasticsearch connectivity
- R2DBC (PostgreSQL) connectivity
- Disk space availability

**Example Response:**
```json
{
  "status": "UP",
  "components": {
    "mongo": {
      "status": "UP",
      "details": {
        "version": "7.0.0"
      }
    },
    "redis": {
      "status": "UP",
      "details": {
        "version": "7.2.0"
      }
    },
    "diskSpace": {
      "status": "UP",
      "details": {
        "total": 499963174912,
        "free": 123456789012,
        "threshold": 10485760
      }
    }
  }
}
```

**Kubernetes Probes:**
- Liveness: `GET /actuator/health/liveness`
- Readiness: `GET /actuator/health/readiness`

### 2. Metrics (Prometheus)

**Endpoint**: `GET /actuator/prometheus`

**JVM Metrics:**
- `jvm_memory_used_bytes` - JVM memory usage
- `jvm_gc_pause_seconds` - Garbage collection pause time
- `jvm_threads_live_threads` - Active thread count

**HTTP Metrics:**
- `http_server_requests_seconds` - HTTP request duration (with percentiles)
- `http_server_requests_seconds_count` - Total request count
- `http_server_requests_seconds_sum` - Total request duration

**Database Metrics:**
- `mongodb_driver_pool_size` - MongoDB connection pool size
- `mongodb_driver_pool_checkedout` - MongoDB connections in use
- `lettuce_command_latency_seconds` - Redis command latency

**Custom Business Metrics:**
- `orders_created_total` - Total orders created
- `orders_failed_total` - Total failed orders
- `orders_completed_total` - Total completed orders
- `orders_processing_time_seconds` - Order processing duration
- `products_viewed_total` - Total product views
- `products_searched_total` - Total product searches
- `cart_items_added_total` - Items added to cart
- `cart_converted_total` - Carts converted to orders
- `auth_login_attempts_total` - Login attempts
- `auth_login_successes_total` - Successful logins
- `auth_login_failures_total` - Failed logins
- `cache_hits_total` - Cache hit count
- `cache_misses_total` - Cache miss count
- `payments_processed_total` - Payments processed
- `payments_succeeded_total` - Successful payments
- `payments_failed_total` - Failed payments

**Using Custom Metrics:**

```java
@Service
public class OrderService {
    private final ApplicationMetrics metrics;

    public Mono<Order> createOrder(Order order) {
        Timer.Sample sample = metrics.startOrderProcessing();

        return orderRepository.save(order)
            .doOnSuccess(saved -> {
                metrics.recordOrderCreated(saved.getTenantId());
                metrics.endOrderProcessing(sample);
            })
            .doOnError(error -> {
                metrics.recordOrderFailed();
            });
    }
}
```

### 3. Structured Logging

**Configuration**: `logback-spring.xml`

**Log Profiles:**
- **Development** (`dev`): Human-readable console logs
- **Test** (`test`): Minimal logging
- **Production** (`prod`): JSON structured logs to console and file

**JSON Log Format:**
```json
{
  "timestamp": "2025-01-15T10:30:45.123Z",
  "level": "INFO",
  "thread": "reactor-http-nio-2",
  "logger": "com.retail.service.OrderService",
  "message": "Order created successfully",
  "exception": null,
  "tenantId": "tenant-1",
  "userId": "user-123",
  "requestId": "req-abc-def",
  "method": "POST",
  "uri": "/api/v1/orders"
}
```

**Logging Best Practices:**

```java
@Slf4j
@Service
public class ProductService {
    public Mono<Product> getProduct(String id) {
        MDC.put("productId", id);

        log.info("Fetching product by ID");

        return productRepository.findById(id)
            .doOnSuccess(product -> {
                log.info("Product found: {}", product.getName());
            })
            .doOnError(error -> {
                log.error("Failed to fetch product", error);
            })
            .doFinally(signal -> MDC.clear());
    }
}
```

**MDC Context Keys:**
- `tenantId` - Current tenant identifier
- `userId` - Current user identifier
- `requestId` - Unique request identifier
- `method` - HTTP method
- `uri` - Request URI

### 4. Actuator Endpoints

| Endpoint | Description |
|----------|-------------|
| `/actuator/health` | Application health status |
| `/actuator/info` | Application information |
| `/actuator/metrics` | Available metrics list |
| `/actuator/metrics/{name}` | Specific metric details |
| `/actuator/prometheus` | Prometheus-formatted metrics |
| `/actuator/env` | Environment properties |
| `/actuator/loggers` | Logging configuration |

**Security Note**: In production, restrict access to Actuator endpoints using Spring Security.

## Frontend Monitoring

### 1. Error Tracking

**Location**: `src/utils/errorTracking.ts`

**Features:**
- Global error handler for uncaught errors
- Unhandled promise rejection tracking
- Custom error/warning/info capture
- Automatic context enrichment
- Error buffering and batching
- User context tracking

**Usage:**

```typescript
import { captureError, captureWarning, setUser, trackEvent } from '@/utils/errorTracking';

// Set user context after login
setUser(user.id, user.tenantId);

// Capture errors
try {
  await api.createOrder(order);
} catch (error) {
  captureError(error as Error, {
    component: 'CheckoutPage',
    action: 'create_order',
    orderId: order.id,
  });
}

// Capture warnings
if (cart.items.length > 50) {
  captureWarning('Large cart detected', {
    component: 'CartPage',
    itemCount: cart.items.length,
  });
}

// Track custom events
trackEvent('product_purchase', {
  productId: product.id,
  price: product.price,
  category: product.category,
});
```

**Configuration:**

Set the error tracking endpoint in `.env`:
```bash
VITE_ERROR_TRACKING_ENDPOINT=https://api.example.com/errors
```

### 2. Performance Tracking

**Core Web Vitals:**
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- Cumulative Layout Shift (CLS)
- Time to Interactive (TTI)

**Tracked via:**
- Lighthouse CI (automated testing)
- Performance budgets (build-time checks)
- Custom performance API usage

**Example:**

```typescript
import { trackPerformance } from '@/utils/errorTracking';

const startTime = performance.now();
await fetchProducts();
const endTime = performance.now();

trackPerformance('product_fetch_time', endTime - startTime);
```

### 3. Page View Tracking

```typescript
import { trackPageView } from '@/utils/errorTracking';

useEffect(() => {
  trackPageView('ProductDetailPage', {
    productId: id,
    category: product?.category,
  });
}, [id]);
```

## Prometheus Setup

### 1. Installation

**Docker Compose:**
```yaml
services:
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'

volumes:
  prometheus-data:
```

### 2. Configuration (`prometheus.yml`)

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'retail-backend'
    metrics_path: '/actuator/prometheus'
    static_configs:
      - targets: ['backend:8080']
    relabel_configs:
      - source_labels: [__address__]
        target_label: instance
        replacement: 'retail-backend'
```

### 3. Accessing Prometheus

- **UI**: http://localhost:9090
- **Targets**: http://localhost:9090/targets
- **Query**: http://localhost:9090/graph

**Example Queries:**

```promql
# Average request duration
rate(http_server_requests_seconds_sum[5m]) / rate(http_server_requests_seconds_count[5m])

# Request rate per second
rate(http_server_requests_seconds_count[1m])

# Order creation rate
rate(orders_created_total[5m])

# Error rate
rate(http_server_requests_seconds_count{status=~"5.."}[1m])

# Cache hit ratio
sum(rate(cache_hits_total[5m])) / (sum(rate(cache_hits_total[5m])) + sum(rate(cache_misses_total[5m])))
```

## Distributed Tracing

### Overview

Distributed tracing tracks requests across the entire system, from initial API call through all downstream services and databases. See [DISTRIBUTED_TRACING.md](./DISTRIBUTED_TRACING.md) for comprehensive documentation.

### Quick Start

**Backend Configuration** (`application.yml`):
```yaml
management:
  tracing:
    enabled: true
    sampling:
      probability: 1.0  # 100% in dev, reduce in production
  zipkin:
    tracing:
      endpoint: http://localhost:9411/api/v2/spans
```

**Start Zipkin**:
```bash
docker run -d -p 9411:9411 openzipkin/zipkin
```

**Access Traces**: http://localhost:9411

### Trace Enrichment

All traces automatically include:
- `tenant.id` - Current tenant
- `user.id` - Current user
- `http.path` - Request path
- `http.method` - HTTP method

### Custom Spans

Use `TracingUtils` for custom spans in reactive code:

```java
@Service
public class ProductService {
    private final TracingUtils tracingUtils;

    public Mono<List<Product>> searchProducts(String query) {
        return tracingUtils.traceReactiveMono("product.search", span -> {
            span.tag("search.query", query);
            span.tag("search.type", "full-text");

            return productRepository.findByNameContaining(query)
                .collectList()
                .doOnSuccess(results -> {
                    span.tag("results.count", String.valueOf(results.size()));
                    span.event("search.completed");
                });
        });
    }
}
```

**See [DISTRIBUTED_TRACING.md](./DISTRIBUTED_TRACING.md) for complete documentation.**

## Uptime Monitoring

### Blackbox Exporter

Blackbox Exporter provides active uptime monitoring for HTTP, TCP, and ICMP endpoints.

**Docker Compose**:
```yaml
services:
  blackbox-exporter:
    image: prom/blackbox-exporter:latest
    ports:
      - "9115:9115"
    volumes:
      - ./monitoring/blackbox/blackbox.yml:/etc/blackbox_exporter/config.yml
```

**Configuration** (`monitoring/blackbox/blackbox.yml`):
```yaml
modules:
  http_2xx:
    prober: http
    timeout: 5s
    http:
      valid_status_codes: []
      method: GET
      follow_redirects: true

  http_health_check:
    prober: http
    timeout: 5s
    http:
      valid_status_codes: [200]
      fail_if_body_not_matches_regexp:
        - '"status"\s*:\s*"UP"'
```

### Prometheus Scraping

**Add to `prometheus.yml`**:
```yaml
scrape_configs:
  - job_name: 'backend-health-check'
    metrics_path: /probe
    params:
      module: [http_health_check]
    static_configs:
      - targets:
          - 'http://backend:8080/actuator/health'
    relabel_configs:
      - source_labels: [__address__]
        target_label: __param_target
      - target_label: __address__
        replacement: blackbox-exporter:9115
```

### Uptime Metrics

**Query uptime percentage**:
```promql
avg_over_time(probe_success{job="backend-health-check"}[1h]) * 100
```

**Alert on downtime**:
```yaml
- alert: ServiceDown
  expr: probe_success{job="backend-health-check"} == 0
  for: 1m
  labels:
    severity: critical
  annotations:
    summary: "Service is down"
```

**Full configuration available in**:
- `monitoring/blackbox/blackbox.yml`
- `monitoring/prometheus/prometheus.yml`

## Grafana Dashboards

### 1. Installation

**Docker Compose:**
```yaml
services:
  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_USER=admin
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana-data:/var/lib/grafana

volumes:
  grafana-data:
```

### 2. Add Prometheus Data Source

1. Navigate to http://localhost:3000
2. Go to Configuration → Data Sources
3. Add Prometheus data source
4. Set URL to `http://prometheus:9090`
5. Click "Save & Test"

### 3. Pre-configured Dashboards

The following dashboard JSON files are available in `monitoring/grafana/dashboards/`:

#### Application Overview Dashboard (`application-overview.json`)

**Metrics displayed:**
- Request Rate (gauge)
- Average Response Time (gauge)
- Error Rate (gauge with thresholds)
- Order Creation Rate (time series)
- Request Rate by Endpoint (time series)
- Response Time Percentiles (P95, P99)
- Payment Success/Failure Rate (stacked time series)
- Cache Hit Ratio (gauge)

**Import:**
1. Go to Grafana UI → Dashboards → Import
2. Upload `monitoring/grafana/dashboards/application-overview.json`
3. Select Prometheus data source
4. Click Import

**Access:** http://localhost:3000/d/retail-app-overview

#### Infrastructure Dashboard (`infrastructure.json`)

**Metrics displayed:**
- JVM Memory Usage (heap/non-heap)
- GC Pause Time
- Thread Count (live/daemon)
- MongoDB Connection Pool
- Redis Command Latency (P95, P99)
- Heap Memory Usage % (gauge)

**Import:**
1. Go to Grafana UI → Dashboards → Import
2. Upload `monitoring/grafana/dashboards/infrastructure.json`
3. Select Prometheus data source
4. Click Import

**Access:** http://localhost:3000/d/retail-infrastructure

#### Community Dashboards (Optional)

**Import Pre-built Dashboards by ID:**
- JVM Dashboard: ID 4701
- Spring Boot Dashboard: ID 6756
- Node Exporter Full: ID 1860

## Alerting

### Prometheus AlertManager

**Installation**:

```yaml
services:
  alertmanager:
    image: prom/alertmanager:latest
    ports:
      - "9093:9093"
    volumes:
      - ./monitoring/alertmanager/alertmanager.yml:/etc/alertmanager/alertmanager.yml
      - alertmanager-data:/alertmanager
    command:
      - '--config.file=/etc/alertmanager/alertmanager.yml'
      - '--storage.path=/alertmanager'
```

**Access UI:** http://localhost:9093

### Alert Rules

Complete alert rules are defined in `monitoring/prometheus/alerts.yml`:

**Application Alerts:**
- `HighErrorRate` - Critical: Error rate > 5% for 5 minutes
- `SlowResponseTime` - Warning: P95 response time > 1s for 10 minutes
- `HighOrderFailureRate` - Critical: Order failure rate > 10%
- `HighPaymentFailureRate` - Critical: Payment failure rate > 20%
- `LowCacheHitRate` - Warning: Cache hit rate < 50%

**Infrastructure Alerts:**
- `HighMemoryUsage` - Warning: Heap usage > 90%
- `CriticalMemoryUsage` - Critical: Heap usage > 95%
- `ExcessiveGCTime` - Warning: GC time > 10% of CPU
- `HighThreadCount` - Warning: Thread count > 500

**Database Alerts:**
- `MongoDBConnectionPoolExhaustion` - Warning: Pool > 80% utilized
- `RedisHighLatency` - Warning: P95 latency > 100ms

**Availability Alerts:**
- `ServiceDown` - Critical: Service not responding for 1 minute
- `MongoDBDown` - Critical: MongoDB unavailable for 2 minutes
- `RedisDown` - Critical: Redis unavailable for 2 minutes
- `ElasticsearchDown` - Critical: Elasticsearch unavailable for 2 minutes

**Business Alerts:**
- `LowOrderVolume` - Warning: < 10 orders/hour for 1 hour
- `HighAuthenticationFailureRate` - Warning: Login failure rate > 30%

**Load alert rules in Prometheus:**
```yaml
# prometheus.yml
rule_files:
  - '/etc/prometheus/alerts.yml'
```

### Alert Notification Channels

AlertManager is configured in `monitoring/alertmanager/alertmanager.yml` with the following channels:

**Email:**
- Default alerts → ops@retail.example.com
- Critical alerts → oncall@retail.example.com
- Business alerts → business@retail.example.com
- DevOps alerts → devops@retail.example.com

**Slack:**
- Critical alerts → #alerts-critical
- Warning alerts → #alerts-warning
- Business alerts → #business-alerts
- DevOps alerts → #devops-alerts

**PagerDuty:**
- Critical alerts only
- Configured via `PAGERDUTY_SERVICE_KEY` environment variable

**Configuration via Environment Variables:**
```bash
# Email
export SMTP_HOST=smtp.example.com:587
export SMTP_FROM=alerts@retail.example.com
export SMTP_USERNAME=alerts@retail.example.com
export SMTP_PASSWORD=your-password

# Slack
export SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
export SLACK_CHANNEL_CRITICAL=#alerts-critical
export SLACK_CHANNEL_WARNING=#alerts-warning

# PagerDuty
export PAGERDUTY_SERVICE_KEY=your-pagerduty-key

# Email addresses
export ALERT_EMAIL_DEFAULT=ops@retail.example.com
export ALERT_EMAIL_CRITICAL=oncall@retail.example.com
export ALERT_EMAIL_BUSINESS=business@retail.example.com
export ALERT_EMAIL_DEVOPS=devops@retail.example.com
```

### Alert Inhibition Rules

AlertManager suppresses redundant alerts:
- **Critical suppresses warning** for the same component
- **ServiceDown suppresses all other alerts** for that instance

### Testing Alerts

**Trigger test alert:**
```bash
curl -H "Content-Type: application/json" -d '[{
  "labels": {
    "alertname": "TestAlert",
    "severity": "warning"
  },
  "annotations": {
    "summary": "This is a test alert"
  }
}]' http://localhost:9093/api/v1/alerts
```

**View active alerts:**
http://localhost:9093/#/alerts

**View alert configuration:**
http://localhost:9093/#/status

## Log Aggregation

### ELK Stack (Elasticsearch, Logstash, Kibana)

**Logstash Configuration:**

```conf
input {
  file {
    path => "/var/log/retail-backend/*.log"
    codec => json
  }
}

filter {
  # Add filters if needed
}

output {
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "retail-backend-%{+YYYY.MM.dd}"
  }
}
```

**Kibana Queries:**

```
# All errors
level: "ERROR"

# Errors for specific tenant
level: "ERROR" AND tenantId: "tenant-1"

# Slow queries (> 1 second)
@timestamp: [now-1h TO now] AND duration: >1000

# Failed orders
logger: "OrderService" AND message: "failed"
```

## Monitoring Checklist

### Production Deployment

- [ ] Prometheus scraping backend metrics
- [ ] Grafana dashboards configured
- [ ] Alert rules defined and tested
- [ ] Log aggregation configured
- [ ] Error tracking endpoint configured
- [ ] Health check endpoints accessible
- [ ] Metric retention policy set
- [ ] Backup and disaster recovery plan
- [ ] Access controls configured
- [ ] Documentation updated

### Regular Monitoring Tasks

**Daily:**
- Check error rates and trends
- Review slow query logs
- Monitor disk space usage
- Check payment success rate

**Weekly:**
- Review performance trends
- Analyze user activity patterns
- Check for memory leaks
- Review alert history

**Monthly:**
- Capacity planning review
- Performance baseline update
- Security audit
- Dependency updates

## Troubleshooting

### High Memory Usage

1. Check JVM heap usage: `/actuator/metrics/jvm.memory.used`
2. Analyze heap dump if needed
3. Review connection pool sizes
4. Check for memory leaks

### Slow Response Times

1. Check database query performance
2. Review connection pool utilization
3. Analyze slow logs
4. Check external API latency

### High Error Rates

1. Review error logs: `level: "ERROR"`
2. Check specific error messages
3. Verify database connectivity
4. Check third-party service status

### Database Connection Issues

1. Check pool size: `mongodb_driver_pool_size`
2. Check active connections: `mongodb_driver_pool_checkedout`
3. Review database logs
4. Verify network connectivity

## References

- [Spring Boot Actuator Documentation](https://docs.spring.io/spring-boot/docs/current/reference/html/actuator.html)
- [Micrometer Documentation](https://micrometer.io/docs)
- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Logback Documentation](https://logback.qos.ch/documentation.html)

## Contact

For questions about monitoring and observability, contact the DevOps/SRE team or refer to the project documentation.
