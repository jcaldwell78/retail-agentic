package com.retail;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.test.web.reactive.server.WebTestClient;
import org.springframework.web.reactive.function.server.RouterFunction;
import org.springframework.web.reactive.function.server.ServerResponse;

import java.time.Duration;

/**
 * Test configuration for WebFlux testing.
 * Ensures WebTestClient is properly configured with application context.
 */
@TestConfiguration
public class TestWebFluxConfiguration {

    @Bean
    @Primary
    public WebTestClient webTestClient(ApplicationContext context) {
        return WebTestClient.bindToApplicationContext(context)
                .configureClient()
                .responseTimeout(Duration.ofSeconds(30))
                .build();
    }
}
