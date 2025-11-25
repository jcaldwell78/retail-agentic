package com.retail.domain.product;

import com.retail.infrastructure.search.ProductSearchDocument;
import com.retail.infrastructure.search.ProductSearchRepository;
import com.retail.security.tenant.TenantContext;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * Service for product search operations using Elasticsearch.
 * Provides full-text search, filtering, and autocomplete.
 */
@Service
public class ProductSearchService {

    private final ProductSearchRepository searchRepository;

    public ProductSearchService(ProductSearchRepository searchRepository) {
        this.searchRepository = searchRepository;
    }

    /**
     * Full-text search for products.
     * Searches across name and description fields.
     *
     * @param query Search query string
     * @param page Page number (0-indexed)
     * @param size Page size
     * @return Flux of matching products
     */
    public Flux<ProductSearchDocument> searchProducts(String query, int page, int size) {
        return TenantContext.getTenantId()
                .flatMapMany(tenantId -> {
                    Pageable pageable = PageRequest.of(page, size, Sort.by("rankingScore").descending());

                    if (query == null || query.trim().isEmpty()) {
                        // No query - return all active products
                        return searchRepository.findByTenantIdAndStatus(tenantId, "ACTIVE", pageable);
                    }

                    // Full-text search
                    return searchRepository.findByTenantIdAndNameContainingOrDescriptionContaining(
                            tenantId, query, query, pageable
                    );
                });
    }

    /**
     * Search products by category.
     *
     * @param category Category name
     * @param page Page number
     * @param size Page size
     * @return Flux of products in category
     */
    public Flux<ProductSearchDocument> searchByCategory(String category, int page, int size) {
        return TenantContext.getTenantId()
                .flatMapMany(tenantId -> {
                    Pageable pageable = PageRequest.of(page, size, Sort.by("rankingScore").descending());
                    return searchRepository.findByTenantIdAndCategoryContaining(tenantId, category, pageable);
                });
    }

    /**
     * Search products by price range.
     *
     * @param minPrice Minimum price
     * @param maxPrice Maximum price
     * @param page Page number
     * @param size Page size
     * @return Flux of products in price range
     */
    public Flux<ProductSearchDocument> searchByPriceRange(Double minPrice, Double maxPrice, int page, int size) {
        return TenantContext.getTenantId()
                .flatMapMany(tenantId -> {
                    Pageable pageable = PageRequest.of(page, size, Sort.by("price").ascending());
                    return searchRepository.findByTenantIdAndPriceBetween(tenantId, minPrice, maxPrice, pageable);
                });
    }

    /**
     * Get product suggestions for autocomplete.
     * Returns top 10 matching products by name.
     *
     * @param query Partial search query
     * @return Flux of product suggestions
     */
    public Flux<ProductSearchDocument> getSuggestions(String query) {
        if (query == null || query.trim().length() < 2) {
            return Flux.empty(); // Require at least 2 characters
        }

        return TenantContext.getTenantId()
                .flatMapMany(tenantId -> {
                    Pageable pageable = PageRequest.of(0, 10, Sort.by("rankingScore").descending());
                    return searchRepository.findByTenantIdAndNameContainingOrDescriptionContaining(
                            tenantId, query, query, pageable
                    );
                });
    }

    /**
     * Advanced search with multiple filters.
     *
     * @param request Search request with filters
     * @return Flux of matching products
     */
    public Flux<ProductSearchDocument> advancedSearch(ProductSearchRequest request) {
        return TenantContext.getTenantId()
                .flatMapMany(tenantId -> {
                    // Start with base query
                    Flux<ProductSearchDocument> results;

                    Pageable pageable = PageRequest.of(
                            request.getPage(),
                            request.getSize(),
                            getSortOrder(request.getSortBy(), request.getSortDirection())
                    );

                    // Apply query if present
                    if (request.getQuery() != null && !request.getQuery().trim().isEmpty()) {
                        results = searchRepository.findByTenantIdAndNameContainingOrDescriptionContaining(
                                tenantId, request.getQuery(), request.getQuery(), pageable
                        );
                    } else {
                        results = searchRepository.findByTenantIdAndStatus(tenantId, "ACTIVE", pageable);
                    }

                    // Apply category filter
                    if (request.getCategory() != null && !request.getCategory().isEmpty()) {
                        String category = request.getCategory();
                        results = results.filter(product ->
                                product.getCategory() != null &&
                                product.getCategory().stream().anyMatch(cat -> cat.equalsIgnoreCase(category))
                        );
                    }

                    // Apply price filter
                    if (request.getMinPrice() != null || request.getMaxPrice() != null) {
                        double min = request.getMinPrice() != null ? request.getMinPrice() : 0.0;
                        double max = request.getMaxPrice() != null ? request.getMaxPrice() : Double.MAX_VALUE;

                        results = results.filter(product ->
                                product.getPrice() != null &&
                                product.getPrice().doubleValue() >= min &&
                                product.getPrice().doubleValue() <= max
                        );
                    }

                    // Apply in-stock filter
                    if (request.isInStockOnly()) {
                        results = results.filter(product ->
                                product.getStock() != null && product.getStock() > 0
                        );
                    }

                    return results;
                });
    }

    /**
     * Count total search results.
     *
     * @param query Search query
     * @return Mono with count
     */
    public Mono<Long> countSearchResults(String query) {
        return TenantContext.getTenantId()
                .flatMap(tenantId -> {
                    if (query == null || query.trim().isEmpty()) {
                        return searchRepository.countByTenantIdAndStatus(tenantId, "ACTIVE");
                    }
                    // For now, return total count (can be optimized with count query)
                    return searchRepository.countByTenantId(tenantId);
                });
    }

    /**
     * Get sort order from request parameters.
     */
    private Sort getSortOrder(String sortBy, String direction) {
        Sort.Direction dir = "desc".equalsIgnoreCase(direction)
                ? Sort.Direction.DESC
                : Sort.Direction.ASC;

        String field = switch (sortBy != null ? sortBy.toLowerCase() : "relevance") {
            case "price" -> "price";
            case "name" -> "name.keyword";
            case "newest" -> "createdAt";
            default -> "rankingScore";
        };

        return Sort.by(dir, field);
    }

    /**
     * Product search request DTO
     */
    public static class ProductSearchRequest {
        private String query;
        private String category;
        private Double minPrice;
        private Double maxPrice;
        private boolean inStockOnly;
        private int page = 0;
        private int size = 20;
        private String sortBy = "relevance";
        private String sortDirection = "desc";

        // Getters and setters
        public String getQuery() { return query; }
        public void setQuery(String query) { this.query = query; }

        public String getCategory() { return category; }
        public void setCategory(String category) { this.category = category; }

        public Double getMinPrice() { return minPrice; }
        public void setMinPrice(Double minPrice) { this.minPrice = minPrice; }

        public Double getMaxPrice() { return maxPrice; }
        public void setMaxPrice(Double maxPrice) { this.maxPrice = maxPrice; }

        public boolean isInStockOnly() { return inStockOnly; }
        public void setInStockOnly(boolean inStockOnly) { this.inStockOnly = inStockOnly; }

        public int getPage() { return page; }
        public void setPage(int page) { this.page = page; }

        public int getSize() { return size; }
        public void setSize(int size) { this.size = size; }

        public String getSortBy() { return sortBy; }
        public void setSortBy(String sortBy) { this.sortBy = sortBy; }

        public String getSortDirection() { return sortDirection; }
        public void setSortDirection(String sortDirection) { this.sortDirection = sortDirection; }
    }
}
