package com.retail.domain.cart;

import com.retail.infrastructure.persistence.SavedCartRepository;
import com.retail.security.tenant.TenantContext;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SavedCartServiceTest {

    @Mock
    private SavedCartRepository savedCartRepository;

    @Mock
    private CartService cartService;

    private SavedCartService savedCartService;

    private static final String TEST_TENANT_ID = "tenant-123";
    private static final String TEST_USER_ID = "user-123";
    private static final String TEST_SESSION_ID = "session-123";

    @BeforeEach
    void setUp() {
        savedCartService = new SavedCartService(savedCartRepository, cartService);
    }

    @Test
    void getSavedCart_whenExists_shouldReturnExistingCart() {
        // Arrange
        SavedCart existingCart = new SavedCart(TEST_TENANT_ID, TEST_USER_ID, null);
        when(savedCartRepository.findByTenantIdAndUserId(TEST_TENANT_ID, TEST_USER_ID))
            .thenReturn(Mono.just(existingCart));

        // Act & Assert
        StepVerifier.create(savedCartService.getSavedCart(TEST_USER_ID)
            .contextWrite(TenantContext.withTenantId(TEST_TENANT_ID)))
            .assertNext(savedCart -> {
                assertThat(savedCart.getUserId()).isEqualTo(TEST_USER_ID);
                assertThat(savedCart.getTenantId()).isEqualTo(TEST_TENANT_ID);
            })
            .verifyComplete();

        verify(savedCartRepository, never()).save(any(SavedCart.class));
    }

    @Test
    void getSavedCart_whenNotExists_shouldCreateNewCart() {
        // Arrange
        when(savedCartRepository.findByTenantIdAndUserId(TEST_TENANT_ID, TEST_USER_ID))
            .thenReturn(Mono.empty());

        SavedCart newCart = new SavedCart(TEST_TENANT_ID, TEST_USER_ID, null);
        when(savedCartRepository.save(any(SavedCart.class)))
            .thenReturn(Mono.just(newCart));

        // Act & Assert
        StepVerifier.create(savedCartService.getSavedCart(TEST_USER_ID)
            .contextWrite(TenantContext.withTenantId(TEST_TENANT_ID)))
            .assertNext(savedCart -> {
                assertThat(savedCart.getUserId()).isEqualTo(TEST_USER_ID);
            })
            .verifyComplete();

        verify(savedCartRepository).save(any(SavedCart.class));
    }

    @Test
    void saveForLater_shouldMoveItemFromCartToSaved() {
        // Arrange
        Cart cart = createTestCart();
        SavedCart savedCart = new SavedCart(TEST_TENANT_ID, TEST_USER_ID, null);
        savedCart.setItems(new ArrayList<>());

        when(cartService.getCart(TEST_SESSION_ID)).thenReturn(Mono.just(cart));
        when(savedCartRepository.findByTenantIdAndUserId(TEST_TENANT_ID, TEST_USER_ID))
            .thenReturn(Mono.just(savedCart));
        when(cartService.removeItem(TEST_SESSION_ID, "item-1"))
            .thenReturn(Mono.just(cart));
        when(savedCartRepository.save(any(SavedCart.class)))
            .thenReturn(Mono.just(savedCart));

        // Act & Assert
        StepVerifier.create(
            savedCartService.saveForLater(TEST_SESSION_ID, "item-1", TEST_USER_ID)
                .contextWrite(TenantContext.withTenantId(TEST_TENANT_ID))
        )
        .assertNext(result -> {
            assertThat(result.getItems()).isNotEmpty();
            assertThat(result.getItemCount()).isPositive();
        })
        .verifyComplete();

        verify(cartService).removeItem(TEST_SESSION_ID, "item-1");
        verify(savedCartRepository).save(any(SavedCart.class));
    }

    @Test
    void moveToCart_shouldMoveItemFromSavedToCart() {
        // Arrange
        SavedCart savedCart = createTestSavedCart();
        Cart cart = createTestCart();
        cart.setItems(new ArrayList<>());

        when(savedCartRepository.findByTenantIdAndUserId(TEST_TENANT_ID, TEST_USER_ID))
            .thenReturn(Mono.just(savedCart));
        when(cartService.addItem(
            eq(TEST_SESSION_ID),
            anyString(),
            anyInt(),
            any()
        )).thenReturn(Mono.just(cart));
        when(savedCartRepository.save(any(SavedCart.class)))
            .thenReturn(Mono.just(savedCart));

        // Act & Assert
        StepVerifier.create(
            savedCartService.moveToCart(TEST_SESSION_ID, "saved-item-1", TEST_USER_ID)
                .contextWrite(TenantContext.withTenantId(TEST_TENANT_ID))
        )
        .expectNextCount(1)
        .verifyComplete();

        verify(cartService).addItem(eq(TEST_SESSION_ID), anyString(), anyInt(), any());
        verify(savedCartRepository).save(any(SavedCart.class));
    }

    @Test
    void removeFromSaved_shouldRemoveItem() {
        // Arrange
        SavedCart savedCart = createTestSavedCart();

        when(savedCartRepository.findByTenantIdAndUserId(TEST_TENANT_ID, TEST_USER_ID))
            .thenReturn(Mono.just(savedCart));
        when(savedCartRepository.save(any(SavedCart.class)))
            .thenReturn(Mono.just(savedCart));

        // Act & Assert
        StepVerifier.create(
            savedCartService.removeFromSaved("saved-item-1", TEST_USER_ID, null)
                .contextWrite(TenantContext.withTenantId(TEST_TENANT_ID))
        )
        .assertNext(result -> {
            assertThat(result.getItems()).isEmpty();
        })
        .verifyComplete();

        verify(savedCartRepository).save(any(SavedCart.class));
    }

    @Test
    void moveAllToCart_shouldMoveAllItems() {
        // Arrange
        SavedCart savedCart = createTestSavedCart();
        Cart cart = createTestCart();

        when(savedCartRepository.findByTenantIdAndUserId(TEST_TENANT_ID, TEST_USER_ID))
            .thenReturn(Mono.just(savedCart));
        when(cartService.getCart(TEST_SESSION_ID))
            .thenReturn(Mono.just(cart));
        when(cartService.addItem(
            eq(TEST_SESSION_ID),
            anyString(),
            anyInt(),
            any()
        )).thenReturn(Mono.just(cart));
        when(savedCartRepository.save(any(SavedCart.class)))
            .thenReturn(Mono.just(savedCart));

        // Act & Assert
        StepVerifier.create(
            savedCartService.moveAllToCart(TEST_SESSION_ID, TEST_USER_ID)
                .contextWrite(TenantContext.withTenantId(TEST_TENANT_ID))
        )
        .expectNextCount(1)
        .verifyComplete();

        verify(cartService, atLeastOnce()).addItem(
            eq(TEST_SESSION_ID),
            anyString(),
            anyInt(),
            any()
        );
        verify(savedCartRepository).save(any(SavedCart.class));
    }

    @Test
    void clearSavedCart_shouldRemoveAllItems() {
        // Arrange
        SavedCart savedCart = createTestSavedCart();

        when(savedCartRepository.findByTenantIdAndUserId(TEST_TENANT_ID, TEST_USER_ID))
            .thenReturn(Mono.just(savedCart));
        when(savedCartRepository.save(any(SavedCart.class)))
            .thenReturn(Mono.just(savedCart));

        // Act & Assert
        StepVerifier.create(
            savedCartService.clearSavedCart(TEST_USER_ID, null)
                .contextWrite(TenantContext.withTenantId(TEST_TENANT_ID))
        )
        .assertNext(result -> {
            assertThat(result.getItems()).isEmpty();
            assertThat(result.getItemCount()).isZero();
        })
        .verifyComplete();

        verify(savedCartRepository).save(any(SavedCart.class));
    }

    @Test
    void mergeSessionSavedCart_shouldMergeIntoUserCart() {
        // Arrange
        SavedCart sessionCart = new SavedCart(TEST_TENANT_ID, null, TEST_SESSION_ID);
        SavedCart.SavedCartItem sessionItem = new SavedCart.SavedCartItem(
            "item-1",
            "product-1",
            "Product 1",
            "SKU-001",
            new BigDecimal("50.00"),
            2,
            new HashMap<>(),
            "image.jpg"
        );
        sessionCart.getItems().add(sessionItem);

        SavedCart userCart = new SavedCart(TEST_TENANT_ID, TEST_USER_ID, null);
        userCart.setItems(new ArrayList<>());

        when(savedCartRepository.findByTenantIdAndSessionId(TEST_TENANT_ID, TEST_SESSION_ID))
            .thenReturn(Mono.just(sessionCart));
        when(savedCartRepository.findByTenantIdAndUserId(TEST_TENANT_ID, TEST_USER_ID))
            .thenReturn(Mono.just(userCart));
        when(savedCartRepository.deleteByTenantIdAndSessionId(TEST_TENANT_ID, TEST_SESSION_ID))
            .thenReturn(Mono.empty());
        when(savedCartRepository.save(any(SavedCart.class)))
            .thenReturn(Mono.just(userCart));

        // Act & Assert
        StepVerifier.create(
            savedCartService.mergeSessionSavedCart(TEST_SESSION_ID, TEST_USER_ID)
                .contextWrite(TenantContext.withTenantId(TEST_TENANT_ID))
        )
        .assertNext(result -> {
            assertThat(result.getUserId()).isEqualTo(TEST_USER_ID);
            assertThat(result.getItems()).hasSize(1);
        })
        .verifyComplete();

        verify(savedCartRepository).deleteByTenantIdAndSessionId(TEST_TENANT_ID, TEST_SESSION_ID);
        verify(savedCartRepository).save(any(SavedCart.class));
    }

    // Helper methods
    private Cart createTestCart() {
        Cart cart = new Cart();
        cart.setId("cart-1");
        cart.setTenantId(TEST_TENANT_ID);
        cart.setSessionId(TEST_SESSION_ID);
        cart.setItems(new ArrayList<>());

        Cart.CartItem item = new Cart.CartItem(
            "item-1",
            "product-1",
            "Product 1",
            "SKU-001",
            new BigDecimal("50.00"),
            2,
            new HashMap<>(),
            "image.jpg",
            new BigDecimal("100.00")
        );

        cart.getItems().add(item);
        cart.setItemCount(2);

        return cart;
    }

    private SavedCart createTestSavedCart() {
        SavedCart savedCart = new SavedCart(TEST_TENANT_ID, TEST_USER_ID, null);
        savedCart.setItems(new ArrayList<>());

        SavedCart.SavedCartItem item = new SavedCart.SavedCartItem(
            "saved-item-1",
            "product-1",
            "Product 1",
            "SKU-001",
            new BigDecimal("50.00"),
            2,
            new HashMap<>(),
            "image.jpg"
        );

        savedCart.getItems().add(item);
        savedCart.setItemCount(2);

        return savedCart;
    }
}
