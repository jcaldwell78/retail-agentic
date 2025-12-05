package com.retail.controller;

import com.retail.domain.inventory.Inventory;
import com.retail.domain.inventory.InventoryService;
import com.retail.exception.ResourceNotFoundException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * REST controller for inventory management.
 * Handles inventory tracking, reservations, and stock operations.
 */
@RestController
@RequestMapping("/api/v1/inventory")
@Tag(name = "Inventory", description = "Inventory management and tracking endpoints")
public class InventoryController {

    private final InventoryService inventoryService;

    public InventoryController(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    @GetMapping("/{productId}")
    @Operation(summary = "Get inventory", description = "Get inventory for a product")
    public Mono<ResponseEntity<Inventory>> getInventory(
        @Parameter(description = "Product ID") @PathVariable String productId
    ) {
        return inventoryService.getInventory(productId)
            .map(ResponseEntity::ok)
            .switchIfEmpty(Mono.error(
                new ResourceNotFoundException("Inventory not found for product: " + productId)
            ));
    }

    @GetMapping
    @Operation(summary = "Get all inventory", description = "Get all inventory for current tenant")
    public Flux<Inventory> getAllInventory() {
        return inventoryService.findAll();
    }

    @GetMapping("/low-stock")
    @Operation(summary = "Get low stock products", description = "Get products with low stock levels")
    public Flux<Inventory> getLowStockProducts() {
        return inventoryService.getLowStockProducts();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create inventory", description = "Create inventory for a product")
    public Mono<Inventory> createInventory(@Valid @RequestBody Inventory inventory) {
        return inventoryService.createOrUpdate(inventory);
    }

    @PutMapping("/{productId}")
    @Operation(summary = "Update inventory", description = "Update inventory for a product")
    public Mono<Inventory> updateInventory(
        @Parameter(description = "Product ID") @PathVariable String productId,
        @Valid @RequestBody Inventory inventory
    ) {
        inventory.setProductId(productId);
        return inventoryService.createOrUpdate(inventory);
    }

    @PostMapping("/{productId}/reserve")
    @Operation(summary = "Reserve inventory", description = "Reserve inventory for an order")
    public Mono<Inventory> reserveInventory(
        @Parameter(description = "Product ID") @PathVariable String productId,
        @Valid @RequestBody QuantityRequest request
    ) {
        return inventoryService.reserveInventory(productId, request.quantity);
    }

    @PostMapping("/{productId}/release")
    @Operation(summary = "Release reservation", description = "Release reserved inventory")
    public Mono<Inventory> releaseReservation(
        @Parameter(description = "Product ID") @PathVariable String productId,
        @Valid @RequestBody QuantityRequest request
    ) {
        return inventoryService.releaseReservation(productId, request.quantity);
    }

    @PostMapping("/{productId}/deduct")
    @Operation(summary = "Deduct inventory", description = "Deduct inventory after fulfillment")
    public Mono<Inventory> deductInventory(
        @Parameter(description = "Product ID") @PathVariable String productId,
        @Valid @RequestBody QuantityRequest request
    ) {
        return inventoryService.deductInventory(productId, request.quantity);
    }

    @PostMapping("/{productId}/restock")
    @Operation(summary = "Restock inventory", description = "Add stock to inventory")
    public Mono<Inventory> restock(
        @Parameter(description = "Product ID") @PathVariable String productId,
        @Valid @RequestBody QuantityRequest request
    ) {
        return inventoryService.restock(productId, request.quantity);
    }

    @GetMapping("/{productId}/availability")
    @Operation(summary = "Check availability", description = "Check if product has sufficient inventory")
    public Mono<AvailabilityResponse> checkAvailability(
        @Parameter(description = "Product ID") @PathVariable String productId,
        @Parameter(description = "Quantity to check") @RequestParam Integer quantity
    ) {
        return inventoryService.checkAvailability(productId, quantity)
            .map(available -> new AvailabilityResponse(available, quantity));
    }

    @DeleteMapping("/{productId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Delete inventory", description = "Delete inventory for a product")
    public Mono<Void> deleteInventory(
        @Parameter(description = "Product ID") @PathVariable String productId
    ) {
        return inventoryService.delete(productId);
    }

    @PostMapping("/{productId}/clear-cache")
    @Operation(summary = "Clear cache", description = "Clear inventory cache for a product")
    public Mono<ResponseEntity<Void>> clearCache(
        @Parameter(description = "Product ID") @PathVariable String productId
    ) {
        return inventoryService.clearCache(productId)
            .map(cleared -> cleared
                ? ResponseEntity.ok().<Void>build()
                : ResponseEntity.notFound().<Void>build()
            );
    }

    // DTOs
    public static class QuantityRequest {
        public Integer quantity;
    }

    public record AvailabilityResponse(boolean available, Integer requestedQuantity) {}
}
