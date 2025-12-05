package com.retail.security.tenant;

import com.retail.infrastructure.persistence.TenantRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

/**
 * Web filter that resolves the tenant for each request and propagates it through the reactive context.
 * This filter runs with highest precedence to ensure tenant context is available for all downstream processing.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class TenantResolverFilter implements WebFilter {

    private static final Logger log = LoggerFactory.getLogger(TenantResolverFilter.class);

    private final TenantRepository tenantRepository;
    private final TenantResolutionStrategy resolutionStrategy;

    public TenantResolverFilter(TenantRepository tenantRepository,
                                TenantResolutionStrategy resolutionStrategy) {
        this.tenantRepository = tenantRepository;
        this.resolutionStrategy = resolutionStrategy;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        // Skip tenant resolution for health/actuator endpoints
        String path = exchange.getRequest().getPath().value();
        if (isExcludedPath(path)) {
            return chain.filter(exchange);
        }

        return resolveTenantId(exchange)
            .flatMap(tenantId -> {
                log.debug("Resolved tenant ID: {} for request: {}", tenantId, path);

                return chain.filter(exchange)
                    .contextWrite(TenantContext.withTenantId(tenantId));
            })
            .onErrorResume(TenantNotFoundException.class, ex -> {
                log.warn("Tenant not found: {}", ex.getMessage());

                exchange.getResponse().setStatusCode(HttpStatus.NOT_FOUND);
                return exchange.getResponse().setComplete();
            })
            .onErrorResume(Exception.class, ex -> {
                log.error("Error resolving tenant", ex);

                exchange.getResponse().setStatusCode(HttpStatus.INTERNAL_SERVER_ERROR);
                return exchange.getResponse().setComplete();
            });
    }

    /**
     * Resolve tenant ID from request
     */
    private Mono<String> resolveTenantId(ServerWebExchange exchange) {
        return Mono.fromSupplier(() -> resolutionStrategy.extractTenantIdentifier(exchange))
            .flatMap(identifier -> tenantRepository.findBySubdomain(identifier)
                .switchIfEmpty(Mono.error(new TenantNotFoundException(
                    "Tenant not found for identifier: " + identifier
                )))
                .map(tenant -> {
                    // Cache tenant ID in exchange attributes for later use if needed
                    exchange.getAttributes().put("tenantId", tenant.getId());
                    return tenant.getId();
                })
            );
    }

    /**
     * Check if path should skip tenant resolution
     */
    private boolean isExcludedPath(String path) {
        return path.startsWith("/actuator") ||
               path.startsWith("/health") ||
               path.equals("/") ||
               path.startsWith("/swagger-ui") ||
               path.startsWith("/v3/api-docs") ||
               path.startsWith("/webjars");
    }
}
