package com.retail.domain.cart;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/**
 * Cart entity persisted to MongoDB for durability.
 * Synchronized from Redis cache to provide recovery if cache expires.
 *
 * This allows:
 * - Cart recovery when Redis TTL expires but user returns
 * - Historical cart data for analytics
 * - Guest cart association when user logs in
 */
@Document(collection = "persisted_carts")
@CompoundIndexes({
    @CompoundIndex(name = "session_tenant_idx", def = "{'sessionId': 1, 'tenantId': 1}"),
    @CompoundIndex(name = "tenant_updated_idx", def = "{'tenantId': 1, 'updatedAt': -1}")
})
public class PersistedCart {

    @Id
    private String id;

    private String tenantId;
    private String sessionId;
    private String userId; // Optional: associate with logged-in user

    private Cart cart; // Embedded cart data

    private Instant createdAt;
    private Instant updatedAt;

    // For analytics: track when cart was last synced from Redis
    private Instant lastSyncedAt;

    // Flag to indicate if cart has been converted to an order
    private boolean converted = false;
    private String orderId; // Reference to order if converted

    // Constructors
    public PersistedCart() {
    }

    public PersistedCart(Cart cart) {
        this.id = cart.getId();
        this.tenantId = cart.getTenantId();
        this.sessionId = cart.getSessionId();
        this.cart = cart;
        this.createdAt = cart.getCreatedAt();
        this.updatedAt = cart.getUpdatedAt();
        this.lastSyncedAt = Instant.now();
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

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public Cart getCart() {
        return cart;
    }

    public void setCart(Cart cart) {
        this.cart = cart;
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

    public Instant getLastSyncedAt() {
        return lastSyncedAt;
    }

    public void setLastSyncedAt(Instant lastSyncedAt) {
        this.lastSyncedAt = lastSyncedAt;
    }

    public boolean isConverted() {
        return converted;
    }

    public void setConverted(boolean converted) {
        this.converted = converted;
    }

    public String getOrderId() {
        return orderId;
    }

    public void setOrderId(String orderId) {
        this.orderId = orderId;
    }

    /**
     * Mark cart as converted to order
     */
    public void markAsConverted(String orderId) {
        this.converted = true;
        this.orderId = orderId;
        this.updatedAt = Instant.now();
    }

    /**
     * Update from current cart state
     */
    public void updateFromCart(Cart cart) {
        this.cart = cart;
        this.updatedAt = cart.getUpdatedAt();
        this.lastSyncedAt = Instant.now();
    }
}
