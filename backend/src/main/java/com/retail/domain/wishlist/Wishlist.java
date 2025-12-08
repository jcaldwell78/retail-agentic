package com.retail.domain.wishlist;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * User wishlist entity with multi-tenant support.
 *
 * Features:
 * - Multi-tenant data isolation
 * - Price drop tracking and notifications
 * - Stock availability alerts
 * - Product variant support
 * - Shareable wishlists
 */
@Document(collection = "wishlists")
@CompoundIndexes({
    @CompoundIndex(name = "tenant_user_idx", def = "{'tenantId': 1, 'userId': 1}", unique = true),
    @CompoundIndex(name = "tenant_created_idx", def = "{'tenantId': 1, 'createdAt': -1}"),
    @CompoundIndex(name = "share_token_idx", def = "{'shareToken': 1}", unique = true, sparse = true)
})
public class Wishlist {

    @Id
    private String id;

    @Indexed
    @NotBlank(message = "Tenant ID is required")
    private String tenantId;

    @Indexed
    @NotBlank(message = "User ID is required")
    private String userId;

    @Valid
    @NotNull(message = "Items list is required")
    private List<WishlistItem> items = new ArrayList<>();

    /**
     * Whether this wishlist is publicly shareable
     */
    private Boolean isPublic = false;

    /**
     * Unique token for sharing this wishlist
     * Generated when wishlist is first shared
     */
    private String shareToken;

    /**
     * Whether others can purchase items for this user (registry mode)
     */
    private Boolean allowPurchaseByOthers = false;

    @NotNull(message = "Created timestamp is required")
    private Instant createdAt;

    @NotNull(message = "Updated timestamp is required")
    private Instant updatedAt;

    // Constructors
    public Wishlist() {
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    public Wishlist(String tenantId, String userId) {
        this();
        this.tenantId = tenantId;
        this.userId = userId;
    }

    // Business methods

    /**
     * Add an item to the wishlist
     * @param item the item to add
     * @return true if item was added, false if it already exists
     */
    public boolean addItem(WishlistItem item) {
        if (item == null) {
            return false;
        }

        // Check if item already exists
        if (items.stream().anyMatch(i -> i.getProductId().equals(item.getProductId()) &&
                (item.getVariantId() == null || item.getVariantId().equals(i.getVariantId())))) {
            return false;
        }

        // Generate ID if not set
        if (item.getId() == null || item.getId().isEmpty()) {
            item.setId(UUID.randomUUID().toString());
        }

        // Set addedAt if not set
        if (item.getAddedAt() == null) {
            item.setAddedAt(Instant.now());
        }

        items.add(item);
        this.updatedAt = Instant.now();
        return true;
    }

    /**
     * Remove an item from the wishlist by item ID
     * @param itemId the item ID to remove
     * @return true if item was removed
     */
    public boolean removeItem(String itemId) {
        if (itemId == null || itemId.isEmpty()) {
            return false;
        }

        boolean removed = items.removeIf(item -> item.getId().equals(itemId));
        if (removed) {
            this.updatedAt = Instant.now();
        }
        return removed;
    }

    /**
     * Remove an item by product ID and optional variant ID
     * @param productId the product ID
     * @param variantId optional variant ID
     * @return true if item was removed
     */
    public boolean removeItemByProduct(String productId, String variantId) {
        if (productId == null || productId.isEmpty()) {
            return false;
        }

        boolean removed = items.removeIf(item ->
            item.getProductId().equals(productId) &&
            (variantId == null || variantId.equals(item.getVariantId()))
        );

        if (removed) {
            this.updatedAt = Instant.now();
        }
        return removed;
    }

    /**
     * Find an item by item ID
     * @param itemId the item ID
     * @return Optional containing the item if found
     */
    public Optional<WishlistItem> findItem(String itemId) {
        return items.stream()
                .filter(item -> item.getId().equals(itemId))
                .findFirst();
    }

    /**
     * Find an item by product ID and optional variant ID
     * @param productId the product ID
     * @param variantId optional variant ID
     * @return Optional containing the item if found
     */
    public Optional<WishlistItem> findItemByProduct(String productId, String variantId) {
        return items.stream()
                .filter(item -> item.getProductId().equals(productId) &&
                        (variantId == null || variantId.equals(item.getVariantId())))
                .findFirst();
    }

    /**
     * Update an existing wishlist item
     * @param itemId the item ID to update
     * @param updatedItem the updated item data
     * @return true if item was updated
     */
    public boolean updateItem(String itemId, WishlistItem updatedItem) {
        Optional<WishlistItem> existingItem = findItem(itemId);
        if (existingItem.isEmpty()) {
            return false;
        }

        WishlistItem item = existingItem.get();

        // Update mutable fields
        if (updatedItem.getCurrentPrice() != null) {
            item.setCurrentPrice(updatedItem.getCurrentPrice());
        }
        if (updatedItem.getInStock() != null) {
            item.setInStock(updatedItem.getInStock());
        }
        if (updatedItem.getPriceAlertEnabled() != null) {
            item.setPriceAlertEnabled(updatedItem.getPriceAlertEnabled());
        }
        if (updatedItem.getPriceAlertThreshold() != null) {
            item.setPriceAlertThreshold(updatedItem.getPriceAlertThreshold());
        }
        if (updatedItem.getStockAlertEnabled() != null) {
            item.setStockAlertEnabled(updatedItem.getStockAlertEnabled());
        }
        if (updatedItem.getNotes() != null) {
            item.setNotes(updatedItem.getNotes());
        }
        if (updatedItem.getOnSale() != null) {
            item.setOnSale(updatedItem.getOnSale());
        }
        if (updatedItem.getSalePercentage() != null) {
            item.setSalePercentage(updatedItem.getSalePercentage());
        }

        this.updatedAt = Instant.now();
        return true;
    }

    /**
     * Clear all items from the wishlist
     */
    public void clearAllItems() {
        items.clear();
        this.updatedAt = Instant.now();
    }

    /**
     * Get total number of items
     * @return item count
     */
    public int getItemCount() {
        return items.size();
    }

    /**
     * Generate a share token for this wishlist
     * @return the generated share token
     */
    public String generateShareToken() {
        if (this.shareToken == null || this.shareToken.isEmpty()) {
            this.shareToken = UUID.randomUUID().toString();
        }
        this.isPublic = true;
        this.updatedAt = Instant.now();
        return this.shareToken;
    }

    /**
     * Disable wishlist sharing
     */
    public void disableSharing() {
        this.isPublic = false;
        this.updatedAt = Instant.now();
    }

    /**
     * Get items that need price drop notifications
     * @return list of items with price alerts enabled that should trigger notifications
     */
    public List<WishlistItem> getItemsNeedingPriceAlerts() {
        return items.stream()
                .filter(WishlistItem::shouldSendPriceAlert)
                .toList();
    }

    /**
     * Get items that need stock availability notifications
     * @return list of items that are back in stock and have stock alerts enabled
     */
    public List<WishlistItem> getItemsNeedingStockAlerts() {
        return items.stream()
                .filter(item -> item.getStockAlertEnabled() && item.getInStock())
                .toList();
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

    public List<WishlistItem> getItems() {
        return items;
    }

    public void setItems(List<WishlistItem> items) {
        this.items = items != null ? items : new ArrayList<>();
    }

    public Boolean getIsPublic() {
        return isPublic;
    }

    public void setIsPublic(Boolean isPublic) {
        this.isPublic = isPublic;
    }

    public String getShareToken() {
        return shareToken;
    }

    public void setShareToken(String shareToken) {
        this.shareToken = shareToken;
    }

    public Boolean getAllowPurchaseByOthers() {
        return allowPurchaseByOthers;
    }

    public void setAllowPurchaseByOthers(Boolean allowPurchaseByOthers) {
        this.allowPurchaseByOthers = allowPurchaseByOthers;
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
}
