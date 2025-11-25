package com.retail.security.tenant;

import org.springframework.web.server.ServerWebExchange;

/**
 * Strategy interface for resolving tenant identifier from HTTP request.
 * Supports multiple resolution strategies (subdomain, path, header).
 */
public interface TenantResolutionStrategy {

    /**
     * Extract tenant identifier from the request
     *
     * @param exchange The server web exchange
     * @return The tenant identifier (subdomain, path segment, or header value)
     * @throws TenantNotFoundException if tenant identifier cannot be extracted
     */
    String extractTenantIdentifier(ServerWebExchange exchange);
}
