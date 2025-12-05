package com.retail.infrastructure.search;

import org.springframework.data.domain.Pageable;
import org.springframework.data.elasticsearch.repository.ReactiveElasticsearchRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * Elasticsearch repository for product search operations.
 * Provides full-text search and faceted filtering.
 */
@Repository
public interface ProductSearchRepository extends ReactiveElasticsearchRepository<ProductSearchDocument, String> {

    /**
     * Find products by tenant and status
     */
    Flux<ProductSearchDocument> findByTenantIdAndStatus(String tenantId, String status, Pageable pageable);

    /**
     * Find products by tenant and category
     */
    Flux<ProductSearchDocument> findByTenantIdAndCategoryContaining(String tenantId, String category, Pageable pageable);

    /**
     * Full-text search in name and description
     * Uses multi_match query across multiple fields
     */
    Flux<ProductSearchDocument> findByTenantIdAndNameContainingOrDescriptionContaining(
            String tenantId,
            String nameQuery,
            String descriptionQuery,
            Pageable pageable
    );

    /**
     * Search products by price range
     */
    Flux<ProductSearchDocument> findByTenantIdAndPriceBetween(
            String tenantId,
            Double minPrice,
            Double maxPrice,
            Pageable pageable
    );

    /**
     * Count products by tenant
     */
    Mono<Long> countByTenantId(String tenantId);

    /**
     * Count products by tenant and status
     */
    Mono<Long> countByTenantIdAndStatus(String tenantId, String status);
}
