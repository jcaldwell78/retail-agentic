package com.retail.domain.product;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import jakarta.validation.constraints.NotBlank;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

/**
 * Product category entity with hierarchical structure.
 * Supports multi-level categorization (e.g., Electronics > Computers > Laptops).
 */
@Document(collection = "categories")
@CompoundIndexes({
    @CompoundIndex(name = "tenant_slug_idx", def = "{'tenantId': 1, 'slug': 1}", unique = true),
    @CompoundIndex(name = "tenant_parent_idx", def = "{'tenantId': 1, 'parentId': 1}")
})
public class Category {

    @Id
    private String id;

    @Indexed
    @NotBlank(message = "Tenant ID is required")
    private String tenantId;

    @NotBlank(message = "Category name is required")
    private String name;

    /**
     * URL-friendly slug (e.g., "electronics", "mens-clothing")
     */
    @NotBlank(message = "Category slug is required")
    private String slug;

    private String description;

    /**
     * Parent category ID for hierarchical structure
     * null for top-level categories
     */
    private String parentId;

    /**
     * Full path from root to this category (for breadcrumbs and navigation)
     * Example: ["Electronics", "Computers", "Laptops"]
     */
    private List<String> path = new ArrayList<>();

    /**
     * Image/icon for the category
     */
    private String imageUrl;

    /**
     * Display order within parent category
     */
    private Integer displayOrder = 0;

    /**
     * Whether category is visible in navigation
     */
    private boolean visible = true;

    /**
     * SEO metadata
     */
    private CategorySeo seo;

    /**
     * Product attribute definitions specific to this category
     */
    private List<String> attributeDefinitionIds = new ArrayList<>();

    private Instant createdAt;
    private Instant updatedAt;

    // Constructors
    public Category() {
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

    public String getSlug() {
        return slug;
    }

    public void setSlug(String slug) {
        this.slug = slug;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getParentId() {
        return parentId;
    }

    public void setParentId(String parentId) {
        this.parentId = parentId;
    }

    public List<String> getPath() {
        return path;
    }

    public void setPath(List<String> path) {
        this.path = path;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public Integer getDisplayOrder() {
        return displayOrder;
    }

    public void setDisplayOrder(Integer displayOrder) {
        this.displayOrder = displayOrder;
    }

    public boolean isVisible() {
        return visible;
    }

    public void setVisible(boolean visible) {
        this.visible = visible;
    }

    public CategorySeo getSeo() {
        return seo;
    }

    public void setSeo(CategorySeo seo) {
        this.seo = seo;
    }

    public List<String> getAttributeDefinitionIds() {
        return attributeDefinitionIds;
    }

    public void setAttributeDefinitionIds(List<String> attributeDefinitionIds) {
        this.attributeDefinitionIds = attributeDefinitionIds;
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

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Category category = (Category) o;
        return Objects.equals(id, category.id) &&
               Objects.equals(tenantId, category.tenantId) &&
               Objects.equals(slug, category.slug);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, tenantId, slug);
    }

    /**
     * SEO metadata for category pages
     */
    public static class CategorySeo {
        private String metaTitle;
        private String metaDescription;
        private List<String> metaKeywords = new ArrayList<>();
        private String canonicalUrl;

        public CategorySeo() {
        }

        public String getMetaTitle() {
            return metaTitle;
        }

        public void setMetaTitle(String metaTitle) {
            this.metaTitle = metaTitle;
        }

        public String getMetaDescription() {
            return metaDescription;
        }

        public void setMetaDescription(String metaDescription) {
            this.metaDescription = metaDescription;
        }

        public List<String> getMetaKeywords() {
            return metaKeywords;
        }

        public void setMetaKeywords(List<String> metaKeywords) {
            this.metaKeywords = metaKeywords;
        }

        public String getCanonicalUrl() {
            return canonicalUrl;
        }

        public void setCanonicalUrl(String canonicalUrl) {
            this.canonicalUrl = canonicalUrl;
        }
    }
}
