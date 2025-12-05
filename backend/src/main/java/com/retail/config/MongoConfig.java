package com.retail.config;

import com.retail.infrastructure.persistence.TenantAwareRepositoryFactoryBean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.config.EnableReactiveMongoAuditing;
import org.springframework.data.mongodb.repository.config.EnableReactiveMongoRepositories;

/**
 * MongoDB configuration with tenant-aware repository support.
 * Enables automatic tenantId injection for all repositories
 * extending TenantAwareRepository.
 */
@Configuration
@EnableReactiveMongoRepositories(
        basePackages = "com.retail.infrastructure.persistence",
        repositoryFactoryBeanClass = TenantAwareRepositoryFactoryBean.class
)
@EnableReactiveMongoAuditing
public class MongoConfig {

    // MongoDB reactive configuration
    // Connection settings are configured via application.yml

    // The TenantAwareRepositoryFactoryBean will automatically:
    // 1. Inject tenantId from reactive context into all queries
    // 2. Ensure tenant isolation for all CRUD operations
    // 3. Provide convenience methods (findAllByTenant, saveWithTenant, etc.)
}
