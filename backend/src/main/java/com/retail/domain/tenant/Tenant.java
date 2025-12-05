package com.retail.domain.tenant;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import java.time.Instant;
import java.util.Objects;

/**
 * Tenant entity representing a store in the multi-tenant platform.
 * Each tenant has its own branding, domain, and settings.
 */
@Document(collection = "tenants")
public class Tenant {

    @Id
    private String id;

    @Indexed(unique = true)
    @NotBlank(message = "Subdomain is required")
    private String subdomain;

    @Indexed(unique = true, sparse = true)
    private String customDomain;

    @NotBlank(message = "Store name is required")
    private String name;

    private String description;

    @Email(message = "Valid email is required")
    @NotBlank(message = "Contact email is required")
    private String contactEmail;

    private String phone;

    private Branding branding;

    private TenantSettings settings;

    private Instant createdAt;
    private Instant updatedAt;

    // Constructors
    public Tenant() {
    }

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getSubdomain() {
        return subdomain;
    }

    public void setSubdomain(String subdomain) {
        this.subdomain = subdomain;
    }

    public String getCustomDomain() {
        return customDomain;
    }

    public void setCustomDomain(String customDomain) {
        this.customDomain = customDomain;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getContactEmail() {
        return contactEmail;
    }

    public void setContactEmail(String contactEmail) {
        this.contactEmail = contactEmail;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public Branding getBranding() {
        return branding;
    }

    public void setBranding(Branding branding) {
        this.branding = branding;
    }

    public TenantSettings getSettings() {
        return settings;
    }

    public void setSettings(TenantSettings settings) {
        this.settings = settings;
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

    // equals, hashCode, toString
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Tenant tenant = (Tenant) o;
        return Objects.equals(id, tenant.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return "Tenant{" +
               "id='" + id + '\'' +
               ", subdomain='" + subdomain + '\'' +
               ", name='" + name + '\'' +
               '}';
    }

    /**
     * Branding configuration for whitelabel customization (immutable record)
     */
    public record Branding(
        String logoUrl,
        String primaryColor,
        String secondaryColor,
        String accentColor,
        String fontFamily
    ) {
        public Branding {
            // Default values
            if (primaryColor == null) primaryColor = "#1E40AF";
            if (secondaryColor == null) secondaryColor = "#9333EA";
            if (accentColor == null) accentColor = "#F59E0B";
            if (fontFamily == null) fontFamily = "Inter";
        }

        // Convenience constructor with defaults
        public Branding(String logoUrl) {
            this(logoUrl, null, null, null, null);
        }
    }

    /**
     * Tenant-specific settings (immutable record)
     */
    public record TenantSettings(
        String currency,
        Double taxRate,
        Double freeShippingThreshold,
        Integer lowStockThreshold
    ) {
        public TenantSettings {
            // Default values
            if (currency == null) currency = "USD";
            if (taxRate == null) taxRate = 0.09;
            if (freeShippingThreshold == null) freeShippingThreshold = 50.0;
            if (lowStockThreshold == null) lowStockThreshold = 10;
        }

        // Convenience constructor with all defaults
        public TenantSettings() {
            this(null, null, null, null);
        }
    }
}
