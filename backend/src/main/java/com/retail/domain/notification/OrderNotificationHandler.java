package com.retail.domain.notification;

import com.retail.domain.order.Order;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.Map;

/**
 * Handler for order-related notifications.
 * Sends notifications for order events.
 */
@Component
public class OrderNotificationHandler {

    private final NotificationService notificationService;

    public OrderNotificationHandler(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    /**
     * Send order confirmation notification.
     *
     * @param order Order
     * @param userEmail User email
     * @return Mono<Notification>
     */
    public Mono<Notification> sendOrderConfirmation(Order order, String userEmail) {
        Map<String, Object> templateData = new HashMap<>();
        templateData.put("orderNumber", order.getOrderNumber());
        templateData.put("orderTotal", order.getPricing().total().toString());
        templateData.put("orderItems", order.getItems());
        templateData.put("customerName", order.getCustomer().name());
        templateData.put("shippingAddress", order.getShippingAddress());

        return notificationService.createNotificationFromTemplate(
            order.getCustomer().email(),
            userEmail,
            NotificationType.ORDER_CONFIRMATION,
            NotificationChannel.EMAIL,
            "order-confirmation",
            templateData
        );
    }

    /**
     * Send order shipped notification.
     *
     * @param order Order
     * @param userEmail User email
     * @param trackingNumber Tracking number
     * @param carrier Shipping carrier
     * @return Mono<Notification>
     */
    public Mono<Notification> sendOrderShipped(
            Order order,
            String userEmail,
            String trackingNumber,
            String carrier) {

        Map<String, Object> templateData = new HashMap<>();
        templateData.put("orderNumber", order.getOrderNumber());
        templateData.put("trackingNumber", trackingNumber);
        templateData.put("carrier", carrier);
        templateData.put("customerName", order.getCustomer().name());

        return notificationService.createNotificationFromTemplate(
            order.getCustomer().email(),
            userEmail,
            NotificationType.ORDER_SHIPPED,
            NotificationChannel.EMAIL,
            "order-shipped",
            templateData
        );
    }

    /**
     * Send order delivered notification.
     *
     * @param order Order
     * @param userEmail User email
     * @return Mono<Notification>
     */
    public Mono<Notification> sendOrderDelivered(Order order, String userEmail) {
        Map<String, Object> templateData = new HashMap<>();
        templateData.put("orderNumber", order.getOrderNumber());
        templateData.put("customerName", order.getCustomer().name());

        return notificationService.createNotificationFromTemplate(
            order.getCustomer().email(),
            userEmail,
            NotificationType.ORDER_DELIVERED,
            NotificationChannel.EMAIL,
            "order-delivered",
            templateData
        );
    }

    /**
     * Send order cancelled notification.
     *
     * @param order Order
     * @param userEmail User email
     * @param reason Cancellation reason
     * @return Mono<Notification>
     */
    public Mono<Notification> sendOrderCancelled(
            Order order,
            String userEmail,
            String reason) {

        Map<String, Object> templateData = new HashMap<>();
        templateData.put("orderNumber", order.getOrderNumber());
        templateData.put("orderTotal", order.getPricing().total().toString());
        templateData.put("customerName", order.getCustomer().name());
        templateData.put("reason", reason);

        return notificationService.createNotificationFromTemplate(
            order.getCustomer().email(),
            userEmail,
            NotificationType.ORDER_CANCELLED,
            NotificationChannel.EMAIL,
            "order-cancelled",
            templateData
        );
    }

    /**
     * Send order refunded notification.
     *
     * @param order Order
     * @param userEmail User email
     * @param refundAmount Refund amount
     * @return Mono<Notification>
     */
    public Mono<Notification> sendOrderRefunded(
            Order order,
            String userEmail,
            String refundAmount) {

        Map<String, Object> templateData = new HashMap<>();
        templateData.put("orderNumber", order.getOrderNumber());
        templateData.put("refundAmount", refundAmount);
        templateData.put("customerName", order.getCustomer().name());

        return notificationService.createNotificationFromTemplate(
            order.getCustomer().email(),
            userEmail,
            NotificationType.ORDER_REFUNDED,
            NotificationChannel.EMAIL,
            "order-refunded",
            templateData
        );
    }
}
