package com.retail.infrastructure.persistence;

import com.retail.domain.product.Product;
import com.retail.security.tenant.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;
import reactor.test.StepVerifier;
import reactor.util.context.Context;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Integration tests for ProductRepository.
 * Tests tenant-aware repository operations with MongoDB.
 */
@SpringBootTest
@ActiveProfiles("test")
@Import(com.retail.BaseTestConfiguration.class)
class ProductRepositoryIntegrationTest {

    @Autowired
    private ProductRepository productRepository;

    private static final String TEST_TENANT_ID = "test-tenant-001";

    private Product testProduct1;
    private Product testProduct2;
    private Product testProduct3;

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

    @BeforeEach
    void setupTestData() {
        // Create test products for tenant 1
        testProduct1 = createProduct(
                "prod-001",
                "Wireless Headphones",
                "HEADPHONE-001",
                BigDecimal.valueOf(99.99),
                50,
                Product.ProductStatus.ACTIVE,
                List.of("Electronics", "Audio")
        );

        testProduct2 = createProduct(
                "prod-002",
                "Smart Watch",
                "WATCH-001",
                BigDecimal.valueOf(249.99),
                30,
                Product.ProductStatus.ACTIVE,
                List.of("Electronics", "Wearables")
        );

        testProduct3 = createProduct(
                "prod-003",
                "Laptop Stand",
                "STAND-001",
                BigDecimal.valueOf(49.99),
                5, // Low stock
                Product.ProductStatus.ACTIVE,
                List.of("Electronics", "Accessories")
        );

        // Save all products
        productRepository.save(testProduct1)
                .then(productRepository.save(testProduct2))
                .then(productRepository.save(testProduct3))
                .contextWrite(createTenantContext())
                .block();
    }

    @AfterEach
    void cleanup() {
        productRepository.deleteAll()
                .contextWrite(createTenantContext())
                .block();
    }

    @Test
    void testSaveAndFindById() {
        Product newProduct = createProduct(
                "prod-004",
                "USB Cable",
                "CABLE-001",
                BigDecimal.valueOf(19.99),
                100,
                Product.ProductStatus.ACTIVE,
                List.of("Electronics", "Accessories")
        );

        StepVerifier.create(
                productRepository.save(newProduct)
                        .flatMap(saved -> productRepository.findById(saved.getId()))
                        .contextWrite(createTenantContext())
        )
                .assertNext(found -> {
                    assertThat(found).isNotNull();
                    assertThat(found.getName()).isEqualTo("USB Cable");
                    assertThat(found.getSku()).isEqualTo("CABLE-001");
                    assertThat(found.getTenantId()).isEqualTo(TEST_TENANT_ID);
                })
                .verifyComplete();
    }

    @Test
    void testFindBySku() {
        StepVerifier.create(
                productRepository.findBySku("HEADPHONE-001")
                        .contextWrite(createTenantContext())
        )
                .assertNext(product -> {
                    assertThat(product).isNotNull();
                    assertThat(product.getName()).isEqualTo("Wireless Headphones");
                    assertThat(product.getSku()).isEqualTo("HEADPHONE-001");
                })
                .verifyComplete();
    }

    @Test
    void testFindBySkuNotFound() {
        StepVerifier.create(
                productRepository.findBySku("NON-EXISTENT")
                        .contextWrite(createTenantContext())
        )
                .verifyComplete();
    }

    @Test
    void testFindActiveProducts() {
        StepVerifier.create(
                productRepository.findActiveProducts(PageRequest.of(0, 10))
                        .contextWrite(createTenantContext())
        )
                .expectNextCount(3)
                .verifyComplete();
    }

    @Test
    void testFindByCategory() {
        StepVerifier.create(
                productRepository.findByCategory("Wearables", PageRequest.of(0, 10))
                        .contextWrite(createTenantContext())
        )
                .assertNext(product -> {
                    assertThat(product.getName()).isEqualTo("Smart Watch");
                    assertThat(product.getCategory()).contains("Wearables");
                })
                .verifyComplete();
    }

    @Test
    void testFindByCategoryMultipleResults() {
        StepVerifier.create(
                productRepository.findByCategory("Electronics", PageRequest.of(0, 10))
                        .contextWrite(createTenantContext())
        )
                .expectNextCount(3)
                .verifyComplete();
    }

    @Test
    void testFindLowStockProducts() {
        StepVerifier.create(
                productRepository.findLowStockProducts(10)
                        .contextWrite(createTenantContext())
        )
                .assertNext(product -> {
                    assertThat(product.getName()).isEqualTo("Laptop Stand");
                    assertThat(product.getStock()).isLessThanOrEqualTo(10);
                })
                .verifyComplete();
    }

    @Test
    void testCountActiveProducts() {
        StepVerifier.create(
                productRepository.countActiveProducts()
                        .contextWrite(createTenantContext())
        )
                .assertNext(count -> assertThat(count).isEqualTo(3))
                .verifyComplete();
    }

    @Test
    void testTenantIsolation() {
        // Create product for different tenant
        Product otherTenantProduct = createProduct(
                "other-prod-001",
                "Other Tenant Product",
                "OTHER-001",
                BigDecimal.valueOf(99.99),
                50,
                Product.ProductStatus.ACTIVE,
                List.of("Test")
        );

        String otherTenantId = "other-tenant-002";
        otherTenantProduct.setTenantId(otherTenantId);

        // Save product for other tenant
        productRepository.save(otherTenantProduct)
                .contextWrite(createTenantContext(otherTenantId))
                .block();

        // Verify tenant 1 cannot see other tenant's product
        StepVerifier.create(
                productRepository.findBySku("OTHER-001")
                        .contextWrite(createTenantContext(TEST_TENANT_ID))
        )
                .verifyComplete();

        // Verify other tenant can see their product
        StepVerifier.create(
                productRepository.findBySku("OTHER-001")
                        .contextWrite(createTenantContext(otherTenantId))
        )
                .assertNext(product -> {
                    assertThat(product.getName()).isEqualTo("Other Tenant Product");
                    assertThat(product.getTenantId()).isEqualTo(otherTenantId);
                })
                .verifyComplete();

        // Cleanup
        productRepository.deleteByIdAndTenantId(otherTenantProduct.getId(), otherTenantId)
                .block();
    }

    @Test
    void testDeleteProduct() {
        StepVerifier.create(
                productRepository.findBySku("HEADPHONE-001")
                        .flatMap(product -> productRepository.deleteByIdAndTenantId(
                                product.getId(),
                                TEST_TENANT_ID
                        ))
                        .then(productRepository.findBySku("HEADPHONE-001"))
                        .contextWrite(createTenantContext())
        )
                .verifyComplete();
    }

    @Test
    void testUpdateProduct() {
        StepVerifier.create(
                productRepository.findBySku("HEADPHONE-001")
                        .flatMap(product -> {
                            product.setPrice(BigDecimal.valueOf(89.99));
                            product.setStock(60);
                            return productRepository.save(product);
                        })
                        .flatMap(updated -> productRepository.findById(updated.getId()))
                        .contextWrite(createTenantContext())
        )
                .assertNext(product -> {
                    assertThat(product.getPrice()).isEqualByComparingTo(BigDecimal.valueOf(89.99));
                    assertThat(product.getStock()).isEqualTo(60);
                })
                .verifyComplete();
    }

    @Test
    void testFindWithPagination() {
        StepVerifier.create(
                productRepository.findActiveProducts(PageRequest.of(0, 2))
                        .contextWrite(createTenantContext())
        )
                .expectNextCount(2)
                .verifyComplete();
    }

    private Product createProduct(
            String id,
            String name,
            String sku,
            BigDecimal price,
            int stock,
            Product.ProductStatus status,
            List<String> category
    ) {
        Product product = new Product();
        product.setId(id);
        product.setTenantId(TEST_TENANT_ID);
        product.setName(name);
        product.setSku(sku);
        product.setDescription("Test product: " + name);
        product.setPrice(price);
        product.setStock(stock);
        product.setStatus(status);
        product.setCategory(category);
        product.setCreatedAt(Instant.now());
        product.setUpdatedAt(Instant.now());
        return product;
    }
}
