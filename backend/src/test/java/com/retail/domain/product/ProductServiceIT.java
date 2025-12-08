package com.retail.domain.product;

import com.retail.BaseTestConfiguration;
import com.retail.domain.tenant.Tenant;
import com.retail.infrastructure.persistence.ProductRepository;
import com.retail.infrastructure.persistence.TenantRepository;
import com.retail.security.tenant.TenantContext;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Integration test for ProductService with tenant isolation.
 * Verifies that products are properly isolated by tenant.
 */
@SpringBootTest
@ActiveProfiles("test")
@Import(BaseTestConfiguration.class)
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class ProductServiceIT {

    @Autowired
    private ProductService productService;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private TenantRepository tenantRepository;

    private static final String TENANT_A_ID = "tenant-a-test";
    private static final String TENANT_B_ID = "tenant-b-test";

    @BeforeEach
    void setup() {
        // Clean up any existing test data
        productRepository.deleteAll().block();
        tenantRepository.deleteAll().block();

        // Create test tenants
        Tenant tenantA = createTestTenant(TENANT_A_ID, "tenant-a");
        Tenant tenantB = createTestTenant(TENANT_B_ID, "tenant-b");

        tenantRepository.save(tenantA).block();
        tenantRepository.save(tenantB).block();
    }

    @Test
    @Order(1)
    @DisplayName("Should create product for specific tenant")
    void shouldCreateProductForTenant() {
        // Given
        Product product = createTestProduct("Product A", "SKU-A-001");

        // When & Then
        Mono<Product> result = productService.create(product)
            .contextWrite(TenantContext.withTenantId(TENANT_A_ID));

        StepVerifier.create(result)
            .assertNext(saved -> {
                Assertions.assertNotNull(saved.getId());
                Assertions.assertEquals(TENANT_A_ID, saved.getTenantId());
                Assertions.assertEquals("Product A", saved.getName());
                Assertions.assertEquals("SKU-A-001", saved.getSku());
                Assertions.assertNotNull(saved.getCreatedAt());
            })
            .verifyComplete();
    }

    @Test
    @Order(2)
    @DisplayName("Should isolate products by tenant")
    void shouldIsolateProductsByTenant() {
        // Given - Create products for Tenant A
        Product productA1 = createTestProduct("Product A1", "SKU-A-001");
        Product productA2 = createTestProduct("Product A2", "SKU-A-002");

        Flux.concat(
            productService.create(productA1),
            productService.create(productA2)
        ).contextWrite(TenantContext.withTenantId(TENANT_A_ID))
         .blockLast();

        // Given - Create products for Tenant B
        Product productB1 = createTestProduct("Product B1", "SKU-B-001");
        Product productB2 = createTestProduct("Product B2", "SKU-B-002");

        Flux.concat(
            productService.create(productB1),
            productService.create(productB2)
        ).contextWrite(TenantContext.withTenantId(TENANT_B_ID))
         .blockLast();

        // When - Query products for Tenant A
        Flux<Product> tenantAProducts = productService.findAll(PageRequest.of(0, 10))
            .contextWrite(TenantContext.withTenantId(TENANT_A_ID));

        // Then - Should only see Tenant A's products
        StepVerifier.create(tenantAProducts)
            .assertNext(product -> {
                Assertions.assertEquals(TENANT_A_ID, product.getTenantId());
                Assertions.assertTrue(product.getName().startsWith("Product A"));
            })
            .assertNext(product -> {
                Assertions.assertEquals(TENANT_A_ID, product.getTenantId());
                Assertions.assertTrue(product.getName().startsWith("Product A"));
            })
            .verifyComplete();

        // When - Query products for Tenant B
        Flux<Product> tenantBProducts = productService.findAll(PageRequest.of(0, 10))
            .contextWrite(TenantContext.withTenantId(TENANT_B_ID));

        // Then - Should only see Tenant B's products
        StepVerifier.create(tenantBProducts)
            .expectNextCount(2)
            .verifyComplete();
    }

    @Test
    @Order(3)
    @DisplayName("Should not find product from different tenant")
    void shouldNotFindProductFromDifferentTenant() {
        // Given - Create product for Tenant A
        Product product = createTestProduct("Product A", "SKU-A-001");
        String productId = productService.create(product)
            .contextWrite(TenantContext.withTenantId(TENANT_A_ID))
            .block()
            .getId();

        // When - Try to find product using Tenant B's context
        Mono<Product> result = productService.findById(productId)
            .contextWrite(TenantContext.withTenantId(TENANT_B_ID));

        // Then - Should not find the product
        StepVerifier.create(result)
            .verifyComplete(); // Empty result
    }

    @Test
    @Order(4)
    @DisplayName("Should update product only for correct tenant")
    void shouldUpdateProductOnlyForCorrectTenant() {
        // Given - Create product for Tenant A
        Product product = createTestProduct("Product A", "SKU-A-001");
        String productId = productService.create(product)
            .contextWrite(TenantContext.withTenantId(TENANT_A_ID))
            .block()
            .getId();

        // When - Update product with Tenant A's context
        Product updated = createTestProduct("Product A Updated", "SKU-A-001");
        Mono<Product> result = productService.update(productId, updated)
            .contextWrite(TenantContext.withTenantId(TENANT_A_ID));

        // Then - Update should succeed
        StepVerifier.create(result)
            .assertNext(saved -> {
                Assertions.assertEquals("Product A Updated", saved.getName());
                Assertions.assertEquals(TENANT_A_ID, saved.getTenantId());
            })
            .verifyComplete();

        // When - Try to update with Tenant B's context
        Mono<Product> failedUpdate = productService.update(productId, updated)
            .contextWrite(TenantContext.withTenantId(TENANT_B_ID));

        // Then - Update should fail (product not found for Tenant B)
        StepVerifier.create(failedUpdate)
            .verifyComplete(); // Empty result
    }

    @Test
    @Order(5)
    @DisplayName("Should delete product only for correct tenant")
    void shouldDeleteProductOnlyForCorrectTenant() {
        // Given - Create product for Tenant A
        Product product = createTestProduct("Product A", "SKU-A-001");
        String productId = productService.create(product)
            .contextWrite(TenantContext.withTenantId(TENANT_A_ID))
            .block()
            .getId();

        // When - Try to delete with Tenant B's context
        Mono<Void> failedDelete = productService.delete(productId)
            .contextWrite(TenantContext.withTenantId(TENANT_B_ID));

        // Then - Delete should not affect the product
        StepVerifier.create(failedDelete)
            .verifyComplete();

        // Verify product still exists for Tenant A
        Mono<Product> stillExists = productService.findById(productId)
            .contextWrite(TenantContext.withTenantId(TENANT_A_ID));

        StepVerifier.create(stillExists)
            .assertNext(found -> Assertions.assertEquals(productId, found.getId()))
            .verifyComplete();

        // When - Delete with correct tenant context
        Mono<Void> successfulDelete = productService.delete(productId)
            .contextWrite(TenantContext.withTenantId(TENANT_A_ID));

        // Then - Product should be deleted
        StepVerifier.create(successfulDelete)
            .verifyComplete();

        // Verify product is deleted
        Mono<Product> notFound = productService.findById(productId)
            .contextWrite(TenantContext.withTenantId(TENANT_A_ID));

        StepVerifier.create(notFound)
            .verifyComplete(); // Empty result
    }

    // Helper methods
    private Tenant createTestTenant(String id, String subdomain) {
        Tenant tenant = new Tenant();
        tenant.setId(id);
        tenant.setSubdomain(subdomain);
        tenant.setName("Test Store " + subdomain);
        tenant.setContactEmail("test@" + subdomain + ".com");
        tenant.setCreatedAt(Instant.now());
        tenant.setUpdatedAt(Instant.now());
        tenant.setBranding(new Tenant.Branding(null));
        tenant.setSettings(new Tenant.TenantSettings());
        return tenant;
    }

    private Product createTestProduct(String name, String sku) {
        Product product = new Product();
        product.setName(name);
        product.setSku(sku);
        product.setDescription("Test product description");
        product.setPrice(new BigDecimal("29.99"));
        product.setStock(100);
        product.setStatus(Product.ProductStatus.ACTIVE);
        return product;
    }
}
