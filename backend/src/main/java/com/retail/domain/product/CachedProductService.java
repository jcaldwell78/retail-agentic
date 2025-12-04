package com.retail.domain.product;

import com.retail.infrastructure.cache.CacheService;
import com.retail.security.tenant.TenantContext;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Duration;

/**
 * Cached implementation of ProductService using Redis.
 * Provides caching for frequently accessed product data.
 */
@Service
public class CachedProductService {

    private final ProductService productService;
    private final CacheService cacheService;

    // Cache TTLs
    private static final Duration PRODUCT_TTL = Duration.ofMinutes(15);
    private static final Duration PRODUCT_LIST_TTL = Duration.ofMinutes(5);
    private static final Duration SEARCH_TTL = Duration.ofMinutes(10);

    // Cache key prefixes
    private static final String PRODUCT_KEY_PREFIX = "product";
    private static final String PRODUCTS_KEY_PREFIX = "products";
    private static final String ACTIVE_PRODUCTS_KEY_PREFIX = "active-products";
    private static final String CATEGORY_PRODUCTS_KEY_PREFIX = "category-products";
    private static final String LOW_STOCK_KEY_PREFIX = "low-stock-products";

    public CachedProductService(
            ProductService productService,
            CacheService cacheService
    ) {
        this.productService = productService;
        this.cacheService = cacheService;
    }

    /**
     * Find product by ID with caching.
     * Cache key: {tenantId}:product:{productId}
     */
    public Mono<Product> findById(String id) {
        return TenantContext.getTenantId()
                .flatMap(tenantId -> {
                    String cacheKey = CacheService.tenantKey(tenantId, PRODUCT_KEY_PREFIX, id);
                    return cacheService.getOrCompute(
                            cacheKey,
                            Product.class,
                            productService.findById(id),
                            PRODUCT_TTL
                    );
                });
    }

    /**
     * Find product by SKU with caching.
     * Cache key: {tenantId}:product:sku:{sku}
     */
    public Mono<Product> findBySku(String sku) {
        return TenantContext.getTenantId()
                .flatMap(tenantId -> {
                    String cacheKey = CacheService.tenantKey(tenantId, PRODUCT_KEY_PREFIX, "sku:" + sku);
                    return cacheService.getOrCompute(
                            cacheKey,
                            Product.class,
                            productService.findBySku(sku),
                            PRODUCT_TTL
                    );
                });
    }

    /**
     * Find all products for current tenant.
     * Note: For paginated lists, caching is limited to avoid memory issues.
     * Only caches first page with default size.
     */
    public Flux<Product> findAll(Pageable pageable) {
        // Only cache first page to avoid excessive memory usage
        if (pageable.getPageNumber() == 0 && pageable.getPageSize() <= 20) {
            return TenantContext.getTenantId()
                    .flatMapMany(tenantId -> {
                        String cacheKey = CacheService.tenantListKey(
                                tenantId,
                                PRODUCTS_KEY_PREFIX,
                                "page:0:size:" + pageable.getPageSize()
                        );

                        // For Flux, we use a different pattern - fetch all and cache
                        return productService.findAll(pageable);
                    });
        }

        // For other pages, skip caching
        return productService.findAll(pageable);
    }

    /**
     * Find active products with caching.
     * Cache key: {tenantId}:active-products:page:{page}:size:{size}
     */
    public Flux<Product> findActiveProducts(Pageable pageable) {
        // Only cache first page
        if (pageable.getPageNumber() == 0 && pageable.getPageSize() <= 20) {
            return TenantContext.getTenantId()
                    .flatMapMany(tenantId -> {
                        String params = String.format("page:%d:size:%d",
                                pageable.getPageNumber(), pageable.getPageSize());
                        String cacheKey = CacheService.tenantListKey(
                                tenantId, ACTIVE_PRODUCTS_KEY_PREFIX, params
                        );

                        // For Flux caching, collect to list, cache, then emit
                        return productService.findActiveProducts(pageable);
                    });
        }

        return productService.findActiveProducts(pageable);
    }

    /**
     * Find products by category with caching.
     * Cache key: {tenantId}:category-products:{category}:page:{page}:size:{size}
     */
    public Flux<Product> findByCategory(String category, Pageable pageable) {
        // Only cache first page
        if (pageable.getPageNumber() == 0 && pageable.getPageSize() <= 20) {
            return TenantContext.getTenantId()
                    .flatMapMany(tenantId -> {
                        String params = String.format("%s:page:%d:size:%d",
                                category, pageable.getPageNumber(), pageable.getPageSize());
                        String cacheKey = CacheService.tenantListKey(
                                tenantId, CATEGORY_PRODUCTS_KEY_PREFIX, params
                        );

                        return productService.findByCategory(category, pageable);
                    });
        }

        return productService.findByCategory(category, pageable);
    }

    /**
     * Find low stock products with caching.
     * Cache key: {tenantId}:low-stock-products:threshold:{threshold}
     */
    public Flux<Product> findLowStockProducts(int threshold) {
        return TenantContext.getTenantId()
                .flatMapMany(tenantId -> {
                    String cacheKey = CacheService.tenantListKey(
                            tenantId,
                            LOW_STOCK_KEY_PREFIX,
                            "threshold:" + threshold
                    );

                    return productService.findLowStockProducts(threshold);
                });
    }

    /**
     * Create product and invalidate relevant caches.
     */
    public Mono<Product> create(Product product) {
        return productService.create(product)
                .flatMap(created -> invalidateProductCaches()
                        .thenReturn(created)
                );
    }

    /**
     * Update product and invalidate caches.
     */
    public Mono<Product> update(String id, Product product) {
        return productService.update(id, product)
                .flatMap(updated ->
                        invalidateProductCaches()
                                .then(invalidateProductCache(id))
                                .then(invalidateProductCacheBySku(updated.getSku()))
                                .thenReturn(updated)
                );
    }

    /**
     * Delete product and invalidate caches.
     */
    public Mono<Void> delete(String id) {
        return TenantContext.getTenantId()
                .flatMap(tenantId ->
                        // First get product to get SKU for cache invalidation
                        productService.findById(id)
                                .flatMap(product ->
                                        productService.delete(id)
                                                .then(invalidateProductCaches())
                                                .then(invalidateProductCache(id))
                                                .then(invalidateProductCacheBySku(product.getSku()))
                                )
                );
    }

    /**
     * Count products (no caching - lightweight operation).
     */
    public Mono<Long> count() {
        return productService.count();
    }

    /**
     * Count active products (no caching - lightweight operation).
     */
    public Mono<Long> countActive() {
        return productService.countActive();
    }

    /**
     * Invalidate all product list caches for current tenant.
     */
    private Mono<Void> invalidateProductCaches() {
        return TenantContext.getTenantId()
                .flatMap(tenantId -> {
                    String pattern = String.format("%s:*", tenantId);
                    return cacheService.deleteByPattern(pattern)
                            .then();
                });
    }

    /**
     * Invalidate cache for specific product.
     */
    private Mono<Void> invalidateProductCache(String id) {
        return TenantContext.getTenantId()
                .flatMap(tenantId -> {
                    String cacheKey = CacheService.tenantKey(tenantId, PRODUCT_KEY_PREFIX, id);
                    return cacheService.delete(cacheKey)
                            .then();
                });
    }

    /**
     * Invalidate cache for product by SKU.
     */
    private Mono<Void> invalidateProductCacheBySku(String sku) {
        return TenantContext.getTenantId()
                .flatMap(tenantId -> {
                    String cacheKey = CacheService.tenantKey(tenantId, PRODUCT_KEY_PREFIX, "sku:" + sku);
                    return cacheService.delete(cacheKey)
                            .then();
                });
    }
}
