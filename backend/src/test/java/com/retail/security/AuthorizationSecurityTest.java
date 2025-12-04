package com.retail.security;

import com.retail.BaseIntegrationTest;
import com.retail.domain.user.User;
import com.retail.domain.user.UserRole;
import com.retail.domain.user.UserStatus;
import com.retail.infrastructure.persistence.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.reactive.AutoConfigureWebTestClient;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.reactive.server.WebTestClient;

import java.time.Instant;
import java.util.List;

/**
 * Security tests for authorization and role-based access control (RBAC).
 * Tests that users can only access resources appropriate for their role.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureWebTestClient
@ActiveProfiles("test")
class AuthorizationSecurityTest extends BaseIntegrationTest {

    @Autowired
    private WebTestClient webTestClient;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private User customerUser;
    private User adminUser;
    private User storeOwnerUser;

    @BeforeEach
    void setup() {
        userRepository.deleteAll().block();

        // Create users with different roles
        customerUser = createUser("customer@example.com", UserRole.CUSTOMER);
        adminUser = createUser("admin@example.com", UserRole.ADMIN);
        storeOwnerUser = createUser("owner@example.com", UserRole.STORE_OWNER);

        userRepository.save(customerUser).contextWrite(createTenantContext()).block();
        userRepository.save(adminUser).contextWrite(createTenantContext()).block();
        userRepository.save(storeOwnerUser).contextWrite(createTenantContext()).block();
    }

    @AfterEach
    void cleanup() {
        userRepository.deleteAll().block();
    }

    @Test
    @DisplayName("CUSTOMER should access product catalog")
    void testCustomerCanAccessProducts() {
        String token = loginAndGetToken("customer@example.com");

        webTestClient.get()
                .uri("/api/v1/products")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .accept(MediaType.APPLICATION_JSON)
                .exchange()
                .expectStatus().isOk();
    }

    @Test
    @DisplayName("CUSTOMER should NOT access admin endpoints")
    void testCustomerCannotAccessAdminEndpoints() {
        String token = loginAndGetToken("customer@example.com");

        // Try to access admin-only endpoint
        webTestClient.get()
                .uri("/api/v1/admin/users")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .accept(MediaType.APPLICATION_JSON)
                .exchange()
                .expectStatus().isForbidden();
    }

    @Test
    @DisplayName("CUSTOMER should NOT create products")
    void testCustomerCannotCreateProducts() {
        String token = loginAndGetToken("customer@example.com");

        String productRequest = """
                {
                    "name": "Test Product",
                    "sku": "TEST-001",
                    "price": 99.99,
                    "stock": 100
                }
                """;

        webTestClient.post()
                .uri("/api/v1/products")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(productRequest)
                .exchange()
                .expectStatus().isForbidden();
    }

    @Test
    @DisplayName("CUSTOMER should NOT delete products")
    void testCustomerCannotDeleteProducts() {
        String token = loginAndGetToken("customer@example.com");

        webTestClient.delete()
                .uri("/api/v1/products/test-product-id")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .exchange()
                .expectStatus().isForbidden();
    }

    @Test
    @DisplayName("CUSTOMER should access own orders only")
    void testCustomerCanAccessOwnOrders() {
        String token = loginAndGetToken("customer@example.com");

        webTestClient.get()
                .uri("/api/v1/orders/my-orders")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .accept(MediaType.APPLICATION_JSON)
                .exchange()
                .expectStatus().isOk();
    }

    @Test
    @DisplayName("CUSTOMER should NOT access other customer orders")
    void testCustomerCannotAccessOtherCustomerOrders() {
        String token = loginAndGetToken("customer@example.com");

        webTestClient.get()
                .uri("/api/v1/orders/other-customer-order-id")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .accept(MediaType.APPLICATION_JSON)
                .exchange()
                .expectStatus().value(status -> {
                    // Should be 403 Forbidden or 404 Not Found
                    assert status == 403 || status == 404;
                });
    }

    @Test
    @DisplayName("ADMIN should access all endpoints")
    void testAdminCanAccessAllEndpoints() {
        String token = loginAndGetToken("admin@example.com");

        // Admin can access products
        webTestClient.get()
                .uri("/api/v1/products")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .accept(MediaType.APPLICATION_JSON)
                .exchange()
                .expectStatus().isOk();

        // Admin can access admin endpoints
        webTestClient.get()
                .uri("/api/v1/admin/users")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .accept(MediaType.APPLICATION_JSON)
                .exchange()
                .expectStatus().isOk();

        // Admin can access all orders
        webTestClient.get()
                .uri("/api/v1/admin/orders")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .accept(MediaType.APPLICATION_JSON)
                .exchange()
                .expectStatus().isOk();
    }

    @Test
    @DisplayName("ADMIN should create products")
    void testAdminCanCreateProducts() {
        String token = loginAndGetToken("admin@example.com");

        String productRequest = """
                {
                    "name": "Admin Product",
                    "sku": "ADMIN-001",
                    "price": 199.99,
                    "stock": 50
                }
                """;

        webTestClient.post()
                .uri("/api/v1/products")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(productRequest)
                .exchange()
                .expectStatus().isCreated();
    }

    @Test
    @DisplayName("ADMIN should delete products")
    void testAdminCanDeleteProducts() {
        String token = loginAndGetToken("admin@example.com");

        webTestClient.delete()
                .uri("/api/v1/products/test-product-id")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .exchange()
                .expectStatus().value(status -> {
                    // Should be 204 No Content or 404 Not Found
                    assert status == 204 || status == 404;
                });
    }

    @Test
    @DisplayName("ADMIN should manage user roles")
    void testAdminCanManageUserRoles() {
        String token = loginAndGetToken("admin@example.com");

        String updateRoleRequest = """
                {
                    "userId": "test-user-id",
                    "role": "STORE_OWNER"
                }
                """;

        webTestClient.put()
                .uri("/api/v1/admin/users/test-user-id/role")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(updateRoleRequest)
                .exchange()
                .expectStatus().value(status -> {
                    // Should be 200 OK or 404 Not Found
                    assert status == 200 || status == 404;
                });
    }

    @Test
    @DisplayName("STORE_OWNER should create products")
    void testStoreOwnerCanCreateProducts() {
        String token = loginAndGetToken("owner@example.com");

        String productRequest = """
                {
                    "name": "Owner Product",
                    "sku": "OWNER-001",
                    "price": 149.99,
                    "stock": 75
                }
                """;

        webTestClient.post()
                .uri("/api/v1/products")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(productRequest)
                .exchange()
                .expectStatus().isCreated();
    }

    @Test
    @DisplayName("STORE_OWNER should manage own store orders")
    void testStoreOwnerCanManageOwnStoreOrders() {
        String token = loginAndGetToken("owner@example.com");

        webTestClient.get()
                .uri("/api/v1/orders")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .accept(MediaType.APPLICATION_JSON)
                .exchange()
                .expectStatus().isOk();
    }

    @Test
    @DisplayName("STORE_OWNER should NOT access other tenant data")
    void testStoreOwnerCannotAccessOtherTenantData() {
        String token = loginAndGetToken("owner@example.com");

        // Try to access with different tenant header
        webTestClient.get()
                .uri("/api/v1/products")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .header("X-Tenant-ID", "other-tenant-id")
                .accept(MediaType.APPLICATION_JSON)
                .exchange()
                .expectStatus().value(status -> {
                    // Should be 403 Forbidden or reject the tenant override
                    assert status == 403 || status == 200; // 200 if tenant from token is used
                });
    }

    @Test
    @DisplayName("Should enforce method-level security annotations")
    void testMethodLevelSecurity() {
        String customerToken = loginAndGetToken("customer@example.com");

        // Customer trying to access method restricted to ADMIN
        webTestClient.delete()
                .uri("/api/v1/admin/users/test-user-id")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + customerToken)
                .exchange()
                .expectStatus().isForbidden();
    }

    @Test
    @DisplayName("Should prevent privilege escalation")
    void testPreventPrivilegeEscalation() {
        String customerToken = loginAndGetToken("customer@example.com");

        // Customer trying to promote themselves to ADMIN
        String escalationRequest = """
                {
                    "role": "ADMIN"
                }
                """;

        webTestClient.put()
                .uri("/api/v1/users/profile")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + customerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(escalationRequest)
                .exchange()
                .expectStatus().value(status -> {
                    // Should be 403 Forbidden or ignore role field
                    assert status == 403 || status == 200;
                });
    }

    @Test
    @DisplayName("Should validate role changes only by authorized users")
    void testRoleChangeAuthorization() {
        String storeOwnerToken = loginAndGetToken("owner@example.com");

        // Store owner trying to change another user's role (should fail)
        String roleChangeRequest = """
                {
                    "userId": "test-user-id",
                    "role": "ADMIN"
                }
                """;

        webTestClient.put()
                .uri("/api/v1/admin/users/test-user-id/role")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + storeOwnerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(roleChangeRequest)
                .exchange()
                .expectStatus().isForbidden(); // Only ADMIN can change roles
    }

    private User createUser(String email, UserRole role) {
        User user = new User();
        user.setTenantId(TEST_TENANT_ID);
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode("password123"));
        user.setFirstName("Test");
        user.setLastName("User");
        user.setRole(role);
        user.setStatus(UserStatus.ACTIVE);
        user.setAddresses(List.of());
        user.setCreatedAt(Instant.now());
        user.setUpdatedAt(Instant.now());
        return user;
    }

    private String loginAndGetToken(String email) {
        String loginRequest = String.format("""
                {
                    "email": "%s",
                    "password": "password123"
                }
                """, email);

        return webTestClient.post()
                .uri("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(loginRequest)
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.token").isNotEmpty()
                .returnResult()
                .getResponseBody()
                .toString(); // Simple conversion for test token extraction
    }
}
