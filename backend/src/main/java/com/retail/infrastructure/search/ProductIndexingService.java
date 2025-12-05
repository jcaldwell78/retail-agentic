package com.retail.infrastructure.search;

import com.retail.domain.product.Product.ProductStatus;
import com.retail.domain.product.Product;
import com.retail.infrastructure.persistence.ProductRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.stream.Collectors;

/**
 * Service for indexing products from MongoDB to Elasticsearch.
 * Handles bulk indexing, incremental updates, and re-indexing.
 */
@Service
public class ProductIndexingService {

    private static final Logger logger = LoggerFactory.getLogger(ProductIndexingService.class);
    private static final int BATCH_SIZE = 100;

    private final ProductRepository productRepository;
    private final ProductSearchRepository searchRepository;

    public ProductIndexingService(ProductRepository productRepository,
                                    ProductSearchRepository searchRepository) {
        this.productRepository = productRepository;
        this.searchRepository = searchRepository;
    }

    /**
     * Index a single product to Elasticsearch.
     * Called when a product is created or updated.
     *
     * @param product The product to index
     * @return Mono<ProductSearchDocument> The indexed document
     */
    public Mono<ProductSearchDocument> indexProduct(Product product) {
        logger.debug("Indexing product: {} ({})", product.getName(), product.getId());

        ProductSearchDocument document = convertToSearchDocument(product);

        return searchRepository.save(document)
                .doOnSuccess(doc -> logger.info("Successfully indexed product: {}", product.getId()))
                .doOnError(error -> logger.error("Failed to index product: {}", product.getId(), error));
    }

    /**
     * Remove product from Elasticsearch index.
     * Called when a product is deleted.
     *
     * @param productId The product ID to remove
     * @return Mono<Void>
     */
    public Mono<Void> removeProductFromIndex(String productId) {
        logger.debug("Removing product from index: {}", productId);

        return searchRepository.deleteById(productId)
                .doOnSuccess(v -> logger.info("Successfully removed product from index: {}", productId))
                .doOnError(error -> logger.error("Failed to remove product from index: {}", productId, error));
    }

    /**
     * Bulk index all products for a tenant.
     * Useful for initial indexing or re-indexing.
     *
     * @param tenantId The tenant ID
     * @return Mono<Long> Number of products indexed
     */
    public Mono<Long> bulkIndexTenantProducts(String tenantId) {
        logger.info("Starting bulk indexing for tenant: {}", tenantId);

        return productRepository.findAllByTenant(PageRequest.of(0, BATCH_SIZE))
                .buffer(BATCH_SIZE)
                .flatMap(products -> {
                    // Convert to search documents
                    var documents = products.stream()
                            .map(this::convertToSearchDocument)
                            .collect(Collectors.toList());

                    // Bulk save to Elasticsearch
                    return searchRepository.saveAll(documents)
                            .collectList()
                            .doOnSuccess(saved -> logger.debug("Indexed batch of {} products", saved.size()));
                })
                .count()
                .doOnSuccess(count -> logger.info("Completed bulk indexing for tenant {}: {} products", tenantId, count))
                .doOnError(error -> logger.error("Failed bulk indexing for tenant: {}", tenantId, error));
    }

    /**
     * Re-index all products in the system.
     * WARNING: This can be resource-intensive for large catalogs.
     *
     * @return Mono<Long> Total number of products indexed
     */
    public Mono<Long> reindexAllProducts() {
        logger.warn("Starting full re-index of all products");

        return productRepository.findAll()
                .buffer(BATCH_SIZE)
                .flatMap(products -> {
                    var documents = products.stream()
                            .map(this::convertToSearchDocument)
                            .collect(Collectors.toList());

                    return searchRepository.saveAll(documents)
                            .collectList();
                })
                .count()
                .doOnSuccess(count -> logger.info("Completed full re-index: {} products", count))
                .doOnError(error -> logger.error("Failed full re-index", error));
    }

    /**
     * Convert Product entity to ProductSearchDocument.
     *
     * @param product The product entity
     * @return ProductSearchDocument for Elasticsearch
     */
    private ProductSearchDocument convertToSearchDocument(Product product) {
        ProductSearchDocument document = new ProductSearchDocument();

        document.setId(product.getId());
        document.setTenantId(product.getTenantId());
        document.setName(product.getName());
        document.setSku(product.getSku());
        document.setDescription(product.getDescription());
        document.setPrice(product.getPrice());
        document.setCurrency(product.getCurrency());
        document.setCategory(product.getCategory());
        document.setAttributes(product.getAttributes());
        document.setStock(product.getStock());
        document.setStatus(product.getStatus().toString());

        // Extract image URLs from ProductImage list
        if (product.getImages() != null && !product.getImages().isEmpty()) {
            var imageUrls = product.getImages().stream()
                    .map(Product.ProductImage::url)
                    .collect(Collectors.toList());
            document.setImageUrls(imageUrls);
        }

        // Set timestamps
        document.setCreatedAt(product.getCreatedAt());
        document.setUpdatedAt(product.getUpdatedAt());

        // Calculate ranking score (can be customized based on business logic)
        // For now, use a simple formula: newer products + higher stock = higher score
        double rankingScore = calculateRankingScore(product);
        document.setRankingScore(rankingScore);

        return document;
    }

    /**
     * Calculate ranking score for search relevance.
     * Higher score = higher ranking in search results.
     *
     * @param product The product
     * @return Ranking score (0-100)
     */
    private double calculateRankingScore(Product product) {
        double score = 50.0; // Base score

        // Boost for products in stock
        if (product.getStock() != null && product.getStock() > 0) {
            score += 20.0;
        }

        // Boost for active products
        if (product.getStatus() == ProductStatus.ACTIVE) {
            score += 10.0;
        }

        // Boost for newer products (within last 30 days)
        if (product.getCreatedAt() != null) {
            long daysOld = java.time.Duration.between(
                    product.getCreatedAt(),
                    java.time.Instant.now()
            ).toDays();

            if (daysOld < 30) {
                score += (30 - daysOld) / 3.0; // Up to 10 points for new products
            }
        }

        return Math.min(score, 100.0); // Cap at 100
    }
}
