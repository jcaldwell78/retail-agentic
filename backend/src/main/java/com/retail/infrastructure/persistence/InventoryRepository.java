package com.retail.infrastructure.persistence;

import com.retail.domain.inventory.Inventory;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.data.mongodb.repository.ReactiveMongoRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * Repository for Inventory entities with tenant filtering.
 * Supports real-time inventory tracking with Redis caching integration.
 */
@Repository
public interface InventoryRepository extends ReactiveMongoRepository<Inventory, String> {

    /**
     * Find inventory by product ID and tenant
     */
    Mono<Inventory> findByProductIdAndTenantId(String productId, String tenantId);

    /**
     * Find inventory by ID and tenant
     */
    Mono<Inventory> findByIdAndTenantId(String id, String tenantId);

    /**
     * Find all inventory for tenant with pagination
     */
    Flux<Inventory> findByTenantId(String tenantId, Pageable pageable);

    /**
     * Find low stock items for tenant
     */
    @Query("{ 'tenantId': ?0, 'trackInventory': true, " +
           "$expr: { $lte: [{ $subtract: ['$quantity', '$reservedQuantity'] }, '$lowStockThreshold'] } }")
    Flux<Inventory> findLowStockItems(String tenantId);

    /**
     * Find out of stock items for tenant
     */
    @Query("{ 'tenantId': ?0, 'trackInventory': true, " +
           "$expr: { $lte: [{ $subtract: ['$quantity', '$reservedQuantity'] }, 0] } }")
    Flux<Inventory> findOutOfStockItems(String tenantId);

    /**
     * Find inventory by warehouse location and tenant
     */
    Flux<Inventory> findByTenantIdAndWarehouseLocation(
        String tenantId,
        String warehouseLocation,
        Pageable pageable
    );

    /**
     * Check if product exists in inventory for tenant
     */
    Mono<Boolean> existsByProductIdAndTenantId(String productId, String tenantId);

    /**
     * Count inventory items for tenant
     */
    Mono<Long> countByTenantId(String tenantId);

    /**
     * Count low stock items for tenant
     */
    @Query(value = "{ 'tenantId': ?0, 'trackInventory': true, " +
           "$expr: { $lte: [{ $subtract: ['$quantity', '$reservedQuantity'] }, '$lowStockThreshold'] } }",
           count = true)
    Mono<Long> countLowStockItems(String tenantId);

    /**
     * Count out of stock items for tenant
     */
    @Query(value = "{ 'tenantId': ?0, 'trackInventory': true, " +
           "$expr: { $lte: [{ $subtract: ['$quantity', '$reservedQuantity'] }, 0] } }",
           count = true)
    Mono<Long> countOutOfStockItems(String tenantId);

    /**
     * Delete inventory by ID and tenant (ensures tenant isolation)
     */
    Mono<Void> deleteByIdAndTenantId(String id, String tenantId);

    /**
     * Delete inventory by product ID and tenant
     */
    Mono<Void> deleteByProductIdAndTenantId(String productId, String tenantId);
}
