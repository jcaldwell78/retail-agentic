package com.retail.domain.inventory;

import com.retail.infrastructure.persistence.InventoryRepository;
import com.retail.security.tenant.TenantContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Service for reconciling inventory between Redis cache and MongoDB.
 *
 * This service ensures data consistency across the two-tier storage:
 * - **Redis**: Real-time inventory cache (fast lookups)
 * - **MongoDB**: Persistent inventory storage (source of truth)
 *
 * Key Features:
 * - Detect and fix cache inconsistencies
 * - Validate inventory integrity (reserved <= quantity)
 * - Audit inventory discrepancies for reporting
 * - Bulk reconciliation for all products
 * - Cleanup orphaned cache entries
 */
@Service
public class InventoryReconciliationService {

    private static final Logger logger = LoggerFactory.getLogger(InventoryReconciliationService.class);
    private static final String INVENTORY_CACHE_PREFIX = "inventory:";
    private static final Duration CACHE_TTL = Duration.ofMinutes(5);

    private final InventoryRepository inventoryRepository;
    private final ReactiveRedisTemplate<String, Integer> redisTemplate;

    public InventoryReconciliationService(
            InventoryRepository inventoryRepository,
            ReactiveRedisTemplate<String, Integer> redisTemplate) {
        this.inventoryRepository = inventoryRepository;
        this.redisTemplate = redisTemplate;
    }

    /**
     * Reconcile inventory for a single product.
     * Compares Redis cache with MongoDB and fixes discrepancies.
     *
     * @param productId Product ID
     * @return Mono<ReconciliationResult> Reconciliation outcome
     */
    public Mono<ReconciliationResult> reconcileProduct(String productId) {
        return TenantContext.getTenantId()
            .flatMap(tenantId -> {
                String cacheKey = getCacheKey(tenantId, productId);

                return Mono.zip(
                    // Get from MongoDB (source of truth)
                    inventoryRepository.findByProductIdAndTenantId(productId, tenantId),
                    // Get from Redis (cache)
                    redisTemplate.opsForValue().get(cacheKey).defaultIfEmpty(-1)
                ).flatMap(tuple -> {
                    Inventory mongoInventory = tuple.getT1();
                    Integer cachedQty = tuple.getT2();

                    int actualAvailable = mongoInventory.getAvailableQuantity();
                    boolean cacheMatch = cachedQty.equals(actualAvailable);

                    ReconciliationResult result = new ReconciliationResult(
                        productId,
                        actualAvailable,
                        cachedQty,
                        cacheMatch,
                        new ArrayList<>()
                    );

                    // Validate data integrity
                    List<String> issues = new ArrayList<>();

                    // Check if reserved quantity is valid
                    if (mongoInventory.getReservedQuantity() > mongoInventory.getQuantity()) {
                        issues.add("Reserved quantity (" + mongoInventory.getReservedQuantity() +
                                  ") exceeds total quantity (" + mongoInventory.getQuantity() + ")");
                    }

                    // Check if reserved quantity is negative
                    if (mongoInventory.getReservedQuantity() < 0) {
                        issues.add("Reserved quantity is negative: " + mongoInventory.getReservedQuantity());
                    }

                    result.issues().addAll(issues);

                    // Fix cache if needed
                    if (!cacheMatch) {
                        logger.warn("Cache mismatch for product {}: MongoDB={}, Cache={}. Fixing cache.",
                            productId, actualAvailable, cachedQty);

                        return redisTemplate.opsForValue()
                            .set(cacheKey, actualAvailable, CACHE_TTL)
                            .thenReturn(result);
                    }

                    return Mono.just(result);
                })
                .onErrorResume(error -> {
                    logger.error("Failed to reconcile product {}: {}", productId, error.getMessage());
                    ReconciliationResult errorResult = new ReconciliationResult(
                        productId,
                        0,
                        0,
                        false,
                        List.of("Error: " + error.getMessage())
                    );
                    return Mono.just(errorResult);
                });
            });
    }

    /**
     * Reconcile all inventory for a tenant.
     * Scans all inventory records and fixes cache inconsistencies.
     *
     * @return Flux<ReconciliationResult> Stream of reconciliation results
     */
    public Flux<ReconciliationResult> reconcileAllInventory() {
        return TenantContext.getTenantId()
            .flatMapMany(tenantId ->
                inventoryRepository.findByTenantId(tenantId)
                    .flatMap(inventory -> reconcileProduct(inventory.getProductId()))
            );
    }

    /**
     * Get reconciliation summary for all inventory.
     * Useful for admin dashboards and monitoring.
     *
     * @return Mono<ReconciliationSummary> Summary statistics
     */
    public Mono<ReconciliationSummary> getReconciliationSummary() {
        return reconcileAllInventory()
            .collectList()
            .map(results -> {
                long totalProducts = results.size();
                long cacheMatches = results.stream().filter(ReconciliationResult::cacheMatch).count();
                long cacheMismatches = totalProducts - cacheMatches;
                long productsWithIssues = results.stream()
                    .filter(r -> !r.issues().isEmpty())
                    .count();

                List<ReconciliationResult> problemProducts = results.stream()
                    .filter(r -> !r.cacheMatch() || !r.issues().isEmpty())
                    .toList();

                return new ReconciliationSummary(
                    totalProducts,
                    cacheMatches,
                    cacheMismatches,
                    productsWithIssues,
                    problemProducts,
                    Instant.now()
                );
            });
    }

    /**
     * Rebuild cache for all inventory.
     * Forces refresh of all Redis cache entries from MongoDB.
     *
     * @return Mono<Long> Number of cache entries rebuilt
     */
    public Mono<Long> rebuildAllCache() {
        return TenantContext.getTenantId()
            .flatMapMany(tenantId ->
                inventoryRepository.findByTenantId(tenantId)
                    .flatMap(inventory -> {
                        String cacheKey = getCacheKey(tenantId, inventory.getProductId());
                        return redisTemplate.opsForValue()
                            .set(cacheKey, inventory.getAvailableQuantity(), CACHE_TTL)
                            .thenReturn(1);
                    })
            )
            .reduce(0, Integer::sum)
            .map(Long::valueOf)
            .doOnSuccess(count -> logger.info("Rebuilt cache for {} inventory items", count));
    }

    /**
     * Clean up orphaned cache entries.
     * Removes Redis entries for products that no longer exist in MongoDB.
     *
     * @return Mono<Long> Number of orphaned entries removed
     */
    public Mono<Long> cleanupOrphanedCache() {
        return TenantContext.getTenantId()
            .flatMapMany(tenantId -> {
                String pattern = INVENTORY_CACHE_PREFIX + tenantId + ":*";

                // Get all cache keys for tenant
                return redisTemplate.keys(pattern)
                    .flatMap(cacheKey -> {
                        // Extract product ID from cache key
                        String productId = cacheKey.substring(cacheKey.lastIndexOf(':') + 1);

                        // Check if product exists in MongoDB
                        return inventoryRepository.findByProductIdAndTenantId(productId, tenantId)
                            .hasElement()
                            .flatMap(exists -> {
                                if (!exists) {
                                    // Orphaned cache entry - delete it
                                    logger.info("Removing orphaned cache entry: {}", cacheKey);
                                    return redisTemplate.delete(cacheKey).map(deleted -> 1L);
                                }
                                return Mono.just(0L);
                            });
                    });
            })
            .reduce(0L, Long::sum)
            .doOnSuccess(count -> logger.info("Cleaned up {} orphaned cache entries", count));
    }

    /**
     * Validate inventory integrity.
     * Checks for data issues like negative quantities, invalid reservations, etc.
     *
     * @return Flux<InventoryIssue> Stream of inventory issues found
     */
    public Flux<InventoryIssue> validateInventoryIntegrity() {
        return TenantContext.getTenantId()
            .flatMapMany(tenantId ->
                inventoryRepository.findByTenantId(tenantId)
                    .flatMap(inventory -> {
                        List<InventoryIssue> issues = new ArrayList<>();

                        // Check reserved > quantity
                        if (inventory.getReservedQuantity() > inventory.getQuantity()) {
                            issues.add(new InventoryIssue(
                                inventory.getProductId(),
                                "INVALID_RESERVATION",
                                String.format("Reserved (%d) exceeds total (%d)",
                                    inventory.getReservedQuantity(), inventory.getQuantity()),
                                Severity.CRITICAL
                            ));
                        }

                        // Check negative quantities
                        if (inventory.getQuantity() < 0) {
                            issues.add(new InventoryIssue(
                                inventory.getProductId(),
                                "NEGATIVE_QUANTITY",
                                "Total quantity is negative: " + inventory.getQuantity(),
                                Severity.CRITICAL
                            ));
                        }

                        if (inventory.getReservedQuantity() < 0) {
                            issues.add(new InventoryIssue(
                                inventory.getProductId(),
                                "NEGATIVE_RESERVED",
                                "Reserved quantity is negative: " + inventory.getReservedQuantity(),
                                Severity.CRITICAL
                            ));
                        }

                        // Check low stock warning
                        if (inventory.isLowStock()) {
                            issues.add(new InventoryIssue(
                                inventory.getProductId(),
                                "LOW_STOCK",
                                String.format("Available quantity (%d) below threshold (%d)",
                                    inventory.getAvailableQuantity(), inventory.getLowStockThreshold()),
                                Severity.WARNING
                            ));
                        }

                        // Check out of stock
                        if (inventory.isOutOfStock()) {
                            issues.add(new InventoryIssue(
                                inventory.getProductId(),
                                "OUT_OF_STOCK",
                                "Product is out of stock",
                                Severity.HIGH
                            ));
                        }

                        return Flux.fromIterable(issues);
                    })
            );
    }

    /**
     * Generate cache key for inventory
     */
    private String getCacheKey(String tenantId, String productId) {
        return INVENTORY_CACHE_PREFIX + tenantId + ":" + productId;
    }

    /**
     * Reconciliation result for a single product
     */
    public record ReconciliationResult(
        String productId,
        int mongoAvailable,
        int cacheAvailable,
        boolean cacheMatch,
        List<String> issues
    ) {}

    /**
     * Reconciliation summary for all inventory
     */
    public record ReconciliationSummary(
        long totalProducts,
        long cacheMatches,
        long cacheMismatches,
        long productsWithIssues,
        List<ReconciliationResult> problemProducts,
        Instant reconciledAt
    ) {}

    /**
     * Inventory integrity issue
     */
    public record InventoryIssue(
        String productId,
        String issueType,
        String description,
        Severity severity
    ) {}

    /**
     * Issue severity levels
     */
    public enum Severity {
        WARNING,  // Low priority, informational
        HIGH,     // Medium priority, should be addressed
        CRITICAL  // High priority, requires immediate attention
    }
}
