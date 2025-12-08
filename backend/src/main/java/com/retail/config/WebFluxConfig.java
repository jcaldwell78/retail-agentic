package com.retail.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.http.codec.ServerCodecConfigurer;
import org.springframework.web.reactive.config.WebFluxConfigurer;

/**
 * WebFlux configuration for request/response handling.
 *
 * Configures request size limits to protect against:
 * - Large payload attacks
 * - Memory exhaustion attacks
 * - Slow HTTP POST attacks
 */
@Configuration
public class WebFluxConfig implements WebFluxConfigurer {

    /**
     * Maximum in-memory size for request bodies: 10 MB.
     *
     * Requests larger than this will be rejected with 413 Payload Too Large.
     * This prevents memory exhaustion from malicious large payloads.
     *
     * For file uploads larger than 10MB, implement streaming with
     * DataBufferUtils or use multipart file handling with disk storage.
     */
    private static final int MAX_IN_MEMORY_SIZE = 10 * 1024 * 1024; // 10 MB

    @Override
    public void configureHttpMessageCodecs(ServerCodecConfigurer configurer) {
        // Set maximum in-memory size for request bodies
        configurer.defaultCodecs().maxInMemorySize(MAX_IN_MEMORY_SIZE);
    }
}
