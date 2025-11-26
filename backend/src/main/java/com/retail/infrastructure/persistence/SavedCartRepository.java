package com.retail.infrastructure.persistence;

import com.retail.domain.cart.SavedCart;
import org.springframework.data.mongodb.repository.ReactiveMongoRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Mono;

/**
 * Repository for saved cart items.
 */
@Repository
public interface SavedCartRepository extends ReactiveMongoRepository<SavedCart, String> {

    /**
     * Find saved cart by user ID and tenant ID.
     */
    Mono<SavedCart> findByTenantIdAndUserId(String tenantId, String userId);

    /**
     * Find saved cart by session ID and tenant ID.
     */
    Mono<SavedCart> findByTenantIdAndSessionId(String tenantId, String sessionId);

    /**
     * Delete saved cart by user ID and tenant ID.
     */
    Mono<Void> deleteByTenantIdAndUserId(String tenantId, String userId);
}
