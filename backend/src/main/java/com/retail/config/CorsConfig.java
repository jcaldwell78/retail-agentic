package com.retail.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsWebFilter;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

/**
 * CORS configuration for enabling frontend applications to communicate with the backend.
 */
@Configuration
public class CorsConfig {

    @Value("${cors.allowed-origins:http://localhost:3000,http://localhost:3001}")
    private String[] allowedOrigins;

    @Value("${cors.allowed-methods:GET,POST,PUT,DELETE,PATCH,OPTIONS}")
    private String[] allowedMethods;

    @Value("${cors.allowed-headers:*}")
    private String[] allowedHeaders;

    @Value("${cors.allow-credentials:true}")
    private boolean allowCredentials;

    @Value("${cors.max-age:3600}")
    private long maxAge;

    @Bean
    public CorsWebFilter corsWebFilter() {
        CorsConfiguration config = new CorsConfiguration();

        // Allowed origins (frontend applications)
        config.setAllowedOrigins(Arrays.asList(allowedOrigins));

        // Allowed HTTP methods
        config.setAllowedMethods(Arrays.asList(allowedMethods));

        // Allowed headers
        if (allowedHeaders.length == 1 && "*".equals(allowedHeaders[0])) {
            config.addAllowedHeader("*");
        } else {
            config.setAllowedHeaders(Arrays.asList(allowedHeaders));
        }

        // Allow credentials (cookies, authorization headers)
        config.setAllowCredentials(allowCredentials);

        // Exposed headers that the frontend can access
        config.setExposedHeaders(List.of(
            "Authorization",
            "Content-Type",
            "X-Tenant-ID",
            "X-Total-Count"
        ));

        // Pre-flight request cache duration
        config.setMaxAge(maxAge);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);

        return new CorsWebFilter(source);
    }
}
