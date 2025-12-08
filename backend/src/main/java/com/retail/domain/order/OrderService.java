package com.retail.domain.order;

import com.retail.domain.cart.Cart;
import com.retail.domain.cart.CartService;
import com.retail.domain.order.OrderStatus;
import com.retail.domain.order.PaymentStatus;
import com.retail.infrastructure.persistence.OrderRepository;
import com.retail.security.tenant.TenantContext;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

/**
 * Service for order management operations.
 * Handles order creation, status tracking, and order history.
 */
@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final CartService cartService;
    private final AtomicInteger orderCounter = new AtomicInteger(1000);

    public OrderService(OrderRepository orderRepository, CartService cartService) {
        this.orderRepository = orderRepository;
        this.cartService = cartService;
    }

    /**
     * Create order from cart
     */
    public Mono<Order> createOrderFromCart(
        String sessionId,
        String customerEmail,
        String customerName,
        Order.Address shippingAddress,
        String paymentMethodId
    ) {
        return cartService.getCart(sessionId)
            .flatMap(cart -> {
                if (cart.getItems().isEmpty()) {
                    return Mono.error(new IllegalArgumentException("Cannot create order from empty cart"));
                }

                return TenantContext.getTenantId()
                    .flatMap(tenantId -> {
                        Order order = new Order();
                        order.setTenantId(tenantId);
                        order.setOrderNumber(generateOrderNumber());

                        // Set customer info
                        order.setCustomer(new Order.Customer(customerEmail, customerName));
                        order.setShippingAddress(shippingAddress);

                        // Convert cart items to order items
                        List<Order.OrderItem> orderItems = cart.getItems().stream()
                            .map(cartItem -> new Order.OrderItem(
                                cartItem.productId(),
                                cartItem.name(),
                                cartItem.sku(),
                                cartItem.price(),
                                cartItem.quantity(),
                                cartItem.attributes(),
                                cartItem.subtotal()
                            ))
                            .collect(Collectors.toList());
                        order.setItems(orderItems);

                        // Set pricing from cart summary
                        Cart.CartSummary summary = cart.getSummary();
                        order.setPricing(new Order.Pricing(
                            summary.subtotal(),
                            summary.shipping(),
                            summary.tax(),
                            summary.total()
                        ));

                        // Set payment info
                        order.setPayment(new Order.Payment(
                            paymentMethodId,
                            PaymentStatus.PENDING,
                            null // Transaction ID will be set after payment processing
                        ));

                        // Set initial status
                        order.setStatus(OrderStatus.PENDING);
                        order.getStatusHistory().add(new Order.StatusHistoryEntry(
                            OrderStatus.PENDING,
                            Instant.now(),
                            "Order created"
                        ));

                        Instant now = Instant.now();
                        order.setCreatedAt(now);
                        order.setUpdatedAt(now);

                        return orderRepository.save(order)
                            .flatMap(savedOrder ->
                                // Clear the cart after successful order creation
                                cartService.deleteCart(sessionId)
                                    .thenReturn(savedOrder)
                            );
                    });
            });
    }

    /**
     * Update order status
     */
    public Mono<Order> updateStatus(String orderId, OrderStatus newStatus, String note) {
        return TenantContext.getTenantId()
            .flatMap(tenantId ->
                orderRepository.findById(orderId)
                    .flatMap(order -> {
                        if (!order.getTenantId().equals(tenantId)) {
                            return Mono.error(new IllegalArgumentException("Order not found"));
                        }

                        // Validate status transition
                        if (!isValidStatusTransition(order.getStatus(), newStatus)) {
                            return Mono.error(new IllegalArgumentException(
                                "Invalid status transition from " + order.getStatus() + " to " + newStatus
                            ));
                        }

                        order.setStatus(newStatus);
                        order.getStatusHistory().add(new Order.StatusHistoryEntry(
                            newStatus,
                            Instant.now(),
                            note != null ? note : "Status updated to " + newStatus
                        ));
                        order.setUpdatedAt(Instant.now());

                        return orderRepository.save(order);
                    })
            );
    }

    /**
     * Update payment status
     */
    public Mono<Order> updatePaymentStatus(String orderId, PaymentStatus paymentStatus) {
        return TenantContext.getTenantId()
            .flatMap(tenantId ->
                orderRepository.findById(orderId)
                    .flatMap(order -> {
                        if (!order.getTenantId().equals(tenantId)) {
                            return Mono.error(new IllegalArgumentException("Order not found"));
                        }

                        Order.Payment currentPayment = order.getPayment();
                        order.setPayment(new Order.Payment(
                            currentPayment.method(),
                            paymentStatus,
                            currentPayment.transactionId()
                        ));
                        order.setUpdatedAt(Instant.now());

                        // Auto-update order status based on payment
                        if (paymentStatus == PaymentStatus.PAID && order.getStatus() == OrderStatus.PENDING) {
                            order.setStatus(OrderStatus.PROCESSING);
                            order.getStatusHistory().add(new Order.StatusHistoryEntry(
                                OrderStatus.PROCESSING,
                                Instant.now(),
                                "Payment confirmed, order processing"
                            ));
                        }

                        return orderRepository.save(order);
                    })
            );
    }

    /**
     * Add tracking number to order
     */
    public Mono<Order> addTrackingNumber(String orderId, String trackingNumber) {
        return TenantContext.getTenantId()
            .flatMap(tenantId ->
                orderRepository.findById(orderId)
                    .flatMap(order -> {
                        if (!order.getTenantId().equals(tenantId)) {
                            return Mono.error(new IllegalArgumentException("Order not found"));
                        }

                        order.setTrackingNumber(trackingNumber);
                        order.setUpdatedAt(Instant.now());

                        // Auto-update to shipped if not already
                        if (order.getStatus() != OrderStatus.SHIPPED && order.getStatus() != OrderStatus.DELIVERED) {
                            order.setStatus(OrderStatus.SHIPPED);
                            order.getStatusHistory().add(new Order.StatusHistoryEntry(
                                OrderStatus.SHIPPED,
                                Instant.now(),
                                "Order shipped with tracking: " + trackingNumber
                            ));
                        }

                        return orderRepository.save(order);
                    })
            );
    }

    /**
     * Get order by ID
     */
    public Mono<Order> findById(String orderId) {
        return TenantContext.getTenantId()
            .flatMap(tenantId ->
                orderRepository.findById(orderId)
                    .filter(order -> order.getTenantId().equals(tenantId))
            );
    }

    /**
     * Get order by order number
     */
    public Mono<Order> findByOrderNumber(String orderNumber) {
        return TenantContext.getTenantId()
            .flatMap(tenantId ->
                orderRepository.findByOrderNumberAndTenantId(orderNumber, tenantId)
            );
    }

    /**
     * Get orders by customer email
     */
    public Flux<Order> findByCustomerEmail(String email) {
        return TenantContext.getTenantId()
            .flatMapMany(tenantId ->
                orderRepository.findByCustomerEmail(email, tenantId)
            );
    }

    /**
     * Get orders by status
     */
    public Flux<Order> findByStatus(OrderStatus status) {
        return TenantContext.getTenantId()
            .flatMapMany(tenantId ->
                orderRepository.findByStatusAndTenantId(status, tenantId)
            );
    }

    /**
     * Get all orders for tenant (paginated)
     */
    public Flux<Order> findAll() {
        return TenantContext.getTenantId()
            .flatMapMany(tenantId -> orderRepository.findByTenantId(tenantId, Pageable.unpaged()));
    }

    /**
     * Cancel order
     */
    public Mono<Order> cancelOrder(String orderId, String reason) {
        return updateStatus(orderId, OrderStatus.CANCELLED, "Order cancelled: " + reason);
    }

    /**
     * Check if a user has purchased a specific product.
     * Used for verified purchase badges in reviews.
     *
     * TODO: Implement actual purchase verification once User model is fully integrated with orders
     */
    public Mono<Boolean> hasUserPurchasedProduct(String userId, String productId) {
        // Placeholder implementation - always return false for now
        // In future: query orders for this user and check if they purchased this product
        return Mono.just(false);
    }

    /**
     * Generate unique order number
     */
    private String generateOrderNumber() {
        String date = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        int counter = orderCounter.getAndIncrement();
        return String.format("ORD-%s-%04d", date, counter);
    }

    /**
     * Validate status transitions
     */
    private boolean isValidStatusTransition(OrderStatus currentStatus, OrderStatus newStatus) {
        // Allow any transition to CANCELLED
        if (newStatus == OrderStatus.CANCELLED) {
            return true;
        }

        // Define valid transitions
        return switch (currentStatus) {
            case PENDING -> newStatus == OrderStatus.PROCESSING;
            case PROCESSING -> newStatus == OrderStatus.SHIPPED;
            case SHIPPED -> newStatus == OrderStatus.DELIVERED;
            case DELIVERED -> false; // Cannot transition from DELIVERED
            case CANCELLED -> false; // Cannot transition from CANCELLED
        };
    }
}
