package com.retail.domain.audit;

import com.retail.infrastructure.persistence.AuditEventRepository;
import com.retail.security.tenant.TenantContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Map;

/**
 * Service for audit logging.
 * Tracks important system events for compliance, security, and debugging.
 */
@Service
public class AuditLogService {

    private static final Logger logger = LoggerFactory.getLogger(AuditLogService.class);

    private final AuditEventRepository auditEventRepository;

    public AuditLogService(AuditEventRepository auditEventRepository) {
        this.auditEventRepository = auditEventRepository;
    }

    /**
     * Log an audit event.
     *
     * @param event Audit event to log
     * @return Mono<AuditEvent> Saved audit event
     */
    public Mono<AuditEvent> logEvent(AuditEvent event) {
        return TenantContext.getTenantId()
            .flatMap(tenantId -> {
                event.setTenantId(tenantId);

                // Log to application logs as well
                if (event.isSuccess()) {
                    logger.info("Audit: {} - {} - User: {} - Entity: {}/{}",
                        event.getEventType(),
                        event.getDescription(),
                        event.getUsername(),
                        event.getEntityType(),
                        event.getEntityId()
                    );
                } else {
                    logger.warn("Audit (FAILED): {} - {} - User: {} - Error: {}",
                        event.getEventType(),
                        event.getDescription(),
                        event.getUsername(),
                        event.getErrorMessage()
                    );
                }

                return auditEventRepository.save(event);
            })
            .doOnError(error -> logger.error("Failed to save audit event", error));
    }

    /**
     * Log an audit event with minimal information.
     *
     * @param eventType Event type
     * @param description Description
     * @return Mono<AuditEvent>
     */
    public Mono<AuditEvent> log(AuditEventType eventType, String description) {
        return TenantContext.getTenantId()
            .flatMap(tenantId -> {
                AuditEvent event = new AuditEvent(tenantId, eventType)
                    .withDescription(description);
                return logEvent(event);
            });
    }

    /**
     * Log a user action on an entity.
     *
     * @param eventType Event type
     * @param userId User ID
     * @param username Username
     * @param action CRUD action
     * @param entityType Entity type (e.g., "Product", "Order")
     * @param entityId Entity ID
     * @param description Description
     * @return Mono<AuditEvent>
     */
    public Mono<AuditEvent> logUserAction(
            AuditEventType eventType,
            String userId,
            String username,
            AuditAction action,
            String entityType,
            String entityId,
            String description) {

        return TenantContext.getTenantId()
            .flatMap(tenantId -> {
                AuditEvent event = new AuditEvent(tenantId, eventType)
                    .withUser(userId, username)
                    .withAction(action)
                    .withEntity(entityType, entityId)
                    .withDescription(description);

                return logEvent(event);
            });
    }

    /**
     * Log a user action with metadata.
     *
     * @param eventType Event type
     * @param userId User ID
     * @param username Username
     * @param action CRUD action
     * @param entityType Entity type
     * @param entityId Entity ID
     * @param description Description
     * @param metadata Additional metadata
     * @return Mono<AuditEvent>
     */
    public Mono<AuditEvent> logUserActionWithMetadata(
            AuditEventType eventType,
            String userId,
            String username,
            AuditAction action,
            String entityType,
            String entityId,
            String description,
            Map<String, Object> metadata) {

        return TenantContext.getTenantId()
            .flatMap(tenantId -> {
                AuditEvent event = new AuditEvent(tenantId, eventType)
                    .withUser(userId, username)
                    .withAction(action)
                    .withEntity(entityType, entityId)
                    .withDescription(description)
                    .withMetadata(metadata);

                return logEvent(event);
            });
    }

    /**
     * Log a failed action.
     *
     * @param eventType Event type
     * @param userId User ID
     * @param username Username
     * @param description Description
     * @param errorMessage Error message
     * @return Mono<AuditEvent>
     */
    public Mono<AuditEvent> logFailure(
            AuditEventType eventType,
            String userId,
            String username,
            String description,
            String errorMessage) {

        return TenantContext.getTenantId()
            .flatMap(tenantId -> {
                AuditEvent event = new AuditEvent(tenantId, eventType)
                    .withUser(userId, username)
                    .withDescription(description)
                    .withFailure(errorMessage);

                return logEvent(event);
            });
    }

    /**
     * Log a security event.
     *
     * @param eventType Event type
     * @param description Description
     * @param ipAddress IP address
     * @param userAgent User agent
     * @return Mono<AuditEvent>
     */
    public Mono<AuditEvent> logSecurityEvent(
            AuditEventType eventType,
            String description,
            String ipAddress,
            String userAgent) {

        return TenantContext.getTenantId()
            .flatMap(tenantId -> {
                AuditEvent event = new AuditEvent(tenantId, eventType)
                    .withDescription(description)
                    .withRequest(ipAddress, userAgent)
                    .withSeverity(AuditSeverity.WARNING);

                return logEvent(event);
            });
    }

    /**
     * Get audit events for a time range.
     *
     * @param startDate Start date
     * @param endDate End date
     * @return Flux<AuditEvent>
     */
    public Flux<AuditEvent> getAuditEvents(Instant startDate, Instant endDate) {
        return TenantContext.getTenantId()
            .flatMapMany(tenantId ->
                auditEventRepository.findByTenantIdAndTimestampBetweenOrderByTimestampDesc(
                    tenantId, startDate, endDate
                )
            );
    }

    /**
     * Get audit events for a specific user.
     *
     * @param userId User ID
     * @return Flux<AuditEvent>
     */
    public Flux<AuditEvent> getAuditEventsByUser(String userId) {
        return TenantContext.getTenantId()
            .flatMapMany(tenantId ->
                auditEventRepository.findByTenantIdAndUserIdOrderByTimestampDesc(
                    tenantId, userId
                )
            );
    }

    /**
     * Get audit events for a specific entity.
     *
     * @param entityType Entity type
     * @param entityId Entity ID
     * @return Flux<AuditEvent>
     */
    public Flux<AuditEvent> getAuditEventsByEntity(String entityType, String entityId) {
        return TenantContext.getTenantId()
            .flatMapMany(tenantId ->
                auditEventRepository.findByTenantIdAndEntityTypeAndEntityIdOrderByTimestampDesc(
                    tenantId, entityType, entityId
                )
            );
    }

    /**
     * Get audit events by type.
     *
     * @param eventType Event type
     * @return Flux<AuditEvent>
     */
    public Flux<AuditEvent> getAuditEventsByType(AuditEventType eventType) {
        return TenantContext.getTenantId()
            .flatMapMany(tenantId ->
                auditEventRepository.findByTenantIdAndEventTypeOrderByTimestampDesc(
                    tenantId, eventType
                )
            );
    }

    /**
     * Get failed audit events (for security monitoring).
     *
     * @return Flux<AuditEvent>
     */
    public Flux<AuditEvent> getFailedEvents() {
        return TenantContext.getTenantId()
            .flatMapMany(auditEventRepository::findByTenantIdAndSuccessFalseOrderByTimestampDesc);
    }

    /**
     * Clean up old audit events based on retention policy.
     * Keeps last 90 days by default.
     *
     * @param retentionDays Number of days to retain
     * @return Mono<Void>
     */
    public Mono<Void> cleanupOldEvents(int retentionDays) {
        Instant cutoffDate = Instant.now().minus(retentionDays, ChronoUnit.DAYS);

        return TenantContext.getTenantId()
            .flatMap(tenantId -> {
                logger.info("Cleaning up audit events older than {} days for tenant {}",
                    retentionDays, tenantId);

                return auditEventRepository.deleteByTenantIdAndTimestampBefore(
                    tenantId, cutoffDate
                );
            });
    }

    /**
     * Get audit event count for current tenant.
     *
     * @return Mono<Long>
     */
    public Mono<Long> getEventCount() {
        return TenantContext.getTenantId()
            .flatMap(auditEventRepository::countByTenantId);
    }
}
