package com.retail.config;

import io.micrometer.observation.ObservationRegistry;
import io.micrometer.tracing.Tracer;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.web.server.WebFilter;
import reactor.core.publisher.Mono;

/**
 * Configuration for distributed tracing with OpenTelemetry.
 *
 * Provides:
 * - Automatic trace context propagation across reactive chains
 * - Custom span tags for tenant and user context
 * - Integration with Micrometer Observation API
 *
 * Disabled in test profile.
 */
@Configuration
@Profile("!test")
public class TracingConfiguration {

    /**
     * Web filter to enrich traces with tenant and user context from MDC.
     *
     * This filter adds custom tags to the current span for better trace filtering:
     * - tenant.id: Current tenant identifier
     * - user.id: Current user identifier
     *
     * @param tracer the Micrometer tracer
     * @return WebFilter for trace enrichment
     */
    @Bean
    @ConditionalOnBean(Tracer.class)
    public WebFilter traceEnrichmentFilter(Tracer tracer) {
        return (exchange, chain) -> {
            return Mono.deferContextual(contextView -> {
                // Get current span from tracer
                var currentSpan = tracer.currentSpan();

                if (currentSpan != null) {
                    // Extract tenant and user from Reactor context (if available)
                    String tenantId = contextView.getOrDefault("tenantId", "unknown");
                    String userId = contextView.getOrDefault("userId", "unknown");

                    // Add custom tags to span
                    currentSpan.tag("tenant.id", tenantId);
                    currentSpan.tag("user.id", userId);
                    currentSpan.tag("http.path", exchange.getRequest().getPath().value());
                    currentSpan.tag("http.method", exchange.getRequest().getMethod().name());
                }

                return chain.filter(exchange);
            });
        };
    }

    // Removed customObservationRegistry bean to avoid circular dependency.
    // The default ObservationRegistry from Spring Boot auto-configuration is sufficient.
}
