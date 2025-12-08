package com.retail.domain.cart;

import com.retail.domain.notification.Notification;
import com.retail.domain.notification.NotificationChannel;
import com.retail.domain.notification.NotificationPreferences;
import com.retail.domain.notification.NotificationService;
import com.retail.domain.notification.NotificationType;
import com.retail.domain.user.User;
import com.retail.domain.user.UserService;
import com.retail.security.tenant.TenantContext;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("SmsCartReminderService Tests")
class SmsCartReminderServiceTest {

    private static final String TENANT_ID = "test-tenant";
    private static final String USER_ID = "user-123";
    private static final String CART_ID = "cart-456";

    @Mock
    private AbandonedCartService abandonedCartService;

    @Mock
    private UserService userService;

    @Mock
    private NotificationService notificationService;

    private SmsCartReminderService smsCartReminderService;

    @BeforeEach
    void setUp() {
        smsCartReminderService = new SmsCartReminderService(
            abandonedCartService,
            userService,
            notificationService
        );
    }

    private User createUserWithSmsOptIn(String userId, String phone, boolean consentGiven, boolean cartRemindersEnabled) {
        User user = new User(TENANT_ID, "test@example.com", "John", "Doe");
        user.setId(userId);
        user.setPhone(phone);

        NotificationPreferences prefs = new NotificationPreferences();
        if (consentGiven) {
            prefs.recordSmsConsent("test-source");
        }
        if (cartRemindersEnabled) {
            prefs.setSmsCartReminders(true);
        }
        user.setNotificationPreferences(prefs);

        return user;
    }

    private PersistedCart createAbandonedCart(String cartId, String userId, Instant updatedAt) {
        PersistedCart persistedCart = new PersistedCart();
        persistedCart.setId(cartId);
        persistedCart.setTenantId(TENANT_ID);
        persistedCart.setUserId(userId);
        persistedCart.setUpdatedAt(updatedAt);

        // Create embedded cart with items
        Cart cart = new Cart();
        cart.setId(cartId);
        cart.setTenantId(TENANT_ID);
        cart.setItems(List.of(
            new Cart.CartItem(
                "item-1",
                "product-1",
                "Test Product",
                "SKU-001",
                new BigDecimal("29.99"),
                2,
                Map.of(),
                "http://example.com/image.jpg",
                new BigDecimal("59.98")
            )
        ));
        cart.setSummary(new Cart.CartSummary(
            new BigDecimal("59.98"),
            new BigDecimal("5.00"),
            new BigDecimal("0.00"),
            new BigDecimal("64.98")
        ));

        persistedCart.setCart(cart);
        return persistedCart;
    }

    private Notification createNotification() {
        Notification notification = new Notification(TENANT_ID, NotificationType.ABANDONED_CART, NotificationChannel.SMS);
        notification.setId("notification-123");
        notification.setUserId(USER_ID);
        return notification;
    }

    @Nested
    @DisplayName("processAbandonedCartSmsReminders")
    class ProcessAbandonedCartSmsRemindersTests {

        @Test
        @DisplayName("Should send SMS reminders to opted-in users with valid phone")
        void shouldSendSmsRemindersToOptedInUsers() {
            // Arrange
            Instant validCartTime = Instant.now().minus(Duration.ofHours(2)); // Within 1-48 hour window
            PersistedCart cart = createAbandonedCart(CART_ID, USER_ID, validCartTime);
            User user = createUserWithSmsOptIn(USER_ID, "1234567890", true, true);
            Notification notification = createNotification();

            when(abandonedCartService.findAbandonedCarts())
                .thenReturn(Flux.just(cart));
            when(userService.findById(USER_ID))
                .thenReturn(Mono.just(user));
            when(notificationService.createNotification(
                eq(USER_ID),
                any(),
                eq(NotificationType.ABANDONED_CART),
                eq(NotificationChannel.SMS),
                any(),
                any(),
                any()
            )).thenReturn(Mono.just(notification));

            // Act & Assert
            StepVerifier.create(
                smsCartReminderService.processAbandonedCartSmsReminders()
                    .contextWrite(TenantContext.withTenantId(TENANT_ID))
            )
            .expectNext(notification)
            .verifyComplete();

            verify(notificationService).createNotification(
                eq(USER_ID),
                eq("test@example.com"),
                eq(NotificationType.ABANDONED_CART),
                eq(NotificationChannel.SMS),
                isNull(),
                any(String.class),
                any(Map.class)
            );
        }

        @Test
        @DisplayName("Should not send SMS when user has not opted in")
        void shouldNotSendSmsWhenUserNotOptedIn() {
            // Arrange
            Instant validCartTime = Instant.now().minus(Duration.ofHours(2));
            PersistedCart cart = createAbandonedCart(CART_ID, USER_ID, validCartTime);
            User user = createUserWithSmsOptIn(USER_ID, "1234567890", false, false);

            when(abandonedCartService.findAbandonedCarts())
                .thenReturn(Flux.just(cart));
            when(userService.findById(USER_ID))
                .thenReturn(Mono.just(user));

            // Act & Assert
            StepVerifier.create(
                smsCartReminderService.processAbandonedCartSmsReminders()
                    .contextWrite(TenantContext.withTenantId(TENANT_ID))
            )
            .verifyComplete();

            verify(notificationService, never()).createNotification(any(), any(), any(), any(), any(), any(), any());
        }

        @Test
        @DisplayName("Should not send SMS when user has consent but cart reminders disabled")
        void shouldNotSendSmsWhenCartRemindersDisabled() {
            // Arrange
            Instant validCartTime = Instant.now().minus(Duration.ofHours(2));
            PersistedCart cart = createAbandonedCart(CART_ID, USER_ID, validCartTime);
            User user = createUserWithSmsOptIn(USER_ID, "1234567890", true, false);

            when(abandonedCartService.findAbandonedCarts())
                .thenReturn(Flux.just(cart));
            when(userService.findById(USER_ID))
                .thenReturn(Mono.just(user));

            // Act & Assert
            StepVerifier.create(
                smsCartReminderService.processAbandonedCartSmsReminders()
                    .contextWrite(TenantContext.withTenantId(TENANT_ID))
            )
            .verifyComplete();

            verify(notificationService, never()).createNotification(any(), any(), any(), any(), any(), any(), any());
        }

        @Test
        @DisplayName("Should not send SMS when user has no valid phone number")
        void shouldNotSendSmsWhenNoValidPhoneNumber() {
            // Arrange
            Instant validCartTime = Instant.now().minus(Duration.ofHours(2));
            PersistedCart cart = createAbandonedCart(CART_ID, USER_ID, validCartTime);
            User user = createUserWithSmsOptIn(USER_ID, "123", true, true); // Too short phone

            when(abandonedCartService.findAbandonedCarts())
                .thenReturn(Flux.just(cart));
            when(userService.findById(USER_ID))
                .thenReturn(Mono.just(user));

            // Act & Assert
            StepVerifier.create(
                smsCartReminderService.processAbandonedCartSmsReminders()
                    .contextWrite(TenantContext.withTenantId(TENANT_ID))
            )
            .verifyComplete();

            verify(notificationService, never()).createNotification(any(), any(), any(), any(), any(), any(), any());
        }

        @Test
        @DisplayName("Should not send SMS when user has null phone number")
        void shouldNotSendSmsWhenNullPhoneNumber() {
            // Arrange
            Instant validCartTime = Instant.now().minus(Duration.ofHours(2));
            PersistedCart cart = createAbandonedCart(CART_ID, USER_ID, validCartTime);
            User user = createUserWithSmsOptIn(USER_ID, null, true, true);

            when(abandonedCartService.findAbandonedCarts())
                .thenReturn(Flux.just(cart));
            when(userService.findById(USER_ID))
                .thenReturn(Mono.just(user));

            // Act & Assert
            StepVerifier.create(
                smsCartReminderService.processAbandonedCartSmsReminders()
                    .contextWrite(TenantContext.withTenantId(TENANT_ID))
            )
            .verifyComplete();

            verify(notificationService, never()).createNotification(any(), any(), any(), any(), any(), any(), any());
        }

        @Test
        @DisplayName("Should skip carts with null userId (guest carts)")
        void shouldSkipGuestCarts() {
            // Arrange
            Instant validCartTime = Instant.now().minus(Duration.ofHours(2));
            PersistedCart cart = createAbandonedCart(CART_ID, null, validCartTime);

            when(abandonedCartService.findAbandonedCarts())
                .thenReturn(Flux.just(cart));

            // Act & Assert
            StepVerifier.create(
                smsCartReminderService.processAbandonedCartSmsReminders()
                    .contextWrite(TenantContext.withTenantId(TENANT_ID))
            )
            .verifyComplete();

            verify(userService, never()).findById(any());
            verify(notificationService, never()).createNotification(any(), any(), any(), any(), any(), any(), any());
        }

        @Test
        @DisplayName("Should skip carts that are too new (within 1 hour)")
        void shouldSkipTooNewCarts() {
            // Arrange
            Instant tooNewTime = Instant.now().minus(Duration.ofMinutes(30)); // Only 30 mins old
            PersistedCart cart = createAbandonedCart(CART_ID, USER_ID, tooNewTime);

            when(abandonedCartService.findAbandonedCarts())
                .thenReturn(Flux.just(cart));

            // Act & Assert
            StepVerifier.create(
                smsCartReminderService.processAbandonedCartSmsReminders()
                    .contextWrite(TenantContext.withTenantId(TENANT_ID))
            )
            .verifyComplete();

            verify(userService, never()).findById(any());
        }

        @Test
        @DisplayName("Should skip carts that are too old (over 48 hours)")
        void shouldSkipTooOldCarts() {
            // Arrange
            Instant tooOldTime = Instant.now().minus(Duration.ofHours(50)); // 50 hours old
            PersistedCart cart = createAbandonedCart(CART_ID, USER_ID, tooOldTime);

            when(abandonedCartService.findAbandonedCarts())
                .thenReturn(Flux.just(cart));

            // Act & Assert
            StepVerifier.create(
                smsCartReminderService.processAbandonedCartSmsReminders()
                    .contextWrite(TenantContext.withTenantId(TENANT_ID))
            )
            .verifyComplete();

            verify(userService, never()).findById(any());
        }

        @Test
        @DisplayName("Should process multiple carts and filter appropriately")
        void shouldProcessMultipleCarts() {
            // Arrange
            Instant validTime = Instant.now().minus(Duration.ofHours(2));

            PersistedCart cart1 = createAbandonedCart("cart-1", "user-1", validTime);
            PersistedCart cart2 = createAbandonedCart("cart-2", "user-2", validTime);
            PersistedCart guestCart = createAbandonedCart("cart-3", null, validTime);

            User user1 = createUserWithSmsOptIn("user-1", "1234567890", true, true);
            User user2 = createUserWithSmsOptIn("user-2", "0987654321", false, false);

            Notification notification1 = createNotification();
            notification1.setUserId("user-1");

            when(abandonedCartService.findAbandonedCarts())
                .thenReturn(Flux.just(cart1, cart2, guestCart));
            when(userService.findById("user-1"))
                .thenReturn(Mono.just(user1));
            when(userService.findById("user-2"))
                .thenReturn(Mono.just(user2));
            when(notificationService.createNotification(
                eq("user-1"),
                any(),
                eq(NotificationType.ABANDONED_CART),
                eq(NotificationChannel.SMS),
                any(),
                any(),
                any()
            )).thenReturn(Mono.just(notification1));

            // Act & Assert
            StepVerifier.create(
                smsCartReminderService.processAbandonedCartSmsReminders()
                    .contextWrite(TenantContext.withTenantId(TENANT_ID))
            )
            .expectNext(notification1)
            .verifyComplete();

            verify(notificationService, times(1)).createNotification(any(), any(), any(), any(), any(), any(), any());
        }
    }

    @Nested
    @DisplayName("updateSmsCartReminderOptIn")
    class UpdateSmsCartReminderOptInTests {

        @Test
        @DisplayName("Should opt in user to SMS cart reminders with consent")
        void shouldOptInUserWithConsent() {
            // Arrange
            User user = createUserWithSmsOptIn(USER_ID, "1234567890", false, false);
            when(userService.findById(USER_ID))
                .thenReturn(Mono.just(user));
            when(userService.updateProfile(eq(USER_ID), any(User.class)))
                .thenReturn(Mono.just(user));

            // Act & Assert
            StepVerifier.create(
                smsCartReminderService.updateSmsCartReminderOptIn(USER_ID, true, "checkout")
            )
            .expectNextMatches(updatedUser -> {
                NotificationPreferences prefs = updatedUser.getNotificationPreferences();
                return prefs.isSmsConsentGiven() &&
                       prefs.isSmsCartReminders() &&
                       "checkout".equals(prefs.getSmsConsentSource());
            })
            .verifyComplete();

            verify(userService).updateProfile(eq(USER_ID), any(User.class));
        }

        @Test
        @DisplayName("Should opt in user who already has SMS consent")
        void shouldOptInUserWithExistingConsent() {
            // Arrange
            User user = createUserWithSmsOptIn(USER_ID, "1234567890", true, false);
            Instant originalConsentTimestamp = user.getNotificationPreferences().getSmsConsentTimestamp();

            when(userService.findById(USER_ID))
                .thenReturn(Mono.just(user));
            when(userService.updateProfile(eq(USER_ID), any(User.class)))
                .thenReturn(Mono.just(user));

            // Act & Assert
            StepVerifier.create(
                smsCartReminderService.updateSmsCartReminderOptIn(USER_ID, true, "account-settings")
            )
            .expectNextMatches(updatedUser -> {
                NotificationPreferences prefs = updatedUser.getNotificationPreferences();
                // Consent should already be given, timestamp should remain
                return prefs.isSmsConsentGiven() &&
                       prefs.isSmsCartReminders() &&
                       prefs.getSmsConsentTimestamp().equals(originalConsentTimestamp);
            })
            .verifyComplete();
        }

        @Test
        @DisplayName("Should opt out user from SMS cart reminders")
        void shouldOptOutUser() {
            // Arrange
            User user = createUserWithSmsOptIn(USER_ID, "1234567890", true, true);
            when(userService.findById(USER_ID))
                .thenReturn(Mono.just(user));
            when(userService.updateProfile(eq(USER_ID), any(User.class)))
                .thenReturn(Mono.just(user));

            // Act & Assert
            StepVerifier.create(
                smsCartReminderService.updateSmsCartReminderOptIn(USER_ID, false, "account-settings")
            )
            .expectNextMatches(updatedUser -> {
                NotificationPreferences prefs = updatedUser.getNotificationPreferences();
                // SMS consent should remain but cart reminders disabled
                return prefs.isSmsConsentGiven() && !prefs.isSmsCartReminders();
            })
            .verifyComplete();
        }

        @Test
        @DisplayName("Should handle non-existent user gracefully")
        void shouldHandleNonExistentUser() {
            // Arrange
            when(userService.findById(USER_ID))
                .thenReturn(Mono.empty());

            // Act & Assert
            StepVerifier.create(
                smsCartReminderService.updateSmsCartReminderOptIn(USER_ID, true, "checkout")
            )
            .verifyComplete();

            verify(userService, never()).updateProfile(any(), any());
        }
    }

    @Nested
    @DisplayName("getSmsOptInStatus")
    class GetSmsOptInStatusTests {

        @Test
        @DisplayName("Should return correct opt-in status for opted-in user")
        void shouldReturnOptInStatusForOptedInUser() {
            // Arrange
            User user = createUserWithSmsOptIn(USER_ID, "1234567890", true, true);
            when(userService.findById(USER_ID))
                .thenReturn(Mono.just(user));

            // Act & Assert
            StepVerifier.create(
                smsCartReminderService.getSmsOptInStatus(USER_ID)
            )
            .expectNextMatches(status ->
                status.consentGiven() &&
                status.cartRemindersEnabled() &&
                status.hasValidPhone() &&
                status.canReceiveSmsReminders()
            )
            .verifyComplete();
        }

        @Test
        @DisplayName("Should return correct opt-in status for user without consent")
        void shouldReturnOptInStatusForUserWithoutConsent() {
            // Arrange
            User user = createUserWithSmsOptIn(USER_ID, "1234567890", false, false);
            when(userService.findById(USER_ID))
                .thenReturn(Mono.just(user));

            // Act & Assert
            StepVerifier.create(
                smsCartReminderService.getSmsOptInStatus(USER_ID)
            )
            .expectNextMatches(status ->
                !status.consentGiven() &&
                !status.cartRemindersEnabled() &&
                status.hasValidPhone() &&
                !status.canReceiveSmsReminders()
            )
            .verifyComplete();
        }

        @Test
        @DisplayName("Should return correct opt-in status for user without valid phone")
        void shouldReturnOptInStatusForUserWithoutValidPhone() {
            // Arrange
            User user = createUserWithSmsOptIn(USER_ID, "123", true, true); // Invalid phone
            when(userService.findById(USER_ID))
                .thenReturn(Mono.just(user));

            // Act & Assert
            StepVerifier.create(
                smsCartReminderService.getSmsOptInStatus(USER_ID)
            )
            .expectNextMatches(status ->
                status.consentGiven() &&
                status.cartRemindersEnabled() &&
                !status.hasValidPhone() &&
                !status.canReceiveSmsReminders()
            )
            .verifyComplete();
        }

        @Test
        @DisplayName("Should return default status for non-existent user")
        void shouldReturnDefaultStatusForNonExistentUser() {
            // Arrange
            when(userService.findById(USER_ID))
                .thenReturn(Mono.empty());

            // Act & Assert
            StepVerifier.create(
                smsCartReminderService.getSmsOptInStatus(USER_ID)
            )
            .expectNextMatches(status ->
                !status.consentGiven() &&
                !status.cartRemindersEnabled() &&
                !status.hasValidPhone() &&
                !status.canReceiveSmsReminders()
            )
            .verifyComplete();
        }

        @Test
        @DisplayName("Should include consent timestamp and source in status")
        void shouldIncludeConsentTimestampAndSource() {
            // Arrange
            User user = createUserWithSmsOptIn(USER_ID, "1234567890", true, true);
            when(userService.findById(USER_ID))
                .thenReturn(Mono.just(user));

            // Act & Assert
            StepVerifier.create(
                smsCartReminderService.getSmsOptInStatus(USER_ID)
            )
            .expectNextMatches(status ->
                status.consentTimestamp() != null &&
                "test-source".equals(status.consentSource())
            )
            .verifyComplete();
        }
    }

    @Nested
    @DisplayName("getOptedInUserCount")
    class GetOptedInUserCountTests {

        @Test
        @DisplayName("Should return placeholder count")
        void shouldReturnPlaceholderCount() {
            // Act & Assert
            StepVerifier.create(
                smsCartReminderService.getOptedInUserCount()
            )
            .expectNext(0L)
            .verifyComplete();
        }
    }

    @Nested
    @DisplayName("SmsOptInStatus record")
    class SmsOptInStatusTests {

        @Test
        @DisplayName("canReceiveSmsReminders returns true when all conditions met")
        void canReceiveSmsRemindersReturnsTrueWhenAllConditionsMet() {
            var status = new SmsCartReminderService.SmsOptInStatus(
                true, true, Instant.now(), "checkout", true
            );
            assertThat(status.canReceiveSmsReminders()).isTrue();
        }

        @Test
        @DisplayName("canReceiveSmsReminders returns false when consent not given")
        void canReceiveSmsRemindersReturnsFalseWhenNoConsent() {
            var status = new SmsCartReminderService.SmsOptInStatus(
                false, true, null, null, true
            );
            assertThat(status.canReceiveSmsReminders()).isFalse();
        }

        @Test
        @DisplayName("canReceiveSmsReminders returns false when cart reminders disabled")
        void canReceiveSmsRemindersReturnsFalseWhenRemindersDisabled() {
            var status = new SmsCartReminderService.SmsOptInStatus(
                true, false, Instant.now(), "checkout", true
            );
            assertThat(status.canReceiveSmsReminders()).isFalse();
        }

        @Test
        @DisplayName("canReceiveSmsReminders returns false when no valid phone")
        void canReceiveSmsRemindersReturnsFalseWhenNoValidPhone() {
            var status = new SmsCartReminderService.SmsOptInStatus(
                true, true, Instant.now(), "checkout", false
            );
            assertThat(status.canReceiveSmsReminders()).isFalse();
        }
    }

    @Nested
    @DisplayName("SMS Content Generation")
    class SmsContentGenerationTests {

        @Test
        @DisplayName("Should generate SMS content with correct item count and total")
        void shouldGenerateSmsContentWithCorrectValues() {
            // Arrange
            Instant validCartTime = Instant.now().minus(Duration.ofHours(2));
            PersistedCart cart = createAbandonedCart(CART_ID, USER_ID, validCartTime);
            User user = createUserWithSmsOptIn(USER_ID, "1234567890", true, true);
            Notification notification = createNotification();

            ArgumentCaptor<String> contentCaptor = ArgumentCaptor.forClass(String.class);

            when(abandonedCartService.findAbandonedCarts())
                .thenReturn(Flux.just(cart));
            when(userService.findById(USER_ID))
                .thenReturn(Mono.just(user));
            when(notificationService.createNotification(
                any(), any(), any(), any(), any(),
                contentCaptor.capture(),
                any()
            )).thenReturn(Mono.just(notification));

            // Act
            StepVerifier.create(
                smsCartReminderService.processAbandonedCartSmsReminders()
                    .contextWrite(TenantContext.withTenantId(TENANT_ID))
            )
            .expectNext(notification)
            .verifyComplete();

            // Assert
            String content = contentCaptor.getValue();
            assertThat(content).contains("Hi John!");
            assertThat(content).contains("1 item");
            assertThat(content).contains("$64.98");
        }

        @Test
        @DisplayName("Should truncate long first names in SMS content")
        void shouldTruncateLongFirstNames() {
            // Arrange
            Instant validCartTime = Instant.now().minus(Duration.ofHours(2));
            PersistedCart cart = createAbandonedCart(CART_ID, USER_ID, validCartTime);

            User user = new User(TENANT_ID, "test@example.com", "ChristopherJohnson", "Smith");
            user.setId(USER_ID);
            user.setPhone("1234567890");
            NotificationPreferences prefs = new NotificationPreferences();
            prefs.recordSmsConsent("test");
            prefs.setSmsCartReminders(true);
            user.setNotificationPreferences(prefs);

            Notification notification = createNotification();
            ArgumentCaptor<String> contentCaptor = ArgumentCaptor.forClass(String.class);

            when(abandonedCartService.findAbandonedCarts())
                .thenReturn(Flux.just(cart));
            when(userService.findById(USER_ID))
                .thenReturn(Mono.just(user));
            when(notificationService.createNotification(
                any(), any(), any(), any(), any(),
                contentCaptor.capture(),
                any()
            )).thenReturn(Mono.just(notification));

            // Act
            StepVerifier.create(
                smsCartReminderService.processAbandonedCartSmsReminders()
                    .contextWrite(TenantContext.withTenantId(TENANT_ID))
            )
            .expectNext(notification)
            .verifyComplete();

            // Assert - name should be truncated to 10 characters
            String content = contentCaptor.getValue();
            assertThat(content).contains("Hi Christophe!"); // First 10 chars of "ChristopherJohnson"
            assertThat(content).doesNotContain("ChristopherJohnson");
        }

        @Test
        @DisplayName("Should use plural 'items' for multiple cart items")
        void shouldUsePluralForMultipleItems() {
            // Arrange
            Instant validCartTime = Instant.now().minus(Duration.ofHours(2));
            PersistedCart cart = createAbandonedCart(CART_ID, USER_ID, validCartTime);

            // Add more items to cart
            Cart embeddedCart = cart.getCart();
            embeddedCart.setItems(List.of(
                new Cart.CartItem("item-1", "product-1", "Product 1", "SKU-001",
                    new BigDecimal("29.99"), 1, Map.of(), null, new BigDecimal("29.99")),
                new Cart.CartItem("item-2", "product-2", "Product 2", "SKU-002",
                    new BigDecimal("19.99"), 1, Map.of(), null, new BigDecimal("19.99"))
            ));

            User user = createUserWithSmsOptIn(USER_ID, "1234567890", true, true);
            Notification notification = createNotification();
            ArgumentCaptor<String> contentCaptor = ArgumentCaptor.forClass(String.class);

            when(abandonedCartService.findAbandonedCarts())
                .thenReturn(Flux.just(cart));
            when(userService.findById(USER_ID))
                .thenReturn(Mono.just(user));
            when(notificationService.createNotification(
                any(), any(), any(), any(), any(),
                contentCaptor.capture(),
                any()
            )).thenReturn(Mono.just(notification));

            // Act
            StepVerifier.create(
                smsCartReminderService.processAbandonedCartSmsReminders()
                    .contextWrite(TenantContext.withTenantId(TENANT_ID))
            )
            .expectNext(notification)
            .verifyComplete();

            // Assert
            String content = contentCaptor.getValue();
            assertThat(content).contains("2 items");
        }
    }
}
