package com.retail.domain.product;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

/**
 * Product entity with flexible attributes for different product types.
 * Includes tenant isolation and Elasticsearch indexing.
 */
@Document(collection = "products")
@CompoundIndexes({
    @CompoundIndex(name = "tenant_sku_idx", def = "{'tenantId': 1, 'sku': 1}", unique = true),
    @CompoundIndex(name = "tenant_status_idx", def = "{'tenantId': 1, 'status': 1}"),
    @CompoundIndex(name = "tenant_category_idx", def = "{'tenantId': 1, 'category': 1}"),
    @CompoundIndex(name = "tenant_status_created_idx", def = "{'tenantId': 1, 'status': 1, 'createdAt': -1}"),
    @CompoundIndex(name = "tenant_stock_idx", def = "{'tenantId': 1, 'stock': 1}"),
    @CompoundIndex(name = "tenant_price_idx", def = "{'tenantId': 1, 'price': 1}")
})
public class Product {

    @Id
    private String id;

    @Indexed
    @NotBlank(message = "Tenant ID is required")
    private String tenantId;

    @NotBlank(message = "Product name is required")
    private String name;

    @NotBlank(message = "SKU is required")
    private String sku;

    private String description;

    @NotNull(message = "Price is required")
    @DecimalMin(value = "0.01", message = "Price must be greater than 0")
    private BigDecimal price;

    private String currency = "USD";

    private List<String> category = new ArrayList<>();

    private List<ProductImage> images = new ArrayList<>();

    /**
     * Dynamic attributes for flexible product types
     * Examples: color, size, material, dimensions, etc.
     */
    private Map<String, Object> attributes = new HashMap<>();

    @Positive(message = "Stock must be positive")
    private Integer stock = 0;

    @NotNull(message = "Status is required")
    private ProductStatus status = ProductStatus.ACTIVE;

    private Instant createdAt;
    private Instant updatedAt;

    // Constructors
    public Product() {
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

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public List<String> getCategory() {
        return category;
    }

    public void setCategory(List<String> category) {
        this.category = category;
    }

    public List<ProductImage> getImages() {
        return images;
    }

    public void setImages(List<ProductImage> images) {
        this.images = images;
    }

    public Map<String, Object> getAttributes() {
        return attributes;
    }

    public void setAttributes(Map<String, Object> attributes) {
        this.attributes = attributes;
    }

    public Integer getStock() {
        return stock;
    }

    public void setStock(Integer stock) {
        this.stock = stock;
    }

    public ProductStatus getStatus() {
        return status;
    }

    public void setStatus(ProductStatus status) {
        this.status = status;
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

    // Helper methods
    public boolean isActive() {
        return status == ProductStatus.ACTIVE;
    }

    public void setActive(boolean active) {
        this.status = active ? ProductStatus.ACTIVE : ProductStatus.INACTIVE;
    }

    // equals, hashCode, and toString
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Product product = (Product) o;
        return Objects.equals(id, product.id) &&
               Objects.equals(tenantId, product.tenantId) &&
               Objects.equals(sku, product.sku);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, tenantId, sku);
    }

    @Override
    public String toString() {
        return "Product{" +
                "id='" + id + '\'' +
                ", tenantId='" + tenantId + '\'' +
                ", name='" + name + '\'' +
                ", sku='" + sku + '\'' +
                ", price=" + price +
                ", currency='" + currency + '\'' +
                ", stock=" + stock +
                ", status=" + status +
                '}';
    }

    /**
     * Product image with URL, alt text, and display order.
     */
    public record ProductImage(
        String url,
        String alt,
        Integer order
    ) {}

    public enum ProductStatus {
        ACTIVE,
        INACTIVE,
        DISCONTINUED
    }
}
