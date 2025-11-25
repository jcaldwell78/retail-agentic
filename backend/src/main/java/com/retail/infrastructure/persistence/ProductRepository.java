package com.retail.infrastructure.persistence;

import com.retail.domain.product.Product;
import com.retail.security.tenant.TenantContext;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * Repository for Product entities with automatic tenant filtering.
 * Extends TenantAwareRepository to get automatic tenantId injection.
 * All queries automatically include tenantId filter from TenantContext.
 */
@Repository
public interface ProductRepository extends TenantAwareRepository<Product, String> {

    /**
     * Find product by SKU for current tenant.
     * TenantId is automatically injected from reactive context.
     */
    default Mono<Product> findBySku(String sku) {
        return TenantContext.getTenantId()
                .flatMap(tenantId -> findBySkuAndTenantId(sku, tenantId));
    }

    /**
     * Find product by SKU and tenant (internal use).
     */
    Mono<Product> findBySkuAndTenantId(String sku, String tenantId);

    /**
     * Find active products for current tenant.
     * TenantId is automatically injected from reactive context.
     */
    default Flux<Product> findActiveProducts(Pageable pageable) {
        return TenantContext.getTenantId()
                .flatMapMany(tenantId -> findActiveProductsByTenantId(tenantId, pageable));
    }

    /**
     * Find active products by tenant ID (internal use).
     */
    @Query("{ 'tenantId': ?0, 'status': 'ACTIVE' }")
    Flux<Product> findActiveProductsByTenantId(String tenantId, Pageable pageable);

    /**
     * Find products by category for current tenant.
     * TenantId is automatically injected from reactive context.
     */
    default Flux<Product> findByCategory(String category, Pageable pageable) {
        return TenantContext.getTenantId()
                .flatMapMany(tenantId -> findByTenantIdAndCategoryContaining(tenantId, category, pageable));
    }

    /**
     * Find products by category and tenant (internal use).
     */
    Flux<Product> findByTenantIdAndCategoryContaining(String tenantId, String category, Pageable pageable);

    /**
     * Find low stock products for current tenant.
     * TenantId is automatically injected from reactive context.
     */
    default Flux<Product> findLowStockProducts(int threshold) {
        return TenantContext.getTenantId()
                .flatMapMany(tenantId -> findLowStockProductsByTenantId(tenantId, threshold));
    }

    /**
     * Find low stock products by tenant ID (internal use).
     */
    @Query("{ 'tenantId': ?0, 'stock': { $lte: ?1 } }")
    Flux<Product> findLowStockProductsByTenantId(String tenantId, int threshold);

    /**
     * Count active products for current tenant.
     * TenantId is automatically injected from reactive context.
     */
    default Mono<Long> countActiveProducts() {
        return TenantContext.getTenantId()
                .flatMap(this::countActiveProductsByTenantId);
    }

    /**
     * Count active products by tenant ID (internal use).
     */
    @Query(value = "{ 'tenantId': ?0, 'status': 'ACTIVE' }", count = true)
    Mono<Long> countActiveProductsByTenantId(String tenantId);
}
