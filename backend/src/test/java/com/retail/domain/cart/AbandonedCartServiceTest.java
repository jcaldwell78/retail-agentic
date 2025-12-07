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
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for AbandonedCartService.
 */
@ExtendWith(MockitoExtension.class)
class AbandonedCartServiceTest {

    @Mock
    private PersistedCartRepository persistedCartRepository;

    @Mock
    private NotificationService notificationService;

    @Mock
    private UserService userService;

    private AbandonedCartService abandonedCartService;

    private static final String TENANT_ID = "tenant-123";
    private static final String USER_ID = "user-456";
    private static final String CART_ID = "cart-789";

    @BeforeEach
    void setUp() {
        abandonedCartService = new AbandonedCartService(
            persistedCartRepository,
            notificationService,
            userService
        );
    }

    @Test
    @DisplayName("Should find abandoned carts for tenant")
    void shouldFindAbandonedCarts() {
        // Arrange
        PersistedCart cart = createAbandonedCart(CART_ID, false, false);

        when(persistedCartRepository.findAbandonedCarts(eq(TENANT_ID), any(Instant.class)))
            .thenReturn(Flux.just(cart));

        // Act & Assert
        StepVerifier.create(abandonedCartService.findAbandonedCarts()
                .contextWrite(TenantContext.withTenantId(TENANT_ID)))
            .expectNext(cart)
            .verifyComplete();

        verify(persistedCartRepository).findAbandonedCarts(eq(TENANT_ID), any(Instant.class));
    }

    @Test
    @DisplayName("Should filter out carts without items")
    void shouldFilterOutEmptyCarts() {
        // Arrange
        PersistedCart emptyCart = createAbandonedCart(CART_ID, false, false);
        emptyCart.getCart().setItems(List.of()); // Empty items

        when(persistedCartRepository.findAbandonedCarts(eq(TENANT_ID), any(Instant.class)))
            .thenReturn(Flux.just(emptyCart));

        // Act & Assert
        StepVerifier.create(abandonedCartService.findAbandonedCarts()
                .contextWrite(TenantContext.withTenantId(TENANT_ID)))
            .verifyComplete(); // Should return empty

        verify(persistedCartRepository).findAbandonedCarts(eq(TENANT_ID), any(Instant.class));
    }

    @Test
    @DisplayName("Should find carts for first reminder")
    void shouldFindCartsForFirstReminder() {
        // Arrange
        PersistedCart cart = createAbandonedCart(CART_ID, false, false);

        when(persistedCartRepository.findAbandonedCartsNotNotified(eq(TENANT_ID), any(Instant.class)))
            .thenReturn(Flux.just(cart));

        // Act & Assert
        StepVerifier.create(abandonedCartService.findCartsForFirstReminder()
                .contextWrite(TenantContext.withTenantId(TENANT_ID)))
            .expectNext(cart)
            .verifyComplete();

        verify(persistedCartRepository).findAbandonedCartsNotNotified(eq(TENANT_ID), any(Instant.class));
    }

    @Test
    @DisplayName("Should find carts for second reminder")
    void shouldFindCartsForSecondReminder() {
        // Arrange
        PersistedCart cart = createAbandonedCart(CART_ID, true, false);

        when(persistedCartRepository.findAbandonedCartsForSecondReminder(eq(TENANT_ID), any(Instant.class)))
            .thenReturn(Flux.just(cart));

        // Act & Assert
        StepVerifier.create(abandonedCartService.findCartsForSecondReminder()
                .contextWrite(TenantContext.withTenantId(TENANT_ID)))
            .expectNext(cart)
            .verifyComplete();

        verify(persistedCartRepository).findAbandonedCartsForSecondReminder(eq(TENANT_ID), any(Instant.class));
    }

    @Test
    @DisplayName("Should get abandoned cart statistics")
    void shouldGetAbandonedCartStats() {
        // Arrange
        PersistedCart cart1 = createAbandonedCart("cart-1", false, false);
        PersistedCart cart2 = createAbandonedCart("cart-2", true, false);

        when(persistedCartRepository.findAbandonedCarts(eq(TENANT_ID), any(Instant.class)))
            .thenReturn(Flux.just(cart1, cart2));

        // Act & Assert
        StepVerifier.create(abandonedCartService.getAbandonedCartStats()
                .contextWrite(TenantContext.withTenantId(TENANT_ID)))
            .assertNext(stats -> {
                assertThat(stats.count()).isEqualTo(2);
                assertThat(stats.totalValue()).isEqualTo(200.0); // 2 carts * $100 each
                assertThat(stats.notifiedCount()).isEqualTo(1);
                assertThat(stats.getAverageValue()).isEqualTo(100.0);
                assertThat(stats.getNotifiedPercentage()).isEqualTo(50.0);
            })
            .verifyComplete();
    }

    @Test
    @DisplayName("Should return empty stats when no abandoned carts")
    void shouldReturnEmptyStats() {
        // Arrange
        when(persistedCartRepository.findAbandonedCarts(eq(TENANT_ID), any(Instant.class)))
            .thenReturn(Flux.empty());

        // Act & Assert
        StepVerifier.create(abandonedCartService.getAbandonedCartStats()
                .contextWrite(TenantContext.withTenantId(TENANT_ID)))
            .assertNext(stats -> {
                assertThat(stats.count()).isEqualTo(0);
                assertThat(stats.totalValue()).isEqualTo(0.0);
                assertThat(stats.notifiedCount()).isEqualTo(0);
                assertThat(stats.getAverageValue()).isEqualTo(0.0);
                assertThat(stats.getNotifiedPercentage()).isEqualTo(0.0);
            })
            .verifyComplete();
    }

    @Test
    @DisplayName("Should send recovery email for cart")
    void shouldSendRecoveryEmail() {
        // Arrange
        PersistedCart cart = createAbandonedCart(CART_ID, false, false);
        User user = createUser();
        Notification notification = new Notification(TENANT_ID, NotificationType.ABANDONED_CART, NotificationChannel.EMAIL);
        notification.setId("notification-1");

        when(persistedCartRepository.findById(CART_ID))
            .thenReturn(Mono.just(cart));
        when(userService.findById(USER_ID))
            .thenReturn(Mono.just(user));
        when(notificationService.createNotificationFromTemplate(
            eq(USER_ID), eq("test@example.com"), eq(NotificationType.ABANDONED_CART),
            eq(NotificationChannel.EMAIL), anyString(), anyMap()))
            .thenReturn(Mono.just(notification));

        // Act & Assert
        StepVerifier.create(abandonedCartService.sendRecoveryEmail(CART_ID))
            .verifyComplete();

        verify(persistedCartRepository).findById(CART_ID);
        verify(userService).findById(USER_ID);
        verify(notificationService).createNotificationFromTemplate(
            eq(USER_ID), eq("test@example.com"), eq(NotificationType.ABANDONED_CART),
            eq(NotificationChannel.EMAIL), anyString(), anyMap());
    }

    @Test
    @DisplayName("Should skip recovery email for guest cart")
    void shouldSkipRecoveryEmailForGuestCart() {
        // Arrange
        PersistedCart cart = createAbandonedCart(CART_ID, false, false);
        cart.setUserId(null); // Guest cart

        when(persistedCartRepository.findById(CART_ID))
            .thenReturn(Mono.just(cart));

        // Act & Assert
        StepVerifier.create(abandonedCartService.sendRecoveryEmail(CART_ID))
            .verifyComplete();

        verify(persistedCartRepository).findById(CART_ID);
        verifyNoInteractions(userService);
        verifyNoInteractions(notificationService);
    }

    @Test
    @DisplayName("Should reset abandonment tracking")
    void shouldResetAbandonmentTracking() {
        // Arrange
        PersistedCart cart = createAbandonedCart(CART_ID, true, true);
        cart.setAbandonmentNotifiedAt(Instant.now().minus(48, ChronoUnit.HOURS));
        cart.setSecondReminderSentAt(Instant.now().minus(24, ChronoUnit.HOURS));

        when(persistedCartRepository.save(any(PersistedCart.class)))
            .thenAnswer(invocation -> Mono.just(invocation.getArgument(0)));

        // Act & Assert
        StepVerifier.create(abandonedCartService.resetAbandonmentTracking(cart))
            .assertNext(updatedCart -> {
                assertThat(updatedCart.isAbandonmentNotified()).isFalse();
                assertThat(updatedCart.getAbandonmentNotifiedAt()).isNull();
                assertThat(updatedCart.isSecondReminderSent()).isFalse();
                assertThat(updatedCart.getSecondReminderSentAt()).isNull();
            })
            .verifyComplete();

        verify(persistedCartRepository).save(any(PersistedCart.class));
    }

    @Test
    @DisplayName("Should handle cart not found for recovery email")
    void shouldHandleCartNotFoundForRecoveryEmail() {
        // Arrange
        when(persistedCartRepository.findById(CART_ID))
            .thenReturn(Mono.empty());

        // Act & Assert
        StepVerifier.create(abandonedCartService.sendRecoveryEmail(CART_ID))
            .verifyComplete();

        verify(persistedCartRepository).findById(CART_ID);
        verifyNoInteractions(userService);
        verifyNoInteractions(notificationService);
    }

    private PersistedCart createAbandonedCart(String id, boolean notified, boolean secondReminder) {
        Cart cart = new Cart();
        cart.setId(id);
        cart.setTenantId(TENANT_ID);
        cart.setSessionId("session-" + id);
        cart.setItems(List.of(
            new Cart.CartItem(
                "item-1",
                "product-1",
                "Test Product",
                "SKU-001",
                new BigDecimal("100.00"),
                1,
                Map.of(),
                "https://example.com/image.jpg",
                new BigDecimal("100.00")
            )
        ));
        cart.setCreatedAt(Instant.now().minus(48, ChronoUnit.HOURS));
        cart.setUpdatedAt(Instant.now().minus(25, ChronoUnit.HOURS)); // Abandoned 25 hours ago

        PersistedCart persistedCart = new PersistedCart(cart);
        persistedCart.setUserId(USER_ID);
        persistedCart.setAbandonmentNotified(notified);
        persistedCart.setSecondReminderSent(secondReminder);

        return persistedCart;
    }

    private User createUser() {
        User user = new User();
        user.setId(USER_ID);
        user.setTenantId(TENANT_ID);
        user.setEmail("test@example.com");
        user.setFirstName("Test");
        user.setLastName("User");
        return user;
    }
}
