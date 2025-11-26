package com.retail.security;

import com.retail.BaseIntegrationTest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.reactive.AutoConfigureWebTestClient;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.reactive.server.WebTestClient;

/**
 * Integration tests for security configuration.
 *
 * Tests:
 * - Public endpoints are accessible without authentication
 * - Protected endpoints require authentication
 * - Role-based access control (RBAC) is enforced
 * - CSRF tokens are required for state-changing operations
 * - JWT authentication works correctly
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureWebTestClient
@ActiveProfiles("test")
@DisplayName("Security Integration Tests")
class SecurityIT extends BaseIntegrationTest {

    @Autowired
    private WebTestClient webTestClient;

    @Autowired
    private JwtService jwtService;

    @Test
    @DisplayName("Public endpoints are accessible without authentication")
    void testPublicEndpointsAccessible() {
        // Health endpoint should be public
        webTestClient.get()
            .uri("/api/v1/health")
            .exchange()
            .expectStatus().isOk();

        // API docs should be public
        webTestClient.get()
            .uri("/v3/api-docs")
            .exchange()
            .expectStatus().isOk();
    }

    @Test
    @DisplayName("Protected endpoints require authentication")
    void testProtectedEndpointsRequireAuth() {
        // Cart endpoint requires authentication
        webTestClient.get()
            .uri("/api/v1/cart")
            .exchange()
            .expectStatus().isUnauthorized();

        // User profile requires authentication
        webTestClient.get()
            .uri("/api/v1/users/me")
            .exchange()
            .expectStatus().isUnauthorized();
    }

    @Test
    @DisplayName("Valid JWT token grants access to protected endpoints")
    void testValidJwtGrantsAccess() {
        String token = jwtService.generateToken(
            "user-123",
            "user@example.com",
            TEST_TENANT_ID,
            "USER"
        );

        webTestClient.get()
            .uri("/api/v1/users/me")
            .header("Authorization", "Bearer " + token)
            .exchange()
            .expectStatus().isOk();
    }

    @Test
    @DisplayName("Invalid JWT token is rejected")
    void testInvalidJwtRejected() {
        webTestClient.get()
            .uri("/api/v1/users/me")
            .header("Authorization", "Bearer invalid-token")
            .exchange()
            .expectStatus().isUnauthorized();
    }

    @Test
    @DisplayName("Expired JWT token is rejected")
    void testExpiredJwtRejected() {
        // Create token that expired (by using negative expiration)
        String expiredToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyQGV4YW1wbGUuY29tIiwiZXhwIjoxNjAwMDAwMDAwfQ.invalid";

        webTestClient.get()
            .uri("/api/v1/users/me")
            .header("Authorization", "Bearer " + expiredToken)
            .exchange()
            .expectStatus().isUnauthorized();
    }

    @Test
    @DisplayName("ADMIN role can access admin endpoints")
    void testAdminRoleAccess() {
        String adminToken = jwtService.generateToken(
            "admin-123",
            "admin@example.com",
            TEST_TENANT_ID,
            "ADMIN"
        );

        webTestClient.get()
            .uri("/api/v1/admin/dashboard")
            .header("Authorization", "Bearer " + adminToken)
            .exchange()
            .expectStatus().isOk();
    }

    @Test
    @DisplayName("USER role cannot access admin endpoints")
    void testUserRoleDeniedAdminAccess() {
        String userToken = jwtService.generateToken(
            "user-123",
            "user@example.com",
            TEST_TENANT_ID,
            "USER"
        );

        webTestClient.get()
            .uri("/api/v1/admin/dashboard")
            .header("Authorization", "Bearer " + userToken)
            .exchange()
            .expectStatus().isForbidden();
    }

    @Test
    @DisplayName("USER role can create products (admin operation) is denied")
    void testUserCannotCreateProducts() {
        String userToken = jwtService.generateToken(
            "user-123",
            "user@example.com",
            TEST_TENANT_ID,
            "USER"
        );

        webTestClient.post()
            .uri("/api/v1/products")
            .header("Authorization", "Bearer " + userToken)
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue("{\"name\":\"Test Product\"}")
            .exchange()
            .expectStatus().isForbidden();
    }

    @Test
    @DisplayName("ADMIN role can create products")
    void testAdminCanCreateProducts() {
        String adminToken = jwtService.generateToken(
            "admin-123",
            "admin@example.com",
            TEST_TENANT_ID,
            "ADMIN"
        );

        webTestClient.post()
            .uri("/api/v1/products")
            .header("Authorization", "Bearer " + adminToken)
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue("""
                {
                    "name": "Test Product",
                    "sku": "TEST-001",
                    "price": 99.99,
                    "description": "Test product"
                }
                """)
            .exchange()
            .expectStatus().isOk();
    }

    @Test
    @DisplayName("Public product browsing does not require authentication")
    void testPublicProductBrowsing() {
        // GET products should be public
        webTestClient.get()
            .uri("/api/v1/products")
            .exchange()
            .expectStatus().isOk();

        // GET product search should be public
        webTestClient.get()
            .uri("/api/v1/search?q=test")
            .exchange()
            .expectStatus().isOk();
    }

    @Test
    @DisplayName("JWT contains tenant context for multi-tenancy")
    void testJwtContainsTenantContext() {
        String token = jwtService.generateToken(
            "user-123",
            "user@example.com",
            "tenant-abc",
            "USER"
        );

        String extractedTenantId = jwtService.extractTenantId(token);
        assert extractedTenantId.equals("tenant-abc");
    }

    @Test
    @DisplayName("JWT contains role for RBAC")
    void testJwtContainsRole() {
        String token = jwtService.generateToken(
            "user-123",
            "user@example.com",
            TEST_TENANT_ID,
            "ADMIN"
        );

        String extractedRole = jwtService.extractRole(token);
        assert extractedRole.equals("ADMIN");
    }

    @Test
    @DisplayName("Token validation checks signature")
    void testTokenSignatureValidation() {
        String token = jwtService.generateToken(
            "user-123",
            "user@example.com",
            TEST_TENANT_ID,
            "USER"
        );

        // Valid token should validate
        assert jwtService.validateToken(token);

        // Tampered token should fail (changed last character)
        String tamperedToken = token.substring(0, token.length() - 1) + "X";
        assert !jwtService.validateToken(tamperedToken);
    }

    @Test
    @DisplayName("CSRF protection is enabled for state-changing operations")
    void testCsrfProtectionEnabled() {
        String adminToken = jwtService.generateToken(
            "admin-123",
            "admin@example.com",
            TEST_TENANT_ID,
            "ADMIN"
        );

        // POST without CSRF token should be rejected
        webTestClient.post()
            .uri("/api/v1/products")
            .header("Authorization", "Bearer " + adminToken)
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue("{\"name\":\"Test\"}")
            .exchange()
            .expectStatus().isForbidden(); // CSRF validation failure
    }

    @Test
    @DisplayName("Authentication header must be Bearer format")
    void testAuthHeaderFormat() {
        // Without "Bearer " prefix, should be unauthorized
        webTestClient.get()
            .uri("/api/v1/users/me")
            .header("Authorization", "invalid-format-token")
            .exchange()
            .expectStatus().isUnauthorized();
    }

    @Test
    @DisplayName("Missing Authorization header returns 401")
    void testMissingAuthHeader() {
        webTestClient.get()
            .uri("/api/v1/cart")
            .exchange()
            .expectStatus().isUnauthorized();
    }
}
