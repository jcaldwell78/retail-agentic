package com.retail.domain.product;

import com.retail.infrastructure.persistence.ProductRepository;
import com.retail.security.tenant.TenantContext;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Instant;

/**
 * Service for Product operations with automatic tenant isolation.
 * All operations automatically filter by current tenant from context.
 */
@Service
public class ProductService {

    private final ProductRepository productRepository;

    public ProductService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    /**
     * Find all products for current tenant
     */
    public Flux<Product> findAll(Pageable pageable) {
        return TenantContext.getTenantId()
            .flatMapMany(tenantId -> productRepository.findByTenantId(tenantId, pageable));
    }

    /**
     * Find product by ID for current tenant
     */
    public Mono<Product> findById(String id) {
        return TenantContext.getTenantId()
            .flatMap(tenantId -> productRepository.findByIdAndTenantId(id, tenantId));
    }

    /**
     * Find product by SKU for current tenant
     */
    public Mono<Product> findBySku(String sku) {
        return TenantContext.getTenantId()
            .flatMap(tenantId -> productRepository.findBySkuAndTenantId(sku, tenantId));
    }

    /**
     * Find active products for current tenant
     */
    public Flux<Product> findActiveProducts(Pageable pageable) {
        return productRepository.findActiveProducts(pageable);
    }

    /**
     * Find products by category for current tenant
     */
    public Flux<Product> findByCategory(String category, Pageable pageable) {
        return TenantContext.getTenantId()
            .flatMapMany(tenantId ->
                productRepository.findByTenantIdAndCategoryContaining(tenantId, category, pageable)
            );
    }

    /**
     * Find low stock products for current tenant
     */
    public Flux<Product> findLowStockProducts(int threshold) {
        return productRepository.findLowStockProducts(threshold);
    }

    /**
     * Create product for current tenant
     */
    public Mono<Product> create(Product product) {
        return TenantContext.getTenantId()
            .flatMap(tenantId -> {
                // Auto-populate tenant ID
                product.setTenantId(tenantId);

                // Set default status if not provided
                if (product.getStatus() == null) {
                    product.setStatus(Product.ProductStatus.ACTIVE);
                }

                product.setCreatedAt(Instant.now());
                product.setUpdatedAt(Instant.now());

                return productRepository.save(product);
            });
    }

    /**
     * Update product for current tenant
     */
    public Mono<Product> update(String id, Product product) {
        return TenantContext.getTenantId()
            .flatMap(tenantId ->
                productRepository.findByIdAndTenantId(id, tenantId)
                    .flatMap(existing -> {
                        // Preserve tenant ID and created date
                        product.setId(existing.getId());
                        product.setTenantId(tenantId);
                        product.setCreatedAt(existing.getCreatedAt());
                        product.setUpdatedAt(Instant.now());

                        return productRepository.save(product);
                    })
            );
    }

    /**
     * Delete product for current tenant
     */
    public Mono<Void> delete(String id) {
        return TenantContext.getTenantId()
            .flatMap(tenantId -> productRepository.deleteByIdAndTenantId(id, tenantId));
    }

    /**
     * Count products for current tenant
     */
    public Mono<Long> count() {
        return TenantContext.getTenantId()
            .flatMap(productRepository::countByTenantId);
    }

    /**
     * Count active products for current tenant
     */
    public Mono<Long> countActive() {
        return productRepository.countActiveProducts();
    }
}
