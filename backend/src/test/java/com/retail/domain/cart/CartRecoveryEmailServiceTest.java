package com.retail.domain.cart;

import com.retail.domain.notification.Notification;
import com.retail.domain.notification.NotificationChannel;
import com.retail.domain.notification.NotificationService;
import com.retail.domain.notification.NotificationType;
import com.retail.domain.user.User;
import com.retail.domain.user.UserService;
import com.retail.infrastructure.persistence.PersistedCartRepository;
import com.retail.security.tenant.TenantContext;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CartRecoveryEmailServiceTest {

    @Mock
    private PersistedCartRepository persistedCartRepository;

    @Mock
    private NotificationService notificationService;

    @Mock
    private UserService userService;

    @InjectMocks
    private CartRecoveryEmailService cartRecoveryEmailService;

    private PersistedCart testPersistedCart;
    private User testUser;
    private Cart testCart;

    @BeforeEach
    void setUp() {
        // Create test user
        testUser = new User();
        testUser.setId("user-123");
        testUser.setTenantId("tenant-1");
        testUser.setEmail("customer@example.com");
        testUser.setFirstName("John");
        testUser.setLastName("Doe");

        // Create test cart with items
        testCart = new Cart();
        testCart.setId("cart-123");
        testCart.setTenantId("tenant-1");
        testCart.setSessionId("session-123");
        testCart.setCreatedAt(Instant.now().minusSeconds(3600));
        testCart.setUpdatedAt(Instant.now().minusSeconds(3600));

        // Add cart items with images
        Cart.CartItem item1 = new Cart.CartItem(
            "item-1",
            "prod-1",
            "Wireless Headphones",
            "WH-1000XM4",
            new BigDecimal("299.99"),
            1,
            Map.of("color", "Black"),
            "https://example.com/images/headphones.jpg",
            new BigDecimal("299.99")
        );

        Cart.CartItem item2 = new Cart.CartItem(
            "item-2",
            "prod-2",
            "Phone Case",
            "PC-IPHONE-14",
            new BigDecimal("29.99"),
            2,
            Map.of("color", "Blue"),
            "https://example.com/images/case.jpg",
            new BigDecimal("59.98")
        );

        testCart.setItems(List.of(item1, item2));
        testCart.setItemCount(2);

        Cart.CartSummary summary = new Cart.CartSummary(
            new BigDecimal("359.97"),  // subtotal
            new BigDecimal("28.80"),   // tax
            new BigDecimal("0.00"),    // shipping (free)
            new BigDecimal("388.77")   // total
        );
        testCart.setSummary(summary);

        // Create persisted cart
        testPersistedCart = new PersistedCart();
        testPersistedCart.setId("pcart-123");
        testPersistedCart.setTenantId("tenant-1");
        testPersistedCart.setUserId("user-123");
        testPersistedCart.setCart(testCart);
        testPersistedCart.setCreatedAt(Instant.now().minusSeconds(7200));
        testPersistedCart.setUpdatedAt(Instant.now().minusSeconds(3600));
    }

    @Test
    void sendRecoveryEmail_shouldSendEmailWithProductImages() {
        // Arrange
        when(persistedCartRepository.findById("pcart-123"))
            .thenReturn(Mono.just(testPersistedCart));
        when(userService.findById("user-123"))
            .thenReturn(Mono.just(testUser));

        Notification mockNotification = new Notification("tenant-1", NotificationType.ABANDONED_CART, NotificationChannel.EMAIL);
        mockNotification.setId("notif-123");
        when(notificationService.createNotificationFromTemplate(
            anyString(), anyString(), any(), any(), anyString(), any()))
            .thenReturn(Mono.just(mockNotification));

        // Act
        Mono<Void> result = cartRecoveryEmailService.sendRecoveryEmail("pcart-123", null, null)
            .contextWrite(TenantContext.withTenantId("tenant-1"));

        // Assert
        StepVerifier.create(result)
            .verifyComplete();

        verify(notificationService).createNotificationFromTemplate(
            eq("user-123"),
            eq("customer@example.com"),
            eq(NotificationType.ABANDONED_CART),
            eq(NotificationChannel.EMAIL),
            eq("abandoned-cart"),
            any()
        );
    }

    @Test
    @SuppressWarnings("unchecked")
    void sendRecoveryEmail_shouldIncludeProductImagesInTemplateData() {
        // Arrange
        when(persistedCartRepository.findById("pcart-123"))
            .thenReturn(Mono.just(testPersistedCart));
        when(userService.findById("user-123"))
            .thenReturn(Mono.just(testUser));

        ArgumentCaptor<Map<String, Object>> templateDataCaptor = ArgumentCaptor.forClass(Map.class);

        Notification mockNotification = new Notification("tenant-1", NotificationType.ABANDONED_CART, NotificationChannel.EMAIL);
        mockNotification.setId("notif-123");
        when(notificationService.createNotificationFromTemplate(
            anyString(), anyString(), any(), any(), anyString(), templateDataCaptor.capture()))
            .thenReturn(Mono.just(mockNotification));

        // Act
        cartRecoveryEmailService.sendRecoveryEmail("pcart-123", null, null)
            .contextWrite(TenantContext.withTenantId("tenant-1"))
            .block();

        // Assert
        Map<String, Object> templateData = templateDataCaptor.getValue();

        assertThat(templateData).containsKey("customerName");
        assertThat(templateData.get("customerName")).isEqualTo("John");

        assertThat(templateData).containsKey("items");
        List<Map<String, Object>> items = (List<Map<String, Object>>) templateData.get("items");

        assertThat(items).hasSize(2);

        // Check first item has image
        Map<String, Object> firstItem = items.get(0);
        assertThat(firstItem.get("productName")).isEqualTo("Wireless Headphones");
        assertThat(firstItem.get("imageUrl")).isEqualTo("https://example.com/images/headphones.jpg");
        assertThat(firstItem.get("quantity")).isEqualTo(1);
        assertThat(firstItem.get("subtotal")).isEqualTo("299.99");

        // Check second item has image
        Map<String, Object> secondItem = items.get(1);
        assertThat(secondItem.get("productName")).isEqualTo("Phone Case");
        assertThat(secondItem.get("imageUrl")).isEqualTo("https://example.com/images/case.jpg");
        assertThat(secondItem.get("quantity")).isEqualTo(2);

        // Check summary info
        assertThat(templateData.get("itemCount")).isEqualTo(2);
        assertThat(templateData.get("subtotal")).isEqualTo("359.97");
        assertThat(templateData.get("estimatedTotal")).isEqualTo("388.77");
        assertThat(templateData.get("freeShipping")).isEqualTo(true);
    }

    @Test
    @SuppressWarnings("unchecked")
    void sendRecoveryEmail_shouldIncludeDiscountCodeWhenProvided() {
        // Arrange
        when(persistedCartRepository.findById("pcart-123"))
            .thenReturn(Mono.just(testPersistedCart));
        when(userService.findById("user-123"))
            .thenReturn(Mono.just(testUser));

        ArgumentCaptor<Map<String, Object>> templateDataCaptor = ArgumentCaptor.forClass(Map.class);

        Notification mockNotification = new Notification("tenant-1", NotificationType.ABANDONED_CART, NotificationChannel.EMAIL);
        mockNotification.setId("notif-123");
        when(notificationService.createNotificationFromTemplate(
            anyString(), anyString(), any(), any(), anyString(), templateDataCaptor.capture()))
            .thenReturn(Mono.just(mockNotification));

        // Act
        cartRecoveryEmailService.sendRecoveryEmail("pcart-123", "SAVE10", "24 hours")
            .contextWrite(TenantContext.withTenantId("tenant-1"))
            .block();

        // Assert
        Map<String, Object> templateData = templateDataCaptor.getValue();

        assertThat(templateData.get("discountCode")).isEqualTo("SAVE10");
        assertThat(templateData.get("expiresIn")).isEqualTo("24 hours");
        assertThat(templateData).containsKey("discount");
    }

    @Test
    void sendRecoveryEmail_shouldSkipGuestCart() {
        // Arrange - cart with no userId
        testPersistedCart.setUserId(null);

        when(persistedCartRepository.findById("pcart-123"))
            .thenReturn(Mono.just(testPersistedCart));

        // Act
        Mono<Void> result = cartRecoveryEmailService.sendRecoveryEmail("pcart-123", null, null)
            .contextWrite(TenantContext.withTenantId("tenant-1"));

        // Assert
        StepVerifier.create(result)
            .verifyComplete();

        verify(userService, never()).findById(anyString());
        verify(notificationService, never()).createNotificationFromTemplate(
            anyString(), anyString(), any(), any(), anyString(), any());
    }

    @Test
    void sendRecoveryEmail_shouldSkipEmptyCart() {
        // Arrange - cart with no items
        testCart.setItems(List.of());

        when(persistedCartRepository.findById("pcart-123"))
            .thenReturn(Mono.just(testPersistedCart));
        when(userService.findById("user-123"))
            .thenReturn(Mono.just(testUser));

        // Act
        Mono<Void> result = cartRecoveryEmailService.sendRecoveryEmail("pcart-123", null, null)
            .contextWrite(TenantContext.withTenantId("tenant-1"));

        // Assert
        StepVerifier.create(result)
            .verifyComplete();

        verify(notificationService, never()).createNotificationFromTemplate(
            anyString(), anyString(), any(), any(), anyString(), any());
    }

    @Test
    void sendRecoveryEmail_shouldHandleNonExistentCart() {
        // Arrange
        when(persistedCartRepository.findById("non-existent"))
            .thenReturn(Mono.empty());

        // Act
        Mono<Void> result = cartRecoveryEmailService.sendRecoveryEmail("non-existent", null, null)
            .contextWrite(TenantContext.withTenantId("tenant-1"));

        // Assert
        StepVerifier.create(result)
            .verifyComplete();

        verify(notificationService, never()).createNotificationFromTemplate(
            anyString(), anyString(), any(), any(), anyString(), any());
    }

    @Test
    @SuppressWarnings("unchecked")
    void sendRecoveryEmail_shouldHandleItemWithoutImage() {
        // Arrange - item without image
        Cart.CartItem itemNoImage = new Cart.CartItem(
            "item-3",
            "prod-3",
            "USB Cable",
            "USB-C-1M",
            new BigDecimal("9.99"),
            1,
            Map.of(),
            null,  // No image
            new BigDecimal("9.99")
        );
        testCart.setItems(List.of(itemNoImage));
        testCart.setSummary(new Cart.CartSummary(
            new BigDecimal("9.99"),
            new BigDecimal("0.80"),
            new BigDecimal("5.99"),
            new BigDecimal("16.78")
        ));

        when(persistedCartRepository.findById("pcart-123"))
            .thenReturn(Mono.just(testPersistedCart));
        when(userService.findById("user-123"))
            .thenReturn(Mono.just(testUser));

        ArgumentCaptor<Map<String, Object>> templateDataCaptor = ArgumentCaptor.forClass(Map.class);

        Notification mockNotification = new Notification("tenant-1", NotificationType.ABANDONED_CART, NotificationChannel.EMAIL);
        when(notificationService.createNotificationFromTemplate(
            anyString(), anyString(), any(), any(), anyString(), templateDataCaptor.capture()))
            .thenReturn(Mono.just(mockNotification));

        // Act
        cartRecoveryEmailService.sendRecoveryEmail("pcart-123", null, null)
            .contextWrite(TenantContext.withTenantId("tenant-1"))
            .block();

        // Assert
        Map<String, Object> templateData = templateDataCaptor.getValue();
        List<Map<String, Object>> items = (List<Map<String, Object>>) templateData.get("items");

        assertThat(items).hasSize(1);
        assertThat(items.get(0)).doesNotContainKey("imageUrl");
        assertThat(templateData.get("freeShipping")).isEqualTo(false); // Under $50
    }

    @Test
    @SuppressWarnings("unchecked")
    void sendReminderEmail_firstReminder_shouldHaveUrgencyNoDiscount() {
        // Arrange
        when(persistedCartRepository.findById("pcart-123"))
            .thenReturn(Mono.just(testPersistedCart));
        when(userService.findById("user-123"))
            .thenReturn(Mono.just(testUser));

        ArgumentCaptor<Map<String, Object>> templateDataCaptor = ArgumentCaptor.forClass(Map.class);

        Notification mockNotification = new Notification("tenant-1", NotificationType.ABANDONED_CART, NotificationChannel.EMAIL);
        when(notificationService.createNotificationFromTemplate(
            anyString(), anyString(), any(), any(), anyString(), templateDataCaptor.capture()))
            .thenReturn(Mono.just(mockNotification));

        // Act
        cartRecoveryEmailService.sendReminderEmail("pcart-123", 1)
            .contextWrite(TenantContext.withTenantId("tenant-1"))
            .block();

        // Assert
        Map<String, Object> templateData = templateDataCaptor.getValue();

        assertThat(templateData.get("expiresIn")).isEqualTo("48 hours");
        assertThat(templateData).doesNotContainKey("discountCode");
    }

    @Test
    @SuppressWarnings("unchecked")
    void sendReminderEmail_secondReminder_shouldHaveDiscountAndUrgency() {
        // Arrange
        when(persistedCartRepository.findById("pcart-123"))
            .thenReturn(Mono.just(testPersistedCart));
        when(userService.findById("user-123"))
            .thenReturn(Mono.just(testUser));

        ArgumentCaptor<Map<String, Object>> templateDataCaptor = ArgumentCaptor.forClass(Map.class);

        Notification mockNotification = new Notification("tenant-1", NotificationType.ABANDONED_CART, NotificationChannel.EMAIL);
        when(notificationService.createNotificationFromTemplate(
            anyString(), anyString(), any(), any(), anyString(), templateDataCaptor.capture()))
            .thenReturn(Mono.just(mockNotification));

        // Act
        cartRecoveryEmailService.sendReminderEmail("pcart-123", 2)
            .contextWrite(TenantContext.withTenantId("tenant-1"))
            .block();

        // Assert
        Map<String, Object> templateData = templateDataCaptor.getValue();

        assertThat(templateData.get("discountCode")).isEqualTo("COMEBACK10");
        assertThat(templateData.get("expiresIn")).isEqualTo("24 hours");
    }

    @Test
    @SuppressWarnings("unchecked")
    void sendReminderEmail_thirdReminder_shouldHaveLastChanceDiscount() {
        // Arrange
        when(persistedCartRepository.findById("pcart-123"))
            .thenReturn(Mono.just(testPersistedCart));
        when(userService.findById("user-123"))
            .thenReturn(Mono.just(testUser));

        ArgumentCaptor<Map<String, Object>> templateDataCaptor = ArgumentCaptor.forClass(Map.class);

        Notification mockNotification = new Notification("tenant-1", NotificationType.ABANDONED_CART, NotificationChannel.EMAIL);
        when(notificationService.createNotificationFromTemplate(
            anyString(), anyString(), any(), any(), anyString(), templateDataCaptor.capture()))
            .thenReturn(Mono.just(mockNotification));

        // Act
        cartRecoveryEmailService.sendReminderEmail("pcart-123", 3)
            .contextWrite(TenantContext.withTenantId("tenant-1"))
            .block();

        // Assert
        Map<String, Object> templateData = templateDataCaptor.getValue();

        assertThat(templateData.get("discountCode")).isEqualTo("LASTCHANCE15");
        assertThat(templateData.get("expiresIn")).isEqualTo("12 hours");
    }

    @Test
    @SuppressWarnings("unchecked")
    void sendRecoveryEmail_shouldUseDefaultNameForUserWithoutFirstName() {
        // Arrange
        testUser.setFirstName(null);

        when(persistedCartRepository.findById("pcart-123"))
            .thenReturn(Mono.just(testPersistedCart));
        when(userService.findById("user-123"))
            .thenReturn(Mono.just(testUser));

        ArgumentCaptor<Map<String, Object>> templateDataCaptor = ArgumentCaptor.forClass(Map.class);

        Notification mockNotification = new Notification("tenant-1", NotificationType.ABANDONED_CART, NotificationChannel.EMAIL);
        when(notificationService.createNotificationFromTemplate(
            anyString(), anyString(), any(), any(), anyString(), templateDataCaptor.capture()))
            .thenReturn(Mono.just(mockNotification));

        // Act
        cartRecoveryEmailService.sendRecoveryEmail("pcart-123", null, null)
            .contextWrite(TenantContext.withTenantId("tenant-1"))
            .block();

        // Assert
        Map<String, Object> templateData = templateDataCaptor.getValue();
        assertThat(templateData.get("customerName")).isEqualTo("Valued Customer");
    }

    @Test
    @SuppressWarnings("unchecked")
    void sendRecoveryEmail_shouldIncludeProductAttributes() {
        // Arrange
        when(persistedCartRepository.findById("pcart-123"))
            .thenReturn(Mono.just(testPersistedCart));
        when(userService.findById("user-123"))
            .thenReturn(Mono.just(testUser));

        ArgumentCaptor<Map<String, Object>> templateDataCaptor = ArgumentCaptor.forClass(Map.class);

        Notification mockNotification = new Notification("tenant-1", NotificationType.ABANDONED_CART, NotificationChannel.EMAIL);
        when(notificationService.createNotificationFromTemplate(
            anyString(), anyString(), any(), any(), anyString(), templateDataCaptor.capture()))
            .thenReturn(Mono.just(mockNotification));

        // Act
        cartRecoveryEmailService.sendRecoveryEmail("pcart-123", null, null)
            .contextWrite(TenantContext.withTenantId("tenant-1"))
            .block();

        // Assert
        Map<String, Object> templateData = templateDataCaptor.getValue();
        List<Map<String, Object>> items = (List<Map<String, Object>>) templateData.get("items");

        Map<String, Object> firstItem = items.get(0);
        assertThat(firstItem).containsKey("attributes");
        Map<String, Object> attributes = (Map<String, Object>) firstItem.get("attributes");
        assertThat(attributes.get("color")).isEqualTo("Black");
    }

    @Test
    @SuppressWarnings("unchecked")
    void sendRecoveryEmail_shouldIncludeCartUrls() {
        // Arrange
        when(persistedCartRepository.findById("pcart-123"))
            .thenReturn(Mono.just(testPersistedCart));
        when(userService.findById("user-123"))
            .thenReturn(Mono.just(testUser));

        ArgumentCaptor<Map<String, Object>> templateDataCaptor = ArgumentCaptor.forClass(Map.class);

        Notification mockNotification = new Notification("tenant-1", NotificationType.ABANDONED_CART, NotificationChannel.EMAIL);
        when(notificationService.createNotificationFromTemplate(
            anyString(), anyString(), any(), any(), anyString(), templateDataCaptor.capture()))
            .thenReturn(Mono.just(mockNotification));

        // Act
        cartRecoveryEmailService.sendRecoveryEmail("pcart-123", null, null)
            .contextWrite(TenantContext.withTenantId("tenant-1"))
            .block();

        // Assert
        Map<String, Object> templateData = templateDataCaptor.getValue();

        assertThat(templateData).containsKey("cartUrl");
        assertThat(templateData).containsKey("supportUrl");
        assertThat(templateData).containsKey("unsubscribeUrl");
        assertThat(templateData).containsKey("preferencesUrl");
        assertThat(templateData).containsKey("storeName");
        assertThat(templateData).containsKey("currentYear");
    }
}
