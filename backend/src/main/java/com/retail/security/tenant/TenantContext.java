package com.retail.security.tenant;

import reactor.core.publisher.Mono;
import reactor.util.context.Context;

/**
 * Utility class for managing tenant context in reactive chains.
 * Uses Reactor Context to propagate tenant ID throughout the request.
 */
public class TenantContext {

    public static final String TENANT_ID_KEY = "tenantId";
    public static final String TENANT_ID_HEADER = "X-Tenant-ID";

    private TenantContext() {
        // Utility class
    }

    /**
     * Get the current tenant ID from Reactor context
     *
     * @return Mono containing the tenant ID, or error if not found
     */
    public static Mono<String> getTenantId() {
        return Mono.deferContextual(ctx ->
            Mono.justOrEmpty(ctx.<String>getOrEmpty(TENANT_ID_KEY))
                .switchIfEmpty(Mono.error(new TenantContextMissingException(
                    "Tenant context is missing. Ensure request passes through tenant resolution filter."
                )))
        );
    }

    /**
     * Get the tenant ID if present, otherwise return empty
     *
     * @return Mono with tenant ID or empty
     */
    public static Mono<String> getTenantIdOrEmpty() {
        return Mono.deferContextual(ctx ->
            Mono.justOrEmpty(ctx.<String>getOrEmpty(TENANT_ID_KEY))
        );
    }

    /**
     * Execute operation with tenant context
     *
     * @param operation The operation to execute
     * @param <T>       The return type
     * @return Mono with result and tenant context
     */
    public static <T> Mono<T> withTenant(Mono<T> operation) {
        return getTenantId()
            .flatMap(tenantId -> operation
                .contextWrite(Context.of(TENANT_ID_KEY, tenantId))
            );
    }

    /**
     * Set tenant ID in context
     *
     * @param tenantId The tenant ID to set
     * @return Context with tenant ID
     */
    public static Context withTenantId(String tenantId) {
        return Context.of(TENANT_ID_KEY, tenantId);
    }
}
