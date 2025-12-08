package com.retail.domain.user;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import com.retail.domain.notification.NotificationPreferences;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

/**
 * User entity representing customers and admin users.
 * Multi-tenant aware with email uniqueness per tenant.
 */
@Document(collection = "users")
@CompoundIndexes({
    @CompoundIndex(name = "tenant_email_idx", def = "{'tenantId': 1, 'email': 1}", unique = true)
})
public class User {

    @Id
    private String id;

    @Indexed
    @NotBlank(message = "Tenant ID is required")
    private String tenantId;

    @NotBlank(message = "Email is required")
    @Email(message = "Valid email is required")
    private String email;

    private String passwordHash; // Nullable for OAuth2 users

    @NotBlank(message = "First name is required")
    private String firstName;

    @NotBlank(message = "Last name is required")
    private String lastName;

    private String phone;

    @NotNull(message = "Role is required")
    private UserRole role = UserRole.CUSTOMER;

    @NotNull(message = "Status is required")
    private UserStatus status = UserStatus.ACTIVE;

    private List<Address> addresses = new ArrayList<>();

    // OAuth2 fields
    private String oauth2Provider; // "GOOGLE", "FACEBOOK", or null for local auth
    private String oauth2ProviderId; // Provider's user ID

    // Notification preferences
    private NotificationPreferences notificationPreferences;

    private Instant createdAt;
    private Instant updatedAt;
    private Instant lastLoginAt;

    // Constructors
    public User() {
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    public User(String tenantId, String email, String firstName, String lastName) {
        this();
        this.tenantId = tenantId;
        this.email = email;
        this.firstName = firstName;
        this.lastName = lastName;
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

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
        this.updatedAt = Instant.now();
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
        this.updatedAt = Instant.now();
    }

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
        this.updatedAt = Instant.now();
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
        this.updatedAt = Instant.now();
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
        this.updatedAt = Instant.now();
    }

    public UserRole getRole() {
        return role;
    }

    public void setRole(UserRole role) {
        this.role = role;
        this.updatedAt = Instant.now();
    }

    public UserStatus getStatus() {
        return status;
    }

    public void setStatus(UserStatus status) {
        this.status = status;
        this.updatedAt = Instant.now();
    }

    public List<Address> getAddresses() {
        return addresses;
    }

    public void setAddresses(List<Address> addresses) {
        this.addresses = addresses;
        this.updatedAt = Instant.now();
    }

    public void addAddress(Address address) {
        if (this.addresses == null) {
            this.addresses = new ArrayList<>();
        }
        this.addresses.add(address);
        this.updatedAt = Instant.now();
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

    public Instant getLastLoginAt() {
        return lastLoginAt;
    }

    public void setLastLoginAt(Instant lastLoginAt) {
        this.lastLoginAt = lastLoginAt;
    }

    public void recordLogin() {
        this.lastLoginAt = Instant.now();
    }

    public String getOauth2Provider() {
        return oauth2Provider;
    }

    public void setOauth2Provider(String oauth2Provider) {
        this.oauth2Provider = oauth2Provider;
        this.updatedAt = Instant.now();
    }

    public String getOauth2ProviderId() {
        return oauth2ProviderId;
    }

    public void setOauth2ProviderId(String oauth2ProviderId) {
        this.oauth2ProviderId = oauth2ProviderId;
        this.updatedAt = Instant.now();
    }

    public NotificationPreferences getNotificationPreferences() {
        if (notificationPreferences == null) {
            notificationPreferences = NotificationPreferences.defaultPreferences();
        }
        return notificationPreferences;
    }

    public void setNotificationPreferences(NotificationPreferences notificationPreferences) {
        this.notificationPreferences = notificationPreferences;
        this.updatedAt = Instant.now();
    }

    // Helper methods
    public String getFullName() {
        return firstName + " " + lastName;
    }

    public boolean isOAuth2User() {
        return oauth2Provider != null && !oauth2Provider.isEmpty();
    }

    public boolean isActive() {
        return status == UserStatus.ACTIVE;
    }

    public Address getDefaultAddress() {
        return addresses.stream()
            .filter(Address::isDefault)
            .findFirst()
            .orElse(null);
    }

    // equals, hashCode, toString
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        User user = (User) o;
        return Objects.equals(id, user.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return "User{" +
               "id='" + id + '\'' +
               ", tenantId='" + tenantId + '\'' +
               ", email='" + email + '\'' +
               ", role=" + role +
               ", status=" + status +
               '}';
    }
}
