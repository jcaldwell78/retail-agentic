package com.retail.infrastructure.persistence;

import com.retail.domain.wishlist.Wishlist;
import com.retail.security.tenant.TenantContext;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * Repository for Wishlist entities with automatic tenant filtering.
 * Extends TenantAwareRepository to get automatic tenantId injection.
 * All queries automatically include tenantId filter from TenantContext.
 */
@Repository
public interface WishlistRepository extends TenantAwareRepository<Wishlist, String> {

    /**
     * Find wishlist by user ID for current tenant.
     * TenantId is automatically injected from reactive context.
     *
     * @param userId the user ID
     * @return Mono containing the user's wishlist
     */
    default Mono<Wishlist> findByUserId(String userId) {
        return TenantContext.getTenantId()
                .flatMap(tenantId -> findByUserIdAndTenantId(userId, tenantId));
    }

    /**
     * Find wishlist by user ID and tenant (internal use).
     *
     * @param userId the user ID
     * @param tenantId the tenant ID
     * @return Mono containing the wishlist
     */
    Mono<Wishlist> findByUserIdAndTenantId(String userId, String tenantId);

    /**
     * Find wishlist by share token.
     * Share tokens are globally unique and don't require tenant filtering.
     *
     * @param shareToken the share token
     * @return Mono containing the shared wishlist
     */
    Mono<Wishlist> findByShareToken(String shareToken);

    /**
     * Find all public wishlists for current tenant.
     * TenantId is automatically injected from reactive context.
     *
     * @return Flux of public wishlists
     */
    default Flux<Wishlist> findPublicWishlists() {
        return TenantContext.getTenantId()
                .flatMapMany(this::findPublicWishlistsByTenantId);
    }

    /**
     * Find public wishlists by tenant (internal use).
     *
     * @param tenantId the tenant ID
     * @return Flux of public wishlists
     */
    @Query("{ 'tenantId': ?0, 'isPublic': true }")
    Flux<Wishlist> findPublicWishlistsByTenantId(String tenantId);

    /**
     * Find wishlists with items needing price alerts.
     * Finds wishlists where at least one item has price alerts enabled.
     *
     * @param tenantId the tenant ID
     * @return Flux of wishlists with price alerts
     */
    @Query("{ 'tenantId': ?0, 'items.priceAlertEnabled': true }")
    Flux<Wishlist> findWishlistsWithPriceAlertsEnabled(String tenantId);

    /**
     * Find wishlists with items needing stock alerts.
     * Finds wishlists where at least one item has stock alerts enabled.
     *
     * @param tenantId the tenant ID
     * @return Flux of wishlists with stock alerts
     */
    @Query("{ 'tenantId': ?0, 'items.stockAlertEnabled': true }")
    Flux<Wishlist> findWishlistsWithStockAlertsEnabled(String tenantId);

    /**
     * Count wishlists for current tenant.
     * TenantId is automatically injected from reactive context.
     *
     * @return Mono containing the wishlist count
     */
    default Mono<Long> countWishlists() {
        return TenantContext.getTenantId()
                .flatMap(this::countByTenantId);
    }

    /**
     * Count wishlists by tenant (internal use).
     *
     * @param tenantId the tenant ID
     * @return Mono containing the count
     */
    Mono<Long> countByTenantId(String tenantId);

    /**
     * Delete wishlist by user ID for current tenant.
     * TenantId is automatically injected from reactive context.
     *
     * @param userId the user ID
     * @return Mono signaling completion
     */
    default Mono<Void> deleteByUserId(String userId) {
        return TenantContext.getTenantId()
                .flatMap(tenantId -> deleteByUserIdAndTenantId(userId, tenantId));
    }

    /**
     * Delete wishlist by user ID and tenant (internal use).
     *
     * @param userId the user ID
     * @param tenantId the tenant ID
     * @return Mono signaling completion
     */
    Mono<Void> deleteByUserIdAndTenantId(String userId, String tenantId);

    /**
     * Find wishlist by ID and tenant (internal use).
     *
     * @param id the wishlist ID
     * @param tenantId the tenant ID
     * @return Mono containing the wishlist
     */
    Mono<Wishlist> findByIdAndTenantId(String id, String tenantId);

    /**
     * Delete wishlist by ID and tenant (internal use).
     *
     * @param id the wishlist ID
     * @param tenantId the tenant ID
     * @return Mono signaling completion
     */
    Mono<Void> deleteByIdAndTenantId(String id, String tenantId);
}
