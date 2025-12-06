package com.retail.api.ratelimit;

import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.core.annotation.Order;
import org.springframework.data.redis.core.ReactiveStringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

import java.time.Duration;

/**
 * Rate limiting filter using Redis for distributed rate limiting.
 * Implements token bucket algorithm with sliding window.
 */
@Component
@ConditionalOnBean(ReactiveStringRedisTemplate.class)
@Order(1) // Execute early in filter chain
public class RateLimitFilter implements WebFilter {

    private static final String RATE_LIMIT_KEY_PREFIX = "rate_limit:";
    private static final int DEFAULT_LIMIT = 100; // requests per window
    private static final Duration WINDOW_DURATION = Duration.ofMinutes(1);

    private final ReactiveStringRedisTemplate redisTemplate;
    private final RateLimitConfig config;

    public RateLimitFilter(ReactiveStringRedisTemplate redisTemplate, RateLimitConfig config) {
        this.redisTemplate = redisTemplate;
        this.config = config;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        // Skip rate limiting if disabled
        if (!config.isEnabled()) {
            return chain.filter(exchange);
        }

        // Admin bypass: check for admin role in authentication
        if (isAdminRequest(exchange)) {
            return chain.filter(exchange);
        }

        // Get client identifier (IP or user ID)
        String clientId = getClientIdentifier(exchange);

        // Get rate limit for this endpoint
        int limit = getRateLimitForPath(exchange.getRequest().getPath().value());

        // Calculate reset timestamp
        long resetTimestamp = System.currentTimeMillis() / 1000 + WINDOW_DURATION.toSeconds();

        // Check rate limit
        return checkRateLimit(clientId, limit)
                .flatMap(allowed -> {
                    if (allowed) {
                        // Add rate limit headers
                        exchange.getResponse().getHeaders().add("X-RateLimit-Limit", String.valueOf(limit));
                        exchange.getResponse().getHeaders().add("X-RateLimit-Reset", String.valueOf(resetTimestamp));
                        return getRemainingRequests(clientId, limit)
                                .flatMap(remaining -> {
                                    exchange.getResponse().getHeaders().add("X-RateLimit-Remaining", String.valueOf(remaining));
                                    return chain.filter(exchange);
                                });
                    } else {
                        // Rate limit exceeded
                        exchange.getResponse().setStatusCode(HttpStatus.TOO_MANY_REQUESTS);
                        exchange.getResponse().getHeaders().add("X-RateLimit-Limit", String.valueOf(limit));
                        exchange.getResponse().getHeaders().add("X-RateLimit-Remaining", "0");
                        exchange.getResponse().getHeaders().add("X-RateLimit-Reset", String.valueOf(resetTimestamp));
                        exchange.getResponse().getHeaders().add("Retry-After", String.valueOf(WINDOW_DURATION.toSeconds()));
                        return exchange.getResponse().setComplete();
                    }
                });
    }

    /**
     * Check if request is from an admin user (for monitoring tools).
     * Admins bypass rate limiting to allow monitoring and management operations.
     */
    private boolean isAdminRequest(ServerWebExchange exchange) {
        return exchange.getPrincipal()
                .map(principal -> {
                    // Check if principal has ADMIN role
                    if (principal instanceof org.springframework.security.core.Authentication) {
                        org.springframework.security.core.Authentication auth =
                            (org.springframework.security.core.Authentication) principal;
                        return auth.getAuthorities().stream()
                                .anyMatch(grantedAuthority ->
                                    "ROLE_ADMIN".equals(grantedAuthority.getAuthority()));
                    }
                    return false;
                })
                .blockOptional()
                .orElse(false);
    }

    /**
     * Check if request is within rate limit.
     * Increments counter and returns true if allowed.
     */
    private Mono<Boolean> checkRateLimit(String clientId, int limit) {
        String key = RATE_LIMIT_KEY_PREFIX + clientId;

        return redisTemplate.opsForValue()
                .increment(key)
                .flatMap(count -> {
                    if (count == 1) {
                        // First request in window, set expiration
                        return redisTemplate.expire(key, WINDOW_DURATION)
                                .thenReturn(true);
                    }
                    return Mono.just(count <= limit);
                })
                .onErrorReturn(true); // Allow request on Redis error
    }

    /**
     * Get remaining requests in current window
     */
    private Mono<Integer> getRemainingRequests(String clientId, int limit) {
        String key = RATE_LIMIT_KEY_PREFIX + clientId;

        return redisTemplate.opsForValue()
                .get(key)
                .map(count -> Math.max(0, limit - Integer.parseInt(count)))
                .defaultIfEmpty(limit)
                .onErrorReturn(limit);
    }

    /**
     * Get client identifier from request.
     * Uses IP address or authenticated user ID.
     */
    private String getClientIdentifier(ServerWebExchange exchange) {
        // Try to get user ID from context (if authenticated)
        // For now, use IP address
        String clientIp = exchange.getRequest().getRemoteAddress() != null
                ? exchange.getRequest().getRemoteAddress().getAddress().getHostAddress()
                : "unknown";

        // Check for X-Forwarded-For header (if behind proxy)
        String forwardedFor = exchange.getRequest().getHeaders().getFirst("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isEmpty()) {
            clientIp = forwardedFor.split(",")[0].trim();
        }

        return clientIp;
    }

    /**
     * Get rate limit for specific path.
     * Can be customized per endpoint.
     */
    private int getRateLimitForPath(String path) {
        // Check if path has custom limit in config
        return config.getPathLimits().getOrDefault(path, DEFAULT_LIMIT);
    }
}
