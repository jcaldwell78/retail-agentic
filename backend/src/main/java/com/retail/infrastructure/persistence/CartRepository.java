package com.retail.infrastructure.persistence;

import com.retail.domain.cart.Cart;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.Objects;

/**
 * Repository for Cart entities stored in Redis.
 * Provides high-speed access with automatic TTL management.
 */
@Repository
@ConditionalOnBean(ReactiveRedisTemplate.class)
public class CartRepository {

    private static final String CART_KEY_PREFIX = "cart:";
    private static final Duration CART_TTL = Duration.ofDays(7);

    private final ReactiveRedisTemplate<String, Cart> redisTemplate;

    public CartRepository(ReactiveRedisTemplate<String, Cart> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    /**
     * Generate Redis key for cart
     */
    private String getKey(String cartId) {
        return CART_KEY_PREFIX + cartId;
    }

    /**
     * Find cart by ID
     */
    public Mono<Cart> findById(String id) {
        return redisTemplate.opsForValue()
            .get(getKey(id));
    }

    /**
     * Find cart by session ID and tenant
     */
    public Mono<Cart> findBySessionIdAndTenantId(String sessionId, String tenantId) {
        String pattern = CART_KEY_PREFIX + "*";
        return redisTemplate.keys(pattern)
            .flatMap(key -> redisTemplate.opsForValue().get(key))
            .filter(Objects::nonNull)
            .filter(cart -> cart.getSessionId().equals(sessionId) &&
                           cart.getTenantId().equals(tenantId))
            .next();
    }

    /**
     * Save cart to Redis with TTL
     */
    public Mono<Cart> save(Cart cart) {
        String key = getKey(cart.getId());
        return redisTemplate.opsForValue()
            .set(key, cart, CART_TTL)
            .thenReturn(cart);
    }

    /**
     * Delete cart by ID
     */
    public Mono<Boolean> deleteById(String id) {
        return redisTemplate.delete(getKey(id))
            .map(count -> count > 0);
    }

    /**
     * Check if cart exists
     */
    public Mono<Boolean> existsById(String id) {
        return redisTemplate.hasKey(getKey(id));
    }

    /**
     * Extend cart TTL
     */
    public Mono<Boolean> extendTtl(String id) {
        return redisTemplate.expire(getKey(id), CART_TTL);
    }

    /**
     * Get remaining TTL for cart
     */
    public Mono<Duration> getTtl(String id) {
        return redisTemplate.getExpire(getKey(id));
    }

    /**
     * Find all cart IDs for a tenant (use sparingly, for admin purposes)
     */
    public Flux<String> findAllIdsByTenantId(String tenantId) {
        String pattern = CART_KEY_PREFIX + "*";
        return redisTemplate.keys(pattern)
            .flatMap(key -> redisTemplate.opsForValue().get(key))
            .filter(Objects::nonNull)
            .filter(cart -> cart.getTenantId().equals(tenantId))
            .map(Cart::getId);
    }

    /**
     * Count carts for tenant
     */
    public Mono<Long> countByTenantId(String tenantId) {
        return findAllIdsByTenantId(tenantId).count();
    }

    /**
     * Delete all carts for tenant (admin operation)
     */
    public Mono<Long> deleteByTenantId(String tenantId) {
        return findAllIdsByTenantId(tenantId)
            .flatMap(this::deleteById)
            .filter(deleted -> deleted)
            .count();
    }
}
