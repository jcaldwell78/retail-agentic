package com.retail.domain.product;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for Product entity.
 * Tests Lombok-free implementation with Java records.
 */
@DisplayName("Product Entity Tests")
class ProductTest {

    @Test
    @DisplayName("Should create product with default values")
    void shouldCreateProductWithDefaults() {
        Product product = new Product();

        assertNotNull(product);
        assertEquals("USD", product.getCurrency());
        assertEquals(0, product.getStock());
        assertEquals(Product.ProductStatus.ACTIVE, product.getStatus());
        assertNotNull(product.getCategory());
        assertNotNull(product.getImages());
        assertNotNull(product.getAttributes());
    }

    @Test
    @DisplayName("Should set and get all fields correctly")
    void shouldSetAndGetAllFields() {
        Product product = new Product();
        Instant now = Instant.now();

        product.setId("prod-123");
        product.setTenantId("tenant-1");
        product.setName("Test Product");
        product.setSku("SKU-001");
        product.setDescription("Test Description");
        product.setPrice(new BigDecimal("29.99"));
        product.setCurrency("EUR");
        product.setCategory(Arrays.asList("electronics", "gadgets"));
        product.setStock(100);
        product.setStatus(Product.ProductStatus.INACTIVE);
        product.setCreatedAt(now);
        product.setUpdatedAt(now);

        assertEquals("prod-123", product.getId());
        assertEquals("tenant-1", product.getTenantId());
        assertEquals("Test Product", product.getName());
        assertEquals("SKU-001", product.getSku());
        assertEquals("Test Description", product.getDescription());
        assertEquals(new BigDecimal("29.99"), product.getPrice());
        assertEquals("EUR", product.getCurrency());
        assertEquals(2, product.getCategory().size());
        assertEquals(100, product.getStock());
        assertEquals(Product.ProductStatus.INACTIVE, product.getStatus());
        assertEquals(now, product.getCreatedAt());
        assertEquals(now, product.getUpdatedAt());
    }

    @Test
    @DisplayName("Should handle dynamic attributes correctly")
    void shouldHandleDynamicAttributes() {
        Product product = new Product();
        Map<String, Object> attributes = new HashMap<>();
        attributes.put("color", "red");
        attributes.put("size", "large");
        attributes.put("weight", 1.5);

        product.setAttributes(attributes);

        assertEquals(3, product.getAttributes().size());
        assertEquals("red", product.getAttributes().get("color"));
        assertEquals("large", product.getAttributes().get("size"));
        assertEquals(1.5, product.getAttributes().get("weight"));
    }

    @Test
    @DisplayName("Should handle product images correctly")
    void shouldHandleProductImages() {
        Product product = new Product();

        Product.ProductImage image1 = new Product.ProductImage(
            "https://example.com/image1.jpg",
            "Product front view",
            1
        );

        Product.ProductImage image2 = new Product.ProductImage(
            "https://example.com/image2.jpg",
            "Product side view",
            2
        );

        product.setImages(Arrays.asList(image1, image2));

        assertEquals(2, product.getImages().size());
        assertEquals("https://example.com/image1.jpg", product.getImages().get(0).url());
        assertEquals("Product front view", product.getImages().get(0).alt());
        assertEquals(1, product.getImages().get(0).order());
    }

    @Test
    @DisplayName("ProductImage record should work correctly")
    void productImageRecordShouldWork() {
        Product.ProductImage image = new Product.ProductImage(
            "https://example.com/test.jpg",
            "Test image",
            1
        );

        assertEquals("https://example.com/test.jpg", image.url());
        assertEquals("Test image", image.alt());
        assertEquals(1, image.order());
    }

    @Test
    @DisplayName("Should implement equals correctly")
    void shouldImplementEqualsCorrectly() {
        Product product1 = new Product();
        product1.setId("prod-1");
        product1.setTenantId("tenant-1");
        product1.setSku("SKU-001");

        Product product2 = new Product();
        product2.setId("prod-1");
        product2.setTenantId("tenant-1");
        product2.setSku("SKU-001");

        Product product3 = new Product();
        product3.setId("prod-2");
        product3.setTenantId("tenant-1");
        product3.setSku("SKU-002");

        assertEquals(product1, product2);
        assertNotEquals(product1, product3);
        assertNotEquals(product1, null);
        assertNotEquals(product1, new Object());
    }

    @Test
    @DisplayName("Should implement hashCode correctly")
    void shouldImplementHashCodeCorrectly() {
        Product product1 = new Product();
        product1.setId("prod-1");
        product1.setTenantId("tenant-1");
        product1.setSku("SKU-001");

        Product product2 = new Product();
        product2.setId("prod-1");
        product2.setTenantId("tenant-1");
        product2.setSku("SKU-001");

        assertEquals(product1.hashCode(), product2.hashCode());
    }

    @Test
    @DisplayName("Should implement toString correctly")
    void shouldImplementToStringCorrectly() {
        Product product = new Product();
        product.setId("prod-1");
        product.setTenantId("tenant-1");
        product.setName("Test Product");
        product.setSku("SKU-001");
        product.setPrice(new BigDecimal("29.99"));
        product.setStock(100);
        product.setStatus(Product.ProductStatus.ACTIVE);

        String toString = product.toString();

        assertTrue(toString.contains("prod-1"));
        assertTrue(toString.contains("tenant-1"));
        assertTrue(toString.contains("Test Product"));
        assertTrue(toString.contains("SKU-001"));
        assertTrue(toString.contains("29.99"));
        assertTrue(toString.contains("100"));
        assertTrue(toString.contains("ACTIVE"));
    }

    @Test
    @DisplayName("Should handle null values gracefully")
    void shouldHandleNullValues() {
        Product product = new Product();

        product.setId(null);
        product.setDescription(null);
        product.setCreatedAt(null);

        assertNull(product.getId());
        assertNull(product.getDescription());
        assertNull(product.getCreatedAt());
    }

    @Test
    @DisplayName("Should handle all product statuses")
    void shouldHandleAllProductStatuses() {
        Product product = new Product();

        product.setStatus(Product.ProductStatus.ACTIVE);
        assertEquals(Product.ProductStatus.ACTIVE, product.getStatus());

        product.setStatus(Product.ProductStatus.INACTIVE);
        assertEquals(Product.ProductStatus.INACTIVE, product.getStatus());

        product.setStatus(Product.ProductStatus.DISCONTINUED);
        assertEquals(Product.ProductStatus.DISCONTINUED, product.getStatus());
    }
}
