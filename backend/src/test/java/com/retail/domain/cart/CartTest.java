package com.retail.domain.cart;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for Cart entity.
 * Tests Lombok-free implementation with Java records for nested classes.
 */
@DisplayName("Cart Entity Tests")
class CartTest {

    @Test
    @DisplayName("Should create cart with default values")
    void shouldCreateCartWithDefaults() {
        Cart cart = new Cart();

        assertNotNull(cart);
        assertEquals(0, cart.getItemCount());
        assertNotNull(cart.getItems());
    }

    @Test
    @DisplayName("Should set and get all fields correctly")
    void shouldSetAndGetAllFields() {
        Cart cart = new Cart();
        Instant now = Instant.now();
        Instant expires = now.plusSeconds(7 * 24 * 60 * 60); // 7 days

        Cart.CartSummary summary = new Cart.CartSummary(
            new BigDecimal("100.00"),
            new BigDecimal("8.50"),
            new BigDecimal("10.00"),
            new BigDecimal("118.50")
        );

        cart.setId("cart-123");
        cart.setTenantId("tenant-1");
        cart.setSessionId("session-abc");
        cart.setSummary(summary);
        cart.setItemCount(3);
        cart.setCreatedAt(now);
        cart.setUpdatedAt(now);
        cart.setExpiresAt(expires);

        assertEquals("cart-123", cart.getId());
        assertEquals("tenant-1", cart.getTenantId());
        assertEquals("session-abc", cart.getSessionId());
        assertEquals(summary, cart.getSummary());
        assertEquals(3, cart.getItemCount());
        assertEquals(now, cart.getCreatedAt());
        assertEquals(now, cart.getUpdatedAt());
        assertEquals(expires, cart.getExpiresAt());
    }

    @Test
    @DisplayName("CartItem record should work correctly")
    void cartItemRecordShouldWork() {
        Map<String, Object> attributes = new HashMap<>();
        attributes.put("color", "red");
        attributes.put("size", "large");

        Cart.CartItem item = new Cart.CartItem(
            "item-123",
            "prod-456",
            "Test Product",
            "SKU-001",
            new BigDecimal("29.99"),
            2,
            attributes,
            "https://example.com/image.jpg",
            new BigDecimal("59.98")
        );

        assertEquals("item-123", item.id());
        assertEquals("prod-456", item.productId());
        assertEquals("Test Product", item.name());
        assertEquals("SKU-001", item.sku());
        assertEquals(new BigDecimal("29.99"), item.price());
        assertEquals(2, item.quantity());
        assertEquals(2, item.attributes().size());
        assertEquals("https://example.com/image.jpg", item.imageUrl());
        assertEquals(new BigDecimal("59.98"), item.subtotal());
    }

    @Test
    @DisplayName("CartItem record should initialize empty attributes if null")
    void cartItemRecordShouldInitializeEmptyAttributes() {
        Cart.CartItem item = new Cart.CartItem(
            "item-123",
            "prod-456",
            "Test Product",
            "SKU-001",
            new BigDecimal("29.99"),
            2,
            null,  // null attributes
            "https://example.com/image.jpg",
            new BigDecimal("59.98")
        );

        assertNotNull(item.attributes());
        assertTrue(item.attributes().isEmpty());
    }

    @Test
    @DisplayName("CartSummary record should work correctly")
    void cartSummaryRecordShouldWork() {
        Cart.CartSummary summary = new Cart.CartSummary(
            new BigDecimal("100.00"),
            new BigDecimal("8.50"),
            new BigDecimal("10.00"),
            new BigDecimal("118.50")
        );

        assertEquals(new BigDecimal("100.00"), summary.subtotal());
        assertEquals(new BigDecimal("8.50"), summary.tax());
        assertEquals(new BigDecimal("10.00"), summary.shipping());
        assertEquals(new BigDecimal("118.50"), summary.total());
    }

    @Test
    @DisplayName("CartSummary record should initialize with zeros if null")
    void cartSummaryRecordShouldInitializeWithZerosIfNull() {
        Cart.CartSummary summary = new Cart.CartSummary(null, null, null, null);

        assertEquals(BigDecimal.ZERO, summary.subtotal());
        assertEquals(BigDecimal.ZERO, summary.tax());
        assertEquals(BigDecimal.ZERO, summary.shipping());
        assertEquals(BigDecimal.ZERO, summary.total());
    }

    @Test
    @DisplayName("Should handle cart items list")
    void shouldHandleCartItemsList() {
        Cart cart = new Cart();

        Cart.CartItem item1 = new Cart.CartItem(
            "item-1",
            "prod-1",
            "Product 1",
            "SKU-1",
            new BigDecimal("10.00"),
            1,
            new HashMap<>(),
            "image1.jpg",
            new BigDecimal("10.00")
        );

        Cart.CartItem item2 = new Cart.CartItem(
            "item-2",
            "prod-2",
            "Product 2",
            "SKU-2",
            new BigDecimal("20.00"),
            2,
            new HashMap<>(),
            "image2.jpg",
            new BigDecimal("40.00")
        );

        cart.setItems(Arrays.asList(item1, item2));
        cart.setItemCount(3);  // 1 + 2

        assertEquals(2, cart.getItems().size());
        assertEquals(3, cart.getItemCount());
        assertEquals("Product 1", cart.getItems().get(0).name());
        assertEquals("Product 2", cart.getItems().get(1).name());
    }

    @Test
    @DisplayName("Should calculate total from items")
    void shouldCalculateTotalFromItems() {
        Cart cart = new Cart();

        Cart.CartItem item1 = new Cart.CartItem(
            "item-1",
            "prod-1",
            "Product 1",
            "SKU-1",
            new BigDecimal("10.00"),
            1,
            new HashMap<>(),
            null,
            new BigDecimal("10.00")
        );

        Cart.CartItem item2 = new Cart.CartItem(
            "item-2",
            "prod-2",
            "Product 2",
            "SKU-2",
            new BigDecimal("25.00"),
            2,
            new HashMap<>(),
            null,
            new BigDecimal("50.00")
        );

        cart.setItems(Arrays.asList(item1, item2));

        BigDecimal subtotal = new BigDecimal("60.00");  // 10 + 50
        BigDecimal tax = new BigDecimal("5.10");        // 8.5%
        BigDecimal shipping = new BigDecimal("10.00");
        BigDecimal total = new BigDecimal("75.10");     // 60 + 5.10 + 10

        Cart.CartSummary summary = new Cart.CartSummary(subtotal, tax, shipping, total);
        cart.setSummary(summary);

        assertEquals(new BigDecimal("60.00"), cart.getSummary().subtotal());
        assertEquals(new BigDecimal("75.10"), cart.getSummary().total());
    }

    @Test
    @DisplayName("Should handle empty cart")
    void shouldHandleEmptyCart() {
        Cart cart = new Cart();

        Cart.CartSummary summary = new Cart.CartSummary(
            BigDecimal.ZERO,
            BigDecimal.ZERO,
            BigDecimal.ZERO,
            BigDecimal.ZERO
        );
        cart.setSummary(summary);
        cart.setItemCount(0);

        assertTrue(cart.getItems().isEmpty());
        assertEquals(0, cart.getItemCount());
        assertEquals(BigDecimal.ZERO, cart.getSummary().total());
    }

    @Test
    @DisplayName("Should implement equals correctly")
    void shouldImplementEqualsCorrectly() {
        Cart cart1 = new Cart();
        cart1.setId("cart-1");
        cart1.setTenantId("tenant-1");
        cart1.setSessionId("session-1");

        Cart cart2 = new Cart();
        cart2.setId("cart-1");
        cart2.setTenantId("tenant-1");
        cart2.setSessionId("session-1");

        Cart cart3 = new Cart();
        cart3.setId("cart-2");
        cart3.setTenantId("tenant-1");
        cart3.setSessionId("session-2");

        assertEquals(cart1, cart2);
        assertNotEquals(cart1, cart3);
        assertNotEquals(cart1, null);
        assertNotEquals(cart1, new Object());
    }

    @Test
    @DisplayName("Should implement hashCode correctly")
    void shouldImplementHashCodeCorrectly() {
        Cart cart1 = new Cart();
        cart1.setId("cart-1");
        cart1.setTenantId("tenant-1");
        cart1.setSessionId("session-1");

        Cart cart2 = new Cart();
        cart2.setId("cart-1");
        cart2.setTenantId("tenant-1");
        cart2.setSessionId("session-1");

        assertEquals(cart1.hashCode(), cart2.hashCode());
    }

    @Test
    @DisplayName("Should implement toString correctly")
    void shouldImplementToStringCorrectly() {
        Cart cart = new Cart();
        cart.setId("cart-1");
        cart.setTenantId("tenant-1");
        cart.setSessionId("session-1");
        cart.setItemCount(3);

        String toString = cart.toString();

        assertTrue(toString.contains("cart-1"));
        assertTrue(toString.contains("tenant-1"));
        assertTrue(toString.contains("session-1"));
        assertTrue(toString.contains("3"));
    }

    @Test
    @DisplayName("Should handle cart expiration")
    void shouldHandleCartExpiration() {
        Cart cart = new Cart();
        Instant now = Instant.now();
        Instant expires = now.plusSeconds(7 * 24 * 60 * 60); // 7 days

        cart.setCreatedAt(now);
        cart.setExpiresAt(expires);

        assertTrue(cart.getExpiresAt().isAfter(cart.getCreatedAt()));
        assertTrue(cart.getExpiresAt().isAfter(Instant.now()));
    }

    @Test
    @DisplayName("Should handle cart item with minimal fields")
    void shouldHandleCartItemWithMinimalFields() {
        Cart.CartItem item = new Cart.CartItem(
            null,  // id can be null initially
            "prod-123",
            "Simple Product",
            "SKU-123",
            new BigDecimal("19.99"),
            1,
            new HashMap<>(),
            null,  // no image
            new BigDecimal("19.99")
        );

        assertNull(item.id());
        assertNull(item.imageUrl());
        assertEquals("prod-123", item.productId());
        assertEquals("Simple Product", item.name());
        assertEquals(1, item.quantity());
    }
}
