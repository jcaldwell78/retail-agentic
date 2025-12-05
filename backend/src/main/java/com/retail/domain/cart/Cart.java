package com.retail.domain.cart;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

/**
 * Cart entity stored in Redis for high-speed access.
 * Ephemeral data with 7-day TTL.
 */
public class Cart {

    private String id;

    @NotBlank(message = "Tenant ID is required")
    private String tenantId;

    @NotBlank(message = "Session ID is required")
    private String sessionId;

    private List<CartItem> items = new ArrayList<>();

    @NotNull(message = "Summary is required")
    private CartSummary summary;

    private Integer itemCount = 0;

    private Instant createdAt;
    private Instant updatedAt;
    private Instant expiresAt;

    // Constructors
    public Cart() {
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

    public String getSessionId() {
        return sessionId;
    }

    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
    }

    public List<CartItem> getItems() {
        return items;
    }

    public void setItems(List<CartItem> items) {
        this.items = items;
    }

    public CartSummary getSummary() {
        return summary;
    }

    public void setSummary(CartSummary summary) {
        this.summary = summary;
    }

    public Integer getItemCount() {
        return itemCount;
    }

    public void setItemCount(Integer itemCount) {
        this.itemCount = itemCount;
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

    public Instant getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(Instant expiresAt) {
        this.expiresAt = expiresAt;
    }

    // equals, hashCode, and toString
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Cart cart = (Cart) o;
        return Objects.equals(id, cart.id) &&
               Objects.equals(tenantId, cart.tenantId) &&
               Objects.equals(sessionId, cart.sessionId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, tenantId, sessionId);
    }

    @Override
    public String toString() {
        return "Cart{" +
                "id='" + id + '\'' +
                ", tenantId='" + tenantId + '\'' +
                ", sessionId='" + sessionId + '\'' +
                ", itemCount=" + itemCount +
                ", summary=" + summary +
                ", createdAt=" + createdAt +
                ", expiresAt=" + expiresAt +
                '}';
    }

    /**
     * Cart item with product details and selected attributes.
     */
    public record CartItem(
        String id,
        @NotBlank String productId,
        @NotBlank String name,
        @NotBlank String sku,
        @NotNull BigDecimal price,
        @NotNull Integer quantity,
        Map<String, Object> attributes,
        String imageUrl,
        @NotNull BigDecimal subtotal
    ) {
        public CartItem {
            if (attributes == null) {
                attributes = new HashMap<>();
            }
        }
    }

    /**
     * Cart pricing summary.
     */
    public record CartSummary(
        @NotNull BigDecimal subtotal,
        @NotNull BigDecimal tax,
        @NotNull BigDecimal shipping,
        @NotNull BigDecimal total
    ) {
        public CartSummary {
            if (subtotal == null) subtotal = BigDecimal.ZERO;
            if (tax == null) tax = BigDecimal.ZERO;
            if (shipping == null) shipping = BigDecimal.ZERO;
            if (total == null) total = BigDecimal.ZERO;
        }
    }
}
