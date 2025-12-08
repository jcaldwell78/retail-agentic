package com.retail.domain.wishlist;

import com.retail.domain.product.Product;
import com.retail.domain.product.ProductService;
import com.retail.domain.user.User;
import com.retail.domain.user.UserService;
import com.retail.infrastructure.persistence.WishlistRepository;
import com.retail.security.tenant.TenantContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.util.List;

/**
 * Scheduled service for detecting price drops and stock availability changes.
 * Runs periodically to check wishlist items and send notifications when appropriate.
 */
@Service
public class PriceDropDetectionService {

    private static final Logger logger = LoggerFactory.getLogger(PriceDropDetectionService.class);
    private static final Duration MIN_NOTIFICATION_INTERVAL = Duration.ofHours(24);

    private final WishlistRepository wishlistRepository;
    private final ProductService productService;
    private final UserService userService;
    private final WishlistNotificationHandler notificationHandler;

    public PriceDropDetectionService(
            WishlistRepository wishlistRepository,
            ProductService productService,
            UserService userService,
            WishlistNotificationHandler notificationHandler) {
        this.wishlistRepository = wishlistRepository;
        this.productService = productService;
        this.userService = userService;
        this.notificationHandler = notificationHandler;
    }

    /**
     * Check for price drops across all wishlists.
     * Runs daily at 9 AM server time.
     */
    @Scheduled(cron = "0 0 9 * * *")
    public void checkPriceDrops() {
        logger.info("Starting scheduled price drop detection");

        TenantContext.getTenantId()
                .flatMapMany(tenantId ->
                        wishlistRepository.findWishlistsWithPriceAlertsEnabled(tenantId)
                )
                .flatMap(this::processPriceDropsForWishlist)
                .doOnComplete(() -> logger.info("Completed price drop detection"))
                .doOnError(error -> logger.error("Error during price drop detection", error))
                .subscribe();
    }

    /**
     * Check for stock availability across all wishlists.
     * Runs every 6 hours.
     */
    @Scheduled(fixedRate = 21600000) // 6 hours in milliseconds
    public void checkStockAvailability() {
        logger.info("Starting scheduled stock availability check");

        TenantContext.getTenantId()
                .flatMapMany(tenantId ->
                        wishlistRepository.findWishlistsWithStockAlertsEnabled(tenantId)
                )
                .flatMap(this::processStockAlertsForWishlist)
                .doOnComplete(() -> logger.info("Completed stock availability check"))
                .doOnError(error -> logger.error("Error during stock availability check", error))
                .subscribe();
    }

    /**
     * Process price drops for a single wishlist.
     *
     * @param wishlist The wishlist to process
     * @return Mono<Void> completing when processing is done
     */
    private Mono<Void> processPriceDropsForWishlist(Wishlist wishlist) {
        List<WishlistItem> itemsNeedingAlerts = wishlist.getItemsNeedingPriceAlerts();

        if (itemsNeedingAlerts.isEmpty()) {
            return Mono.empty();
        }

        return Flux.fromIterable(itemsNeedingAlerts)
                .flatMap(item -> checkAndUpdatePrice(wishlist, item))
                .filter(item -> item != null) // Filter out items where no notification was sent
                .collectList()
                .flatMap(notifiedItems -> {
                    if (!notifiedItems.isEmpty()) {
                        // Save updated wishlist with new prices and notification timestamps
                        return wishlistRepository.save(wishlist).then();
                    }
                    return Mono.empty();
                });
    }

    /**
     * Process stock alerts for a single wishlist.
     *
     * @param wishlist The wishlist to process
     * @return Mono<Void> completing when processing is done
     */
    private Mono<Void> processStockAlertsForWishlist(Wishlist wishlist) {
        return Flux.fromIterable(wishlist.getItemsNeedingStockAlerts())
                .flatMap(item -> checkAndNotifyStock(wishlist, item))
                .filter(item -> item != null)
                .collectList()
                .flatMap(notifiedItems -> {
                    if (!notifiedItems.isEmpty()) {
                        return wishlistRepository.save(wishlist).then();
                    }
                    return Mono.empty();
                });
    }

    /**
     * Check current price for an item and send notification if needed.
     *
     * @param wishlist The wishlist containing the item
     * @param item The wishlist item to check
     * @return Mono<WishlistItem> if notification was sent, empty otherwise
     */
    private Mono<WishlistItem> checkAndUpdatePrice(Wishlist wishlist, WishlistItem item) {
        // Skip if recently notified
        if (!shouldNotify(item)) {
            return Mono.empty();
        }

        return productService.findById(item.getProductId())
                .flatMap(product -> {
                    BigDecimal currentPrice = getCurrentPrice(product, item.getVariantId());

                    // Update current price
                    boolean priceChanged = item.updatePrice(currentPrice);

                    if (!priceChanged) {
                        return Mono.empty();
                    }

                    // Check if price drop meets threshold
                    if (!item.shouldSendPriceAlert()) {
                        return Mono.empty();
                    }

                    // Get user email and send notification
                    return userService.findById(wishlist.getUserId())
                            .flatMap(user ->
                                    notificationHandler.sendPriceDropAlert(
                                            user.getId(),
                                            user.getEmail(),
                                            item
                                    )
                            )
                            .doOnSuccess(notification -> {
                                item.setLastNotifiedAt(Instant.now());
                                logger.info("Sent price drop alert for product {} to user {}",
                                        item.getProductId(), wishlist.getUserId());
                            })
                            .thenReturn(item);
                })
                .onErrorResume(error -> {
                    logger.error("Error checking price for product {}: {}",
                            item.getProductId(), error.getMessage());
                    return Mono.empty();
                });
    }

    /**
     * Check stock status and send notification if needed.
     *
     * @param wishlist The wishlist containing the item
     * @param item The wishlist item to check
     * @return Mono<WishlistItem> if notification was sent, empty otherwise
     */
    private Mono<WishlistItem> checkAndNotifyStock(Wishlist wishlist, WishlistItem item) {
        // Skip if recently notified
        if (!shouldNotify(item)) {
            return Mono.empty();
        }

        return productService.findById(item.getProductId())
                .flatMap(product -> {
                    boolean inStock = isInStock(product, item.getVariantId());

                    // Only notify if stock status changed to in-stock
                    if (!inStock || item.getInStock()) {
                        return Mono.empty();
                    }

                    item.setInStock(true);

                    // Get user email and send notification
                    return userService.findById(wishlist.getUserId())
                            .flatMap(user ->
                                    notificationHandler.sendStockAlert(
                                            user.getId(),
                                            user.getEmail(),
                                            item
                                    )
                            )
                            .doOnSuccess(notification -> {
                                item.setLastNotifiedAt(Instant.now());
                                logger.info("Sent stock alert for product {} to user {}",
                                        item.getProductId(), wishlist.getUserId());
                            })
                            .thenReturn(item);
                })
                .onErrorResume(error -> {
                    logger.error("Error checking stock for product {}: {}",
                            item.getProductId(), error.getMessage());
                    return Mono.empty();
                });
    }

    /**
     * Check if notification should be sent based on last notification time.
     *
     * @param item The wishlist item
     * @return true if notification should be sent
     */
    private boolean shouldNotify(WishlistItem item) {
        if (item.getLastNotifiedAt() == null) {
            return true;
        }

        Instant nextAllowedNotification = item.getLastNotifiedAt().plus(MIN_NOTIFICATION_INTERVAL);
        return Instant.now().isAfter(nextAllowedNotification);
    }

    /**
     * Get current price for a product/variant.
     * Note: Variant support is not yet implemented in Product model.
     * This method currently returns the product price for all cases.
     *
     * @param product The product
     * @param variantId Optional variant ID (currently not used)
     * @return Current price
     */
    private BigDecimal getCurrentPrice(Product product, String variantId) {
        // TODO: Add variant support when Product model supports variants
        return product.getPrice();
    }

    /**
     * Check if a product/variant is in stock.
     * Note: Variant support is not yet implemented in Product model.
     * This method currently checks product stock for all cases.
     *
     * @param product The product
     * @param variantId Optional variant ID (currently not used)
     * @return true if in stock
     */
    private boolean isInStock(Product product, String variantId) {
        // TODO: Add variant support when Product model supports variants
        return product.getStock() != null && product.getStock() > 0;
    }
}
