package com.retail.domain.product;

import com.retail.security.tenant.TenantContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Range;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.time.Instant;

/**
 * Service for tracking and retrieving recently viewed products.
 * Uses Redis for fast access with automatic expiration.
 */
@Service
public class RecentlyViewedService {

    private static final Logger logger = LoggerFactory.getLogger(RecentlyViewedService.class);

    private static final String KEY_PREFIX = "recently_viewed:";
    private static final int MAX_ITEMS = 20; // Maximum number of recently viewed products to store
    private static final Duration EXPIRATION = Duration.ofDays(30); // Items expire after 30 days

    private final ReactiveRedisTemplate<String, String> redisTemplate;
    private final ProductService productService;

    public RecentlyViewedService(
            ReactiveRedisTemplate<String, String> redisTemplate,
            ProductService productService) {
        this.redisTemplate = redisTemplate;
        this.productService = productService;
    }

    /**
     * Record a product view for a user.
     * Uses a Redis sorted set with timestamp as score for ordering.
     *
     * @param userId User ID
     * @param productId Product ID that was viewed
     * @return Mono that completes when the view is recorded
     */
    public Mono<Void> recordView(String userId, String productId) {
        return TenantContext.getTenantId()
            .flatMap(tenantId -> {
                String key = buildKey(tenantId, userId);
                double score = Instant.now().toEpochMilli();

                logger.debug("Recording view for user {} product {} tenant {}", userId, productId, tenantId);

                return redisTemplate.opsForZSet()
                    .add(key, productId, score)
                    .then(trimToMaxItems(key))
                    .then(redisTemplate.expire(key, EXPIRATION))
                    .then();
            });
    }

    /**
     * Get recently viewed products for a user.
     *
     * @param userId User ID
     * @param limit Maximum number of products to return (default 10)
     * @return Flux of recently viewed products, ordered by most recent first
     */
    public Flux<Product> getRecentlyViewed(String userId, int limit) {
        int effectiveLimit = Math.min(limit, MAX_ITEMS);

        return TenantContext.getTenantId()
            .flatMapMany(tenantId -> {
                String key = buildKey(tenantId, userId);

                logger.debug("Getting recently viewed for user {} tenant {}", userId, tenantId);

                // Get product IDs from Redis sorted set (reverse order for most recent first)
                return redisTemplate.opsForZSet()
                    .reverseRange(key, Range.closed(0L, (long) effectiveLimit - 1))
                    .flatMap(productId ->
                        productService.findById(productId)
                            .onErrorResume(e -> {
                                logger.warn("Product {} not found, removing from recently viewed", productId);
                                return removeProduct(userId, productId).then(Mono.empty());
                            })
                    );
            });
    }

    /**
     * Get recently viewed product IDs only (without fetching full product data).
     * Useful for quick checks or client-side caching.
     *
     * @param userId User ID
     * @param limit Maximum number of IDs to return
     * @return Flux of product IDs, ordered by most recent first
     */
    public Flux<String> getRecentlyViewedIds(String userId, int limit) {
        int effectiveLimit = Math.min(limit, MAX_ITEMS);

        return TenantContext.getTenantId()
            .flatMapMany(tenantId -> {
                String key = buildKey(tenantId, userId);
                return redisTemplate.opsForZSet()
                    .reverseRange(key, Range.closed(0L, (long) effectiveLimit - 1));
            });
    }

    /**
     * Remove a product from a user's recently viewed list.
     *
     * @param userId User ID
     * @param productId Product ID to remove
     * @return Mono that completes when the product is removed
     */
    public Mono<Void> removeProduct(String userId, String productId) {
        return TenantContext.getTenantId()
            .flatMap(tenantId -> {
                String key = buildKey(tenantId, userId);
                return redisTemplate.opsForZSet()
                    .remove(key, productId)
                    .then();
            });
    }

    /**
     * Clear all recently viewed products for a user.
     *
     * @param userId User ID
     * @return Mono that completes when the list is cleared
     */
    public Mono<Void> clearAll(String userId) {
        return TenantContext.getTenantId()
            .flatMap(tenantId -> {
                String key = buildKey(tenantId, userId);
                logger.info("Clearing recently viewed for user {} tenant {}", userId, tenantId);
                return redisTemplate.delete(key).then();
            });
    }

    /**
     * Check if a product is in the user's recently viewed list.
     *
     * @param userId User ID
     * @param productId Product ID to check
     * @return Mono<Boolean> true if the product is in the list
     */
    public Mono<Boolean> isRecentlyViewed(String userId, String productId) {
        return TenantContext.getTenantId()
            .flatMap(tenantId -> {
                String key = buildKey(tenantId, userId);
                return redisTemplate.opsForZSet()
                    .score(key, productId)
                    .map(score -> score != null)
                    .defaultIfEmpty(false);
            });
    }

    /**
     * Get the count of recently viewed products for a user.
     *
     * @param userId User ID
     * @return Mono<Long> count of recently viewed products
     */
    public Mono<Long> getCount(String userId) {
        return TenantContext.getTenantId()
            .flatMap(tenantId -> {
                String key = buildKey(tenantId, userId);
                return redisTemplate.opsForZSet().size(key);
            });
    }

    /**
     * Merge recently viewed products from a guest session to a logged-in user.
     * Useful when a guest logs in after browsing.
     *
     * @param guestId Guest session ID
     * @param userId Logged-in user ID
     * @return Mono that completes when the merge is done
     */
    public Mono<Void> mergeGuestToUser(String guestId, String userId) {
        return TenantContext.getTenantId()
            .flatMap(tenantId -> {
                String guestKey = buildKey(tenantId, guestId);
                String userKey = buildKey(tenantId, userId);

                logger.info("Merging recently viewed from guest {} to user {} tenant {}",
                    guestId, userId, tenantId);

                // Get all guest items with scores and add to user's list
                return redisTemplate.opsForZSet()
                    .rangeWithScores(guestKey, Range.unbounded())
                    .flatMap(tuple ->
                        redisTemplate.opsForZSet()
                            .add(userKey, tuple.getValue(), tuple.getScore())
                    )
                    .then(trimToMaxItems(userKey))
                    .then(redisTemplate.expire(userKey, EXPIRATION))
                    .then(redisTemplate.delete(guestKey))
                    .then();
            });
    }

    /**
     * Trim the recently viewed list to the maximum number of items.
     * Removes oldest items when the limit is exceeded.
     */
    private Mono<Void> trimToMaxItems(String key) {
        // Remove oldest items to keep only MAX_ITEMS
        // First get count, then remove if > MAX_ITEMS
        return redisTemplate.opsForZSet()
            .size(key)
            .flatMap(size -> {
                if (size > MAX_ITEMS) {
                    // Remove oldest items (lowest scores)
                    long removeCount = size - MAX_ITEMS;
                    return redisTemplate.opsForZSet()
                        .removeRange(key, Range.closed(0L, removeCount - 1))
                        .then();
                }
                return Mono.empty();
            });
    }

    /**
     * Build the Redis key for a user's recently viewed products.
     */
    private String buildKey(String tenantId, String userId) {
        return KEY_PREFIX + tenantId + ":" + userId;
    }
}
