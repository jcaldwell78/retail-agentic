package com.retail.domain.wishlist;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Wishlist item - embedded document within a Wishlist.
 *
 * Tracks individual products saved to a user's wishlist with price monitoring
 * and notification preferences.
 */
public class WishlistItem {

    @NotBlank(message = "Item ID is required")
    private String id;

    @NotBlank(message = "Product ID is required")
    private String productId;

    /**
     * Optional variant ID for products with variants (color, size, etc.)
     */
    private String variantId;

    @NotBlank(message = "Product name is required")
    private String name;

    @NotNull(message = "Current price is required")
    @DecimalMin(value = "0.0", message = "Price must be non-negative")
    private BigDecimal currentPrice;

    @NotNull(message = "Price when added is required")
    @DecimalMin(value = "0.0", message = "Price must be non-negative")
    private BigDecimal priceWhenAdded;

    private String imageUrl;

    @NotNull(message = "Stock status is required")
    private Boolean inStock = true;

    @NotNull(message = "Added timestamp is required")
    private Instant addedAt;

    /**
     * Enable price drop notifications for this item
     */
    private Boolean priceAlertEnabled = false;

    /**
     * Percentage threshold for price drop alerts (e.g., 10 = 10%)
     * Only trigger alert if price drops by this percentage or more
     */
    private Integer priceAlertThreshold = 5;

    /**
     * Enable back-in-stock notifications
     */
    private Boolean stockAlertEnabled = false;

    /**
     * Last time a notification was sent for this item
     * Prevents duplicate notifications
     */
    private Instant lastNotifiedAt;

    /**
     * Private notes about this wishlist item
     */
    private String notes;

    /**
     * Whether the product is currently on sale
     */
    private Boolean onSale = false;

    /**
     * Sale discount percentage if on sale
     */
    private Integer salePercentage;

    // Constructors
    public WishlistItem() {
    }

    public WishlistItem(String id, String productId, String name, BigDecimal price, String imageUrl, Boolean inStock) {
        this.id = id;
        this.productId = productId;
        this.name = name;
        this.currentPrice = price;
        this.priceWhenAdded = price;
        this.imageUrl = imageUrl;
        this.inStock = inStock;
        this.addedAt = Instant.now();
    }

    // Business methods

    /**
     * Calculate the price drop percentage
     * @return percentage drop (0 if price increased or stayed same)
     */
    public double calculatePriceDrop() {
        if (priceWhenAdded == null || currentPrice == null || priceWhenAdded.compareTo(BigDecimal.ZERO) == 0) {
            return 0.0;
        }

        BigDecimal drop = priceWhenAdded.subtract(currentPrice);
        if (drop.compareTo(BigDecimal.ZERO) <= 0) {
            return 0.0; // Price increased or stayed the same
        }

        return drop.divide(priceWhenAdded, 4, java.math.RoundingMode.HALF_UP)
                   .multiply(new BigDecimal("100"))
                   .doubleValue();
    }

    /**
     * Check if price drop notification should be sent
     * @return true if alert should be sent
     */
    public boolean shouldSendPriceAlert() {
        if (!priceAlertEnabled) {
            return false;
        }

        double priceDrop = calculatePriceDrop();
        return priceDrop >= (priceAlertThreshold != null ? priceAlertThreshold : 5);
    }

    /**
     * Update the current price and check for price drops
     * @param newPrice the new price
     * @return true if price dropped
     */
    public boolean updatePrice(BigDecimal newPrice) {
        if (newPrice == null || newPrice.equals(this.currentPrice)) {
            return false;
        }

        boolean priceDropped = newPrice.compareTo(this.currentPrice) < 0;
        this.currentPrice = newPrice;
        return priceDropped;
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

    public String getVariantId() {
        return variantId;
    }

    public void setVariantId(String variantId) {
        this.variantId = variantId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public BigDecimal getCurrentPrice() {
        return currentPrice;
    }

    public void setCurrentPrice(BigDecimal currentPrice) {
        this.currentPrice = currentPrice;
    }

    public BigDecimal getPriceWhenAdded() {
        return priceWhenAdded;
    }

    public void setPriceWhenAdded(BigDecimal priceWhenAdded) {
        this.priceWhenAdded = priceWhenAdded;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public Boolean getInStock() {
        return inStock;
    }

    public void setInStock(Boolean inStock) {
        this.inStock = inStock;
    }

    public Instant getAddedAt() {
        return addedAt;
    }

    public void setAddedAt(Instant addedAt) {
        this.addedAt = addedAt;
    }

    public Boolean getPriceAlertEnabled() {
        return priceAlertEnabled;
    }

    public void setPriceAlertEnabled(Boolean priceAlertEnabled) {
        this.priceAlertEnabled = priceAlertEnabled;
    }

    public Integer getPriceAlertThreshold() {
        return priceAlertThreshold;
    }

    public void setPriceAlertThreshold(Integer priceAlertThreshold) {
        this.priceAlertThreshold = priceAlertThreshold;
    }

    public Boolean getStockAlertEnabled() {
        return stockAlertEnabled;
    }

    public void setStockAlertEnabled(Boolean stockAlertEnabled) {
        this.stockAlertEnabled = stockAlertEnabled;
    }

    public Instant getLastNotifiedAt() {
        return lastNotifiedAt;
    }

    public void setLastNotifiedAt(Instant lastNotifiedAt) {
        this.lastNotifiedAt = lastNotifiedAt;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public Boolean getOnSale() {
        return onSale;
    }

    public void setOnSale(Boolean onSale) {
        this.onSale = onSale;
    }

    public Integer getSalePercentage() {
        return salePercentage;
    }

    public void setSalePercentage(Integer salePercentage) {
        this.salePercentage = salePercentage;
    }
}
