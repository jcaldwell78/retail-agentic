package com.retail.controller;

import com.retail.domain.order.Order;
import com.retail.domain.order.OrderService;
import com.retail.domain.order.OrderStatus;
import com.retail.domain.order.PaymentStatus;
import com.retail.domain.user.User;
import com.retail.exception.ResourceNotFoundException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * REST controller for order management.
 * Handles order creation, status updates, and order history.
 */
@RestController
@RequestMapping("/api/v1/orders")
@Tag(name = "Orders", description = "Order management and tracking endpoints")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create order from cart", description = "Create new order from shopping cart")
    public Mono<Order> createOrder(@Valid @RequestBody CreateOrderRequest request) {
        return orderService.createOrderFromCart(
            request.sessionId,
            request.customerEmail,
            request.customerName,
            new Order.Address(
                request.shippingAddress.line1,
                request.shippingAddress.line2,
                request.shippingAddress.city,
                request.shippingAddress.state,
                request.shippingAddress.postalCode,
                request.shippingAddress.country
            ),
            request.paymentMethodId
        );
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get order by ID", description = "Retrieve order details")
    public Mono<ResponseEntity<Order>> getOrderById(
        @Parameter(description = "Order ID") @PathVariable String id
    ) {
        return orderService.findById(id)
            .map(ResponseEntity::ok)
            .switchIfEmpty(Mono.error(new ResourceNotFoundException("Order", id)));
    }

    @GetMapping("/number/{orderNumber}")
    @Operation(summary = "Get order by order number", description = "Retrieve order by order number")
    public Mono<ResponseEntity<Order>> getOrderByNumber(
        @Parameter(description = "Order number") @PathVariable String orderNumber
    ) {
        return orderService.findByOrderNumber(orderNumber)
            .map(ResponseEntity::ok)
            .switchIfEmpty(Mono.error(
                new ResourceNotFoundException("Order with number '" + orderNumber + "' not found")
            ));
    }

    @GetMapping("/my-orders")
    @Operation(summary = "Get my orders", description = "Retrieve orders for the currently authenticated user")
    public Flux<Order> getMyOrders(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        return orderService.findByCustomerEmail(user.getEmail());
    }

    @GetMapping("/customer/{email}")
    @Operation(summary = "Get customer orders", description = "Retrieve all orders for customer email")
    public Flux<Order> getOrdersByCustomerEmail(
        @Parameter(description = "Customer email") @PathVariable String email
    ) {
        return orderService.findByCustomerEmail(email);
    }

    @GetMapping
    @Operation(summary = "Get all orders", description = "Retrieve all orders for current tenant")
    public Flux<Order> getAllOrders() {
        return orderService.findAll();
    }

    @GetMapping("/status/{status}")
    @Operation(summary = "Get orders by status", description = "Retrieve orders with specific status")
    public Flux<Order> getOrdersByStatus(
        @Parameter(description = "Order status") @PathVariable OrderStatus status
    ) {
        return orderService.findByStatus(status);
    }

    @PutMapping("/{id}/status")
    @Operation(summary = "Update order status", description = "Update order status")
    public Mono<Order> updateOrderStatus(
        @Parameter(description = "Order ID") @PathVariable String id,
        @Valid @RequestBody UpdateStatusRequest request
    ) {
        return orderService.updateStatus(id, request.status, request.note);
    }

    @PutMapping("/{id}/payment-status")
    @Operation(summary = "Update payment status", description = "Update order payment status")
    public Mono<Order> updatePaymentStatus(
        @Parameter(description = "Order ID") @PathVariable String id,
        @Valid @RequestBody UpdatePaymentStatusRequest request
    ) {
        return orderService.updatePaymentStatus(id, request.paymentStatus);
    }

    @PutMapping("/{id}/tracking")
    @Operation(summary = "Add tracking number", description = "Add shipping tracking number to order")
    public Mono<Order> addTrackingNumber(
        @Parameter(description = "Order ID") @PathVariable String id,
        @Valid @RequestBody AddTrackingRequest request
    ) {
        return orderService.addTrackingNumber(id, request.trackingNumber);
    }

    @PostMapping("/{id}/cancel")
    @Operation(summary = "Cancel order", description = "Cancel order with reason")
    public Mono<Order> cancelOrder(
        @Parameter(description = "Order ID") @PathVariable String id,
        @Valid @RequestBody CancelOrderRequest request
    ) {
        return orderService.cancelOrder(id, request.reason);
    }

    // DTOs
    public static class CreateOrderRequest {
        public String sessionId;
        public String customerEmail;
        public String customerName;
        public AddressDTO shippingAddress;
        public String paymentMethodId;
    }

    public static class AddressDTO {
        public String line1;
        public String line2;
        public String city;
        public String state;
        public String postalCode;
        public String country;
    }

    public static class UpdateStatusRequest {
        public OrderStatus status;
        public String note;
    }

    public static class UpdatePaymentStatusRequest {
        public PaymentStatus paymentStatus;
    }

    public static class AddTrackingRequest {
        public String trackingNumber;
    }

    public static class CancelOrderRequest {
        public String reason;
    }
}
