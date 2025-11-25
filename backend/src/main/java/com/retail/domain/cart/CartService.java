package com.retail.domain.cart;

import com.retail.domain.product.Product;
import com.retail.infrastructure.persistence.CartRepository;
import com.retail.infrastructure.persistence.ProductRepository;
import com.retail.infrastructure.tenant.TenantContext;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Map;
import java.util.UUID;

/**
 * Service for shopping cart operations.
 * Handles cart lifecycle, item management, and pricing calculations.
 */
@Service
public class CartService {

    private final CartRepository cartRepository;
    private final ProductRepository productRepository;
    private final CartPersistenceService persistenceService;

    public CartService(
            CartRepository cartRepository,
            ProductRepository productRepository,
            CartPersistenceService persistenceService) {
        this.cartRepository = cartRepository;
        this.productRepository = productRepository;
        this.persistenceService = persistenceService;
    }

    /**
     * Get or create cart for session.
     * Attempts to load from Redis, then MongoDB if not found.
     */
    public Mono<Cart> getOrCreateCart(String sessionId) {
        return TenantContext.getTenantId()
            .flatMap(tenantId ->
                cartRepository.findBySessionIdAndTenantId(sessionId, tenantId)
                    .switchIfEmpty(
                        // Try to recover from MongoDB
                        persistenceService.recoverCartFromMongoDB(sessionId, tenantId)
                            .switchIfEmpty(createNewCart(sessionId, tenantId))
                    )
            );
    }

    /**
     * Create a new empty cart
     */
    private Mono<Cart> createNewCart(String sessionId, String tenantId) {
        Cart cart = new Cart();
        cart.setId(UUID.randomUUID().toString());
        cart.setTenantId(tenantId);
        cart.setSessionId(sessionId);
        cart.setItems(new ArrayList<>());
        cart.setSummary(new Cart.CartSummary(
            BigDecimal.ZERO,
            BigDecimal.ZERO,
            BigDecimal.ZERO,
            BigDecimal.ZERO
        ));
        cart.setItemCount(0);

        Instant now = Instant.now();
        cart.setCreatedAt(now);
        cart.setUpdatedAt(now);
        cart.setExpiresAt(now.plus(7, ChronoUnit.DAYS));

        return persistenceService.persistCart(cart);
    }

    /**
     * Add item to cart
     */
    public Mono<Cart> addItem(String sessionId, String productId, Integer quantity, Map<String, Object> attributes) {
        if (quantity == null || quantity <= 0) {
            return Mono.error(new IllegalArgumentException("Quantity must be greater than 0"));
        }

        return getOrCreateCart(sessionId)
            .flatMap(cart -> productRepository.findById(productId)
                .switchIfEmpty(Mono.error(new IllegalArgumentException("Product not found: " + productId)))
                .flatMap(product -> {
                    if (!product.isActive()) {
                        return Mono.error(new IllegalArgumentException("Product is not available"));
                    }

                    // Check if item already exists in cart
                    String itemId = generateItemId(productId, attributes);
                    boolean itemExists = cart.getItems().stream()
                        .anyMatch(item -> item.id().equals(itemId));

                    if (itemExists) {
                        // Update quantity of existing item
                        return updateItemQuantity(sessionId, itemId, quantity, true);
                    } else {
                        // Add new item
                        BigDecimal subtotal = product.getPrice().multiply(BigDecimal.valueOf(quantity));
                        Cart.CartItem newItem = new Cart.CartItem(
                            itemId,
                            product.getId(),
                            product.getName(),
                            product.getSku(),
                            product.getPrice(),
                            quantity,
                            attributes,
                            product.getImages().isEmpty() ? null : product.getImages().get(0),
                            subtotal
                        );

                        cart.getItems().add(newItem);
                        cart.setItemCount(cart.getItemCount() + quantity);
                        cart.setUpdatedAt(Instant.now());

                        // Recalculate summary
                        recalculateSummary(cart);

                        return persistenceService.persistCart(cart);
                    }
                })
            );
    }

    /**
     * Update item quantity in cart
     */
    public Mono<Cart> updateItemQuantity(String sessionId, String itemId, Integer quantity, boolean incremental) {
        if (quantity == null || quantity < 0) {
            return Mono.error(new IllegalArgumentException("Quantity cannot be negative"));
        }

        return getOrCreateCart(sessionId)
            .flatMap(cart -> {
                Cart.CartItem existingItem = cart.getItems().stream()
                    .filter(item -> item.id().equals(itemId))
                    .findFirst()
                    .orElseThrow(() -> new IllegalArgumentException("Item not found in cart"));

                // Calculate new quantity
                int newQuantity = incremental ? existingItem.quantity() + quantity : quantity;

                if (newQuantity <= 0) {
                    // Remove item if quantity is 0 or negative
                    return removeItem(sessionId, itemId);
                }

                // Update item with new quantity
                BigDecimal newSubtotal = existingItem.price().multiply(BigDecimal.valueOf(newQuantity));
                Cart.CartItem updatedItem = new Cart.CartItem(
                    existingItem.id(),
                    existingItem.productId(),
                    existingItem.name(),
                    existingItem.sku(),
                    existingItem.price(),
                    newQuantity,
                    existingItem.attributes(),
                    existingItem.imageUrl(),
                    newSubtotal
                );

                // Replace old item with updated one
                cart.getItems().removeIf(item -> item.id().equals(itemId));
                cart.getItems().add(updatedItem);

                // Recalculate item count
                int totalItems = cart.getItems().stream()
                    .mapToInt(Cart.CartItem::quantity)
                    .sum();
                cart.setItemCount(totalItems);
                cart.setUpdatedAt(Instant.now());

                // Recalculate summary
                recalculateSummary(cart);

                return persistenceService.persistCart(cart);
            });
    }

    /**
     * Remove item from cart
     */
    public Mono<Cart> removeItem(String sessionId, String itemId) {
        return getOrCreateCart(sessionId)
            .flatMap(cart -> {
                boolean removed = cart.getItems().removeIf(item -> item.id().equals(itemId));

                if (!removed) {
                    return Mono.error(new IllegalArgumentException("Item not found in cart"));
                }

                // Recalculate item count
                int totalItems = cart.getItems().stream()
                    .mapToInt(Cart.CartItem::quantity)
                    .sum();
                cart.setItemCount(totalItems);
                cart.setUpdatedAt(Instant.now());

                // Recalculate summary
                recalculateSummary(cart);

                return persistenceService.persistCart(cart);
            });
    }

    /**
     * Clear all items from cart
     */
    public Mono<Cart> clearCart(String sessionId) {
        return getOrCreateCart(sessionId)
            .flatMap(cart -> {
                cart.getItems().clear();
                cart.setItemCount(0);
                cart.setUpdatedAt(Instant.now());
                cart.setSummary(new Cart.CartSummary(
                    BigDecimal.ZERO,
                    BigDecimal.ZERO,
                    BigDecimal.ZERO,
                    BigDecimal.ZERO
                ));

                return persistenceService.persistCart(cart);
            });
    }

    /**
     * Delete cart
     */
    public Mono<Void> deleteCart(String sessionId) {
        return TenantContext.getTenantId()
            .flatMap(tenantId ->
                cartRepository.findBySessionIdAndTenantId(sessionId, tenantId)
                    .flatMap(cart -> cartRepository.deleteById(cart.getId()))
                    .then()
            );
    }

    /**
     * Get cart by session ID
     */
    public Mono<Cart> getCart(String sessionId) {
        return getOrCreateCart(sessionId);
    }

    /**
     * Extend cart TTL (refresh expiration)
     */
    public Mono<Cart> extendCartTtl(String sessionId) {
        return TenantContext.getTenantId()
            .flatMap(tenantId ->
                cartRepository.findBySessionIdAndTenantId(sessionId, tenantId)
                    .flatMap(cart -> {
                        cart.setExpiresAt(Instant.now().plus(7, ChronoUnit.DAYS));
                        cart.setUpdatedAt(Instant.now());
                        return persistenceService.persistCart(cart);
                    })
            );
    }

    /**
     * Recalculate cart summary (subtotal, tax, shipping, total)
     */
    private void recalculateSummary(Cart cart) {
        BigDecimal subtotal = cart.getItems().stream()
            .map(Cart.CartItem::subtotal)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Simple tax calculation (10%)
        BigDecimal tax = subtotal.multiply(BigDecimal.valueOf(0.10));

        // Simple shipping calculation (free over $50, otherwise $5)
        BigDecimal shipping = subtotal.compareTo(BigDecimal.valueOf(50)) >= 0
            ? BigDecimal.ZERO
            : BigDecimal.valueOf(5.00);

        BigDecimal total = subtotal.add(tax).add(shipping);

        cart.setSummary(new Cart.CartSummary(subtotal, tax, shipping, total));
    }

    /**
     * Generate unique item ID based on product and attributes
     */
    private String generateItemId(String productId, Map<String, Object> attributes) {
        if (attributes == null || attributes.isEmpty()) {
            return productId;
        }
        // Create deterministic ID based on product and attributes
        String attributesStr = attributes.toString();
        return productId + "-" + Integer.toHexString(attributesStr.hashCode());
    }
}
