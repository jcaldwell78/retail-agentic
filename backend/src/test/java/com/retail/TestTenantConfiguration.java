package com.retail;

import com.retail.domain.tenant.Tenant;
import com.retail.infrastructure.persistence.TenantRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Profile;

import java.time.Instant;

/**
 * Test configuration that ensures a test tenant exists in the database.
 * This is required for security integration tests that use the TenantResolverFilter.
 */
@TestConfiguration
@Profile("test")
public class TestTenantConfiguration {

    private final TenantRepository tenantRepository;

    public TestTenantConfiguration(TenantRepository tenantRepository) {
        this.tenantRepository = tenantRepository;
    }

    @PostConstruct
    public void init() {
        // Check if test tenant already exists
        Tenant existingTenant = tenantRepository.findBySubdomain("test-tenant-001").block();

        if (existingTenant == null) {
            // Create test tenant
            Tenant testTenant = new Tenant();
            testTenant.setId("test-tenant-001");
            testTenant.setSubdomain("test-tenant-001");  // Match the ID for header-based resolution
            testTenant.setName("Test Tenant Store");
            testTenant.setDescription("Test tenant for integration tests");
            testTenant.setContactEmail("test@example.com");
            testTenant.setPhone("555-0100");
            testTenant.setCreatedAt(Instant.now());
            testTenant.setUpdatedAt(Instant.now());

            tenantRepository.save(testTenant).block();
        }
    }
}
