package com.retail;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Main Spring Boot application for the retail platform.
 *
 * This is a reactive, multi-tenant e-commerce platform with:
 * - Spring WebFlux for non-blocking HTTP
 * - MongoDB for document storage
 * - Redis for caching
 * - Elasticsearch for search
 * - PostgreSQL for financial transactions
 */
@SpringBootApplication
public class RetailApplication {

    public static void main(String[] args) {
        SpringApplication.run(RetailApplication.class, args);
    }
}
