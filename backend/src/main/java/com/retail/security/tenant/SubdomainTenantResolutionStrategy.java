package com.retail.security.tenant;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;

/**
 * Resolves tenant from subdomain in Host header.
 * Example: store1.retail-agentic.com -> "store1"
 */
@Component
@ConditionalOnProperty(name = "app.tenant.strategy", havingValue = "subdomain", matchIfMissing = true)
public class SubdomainTenantResolutionStrategy implements TenantResolutionStrategy {

    @Override
    public String extractTenantIdentifier(ServerWebExchange exchange) {
        String host = exchange.getRequest().getHeaders().getFirst("Host");

        if (host == null || host.isBlank()) {
            throw new TenantNotFoundException("Host header is missing");
        }

        // Remove port if present
        host = host.split(":")[0];

        // Extract subdomain: "store1.retail-agentic.com" -> "store1"
        String[] parts = host.split("\\.");

        if (parts.length < 2) {
            throw new TenantNotFoundException("Invalid host format. Expected subdomain.domain.tld");
        }

        // First part is the subdomain (tenant identifier)
        String subdomain = parts[0];

        if (subdomain.isBlank()) {
            throw new TenantNotFoundException("Subdomain is empty");
        }

        // Exclude common non-tenant subdomains
        if (isSystemSubdomain(subdomain)) {
            throw new TenantNotFoundException("System subdomain cannot be used as tenant identifier");
        }

        return subdomain;
    }

    private boolean isSystemSubdomain(String subdomain) {
        // Reserved subdomains that are not tenant identifiers
        return subdomain.equalsIgnoreCase("www") ||
               subdomain.equalsIgnoreCase("api") ||
               subdomain.equalsIgnoreCase("admin") ||
               subdomain.equalsIgnoreCase("static") ||
               subdomain.equalsIgnoreCase("cdn");
    }
}
