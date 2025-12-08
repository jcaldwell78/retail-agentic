package com.retail.security.tenant;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;

/**
 * Resolves tenant from X-Tenant-ID header.
 * This strategy is primarily used in testing and development environments
 * where subdomain-based resolution is not practical.
 *
 * Example: X-Tenant-ID: store1 -> "store1"
 */
@Component
@ConditionalOnProperty(name = "app.tenant.strategy", havingValue = "header")
public class HeaderTenantResolutionStrategy implements TenantResolutionStrategy {

    @Override
    public String extractTenantIdentifier(ServerWebExchange exchange) {
        String tenantId = exchange.getRequest().getHeaders().getFirst(TenantContext.TENANT_ID_HEADER);

        if (tenantId == null || tenantId.isBlank()) {
            throw new TenantNotFoundException("X-Tenant-ID header is missing or empty");
        }

        return tenantId;
    }
}
