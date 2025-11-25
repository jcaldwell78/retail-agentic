package com.retail.domain.audit;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.Map;

/**
 * Audit event entity.
 * Tracks important system events for compliance and debugging.
 */
@Document(collection = "audit_events")
@CompoundIndex(name = "tenant_timestamp_idx", def = "{'tenantId': 1, 'timestamp': -1}")
@CompoundIndex(name = "tenant_user_idx", def = "{'tenantId': 1, 'userId': 1, 'timestamp': -1}")
@CompoundIndex(name = "tenant_entity_idx", def = "{'tenantId': 1, 'entityType': 1, 'entityId': 1, 'timestamp': -1}")
public class AuditEvent {

    @Id
    private String id;

    @Indexed
    private String tenantId;

    @Indexed
    private Instant timestamp;

    private String userId;

    private String username;

    private AuditEventType eventType;

    private String entityType;

    private String entityId;

    private AuditAction action;

    private String description;

    private Map<String, Object> metadata;

    private String ipAddress;

    private String userAgent;

    private AuditSeverity severity;

    private boolean success;

    private String errorMessage;

    // Constructors
    public AuditEvent() {
        this.timestamp = Instant.now();
        this.success = true;
        this.severity = AuditSeverity.INFO;
    }

    public AuditEvent(String tenantId, AuditEventType eventType) {
        this();
        this.tenantId = tenantId;
        this.eventType = eventType;
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

    public Instant getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Instant timestamp) {
        this.timestamp = timestamp;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public AuditEventType getEventType() {
        return eventType;
    }

    public void setEventType(AuditEventType eventType) {
        this.eventType = eventType;
    }

    public String getEntityType() {
        return entityType;
    }

    public void setEntityType(String entityType) {
        this.entityType = entityType;
    }

    public String getEntityId() {
        return entityId;
    }

    public void setEntityId(String entityId) {
        this.entityId = entityId;
    }

    public AuditAction getAction() {
        return action;
    }

    public void setAction(AuditAction action) {
        this.action = action;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Map<String, Object> getMetadata() {
        return metadata;
    }

    public void setMetadata(Map<String, Object> metadata) {
        this.metadata = metadata;
    }

    public String getIpAddress() {
        return ipAddress;
    }

    public void setIpAddress(String ipAddress) {
        this.ipAddress = ipAddress;
    }

    public String getUserAgent() {
        return userAgent;
    }

    public void setUserAgent(String userAgent) {
        this.userAgent = userAgent;
    }

    public AuditSeverity getSeverity() {
        return severity;
    }

    public void setSeverity(AuditSeverity severity) {
        this.severity = severity;
    }

    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public String getErrorMessage() {
        return errorMessage;
    }

    public void setErrorMessage(String errorMessage) {
        this.errorMessage = errorMessage;
    }

    // Builder methods for fluent API
    public AuditEvent withUser(String userId, String username) {
        this.userId = userId;
        this.username = username;
        return this;
    }

    public AuditEvent withEntity(String entityType, String entityId) {
        this.entityType = entityType;
        this.entityId = entityId;
        return this;
    }

    public AuditEvent withAction(AuditAction action) {
        this.action = action;
        return this;
    }

    public AuditEvent withDescription(String description) {
        this.description = description;
        return this;
    }

    public AuditEvent withMetadata(Map<String, Object> metadata) {
        this.metadata = metadata;
        return this;
    }

    public AuditEvent withRequest(String ipAddress, String userAgent) {
        this.ipAddress = ipAddress;
        this.userAgent = userAgent;
        return this;
    }

    public AuditEvent withSeverity(AuditSeverity severity) {
        this.severity = severity;
        return this;
    }

    public AuditEvent withFailure(String errorMessage) {
        this.success = false;
        this.errorMessage = errorMessage;
        this.severity = AuditSeverity.ERROR;
        return this;
    }
}
