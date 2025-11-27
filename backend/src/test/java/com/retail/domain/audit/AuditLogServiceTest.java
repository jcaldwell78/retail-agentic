package com.retail.domain.audit;

import com.retail.infrastructure.persistence.AuditEventRepository;
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
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuditLogServiceTest {

    @Mock
    private AuditEventRepository auditEventRepository;

    private AuditLogService auditLogService;

    private static final String TEST_TENANT_ID = "tenant-123";
    private static final String TEST_USER_ID = "user-123";
    private static final String TEST_USERNAME = "testuser";

    @BeforeEach
    void setUp() {
        auditLogService = new AuditLogService(auditEventRepository);
    }

    @Test
    void logEvent_shouldSaveAuditEvent() {
        // Arrange
        AuditEvent event = new AuditEvent(TEST_TENANT_ID, AuditEventType.USER_LOGIN);
        event.setUserId(TEST_USER_ID);
        event.setUsername(TEST_USERNAME);

        when(auditEventRepository.save(any(AuditEvent.class)))
            .thenReturn(Mono.just(event));

        // Act & Assert
        StepVerifier.create(auditLogService.logEvent(event)
            .contextWrite(TenantContext.withTenantId(TEST_TENANT_ID)))
            .assertNext(savedEvent -> {
                assertThat(savedEvent.getTenantId()).isEqualTo(TEST_TENANT_ID);
                assertThat(savedEvent.getUserId()).isEqualTo(TEST_USER_ID);
                assertThat(savedEvent.getEventType()).isEqualTo(AuditEventType.USER_LOGIN);
            })
            .verifyComplete();

        verify(auditEventRepository).save(event);
    }

    @Test
    void log_shouldCreateAndSaveSimpleEvent() {
        // Arrange
        AuditEvent savedEvent = new AuditEvent(TEST_TENANT_ID, AuditEventType.PRODUCT_CREATED);
        savedEvent.setDescription("Test description");

        when(auditEventRepository.save(any(AuditEvent.class)))
            .thenReturn(Mono.just(savedEvent));

        // Act & Assert
        StepVerifier.create(
            auditLogService.log(AuditEventType.PRODUCT_CREATED, "Test description")
                .contextWrite(TenantContext.withTenantId(TEST_TENANT_ID))
        )
        .assertNext(event -> {
            assertThat(event.getTenantId()).isEqualTo(TEST_TENANT_ID);
            assertThat(event.getEventType()).isEqualTo(AuditEventType.PRODUCT_CREATED);
            assertThat(event.getDescription()).isEqualTo("Test description");
        })
        .verifyComplete();
    }

    @Test
    void logUserAction_shouldCreateEventWithUserAndEntity() {
        // Arrange
        AuditEvent savedEvent = new AuditEvent(TEST_TENANT_ID, AuditEventType.PRODUCT_UPDATED);

        when(auditEventRepository.save(any(AuditEvent.class)))
            .thenReturn(Mono.just(savedEvent));

        // Act
        ArgumentCaptor<AuditEvent> eventCaptor = ArgumentCaptor.forClass(AuditEvent.class);

        StepVerifier.create(
            auditLogService.logUserAction(
                AuditEventType.PRODUCT_UPDATED,
                TEST_USER_ID,
                TEST_USERNAME,
                AuditAction.UPDATE,
                "Product",
                "product-123",
                "Updated product details"
            )
            .contextWrite(TenantContext.withTenantId(TEST_TENANT_ID))
        )
        .expectNextCount(1)
        .verifyComplete();

        // Assert
        verify(auditEventRepository).save(eventCaptor.capture());
        AuditEvent capturedEvent = eventCaptor.getValue();

        assertThat(capturedEvent.getTenantId()).isEqualTo(TEST_TENANT_ID);
        assertThat(capturedEvent.getUserId()).isEqualTo(TEST_USER_ID);
        assertThat(capturedEvent.getUsername()).isEqualTo(TEST_USERNAME);
        assertThat(capturedEvent.getAction()).isEqualTo(AuditAction.UPDATE);
        assertThat(capturedEvent.getEntityType()).isEqualTo("Product");
        assertThat(capturedEvent.getEntityId()).isEqualTo("product-123");
    }

    @Test
    void logUserActionWithMetadata_shouldIncludeMetadata() {
        // Arrange
        Map<String, Object> metadata = Map.of(
            "oldPrice", "10.00",
            "newPrice", "15.00"
        );

        AuditEvent savedEvent = new AuditEvent(TEST_TENANT_ID, AuditEventType.PRODUCT_UPDATED);

        when(auditEventRepository.save(any(AuditEvent.class)))
            .thenReturn(Mono.just(savedEvent));

        // Act
        ArgumentCaptor<AuditEvent> eventCaptor = ArgumentCaptor.forClass(AuditEvent.class);

        StepVerifier.create(
            auditLogService.logUserActionWithMetadata(
                AuditEventType.PRODUCT_UPDATED,
                TEST_USER_ID,
                TEST_USERNAME,
                AuditAction.UPDATE,
                "Product",
                "product-123",
                "Price changed",
                metadata
            )
            .contextWrite(TenantContext.withTenantId(TEST_TENANT_ID))
        )
        .expectNextCount(1)
        .verifyComplete();

        // Assert
        verify(auditEventRepository).save(eventCaptor.capture());
        AuditEvent capturedEvent = eventCaptor.getValue();

        assertThat(capturedEvent.getMetadata()).isEqualTo(metadata);
    }

    @Test
    void logFailure_shouldMarkEventAsFailed() {
        // Arrange
        AuditEvent savedEvent = new AuditEvent(TEST_TENANT_ID, AuditEventType.USER_LOGIN_FAILED);

        when(auditEventRepository.save(any(AuditEvent.class)))
            .thenReturn(Mono.just(savedEvent));

        // Act
        ArgumentCaptor<AuditEvent> eventCaptor = ArgumentCaptor.forClass(AuditEvent.class);

        StepVerifier.create(
            auditLogService.logFailure(
                AuditEventType.USER_LOGIN_FAILED,
                TEST_USER_ID,
                TEST_USERNAME,
                "Login attempt failed",
                "Invalid credentials"
            )
            .contextWrite(TenantContext.withTenantId(TEST_TENANT_ID))
        )
        .expectNextCount(1)
        .verifyComplete();

        // Assert
        verify(auditEventRepository).save(eventCaptor.capture());
        AuditEvent capturedEvent = eventCaptor.getValue();

        assertThat(capturedEvent.isSuccess()).isFalse();
        assertThat(capturedEvent.getErrorMessage()).isEqualTo("Invalid credentials");
        assertThat(capturedEvent.getSeverity()).isEqualTo(AuditSeverity.ERROR);
    }

    @Test
    void logSecurityEvent_shouldCreateSecurityEvent() {
        // Arrange
        AuditEvent savedEvent = new AuditEvent(TEST_TENANT_ID, AuditEventType.SUSPICIOUS_ACTIVITY);

        when(auditEventRepository.save(any(AuditEvent.class)))
            .thenReturn(Mono.just(savedEvent));

        // Act
        ArgumentCaptor<AuditEvent> eventCaptor = ArgumentCaptor.forClass(AuditEvent.class);

        StepVerifier.create(
            auditLogService.logSecurityEvent(
                AuditEventType.SUSPICIOUS_ACTIVITY,
                "Multiple failed login attempts",
                "192.168.1.1",
                "Mozilla/5.0"
            )
            .contextWrite(TenantContext.withTenantId(TEST_TENANT_ID))
        )
        .expectNextCount(1)
        .verifyComplete();

        // Assert
        verify(auditEventRepository).save(eventCaptor.capture());
        AuditEvent capturedEvent = eventCaptor.getValue();

        assertThat(capturedEvent.getIpAddress()).isEqualTo("192.168.1.1");
        assertThat(capturedEvent.getUserAgent()).isEqualTo("Mozilla/5.0");
        assertThat(capturedEvent.getSeverity()).isEqualTo(AuditSeverity.WARNING);
    }

    @Test
    void getAuditEvents_shouldReturnEventsForTimeRange() {
        // Arrange
        Instant startDate = Instant.now().minusSeconds(3600);
        Instant endDate = Instant.now();

        AuditEvent event1 = new AuditEvent(TEST_TENANT_ID, AuditEventType.USER_LOGIN);
        AuditEvent event2 = new AuditEvent(TEST_TENANT_ID, AuditEventType.PRODUCT_CREATED);

        when(auditEventRepository.findByTenantIdAndTimestampBetweenOrderByTimestampDesc(
            eq(TEST_TENANT_ID), any(Instant.class), any(Instant.class)
        ))
        .thenReturn(Flux.just(event1, event2));

        // Act & Assert
        StepVerifier.create(auditLogService.getAuditEvents(startDate, endDate)
            .contextWrite(TenantContext.withTenantId(TEST_TENANT_ID)))
            .expectNext(event1)
            .expectNext(event2)
            .verifyComplete();
    }

    @Test
    void getAuditEventsByUser_shouldReturnUserEvents() {
        // Arrange
        AuditEvent event1 = new AuditEvent(TEST_TENANT_ID, AuditEventType.USER_LOGIN);
        event1.setUserId(TEST_USER_ID);

        when(auditEventRepository.findByTenantIdAndUserIdOrderByTimestampDesc(
            TEST_TENANT_ID, TEST_USER_ID
        ))
        .thenReturn(Flux.just(event1));

        // Act & Assert
        StepVerifier.create(auditLogService.getAuditEventsByUser(TEST_USER_ID)
            .contextWrite(TenantContext.withTenantId(TEST_TENANT_ID)))
            .expectNext(event1)
            .verifyComplete();
    }

    @Test
    void getFailedEvents_shouldReturnFailedEvents() {
        // Arrange
        AuditEvent failedEvent = new AuditEvent(TEST_TENANT_ID, AuditEventType.USER_LOGIN_FAILED);
        failedEvent.setSuccess(false);

        when(auditEventRepository.findByTenantIdAndSuccessFalseOrderByTimestampDesc(TEST_TENANT_ID))
            .thenReturn(Flux.just(failedEvent));

        // Act & Assert
        StepVerifier.create(auditLogService.getFailedEvents()
            .contextWrite(TenantContext.withTenantId(TEST_TENANT_ID)))
            .expectNext(failedEvent)
            .verifyComplete();
    }

    @Test
    void cleanupOldEvents_shouldDeleteOldEvents() {
        // Arrange
        int retentionDays = 90;

        when(auditEventRepository.deleteByTenantIdAndTimestampBefore(
            eq(TEST_TENANT_ID), any(Instant.class)
        ))
        .thenReturn(Mono.empty());

        // Act & Assert
        StepVerifier.create(auditLogService.cleanupOldEvents(retentionDays)
            .contextWrite(TenantContext.withTenantId(TEST_TENANT_ID)))
            .verifyComplete();

        verify(auditEventRepository).deleteByTenantIdAndTimestampBefore(
            eq(TEST_TENANT_ID), any(Instant.class)
        );
    }

    @Test
    void getEventCount_shouldReturnCount() {
        // Arrange
        when(auditEventRepository.countByTenantId(TEST_TENANT_ID))
            .thenReturn(Mono.just(42L));

        // Act & Assert
        StepVerifier.create(auditLogService.getEventCount()
            .contextWrite(TenantContext.withTenantId(TEST_TENANT_ID)))
            .expectNext(42L)
            .verifyComplete();
    }
}
