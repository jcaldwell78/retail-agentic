package com.retail.domain.inventory;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.util.Objects;

/**
 * Inventory entity for tracking product stock levels.
 * Supports real-time inventory tracking with Redis caching.
 */
@Document(collection = "inventory")
@CompoundIndexes({
    @CompoundIndex(name = "tenant_product_idx", def = "{'tenantId': 1, 'productId': 1}", unique = true)
})
public class Inventory {

    @Id
    private String id;

    @Indexed
    @NotBlank(message = "Tenant ID is required")
    private String tenantId;

    @NotBlank(message = "Product ID is required")
    private String productId;

    @NotNull(message = "Quantity is required")
    @Min(value = 0, message = "Quantity cannot be negative")
    private Integer quantity;

    @NotNull(message = "Reserved quantity is required")
    @Min(value = 0, message = "Reserved quantity cannot be negative")
    private Integer reservedQuantity = 0;

    @Min(value = 0, message = "Low stock threshold cannot be negative")
    private Integer lowStockThreshold = 10;

    private boolean trackInventory = true;

    private boolean allowBackorder = false;

    private String warehouseLocation;

    private Instant lastRestockedAt;

    private Instant createdAt;
    private Instant updatedAt;

    // Constructors
    public Inventory() {
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    public Inventory(String tenantId, String productId, Integer quantity) {
        this();
        this.tenantId = tenantId;
        this.productId = productId;
        this.quantity = quantity;
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

    public String getProductId() {
        return productId;
    }

    public void setProductId(String productId) {
        this.productId = productId;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
        this.updatedAt = Instant.now();
    }

    public Integer getReservedQuantity() {
        return reservedQuantity;
    }

    public void setReservedQuantity(Integer reservedQuantity) {
        this.reservedQuantity = reservedQuantity;
        this.updatedAt = Instant.now();
    }

    public Integer getLowStockThreshold() {
        return lowStockThreshold;
    }

    public void setLowStockThreshold(Integer lowStockThreshold) {
        this.lowStockThreshold = lowStockThreshold;
        this.updatedAt = Instant.now();
    }

    public boolean isTrackInventory() {
        return trackInventory;
    }

    public void setTrackInventory(boolean trackInventory) {
        this.trackInventory = trackInventory;
    }

    public boolean isAllowBackorder() {
        return allowBackorder;
    }

    public void setAllowBackorder(boolean allowBackorder) {
        this.allowBackorder = allowBackorder;
    }

    public String getWarehouseLocation() {
        return warehouseLocation;
    }

    public void setWarehouseLocation(String warehouseLocation) {
        this.warehouseLocation = warehouseLocation;
    }

    public Instant getLastRestockedAt() {
        return lastRestockedAt;
    }

    public void setLastRestockedAt(Instant lastRestockedAt) {
        this.lastRestockedAt = lastRestockedAt;
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

    // Business logic methods
    public Integer getAvailableQuantity() {
        return quantity - reservedQuantity;
    }

    public boolean isLowStock() {
        return trackInventory && getAvailableQuantity() <= lowStockThreshold;
    }

    public boolean isOutOfStock() {
        return trackInventory && getAvailableQuantity() <= 0;
    }

    public boolean canFulfill(int requestedQuantity) {
        if (!trackInventory) {
            return true; // Always available if not tracking
        }
        if (allowBackorder) {
            return true; // Can always fulfill if backorders allowed
        }
        return getAvailableQuantity() >= requestedQuantity;
    }

    public void reserve(int quantity) {
        if (quantity < 0) {
            throw new IllegalArgumentException("Cannot reserve negative quantity");
        }
        if (!canFulfill(quantity)) {
            throw new IllegalStateException("Insufficient inventory to reserve " + quantity + " units");
        }
        this.reservedQuantity += quantity;
        this.updatedAt = Instant.now();
    }

    public void releaseReservation(int quantity) {
        if (quantity < 0) {
            throw new IllegalArgumentException("Cannot release negative quantity");
        }
        if (quantity > this.reservedQuantity) {
            throw new IllegalArgumentException("Cannot release more than reserved quantity");
        }
        this.reservedQuantity -= quantity;
        this.updatedAt = Instant.now();
    }

    public void deduct(int quantity) {
        if (quantity < 0) {
            throw new IllegalArgumentException("Cannot deduct negative quantity");
        }
        if (quantity > this.quantity) {
            throw new IllegalStateException("Cannot deduct more than available quantity");
        }
        this.quantity -= quantity;
        this.updatedAt = Instant.now();
    }

    public void restock(int quantity) {
        if (quantity < 0) {
            throw new IllegalArgumentException("Cannot restock negative quantity");
        }
        this.quantity += quantity;
        this.lastRestockedAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    // equals, hashCode, toString
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Inventory inventory = (Inventory) o;
        return Objects.equals(id, inventory.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return "Inventory{" +
               "id='" + id + '\'' +
               ", tenantId='" + tenantId + '\'' +
               ", productId='" + productId + '\'' +
               ", quantity=" + quantity +
               ", reservedQuantity=" + reservedQuantity +
               ", availableQuantity=" + getAvailableQuantity() +
               ", isLowStock=" + isLowStock() +
               '}';
    }
}
