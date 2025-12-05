package com.retail.infrastructure.persistence;

import com.retail.domain.product.ProductAttributeDefinition;
import com.retail.security.tenant.TenantContext;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * Repository for ProductAttributeDefinition entities with automatic tenant filtering.
 */
@Repository
public interface ProductAttributeDefinitionRepository extends TenantAwareRepository<ProductAttributeDefinition, String> {

    /**
     * Find attribute definition by name for current tenant.
     */
    default Mono<ProductAttributeDefinition> findByName(String name) {
        return TenantContext.getTenantId()
                .flatMap(tenantId -> findByNameAndTenantId(name, tenantId));
    }

    /**
     * Find attribute definition by name and tenant (internal use).
     */
    Mono<ProductAttributeDefinition> findByNameAndTenantId(String name, String tenantId);

    /**
     * Find all searchable attribute definitions for current tenant.
     */
    default Flux<ProductAttributeDefinition> findSearchableAttributes() {
        return TenantContext.getTenantId()
                .flatMapMany(tenantId -> findByTenantIdAndSearchableTrue(tenantId, Sort.by("displayOrder")));
    }

    /**
     * Find searchable attributes by tenant (internal use).
     */
    Flux<ProductAttributeDefinition> findByTenantIdAndSearchableTrue(String tenantId, Sort sort);

    /**
     * Find all filterable attribute definitions for current tenant.
     */
    default Flux<ProductAttributeDefinition> findFilterableAttributes() {
        return TenantContext.getTenantId()
                .flatMapMany(tenantId -> findByTenantIdAndFilterableTrue(tenantId, Sort.by("displayOrder")));
    }

    /**
     * Find filterable attributes by tenant (internal use).
     */
    Flux<ProductAttributeDefinition> findByTenantIdAndFilterableTrue(String tenantId, Sort sort);

    /**
     * Find all required attribute definitions for current tenant.
     */
    default Flux<ProductAttributeDefinition> findRequiredAttributes() {
        return TenantContext.getTenantId()
                .flatMapMany(tenantId -> findByTenantIdAndRequiredTrue(tenantId, Sort.by("displayOrder")));
    }

    /**
     * Find required attributes by tenant (internal use).
     */
    Flux<ProductAttributeDefinition> findByTenantIdAndRequiredTrue(String tenantId, Sort sort);

    /**
     * Check if attribute definition exists by name for current tenant.
     */
    default Mono<Boolean> existsByName(String name) {
        return TenantContext.getTenantId()
                .flatMap(tenantId -> existsByNameAndTenantId(name, tenantId));
    }

    /**
     * Check if attribute exists by name and tenant (internal use).
     */
    Mono<Boolean> existsByNameAndTenantId(String name, String tenantId);
}
