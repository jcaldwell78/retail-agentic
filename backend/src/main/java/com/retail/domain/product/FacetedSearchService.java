package com.retail.domain.product;

import com.retail.infrastructure.search.ProductSearchDocument;
import com.retail.infrastructure.search.ProductSearchRepository;
import com.retail.security.tenant.TenantContext;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Faceted search service for products.
 *
 * Provides facet counts for different filter dimensions:
 * - Categories with product counts
 * - Price ranges with product counts
 * - Stock availability counts
 * - Attribute values with counts
 *
 * Used to build dynamic filter UIs with counts.
 */
@Service
public class FacetedSearchService {

    private final ProductSearchRepository searchRepository;

    public FacetedSearchService(ProductSearchRepository searchRepository) {
        this.searchRepository = searchRepository;
    }

    /**
     * Get all facets for a search query.
     * Returns counts for categories, price ranges, and stock availability.
     *
     * @param query Optional search query
     * @return Mono<SearchFacets> with all facet counts
     */
    public Mono<SearchFacets> getSearchFacets(String query) {
        return TenantContext.getTenantId()
            .flatMap(tenantId -> {
                // Get all products matching the query
                Pageable pageable = PageRequest.of(0, 10000); // Get all for faceting

                Mono<List<ProductSearchDocument>> products;

                if (query == null || query.trim().isEmpty()) {
                    products = searchRepository.findByTenantIdAndStatus(tenantId, "ACTIVE", pageable)
                        .collectList();
                } else {
                    products = searchRepository.findByTenantIdAndNameContainingOrDescriptionContaining(
                            tenantId, query, query, pageable
                    ).collectList();
                }

                return products.map(this::buildFacets);
            });
    }

    /**
     * Build facets from product list
     */
    private SearchFacets buildFacets(List<ProductSearchDocument> products) {
        return new SearchFacets(
            getCategoryFacets(products),
            getPriceRangeFacets(products),
            getStockFacets(products),
            products.size()
        );
    }

    /**
     * Get category facets with counts
     */
    private List<FacetValue> getCategoryFacets(List<ProductSearchDocument> products) {
        Map<String, Long> categoryCounts = products.stream()
            .filter(p -> p.getCategory() != null && !p.getCategory().isEmpty())
            .flatMap(p -> p.getCategory().stream())
            .collect(Collectors.groupingBy(
                category -> category,
                Collectors.counting()
            ));

        return categoryCounts.entrySet().stream()
            .map(entry -> new FacetValue(entry.getKey(), entry.getValue()))
            .sorted(Comparator.comparing(FacetValue::count).reversed())
            .collect(Collectors.toList());
    }

    /**
     * Get price range facets with counts
     * Breaks into predefined price ranges
     */
    private List<PriceRangeFacet> getPriceRangeFacets(List<ProductSearchDocument> products) {
        // Define price ranges
        List<PriceRange> ranges = List.of(
            new PriceRange("Under $25", 0.0, 25.0),
            new PriceRange("$25 - $50", 25.0, 50.0),
            new PriceRange("$50 - $100", 50.0, 100.0),
            new PriceRange("$100 - $200", 100.0, 200.0),
            new PriceRange("$200+", 200.0, Double.MAX_VALUE)
        );

        return ranges.stream()
            .map(range -> {
                long count = products.stream()
                    .filter(p -> p.getPrice() != null)
                    .filter(p -> {
                        double price = p.getPrice().doubleValue();
                        return price >= range.min() && price < range.max();
                    })
                    .count();

                return new PriceRangeFacet(range.label(), range.min(), range.max(), count);
            })
            .filter(facet -> facet.count() > 0) // Only include ranges with products
            .collect(Collectors.toList());
    }

    /**
     * Get stock availability facets
     */
    private StockFacets getStockFacets(List<ProductSearchDocument> products) {
        long inStock = products.stream()
            .filter(p -> p.getStock() != null && p.getStock() > 0)
            .count();

        long outOfStock = products.stream()
            .filter(p -> p.getStock() == null || p.getStock() == 0)
            .count();

        long lowStock = products.stream()
            .filter(p -> p.getStock() != null && p.getStock() > 0 && p.getStock() <= 10)
            .count();

        return new StockFacets(inStock, outOfStock, lowStock);
    }

    /**
     * Get faceted search results with filters applied.
     * Returns both products and updated facet counts.
     *
     * @param request Search request with filters
     * @return Mono<FacetedSearchResult> Results + facets
     */
    public Mono<FacetedSearchResult> facetedSearch(FacetedSearchRequest request) {
        return TenantContext.getTenantId()
            .flatMap(tenantId -> {
                Pageable pageable = PageRequest.of(request.page(), request.size());

                // Build filtered query
                Mono<List<ProductSearchDocument>> filteredProducts =
                    getFilteredProducts(tenantId, request, pageable);

                // Get facets for the entire result set (not just current page)
                Mono<SearchFacets> facets = getSearchFacets(request.query());

                return Mono.zip(filteredProducts, facets)
                    .map(tuple -> new FacetedSearchResult(
                        tuple.getT1(),
                        tuple.getT2(),
                        tuple.getT1().size()
                    ));
            });
    }

    /**
     * Get filtered products based on request
     */
    private Mono<List<ProductSearchDocument>> getFilteredProducts(
            String tenantId,
            FacetedSearchRequest request,
            Pageable pageable) {

        Mono<List<ProductSearchDocument>> results;

        // Start with query or all products
        if (request.query() != null && !request.query().trim().isEmpty()) {
            results = searchRepository.findByTenantIdAndNameContainingOrDescriptionContaining(
                    tenantId, request.query(), request.query(), pageable
            ).collectList();
        } else {
            results = searchRepository.findByTenantIdAndStatus(tenantId, "ACTIVE", pageable)
                .collectList();
        }

        // Apply filters in memory (could be optimized with Elasticsearch queries)
        return results.map(products -> products.stream()
            .filter(p -> matchesFilters(p, request))
            .collect(Collectors.toList())
        );
    }

    /**
     * Check if product matches all filters
     */
    private boolean matchesFilters(ProductSearchDocument product, FacetedSearchRequest request) {
        // Category filter
        if (request.categories() != null && !request.categories().isEmpty()) {
            if (product.getCategory() == null ||
                product.getCategory().stream().noneMatch(request.categories()::contains)) {
                return false;
            }
        }

        // Price range filter
        if (request.minPrice() != null || request.maxPrice() != null) {
            if (product.getPrice() == null) {
                return false;
            }

            double price = product.getPrice().doubleValue();
            double min = request.minPrice() != null ? request.minPrice() : 0.0;
            double max = request.maxPrice() != null ? request.maxPrice() : Double.MAX_VALUE;

            if (price < min || price > max) {
                return false;
            }
        }

        // Stock filter
        if (request.inStockOnly()) {
            if (product.getStock() == null || product.getStock() <= 0) {
                return false;
            }
        }

        return true;
    }

    /**
     * Search facets with all dimension counts
     */
    public record SearchFacets(
        List<FacetValue> categories,
        List<PriceRangeFacet> priceRanges,
        StockFacets stock,
        int totalProducts
    ) {}

    /**
     * Facet value with label and count
     */
    public record FacetValue(
        String value,
        long count
    ) {}

    /**
     * Price range facet
     */
    public record PriceRangeFacet(
        String label,
        double minPrice,
        double maxPrice,
        long count
    ) {}

    /**
     * Stock availability facets
     */
    public record StockFacets(
        long inStock,
        long outOfStock,
        long lowStock
    ) {}

    /**
     * Price range definition
     */
    private record PriceRange(
        String label,
        double min,
        double max
    ) {}

    /**
     * Faceted search request
     */
    public record FacetedSearchRequest(
        String query,
        List<String> categories,
        Double minPrice,
        Double maxPrice,
        boolean inStockOnly,
        int page,
        int size
    ) {}

    /**
     * Faceted search result with products and facets
     */
    public record FacetedSearchResult(
        List<ProductSearchDocument> products,
        SearchFacets facets,
        int totalResults
    ) {}
}
