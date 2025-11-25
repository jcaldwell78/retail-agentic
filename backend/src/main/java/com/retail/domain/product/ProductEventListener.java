package com.retail.domain.product;

import com.retail.infrastructure.search.ProductIndexingService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.data.mongodb.core.mapping.event.*;
import org.springframework.stereotype.Component;

/**
 * MongoDB event listener for automatic product indexing.
 * Listens to MongoDB lifecycle events and triggers Elasticsearch indexing.
 */
@Component
public class ProductEventListener extends AbstractMongoEventListener<Product> {

    private static final Logger logger = LoggerFactory.getLogger(ProductEventListener.class);

    private final ProductIndexingService indexingService;

    public ProductEventListener(ProductIndexingService indexingService) {
        this.indexingService = indexingService;
    }

    /**
     * After a product is saved (created or updated), index it to Elasticsearch.
     */
    @Override
    public void onAfterSave(AfterSaveEvent<Product> event) {
        Product product = event.getSource();
        logger.debug("Product saved event: {}", product.getId());

        // Index asynchronously (don't block MongoDB operation)
        indexingService.indexProduct(product)
                .subscribe(
                        doc -> logger.trace("Product indexed: {}", product.getId()),
                        error -> logger.error("Failed to index product: {}", product.getId(), error)
                );
    }

    /**
     * After a product is deleted, remove it from Elasticsearch index.
     */
    @Override
    public void onAfterDelete(AfterDeleteEvent<Product> event) {
        // Get product ID from delete event
        Object id = event.getSource().get("_id");
        if (id != null) {
            String productId = id.toString();
            logger.debug("Product deleted event: {}", productId);

            // Remove from index asynchronously
            indexingService.removeProductFromIndex(productId)
                    .subscribe(
                            () -> logger.trace("Product removed from index: {}", productId),
                            error -> logger.error("Failed to remove product from index: {}", productId, error)
                    );
        }
    }
}
