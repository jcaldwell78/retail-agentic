package com.retail.domain.inventory;

import com.retail.infrastructure.persistence.InventoryRepository;
import com.retail.infrastructure.tenant.TenantContext;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.time.Instant;

/**
 * Service for inventory management operations.
 * Handles real-time inventory tracking, reservations, and stock management.
 */
@Service
public class InventoryService {

    private static final String INVENTORY_CACHE_PREFIX = "inventory:";
    private static final Duration CACHE_TTL = Duration.ofMinutes(5);

    private final InventoryRepository inventoryRepository;
    private final ReactiveRedisTemplate<String, Integer> redisTemplate;

    public InventoryService(
        InventoryRepository inventoryRepository,
        ReactiveRedisTemplate<String, Integer> redisTemplate
    ) {
        this.inventoryRepository = inventoryRepository;
        this.redisTemplate = redisTemplate;
    }

    /**
     * Get inventory for a product (with Redis caching)
     */
    public Mono<Inventory> getInventory(String productId) {
        return TenantContext.getTenantId()
            .flatMap(tenantId -> {
                String cacheKey = getCacheKey(tenantId, productId);

                // Try cache first
                return redisTemplate.opsForValue().get(cacheKey)
                    .flatMap(cachedQty -> {
                        // Hydrate full inventory from MongoDB
                        return inventoryRepository.findByProductIdAndTenantId(productId, tenantId);
                    })
                    .switchIfEmpty(
                        // Cache miss - load from MongoDB
                        inventoryRepository.findByProductIdAndTenantId(productId, tenantId)
                            .flatMap(inventory -> {
                                // Update cache
                                return redisTemplate.opsForValue()
                                    .set(cacheKey, inventory.getAvailableQuantity(), CACHE_TTL)
                                    .thenReturn(inventory);
                            })
                    );
            });
    }

    /**
     * Create or update inventory
     */
    public Mono<Inventory> createOrUpdate(Inventory inventory) {
        return TenantContext.getTenantId()
            .flatMap(tenantId -> {
                inventory.setTenantId(tenantId);
                inventory.setUpdatedAt(Instant.now());

                return inventoryRepository.save(inventory)
                    .flatMap(saved -> {
                        // Update cache
                        String cacheKey = getCacheKey(tenantId, saved.getProductId());
                        return redisTemplate.opsForValue()
                            .set(cacheKey, saved.getAvailableQuantity(), CACHE_TTL)
                            .thenReturn(saved);
                    });
            });
    }

    /**
     * Reserve inventory for an order
     */
    public Mono<Inventory> reserveInventory(String productId, Integer quantity) {
        if (quantity == null || quantity <= 0) {
            return Mono.error(new IllegalArgumentException("Quantity must be greater than 0"));
        }

        return TenantContext.getTenantId()
            .flatMap(tenantId ->
                inventoryRepository.findByProductIdAndTenantId(productId, tenantId)
                    .switchIfEmpty(Mono.error(
                        new IllegalArgumentException("Inventory not found for product: " + productId)
                    ))
                    .flatMap(inventory -> {
                        // Check if we can fulfill
                        if (!inventory.canFulfill(quantity)) {
                            if (inventory.isAllowBackorder()) {
                                // Allow backorder
                                inventory.reserve(quantity);
                            } else {
                                return Mono.error(new IllegalArgumentException(
                                    "Insufficient inventory. Available: " + inventory.getAvailableQuantity() +
                                    ", Requested: " + quantity
                                ));
                            }
                        } else {
                            inventory.reserve(quantity);
                        }

                        inventory.setUpdatedAt(Instant.now());

                        return inventoryRepository.save(inventory)
                            .flatMap(saved -> {
                                // Update cache
                                String cacheKey = getCacheKey(tenantId, productId);
                                return redisTemplate.opsForValue()
                                    .set(cacheKey, saved.getAvailableQuantity(), CACHE_TTL)
                                    .thenReturn(saved);
                            });
                    })
            );
    }

    /**
     * Release reserved inventory (e.g., order cancelled)
     */
    public Mono<Inventory> releaseReservation(String productId, Integer quantity) {
        if (quantity == null || quantity <= 0) {
            return Mono.error(new IllegalArgumentException("Quantity must be greater than 0"));
        }

        return TenantContext.getTenantId()
            .flatMap(tenantId ->
                inventoryRepository.findByProductIdAndTenantId(productId, tenantId)
                    .switchIfEmpty(Mono.error(
                        new IllegalArgumentException("Inventory not found for product: " + productId)
                    ))
                    .flatMap(inventory -> {
                        inventory.releaseReservation(quantity);
                        inventory.setUpdatedAt(Instant.now());

                        return inventoryRepository.save(inventory)
                            .flatMap(saved -> {
                                // Update cache
                                String cacheKey = getCacheKey(tenantId, productId);
                                return redisTemplate.opsForValue()
                                    .set(cacheKey, saved.getAvailableQuantity(), CACHE_TTL)
                                    .thenReturn(saved);
                            });
                    })
            );
    }

    /**
     * Deduct inventory (after order fulfillment)
     */
    public Mono<Inventory> deductInventory(String productId, Integer quantity) {
        if (quantity == null || quantity <= 0) {
            return Mono.error(new IllegalArgumentException("Quantity must be greater than 0"));
        }

        return TenantContext.getTenantId()
            .flatMap(tenantId ->
                inventoryRepository.findByProductIdAndTenantId(productId, tenantId)
                    .switchIfEmpty(Mono.error(
                        new IllegalArgumentException("Inventory not found for product: " + productId)
                    ))
                    .flatMap(inventory -> {
                        inventory.deduct(quantity);
                        inventory.setUpdatedAt(Instant.now());

                        return inventoryRepository.save(inventory)
                            .flatMap(saved -> {
                                // Update cache
                                String cacheKey = getCacheKey(tenantId, productId);
                                return redisTemplate.opsForValue()
                                    .set(cacheKey, saved.getAvailableQuantity(), CACHE_TTL)
                                    .thenReturn(saved);
                            });
                    })
            );
    }

    /**
     * Restock inventory
     */
    public Mono<Inventory> restock(String productId, Integer quantity) {
        if (quantity == null || quantity <= 0) {
            return Mono.error(new IllegalArgumentException("Quantity must be greater than 0"));
        }

        return TenantContext.getTenantId()
            .flatMap(tenantId ->
                inventoryRepository.findByProductIdAndTenantId(productId, tenantId)
                    .switchIfEmpty(Mono.error(
                        new IllegalArgumentException("Inventory not found for product: " + productId)
                    ))
                    .flatMap(inventory -> {
                        inventory.restock(quantity);
                        inventory.setLastRestockedAt(Instant.now());
                        inventory.setUpdatedAt(Instant.now());

                        return inventoryRepository.save(inventory)
                            .flatMap(saved -> {
                                // Update cache
                                String cacheKey = getCacheKey(tenantId, productId);
                                return redisTemplate.opsForValue()
                                    .set(cacheKey, saved.getAvailableQuantity(), CACHE_TTL)
                                    .thenReturn(saved);
                            });
                    })
            );
    }

    /**
     * Get low stock products
     */
    public Flux<Inventory> getLowStockProducts() {
        return TenantContext.getTenantId()
            .flatMapMany(inventoryRepository::findLowStockProducts);
    }

    /**
     * Check if product has sufficient inventory
     */
    public Mono<Boolean> checkAvailability(String productId, Integer quantity) {
        return getInventory(productId)
            .map(inventory -> inventory.canFulfill(quantity))
            .defaultIfEmpty(false);
    }

    /**
     * Get all inventory for tenant
     */
    public Flux<Inventory> findAll() {
        return TenantContext.getTenantId()
            .flatMapMany(inventoryRepository::findByTenantId);
    }

    /**
     * Delete inventory
     */
    public Mono<Void> delete(String productId) {
        return TenantContext.getTenantId()
            .flatMap(tenantId -> {
                String cacheKey = getCacheKey(tenantId, productId);
                return inventoryRepository.deleteByProductIdAndTenantId(productId, tenantId)
                    .then(redisTemplate.delete(cacheKey))
                    .then();
            });
    }

    /**
     * Clear cache for product inventory
     */
    public Mono<Boolean> clearCache(String productId) {
        return TenantContext.getTenantId()
            .flatMap(tenantId -> {
                String cacheKey = getCacheKey(tenantId, productId);
                return redisTemplate.delete(cacheKey)
                    .map(count -> count > 0);
            });
    }

    /**
     * Generate cache key
     */
    private String getCacheKey(String tenantId, String productId) {
        return INVENTORY_CACHE_PREFIX + tenantId + ":" + productId;
    }
}
