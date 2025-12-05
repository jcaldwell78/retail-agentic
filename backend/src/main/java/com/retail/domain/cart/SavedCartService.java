package com.retail.domain.cart;

import com.retail.infrastructure.persistence.SavedCartRepository;
import com.retail.security.tenant.TenantContext;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Service for managing saved cart items (save for later).
 * Allows users to save items for future purchase.
 */
@Service
public class SavedCartService {

    private final SavedCartRepository savedCartRepository;
    private final CartService cartService;

    public SavedCartService(
            SavedCartRepository savedCartRepository,
            CartService cartService) {
        this.savedCartRepository = savedCartRepository;
        this.cartService = cartService;
    }

    /**
     * Get saved cart for user.
     * Creates new saved cart if it doesn't exist.
     *
     * @param userId User ID
     * @return Mono<SavedCart>
     */
    public Mono<SavedCart> getSavedCart(String userId) {
        return TenantContext.getTenantId()
            .flatMap(tenantId ->
                savedCartRepository.findByTenantIdAndUserId(tenantId, userId)
                    .switchIfEmpty(Mono.defer(() -> createSavedCart(tenantId, userId, null)))
            );
    }

    /**
     * Get saved cart by session ID (for guest users).
     *
     * @param sessionId Session ID
     * @return Mono<SavedCart>
     */
    public Mono<SavedCart> getSavedCartBySession(String sessionId) {
        return TenantContext.getTenantId()
            .flatMap(tenantId ->
                savedCartRepository.findByTenantIdAndSessionId(tenantId, sessionId)
                    .switchIfEmpty(Mono.defer(() -> createSavedCart(tenantId, null, sessionId)))
            );
    }

    /**
     * Create new saved cart.
     */
    private Mono<SavedCart> createSavedCart(String tenantId, String userId, String sessionId) {
        SavedCart savedCart = new SavedCart(tenantId, userId, sessionId);
        savedCart.setId(UUID.randomUUID().toString());
        return savedCartRepository.save(savedCart);
    }

    /**
     * Save item for later (move from cart to saved cart).
     *
     * @param sessionId Session ID
     * @param itemId Cart item ID
     * @param userId Optional user ID (null for guest users)
     * @return Mono<SavedCart>
     */
    public Mono<SavedCart> saveForLater(String sessionId, String itemId, String userId) {
        return cartService.getCart(sessionId)
            .flatMap(cart -> {
                // Find item in cart
                Cart.CartItem cartItem = cart.getItems().stream()
                    .filter(item -> item.id().equals(itemId))
                    .findFirst()
                    .orElseThrow(() -> new IllegalArgumentException("Item not found in cart"));

                // Get or create saved cart
                Mono<SavedCart> savedCartMono = userId != null
                    ? getSavedCart(userId)
                    : getSavedCartBySession(sessionId);

                return savedCartMono.flatMap(savedCart -> {
                    // Check if item already exists in saved cart
                    boolean itemExists = savedCart.getItems().stream()
                        .anyMatch(item -> item.getId().equals(itemId));

                    if (!itemExists) {
                        // Add to saved cart
                        SavedCart.SavedCartItem savedItem =
                            SavedCart.SavedCartItem.fromCartItem(cartItem);
                        savedCart.getItems().add(savedItem);
                        savedCart.setItemCount(savedCart.getItemCount() + cartItem.quantity());
                        savedCart.setUpdatedAt(Instant.now());
                    }

                    // Remove from active cart
                    return cartService.removeItem(sessionId, itemId)
                        .then(savedCartRepository.save(savedCart));
                });
            });
    }

    /**
     * Move item from saved cart back to active cart.
     *
     * @param sessionId Session ID
     * @param itemId Saved item ID
     * @param userId Optional user ID (null for guest users)
     * @return Mono<Cart>
     */
    public Mono<Cart> moveToCart(String sessionId, String itemId, String userId) {
        Mono<SavedCart> savedCartMono = userId != null
            ? getSavedCart(userId)
            : getSavedCartBySession(sessionId);

        return savedCartMono.flatMap(savedCart -> {
            // Find item in saved cart
            SavedCart.SavedCartItem savedItem = savedCart.getItems().stream()
                .filter(item -> item.getId().equals(itemId))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Item not found in saved cart"));

            // Add to active cart
            return cartService.addItem(
                sessionId,
                savedItem.getProductId(),
                savedItem.getQuantity(),
                savedItem.getAttributes()
            ).flatMap(cart -> {
                // Remove from saved cart
                savedCart.getItems().removeIf(item -> item.getId().equals(itemId));
                savedCart.setItemCount(savedCart.getItemCount() - savedItem.getQuantity());
                savedCart.setUpdatedAt(Instant.now());

                return savedCartRepository.save(savedCart)
                    .thenReturn(cart);
            });
        });
    }

    /**
     * Remove item from saved cart.
     *
     * @param itemId Saved item ID
     * @param userId Optional user ID (null for guest users)
     * @return Mono<SavedCart>
     */
    public Mono<SavedCart> removeFromSaved(String itemId, String userId, String sessionId) {
        Mono<SavedCart> savedCartMono = userId != null
            ? getSavedCart(userId)
            : getSavedCartBySession(sessionId);

        return savedCartMono.flatMap(savedCart -> {
            SavedCart.SavedCartItem removedItem = savedCart.getItems().stream()
                .filter(item -> item.getId().equals(itemId))
                .findFirst()
                .orElse(null);

            boolean removed = savedCart.getItems().removeIf(item -> item.getId().equals(itemId));

            if (!removed) {
                return Mono.error(new IllegalArgumentException("Item not found in saved cart"));
            }

            if (removedItem != null) {
                savedCart.setItemCount(savedCart.getItemCount() - removedItem.getQuantity());
            }
            savedCart.setUpdatedAt(Instant.now());

            return savedCartRepository.save(savedCart);
        });
    }

    /**
     * Move all saved items back to cart.
     *
     * @param sessionId Session ID
     * @param userId Optional user ID (null for guest users)
     * @return Mono<Cart>
     */
    public Mono<Cart> moveAllToCart(String sessionId, String userId) {
        Mono<SavedCart> savedCartMono = userId != null
            ? getSavedCart(userId)
            : getSavedCartBySession(sessionId);

        return savedCartMono.flatMap(savedCart -> {
            if (savedCart.getItems().isEmpty()) {
                return cartService.getCart(sessionId);
            }

            // Copy items list to avoid concurrent modification
            List<SavedCart.SavedCartItem> itemsToMove = new ArrayList<>(savedCart.getItems());

            // Add all items to cart sequentially
            Mono<Cart> cartMono = cartService.getCart(sessionId);

            for (SavedCart.SavedCartItem savedItem : itemsToMove) {
                cartMono = cartMono.flatMap(cart ->
                    cartService.addItem(
                        sessionId,
                        savedItem.getProductId(),
                        savedItem.getQuantity(),
                        savedItem.getAttributes()
                    )
                );
            }

            // Clear saved cart after moving all items
            return cartMono.flatMap(cart -> {
                savedCart.getItems().clear();
                savedCart.setItemCount(0);
                savedCart.setUpdatedAt(Instant.now());

                return savedCartRepository.save(savedCart)
                    .thenReturn(cart);
            });
        });
    }

    /**
     * Clear all saved items.
     *
     * @param userId Optional user ID (null for guest users)
     * @return Mono<SavedCart>
     */
    public Mono<SavedCart> clearSavedCart(String userId, String sessionId) {
        Mono<SavedCart> savedCartMono = userId != null
            ? getSavedCart(userId)
            : getSavedCartBySession(sessionId);

        return savedCartMono.flatMap(savedCart -> {
            savedCart.getItems().clear();
            savedCart.setItemCount(0);
            savedCart.setUpdatedAt(Instant.now());

            return savedCartRepository.save(savedCart);
        });
    }

    /**
     * Merge session saved cart into user saved cart (after login).
     *
     * @param sessionId Session ID
     * @param userId User ID
     * @return Mono<SavedCart>
     */
    public Mono<SavedCart> mergeSessionSavedCart(String sessionId, String userId) {
        return TenantContext.getTenantId()
            .flatMap(tenantId ->
                // Get both session and user saved carts
                Mono.zip(
                    savedCartRepository.findByTenantIdAndSessionId(tenantId, sessionId)
                        .defaultIfEmpty(new SavedCart()),
                    savedCartRepository.findByTenantIdAndUserId(tenantId, userId)
                        .switchIfEmpty(Mono.defer(() -> createSavedCart(tenantId, userId, null)))
                )
                .flatMap(tuple -> {
                    SavedCart sessionCart = tuple.getT1();
                    SavedCart userCart = tuple.getT2();

                    // Merge session items into user cart
                    for (SavedCart.SavedCartItem sessionItem : sessionCart.getItems()) {
                        boolean exists = userCart.getItems().stream()
                            .anyMatch(item -> item.getId().equals(sessionItem.getId()));

                        if (!exists) {
                            userCart.getItems().add(sessionItem);
                            userCart.setItemCount(userCart.getItemCount() + sessionItem.getQuantity());
                        }
                    }

                    userCart.setUpdatedAt(Instant.now());

                    // Delete session saved cart
                    return savedCartRepository.deleteByTenantIdAndSessionId(tenantId, sessionId)
                        .then(savedCartRepository.save(userCart));
                })
            );
    }
}
