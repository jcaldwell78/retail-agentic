package com.retail.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.reactive.AutoConfigureWebTestClient;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.reactive.server.WebTestClient;
import com.retail.TestRedisConfiguration;
import com.retail.TestElasticsearchConfiguration;

/**
 * Tests for HealthController.
 * Uses full Spring Boot context with test configuration.
 */
@SpringBootTest
@AutoConfigureWebTestClient
@ActiveProfiles("test")
@Import({TestRedisConfiguration.class, TestElasticsearchConfiguration.class})
class HealthControllerTest {

    @Autowired
    private WebTestClient webTestClient;

    @Test
    void health_ShouldReturnStatusUp() {
        webTestClient.get()
            .uri("/api/v1/health")
            .accept(MediaType.APPLICATION_JSON)
            .exchange()
            .expectStatus().isOk()
            .expectHeader().contentType(MediaType.APPLICATION_JSON)
            .expectBody()
            .jsonPath("$.status").isEqualTo("UP")
            .jsonPath("$.service").isEqualTo("retail-backend")
            .jsonPath("$.version").isEqualTo("1.0.0")
            .jsonPath("$.timestamp").exists();
    }
}
