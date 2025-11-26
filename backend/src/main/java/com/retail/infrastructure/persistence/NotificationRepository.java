package com.retail.infrastructure.persistence;

import com.retail.domain.notification.Notification;
import com.retail.domain.notification.NotificationStatus;
import com.retail.domain.notification.NotificationType;
import org.springframework.data.mongodb.repository.ReactiveMongoRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Instant;

/**
 * Repository for notifications.
 */
@Repository
public interface NotificationRepository extends ReactiveMongoRepository<Notification, String> {

    /**
     * Find notifications for a user.
     */
    Flux<Notification> findByTenantIdAndUserIdOrderByCreatedAtDesc(
        String tenantId,
        String userId
    );

    /**
     * Find notifications by status.
     */
    Flux<Notification> findByTenantIdAndStatusOrderByCreatedAtDesc(
        String tenantId,
        NotificationStatus status
    );

    /**
     * Find notifications by type.
     */
    Flux<Notification> findByTenantIdAndTypeOrderByCreatedAtDesc(
        String tenantId,
        NotificationType type
    );

    /**
     * Find pending notifications scheduled for delivery.
     */
    Flux<Notification> findByTenantIdAndStatusAndScheduledForLessThanEqual(
        String tenantId,
        NotificationStatus status,
        Instant scheduledFor
    );

    /**
     * Find failed notifications for retry.
     */
    Flux<Notification> findByTenantIdAndStatusAndRetryCountLessThan(
        String tenantId,
        NotificationStatus status,
        int maxRetries
    );

    /**
     * Count notifications by status.
     */
    Mono<Long> countByTenantIdAndStatus(String tenantId, NotificationStatus status);

    /**
     * Delete old notifications (data retention).
     */
    Mono<Void> deleteByTenantIdAndCreatedAtBefore(String tenantId, Instant cutoffDate);
}
