package com.retail.infrastructure.persistence;

import com.retail.domain.product.Product;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.data.mongodb.repository.ReactiveMongoRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * Repository for Product entities with tenant filtering.
 * All queries automatically include tenantId filter via TenantContext.
 */
@Repository
public interface ProductRepository extends ReactiveMongoRepository<Product, String> {

    /**
     * Find all products for current tenant
     * Note: tenantId is injected automatically from context
     */
    Flux<Product> findByTenantId(String tenantId, Pageable pageable);

    /**
     * Find product by ID and tenant
     */
    Mono<Product> findByIdAndTenantId(String id, String tenantId);

    /**
     * Find product by SKU and tenant
     */
    Mono<Product> findBySkuAndTenantId(String sku, String tenantId);

    /**
     * Find active products for tenant
     */
    @Query("{ 'tenantId': ?0, 'status': 'ACTIVE' }")
    Flux<Product> findActiveProducts(String tenantId, Pageable pageable);

    /**
     * Find products by category for tenant
     */
    Flux<Product> findByTenantIdAndCategoryContaining(String tenantId, String category, Pageable pageable);

    /**
     * Find low stock products for tenant
     */
    @Query("{ 'tenantId': ?0, 'stock': { $lte: ?1 } }")
    Flux<Product> findLowStockProducts(String tenantId, int threshold);

    /**
     * Count products for tenant
     */
    Mono<Long> countByTenantId(String tenantId);

    /**
     * Count active products for tenant
     */
    @Query(value = "{ 'tenantId': ?0, 'status': 'ACTIVE' }", count = true)
    Mono<Long> countActiveProducts(String tenantId);

    /**
     * Delete product by ID and tenant (ensures tenant isolation)
     */
    Mono<Void> deleteByIdAndTenantId(String id, String tenantId);
}
