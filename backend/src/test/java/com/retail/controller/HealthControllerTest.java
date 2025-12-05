package com.retail.controller;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit tests for HealthController.
 * Tests controller methods directly without HTTP layer.
 */
class HealthControllerTest {

    private HealthController healthController;

    @BeforeEach
    void setUp() {
        healthController = new HealthController();
    }

    @Test
    void health_ShouldReturnStatusUp() {
        // Act
        Map<String, Object> health = healthController.health().block();

        // Assert
        assertThat(health).isNotNull();
        assertThat(health.get("status")).isEqualTo("UP");
        assertThat(health.get("service")).isEqualTo("retail-backend");
        assertThat(health.get("version")).isEqualTo("1.0.0");
        assertThat(health.get("timestamp")).isNotNull();
    }
}
