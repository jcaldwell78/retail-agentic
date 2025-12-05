package com.retail.domain.order;

import com.retail.domain.order.OrderStatus;
import com.retail.domain.order.PaymentStatus;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for Order entity.
 * Tests Lombok-free implementation with Java records for nested classes.
 */
@DisplayName("Order Entity Tests")
class OrderTest {

    @Test
    @DisplayName("Should create order with default values")
    void shouldCreateOrderWithDefaults() {
        Order order = new Order();

        assertNotNull(order);
        assertEquals(OrderStatus.PENDING, order.getStatus());
        assertNotNull(order.getItems());
        assertNotNull(order.getStatusHistory());
    }

    @Test
    @DisplayName("Should set and get all fields correctly")
    void shouldSetAndGetAllFields() {
        Order order = new Order();
        Instant now = Instant.now();

        Order.Customer customer = new Order.Customer("test@example.com", "John Doe");
        Order.Address address = new Order.Address(
            "123 Main St",
            "Apt 4B",
            "Springfield",
            "IL",
            "62701",
            "USA"
        );

        order.setId("order-123");
        order.setTenantId("tenant-1");
        order.setOrderNumber("ORD-2024-001");
        order.setCustomer(customer);
        order.setShippingAddress(address);
        order.setStatus(OrderStatus.PROCESSING);
        order.setTrackingNumber("TRACK-123");
        order.setCreatedAt(now);
        order.setUpdatedAt(now);

        assertEquals("order-123", order.getId());
        assertEquals("tenant-1", order.getTenantId());
        assertEquals("ORD-2024-001", order.getOrderNumber());
        assertEquals(customer, order.getCustomer());
        assertEquals(address, order.getShippingAddress());
        assertEquals(OrderStatus.PROCESSING, order.getStatus());
        assertEquals("TRACK-123", order.getTrackingNumber());
        assertEquals(now, order.getCreatedAt());
        assertEquals(now, order.getUpdatedAt());
    }

    @Test
    @DisplayName("Customer record should work correctly")
    void customerRecordShouldWork() {
        Order.Customer customer = new Order.Customer(
            "john@example.com",
            "John Doe"
        );

        assertEquals("john@example.com", customer.email());
        assertEquals("John Doe", customer.name());
    }

    @Test
    @DisplayName("Address record should work correctly")
    void addressRecordShouldWork() {
        Order.Address address = new Order.Address(
            "123 Main St",
            "Suite 100",
            "Springfield",
            "IL",
            "62701",
            "USA"
        );

        assertEquals("123 Main St", address.line1());
        assertEquals("Suite 100", address.line2());
        assertEquals("Springfield", address.city());
        assertEquals("IL", address.state());
        assertEquals("62701", address.postalCode());
        assertEquals("USA", address.country());
    }

    @Test
    @DisplayName("Address record should handle null line2")
    void addressRecordShouldHandleNullLine2() {
        Order.Address address = new Order.Address(
            "123 Main St",
            null,
            "Springfield",
            "IL",
            "62701",
            "USA"
        );

        assertEquals("123 Main St", address.line1());
        assertNull(address.line2());
    }

    @Test
    @DisplayName("OrderItem record should work correctly")
    void orderItemRecordShouldWork() {
        Map<String, Object> attributes = new HashMap<>();
        attributes.put("color", "blue");
        attributes.put("size", "M");

        Order.OrderItem item = new Order.OrderItem(
            "prod-123",
            "Test Product",
            "SKU-001",
            new BigDecimal("29.99"),
            2,
            attributes,
            new BigDecimal("59.98")
        );

        assertEquals("prod-123", item.productId());
        assertEquals("Test Product", item.name());
        assertEquals("SKU-001", item.sku());
        assertEquals(new BigDecimal("29.99"), item.price());
        assertEquals(2, item.quantity());
        assertEquals(2, item.attributes().size());
        assertEquals(new BigDecimal("59.98"), item.subtotal());
    }

    @Test
    @DisplayName("OrderItem record should initialize empty attributes if null")
    void orderItemRecordShouldInitializeEmptyAttributes() {
        Order.OrderItem item = new Order.OrderItem(
            "prod-123",
            "Test Product",
            "SKU-001",
            new BigDecimal("29.99"),
            2,
            null,  // null attributes
            new BigDecimal("59.98")
        );

        assertNotNull(item.attributes());
        assertTrue(item.attributes().isEmpty());
    }

    @Test
    @DisplayName("Pricing record should work correctly")
    void pricingRecordShouldWork() {
        Order.Pricing pricing = new Order.Pricing(
            new BigDecimal("100.00"),
            new BigDecimal("10.00"),
            new BigDecimal("8.50"),
            new BigDecimal("118.50")
        );

        assertEquals(new BigDecimal("100.00"), pricing.subtotal());
        assertEquals(new BigDecimal("10.00"), pricing.shipping());
        assertEquals(new BigDecimal("8.50"), pricing.tax());
        assertEquals(new BigDecimal("118.50"), pricing.total());
    }

    @Test
    @DisplayName("Payment record should work correctly")
    void paymentRecordShouldWork() {
        Order.Payment payment = new Order.Payment(
            "credit_card",
            PaymentStatus.PAID,
            "txn_123456"
        );

        assertEquals("credit_card", payment.method());
        assertEquals(PaymentStatus.PAID, payment.status());
        assertEquals("txn_123456", payment.transactionId());
    }

    @Test
    @DisplayName("StatusHistoryEntry record should work correctly")
    void statusHistoryEntryRecordShouldWork() {
        Instant now = Instant.now();

        Order.StatusHistoryEntry entry = new Order.StatusHistoryEntry(
            OrderStatus.SHIPPED,
            now,
            "Order shipped via UPS"
        );

        assertEquals(OrderStatus.SHIPPED, entry.status());
        assertEquals(now, entry.timestamp());
        assertEquals("Order shipped via UPS", entry.note());
    }

    @Test
    @DisplayName("Should handle order items list")
    void shouldHandleOrderItemsList() {
        Order order = new Order();

        Order.OrderItem item1 = new Order.OrderItem(
            "prod-1",
            "Product 1",
            "SKU-1",
            new BigDecimal("10.00"),
            1,
            new HashMap<>(),
            new BigDecimal("10.00")
        );

        Order.OrderItem item2 = new Order.OrderItem(
            "prod-2",
            "Product 2",
            "SKU-2",
            new BigDecimal("20.00"),
            2,
            new HashMap<>(),
            new BigDecimal("40.00")
        );

        order.setItems(Arrays.asList(item1, item2));

        assertEquals(2, order.getItems().size());
        assertEquals("Product 1", order.getItems().get(0).name());
        assertEquals("Product 2", order.getItems().get(1).name());
    }

    @Test
    @DisplayName("Should handle status history")
    void shouldHandleStatusHistory() {
        Order order = new Order();
        Instant now = Instant.now();

        Order.StatusHistoryEntry entry1 = new Order.StatusHistoryEntry(
            OrderStatus.PENDING,
            now.minusSeconds(3600),
            "Order placed"
        );

        Order.StatusHistoryEntry entry2 = new Order.StatusHistoryEntry(
            OrderStatus.PROCESSING,
            now.minusSeconds(1800),
            "Payment confirmed"
        );

        Order.StatusHistoryEntry entry3 = new Order.StatusHistoryEntry(
            OrderStatus.SHIPPED,
            now,
            "Order shipped"
        );

        order.setStatusHistory(Arrays.asList(entry1, entry2, entry3));

        assertEquals(3, order.getStatusHistory().size());
        assertEquals(OrderStatus.PENDING, order.getStatusHistory().get(0).status());
        assertEquals(OrderStatus.PROCESSING, order.getStatusHistory().get(1).status());
        assertEquals(OrderStatus.SHIPPED, order.getStatusHistory().get(2).status());
    }

    @Test
    @DisplayName("Should implement equals correctly")
    void shouldImplementEqualsCorrectly() {
        Order order1 = new Order();
        order1.setId("order-1");
        order1.setTenantId("tenant-1");
        order1.setOrderNumber("ORD-001");

        Order order2 = new Order();
        order2.setId("order-1");
        order2.setTenantId("tenant-1");
        order2.setOrderNumber("ORD-001");

        Order order3 = new Order();
        order3.setId("order-2");
        order3.setTenantId("tenant-1");
        order3.setOrderNumber("ORD-002");

        assertEquals(order1, order2);
        assertNotEquals(order1, order3);
        assertNotEquals(order1, null);
        assertNotEquals(order1, new Object());
    }

    @Test
    @DisplayName("Should implement hashCode correctly")
    void shouldImplementHashCodeCorrectly() {
        Order order1 = new Order();
        order1.setId("order-1");
        order1.setTenantId("tenant-1");
        order1.setOrderNumber("ORD-001");

        Order order2 = new Order();
        order2.setId("order-1");
        order2.setTenantId("tenant-1");
        order2.setOrderNumber("ORD-001");

        assertEquals(order1.hashCode(), order2.hashCode());
    }

    @Test
    @DisplayName("Should implement toString correctly")
    void shouldImplementToStringCorrectly() {
        Order order = new Order();
        order.setId("order-1");
        order.setTenantId("tenant-1");
        order.setOrderNumber("ORD-001");
        order.setStatus(OrderStatus.PROCESSING);

        String toString = order.toString();

        assertTrue(toString.contains("order-1"));
        assertTrue(toString.contains("tenant-1"));
        assertTrue(toString.contains("ORD-001"));
        assertTrue(toString.contains("PROCESSING"));
    }

    @Test
    @DisplayName("Should handle all order statuses")
    void shouldHandleAllOrderStatuses() {
        Order order = new Order();

        order.setStatus(OrderStatus.PENDING);
        assertEquals(OrderStatus.PENDING, order.getStatus());

        order.setStatus(OrderStatus.PROCESSING);
        assertEquals(OrderStatus.PROCESSING, order.getStatus());

        order.setStatus(OrderStatus.SHIPPED);
        assertEquals(OrderStatus.SHIPPED, order.getStatus());

        order.setStatus(OrderStatus.DELIVERED);
        assertEquals(OrderStatus.DELIVERED, order.getStatus());

        order.setStatus(OrderStatus.CANCELLED);
        assertEquals(OrderStatus.CANCELLED, order.getStatus());
    }

    @Test
    @DisplayName("Should handle all payment statuses")
    void shouldHandleAllPaymentStatuses() {
        Order.Payment payment1 = new Order.Payment("card", PaymentStatus.PENDING, null);
        assertEquals(PaymentStatus.PENDING, payment1.status());

        Order.Payment payment2 = new Order.Payment("card", PaymentStatus.PAID, "txn-1");
        assertEquals(PaymentStatus.PAID, payment2.status());

        Order.Payment payment3 = new Order.Payment("card", PaymentStatus.FAILED, null);
        assertEquals(PaymentStatus.FAILED, payment3.status());

        Order.Payment payment4 = new Order.Payment("card", PaymentStatus.REFUNDED, "txn-2");
        assertEquals(PaymentStatus.REFUNDED, payment4.status());
    }
}
