package com.retail.domain.tenant;

import com.retail.infrastructure.persistence.TenantRepository;
import com.retail.security.tenant.TenantContext;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.time.Instant;

/**
 * Service for Tenant operations.
 * Provides tenant configuration and branding management.
 */
@Service
public class TenantService {

    private final TenantRepository tenantRepository;

    public TenantService(TenantRepository tenantRepository) {
        this.tenantRepository = tenantRepository;
    }

    /**
     * Get current tenant configuration
     */
    public Mono<Tenant> getCurrentTenant() {
        return TenantContext.getTenantId()
            .flatMap(tenantRepository::findById);
    }

    /**
     * Update current tenant configuration
     */
    public Mono<Tenant> updateTenant(Tenant tenant) {
        return TenantContext.getTenantId()
            .flatMap(tenantId ->
                tenantRepository.findById(tenantId)
                    .flatMap(existing -> {
                        // Preserve ID and subdomain (immutable)
                        tenant.setId(existing.getId());
                        tenant.setSubdomain(existing.getSubdomain());
                        tenant.setCreatedAt(existing.getCreatedAt());
                        tenant.setUpdatedAt(Instant.now());

                        return tenantRepository.save(tenant);
                    })
            );
    }

    /**
     * Update tenant branding
     */
    public Mono<Tenant> updateBranding(Tenant.Branding branding) {
        return TenantContext.getTenantId()
            .flatMap(tenantId ->
                tenantRepository.findById(tenantId)
                    .flatMap(tenant -> {
                        tenant.setBranding(branding);
                        tenant.setUpdatedAt(Instant.now());
                        return tenantRepository.save(tenant);
                    })
            );
    }

    /**
     * Update tenant settings
     */
    public Mono<Tenant> updateSettings(Tenant.TenantSettings settings) {
        return TenantContext.getTenantId()
            .flatMap(tenantId ->
                tenantRepository.findById(tenantId)
                    .flatMap(tenant -> {
                        tenant.setSettings(settings);
                        tenant.setUpdatedAt(Instant.now());
                        return tenantRepository.save(tenant);
                    })
            );
    }

    /**
     * Check if subdomain is available
     */
    public Mono<Boolean> isSubdomainAvailable(String subdomain) {
        return tenantRepository.existsBySubdomain(subdomain)
            .map(exists -> !exists);
    }

    /**
     * Create new tenant (admin only)
     */
    public Mono<Tenant> createTenant(Tenant tenant) {
        tenant.setCreatedAt(Instant.now());
        tenant.setUpdatedAt(Instant.now());

        // Set defaults if not provided
        if (tenant.getBranding() == null) {
            tenant.setBranding(new Tenant.Branding(null));
        }
        if (tenant.getSettings() == null) {
            tenant.setSettings(new Tenant.TenantSettings());
        }

        return tenantRepository.save(tenant);
    }
}
