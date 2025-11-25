package com.retail.api.ratelimit;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Annotation to apply custom rate limiting to specific endpoints.
 * Can be used on controller methods to override default rate limits.
 *
 * @example
 * @RateLimit(limit = 10, windowMinutes = 1)
 * @PostMapping("/login")
 * public Mono<AuthResponse> login(@RequestBody LoginRequest request) {
 *     // Endpoint limited to 10 requests per minute
 * }
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface RateLimit {

    /**
     * Maximum number of requests allowed
     */
    int limit() default 100;

    /**
     * Time window in minutes
     */
    int windowMinutes() default 1;

    /**
     * Custom key for rate limiting (default uses IP address)
     */
    String key() default "";
}
