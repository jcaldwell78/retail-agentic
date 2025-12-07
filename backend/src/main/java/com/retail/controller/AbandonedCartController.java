package com.retail.controller;

import com.retail.domain.cart.AbandonedCartService;
import com.retail.domain.cart.AbandonedCartService.AbandonedCartStats;
import com.retail.domain.cart.PersistedCart;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * REST API controller for abandoned cart recovery (admin endpoints).
 * Provides functionality to view abandoned carts and trigger recovery emails.
 */
@RestController
@RequestMapping("/api/v1/admin/abandoned-carts")
@Tag(name = "Abandoned Carts", description = "Admin endpoints for abandoned cart recovery")
public class AbandonedCartController {

    private final AbandonedCartService abandonedCartService;

    public AbandonedCartController(AbandonedCartService abandonedCartService) {
        this.abandonedCartService = abandonedCartService;
    }

    /**
     * Get abandoned cart statistics.
     */
    @GetMapping("/statistics")
    @Operation(
        summary = "Get abandoned cart statistics",
        description = "Retrieve statistics about abandoned carts including count, total value, and notification status."
    )
    @ApiResponse(
        responseCode = "200",
        description = "Statistics retrieved successfully",
        content = @Content(schema = @Schema(implementation = AbandonedCartStats.class))
    )
    public Mono<ResponseEntity<AbandonedCartStats>> getStatistics() {
        return abandonedCartService.getAbandonedCartStats()
            .map(ResponseEntity::ok)
            .defaultIfEmpty(ResponseEntity.ok(new AbandonedCartStats(0, 0.0, 0)));
    }

    /**
     * Get list of all abandoned carts.
     */
    @GetMapping
    @Operation(
        summary = "List abandoned carts",
        description = "Retrieve all abandoned carts for the current tenant."
    )
    @ApiResponse(
        responseCode = "200",
        description = "List of abandoned carts",
        content = @Content(schema = @Schema(implementation = PersistedCart.class))
    )
    public Flux<PersistedCart> listAbandonedCarts() {
        return abandonedCartService.findAbandonedCarts();
    }

    /**
     * Get carts eligible for first reminder.
     */
    @GetMapping("/first-reminder")
    @Operation(
        summary = "List carts for first reminder",
        description = "Retrieve abandoned carts that are eligible for the first reminder (24+ hours abandoned, not yet notified)."
    )
    @ApiResponse(responseCode = "200", description = "List of carts eligible for first reminder")
    public Flux<PersistedCart> listCartsForFirstReminder() {
        return abandonedCartService.findCartsForFirstReminder();
    }

    /**
     * Get carts eligible for second reminder.
     */
    @GetMapping("/second-reminder")
    @Operation(
        summary = "List carts for second reminder",
        description = "Retrieve abandoned carts that are eligible for the second reminder (72+ hours abandoned, first reminder sent)."
    )
    @ApiResponse(responseCode = "200", description = "List of carts eligible for second reminder")
    public Flux<PersistedCart> listCartsForSecondReminder() {
        return abandonedCartService.findCartsForSecondReminder();
    }

    /**
     * Send a recovery email for a specific cart.
     */
    @PostMapping("/{cartId}/send-recovery")
    @Operation(
        summary = "Send recovery email",
        description = "Manually trigger a recovery email for a specific abandoned cart."
    )
    @ApiResponse(responseCode = "204", description = "Recovery email sent successfully")
    @ApiResponse(responseCode = "404", description = "Cart not found")
    public Mono<ResponseEntity<Void>> sendRecoveryEmail(
            @Parameter(description = "Cart ID") @PathVariable String cartId) {
        return abandonedCartService.sendRecoveryEmail(cartId)
            .then(Mono.just(ResponseEntity.noContent().<Void>build()))
            .defaultIfEmpty(ResponseEntity.notFound().build());
    }

    /**
     * Reset abandonment tracking for a cart.
     */
    @PostMapping("/{cartId}/reset-tracking")
    @Operation(
        summary = "Reset abandonment tracking",
        description = "Reset the abandonment tracking for a cart (e.g., after manual recovery)."
    )
    @ApiResponse(responseCode = "200", description = "Tracking reset successfully")
    @ApiResponse(responseCode = "404", description = "Cart not found")
    public Mono<ResponseEntity<PersistedCart>> resetTracking(
            @Parameter(description = "Cart ID") @PathVariable String cartId) {
        return abandonedCartService.findAbandonedCarts()
            .filter(cart -> cart.getId().equals(cartId))
            .next()
            .flatMap(abandonedCartService::resetAbandonmentTracking)
            .map(ResponseEntity::ok)
            .defaultIfEmpty(ResponseEntity.notFound().build());
    }
}
