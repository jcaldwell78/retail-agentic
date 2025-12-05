package com.retail.infrastructure.cache;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.time.Duration;

/**
 * Generic caching service using Redis for reactive applications.
 * Provides type-safe caching with automatic serialization/deserialization.
 */
@Service
public class CacheService {

    private final ReactiveRedisTemplate<String, String> redisTemplate;
    private final ObjectMapper objectMapper;

    // Default TTL: 15 minutes
    private static final Duration DEFAULT_TTL = Duration.ofMinutes(15);

    public CacheService(
            ReactiveRedisTemplate<String, String> redisTemplate,
            ObjectMapper objectMapper
    ) {
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
    }

    /**
     * Get value from cache by key.
     *
     * @param key Cache key
     * @param type Class type for deserialization
     * @return Mono of cached value or empty if not found/expired
     */
    public <T> Mono<T> get(String key, Class<T> type) {
        return redisTemplate.opsForValue()
                .get(key)
                .flatMap(json -> {
                    try {
                        T value = objectMapper.readValue(json, type);
                        return Mono.just(value);
                    } catch (Exception e) {
                        // Log error and return empty
                        return Mono.empty();
                    }
                });
    }

    /**
     * Get value from cache by key with TypeReference for generic types.
     *
     * @param key Cache key
     * @param typeRef TypeReference for deserialization (e.g., List<Product>)
     * @return Mono of cached value or empty if not found/expired
     */
    public <T> Mono<T> get(String key, TypeReference<T> typeRef) {
        return redisTemplate.opsForValue()
                .get(key)
                .flatMap(json -> {
                    try {
                        T value = objectMapper.readValue(json, typeRef);
                        return Mono.just(value);
                    } catch (Exception e) {
                        // Log error and return empty
                        return Mono.empty();
                    }
                });
    }

    /**
     * Put value in cache with default TTL.
     *
     * @param key Cache key
     * @param value Value to cache
     * @return Mono<Boolean> true if successful
     */
    public <T> Mono<Boolean> put(String key, T value) {
        return put(key, value, DEFAULT_TTL);
    }

    /**
     * Put value in cache with custom TTL.
     *
     * @param key Cache key
     * @param value Value to cache
     * @param ttl Time to live
     * @return Mono<Boolean> true if successful
     */
    public <T> Mono<Boolean> put(String key, T value, Duration ttl) {
        try {
            String json = objectMapper.writeValueAsString(value);
            return redisTemplate.opsForValue()
                    .set(key, json, ttl);
        } catch (Exception e) {
            // Log error and return false
            return Mono.just(false);
        }
    }

    /**
     * Delete value from cache.
     *
     * @param key Cache key
     * @return Mono<Boolean> true if deleted
     */
    public Mono<Boolean> delete(String key) {
        return redisTemplate.opsForValue()
                .delete(key);
    }

    /**
     * Delete all keys matching pattern.
     *
     * @param pattern Key pattern (e.g., "product:*")
     * @return Mono<Long> number of keys deleted
     */
    public Mono<Long> deleteByPattern(String pattern) {
        return redisTemplate.keys(pattern)
                .flatMap(redisTemplate::delete)
                .count();
    }

    /**
     * Check if key exists in cache.
     *
     * @param key Cache key
     * @return Mono<Boolean> true if exists
     */
    public Mono<Boolean> exists(String key) {
        return redisTemplate.hasKey(key);
    }

    /**
     * Get or compute value if not in cache.
     * If value exists in cache, return it.
     * Otherwise, compute it, store in cache, and return.
     *
     * @param key Cache key
     * @param type Class type for deserialization
     * @param supplier Supplier to compute value if not cached
     * @return Mono of value (from cache or computed)
     */
    public <T> Mono<T> getOrCompute(String key, Class<T> type, Mono<T> supplier) {
        return getOrCompute(key, type, supplier, DEFAULT_TTL);
    }

    /**
     * Get or compute value if not in cache with custom TTL.
     *
     * @param key Cache key
     * @param type Class type for deserialization
     * @param supplier Supplier to compute value if not cached
     * @param ttl Time to live for cached value
     * @return Mono of value (from cache or computed)
     */
    public <T> Mono<T> getOrCompute(String key, Class<T> type, Mono<T> supplier, Duration ttl) {
        return get(key, type)
                .switchIfEmpty(
                        supplier.flatMap(value ->
                                put(key, value, ttl)
                                        .thenReturn(value)
                        )
                );
    }

    /**
     * Generate cache key for tenant-specific data.
     *
     * @param tenantId Tenant ID
     * @param prefix Key prefix (e.g., "product")
     * @param identifier Specific identifier (e.g., product ID)
     * @return Formatted cache key
     */
    public static String tenantKey(String tenantId, String prefix, String identifier) {
        return String.format("%s:%s:%s", tenantId, prefix, identifier);
    }

    /**
     * Generate cache key for tenant-specific lists.
     *
     * @param tenantId Tenant ID
     * @param prefix Key prefix (e.g., "products")
     * @param params Additional parameters (e.g., "category:electronics:page:0")
     * @return Formatted cache key
     */
    public static String tenantListKey(String tenantId, String prefix, String params) {
        return String.format("%s:%s:%s", tenantId, prefix, params);
    }
}
