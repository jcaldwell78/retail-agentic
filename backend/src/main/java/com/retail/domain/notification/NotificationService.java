package com.retail.domain.notification;

import com.retail.infrastructure.persistence.NotificationRepository;
import com.retail.security.tenant.TenantContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Map;
import java.util.UUID;

/**
 * Service for managing notifications.
 * Provides API for creating, sending, and tracking notifications.
 */
@Service
public class NotificationService {

    private static final Logger logger = LoggerFactory.getLogger(NotificationService.class);
    private static final int MAX_RETRY_COUNT = 3;

    private final NotificationRepository notificationRepository;

    public NotificationService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    /**
     * Create and queue a notification for delivery.
     *
     * @param userId User ID
     * @param email Email address
     * @param type Notification type
     * @param channel Delivery channel
     * @param subject Subject line (for email)
     * @param content Message content
     * @param templateData Template data for rendering
     * @return Mono<Notification>
     */
    public Mono<Notification> createNotification(
            String userId,
            String email,
            NotificationType type,
            NotificationChannel channel,
            String subject,
            String content,
            Map<String, Object> templateData) {

        return TenantContext.getTenantId()
            .flatMap(tenantId -> {
                Notification notification = new Notification(tenantId, type, channel);
                notification.setId(UUID.randomUUID().toString());
                notification.setUserId(userId);
                notification.setEmail(email);
                notification.setSubject(subject);
                notification.setContent(content);
                notification.setTemplateData(templateData);

                logger.info("Creating notification: type={}, channel={}, userId={}",
                    type, channel, userId);

                return notificationRepository.save(notification);
            });
    }

    /**
     * Create notification using template.
     *
     * @param userId User ID
     * @param email Email address
     * @param type Notification type
     * @param channel Delivery channel
     * @param templateId Template identifier
     * @param templateData Template data
     * @return Mono<Notification>
     */
    public Mono<Notification> createNotificationFromTemplate(
            String userId,
            String email,
            NotificationType type,
            NotificationChannel channel,
            String templateId,
            Map<String, Object> templateData) {

        return TenantContext.getTenantId()
            .flatMap(tenantId -> {
                Notification notification = new Notification(tenantId, type, channel);
                notification.setId(UUID.randomUUID().toString());
                notification.setUserId(userId);
                notification.setEmail(email);
                notification.setTemplateId(templateId);
                notification.setTemplateData(templateData);

                logger.info("Creating notification from template: type={}, template={}, userId={}",
                    type, templateId, userId);

                return notificationRepository.save(notification);
            });
    }

    /**
     * Schedule a notification for future delivery.
     *
     * @param userId User ID
     * @param email Email address
     * @param type Notification type
     * @param channel Delivery channel
     * @param subject Subject
     * @param content Content
     * @param scheduledFor Scheduled delivery time
     * @param templateData Template data
     * @return Mono<Notification>
     */
    public Mono<Notification> scheduleNotification(
            String userId,
            String email,
            NotificationType type,
            NotificationChannel channel,
            String subject,
            String content,
            Instant scheduledFor,
            Map<String, Object> templateData) {

        return TenantContext.getTenantId()
            .flatMap(tenantId -> {
                Notification notification = new Notification(tenantId, type, channel);
                notification.setId(UUID.randomUUID().toString());
                notification.setUserId(userId);
                notification.setEmail(email);
                notification.setSubject(subject);
                notification.setContent(content);
                notification.setTemplateData(templateData);
                notification.setScheduledFor(scheduledFor);

                logger.info("Scheduling notification: type={}, scheduledFor={}, userId={}",
                    type, scheduledFor, userId);

                return notificationRepository.save(notification);
            });
    }

    /**
     * Mark notification as sent.
     *
     * @param notificationId Notification ID
     * @param externalId External provider ID
     * @return Mono<Notification>
     */
    public Mono<Notification> markSent(String notificationId, String externalId) {
        return notificationRepository.findById(notificationId)
            .flatMap(notification -> {
                notification.markSent(externalId);
                logger.info("Notification sent: id={}, externalId={}", notificationId, externalId);
                return notificationRepository.save(notification);
            });
    }

    /**
     * Mark notification as delivered.
     *
     * @param notificationId Notification ID
     * @return Mono<Notification>
     */
    public Mono<Notification> markDelivered(String notificationId) {
        return notificationRepository.findById(notificationId)
            .flatMap(notification -> {
                notification.markDelivered();
                logger.info("Notification delivered: id={}", notificationId);
                return notificationRepository.save(notification);
            });
    }

    /**
     * Mark notification as failed.
     *
     * @param notificationId Notification ID
     * @param errorMessage Error message
     * @return Mono<Notification>
     */
    public Mono<Notification> markFailed(String notificationId, String errorMessage) {
        return notificationRepository.findById(notificationId)
            .flatMap(notification -> {
                notification.markFailed(errorMessage);
                notification.incrementRetry();
                logger.warn("Notification failed: id={}, error={}, retryCount={}",
                    notificationId, errorMessage, notification.getRetryCount());
                return notificationRepository.save(notification);
            });
    }

    /**
     * Get notifications for a user.
     *
     * @param userId User ID
     * @return Flux<Notification>
     */
    public Flux<Notification> getUserNotifications(String userId) {
        return TenantContext.getTenantId()
            .flatMapMany(tenantId ->
                notificationRepository.findByTenantIdAndUserIdOrderByCreatedAtDesc(
                    tenantId, userId
                )
            );
    }

    /**
     * Get notifications by status.
     *
     * @param status Notification status
     * @return Flux<Notification>
     */
    public Flux<Notification> getNotificationsByStatus(NotificationStatus status) {
        return TenantContext.getTenantId()
            .flatMapMany(tenantId ->
                notificationRepository.findByTenantIdAndStatusOrderByCreatedAtDesc(
                    tenantId, status
                )
            );
    }

    /**
     * Get pending scheduled notifications ready for delivery.
     *
     * @return Flux<Notification>
     */
    public Flux<Notification> getPendingScheduledNotifications() {
        return TenantContext.getTenantId()
            .flatMapMany(tenantId ->
                notificationRepository.findByTenantIdAndStatusAndScheduledForLessThanEqual(
                    tenantId, NotificationStatus.PENDING, Instant.now()
                )
            );
    }

    /**
     * Get failed notifications eligible for retry.
     *
     * @return Flux<Notification>
     */
    public Flux<Notification> getFailedNotificationsForRetry() {
        return TenantContext.getTenantId()
            .flatMapMany(tenantId ->
                notificationRepository.findByTenantIdAndStatusAndRetryCountLessThan(
                    tenantId, NotificationStatus.FAILED, MAX_RETRY_COUNT
                )
            );
    }

    /**
     * Cancel a pending notification.
     *
     * @param notificationId Notification ID
     * @return Mono<Notification>
     */
    public Mono<Notification> cancelNotification(String notificationId) {
        return notificationRepository.findById(notificationId)
            .flatMap(notification -> {
                if (notification.getStatus() == NotificationStatus.PENDING) {
                    notification.setStatus(NotificationStatus.CANCELLED);
                    logger.info("Notification cancelled: id={}", notificationId);
                    return notificationRepository.save(notification);
                } else {
                    return Mono.error(new IllegalStateException(
                        "Cannot cancel notification with status: " + notification.getStatus()
                    ));
                }
            });
    }

    /**
     * Clean up old notifications based on retention policy.
     *
     * @param retentionDays Number of days to retain
     * @return Mono<Void>
     */
    public Mono<Void> cleanupOldNotifications(int retentionDays) {
        Instant cutoffDate = Instant.now().minus(retentionDays, ChronoUnit.DAYS);

        return TenantContext.getTenantId()
            .flatMap(tenantId -> {
                logger.info("Cleaning up notifications older than {} days for tenant {}",
                    retentionDays, tenantId);

                return notificationRepository.deleteByTenantIdAndCreatedAtBefore(
                    tenantId, cutoffDate
                );
            });
    }

    /**
     * Get notification statistics.
     *
     * @return Mono<NotificationStats>
     */
    public Mono<NotificationStats> getNotificationStats() {
        return TenantContext.getTenantId()
            .flatMap(tenantId ->
                Mono.zip(
                    notificationRepository.countByTenantIdAndStatus(tenantId, NotificationStatus.PENDING),
                    notificationRepository.countByTenantIdAndStatus(tenantId, NotificationStatus.SENT),
                    notificationRepository.countByTenantIdAndStatus(tenantId, NotificationStatus.DELIVERED),
                    notificationRepository.countByTenantIdAndStatus(tenantId, NotificationStatus.FAILED)
                ).map(tuple -> new NotificationStats(
                    tuple.getT1(), // pending
                    tuple.getT2(), // sent
                    tuple.getT3(), // delivered
                    tuple.getT4()  // failed
                ))
            );
    }

    // Helper record for notification statistics
    public record NotificationStats(
        long pending,
        long sent,
        long delivered,
        long failed
    ) {}
}
