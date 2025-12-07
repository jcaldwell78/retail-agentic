package com.retail.domain.wishlist;

import com.retail.infrastructure.persistence.WishlistRepository;
import com.retail.security.tenant.TenantContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.UUID;

/**
 * Service for managing user wishlists with multi-tenant support.
 *
 * Features:
 * - Automatic tenant isolation
 * - Price drop tracking
 * - Stock availability alerts
 * - Shareable wishlists
 * - Product variant support
 */
@Service
public class WishlistService {

    private static final Logger logger = LoggerFactory.getLogger(WishlistService.class);

    private final WishlistRepository wishlistRepository;

    public WishlistService(WishlistRepository wishlistRepository) {
        this.wishlistRepository = wishlistRepository;
    }

    /**
     * Get or create wishlist for current user in current tenant.
     *
     * @param userId the user ID
     * @return Mono containing the user's wishlist
     */
    public Mono<Wishlist> getUserWishlist(String userId) {
        return TenantContext.getTenantId()
                .flatMap(tenantId -> wishlistRepository.findByUserIdAndTenantId(userId, tenantId)
                        .switchIfEmpty(createWishlistForUser(userId, tenantId)));
    }

    /**
     * Create a new wishlist for a user.
     *
     * @param userId the user ID
     * @param tenantId the tenant ID
     * @return Mono containing the created wishlist
     */
    private Mono<Wishlist> createWishlistForUser(String userId, String tenantId) {
        logger.info("Creating new wishlist for user {} in tenant {}", userId, tenantId);
        Wishlist wishlist = new Wishlist(tenantId, userId);
        return wishlistRepository.save(wishlist);
    }

    /**
     * Add an item to the user's wishlist.
     *
     * @param userId the user ID
     * @param item the item to add
     * @return Mono containing the updated wishlist
     */
    public Mono<Wishlist> addItem(String userId, WishlistItem item) {
        return getUserWishlist(userId)
                .flatMap(wishlist -> {
                    boolean added = wishlist.addItem(item);
                    if (!added) {
                        logger.debug("Item {} already exists in wishlist for user {}", item.getProductId(), userId);
                        return Mono.just(wishlist);
                    }
                    logger.info("Added item {} to wishlist for user {}", item.getProductId(), userId);
                    return wishlistRepository.save(wishlist);
                });
    }

    /**
     * Remove an item from the user's wishlist by item ID.
     *
     * @param userId the user ID
     * @param itemId the item ID to remove
     * @return Mono containing the updated wishlist
     */
    public Mono<Wishlist> removeItem(String userId, String itemId) {
        return getUserWishlist(userId)
                .flatMap(wishlist -> {
                    boolean removed = wishlist.removeItem(itemId);
                    if (!removed) {
                        logger.debug("Item {} not found in wishlist for user {}", itemId, userId);
                        return Mono.just(wishlist);
                    }
                    logger.info("Removed item {} from wishlist for user {}", itemId, userId);
                    return wishlistRepository.save(wishlist);
                });
    }

    /**
     * Remove an item by product ID and optional variant ID.
     *
     * @param userId the user ID
     * @param productId the product ID
     * @param variantId optional variant ID
     * @return Mono containing the updated wishlist
     */
    public Mono<Wishlist> removeItemByProduct(String userId, String productId, String variantId) {
        return getUserWishlist(userId)
                .flatMap(wishlist -> {
                    boolean removed = wishlist.removeItemByProduct(productId, variantId);
                    if (!removed) {
                        logger.debug("Product {} (variant: {}) not found in wishlist for user {}",
                                productId, variantId, userId);
                        return Mono.just(wishlist);
                    }
                    logger.info("Removed product {} (variant: {}) from wishlist for user {}",
                            productId, variantId, userId);
                    return wishlistRepository.save(wishlist);
                });
    }

    /**
     * Update an existing wishlist item.
     *
     * @param userId the user ID
     * @param itemId the item ID to update
     * @param updatedItem the updated item data
     * @return Mono containing the updated wishlist
     */
    public Mono<Wishlist> updateItem(String userId, String itemId, WishlistItem updatedItem) {
        return getUserWishlist(userId)
                .flatMap(wishlist -> {
                    boolean updated = wishlist.updateItem(itemId, updatedItem);
                    if (!updated) {
                        logger.debug("Item {} not found in wishlist for user {}", itemId, userId);
                        return Mono.just(wishlist);
                    }
                    logger.info("Updated item {} in wishlist for user {}", itemId, userId);
                    return wishlistRepository.save(wishlist);
                });
    }

    /**
     * Clear all items from the user's wishlist.
     *
     * @param userId the user ID
     * @return Mono containing the updated wishlist
     */
    public Mono<Wishlist> clearAllItems(String userId) {
        return getUserWishlist(userId)
                .flatMap(wishlist -> {
                    wishlist.clearAllItems();
                    logger.info("Cleared all items from wishlist for user {}", userId);
                    return wishlistRepository.save(wishlist);
                });
    }

    /**
     * Share a wishlist and generate a share token.
     *
     * @param userId the user ID
     * @param allowPurchase whether others can purchase items for this user
     * @return Mono containing the share token
     */
    public Mono<String> shareWishlist(String userId, boolean allowPurchase) {
        return getUserWishlist(userId)
                .flatMap(wishlist -> {
                    String shareToken = wishlist.generateShareToken();
                    wishlist.setAllowPurchaseByOthers(allowPurchase);
                    logger.info("Generated share token for wishlist of user {}", userId);
                    return wishlistRepository.save(wishlist)
                            .map(savedWishlist -> shareToken);
                });
    }

    /**
     * Disable wishlist sharing.
     *
     * @param userId the user ID
     * @return Mono containing the updated wishlist
     */
    public Mono<Wishlist> disableSharing(String userId) {
        return getUserWishlist(userId)
                .flatMap(wishlist -> {
                    wishlist.disableSharing();
                    logger.info("Disabled sharing for wishlist of user {}", userId);
                    return wishlistRepository.save(wishlist);
                });
    }

    /**
     * Get a shared wishlist by share token.
     * Share tokens are globally unique and don't require tenant filtering.
     *
     * @param shareToken the share token
     * @return Mono containing the shared wishlist
     */
    public Mono<Wishlist> getSharedWishlist(String shareToken) {
        return wishlistRepository.findByShareToken(shareToken)
                .doOnNext(wishlist -> logger.debug("Retrieved shared wishlist with token {}", shareToken));
    }

    /**
     * Get all public wishlists for current tenant.
     *
     * @return Flux of public wishlists
     */
    public Flux<Wishlist> getPublicWishlists() {
        return TenantContext.getTenantId()
                .flatMapMany(wishlistRepository::findPublicWishlistsByTenantId);
    }

    /**
     * Get wishlists with price alerts enabled for current tenant.
     * Used by price drop detection service.
     *
     * @return Flux of wishlists with price alerts
     */
    public Flux<Wishlist> getWishlistsWithPriceAlerts() {
        return TenantContext.getTenantId()
                .flatMapMany(wishlistRepository::findWishlistsWithPriceAlertsEnabled);
    }

    /**
     * Get wishlists with stock alerts enabled for current tenant.
     * Used by stock alert service.
     *
     * @return Flux of wishlists with stock alerts
     */
    public Flux<Wishlist> getWishlistsWithStockAlerts() {
        return TenantContext.getTenantId()
                .flatMapMany(wishlistRepository::findWishlistsWithStockAlertsEnabled);
    }

    /**
     * Delete a user's wishlist.
     *
     * @param userId the user ID
     * @return Mono signaling completion
     */
    public Mono<Void> deleteWishlist(String userId) {
        return TenantContext.getTenantId()
                .flatMap(tenantId -> {
                    logger.info("Deleting wishlist for user {} in tenant {}", userId, tenantId);
                    return wishlistRepository.deleteByUserIdAndTenantId(userId, tenantId);
                });
    }

    /**
     * Count total wishlists for current tenant.
     *
     * @return Mono containing the count
     */
    public Mono<Long> countWishlists() {
        return TenantContext.getTenantId()
                .flatMap(wishlistRepository::countByTenantId);
    }
}
