package com.retail.domain.order;

import com.retail.domain.notification.NotificationChannel;
import com.retail.domain.notification.NotificationService;
import com.retail.domain.notification.NotificationType;
import com.retail.infrastructure.persistence.OrderRepository;
import com.retail.security.tenant.TenantContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

/**
 * Service for order tracking functionality.
 * Handles tracking number management, carrier integration, delivery estimates,
 * and proactive delivery notifications.
 */
@Service
public class OrderTrackingService {

    private static final Logger logger = LoggerFactory.getLogger(OrderTrackingService.class);

    // Carrier tracking URL templates
    private static final Map<String, String> CARRIER_TRACKING_URLS = Map.of(
        "UPS", "https://www.ups.com/track?tracknum=%s",
        "FEDEX", "https://www.fedex.com/fedextrack/?trknbr=%s",
        "USPS", "https://tools.usps.com/go/TrackConfirmAction?tLabels=%s",
        "DHL", "https://www.dhl.com/en/express/tracking.html?AWB=%s"
    );

    // Default shipping durations by carrier
    private static final Map<String, Duration> DEFAULT_SHIPPING_DURATIONS = Map.of(
        "UPS", Duration.ofDays(5),
        "FEDEX", Duration.ofDays(4),
        "USPS", Duration.ofDays(7),
        "DHL", Duration.ofDays(6)
    );

    private final OrderRepository orderRepository;
    private final NotificationService notificationService;

    public OrderTrackingService(
            OrderRepository orderRepository,
            NotificationService notificationService) {
        this.orderRepository = orderRepository;
        this.notificationService = notificationService;
    }

    /**
     * Add tracking information to an order.
     * Generates tracking URL and estimates delivery date.
     *
     * @param orderId Order ID
     * @param carrier Carrier name (UPS, FEDEX, USPS, DHL)
     * @param trackingNumber Carrier tracking number
     * @return Updated order
     */
    public Mono<Order> addTrackingInfo(String orderId, String carrier, String trackingNumber) {
        return TenantContext.getTenantId()
            .flatMap(tenantId ->
                orderRepository.findById(orderId)
                    .flatMap(order -> {
                        if (!order.getTenantId().equals(tenantId)) {
                            return Mono.error(new IllegalArgumentException("Order not found"));
                        }

                        // Set tracking info
                        String normalizedCarrier = carrier.toUpperCase();
                        order.setCarrier(normalizedCarrier);
                        order.setTrackingNumber(trackingNumber);

                        // Generate tracking URL
                        String trackingUrl = generateTrackingUrl(normalizedCarrier, trackingNumber);
                        order.setTrackingUrl(trackingUrl);

                        // Estimate delivery date
                        Instant estimatedDelivery = estimateDeliveryDate(normalizedCarrier);
                        order.setEstimatedDeliveryDate(estimatedDelivery);

                        // Update status to shipped if not already
                        if (order.getStatus() != OrderStatus.SHIPPED &&
                            order.getStatus() != OrderStatus.DELIVERED) {
                            order.setStatus(OrderStatus.SHIPPED);
                            order.getStatusHistory().add(new Order.StatusHistoryEntry(
                                OrderStatus.SHIPPED,
                                Instant.now(),
                                "Order shipped via " + normalizedCarrier + " - Tracking: " + trackingNumber
                            ));
                        }

                        order.setUpdatedAt(Instant.now());

                        logger.info("Added tracking info to order {}: {} via {}",
                            orderId, trackingNumber, normalizedCarrier);

                        return orderRepository.save(order)
                            .flatMap(savedOrder ->
                                sendShippedNotification(savedOrder)
                                    .thenReturn(savedOrder)
                            );
                    })
            );
    }

    /**
     * Update estimated delivery date for an order.
     *
     * @param orderId Order ID
     * @param estimatedDeliveryDate New estimated delivery date
     * @return Updated order
     */
    public Mono<Order> updateEstimatedDelivery(String orderId, Instant estimatedDeliveryDate) {
        return TenantContext.getTenantId()
            .flatMap(tenantId ->
                orderRepository.findById(orderId)
                    .flatMap(order -> {
                        if (!order.getTenantId().equals(tenantId)) {
                            return Mono.error(new IllegalArgumentException("Order not found"));
                        }

                        order.setEstimatedDeliveryDate(estimatedDeliveryDate);
                        order.setUpdatedAt(Instant.now());

                        logger.info("Updated estimated delivery for order {} to {}",
                            orderId, estimatedDeliveryDate);

                        return orderRepository.save(order);
                    })
            );
    }

    /**
     * Mark an order as delivered.
     *
     * @param orderId Order ID
     * @return Updated order
     */
    public Mono<Order> markDelivered(String orderId) {
        return TenantContext.getTenantId()
            .flatMap(tenantId ->
                orderRepository.findById(orderId)
                    .flatMap(order -> {
                        if (!order.getTenantId().equals(tenantId)) {
                            return Mono.error(new IllegalArgumentException("Order not found"));
                        }

                        order.setStatus(OrderStatus.DELIVERED);
                        order.setActualDeliveryDate(Instant.now());
                        order.getStatusHistory().add(new Order.StatusHistoryEntry(
                            OrderStatus.DELIVERED,
                            Instant.now(),
                            "Order delivered"
                        ));
                        order.setUpdatedAt(Instant.now());

                        logger.info("Order {} marked as delivered", orderId);

                        return orderRepository.save(order)
                            .flatMap(savedOrder ->
                                sendDeliveredNotification(savedOrder)
                                    .thenReturn(savedOrder)
                            );
                    })
            );
    }

    /**
     * Get tracking information for an order.
     *
     * @param orderId Order ID
     * @return Order tracking details
     */
    public Mono<OrderTrackingInfo> getTrackingInfo(String orderId) {
        return TenantContext.getTenantId()
            .flatMap(tenantId ->
                orderRepository.findById(orderId)
                    .filter(order -> order.getTenantId().equals(tenantId))
                    .map(this::buildTrackingInfo)
            );
    }

    /**
     * Get tracking information by order number (public-facing).
     *
     * @param orderNumber Order number
     * @param email Customer email (for verification)
     * @return Order tracking details
     */
    public Mono<OrderTrackingInfo> getTrackingInfoByOrderNumber(String orderNumber, String email) {
        return TenantContext.getTenantId()
            .flatMap(tenantId ->
                orderRepository.findByOrderNumberAndTenantId(orderNumber, tenantId)
                    .filter(order -> order.getCustomer().email().equalsIgnoreCase(email))
                    .map(this::buildTrackingInfo)
            );
    }

    /**
     * Generate tracking URL for a carrier and tracking number.
     */
    private String generateTrackingUrl(String carrier, String trackingNumber) {
        String template = CARRIER_TRACKING_URLS.get(carrier);
        if (template != null) {
            return String.format(template, trackingNumber);
        }
        // Generic tracking URL if carrier not recognized
        return null;
    }

    /**
     * Estimate delivery date based on carrier.
     */
    private Instant estimateDeliveryDate(String carrier) {
        Duration duration = DEFAULT_SHIPPING_DURATIONS.getOrDefault(carrier, Duration.ofDays(7));
        return Instant.now().plus(duration);
    }

    /**
     * Build tracking info response from order.
     */
    private OrderTrackingInfo buildTrackingInfo(Order order) {
        return new OrderTrackingInfo(
            order.getOrderNumber(),
            order.getStatus(),
            order.getCarrier(),
            order.getTrackingNumber(),
            order.getTrackingUrl(),
            order.getEstimatedDeliveryDate(),
            order.getActualDeliveryDate(),
            order.getStatusHistory(),
            order.getCreatedAt(),
            order.getUpdatedAt()
        );
    }

    /**
     * Send notification when order is shipped.
     */
    private Mono<Void> sendShippedNotification(Order order) {
        Map<String, Object> templateData = new HashMap<>();
        templateData.put("orderNumber", order.getOrderNumber());
        templateData.put("carrier", order.getCarrier());
        templateData.put("trackingNumber", order.getTrackingNumber());
        templateData.put("trackingUrl", order.getTrackingUrl());
        templateData.put("estimatedDelivery", order.getEstimatedDeliveryDate() != null
            ? order.getEstimatedDeliveryDate().toString() : "Not available");

        return notificationService.createNotificationFromTemplate(
                null, // userId not available in Order
                order.getCustomer().email(),
                NotificationType.ORDER_SHIPPED,
                NotificationChannel.EMAIL,
                "order-shipped",
                templateData
            )
            .contextWrite(TenantContext.withTenantId(order.getTenantId()))
            .doOnSuccess(n -> logger.info("Shipped notification sent for order {}", order.getOrderNumber()))
            .then();
    }

    /**
     * Send notification when order is delivered.
     */
    private Mono<Void> sendDeliveredNotification(Order order) {
        Map<String, Object> templateData = new HashMap<>();
        templateData.put("orderNumber", order.getOrderNumber());
        templateData.put("deliveredAt", order.getActualDeliveryDate() != null
            ? order.getActualDeliveryDate().toString() : Instant.now().toString());

        return notificationService.createNotificationFromTemplate(
                null, // userId not available in Order
                order.getCustomer().email(),
                NotificationType.ORDER_DELIVERED,
                NotificationChannel.EMAIL,
                "order-delivered",
                templateData
            )
            .contextWrite(TenantContext.withTenantId(order.getTenantId()))
            .doOnSuccess(n -> logger.info("Delivered notification sent for order {}", order.getOrderNumber()))
            .then();
    }

    /**
     * Tracking information response record.
     */
    public record OrderTrackingInfo(
        String orderNumber,
        OrderStatus status,
        String carrier,
        String trackingNumber,
        String trackingUrl,
        Instant estimatedDeliveryDate,
        Instant actualDeliveryDate,
        java.util.List<Order.StatusHistoryEntry> statusHistory,
        Instant orderCreatedAt,
        Instant lastUpdatedAt
    ) {}
}
