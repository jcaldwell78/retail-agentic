package com.retail.infrastructure.persistence;

import com.retail.domain.cart.PersistedCart;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.data.mongodb.repository.ReactiveMongoRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Instant;

/**
 * MongoDB repository for persisted carts.
 * Provides durable storage for cart data with recovery capabilities.
 */
@Repository
public interface PersistedCartRepository extends ReactiveMongoRepository<PersistedCart, String> {

    /**
     * Find cart by session ID and tenant ID
     */
    Mono<PersistedCart> findBySessionIdAndTenantId(String sessionId, String tenantId);

    /**
     * Find cart by user ID and tenant ID
     */
    Mono<PersistedCart> findByUserIdAndTenantId(String userId, String tenantId);

    /**
     * Find all unconverted carts for a tenant
     */
    Flux<PersistedCart> findByTenantIdAndConvertedFalse(String tenantId);

    /**
     * Find carts updated after a certain timestamp
     * Useful for syncing or cleanup operations
     */
    Flux<PersistedCart> findByTenantIdAndUpdatedAtAfter(String tenantId, Instant updatedAfter);

    /**
     * Find abandoned carts (not updated recently and not converted)
     * Useful for cart recovery campaigns
     */
    @Query("{ 'tenantId': ?0, 'converted': false, 'updatedAt': { $lt: ?1 } }")
    Flux<PersistedCart> findAbandonedCarts(String tenantId, Instant updatedBefore);

    /**
     * Delete old converted carts for cleanup
     */
    Mono<Long> deleteByTenantIdAndConvertedTrueAndUpdatedAtBefore(String tenantId, Instant updatedBefore);

    /**
     * Count unconverted carts for a tenant
     */
    Mono<Long> countByTenantIdAndConvertedFalse(String tenantId);
}
