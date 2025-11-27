package com.retail.domain.notification;

import com.retail.infrastructure.persistence.NotificationRepository;
import com.retail.security.tenant.TenantContext;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock
    private NotificationRepository notificationRepository;

    private NotificationService notificationService;

    private static final String TEST_TENANT_ID = "tenant-123";
    private static final String TEST_USER_ID = "user-123";
    private static final String TEST_EMAIL = "test@example.com";

    @BeforeEach
    void setUp() {
        notificationService = new NotificationService(notificationRepository);
    }

    @Test
    void createNotification_shouldSaveNotification() {
        // Arrange
        Map<String, Object> templateData = Map.of("key", "value");

        Notification notification = new Notification(
            TEST_TENANT_ID,
            NotificationType.ORDER_CONFIRMATION,
            NotificationChannel.EMAIL
        );

        when(notificationRepository.save(any(Notification.class)))
            .thenReturn(Mono.just(notification));

        // Act
        ArgumentCaptor<Notification> notificationCaptor = ArgumentCaptor.forClass(Notification.class);

        StepVerifier.create(
            notificationService.createNotification(
                TEST_USER_ID,
                TEST_EMAIL,
                NotificationType.ORDER_CONFIRMATION,
                NotificationChannel.EMAIL,
                "Order Confirmed",
                "Your order has been confirmed",
                templateData
            )
        )
        .expectNextCount(1)
        .verifyComplete();

        // Assert
        verify(notificationRepository).save(notificationCaptor.capture());
        Notification capturedNotification = notificationCaptor.getValue();

        assertThat(capturedNotification.getTenantId()).isEqualTo(TEST_TENANT_ID);
        assertThat(capturedNotification.getUserId()).isEqualTo(TEST_USER_ID);
        assertThat(capturedNotification.getEmail()).isEqualTo(TEST_EMAIL);
        assertThat(capturedNotification.getType()).isEqualTo(NotificationType.ORDER_CONFIRMATION);
        assertThat(capturedNotification.getChannel()).isEqualTo(NotificationChannel.EMAIL);
        assertThat(capturedNotification.getTemplateData()).isEqualTo(templateData);
    }

    @Test
    void createNotificationFromTemplate_shouldUseTemplate() {
        // Arrange
        Map<String, Object> templateData = Map.of("orderNumber", "ORD-123");

        Notification notification = new Notification(
            TEST_TENANT_ID,
            NotificationType.ORDER_CONFIRMATION,
            NotificationChannel.EMAIL
        );

        when(notificationRepository.save(any(Notification.class)))
            .thenReturn(Mono.just(notification));

        // Act
        ArgumentCaptor<Notification> notificationCaptor = ArgumentCaptor.forClass(Notification.class);

        StepVerifier.create(
            notificationService.createNotificationFromTemplate(
                TEST_USER_ID,
                TEST_EMAIL,
                NotificationType.ORDER_CONFIRMATION,
                NotificationChannel.EMAIL,
                "order-confirmation-template",
                templateData
            )
        )
        .expectNextCount(1)
        .verifyComplete();

        // Assert
        verify(notificationRepository).save(notificationCaptor.capture());
        Notification capturedNotification = notificationCaptor.getValue();

        assertThat(capturedNotification.getTemplateId()).isEqualTo("order-confirmation-template");
        assertThat(capturedNotification.getTemplateData()).isEqualTo(templateData);
    }

    @Test
    void scheduleNotification_shouldSetScheduledTime() {
        // Arrange
        Instant scheduledFor = Instant.now().plus(1, ChronoUnit.HOURS);

        Notification notification = new Notification(
            TEST_TENANT_ID,
            NotificationType.PROMOTIONAL,
            NotificationChannel.EMAIL
        );

        when(notificationRepository.save(any(Notification.class)))
            .thenReturn(Mono.just(notification));

        // Act
        ArgumentCaptor<Notification> notificationCaptor = ArgumentCaptor.forClass(Notification.class);

        StepVerifier.create(
            notificationService.scheduleNotification(
                TEST_USER_ID,
                TEST_EMAIL,
                NotificationType.PROMOTIONAL,
                NotificationChannel.EMAIL,
                "Special Offer",
                "Check out our special offer",
                scheduledFor,
                Map.of()
            )
        )
        .expectNextCount(1)
        .verifyComplete();

        // Assert
        verify(notificationRepository).save(notificationCaptor.capture());
        Notification capturedNotification = notificationCaptor.getValue();

        assertThat(capturedNotification.getScheduledFor()).isEqualTo(scheduledFor);
        assertThat(capturedNotification.getStatus()).isEqualTo(NotificationStatus.PENDING);
    }

    @Test
    void markSent_shouldUpdateStatus() {
        // Arrange
        String notificationId = "notification-123";
        String externalId = "external-456";

        Notification notification = new Notification(
            TEST_TENANT_ID,
            NotificationType.ORDER_CONFIRMATION,
            NotificationChannel.EMAIL
        );

        when(notificationRepository.findById(notificationId))
            .thenReturn(Mono.just(notification));
        when(notificationRepository.save(any(Notification.class)))
            .thenReturn(Mono.just(notification));

        // Act & Assert
        StepVerifier.create(notificationService.markSent(notificationId, externalId))
            .assertNext(updated -> {
                assertThat(updated.getStatus()).isEqualTo(NotificationStatus.SENT);
                assertThat(updated.getExternalId()).isEqualTo(externalId);
                assertThat(updated.getSentAt()).isNotNull();
            })
            .verifyComplete();
    }

    @Test
    void markDelivered_shouldUpdateStatus() {
        // Arrange
        String notificationId = "notification-123";

        Notification notification = new Notification(
            TEST_TENANT_ID,
            NotificationType.ORDER_CONFIRMATION,
            NotificationChannel.EMAIL
        );

        when(notificationRepository.findById(notificationId))
            .thenReturn(Mono.just(notification));
        when(notificationRepository.save(any(Notification.class)))
            .thenReturn(Mono.just(notification));

        // Act & Assert
        StepVerifier.create(notificationService.markDelivered(notificationId))
            .assertNext(updated -> {
                assertThat(updated.getStatus()).isEqualTo(NotificationStatus.DELIVERED);
                assertThat(updated.getDeliveredAt()).isNotNull();
            })
            .verifyComplete();
    }

    @Test
    void markFailed_shouldUpdateStatusAndIncrementRetry() {
        // Arrange
        String notificationId = "notification-123";
        String errorMessage = "SMTP connection failed";

        Notification notification = new Notification(
            TEST_TENANT_ID,
            NotificationType.ORDER_CONFIRMATION,
            NotificationChannel.EMAIL
        );

        when(notificationRepository.findById(notificationId))
            .thenReturn(Mono.just(notification));
        when(notificationRepository.save(any(Notification.class)))
            .thenReturn(Mono.just(notification));

        // Act & Assert
        StepVerifier.create(notificationService.markFailed(notificationId, errorMessage))
            .assertNext(updated -> {
                assertThat(updated.getStatus()).isEqualTo(NotificationStatus.FAILED);
                assertThat(updated.getErrorMessage()).isEqualTo(errorMessage);
                assertThat(updated.getRetryCount()).isEqualTo(1);
            })
            .verifyComplete();
    }

    @Test
    void getUserNotifications_shouldReturnUserNotifications() {
        // Arrange
        Notification notification1 = new Notification(
            TEST_TENANT_ID,
            NotificationType.ORDER_CONFIRMATION,
            NotificationChannel.EMAIL
        );
        notification1.setUserId(TEST_USER_ID);

        Notification notification2 = new Notification(
            TEST_TENANT_ID,
            NotificationType.ORDER_SHIPPED,
            NotificationChannel.EMAIL
        );
        notification2.setUserId(TEST_USER_ID);

        when(notificationRepository.findByTenantIdAndUserIdOrderByCreatedAtDesc(
            TEST_TENANT_ID, TEST_USER_ID
        ))
        .thenReturn(Flux.just(notification1, notification2));

        // Act & Assert
        StepVerifier.create(notificationService.getUserNotifications(TEST_USER_ID))
            .expectNext(notification1)
            .expectNext(notification2)
            .verifyComplete();
    }

    @Test
    void getNotificationsByStatus_shouldReturnFilteredNotifications() {
        // Arrange
        Notification notification = new Notification(
            TEST_TENANT_ID,
            NotificationType.ORDER_CONFIRMATION,
            NotificationChannel.EMAIL
        );
        notification.setStatus(NotificationStatus.PENDING);

        when(notificationRepository.findByTenantIdAndStatusOrderByCreatedAtDesc(
            TEST_TENANT_ID, NotificationStatus.PENDING
        ))
        .thenReturn(Flux.just(notification));

        // Act & Assert
        StepVerifier.create(
            notificationService.getNotificationsByStatus(NotificationStatus.PENDING)
        )
        .expectNext(notification)
        .verifyComplete();
    }

    @Test
    void getPendingScheduledNotifications_shouldReturnReadyNotifications() {
        // Arrange
        Notification notification = new Notification(
            TEST_TENANT_ID,
            NotificationType.PROMOTIONAL,
            NotificationChannel.EMAIL
        );
        notification.setScheduledFor(Instant.now().minus(1, ChronoUnit.HOURS));

        when(notificationRepository.findByTenantIdAndStatusAndScheduledForLessThanEqual(
            eq(TEST_TENANT_ID),
            eq(NotificationStatus.PENDING),
            any(Instant.class)
        ))
        .thenReturn(Flux.just(notification));

        // Act & Assert
        StepVerifier.create(notificationService.getPendingScheduledNotifications())
            .expectNext(notification)
            .verifyComplete();
    }

    @Test
    void getFailedNotificationsForRetry_shouldReturnRetryableNotifications() {
        // Arrange
        Notification notification = new Notification(
            TEST_TENANT_ID,
            NotificationType.ORDER_CONFIRMATION,
            NotificationChannel.EMAIL
        );
        notification.setStatus(NotificationStatus.FAILED);
        notification.setRetryCount(1);

        when(notificationRepository.findByTenantIdAndStatusAndRetryCountLessThan(
            TEST_TENANT_ID, NotificationStatus.FAILED, 3
        ))
        .thenReturn(Flux.just(notification));

        // Act & Assert
        StepVerifier.create(notificationService.getFailedNotificationsForRetry())
            .expectNext(notification)
            .verifyComplete();
    }

    @Test
    void cancelNotification_shouldCancelPendingNotification() {
        // Arrange
        String notificationId = "notification-123";

        Notification notification = new Notification(
            TEST_TENANT_ID,
            NotificationType.PROMOTIONAL,
            NotificationChannel.EMAIL
        );
        notification.setStatus(NotificationStatus.PENDING);

        when(notificationRepository.findById(notificationId))
            .thenReturn(Mono.just(notification));
        when(notificationRepository.save(any(Notification.class)))
            .thenReturn(Mono.just(notification));

        // Act & Assert
        StepVerifier.create(notificationService.cancelNotification(notificationId))
            .assertNext(cancelled -> {
                assertThat(cancelled.getStatus()).isEqualTo(NotificationStatus.CANCELLED);
            })
            .verifyComplete();
    }

    @Test
    void cancelNotification_withNonPendingStatus_shouldFail() {
        // Arrange
        String notificationId = "notification-123";

        Notification notification = new Notification(
            TEST_TENANT_ID,
            NotificationType.ORDER_CONFIRMATION,
            NotificationChannel.EMAIL
        );
        notification.setStatus(NotificationStatus.SENT);

        when(notificationRepository.findById(notificationId))
            .thenReturn(Mono.just(notification));

        // Act & Assert
        StepVerifier.create(notificationService.cancelNotification(notificationId))
            .expectError(IllegalStateException.class)
            .verify();
    }

    @Test
    void cleanupOldNotifications_shouldDeleteOldNotifications() {
        // Arrange
        int retentionDays = 90;

        when(notificationRepository.deleteByTenantIdAndCreatedAtBefore(
            eq(TEST_TENANT_ID), any(Instant.class)
        ))
        .thenReturn(Mono.empty());

        // Act & Assert
        StepVerifier.create(notificationService.cleanupOldNotifications(retentionDays))
            .verifyComplete();

        verify(notificationRepository).deleteByTenantIdAndCreatedAtBefore(
            eq(TEST_TENANT_ID), any(Instant.class)
        );
    }

    @Test
    void getNotificationStats_shouldReturnStats() {
        // Arrange
        when(notificationRepository.countByTenantIdAndStatus(TEST_TENANT_ID, NotificationStatus.PENDING))
            .thenReturn(Mono.just(10L));
        when(notificationRepository.countByTenantIdAndStatus(TEST_TENANT_ID, NotificationStatus.SENT))
            .thenReturn(Mono.just(50L));
        when(notificationRepository.countByTenantIdAndStatus(TEST_TENANT_ID, NotificationStatus.DELIVERED))
            .thenReturn(Mono.just(45L));
        when(notificationRepository.countByTenantIdAndStatus(TEST_TENANT_ID, NotificationStatus.FAILED))
            .thenReturn(Mono.just(5L));

        // Act & Assert
        StepVerifier.create(notificationService.getNotificationStats())
            .assertNext(stats -> {
                assertThat(stats.pending()).isEqualTo(10L);
                assertThat(stats.sent()).isEqualTo(50L);
                assertThat(stats.delivered()).isEqualTo(45L);
                assertThat(stats.failed()).isEqualTo(5L);
            })
            .verifyComplete();
    }
}
