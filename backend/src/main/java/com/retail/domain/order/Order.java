package com.retail.domain.order;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

/**
 * Order entity representing a customer purchase.
 * Includes embedded line items and status tracking.
 */
@Document(collection = "orders")
@CompoundIndexes({
    @CompoundIndex(name = "tenant_order_number_idx", def = "{'tenantId': 1, 'orderNumber': 1}", unique = true),
    @CompoundIndex(name = "tenant_status_created_idx", def = "{'tenantId': 1, 'status': 1, 'createdAt': -1}"),
    @CompoundIndex(name = "tenant_customer_email_idx", def = "{'tenantId': 1, 'customer.email': 1}")
})
public class Order {

    @Id
    private String id;

    @Indexed
    @NotBlank(message = "Tenant ID is required")
    private String tenantId;

    @NotBlank(message = "Order number is required")
    private String orderNumber;

    @NotNull(message = "Customer is required")
    private Customer customer;

    @NotNull(message = "Shipping address is required")
    private Address shippingAddress;

    @NotEmpty(message = "Order must have at least one item")
    private List<OrderItem> items = new ArrayList<>();

    @NotNull(message = "Pricing is required")
    private Pricing pricing;

    @NotNull(message = "Payment is required")
    private Payment payment;

    @NotNull(message = "Status is required")
    private OrderStatus status = Order.OrderStatus.PENDING;

    private List<StatusHistoryEntry> statusHistory = new ArrayList<>();

    private String trackingNumber;

    private Instant createdAt;
    private Instant updatedAt;

    // Constructors
    public Order() {
    }

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getTenantId() {
        return tenantId;
    }

    public void setTenantId(String tenantId) {
        this.tenantId = tenantId;
    }

    public String getOrderNumber() {
        return orderNumber;
    }

    public void setOrderNumber(String orderNumber) {
        this.orderNumber = orderNumber;
    }

    public Customer getCustomer() {
        return customer;
    }

    public void setCustomer(Customer customer) {
        this.customer = customer;
    }

    public Address getShippingAddress() {
        return shippingAddress;
    }

    public void setShippingAddress(Address shippingAddress) {
        this.shippingAddress = shippingAddress;
    }

    public List<OrderItem> getItems() {
        return items;
    }

    public void setItems(List<OrderItem> items) {
        this.items = items;
    }

    public Pricing getPricing() {
        return pricing;
    }

    public void setPricing(Pricing pricing) {
        this.pricing = pricing;
    }

    public Payment getPayment() {
        return payment;
    }

    public void setPayment(Payment payment) {
        this.payment = payment;
    }

    public OrderStatus getStatus() {
        return status;
    }

    public void setStatus(OrderStatus status) {
        this.status = status;
    }

    public List<StatusHistoryEntry> getStatusHistory() {
        return statusHistory;
    }

    public void setStatusHistory(List<StatusHistoryEntry> statusHistory) {
        this.statusHistory = statusHistory;
    }

    public String getTrackingNumber() {
        return trackingNumber;
    }

    public void setTrackingNumber(String trackingNumber) {
        this.trackingNumber = trackingNumber;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }

    // equals, hashCode, and toString
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Order order = (Order) o;
        return Objects.equals(id, order.id) &&
               Objects.equals(tenantId, order.tenantId) &&
               Objects.equals(orderNumber, order.orderNumber);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, tenantId, orderNumber);
    }

    @Override
    public String toString() {
        return "Order{" +
                "id='" + id + '\'' +
                ", tenantId='" + tenantId + '\'' +
                ", orderNumber='" + orderNumber + '\'' +
                ", customer=" + customer +
                ", status=" + status +
                ", pricing=" + pricing +
                ", createdAt=" + createdAt +
                '}';
    }

    /**
     * Customer information.
     */
    public record Customer(
        @Email @NotBlank String email,
        @NotBlank String name
    ) {}

    /**
     * Shipping or billing address.
     */
    public record Address(
        @NotBlank String line1,
        String line2,
        @NotBlank String city,
        @NotBlank String state,
        @NotBlank String postalCode,
        @NotBlank String country
    ) {}

    /**
     * Order line item with product details and pricing.
     */
    public record OrderItem(
        @NotBlank String productId,
        @NotBlank String name,
        @NotBlank String sku,
        @NotNull BigDecimal price,
        @NotNull Integer quantity,
        Map<String, Object> attributes,
        @NotNull BigDecimal subtotal
    ) {
        public OrderItem {
            if (attributes == null) {
                attributes = new HashMap<>();
            }
        }
    }

    /**
     * Order pricing breakdown.
     */
    public record Pricing(
        @NotNull BigDecimal subtotal,
        @NotNull BigDecimal shipping,
        @NotNull BigDecimal tax,
        @NotNull BigDecimal total
    ) {}

    /**
     * Payment information.
     */
    public record Payment(
        @NotBlank String method,
        @NotNull PaymentStatus status,
        String transactionId
    ) {}

    /**
     * Order status history entry.
     */
    public record StatusHistoryEntry(
        @NotNull OrderStatus status,
        @NotNull Instant timestamp,
        String note
    ) {}

    public enum OrderStatus {
        PENDING,
        PROCESSING,
        SHIPPED,
        DELIVERED,
        CANCELLED
    }

    public enum PaymentStatus {
        PENDING,
        PAID,
        FAILED,
        REFUNDED
    }
}
