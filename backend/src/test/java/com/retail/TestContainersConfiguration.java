package com.retail;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Bean;
import org.testcontainers.containers.MongoDBContainer;
import org.testcontainers.utility.DockerImageName;

/**
 * Test configuration for Testcontainers.
 * Provides MongoDB container for integration tests.
 */
@TestConfiguration(proxyBeanMethods = false)
public class TestContainersConfiguration {

    /**
     * Creates a MongoDB container for testing.
     * The @ServiceConnection annotation automatically configures Spring Boot
     * to connect to this MongoDB instance.
     */
    @Bean
    @ServiceConnection
    public MongoDBContainer mongoDBContainer() {
        return new MongoDBContainer(DockerImageName.parse("mongo:7.0"))
                .withReuse(true); // Reuse container across test runs for better performance
    }
}
