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

    /**
     * Find abandoned carts that haven't been notified yet.
     * Used for first abandonment reminder.
     */
    @Query("{ 'tenantId': ?0, 'converted': false, 'updatedAt': { $lt: ?1 }, 'abandonmentNotified': { $ne: true }, 'userId': { $ne: null } }")
    Flux<PersistedCart> findAbandonedCartsNotNotified(String tenantId, Instant updatedBefore);

    /**
     * Find abandoned carts that received first reminder but not second.
     * Used for second abandonment reminder.
     */
    @Query("{ 'tenantId': ?0, 'converted': false, 'updatedAt': { $lt: ?1 }, 'abandonmentNotified': true, 'secondReminderSent': { $ne: true }, 'userId': { $ne: null } }")
    Flux<PersistedCart> findAbandonedCartsForSecondReminder(String tenantId, Instant updatedBefore);

    /**
     * Find all abandoned carts globally (for scheduled job across all tenants).
     */
    @Query("{ 'converted': false, 'updatedAt': { $lt: ?0 }, 'abandonmentNotified': { $ne: true }, 'userId': { $ne: null } }")
    Flux<PersistedCart> findAllAbandonedCartsNotNotified(Instant updatedBefore);

    /**
     * Find all abandoned carts for second reminder globally (for scheduled job).
     */
    @Query("{ 'converted': false, 'updatedAt': { $lt: ?0 }, 'abandonmentNotified': true, 'secondReminderSent': { $ne: true }, 'userId': { $ne: null } }")
    Flux<PersistedCart> findAllAbandonedCartsForSecondReminder(Instant updatedBefore);
}
