package com.retail.domain.product;

import com.retail.infrastructure.persistence.ProductRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;
import reactor.util.context.Context;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for ProductService with mocked dependencies.
 * Tests business logic without database integration.
 */
@ExtendWith(MockitoExtension.class)
class ProductServiceUnitTest {

    @Mock
    private ProductRepository productRepository;

    @InjectMocks
    private ProductService productService;

    private static final String TEST_TENANT_ID = "test-tenant-001";
    private static final String PRODUCT_ID = "product-123";
    private static final String PRODUCT_SKU = "TEST-SKU-001";

    private Product testProduct;

    @BeforeEach
    void setUp() {
        testProduct = createProduct(PRODUCT_ID, "Test Product", PRODUCT_SKU, 100);
    }

    @Test
    @DisplayName("findAll - should return products for tenant")
    void testFindAll() {
        // Given
        Pageable pageable = PageRequest.of(0, 10);
        Product product1 = createProduct("1", "Product 1", "SKU-1", 50);
        Product product2 = createProduct("2", "Product 2", "SKU-2", 75);

        when(productRepository.findByTenantId(eq(TEST_TENANT_ID), eq(pageable)))
                .thenReturn(Flux.just(product1, product2));

        // When
        Flux<Product> result = productService.findAll(pageable)
                .contextWrite(Context.of("tenantId", TEST_TENANT_ID));

        // Then
        StepVerifier.create(result)
                .expectNext(product1)
                .expectNext(product2)
                .verifyComplete();

        verify(productRepository).findByTenantId(TEST_TENANT_ID, pageable);
    }

    @Test
    @DisplayName("findById - should return product when exists")
    void testFindById() {
        // Given
        when(productRepository.findByIdAndTenantId(PRODUCT_ID, TEST_TENANT_ID))
                .thenReturn(Mono.just(testProduct));

        // When
        Mono<Product> result = productService.findById(PRODUCT_ID)
                .contextWrite(Context.of("tenantId", TEST_TENANT_ID));

        // Then
        StepVerifier.create(result)
                .expectNext(testProduct)
                .verifyComplete();

        verify(productRepository).findByIdAndTenantId(PRODUCT_ID, TEST_TENANT_ID);
    }

    @Test
    @DisplayName("findById - should return empty when not found")
    void testFindByIdNotFound() {
        // Given
        when(productRepository.findByIdAndTenantId(PRODUCT_ID, TEST_TENANT_ID))
                .thenReturn(Mono.empty());

        // When
        Mono<Product> result = productService.findById(PRODUCT_ID)
                .contextWrite(Context.of("tenantId", TEST_TENANT_ID));

        // Then
        StepVerifier.create(result)
                .verifyComplete();

        verify(productRepository).findByIdAndTenantId(PRODUCT_ID, TEST_TENANT_ID);
    }

    @Test
    @DisplayName("findBySku - should return product when exists")
    void testFindBySku() {
        // Given
        when(productRepository.findBySkuAndTenantId(PRODUCT_SKU, TEST_TENANT_ID))
                .thenReturn(Mono.just(testProduct));

        // When
        Mono<Product> result = productService.findBySku(PRODUCT_SKU)
                .contextWrite(Context.of("tenantId", TEST_TENANT_ID));

        // Then
        StepVerifier.create(result)
                .expectNext(testProduct)
                .verifyComplete();

        verify(productRepository).findBySkuAndTenantId(PRODUCT_SKU, TEST_TENANT_ID);
    }

    @Test
    @DisplayName("findActiveProducts - should return only active products")
    void testFindActiveProducts() {
        // Given
        Pageable pageable = PageRequest.of(0, 10);
        Product activeProduct = createProduct("1", "Active Product", "SKU-1", 50);
        activeProduct.setStatus(Product.ProductStatus.ACTIVE);

        when(productRepository.findActiveProducts(pageable))
                .thenReturn(Flux.just(activeProduct));

        // When
        Flux<Product> result = productService.findActiveProducts(pageable);

        // Then
        StepVerifier.create(result)
                .expectNext(activeProduct)
                .verifyComplete();

        verify(productRepository).findActiveProducts(pageable);
    }

    @Test
    @DisplayName("findByCategory - should return products in category")
    void testFindByCategory() {
        // Given
        String category = "Electronics";
        Pageable pageable = PageRequest.of(0, 10);
        Product product1 = createProduct("1", "Laptop", "SKU-1", 50);
        product1.setCategory(List.of("Electronics"));

        when(productRepository.findByTenantIdAndCategoryContaining(TEST_TENANT_ID, category, pageable))
                .thenReturn(Flux.just(product1));

        // When
        Flux<Product> result = productService.findByCategory(category, pageable)
                .contextWrite(Context.of("tenantId", TEST_TENANT_ID));

        // Then
        StepVerifier.create(result)
                .expectNext(product1)
                .verifyComplete();

        verify(productRepository).findByTenantIdAndCategoryContaining(TEST_TENANT_ID, category, pageable);
    }

    @Test
    @DisplayName("findLowStockProducts - should return products below threshold")
    void testFindLowStockProducts() {
        // Given
        int threshold = 10;
        Product lowStockProduct = createProduct("1", "Low Stock Item", "SKU-1", 5);

        when(productRepository.findLowStockProducts(threshold))
                .thenReturn(Flux.just(lowStockProduct));

        // When
        Flux<Product> result = productService.findLowStockProducts(threshold);

        // Then
        StepVerifier.create(result)
                .expectNext(lowStockProduct)
                .verifyComplete();

        verify(productRepository).findLowStockProducts(threshold);
    }

    @Test
    @DisplayName("create - should set tenant ID and timestamps")
    void testCreate() {
        // Given
        Product newProduct = new Product();
        newProduct.setName("New Product");
        newProduct.setSku("NEW-SKU-001");
        newProduct.setPrice(BigDecimal.valueOf(99.99));
        newProduct.setStock(100);

        ArgumentCaptor<Product> productCaptor = ArgumentCaptor.forClass(Product.class);
        when(productRepository.save(any(Product.class)))
                .thenAnswer(invocation -> Mono.just(invocation.getArgument(0)));

        // When
        Mono<Product> result = productService.create(newProduct)
                .contextWrite(Context.of("tenantId", TEST_TENANT_ID));

        // Then
        StepVerifier.create(result)
                .assertNext(created -> {
                    assertThat(created.getTenantId()).isEqualTo(TEST_TENANT_ID);
                    assertThat(created.getCreatedAt()).isNotNull();
                    assertThat(created.getUpdatedAt()).isNotNull();
                    assertThat(created.getName()).isEqualTo("New Product");
                })
                .verifyComplete();

        verify(productRepository).save(productCaptor.capture());
        Product savedProduct = productCaptor.getValue();
        assertThat(savedProduct.getTenantId()).isEqualTo(TEST_TENANT_ID);
        assertThat(savedProduct.getCreatedAt()).isNotNull();
        assertThat(savedProduct.getUpdatedAt()).isNotNull();
    }

    @Test
    @DisplayName("update - should preserve tenant ID and created date")
    void testUpdate() {
        // Given
        Product existingProduct = createProduct(PRODUCT_ID, "Old Name", PRODUCT_SKU, 50);
        existingProduct.setCreatedAt(Instant.now().minusSeconds(3600));

        Product updateData = new Product();
        updateData.setName("Updated Name");
        updateData.setSku(PRODUCT_SKU);
        updateData.setPrice(BigDecimal.valueOf(149.99));
        updateData.setStock(200);

        when(productRepository.findByIdAndTenantId(PRODUCT_ID, TEST_TENANT_ID))
                .thenReturn(Mono.just(existingProduct));

        ArgumentCaptor<Product> productCaptor = ArgumentCaptor.forClass(Product.class);
        when(productRepository.save(any(Product.class)))
                .thenAnswer(invocation -> Mono.just(invocation.getArgument(0)));

        // When
        Mono<Product> result = productService.update(PRODUCT_ID, updateData)
                .contextWrite(Context.of("tenantId", TEST_TENANT_ID));

        // Then
        StepVerifier.create(result)
                .assertNext(updated -> {
                    assertThat(updated.getId()).isEqualTo(PRODUCT_ID);
                    assertThat(updated.getTenantId()).isEqualTo(TEST_TENANT_ID);
                    assertThat(updated.getName()).isEqualTo("Updated Name");
                    assertThat(updated.getCreatedAt()).isEqualTo(existingProduct.getCreatedAt());
                    assertThat(updated.getUpdatedAt()).isAfter(updated.getCreatedAt());
                })
                .verifyComplete();

        verify(productRepository).findByIdAndTenantId(PRODUCT_ID, TEST_TENANT_ID);
        verify(productRepository).save(productCaptor.capture());

        Product savedProduct = productCaptor.getValue();
        assertThat(savedProduct.getTenantId()).isEqualTo(TEST_TENANT_ID);
        assertThat(savedProduct.getCreatedAt()).isEqualTo(existingProduct.getCreatedAt());
    }

    @Test
    @DisplayName("update - should return empty when product not found")
    void testUpdateNotFound() {
        // Given
        Product updateData = new Product();
        updateData.setName("Updated Name");

        when(productRepository.findByIdAndTenantId(PRODUCT_ID, TEST_TENANT_ID))
                .thenReturn(Mono.empty());

        // When
        Mono<Product> result = productService.update(PRODUCT_ID, updateData)
                .contextWrite(Context.of("tenantId", TEST_TENANT_ID));

        // Then
        StepVerifier.create(result)
                .verifyComplete();

        verify(productRepository).findByIdAndTenantId(PRODUCT_ID, TEST_TENANT_ID);
        verify(productRepository, never()).save(any());
    }

    @Test
    @DisplayName("delete - should delete product by ID and tenant")
    void testDelete() {
        // Given
        when(productRepository.deleteByIdAndTenantId(PRODUCT_ID, TEST_TENANT_ID))
                .thenReturn(Mono.empty());

        // When
        Mono<Void> result = productService.delete(PRODUCT_ID)
                .contextWrite(Context.of("tenantId", TEST_TENANT_ID));

        // Then
        StepVerifier.create(result)
                .verifyComplete();

        verify(productRepository).deleteByIdAndTenantId(PRODUCT_ID, TEST_TENANT_ID);
    }

    @Test
    @DisplayName("count - should return product count for tenant")
    void testCount() {
        // Given
        when(productRepository.countByTenantId(TEST_TENANT_ID))
                .thenReturn(Mono.just(42L));

        // When
        Mono<Long> result = productService.count()
                .contextWrite(Context.of("tenantId", TEST_TENANT_ID));

        // Then
        StepVerifier.create(result)
                .expectNext(42L)
                .verifyComplete();

        verify(productRepository).countByTenantId(TEST_TENANT_ID);
    }

    @Test
    @DisplayName("countActive - should return active product count")
    void testCountActive() {
        // Given
        when(productRepository.countActiveProducts())
                .thenReturn(Mono.just(30L));

        // When
        Mono<Long> result = productService.countActive();

        // Then
        StepVerifier.create(result)
                .expectNext(30L)
                .verifyComplete();

        verify(productRepository).countActiveProducts();
    }

    private Product createProduct(String id, String name, String sku, int stock) {
        Product product = new Product();
        product.setId(id);
        product.setTenantId(TEST_TENANT_ID);
        product.setName(name);
        product.setSku(sku);
        product.setDescription("Test description");
        product.setPrice(BigDecimal.valueOf(99.99));
        product.setStock(stock);
        product.setStatus(Product.ProductStatus.ACTIVE);
        product.setCategory(List.of("Test"));
        product.setCreatedAt(Instant.now());
        product.setUpdatedAt(Instant.now());
        return product;
    }
}
