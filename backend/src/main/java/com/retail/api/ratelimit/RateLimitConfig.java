package com.retail.api.ratelimit;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.util.HashMap;
import java.util.Map;

/**
 * Configuration for rate limiting.
 * Can be customized in application.yml.
 */
@Configuration
@ConfigurationProperties(prefix = "api.rate-limit")
public class RateLimitConfig {

    /**
     * Enable/disable rate limiting globally
     */
    private boolean enabled = true;

    /**
     * Default rate limit (requests per minute)
     */
    private int defaultLimit = 100;

    /**
     * Custom limits for specific paths
     * Key: path pattern, Value: requests per minute
     */
    private Map<String, Integer> pathLimits = new HashMap<>();

    public RateLimitConfig() {
        // Default path-specific limits
        pathLimits.put("/api/v1/auth/login", 10);        // Login: 10/min
        pathLimits.put("/api/v1/auth/register", 5);      // Register: 5/min
        pathLimits.put("/api/v1/products/search", 50);   // Search: 50/min
        pathLimits.put("/api/v1/orders", 20);            // Orders: 20/min
    }

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public int getDefaultLimit() {
        return defaultLimit;
    }

    public void setDefaultLimit(int defaultLimit) {
        this.defaultLimit = defaultLimit;
    }

    public Map<String, Integer> getPathLimits() {
        return pathLimits;
    }

    public void setPathLimits(Map<String, Integer> pathLimits) {
        this.pathLimits = pathLimits;
    }
}
