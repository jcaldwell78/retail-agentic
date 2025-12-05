package com.retail.domain.cart;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Saved cart items (save for later).
 * Persisted in MongoDB for long-term storage.
 */
@Document(collection = "saved_carts")
@CompoundIndex(name = "tenant_user_idx", def = "{'tenantId': 1, 'userId': 1}")
public class SavedCart {

    @Id
    private String id;

    @Indexed
    private String tenantId;

    private String userId;

    private String sessionId;

    private List<SavedCartItem> items = new ArrayList<>();

    private Integer itemCount = 0;

    private Instant createdAt;
    private Instant updatedAt;

    // Constructors
    public SavedCart() {
    }

    public SavedCart(String tenantId, String userId, String sessionId) {
        this.tenantId = tenantId;
        this.userId = userId;
        this.sessionId = sessionId;
        this.items = new ArrayList<>();
        this.itemCount = 0;
        Instant now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;
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

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getSessionId() {
        return sessionId;
    }

    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
    }

    public List<SavedCartItem> getItems() {
        return items;
    }

    public void setItems(List<SavedCartItem> items) {
        this.items = items;
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

    /**
     * Saved cart item.
     */
    public static class SavedCartItem {
        private String id;
        private String productId;
        private String name;
        private String sku;
        private java.math.BigDecimal price;
        private Integer quantity;
        private java.util.Map<String, Object> attributes;
        private String imageUrl;
        private Instant savedAt;

        // Constructors
        public SavedCartItem() {
            this.savedAt = Instant.now();
        }

        public SavedCartItem(
                String id,
                String productId,
                String name,
                String sku,
                java.math.BigDecimal price,
                Integer quantity,
                java.util.Map<String, Object> attributes,
                String imageUrl) {
            this.id = id;
            this.productId = productId;
            this.name = name;
            this.sku = sku;
            this.price = price;
            this.quantity = quantity;
            this.attributes = attributes;
            this.imageUrl = imageUrl;
            this.savedAt = Instant.now();
        }

        // Getters and Setters
        public String getId() {
            return id;
        }

        public void setId(String id) {
            this.id = id;
        }

        public String getProductId() {
            return productId;
        }

        public void setProductId(String productId) {
            this.productId = productId;
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public String getSku() {
            return sku;
        }

        public void setSku(String sku) {
            this.sku = sku;
        }

        public java.math.BigDecimal getPrice() {
            return price;
        }

        public void setPrice(java.math.BigDecimal price) {
            this.price = price;
        }

        public Integer getQuantity() {
            return quantity;
        }

        public void setQuantity(Integer quantity) {
            this.quantity = quantity;
        }

        public java.util.Map<String, Object> getAttributes() {
            return attributes;
        }

        public void setAttributes(java.util.Map<String, Object> attributes) {
            this.attributes = attributes;
        }

        public String getImageUrl() {
            return imageUrl;
        }

        public void setImageUrl(String imageUrl) {
            this.imageUrl = imageUrl;
        }

        public Instant getSavedAt() {
            return savedAt;
        }

        public void setSavedAt(Instant savedAt) {
            this.savedAt = savedAt;
        }

        /**
         * Convert CartItem to SavedCartItem.
         */
        public static SavedCartItem fromCartItem(Cart.CartItem cartItem) {
            return new SavedCartItem(
                cartItem.id(),
                cartItem.productId(),
                cartItem.name(),
                cartItem.sku(),
                cartItem.price(),
                cartItem.quantity(),
                cartItem.attributes(),
                cartItem.imageUrl()
            );
        }

        /**
         * Convert SavedCartItem to CartItem.
         */
        public Cart.CartItem toCartItem() {
            java.math.BigDecimal subtotal = price.multiply(java.math.BigDecimal.valueOf(quantity));
            return new Cart.CartItem(
                id,
                productId,
                name,
                sku,
                price,
                quantity,
                attributes,
                imageUrl,
                subtotal
            );
        }
    }
}
