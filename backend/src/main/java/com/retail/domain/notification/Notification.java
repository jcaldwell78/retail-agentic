package com.retail.domain.notification;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.Map;

/**
 * Notification entity.
 * Tracks notifications sent to users via email, SMS, push, or in-app.
 */
@Document(collection = "notifications")
@CompoundIndex(name = "tenant_user_idx", def = "{'tenantId': 1, 'userId': 1, 'createdAt': -1}")
@CompoundIndex(name = "tenant_status_idx", def = "{'tenantId': 1, 'status': 1, 'createdAt': -1}")
public class Notification {

    @Id
    private String id;

    @Indexed
    private String tenantId;

    private String userId;

    private String email;

    private String phoneNumber;

    private NotificationType type;

    private NotificationChannel channel;

    private NotificationStatus status;

    private String subject;

    private String content;

    private Map<String, Object> templateData;

    private String templateId;

    private String externalId;

    private String errorMessage;

    private Instant createdAt;

    private Instant sentAt;

    private Instant deliveredAt;

    private int retryCount;

    private Instant scheduledFor;

    // Constructors
    public Notification() {
        this.createdAt = Instant.now();
        this.status = NotificationStatus.PENDING;
        this.retryCount = 0;
    }

    public Notification(String tenantId, NotificationType type, NotificationChannel channel) {
        this();
        this.tenantId = tenantId;
        this.type = type;
        this.channel = channel;
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

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public NotificationType getType() {
        return type;
    }

    public void setType(NotificationType type) {
        this.type = type;
    }

    public NotificationChannel getChannel() {
        return channel;
    }

    public void setChannel(NotificationChannel channel) {
        this.channel = channel;
    }

    public NotificationStatus getStatus() {
        return status;
    }

    public void setStatus(NotificationStatus status) {
        this.status = status;
    }

    public String getSubject() {
        return subject;
    }

    public void setSubject(String subject) {
        this.subject = subject;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public Map<String, Object> getTemplateData() {
        return templateData;
    }

    public void setTemplateData(Map<String, Object> templateData) {
        this.templateData = templateData;
    }

    public String getTemplateId() {
        return templateId;
    }

    public void setTemplateId(String templateId) {
        this.templateId = templateId;
    }

    public String getExternalId() {
        return externalId;
    }

    public void setExternalId(String externalId) {
        this.externalId = externalId;
    }

    public String getErrorMessage() {
        return errorMessage;
    }

    public void setErrorMessage(String errorMessage) {
        this.errorMessage = errorMessage;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getSentAt() {
        return sentAt;
    }

    public void setSentAt(Instant sentAt) {
        this.sentAt = sentAt;
    }

    public Instant getDeliveredAt() {
        return deliveredAt;
    }

    public void setDeliveredAt(Instant deliveredAt) {
        this.deliveredAt = deliveredAt;
    }

    public int getRetryCount() {
        return retryCount;
    }

    public void setRetryCount(int retryCount) {
        this.retryCount = retryCount;
    }

    public Instant getScheduledFor() {
        return scheduledFor;
    }

    public void setScheduledFor(Instant scheduledFor) {
        this.scheduledFor = scheduledFor;
    }

    // Helper methods
    public void markSent(String externalId) {
        this.status = NotificationStatus.SENT;
        this.sentAt = Instant.now();
        this.externalId = externalId;
    }

    public void markDelivered() {
        this.status = NotificationStatus.DELIVERED;
        this.deliveredAt = Instant.now();
    }

    public void markFailed(String errorMessage) {
        this.status = NotificationStatus.FAILED;
        this.errorMessage = errorMessage;
    }

    public void incrementRetry() {
        this.retryCount++;
    }
}
