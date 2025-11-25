package com.retail.infrastructure.persistence;

import com.retail.domain.product.Category;
import com.retail.security.tenant.TenantContext;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * Repository for Category entities with automatic tenant filtering.
 * Supports hierarchical category queries.
 */
@Repository
public interface CategoryRepository extends TenantAwareRepository<Category, String> {

    /**
     * Find category by slug for current tenant.
     */
    default Mono<Category> findBySlug(String slug) {
        return TenantContext.getTenantId()
                .flatMap(tenantId -> findBySlugAndTenantId(slug, tenantId));
    }

    /**
     * Find category by slug and tenant (internal use).
     */
    Mono<Category> findBySlugAndTenantId(String slug, String tenantId);

    /**
     * Find all top-level categories (no parent) for current tenant.
     */
    default Flux<Category> findTopLevelCategories() {
        return TenantContext.getTenantId()
                .flatMapMany(tenantId -> findByTenantIdAndParentIdIsNull(tenantId, Sort.by("displayOrder")));
    }

    /**
     * Find top-level categories by tenant (internal use).
     */
    Flux<Category> findByTenantIdAndParentIdIsNull(String tenantId, Sort sort);

    /**
     * Find child categories by parent ID for current tenant.
     */
    default Flux<Category> findByParentId(String parentId) {
        return TenantContext.getTenantId()
                .flatMapMany(tenantId -> findByTenantIdAndParentId(tenantId, parentId, Sort.by("displayOrder")));
    }

    /**
     * Find child categories by parent and tenant (internal use).
     */
    Flux<Category> findByTenantIdAndParentId(String tenantId, String parentId, Sort sort);

    /**
     * Find visible categories for current tenant.
     */
    default Flux<Category> findVisibleCategories() {
        return TenantContext.getTenantId()
                .flatMapMany(tenantId -> findByTenantIdAndVisibleTrue(tenantId, Sort.by("displayOrder")));
    }

    /**
     * Find visible categories by tenant (internal use).
     */
    Flux<Category> findByTenantIdAndVisibleTrue(String tenantId, Sort sort);

    /**
     * Check if category exists by slug for current tenant.
     */
    default Mono<Boolean> existsBySlug(String slug) {
        return TenantContext.getTenantId()
                .flatMap(tenantId -> existsBySlugAndTenantId(slug, tenantId));
    }

    /**
     * Check if category exists by slug and tenant (internal use).
     */
    Mono<Boolean> existsBySlugAndTenantId(String slug, String tenantId);
}
