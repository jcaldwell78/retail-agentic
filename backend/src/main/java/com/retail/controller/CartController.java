package com.retail.controller;

import com.retail.domain.cart.Cart;
import com.retail.domain.cart.CartService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.util.Map;

/**
 * REST controller for shopping cart operations.
 * Manages cart items, quantities, and checkout preparation.
 */
@RestController
@RequestMapping("/api/v1/cart")
@Tag(name = "Shopping Cart", description = "Shopping cart management endpoints")
public class CartController {

    private final CartService cartService;

    public CartController(CartService cartService) {
        this.cartService = cartService;
    }

    @GetMapping("/{sessionId}")
    @Operation(summary = "Get cart", description = "Retrieve cart by session ID")
    public Mono<ResponseEntity<Cart>> getCart(
        @Parameter(description = "Session ID") @PathVariable String sessionId
    ) {
        return cartService.getCart(sessionId)
            .map(ResponseEntity::ok);
    }

    @PostMapping("/{sessionId}/items")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Add item to cart", description = "Add product to cart or increase quantity")
    public Mono<Cart> addItem(
        @Parameter(description = "Session ID") @PathVariable String sessionId,
        @Valid @RequestBody AddItemRequest request
    ) {
        return cartService.addItem(
            sessionId,
            request.productId,
            request.quantity,
            request.attributes
        );
    }

    @PutMapping("/{sessionId}/items/{itemId}")
    @Operation(summary = "Update item quantity", description = "Update quantity of item in cart")
    public Mono<Cart> updateItemQuantity(
        @Parameter(description = "Session ID") @PathVariable String sessionId,
        @Parameter(description = "Item ID") @PathVariable String itemId,
        @Valid @RequestBody UpdateQuantityRequest request
    ) {
        return cartService.updateItemQuantity(
            sessionId,
            itemId,
            request.quantity,
            request.incremental != null ? request.incremental : false
        );
    }

    @DeleteMapping("/{sessionId}/items/{itemId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Remove item from cart", description = "Remove item from cart")
    public Mono<Void> removeItem(
        @Parameter(description = "Session ID") @PathVariable String sessionId,
        @Parameter(description = "Item ID") @PathVariable String itemId
    ) {
        return cartService.removeItem(sessionId, itemId)
            .then();
    }

    @DeleteMapping("/{sessionId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Clear cart", description = "Remove all items from cart")
    public Mono<Void> clearCart(
        @Parameter(description = "Session ID") @PathVariable String sessionId
    ) {
        return cartService.clearCart(sessionId)
            .then();
    }

    @PostMapping("/{sessionId}/extend")
    @Operation(summary = "Extend cart TTL", description = "Refresh cart expiration time")
    public Mono<Cart> extendCart(
        @Parameter(description = "Session ID") @PathVariable String sessionId
    ) {
        return cartService.extendCartTtl(sessionId);
    }

    // DTOs
    public static class AddItemRequest {
        public String productId;
        public Integer quantity;
        public Map<String, Object> attributes;
    }

    public static class UpdateQuantityRequest {
        public Integer quantity;
        public Boolean incremental; // true = add to existing, false = set absolute
    }
}
