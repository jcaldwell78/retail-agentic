package com.retail.infrastructure.persistence;

import com.retail.domain.audit.AuditEvent;
import com.retail.domain.audit.AuditEventType;
import org.springframework.data.mongodb.repository.ReactiveMongoRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Instant;

/**
 * Repository for audit events.
 */
@Repository
public interface AuditEventRepository extends ReactiveMongoRepository<AuditEvent, String> {

    /**
     * Find audit events for a tenant within a time range.
     */
    Flux<AuditEvent> findByTenantIdAndTimestampBetweenOrderByTimestampDesc(
        String tenantId,
        Instant startDate,
        Instant endDate
    );

    /**
     * Find audit events for a specific user.
     */
    Flux<AuditEvent> findByTenantIdAndUserIdOrderByTimestampDesc(
        String tenantId,
        String userId
    );

    /**
     * Find audit events for a specific entity.
     */
    Flux<AuditEvent> findByTenantIdAndEntityTypeAndEntityIdOrderByTimestampDesc(
        String tenantId,
        String entityType,
        String entityId
    );

    /**
     * Find audit events by type.
     */
    Flux<AuditEvent> findByTenantIdAndEventTypeOrderByTimestampDesc(
        String tenantId,
        AuditEventType eventType
    );

    /**
     * Find failed audit events (for security monitoring).
     */
    Flux<AuditEvent> findByTenantIdAndSuccessFalseOrderByTimestampDesc(
        String tenantId
    );

    /**
     * Count audit events for a tenant.
     */
    Mono<Long> countByTenantId(String tenantId);

    /**
     * Delete old audit events (for data retention).
     */
    Mono<Void> deleteByTenantIdAndTimestampBefore(String tenantId, Instant cutoffDate);
}
