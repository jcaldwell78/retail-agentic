package com.retail.controller;

import com.retail.domain.wishlist.Wishlist;
import com.retail.domain.wishlist.WishlistItem;
import com.retail.domain.wishlist.WishlistService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.math.BigDecimal;

/**
 * REST controller for wishlist operations.
 * Manages user wishlists with price tracking, stock alerts, and sharing features.
 */
@RestController
@RequestMapping("/api/v1/wishlist")
@Tag(name = "Wishlist", description = "User wishlist management endpoints")
public class WishlistController {

    private final WishlistService wishlistService;

    public WishlistController(WishlistService wishlistService) {
        this.wishlistService = wishlistService;
    }

    @GetMapping("/{userId}")
    @Operation(summary = "Get user wishlist", description = "Retrieve wishlist for a user in current tenant")
    public Mono<ResponseEntity<Wishlist>> getUserWishlist(
            @Parameter(description = "User ID") @PathVariable String userId
    ) {
        return wishlistService.getUserWishlist(userId)
                .map(ResponseEntity::ok);
    }

    @PostMapping("/{userId}/items")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Add item to wishlist", description = "Add a product to the user's wishlist")
    public Mono<Wishlist> addItem(
            @Parameter(description = "User ID") @PathVariable String userId,
            @Valid @RequestBody AddItemRequest request
    ) {
        WishlistItem item = new WishlistItem(
                null, // ID will be generated
                request.productId,
                request.name,
                request.price,
                request.imageUrl,
                request.inStock != null ? request.inStock : true
        );
        item.setVariantId(request.variantId);
        item.setPriceAlertEnabled(request.priceAlertEnabled != null ? request.priceAlertEnabled : false);
        item.setPriceAlertThreshold(request.priceAlertThreshold);
        item.setStockAlertEnabled(request.stockAlertEnabled != null ? request.stockAlertEnabled : false);
        item.setNotes(request.notes);
        item.setOnSale(request.onSale);
        item.setSalePercentage(request.salePercentage);

        return wishlistService.addItem(userId, item);
    }

    @DeleteMapping("/{userId}/items/{itemId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Remove item from wishlist", description = "Remove an item by item ID")
    public Mono<Void> removeItem(
            @Parameter(description = "User ID") @PathVariable String userId,
            @Parameter(description = "Item ID") @PathVariable String itemId
    ) {
        return wishlistService.removeItem(userId, itemId)
                .then();
    }

    @DeleteMapping("/{userId}/items/product/{productId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Remove product from wishlist", description = "Remove an item by product ID and optional variant")
    public Mono<Void> removeItemByProduct(
            @Parameter(description = "User ID") @PathVariable String userId,
            @Parameter(description = "Product ID") @PathVariable String productId,
            @Parameter(description = "Variant ID (optional)") @RequestParam(required = false) String variantId
    ) {
        return wishlistService.removeItemByProduct(userId, productId, variantId)
                .then();
    }

    @PatchMapping("/{userId}/items/{itemId}")
    @Operation(summary = "Update wishlist item", description = "Update item preferences (alerts, notes, etc.)")
    public Mono<Wishlist> updateItem(
            @Parameter(description = "User ID") @PathVariable String userId,
            @Parameter(description = "Item ID") @PathVariable String itemId,
            @Valid @RequestBody UpdateItemRequest request
    ) {
        WishlistItem updates = new WishlistItem();
        updates.setCurrentPrice(request.currentPrice);
        updates.setInStock(request.inStock);
        updates.setPriceAlertEnabled(request.priceAlertEnabled);
        updates.setPriceAlertThreshold(request.priceAlertThreshold);
        updates.setStockAlertEnabled(request.stockAlertEnabled);
        updates.setNotes(request.notes);
        updates.setOnSale(request.onSale);
        updates.setSalePercentage(request.salePercentage);

        return wishlistService.updateItem(userId, itemId, updates);
    }

    @DeleteMapping("/{userId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Clear wishlist", description = "Remove all items from the user's wishlist")
    public Mono<Void> clearAllItems(
            @Parameter(description = "User ID") @PathVariable String userId
    ) {
        return wishlistService.clearAllItems(userId)
                .then();
    }

    @PostMapping("/{userId}/share")
    @Operation(summary = "Share wishlist", description = "Generate share token for wishlist sharing")
    public Mono<ResponseEntity<ShareResponse>> shareWishlist(
            @Parameter(description = "User ID") @PathVariable String userId,
            @RequestBody(required = false) ShareRequest request
    ) {
        boolean allowPurchase = request != null && request.allowPurchase != null ? request.allowPurchase : false;
        return wishlistService.shareWishlist(userId, allowPurchase)
                .map(shareToken -> {
                    ShareResponse response = new ShareResponse();
                    response.shareToken = shareToken;
                    response.shareUrl = "/wishlist/shared/" + shareToken;
                    return ResponseEntity.ok(response);
                });
    }

    @DeleteMapping("/{userId}/share")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Disable wishlist sharing", description = "Make wishlist private again")
    public Mono<Void> disableSharing(
            @Parameter(description = "User ID") @PathVariable String userId
    ) {
        return wishlistService.disableSharing(userId)
                .then();
    }

    @GetMapping("/shared/{shareToken}")
    @Operation(summary = "Get shared wishlist", description = "Retrieve a wishlist by share token (no authentication required)")
    public Mono<ResponseEntity<Wishlist>> getSharedWishlist(
            @Parameter(description = "Share token") @PathVariable String shareToken
    ) {
        return wishlistService.getSharedWishlist(shareToken)
                .map(ResponseEntity::ok)
                .defaultIfEmpty(ResponseEntity.notFound().build());
    }

    @GetMapping("/public")
    @Operation(summary = "Get public wishlists", description = "Retrieve all public wishlists for current tenant")
    public Flux<Wishlist> getPublicWishlists() {
        return wishlistService.getPublicWishlists();
    }

    @GetMapping("/count")
    @Operation(summary = "Count wishlists", description = "Get total number of wishlists for current tenant")
    public Mono<ResponseEntity<CountResponse>> countWishlists() {
        return wishlistService.countWishlists()
                .map(count -> {
                    CountResponse response = new CountResponse();
                    response.count = count;
                    return ResponseEntity.ok(response);
                });
    }

    // DTOs

    public static class AddItemRequest {
        public String productId;
        public String variantId;
        public String name;
        public BigDecimal price;
        public String imageUrl;
        public Boolean inStock;
        public Boolean priceAlertEnabled;
        public Integer priceAlertThreshold;
        public Boolean stockAlertEnabled;
        public String notes;
        public Boolean onSale;
        public Integer salePercentage;
    }

    public static class UpdateItemRequest {
        public BigDecimal currentPrice;
        public Boolean inStock;
        public Boolean priceAlertEnabled;
        public Integer priceAlertThreshold;
        public Boolean stockAlertEnabled;
        public String notes;
        public Boolean onSale;
        public Integer salePercentage;
    }

    public static class ShareRequest {
        public Boolean allowPurchase;
    }

    public static class ShareResponse {
        public String shareToken;
        public String shareUrl;
    }

    public static class CountResponse {
        public Long count;
    }
}
