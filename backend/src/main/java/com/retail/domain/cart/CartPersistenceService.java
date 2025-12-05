package com.retail.domain.cart;

import com.retail.infrastructure.persistence.CartRepository;
import com.retail.infrastructure.persistence.PersistedCartRepository;
import com.retail.security.tenant.TenantContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.time.Instant;

/**
 * Service for persisting carts to MongoDB for durability.
 *
 * This service provides a two-tier cart storage strategy:
 * - **Redis**: Fast, ephemeral storage with 7-day TTL (primary)
 * - **MongoDB**: Durable, long-term storage for recovery (backup)
 *
 * Key Features:
 * - Automatic sync from Redis to MongoDB on cart updates
 * - Cart recovery when Redis cache expires
 * - Abandoned cart tracking for marketing campaigns
 * - Guest cart association when user logs in
 * - Historical cart data for analytics
 */
@Service
public class CartPersistenceService {

    private static final Logger logger = LoggerFactory.getLogger(CartPersistenceService.class);
    private static final Duration ABANDONED_CART_THRESHOLD = Duration.ofHours(24);
    private static final Duration CLEANUP_THRESHOLD = Duration.ofDays(90);

    private final CartRepository cartRepository;
    private final PersistedCartRepository persistedCartRepository;

    public CartPersistenceService(
            CartRepository cartRepository,
            PersistedCartRepository persistedCartRepository) {
        this.cartRepository = cartRepository;
        this.persistedCartRepository = persistedCartRepository;
    }

    /**
     * Save cart to both Redis and MongoDB.
     * Call this after any cart modification to ensure durability.
     *
     * @param cart Cart to persist
     * @return Mono<Cart> Saved cart
     */
    public Mono<Cart> persistCart(Cart cart) {
        return cartRepository.save(cart)
            .flatMap(savedCart -> {
                // Async sync to MongoDB (don't block on it)
                syncToMongoDB(savedCart)
                    .doOnError(error -> logger.error(
                        "Failed to sync cart {} to MongoDB: {}",
                        savedCart.getId(), error.getMessage()
                    ))
                    .subscribe();

                return Mono.just(savedCart);
            });
    }

    /**
     * Sync cart from Redis to MongoDB.
     * Creates or updates the persisted cart document.
     *
     * @param cart Cart to sync
     * @return Mono<PersistedCart> Synced document
     */
    public Mono<PersistedCart> syncToMongoDB(Cart cart) {
        return persistedCartRepository.findById(cart.getId())
            .flatMap(existing -> {
                // Update existing persisted cart
                existing.updateFromCart(cart);
                return persistedCartRepository.save(existing);
            })
            .switchIfEmpty(
                // Create new persisted cart
                Mono.defer(() -> {
                    PersistedCart persistedCart = new PersistedCart(cart);
                    return persistedCartRepository.save(persistedCart);
                })
            )
            .doOnSuccess(persisted -> logger.debug(
                "Synced cart {} to MongoDB", cart.getId()
            ));
    }

    /**
     * Recover cart from MongoDB when Redis cache expires.
     * Restores cart to Redis and returns it.
     *
     * @param sessionId Session ID
     * @param tenantId Tenant ID
     * @return Mono<Cart> Recovered cart, or empty if not found
     */
    public Mono<Cart> recoverCartFromMongoDB(String sessionId, String tenantId) {
        return persistedCartRepository.findBySessionIdAndTenantId(sessionId, tenantId)
            .filter(persisted -> !persisted.isConverted()) // Don't recover converted carts
            .flatMap(persisted -> {
                Cart cart = persisted.getCart();

                // Extend expiration when recovering
                cart.setExpiresAt(Instant.now().plus(Duration.ofDays(7)));
                cart.setUpdatedAt(Instant.now());

                // Restore to Redis
                return cartRepository.save(cart)
                    .doOnSuccess(recovered -> logger.info(
                        "Recovered cart {} from MongoDB for session {}",
                        recovered.getId(), sessionId
                    ));
            });
    }

    /**
     * Associate a guest cart with a user when they log in.
     * Merges session cart with user's existing cart if needed.
     *
     * @param sessionId Session ID (guest)
     * @param userId User ID (logged in)
     * @return Mono<Cart> Merged cart
     */
    public Mono<Cart> associateCartWithUser(String sessionId, String userId) {
        return TenantContext.getTenantId()
            .flatMap(tenantId ->
                // Find session cart
                cartRepository.findBySessionIdAndTenantId(sessionId, tenantId)
                    .flatMap(sessionCart ->
                        // Find user's existing cart
                        persistedCartRepository.findByUserIdAndTenantId(userId, tenantId)
                            .flatMap(userCart -> {
                                // Merge carts: combine items from session cart into user cart
                                Cart merged = userCart.getCart();
                                sessionCart.getItems().forEach(item -> {
                                    boolean exists = merged.getItems().stream()
                                        .anyMatch(existing -> existing.id().equals(item.id()));
                                    if (!exists) {
                                        merged.getItems().add(item);
                                    }
                                });

                                merged.setUpdatedAt(Instant.now());
                                return persistCart(merged)
                                    .flatMap(saved -> {
                                        // Update user association
                                        return persistedCartRepository.findById(saved.getId())
                                            .flatMap(persisted -> {
                                                persisted.setUserId(userId);
                                                return persistedCartRepository.save(persisted)
                                                    .thenReturn(saved);
                                            });
                                    });
                            })
                            .switchIfEmpty(
                                // No existing user cart, just associate session cart
                                persistedCartRepository.findBySessionIdAndTenantId(sessionId, tenantId)
                                    .flatMap(persisted -> {
                                        persisted.setUserId(userId);
                                        return persistedCartRepository.save(persisted)
                                            .thenReturn(sessionCart);
                                    })
                                    .switchIfEmpty(Mono.just(sessionCart))
                            )
                    )
            );
    }

    /**
     * Mark cart as converted to order.
     * Prevents recovery and allows for cleanup.
     *
     * @param cartId Cart ID
     * @param orderId Order ID
     * @return Mono<Void>
     */
    public Mono<Void> markCartAsConverted(String cartId, String orderId) {
        return persistedCartRepository.findById(cartId)
            .flatMap(persisted -> {
                persisted.markAsConverted(orderId);
                return persistedCartRepository.save(persisted);
            })
            .then()
            .doOnSuccess(v -> logger.info(
                "Marked cart {} as converted to order {}", cartId, orderId
            ));
    }

    /**
     * Find abandoned carts for marketing campaigns.
     * Returns carts that haven't been updated in 24+ hours and not converted.
     *
     * @param tenantId Tenant ID
     * @return Flux<PersistedCart> Abandoned carts
     */
    public Flux<PersistedCart> findAbandonedCarts(String tenantId) {
        Instant threshold = Instant.now().minus(ABANDONED_CART_THRESHOLD);
        return persistedCartRepository.findAbandonedCarts(tenantId, threshold)
            .filter(cart -> !cart.getCart().getItems().isEmpty()); // Only carts with items
    }

    /**
     * Clean up old converted carts from MongoDB.
     * Removes carts that were converted to orders more than 90 days ago.
     *
     * @param tenantId Tenant ID
     * @return Mono<Long> Number of deleted carts
     */
    public Mono<Long> cleanupOldConvertedCarts(String tenantId) {
        Instant threshold = Instant.now().minus(CLEANUP_THRESHOLD);
        return persistedCartRepository
            .deleteByTenantIdAndConvertedTrueAndUpdatedAtBefore(tenantId, threshold)
            .doOnSuccess(count -> logger.info(
                "Cleaned up {} old converted carts for tenant {}", count, tenantId
            ));
    }

    /**
     * Get cart statistics for a tenant.
     * Useful for analytics and monitoring.
     *
     * @param tenantId Tenant ID
     * @return Mono<CartStats> Statistics
     */
    public Mono<CartStats> getCartStatistics(String tenantId) {
        return Mono.zip(
            persistedCartRepository.countByTenantIdAndConvertedFalse(tenantId),
            findAbandonedCarts(tenantId).count(),
            cartRepository.countByTenantId(tenantId)
        ).map(tuple -> new CartStats(
            tuple.getT1(), // Total unconverted carts in MongoDB
            tuple.getT2(), // Abandoned carts
            tuple.getT3()  // Active carts in Redis
        ));
    }

    /**
     * Cart statistics record
     */
    public record CartStats(
        Long totalUnconvertedCarts,
        Long abandonedCarts,
        Long activeCarts
    ) {}
}
