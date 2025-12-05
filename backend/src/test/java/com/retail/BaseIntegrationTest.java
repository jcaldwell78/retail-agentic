package com.retail;

import com.retail.security.tenant.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import reactor.core.publisher.Hooks;
import reactor.core.publisher.Mono;
import reactor.util.context.Context;

/**
 * Base class for integration tests.
 * Provides common setup and utilities for testing reactive services.
 *
 * Features:
 * - Test profile activation
 * - Tenant context setup
 * - Reactor hooks for debugging
 * - Common test utilities
 * - Mock Redis configuration
 * - Mock Elasticsearch configuration
 *
 * Usage:
 * <pre>
 * {@code
 * @SpringBootTest
 * class MyServiceTest extends BaseIntegrationTest {
 *     @Test
 *     void testWithTenantContext() {
 *         withTenantContext(() -> {
 *             // Test code runs with tenant context
 *         });
 *     }
 * }
 * }
 * </pre>
 */
@SpringBootTest
@ActiveProfiles("test")
@Import(BaseTestConfiguration.class)
public abstract class BaseIntegrationTest {

    protected static final String TEST_TENANT_ID = "test-tenant-001";

    @BeforeEach
    void setUp() {
        // Enable Reactor debugging hooks for better error messages
        Hooks.onOperatorDebug();
    }

    @AfterEach
    void tearDown() {
        // Clean up Reactor hooks
        Hooks.resetOnOperatorDebug();
    }

    /**
     * Execute test code with tenant context.
     * Automatically sets up TenantContext for reactive chains.
     *
     * @param test Test code to execute
     * @param <T> Return type
     * @return Mono with result
     */
    protected <T> Mono<T> withTenantContext(Mono<T> test) {
        return test.contextWrite(Context.of(TenantContext.TENANT_ID_KEY, TEST_TENANT_ID));
    }

    /**
     * Get test tenant ID.
     */
    protected String getTestTenantId() {
        return TEST_TENANT_ID;
    }

    /**
     * Create tenant context for reactive operations.
     */
    protected Context createTenantContext() {
        return Context.of(TenantContext.TENANT_ID_KEY, TEST_TENANT_ID);
    }

    /**
     * Create tenant context with custom tenant ID.
     */
    protected Context createTenantContext(String tenantId) {
        return Context.of(TenantContext.TENANT_ID_KEY, tenantId);
    }
}
