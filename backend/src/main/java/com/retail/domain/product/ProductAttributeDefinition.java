package com.retail.domain.product;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

/**
 * Defines valid attributes for product types within a tenant.
 * Enables flexible product attributes while maintaining data consistency.
 *
 * Examples:
 * - Clothing: size, color, material, fit, care_instructions
 * - Electronics: brand, model, storage, ram, screen_size, battery_life
 * - Food: ingredients, allergens, nutritional_info, expiration_date
 */
@Document(collection = "product_attribute_definitions")
@CompoundIndexes({
    @CompoundIndex(name = "tenant_name_idx", def = "{'tenantId': 1, 'name': 1}", unique = true)
})
public class ProductAttributeDefinition {

    @Id
    private String id;

    @Indexed
    @NotBlank(message = "Tenant ID is required")
    private String tenantId;

    @NotBlank(message = "Attribute name is required")
    private String name;

    private String displayName;

    private String description;

    @NotNull(message = "Attribute type is required")
    private AttributeType type;

    /**
     * Whether this attribute is searchable in Elasticsearch
     */
    private boolean searchable = true;

    /**
     * Whether this attribute is filterable in product listings
     */
    private boolean filterable = true;

    /**
     * Whether this attribute is required for products
     */
    private boolean required = false;

    /**
     * Valid values for enumeration types
     */
    private List<String> allowedValues = new ArrayList<>();

    /**
     * Validation rules (min/max for numbers, regex for strings, etc.)
     */
    private AttributeValidation validation;

    /**
     * Display order in UI
     */
    private Integer displayOrder = 0;

    /**
     * Unit of measurement (if applicable): cm, kg, GB, etc.
     */
    private String unit;

    // Constructors
    public ProductAttributeDefinition() {
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

    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public AttributeType getType() {
        return type;
    }

    public void setType(AttributeType type) {
        this.type = type;
    }

    public boolean isSearchable() {
        return searchable;
    }

    public void setSearchable(boolean searchable) {
        this.searchable = searchable;
    }

    public boolean isFilterable() {
        return filterable;
    }

    public void setFilterable(boolean filterable) {
        this.filterable = filterable;
    }

    public boolean isRequired() {
        return required;
    }

    public void setRequired(boolean required) {
        this.required = required;
    }

    public List<String> getAllowedValues() {
        return allowedValues;
    }

    public void setAllowedValues(List<String> allowedValues) {
        this.allowedValues = allowedValues;
    }

    public AttributeValidation getValidation() {
        return validation;
    }

    public void setValidation(AttributeValidation validation) {
        this.validation = validation;
    }

    public Integer getDisplayOrder() {
        return displayOrder;
    }

    public void setDisplayOrder(Integer displayOrder) {
        this.displayOrder = displayOrder;
    }

    public String getUnit() {
        return unit;
    }

    public void setUnit(String unit) {
        this.unit = unit;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        ProductAttributeDefinition that = (ProductAttributeDefinition) o;
        return Objects.equals(id, that.id) &&
               Objects.equals(tenantId, that.tenantId) &&
               Objects.equals(name, that.name);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, tenantId, name);
    }

    /**
     * Supported attribute data types
     */
    public enum AttributeType {
        STRING,      // Text values
        NUMBER,      // Numeric values (Integer, Decimal)
        BOOLEAN,     // true/false
        DATE,        // Date values
        ENUM,        // Enumeration (predefined values)
        LIST,        // Array of values
        OBJECT       // Nested object/JSON
    }

    /**
     * Validation rules for attribute values
     */
    public static class AttributeValidation {
        private Double minValue;
        private Double maxValue;
        private Integer minLength;
        private Integer maxLength;
        private String pattern;  // Regex pattern for string validation

        public AttributeValidation() {
        }

        public Double getMinValue() {
            return minValue;
        }

        public void setMinValue(Double minValue) {
            this.minValue = minValue;
        }

        public Double getMaxValue() {
            return maxValue;
        }

        public void setMaxValue(Double maxValue) {
            this.maxValue = maxValue;
        }

        public Integer getMinLength() {
            return minLength;
        }

        public void setMinLength(Integer minLength) {
            this.minLength = minLength;
        }

        public Integer getMaxLength() {
            return maxLength;
        }

        public void setMaxLength(Integer maxLength) {
            this.maxLength = maxLength;
        }

        public String getPattern() {
            return pattern;
        }

        public void setPattern(String pattern) {
            this.pattern = pattern;
        }
    }
}
