package com.retail.domain.wishlist;

import com.retail.domain.notification.Notification;
import com.retail.domain.notification.NotificationChannel;
import com.retail.domain.notification.NotificationService;
import com.retail.domain.notification.NotificationType;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

/**
 * Handler for wishlist-related notifications.
 * Sends notifications for price drops and stock alerts.
 */
@Component
public class WishlistNotificationHandler {

    private final NotificationService notificationService;

    public WishlistNotificationHandler(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    /**
     * Send price drop notification for a wishlist item.
     *
     * @param userId User ID
     * @param userEmail User email
     * @param item Wishlist item with price drop
     * @return Mono<Notification>
     */
    public Mono<Notification> sendPriceDropAlert(
            String userId,
            String userEmail,
            WishlistItem item) {

        Map<String, Object> templateData = new HashMap<>();
        templateData.put("productName", item.getName());
        templateData.put("productId", item.getProductId());
        templateData.put("originalPrice", item.getPriceWhenAdded().toString());
        templateData.put("currentPrice", item.getCurrentPrice().toString());
        templateData.put("priceDrop", item.calculatePriceDrop());
        templateData.put("imageUrl", item.getImageUrl());

        // Calculate savings
        BigDecimal savings = item.getPriceWhenAdded().subtract(item.getCurrentPrice());
        templateData.put("savings", savings.toString());

        return notificationService.createNotificationFromTemplate(
            userId,
            userEmail,
            NotificationType.PRICE_DROP,
            NotificationChannel.EMAIL,
            "price-drop-alert",
            templateData
        );
    }

    /**
     * Send stock availability alert for a wishlist item.
     *
     * @param userId User ID
     * @param userEmail User email
     * @param item Wishlist item that's back in stock
     * @return Mono<Notification>
     */
    public Mono<Notification> sendStockAlert(
            String userId,
            String userEmail,
            WishlistItem item) {

        Map<String, Object> templateData = new HashMap<>();
        templateData.put("productName", item.getName());
        templateData.put("productId", item.getProductId());
        templateData.put("currentPrice", item.getCurrentPrice().toString());
        templateData.put("imageUrl", item.getImageUrl());
        templateData.put("onSale", item.getOnSale());

        if (item.getOnSale() != null && item.getOnSale() && item.getSalePercentage() != null) {
            templateData.put("salePercentage", item.getSalePercentage());
        }

        return notificationService.createNotificationFromTemplate(
            userId,
            userEmail,
            NotificationType.STOCK_ALERT,
            NotificationChannel.EMAIL,
            "stock-alert",
            templateData
        );
    }

    /**
     * Send bulk price drop alerts for multiple items in a wishlist.
     *
     * @param userId User ID
     * @param userEmail User email
     * @param items List of wishlist items with price drops
     * @return Mono<Notification>
     */
    public Mono<Notification> sendBulkPriceDropAlert(
            String userId,
            String userEmail,
            java.util.List<WishlistItem> items) {

        if (items.isEmpty()) {
            return Mono.empty();
        }

        Map<String, Object> templateData = new HashMap<>();
        templateData.put("items", items);
        templateData.put("itemCount", items.size());

        // Calculate total savings
        BigDecimal totalSavings = items.stream()
                .map(item -> item.getPriceWhenAdded().subtract(item.getCurrentPrice()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        templateData.put("totalSavings", totalSavings.toString());

        return notificationService.createNotificationFromTemplate(
            userId,
            userEmail,
            NotificationType.PRICE_DROP,
            NotificationChannel.EMAIL,
            "bulk-price-drop-alert",
            templateData
        );
    }

    /**
     * Send bulk stock alerts for multiple items.
     *
     * @param userId User ID
     * @param userEmail User email
     * @param items List of wishlist items back in stock
     * @return Mono<Notification>
     */
    public Mono<Notification> sendBulkStockAlert(
            String userId,
            String userEmail,
            java.util.List<WishlistItem> items) {

        if (items.isEmpty()) {
            return Mono.empty();
        }

        Map<String, Object> templateData = new HashMap<>();
        templateData.put("items", items);
        templateData.put("itemCount", items.size());

        return notificationService.createNotificationFromTemplate(
            userId,
            userEmail,
            NotificationType.STOCK_ALERT,
            NotificationChannel.EMAIL,
            "bulk-stock-alert",
            templateData
        );
    }
}
