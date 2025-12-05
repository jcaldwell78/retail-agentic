package com.retail.domain.product;

import com.retail.domain.product.Product.ProductStatus;
import com.retail.domain.inventory.Inventory;
import com.retail.domain.inventory.InventoryService;
import com.retail.infrastructure.persistence.ProductRepository;
import com.retail.security.tenant.TenantContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * Service for tracking and managing product inventory relationships.
 * Integrates product catalog with inventory management.
 */
@Service
public class ProductInventoryService {

    private static final Logger logger = LoggerFactory.getLogger(ProductInventoryService.class);

    private final ProductRepository productRepository;
    private final InventoryService inventoryService;

    public ProductInventoryService(
            ProductRepository productRepository,
            InventoryService inventoryService) {
        this.productRepository = productRepository;
        this.inventoryService = inventoryService;
    }

    /**
     * Get product with its current inventory status.
     *
     * @param productId Product ID
     * @return Mono<ProductWithInventory> Product with inventory details
     */
    public Mono<ProductWithInventory> getProductWithInventory(String productId) {
        return TenantContext.getTenantId()
            .flatMap(tenantId ->
                Mono.zip(
                    productRepository.findByIdAndTenantId(productId, tenantId),
                    inventoryService.getInventory(productId)
                        .defaultIfEmpty(createDefaultInventory(productId))
                )
                .map(tuple -> new ProductWithInventory(
                    tuple.getT1(),
                    tuple.getT2(),
                    tuple.getT2().getAvailableQuantity(),
                    tuple.getT2().isLowStock(),
                    tuple.getT2().isOutOfStock()
                ))
            );
    }

    /**
     * Get all products with inventory status.
     * Useful for admin inventory management pages.
     *
     * @return Flux<ProductWithInventory> All products with inventory
     */
    public Flux<ProductWithInventory> getAllProductsWithInventory() {
        return TenantContext.getTenantId()
            .flatMapMany(tenantId ->
                productRepository.findByTenantId(tenantId, org.springframework.data.domain.Pageable.unpaged())
                    .flatMap(product ->
                        inventoryService.getInventory(product.getId())
                            .defaultIfEmpty(createDefaultInventory(product.getId()))
                            .map(inventory -> new ProductWithInventory(
                                product,
                                inventory,
                                inventory.getAvailableQuantity(),
                                inventory.isLowStock(),
                                inventory.isOutOfStock()
                            ))
                    )
            );
    }

    /**
     * Get products with low inventory.
     * Alerts for products needing restocking.
     *
     * @return Flux<ProductWithInventory> Low stock products
     */
    public Flux<ProductWithInventory> getLowStockProducts() {
        return getAllProductsWithInventory()
            .filter(ProductWithInventory::lowStock);
    }

    /**
     * Get products that are out of stock.
     *
     * @return Flux<ProductWithInventory> Out of stock products
     */
    public Mono<Long> getOutOfStockCount() {
        return getAllProductsWithInventory()
            .filter(ProductWithInventory::outOfStock)
            .count();
    }

    /**
     * Check if product can be sold (has available inventory).
     *
     * @param productId Product ID
     * @param quantity Requested quantity
     * @return Mono<Boolean> True if can be sold
     */
    public Mono<Boolean> canSellProduct(String productId, int quantity) {
        return inventoryService.getInventory(productId)
            .map(inventory -> inventory.canFulfill(quantity))
            .defaultIfEmpty(false);
    }

    /**
     * Update product stock when inventory changes.
     * Syncs product active status with inventory availability.
     *
     * @param productId Product ID
     * @return Mono<Product> Updated product
     */
    public Mono<Product> syncProductWithInventory(String productId) {
        return TenantContext.getTenantId()
            .flatMap(tenantId ->
                Mono.zip(
                    productRepository.findByIdAndTenantId(productId, tenantId),
                    inventoryService.getInventory(productId)
                        .defaultIfEmpty(createDefaultInventory(productId))
                )
                .flatMap(tuple -> {
                    Product product = tuple.getT1();
                    Inventory inventory = tuple.getT2();

                    // Auto-deactivate if out of stock and not allowing backorders
                    if (inventory.isOutOfStock() && !inventory.isAllowBackorder()) {
                        if (product.getStatus() == ProductStatus.ACTIVE) {
                            product.setStatus(ProductStatus.INACTIVE);
                            product.setUpdatedAt(java.time.Instant.now());
                            logger.info("Auto-deactivated product {} due to out of stock", productId);
                            return productRepository.save(product);
                        }
                    }

                    return Mono.just(product);
                })
            );
    }

    /**
     * Get inventory summary for all products.
     * Useful for dashboard metrics.
     *
     * @return Mono<InventorySummary> Summary statistics
     */
    public Mono<InventorySummary> getInventorySummary() {
        return getAllProductsWithInventory()
            .collectList()
            .map(products -> {
                long totalProducts = products.size();
                long inStock = products.stream()
                    .filter(p -> !p.outOfStock())
                    .count();
                long outOfStock = products.stream()
                    .filter(ProductWithInventory::outOfStock)
                    .count();
                long lowStock = products.stream()
                    .filter(ProductWithInventory::lowStock)
                    .count();
                int totalInventory = products.stream()
                    .mapToInt(ProductWithInventory::availableQuantity)
                    .sum();

                return new InventorySummary(
                    totalProducts,
                    inStock,
                    outOfStock,
                    lowStock,
                    totalInventory
                );
            });
    }

    /**
     * Create default inventory for product without inventory record
     */
    private Inventory createDefaultInventory(String productId) {
        Inventory inventory = new Inventory();
        inventory.setProductId(productId);
        inventory.setQuantity(0);
        inventory.setReservedQuantity(0);
        inventory.setTrackInventory(true);
        inventory.setAllowBackorder(false);
        return inventory;
    }

    /**
     * Product with inventory details
     */
    public record ProductWithInventory(
        Product product,
        Inventory inventory,
        int availableQuantity,
        boolean lowStock,
        boolean outOfStock
    ) {}

    /**
     * Inventory summary statistics
     */
    public record InventorySummary(
        long totalProducts,
        long inStock,
        long outOfStock,
        long lowStock,
        int totalInventory
    ) {}
}
