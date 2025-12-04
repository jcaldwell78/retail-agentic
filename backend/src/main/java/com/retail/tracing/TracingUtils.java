package com.retail.tracing;

import io.micrometer.tracing.Span;
import io.micrometer.tracing.Tracer;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.function.Function;

/**
 * Utility class for distributed tracing in reactive code.
 *
 * Provides helper methods to:
 * - Create custom spans in reactive pipelines
 * - Propagate trace context through Mono/Flux operators
 * - Add business context to traces
 *
 * Usage Example:
 * <pre>
 * {@code
 * return tracingUtils.traceReactiveMono(
 *     "product.search",
 *     span -> {
 *         span.tag("query", searchQuery);
 *         span.tag("tenant", tenantId);
 *         return productRepository.findByName(searchQuery);
 *     }
 * );
 * }
 * </pre>
 */
@Component
public class TracingUtils {

    private final Tracer tracer;

    public TracingUtils(Tracer tracer) {
        this.tracer = tracer;
    }

    /**
     * Wrap a Mono operation with a custom span.
     *
     * @param spanName the name of the span
     * @param operation the reactive operation to trace
     * @param <T> the type of the Mono
     * @return traced Mono
     */
    public <T> Mono<T> traceReactiveMono(String spanName, Function<Span, Mono<T>> operation) {
        return Mono.deferContextual(contextView -> {
            Span span = tracer.nextSpan().name(spanName).start();

            return Mono.defer(() -> operation.apply(span))
                    .doOnSuccess(result -> {
                        if (result != null) {
                            span.event("operation.success");
                        }
                        span.end();
                    })
                    .doOnError(error -> {
                        span.error(error);
                        span.event("operation.error");
                        span.end();
                    })
                    .doOnCancel(() -> {
                        span.event("operation.cancelled");
                        span.end();
                    });
        });
    }

    /**
     * Wrap a Flux operation with a custom span.
     *
     * @param spanName the name of the span
     * @param operation the reactive operation to trace
     * @param <T> the type of the Flux
     * @return traced Flux
     */
    public <T> Flux<T> traceReactiveFlux(String spanName, Function<Span, Flux<T>> operation) {
        return Flux.deferContextual(contextView -> {
            Span span = tracer.nextSpan().name(spanName).start();
            final long[] count = {0};

            return Flux.defer(() -> operation.apply(span))
                    .doOnNext(item -> count[0]++)
                    .doOnComplete(() -> {
                        span.tag("result.count", String.valueOf(count[0]));
                        span.event("operation.complete");
                        span.end();
                    })
                    .doOnError(error -> {
                        span.tag("result.count", String.valueOf(count[0]));
                        span.error(error);
                        span.event("operation.error");
                        span.end();
                    })
                    .doOnCancel(() -> {
                        span.tag("result.count", String.valueOf(count[0]));
                        span.event("operation.cancelled");
                        span.end();
                    });
        });
    }

    /**
     * Add a custom tag to the current span.
     *
     * @param key the tag key
     * @param value the tag value
     */
    public void tagCurrentSpan(String key, String value) {
        Span currentSpan = tracer.currentSpan();
        if (currentSpan != null) {
            currentSpan.tag(key, value);
        }
    }

    /**
     * Add a custom event to the current span.
     *
     * @param eventName the event name
     */
    public void eventCurrentSpan(String eventName) {
        Span currentSpan = tracer.currentSpan();
        if (currentSpan != null) {
            currentSpan.event(eventName);
        }
    }

    /**
     * Get the current trace ID for logging correlation.
     *
     * @return current trace ID or null if no active trace
     */
    public String getCurrentTraceId() {
        Span currentSpan = tracer.currentSpan();
        if (currentSpan != null && currentSpan.context() != null) {
            return currentSpan.context().traceId();
        }
        return null;
    }

    /**
     * Get the current span ID for logging correlation.
     *
     * @return current span ID or null if no active span
     */
    public String getCurrentSpanId() {
        Span currentSpan = tracer.currentSpan();
        if (currentSpan != null && currentSpan.context() != null) {
            return currentSpan.context().spanId();
        }
        return null;
    }
}
