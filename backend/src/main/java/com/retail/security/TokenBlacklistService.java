package com.retail.security;

import org.springframework.data.redis.core.ReactiveRedisTemplate;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.time.Instant;
import java.util.Date;

/**
 * Service for managing JWT token blacklist using Redis.
 * Blacklisted tokens are stored in Redis with TTL matching token expiration.
 */
@Service
public class TokenBlacklistService {

    private static final String BLACKLIST_PREFIX = "blacklist:token:";

    private final ReactiveRedisTemplate<String, String> redisTemplate;
    private final JwtService jwtService;

    public TokenBlacklistService(ReactiveRedisTemplate<String, String> redisTemplate,
                                  JwtService jwtService) {
        this.redisTemplate = redisTemplate;
        this.jwtService = jwtService;
    }

    /**
     * Blacklist a token (typically during logout).
     * The token is stored in Redis with TTL set to the token's remaining lifetime.
     *
     * @param token JWT token to blacklist
     * @return Mono<Boolean> true if successfully blacklisted
     */
    public Mono<Boolean> blacklistToken(String token) {
        try {
            // Extract expiration from token
            Date expiration = jwtService.extractExpiration(token);

            // Calculate TTL (time until token expires)
            long ttlSeconds = calculateTTL(expiration);

            if (ttlSeconds <= 0) {
                // Token already expired, no need to blacklist
                return Mono.just(true);
            }

            // Store token in Redis with TTL
            String key = BLACKLIST_PREFIX + token;
            return redisTemplate.opsForValue()
                .set(key, "blacklisted", Duration.ofSeconds(ttlSeconds))
                .defaultIfEmpty(false);

        } catch (Exception e) {
            // If token is invalid, consider it blacklisted
            return Mono.just(true);
        }
    }

    /**
     * Check if a token is blacklisted.
     *
     * @param token JWT token to check
     * @return Mono<Boolean> true if token is blacklisted
     */
    public Mono<Boolean> isBlacklisted(String token) {
        String key = BLACKLIST_PREFIX + token;
        return redisTemplate.hasKey(key)
            .defaultIfEmpty(false);
    }

    /**
     * Calculate TTL in seconds from expiration date.
     */
    private long calculateTTL(Date expiration) {
        Instant now = Instant.now();
        Instant expiryInstant = expiration.toInstant();
        return Duration.between(now, expiryInstant).getSeconds();
    }
}
