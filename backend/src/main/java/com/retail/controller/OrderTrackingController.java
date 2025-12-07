package com.retail.controller;

import com.retail.domain.order.Order;
import com.retail.domain.order.OrderTrackingService;
import com.retail.domain.order.OrderTrackingService.OrderTrackingInfo;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.time.Instant;

/**
 * REST API controller for order tracking.
 * Provides endpoints for tracking orders, updating shipping info, and delivery status.
 */
@RestController
@RequestMapping("/api/v1/orders")
@Tag(name = "Order Tracking", description = "Track orders and manage shipping information")
public class OrderTrackingController {

    private final OrderTrackingService orderTrackingService;

    public OrderTrackingController(OrderTrackingService orderTrackingService) {
        this.orderTrackingService = orderTrackingService;
    }

    /**
     * Get tracking information for an order by ID.
     */
    @GetMapping("/{orderId}/tracking")
    @Operation(
        summary = "Get order tracking info",
        description = "Retrieve tracking information for an order including carrier, tracking number, and status history."
    )
    @ApiResponse(
        responseCode = "200",
        description = "Tracking information retrieved successfully",
        content = @Content(schema = @Schema(implementation = OrderTrackingInfo.class))
    )
    @ApiResponse(responseCode = "404", description = "Order not found")
    public Mono<ResponseEntity<OrderTrackingInfo>> getTrackingInfo(
            @Parameter(description = "Order ID") @PathVariable String orderId) {
        return orderTrackingService.getTrackingInfo(orderId)
            .map(ResponseEntity::ok)
            .defaultIfEmpty(ResponseEntity.notFound().build());
    }

    /**
     * Get tracking information by order number (public endpoint).
     * Requires email for verification.
     */
    @GetMapping("/track")
    @Operation(
        summary = "Track order by order number",
        description = "Public endpoint to track an order by order number. Requires email for verification."
    )
    @ApiResponse(
        responseCode = "200",
        description = "Tracking information retrieved successfully",
        content = @Content(schema = @Schema(implementation = OrderTrackingInfo.class))
    )
    @ApiResponse(responseCode = "404", description = "Order not found or email doesn't match")
    public Mono<ResponseEntity<OrderTrackingInfo>> trackOrderByNumber(
            @Parameter(description = "Order number (e.g., ORD-20231207-0001)")
            @RequestParam String orderNumber,
            @Parameter(description = "Customer email for verification")
            @RequestParam String email) {
        return orderTrackingService.getTrackingInfoByOrderNumber(orderNumber, email)
            .map(ResponseEntity::ok)
            .defaultIfEmpty(ResponseEntity.notFound().build());
    }

    /**
     * Add tracking information to an order (admin/internal endpoint).
     */
    @PostMapping("/{orderId}/tracking")
    @Operation(
        summary = "Add tracking information",
        description = "Add carrier and tracking number to an order. Updates status to shipped."
    )
    @ApiResponse(
        responseCode = "200",
        description = "Tracking information added successfully",
        content = @Content(schema = @Schema(implementation = Order.class))
    )
    @ApiResponse(responseCode = "404", description = "Order not found")
    @ApiResponse(responseCode = "400", description = "Invalid request")
    public Mono<ResponseEntity<Order>> addTrackingInfo(
            @Parameter(description = "Order ID") @PathVariable String orderId,
            @RequestBody AddTrackingRequest request) {
        return orderTrackingService.addTrackingInfo(orderId, request.carrier(), request.trackingNumber())
            .map(ResponseEntity::ok)
            .onErrorResume(IllegalArgumentException.class,
                e -> Mono.just(ResponseEntity.notFound().build()));
    }

    /**
     * Update estimated delivery date (admin/internal endpoint).
     */
    @PutMapping("/{orderId}/estimated-delivery")
    @Operation(
        summary = "Update estimated delivery date",
        description = "Update the estimated delivery date for an order."
    )
    @ApiResponse(responseCode = "200", description = "Estimated delivery updated successfully")
    @ApiResponse(responseCode = "404", description = "Order not found")
    public Mono<ResponseEntity<Order>> updateEstimatedDelivery(
            @Parameter(description = "Order ID") @PathVariable String orderId,
            @RequestBody UpdateDeliveryRequest request) {
        return orderTrackingService.updateEstimatedDelivery(orderId, request.estimatedDeliveryDate())
            .map(ResponseEntity::ok)
            .onErrorResume(IllegalArgumentException.class,
                e -> Mono.just(ResponseEntity.notFound().build()));
    }

    /**
     * Mark order as delivered (admin/internal endpoint).
     */
    @PostMapping("/{orderId}/delivered")
    @Operation(
        summary = "Mark order as delivered",
        description = "Mark an order as delivered. Records actual delivery time."
    )
    @ApiResponse(responseCode = "200", description = "Order marked as delivered")
    @ApiResponse(responseCode = "404", description = "Order not found")
    public Mono<ResponseEntity<Order>> markDelivered(
            @Parameter(description = "Order ID") @PathVariable String orderId) {
        return orderTrackingService.markDelivered(orderId)
            .map(ResponseEntity::ok)
            .onErrorResume(IllegalArgumentException.class,
                e -> Mono.just(ResponseEntity.notFound().build()));
    }

    /**
     * Request body for adding tracking information.
     */
    @Schema(description = "Request to add tracking information to an order")
    public record AddTrackingRequest(
        @Schema(description = "Carrier name (UPS, FEDEX, USPS, DHL)", example = "UPS")
        String carrier,
        @Schema(description = "Tracking number from carrier", example = "1Z999AA10123456784")
        String trackingNumber
    ) {}

    /**
     * Request body for updating estimated delivery.
     */
    @Schema(description = "Request to update estimated delivery date")
    public record UpdateDeliveryRequest(
        @Schema(description = "Estimated delivery date and time", example = "2025-12-15T18:00:00Z")
        Instant estimatedDeliveryDate
    ) {}
}
