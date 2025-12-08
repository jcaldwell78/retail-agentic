package com.retail.domain.order;

import com.retail.domain.notification.Notification;
import com.retail.domain.notification.NotificationChannel;
import com.retail.domain.notification.NotificationService;
import com.retail.domain.notification.NotificationType;
import com.retail.infrastructure.persistence.OrderRepository;
import com.retail.security.tenant.TenantContext;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for OrderTrackingService.
 */
@ExtendWith(MockitoExtension.class)
class OrderTrackingServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private NotificationService notificationService;

    private OrderTrackingService orderTrackingService;

    private static final String TENANT_ID = "tenant-123";
    private static final String ORDER_ID = "order-456";
    private static final String ORDER_NUMBER = "ORD-20231207-0001";
    private static final String TRACKING_NUMBER = "1Z999AA10123456784";
    private static final String CARRIER = "UPS";
    private static final String CUSTOMER_EMAIL = "customer@example.com";

    @BeforeEach
    void setUp() {
        orderTrackingService = new OrderTrackingService(orderRepository, notificationService);
    }

    @Test
    @DisplayName("Should add tracking info to order")
    void shouldAddTrackingInfo() {
        // Arrange
        Order order = createOrder();
        Notification notification = new Notification(TENANT_ID, NotificationType.ORDER_SHIPPED, NotificationChannel.EMAIL);
        notification.setId("notification-1");

        when(orderRepository.findById(ORDER_ID))
            .thenReturn(Mono.just(order));
        when(orderRepository.save(any(Order.class)))
            .thenAnswer(invocation -> Mono.just(invocation.getArgument(0)));
        when(notificationService.createNotificationFromTemplate(
            isNull(), eq(CUSTOMER_EMAIL), eq(NotificationType.ORDER_SHIPPED),
            eq(NotificationChannel.EMAIL), anyString(), anyMap()))
            .thenReturn(Mono.just(notification));

        // Act & Assert
        StepVerifier.create(orderTrackingService.addTrackingInfo(ORDER_ID, CARRIER, TRACKING_NUMBER)
                .contextWrite(TenantContext.withTenantId(TENANT_ID)))
            .assertNext(updatedOrder -> {
                assertThat(updatedOrder.getCarrier()).isEqualTo(CARRIER);
                assertThat(updatedOrder.getTrackingNumber()).isEqualTo(TRACKING_NUMBER);
                assertThat(updatedOrder.getTrackingUrl()).contains("ups.com");
                assertThat(updatedOrder.getEstimatedDeliveryDate()).isNotNull();
                assertThat(updatedOrder.getStatus()).isEqualTo(OrderStatus.SHIPPED);
            })
            .verifyComplete();

        verify(orderRepository).findById(ORDER_ID);
        verify(orderRepository).save(any(Order.class));
        verify(notificationService).createNotificationFromTemplate(
            isNull(), eq(CUSTOMER_EMAIL), eq(NotificationType.ORDER_SHIPPED),
            eq(NotificationChannel.EMAIL), anyString(), anyMap());
    }

    @Test
    @DisplayName("Should generate correct tracking URL for different carriers")
    void shouldGenerateCorrectTrackingUrls() {
        // Arrange
        Order order = createOrder();
        Notification notification = new Notification(TENANT_ID, NotificationType.ORDER_SHIPPED, NotificationChannel.EMAIL);

        when(orderRepository.findById(ORDER_ID))
            .thenReturn(Mono.just(order));
        when(orderRepository.save(any(Order.class)))
            .thenAnswer(invocation -> Mono.just(invocation.getArgument(0)));
        when(notificationService.createNotificationFromTemplate(any(), any(), any(), any(), any(), any()))
            .thenReturn(Mono.just(notification));

        // Test UPS
        StepVerifier.create(orderTrackingService.addTrackingInfo(ORDER_ID, "UPS", "123")
                .contextWrite(TenantContext.withTenantId(TENANT_ID)))
            .assertNext(o -> assertThat(o.getTrackingUrl()).contains("ups.com"))
            .verifyComplete();

        // Reset order for next test
        order = createOrder();
        when(orderRepository.findById(ORDER_ID)).thenReturn(Mono.just(order));

        // Test FedEx
        StepVerifier.create(orderTrackingService.addTrackingInfo(ORDER_ID, "FEDEX", "456")
                .contextWrite(TenantContext.withTenantId(TENANT_ID)))
            .assertNext(o -> assertThat(o.getTrackingUrl()).contains("fedex.com"))
            .verifyComplete();

        // Reset order for next test
        order = createOrder();
        when(orderRepository.findById(ORDER_ID)).thenReturn(Mono.just(order));

        // Test USPS
        StepVerifier.create(orderTrackingService.addTrackingInfo(ORDER_ID, "USPS", "789")
                .contextWrite(TenantContext.withTenantId(TENANT_ID)))
            .assertNext(o -> assertThat(o.getTrackingUrl()).contains("usps.com"))
            .verifyComplete();
    }

    @Test
    @DisplayName("Should update estimated delivery date")
    void shouldUpdateEstimatedDelivery() {
        // Arrange
        Order order = createOrder();
        Instant newEstimate = Instant.now().plus(3, ChronoUnit.DAYS);

        when(orderRepository.findById(ORDER_ID))
            .thenReturn(Mono.just(order));
        when(orderRepository.save(any(Order.class)))
            .thenAnswer(invocation -> Mono.just(invocation.getArgument(0)));

        // Act & Assert
        StepVerifier.create(orderTrackingService.updateEstimatedDelivery(ORDER_ID, newEstimate)
                .contextWrite(TenantContext.withTenantId(TENANT_ID)))
            .assertNext(updatedOrder -> {
                assertThat(updatedOrder.getEstimatedDeliveryDate()).isEqualTo(newEstimate);
            })
            .verifyComplete();

        verify(orderRepository).findById(ORDER_ID);
        verify(orderRepository).save(any(Order.class));
    }

    @Test
    @DisplayName("Should mark order as delivered")
    void shouldMarkOrderAsDelivered() {
        // Arrange
        Order order = createOrder();
        order.setStatus(OrderStatus.SHIPPED);
        Notification notification = new Notification(TENANT_ID, NotificationType.ORDER_DELIVERED, NotificationChannel.EMAIL);

        when(orderRepository.findById(ORDER_ID))
            .thenReturn(Mono.just(order));
        when(orderRepository.save(any(Order.class)))
            .thenAnswer(invocation -> Mono.just(invocation.getArgument(0)));
        when(notificationService.createNotificationFromTemplate(
            isNull(), eq(CUSTOMER_EMAIL), eq(NotificationType.ORDER_DELIVERED),
            eq(NotificationChannel.EMAIL), anyString(), anyMap()))
            .thenReturn(Mono.just(notification));

        // Act & Assert
        StepVerifier.create(orderTrackingService.markDelivered(ORDER_ID)
                .contextWrite(TenantContext.withTenantId(TENANT_ID)))
            .assertNext(updatedOrder -> {
                assertThat(updatedOrder.getStatus()).isEqualTo(OrderStatus.DELIVERED);
                assertThat(updatedOrder.getActualDeliveryDate()).isNotNull();
                assertThat(updatedOrder.getStatusHistory()).hasSizeGreaterThan(1);
            })
            .verifyComplete();

        verify(orderRepository).findById(ORDER_ID);
        verify(orderRepository).save(any(Order.class));
        verify(notificationService).createNotificationFromTemplate(
            isNull(), eq(CUSTOMER_EMAIL), eq(NotificationType.ORDER_DELIVERED),
            eq(NotificationChannel.EMAIL), anyString(), anyMap());
    }

    @Test
    @DisplayName("Should get tracking info by order ID")
    void shouldGetTrackingInfoById() {
        // Arrange
        Order order = createOrder();
        order.setCarrier(CARRIER);
        order.setTrackingNumber(TRACKING_NUMBER);
        order.setStatus(OrderStatus.SHIPPED);

        when(orderRepository.findById(ORDER_ID))
            .thenReturn(Mono.just(order));

        // Act & Assert
        StepVerifier.create(orderTrackingService.getTrackingInfo(ORDER_ID)
                .contextWrite(TenantContext.withTenantId(TENANT_ID)))
            .assertNext(info -> {
                assertThat(info.orderNumber()).isEqualTo(ORDER_NUMBER);
                assertThat(info.carrier()).isEqualTo(CARRIER);
                assertThat(info.trackingNumber()).isEqualTo(TRACKING_NUMBER);
                assertThat(info.status()).isEqualTo(OrderStatus.SHIPPED);
            })
            .verifyComplete();

        verify(orderRepository).findById(ORDER_ID);
    }

    @Test
    @DisplayName("Should get tracking info by order number and email")
    void shouldGetTrackingInfoByOrderNumberAndEmail() {
        // Arrange
        Order order = createOrder();
        order.setCarrier(CARRIER);
        order.setTrackingNumber(TRACKING_NUMBER);

        when(orderRepository.findByOrderNumberAndTenantId(ORDER_NUMBER, TENANT_ID))
            .thenReturn(Mono.just(order));

        // Act & Assert
        StepVerifier.create(orderTrackingService.getTrackingInfoByOrderNumber(ORDER_NUMBER, CUSTOMER_EMAIL)
                .contextWrite(TenantContext.withTenantId(TENANT_ID)))
            .assertNext(info -> {
                assertThat(info.orderNumber()).isEqualTo(ORDER_NUMBER);
                assertThat(info.carrier()).isEqualTo(CARRIER);
            })
            .verifyComplete();

        verify(orderRepository).findByOrderNumberAndTenantId(ORDER_NUMBER, TENANT_ID);
    }

    @Test
    @DisplayName("Should return empty when email doesn't match")
    void shouldReturnEmptyWhenEmailDoesntMatch() {
        // Arrange
        Order order = createOrder();

        when(orderRepository.findByOrderNumberAndTenantId(ORDER_NUMBER, TENANT_ID))
            .thenReturn(Mono.just(order));

        // Act & Assert - different email
        StepVerifier.create(orderTrackingService.getTrackingInfoByOrderNumber(ORDER_NUMBER, "wrong@example.com")
                .contextWrite(TenantContext.withTenantId(TENANT_ID)))
            .verifyComplete(); // Should return empty

        verify(orderRepository).findByOrderNumberAndTenantId(ORDER_NUMBER, TENANT_ID);
    }

    @Test
    @DisplayName("Should return error when order not found")
    void shouldReturnErrorWhenOrderNotFound() {
        // Arrange
        when(orderRepository.findById(ORDER_ID))
            .thenReturn(Mono.empty());

        // Act & Assert
        StepVerifier.create(orderTrackingService.addTrackingInfo(ORDER_ID, CARRIER, TRACKING_NUMBER)
                .contextWrite(TenantContext.withTenantId(TENANT_ID)))
            .verifyComplete(); // Empty result since order not found

        verify(orderRepository).findById(ORDER_ID);
        verifyNoMoreInteractions(orderRepository);
    }

    @Test
    @DisplayName("Should return error when tenant doesn't match")
    void shouldReturnErrorWhenTenantDoesntMatch() {
        // Arrange
        Order order = createOrder();
        order.setTenantId("different-tenant");

        when(orderRepository.findById(ORDER_ID))
            .thenReturn(Mono.just(order));

        // Act & Assert
        StepVerifier.create(orderTrackingService.addTrackingInfo(ORDER_ID, CARRIER, TRACKING_NUMBER)
                .contextWrite(TenantContext.withTenantId(TENANT_ID)))
            .expectError(IllegalArgumentException.class)
            .verify();

        verify(orderRepository).findById(ORDER_ID);
        verify(orderRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should not change status if already shipped")
    void shouldNotChangeStatusIfAlreadyShipped() {
        // Arrange
        Order order = createOrder();
        order.setStatus(OrderStatus.SHIPPED);
        int initialHistorySize = order.getStatusHistory().size();
        Notification notification = new Notification(TENANT_ID, NotificationType.ORDER_SHIPPED, NotificationChannel.EMAIL);

        when(orderRepository.findById(ORDER_ID))
            .thenReturn(Mono.just(order));
        when(orderRepository.save(any(Order.class)))
            .thenAnswer(invocation -> Mono.just(invocation.getArgument(0)));
        when(notificationService.createNotificationFromTemplate(any(), any(), any(), any(), any(), any()))
            .thenReturn(Mono.just(notification));

        // Act & Assert
        StepVerifier.create(orderTrackingService.addTrackingInfo(ORDER_ID, CARRIER, TRACKING_NUMBER)
                .contextWrite(TenantContext.withTenantId(TENANT_ID)))
            .assertNext(updatedOrder -> {
                assertThat(updatedOrder.getStatus()).isEqualTo(OrderStatus.SHIPPED);
                // Status history should not have new entry since already shipped
                assertThat(updatedOrder.getStatusHistory()).hasSize(initialHistorySize);
            })
            .verifyComplete();
    }

    private Order createOrder() {
        Order order = new Order();
        order.setId(ORDER_ID);
        order.setTenantId(TENANT_ID);
        order.setOrderNumber(ORDER_NUMBER);
        order.setCustomer(new Order.Customer(CUSTOMER_EMAIL, "Test Customer"));
        order.setShippingAddress(new Order.Address(
            "123 Main St", null, "New York", "NY", "10001", "USA"
        ));
        order.setItems(List.of(
            new Order.OrderItem("prod-1", "Test Product", "SKU-001",
                new BigDecimal("99.99"), 1, Map.of(), new BigDecimal("99.99"))
        ));
        order.setPricing(new Order.Pricing(
            new BigDecimal("99.99"),
            new BigDecimal("9.99"),
            new BigDecimal("8.00"),
            new BigDecimal("117.98")
        ));
        order.setPayment(new Order.Payment("card", PaymentStatus.PAID, "txn-123"));
        order.setStatus(OrderStatus.PROCESSING);
        order.setStatusHistory(new ArrayList<>(List.of(
            new Order.StatusHistoryEntry(OrderStatus.PENDING, Instant.now().minus(1, ChronoUnit.DAYS), "Order created"),
            new Order.StatusHistoryEntry(OrderStatus.PROCESSING, Instant.now().minus(12, ChronoUnit.HOURS), "Payment confirmed")
        )));
        order.setCreatedAt(Instant.now().minus(1, ChronoUnit.DAYS));
        order.setUpdatedAt(Instant.now());
        return order;
    }
}
