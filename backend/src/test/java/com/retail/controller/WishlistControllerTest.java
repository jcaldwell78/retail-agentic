package com.retail.controller;

import com.retail.domain.wishlist.Wishlist;
import com.retail.domain.wishlist.WishlistItem;
import com.retail.domain.wishlist.WishlistService;
import com.retail.security.tenant.TenantContext;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit test for WishlistController.
 * Tests REST API endpoints with mocked service layer.
 */
@ExtendWith(MockitoExtension.class)
class WishlistControllerTest {

    @Mock
    private WishlistService wishlistService;

    private WishlistController wishlistController;

    private static final String TENANT_ID = "test-tenant";
    private static final String USER_ID = "user-123";

    @BeforeEach
    void setUp() {
        wishlistController = new WishlistController(wishlistService);
    }

    @Test
    @DisplayName("Should get user wishlist")
    void shouldGetUserWishlist() {
        // Arrange
        Wishlist wishlist = createMockWishlist(USER_ID);

        when(wishlistService.getUserWishlist(USER_ID))
                .thenReturn(Mono.just(wishlist));

        // Act & Assert
        StepVerifier.create(wishlistController.getUserWishlist(USER_ID)
                        .contextWrite(TenantContext.withTenantId(TENANT_ID)))
                .expectNextMatches(response ->
                        response.getStatusCode() == HttpStatus.OK &&
                        response.getBody() != null &&
                        response.getBody().getUserId().equals(USER_ID)
                )
                .verifyComplete();

        verify(wishlistService).getUserWishlist(USER_ID);
    }

    @Test
    @DisplayName("Should add item to wishlist")
    void shouldAddItem() {
        // Arrange
        WishlistController.AddItemRequest request = new WishlistController.AddItemRequest();
        request.productId = "product-123";
        request.name = "Test Product";
        request.price = new BigDecimal("29.99");
        request.inStock = true;

        Wishlist wishlist = createMockWishlist(USER_ID);

        when(wishlistService.addItem(eq(USER_ID), any(WishlistItem.class)))
                .thenReturn(Mono.just(wishlist));

        // Act & Assert
        StepVerifier.create(wishlistController.addItem(USER_ID, request)
                        .contextWrite(TenantContext.withTenantId(TENANT_ID)))
                .expectNextMatches(result ->
                        result.getUserId().equals(USER_ID)
                )
                .verifyComplete();

        verify(wishlistService).addItem(eq(USER_ID), any(WishlistItem.class));
    }

    @Test
    @DisplayName("Should remove item by item ID")
    void shouldRemoveItemById() {
        // Arrange
        String itemId = "item-123";

        when(wishlistService.removeItem(USER_ID, itemId))
                .thenReturn(Mono.just(createMockWishlist(USER_ID)));

        // Act & Assert
        StepVerifier.create(wishlistController.removeItem(USER_ID, itemId)
                        .contextWrite(TenantContext.withTenantId(TENANT_ID)))
                .verifyComplete();

        verify(wishlistService).removeItem(USER_ID, itemId);
    }

    @Test
    @DisplayName("Should remove item by product ID")
    void shouldRemoveItemByProductId() {
        // Arrange
        String productId = "product-123";

        when(wishlistService.removeItemByProduct(USER_ID, productId, null))
                .thenReturn(Mono.just(createMockWishlist(USER_ID)));

        // Act & Assert
        StepVerifier.create(wishlistController.removeItemByProduct(USER_ID, productId, null)
                        .contextWrite(TenantContext.withTenantId(TENANT_ID)))
                .verifyComplete();

        verify(wishlistService).removeItemByProduct(USER_ID, productId, null);
    }

    @Test
    @DisplayName("Should update item")
    void shouldUpdateItem() {
        // Arrange
        String itemId = "item-123";
        WishlistController.UpdateItemRequest request = new WishlistController.UpdateItemRequest();
        request.priceAlertEnabled = true;
        request.priceAlertThreshold = 10;
        request.notes = "Buy when on sale";

        Wishlist wishlist = createMockWishlist(USER_ID);

        when(wishlistService.updateItem(eq(USER_ID), eq(itemId), any(WishlistItem.class)))
                .thenReturn(Mono.just(wishlist));

        // Act & Assert
        StepVerifier.create(wishlistController.updateItem(USER_ID, itemId, request)
                        .contextWrite(TenantContext.withTenantId(TENANT_ID)))
                .expectNextMatches(result ->
                        result.getUserId().equals(USER_ID)
                )
                .verifyComplete();

        verify(wishlistService).updateItem(eq(USER_ID), eq(itemId), any(WishlistItem.class));
    }

    @Test
    @DisplayName("Should clear all items")
    void shouldClearAllItems() {
        // Arrange
        when(wishlistService.clearAllItems(USER_ID))
                .thenReturn(Mono.just(createMockWishlist(USER_ID)));

        // Act & Assert
        StepVerifier.create(wishlistController.clearAllItems(USER_ID)
                        .contextWrite(TenantContext.withTenantId(TENANT_ID)))
                .verifyComplete();

        verify(wishlistService).clearAllItems(USER_ID);
    }

    @Test
    @DisplayName("Should share wishlist")
    void shouldShareWishlist() {
        // Arrange
        String shareToken = UUID.randomUUID().toString();
        WishlistController.ShareRequest request = new WishlistController.ShareRequest();
        request.allowPurchase = true;

        when(wishlistService.shareWishlist(USER_ID, true))
                .thenReturn(Mono.just(shareToken));

        // Act & Assert
        StepVerifier.create(wishlistController.shareWishlist(USER_ID, request)
                        .contextWrite(TenantContext.withTenantId(TENANT_ID)))
                .expectNextMatches(response ->
                        response.getStatusCode() == HttpStatus.OK &&
                        response.getBody() != null &&
                        response.getBody().shareToken.equals(shareToken)
                )
                .verifyComplete();

        verify(wishlistService).shareWishlist(USER_ID, true);
    }

    @Test
    @DisplayName("Should disable sharing")
    void shouldDisableSharing() {
        // Arrange
        when(wishlistService.disableSharing(USER_ID))
                .thenReturn(Mono.just(createMockWishlist(USER_ID)));

        // Act & Assert
        StepVerifier.create(wishlistController.disableSharing(USER_ID)
                        .contextWrite(TenantContext.withTenantId(TENANT_ID)))
                .verifyComplete();

        verify(wishlistService).disableSharing(USER_ID);
    }

    @Test
    @DisplayName("Should get shared wishlist")
    void shouldGetSharedWishlist() {
        // Arrange
        String shareToken = UUID.randomUUID().toString();
        Wishlist wishlist = createMockWishlist(USER_ID);
        wishlist.setShareToken(shareToken);
        wishlist.setIsPublic(true);

        when(wishlistService.getSharedWishlist(shareToken))
                .thenReturn(Mono.just(wishlist));

        // Act & Assert
        StepVerifier.create(wishlistController.getSharedWishlist(shareToken))
                .expectNextMatches(response ->
                        response.getStatusCode() == HttpStatus.OK &&
                        response.getBody() != null &&
                        response.getBody().getShareToken().equals(shareToken) &&
                        response.getBody().getIsPublic()
                )
                .verifyComplete();

        verify(wishlistService).getSharedWishlist(shareToken);
    }

    @Test
    @DisplayName("Should return 404 for non-existent shared wishlist")
    void shouldReturn404ForNonExistentSharedWishlist() {
        // Arrange
        String shareToken = UUID.randomUUID().toString();

        when(wishlistService.getSharedWishlist(shareToken))
                .thenReturn(Mono.empty());

        // Act & Assert
        StepVerifier.create(wishlistController.getSharedWishlist(shareToken))
                .expectNextMatches(response ->
                        response.getStatusCode() == HttpStatus.NOT_FOUND
                )
                .verifyComplete();

        verify(wishlistService).getSharedWishlist(shareToken);
    }

    @Test
    @DisplayName("Should get public wishlists")
    void shouldGetPublicWishlists() {
        // Arrange
        Wishlist wishlist1 = createMockWishlist("user-1");
        wishlist1.setIsPublic(true);
        Wishlist wishlist2 = createMockWishlist("user-2");
        wishlist2.setIsPublic(true);

        when(wishlistService.getPublicWishlists())
                .thenReturn(Flux.just(wishlist1, wishlist2));

        // Act & Assert
        StepVerifier.create(wishlistController.getPublicWishlists()
                        .contextWrite(TenantContext.withTenantId(TENANT_ID)))
                .expectNextMatches(wishlist -> wishlist.getIsPublic())
                .expectNextMatches(wishlist -> wishlist.getIsPublic())
                .verifyComplete();

        verify(wishlistService).getPublicWishlists();
    }

    @Test
    @DisplayName("Should count wishlists")
    void shouldCountWishlists() {
        // Arrange
        when(wishlistService.countWishlists())
                .thenReturn(Mono.just(5L));

        // Act & Assert
        StepVerifier.create(wishlistController.countWishlists()
                        .contextWrite(TenantContext.withTenantId(TENANT_ID)))
                .expectNextMatches(response ->
                        response.getStatusCode() == HttpStatus.OK &&
                        response.getBody() != null &&
                        response.getBody().count == 5L
                )
                .verifyComplete();

        verify(wishlistService).countWishlists();
    }

    // Helper methods

    private Wishlist createMockWishlist(String userId) {
        Wishlist wishlist = new Wishlist(TENANT_ID, userId);
        wishlist.setId(UUID.randomUUID().toString());
        wishlist.setCreatedAt(Instant.now());
        wishlist.setUpdatedAt(Instant.now());
        wishlist.setItems(new ArrayList<>());
        return wishlist;
    }
}
