package com.retail.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

/**
 * Configuration for security headers.
 * Adds security headers to all HTTP responses.
 */
@Configuration
public class SecurityHeadersConfig {

    /**
     * Web filter that adds security headers to all responses.
     */
    @Bean
    public WebFilter securityHeadersFilter() {
        return new SecurityHeadersWebFilter();
    }

    /**
     * Security headers web filter implementation.
     */
    private static class SecurityHeadersWebFilter implements WebFilter {

        @Override
        public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
            // Add security headers to response
            exchange.getResponse().getHeaders().add(
                "X-Content-Type-Options", "nosniff"
            );

            exchange.getResponse().getHeaders().add(
                "X-Frame-Options", "DENY"
            );

            exchange.getResponse().getHeaders().add(
                "X-XSS-Protection", "1; mode=block"
            );

            exchange.getResponse().getHeaders().add(
                "Strict-Transport-Security", "max-age=31536000; includeSubDomains"
            );

            exchange.getResponse().getHeaders().add(
                "Referrer-Policy", "strict-origin-when-cross-origin"
            );

            exchange.getResponse().getHeaders().add(
                "Permissions-Policy",
                "geolocation=(), microphone=(), camera=()"
            );

            // Content Security Policy (restrictive but allows necessary resources)
            exchange.getResponse().getHeaders().add(
                "Content-Security-Policy",
                "default-src 'self'; " +
                "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
                "style-src 'self' 'unsafe-inline'; " +
                "img-src 'self' data: https:; " +
                "font-src 'self' data:; " +
                "connect-src 'self'; " +
                "frame-ancestors 'none'"
            );

            return chain.filter(exchange);
        }
    }
}
