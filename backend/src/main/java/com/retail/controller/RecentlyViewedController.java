package com.retail.controller;

import com.retail.domain.product.Product;
import com.retail.domain.product.RecentlyViewedService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

/**
 * REST API controller for recently viewed products.
 * Allows users to track and retrieve their browsing history.
 */
@RestController
@RequestMapping("/api/v1/recently-viewed")
@Tag(name = "Recently Viewed", description = "Track and retrieve recently viewed products")
public class RecentlyViewedController {

    private final RecentlyViewedService recentlyViewedService;

    public RecentlyViewedController(RecentlyViewedService recentlyViewedService) {
        this.recentlyViewedService = recentlyViewedService;
    }

    /**
     * Record that a user viewed a product.
     */
    @PostMapping("/users/{userId}/products/{productId}")
    @Operation(
        summary = "Record product view",
        description = "Record that a user viewed a product. Updates the recently viewed list."
    )
    @ApiResponse(responseCode = "204", description = "View recorded successfully")
    public Mono<ResponseEntity<Void>> recordView(
            @Parameter(description = "User ID") @PathVariable String userId,
            @Parameter(description = "Product ID") @PathVariable String productId) {
        return recentlyViewedService.recordView(userId, productId)
            .then(Mono.just(ResponseEntity.noContent().<Void>build()));
    }

    /**
     * Get recently viewed products for a user.
     */
    @GetMapping("/users/{userId}")
    @Operation(
        summary = "Get recently viewed products",
        description = "Retrieve the list of recently viewed products for a user, ordered by most recent first."
    )
    @ApiResponse(
        responseCode = "200",
        description = "List of recently viewed products",
        content = @Content(schema = @Schema(implementation = Product.class))
    )
    public Flux<Product> getRecentlyViewed(
            @Parameter(description = "User ID") @PathVariable String userId,
            @Parameter(description = "Maximum number of products to return (default 10, max 20)")
            @RequestParam(defaultValue = "10") int limit) {
        return recentlyViewedService.getRecentlyViewed(userId, limit);
    }

    /**
     * Get recently viewed product IDs only.
     */
    @GetMapping("/users/{userId}/ids")
    @Operation(
        summary = "Get recently viewed product IDs",
        description = "Retrieve just the IDs of recently viewed products. Useful for lightweight checks."
    )
    @ApiResponse(responseCode = "200", description = "List of product IDs")
    public Flux<String> getRecentlyViewedIds(
            @Parameter(description = "User ID") @PathVariable String userId,
            @Parameter(description = "Maximum number of IDs to return (default 10, max 20)")
            @RequestParam(defaultValue = "10") int limit) {
        return recentlyViewedService.getRecentlyViewedIds(userId, limit);
    }

    /**
     * Get count of recently viewed products.
     */
    @GetMapping("/users/{userId}/count")
    @Operation(
        summary = "Get count of recently viewed products",
        description = "Get the total count of products in the user's recently viewed list."
    )
    @ApiResponse(responseCode = "200", description = "Count of recently viewed products")
    public Mono<ResponseEntity<Map<String, Long>>> getCount(
            @Parameter(description = "User ID") @PathVariable String userId) {
        return recentlyViewedService.getCount(userId)
            .map(count -> ResponseEntity.ok(Map.of("count", count)));
    }

    /**
     * Check if a product is in the recently viewed list.
     */
    @GetMapping("/users/{userId}/products/{productId}/exists")
    @Operation(
        summary = "Check if product is recently viewed",
        description = "Check if a specific product is in the user's recently viewed list."
    )
    @ApiResponse(responseCode = "200", description = "Boolean indicating if product is in the list")
    public Mono<ResponseEntity<Map<String, Boolean>>> isRecentlyViewed(
            @Parameter(description = "User ID") @PathVariable String userId,
            @Parameter(description = "Product ID") @PathVariable String productId) {
        return recentlyViewedService.isRecentlyViewed(userId, productId)
            .map(exists -> ResponseEntity.ok(Map.of("exists", exists)));
    }

    /**
     * Remove a product from the recently viewed list.
     */
    @DeleteMapping("/users/{userId}/products/{productId}")
    @Operation(
        summary = "Remove product from recently viewed",
        description = "Remove a specific product from the user's recently viewed list."
    )
    @ApiResponse(responseCode = "204", description = "Product removed successfully")
    public Mono<ResponseEntity<Void>> removeProduct(
            @Parameter(description = "User ID") @PathVariable String userId,
            @Parameter(description = "Product ID") @PathVariable String productId) {
        return recentlyViewedService.removeProduct(userId, productId)
            .then(Mono.just(ResponseEntity.noContent().<Void>build()));
    }

    /**
     * Clear all recently viewed products for a user.
     */
    @DeleteMapping("/users/{userId}")
    @Operation(
        summary = "Clear all recently viewed products",
        description = "Clear the entire recently viewed list for a user."
    )
    @ApiResponse(responseCode = "204", description = "List cleared successfully")
    public Mono<ResponseEntity<Void>> clearAll(
            @Parameter(description = "User ID") @PathVariable String userId) {
        return recentlyViewedService.clearAll(userId)
            .then(Mono.just(ResponseEntity.noContent().<Void>build()));
    }

    /**
     * Merge guest session's recently viewed products to logged-in user.
     */
    @PostMapping("/merge")
    @Operation(
        summary = "Merge guest to user",
        description = "Merge recently viewed products from a guest session to a logged-in user account."
    )
    @ApiResponse(responseCode = "204", description = "Merge completed successfully")
    public Mono<ResponseEntity<Void>> mergeGuestToUser(
            @RequestBody MergeRequest request) {
        return recentlyViewedService.mergeGuestToUser(request.guestId, request.userId)
            .then(Mono.just(ResponseEntity.noContent().<Void>build()));
    }

    /**
     * Request body for merging guest to user recently viewed products.
     */
    public static class MergeRequest {
        @Schema(description = "Guest session ID", example = "guest-abc123")
        public String guestId;

        @Schema(description = "Logged-in user ID", example = "user-xyz789")
        public String userId;
    }
}
