package com.retail.domain.order;

import com.retail.domain.cart.Cart;
import com.retail.domain.cart.CartService;
import com.retail.infrastructure.persistence.OrderRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;
import reactor.util.context.Context;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * Unit tests for OrderService with mocked dependencies.
 */
@ExtendWith(MockitoExtension.class)
class OrderServiceUnitTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private CartService cartService;

    @InjectMocks
    private OrderService orderService;

    private static final String TEST_TENANT_ID = "test-tenant-001";
    private static final String SESSION_ID = "session-123";
    private static final String ORDER_ID = "order-123";
    private static final String CUSTOMER_EMAIL = "customer@example.com";
    private static final String CUSTOMER_NAME = "John Doe";

    private Order testOrder;
    private Cart testCart;

    @BeforeEach
    void setUp() {
        testOrder = createTestOrder(ORDER_ID, OrderStatus.PENDING);
        testCart = createTestCart();
    }

    @Test
    @DisplayName("createOrderFromCart - should create order successfully")
    void testCreateOrderFromCart() {
        // Given
        Order.Address shippingAddress = new Order.Address(
                "123 Main St", "Apt 4", "Springfield", "IL", "62701", "US"
        );

        when(cartService.getCart(SESSION_ID)).thenReturn(Mono.just(testCart));
        when(orderRepository.save(any(Order.class)))
                .thenAnswer(inv -> Mono.just(inv.getArgument(0)));
        when(cartService.deleteCart(SESSION_ID)).thenReturn(Mono.empty());

        // When
        Mono<Order> result = orderService.createOrderFromCart(
                SESSION_ID, CUSTOMER_EMAIL, CUSTOMER_NAME, shippingAddress, "CREDIT_CARD"
        ).contextWrite(Context.of("tenantId", TEST_TENANT_ID));

        // Then
        StepVerifier.create(result)
                .assertNext(order -> {
                    assertThat(order.getTenantId()).isEqualTo(TEST_TENANT_ID);
                    assertThat(order.getOrderNumber()).isNotNull();
                    assertThat(order.getCustomer().email()).isEqualTo(CUSTOMER_EMAIL);
                    assertThat(order.getCustomer().name()).isEqualTo(CUSTOMER_NAME);
                    assertThat(order.getStatus()).isEqualTo(OrderStatus.PENDING);
                    assertThat(order.getPayment().status()).isEqualTo(PaymentStatus.PENDING);
                    assertThat(order.getItems()).hasSize(2);
                })
                .verifyComplete();

        verify(cartService).getCart(SESSION_ID);
        verify(orderRepository).save(any(Order.class));
        verify(cartService).deleteCart(SESSION_ID);
    }

    @Test
    @DisplayName("createOrderFromCart - should fail with empty cart")
    void testCreateOrderFromCartEmpty() {
        // Given
        Cart emptyCart = new Cart();
        emptyCart.setSessionId(SESSION_ID);
        emptyCart.setItems(List.of());

        when(cartService.getCart(SESSION_ID)).thenReturn(Mono.just(emptyCart));

        // When
        Mono<Order> result = orderService.createOrderFromCart(
                SESSION_ID, CUSTOMER_EMAIL, CUSTOMER_NAME,
                new Order.Address("123 St", null, "City", "ST", "12345", "US"),
                "CREDIT_CARD"
        ).contextWrite(Context.of("tenantId", TEST_TENANT_ID));

        // Then
        StepVerifier.create(result)
                .expectErrorMatches(error ->
                        error instanceof IllegalArgumentException &&
                        error.getMessage().contains("empty cart")
                )
                .verify();

        verify(cartService).getCart(SESSION_ID);
        verify(orderRepository, never()).save(any());
    }

    @Test
    @DisplayName("updateStatus - should update order status successfully")
    void testUpdateStatus() {
        // Given
        Order existingOrder = createTestOrder(ORDER_ID, OrderStatus.PENDING);

        when(orderRepository.findById(ORDER_ID)).thenReturn(Mono.just(existingOrder));
        when(orderRepository.save(any(Order.class)))
                .thenAnswer(inv -> Mono.just(inv.getArgument(0)));

        // When
        Mono<Order> result = orderService.updateStatus(ORDER_ID, OrderStatus.PROCESSING, "Payment confirmed")
                .contextWrite(Context.of("tenantId", TEST_TENANT_ID));

        // Then
        StepVerifier.create(result)
                .assertNext(order -> {
                    assertThat(order.getStatus()).isEqualTo(OrderStatus.PROCESSING);
                    assertThat(order.getStatusHistory()).hasSize(2);
                    assertThat(order.getStatusHistory().get(1).status())
                            .isEqualTo(OrderStatus.PROCESSING);
                })
                .verifyComplete();

        verify(orderRepository).findById(ORDER_ID);
        verify(orderRepository).save(any(Order.class));
    }

    @Test
    @DisplayName("updateStatus - should fail on invalid status transition")
    void testUpdateStatusInvalid() {
        // Given
        Order existingOrder = createTestOrder(ORDER_ID, OrderStatus.DELIVERED);

        when(orderRepository.findById(ORDER_ID)).thenReturn(Mono.just(existingOrder));

        // When - try to transition from DELIVERED to SHIPPED (invalid)
        Mono<Order> result = orderService.updateStatus(ORDER_ID, OrderStatus.SHIPPED, "Invalid")
                .contextWrite(Context.of("tenantId", TEST_TENANT_ID));

        // Then
        StepVerifier.create(result)
                .expectErrorMatches(error ->
                        error instanceof IllegalArgumentException &&
                        error.getMessage().contains("Invalid status transition")
                )
                .verify();

        verify(orderRepository).findById(ORDER_ID);
        verify(orderRepository, never()).save(any());
    }

    @Test
    @DisplayName("updateStatus - should allow CANCELLED from any status")
    void testUpdateStatusCancelled() {
        // Given
        Order existingOrder = createTestOrder(ORDER_ID, OrderStatus.PROCESSING);

        when(orderRepository.findById(ORDER_ID)).thenReturn(Mono.just(existingOrder));
        when(orderRepository.save(any(Order.class)))
                .thenAnswer(inv -> Mono.just(inv.getArgument(0)));

        // When
        Mono<Order> result = orderService.updateStatus(ORDER_ID, OrderStatus.CANCELLED, "Customer request")
                .contextWrite(Context.of("tenantId", TEST_TENANT_ID));

        // Then
        StepVerifier.create(result)
                .assertNext(order -> {
                    assertThat(order.getStatus()).isEqualTo(OrderStatus.CANCELLED);
                })
                .verifyComplete();
    }

    @Test
    @DisplayName("updatePaymentStatus - should update payment status")
    void testUpdatePaymentStatus() {
        // Given
        Order existingOrder = createTestOrder(ORDER_ID, OrderStatus.PENDING);

        when(orderRepository.findById(ORDER_ID)).thenReturn(Mono.just(existingOrder));
        when(orderRepository.save(any(Order.class)))
                .thenAnswer(inv -> Mono.just(inv.getArgument(0)));

        // When
        Mono<Order> result = orderService.updatePaymentStatus(ORDER_ID, PaymentStatus.PAID)
                .contextWrite(Context.of("tenantId", TEST_TENANT_ID));

        // Then
        StepVerifier.create(result)
                .assertNext(order -> {
                    assertThat(order.getPayment().status()).isEqualTo(PaymentStatus.PAID);
                    assertThat(order.getStatus()).isEqualTo(OrderStatus.PROCESSING); // Auto-updated
                })
                .verifyComplete();
    }

    @Test
    @DisplayName("addTrackingNumber - should add tracking and update status")
    void testAddTrackingNumber() {
        // Given
        Order existingOrder = createTestOrder(ORDER_ID, OrderStatus.PROCESSING);
        String trackingNumber = "TRACK-123456";

        when(orderRepository.findById(ORDER_ID)).thenReturn(Mono.just(existingOrder));
        when(orderRepository.save(any(Order.class)))
                .thenAnswer(inv -> Mono.just(inv.getArgument(0)));

        // When
        Mono<Order> result = orderService.addTrackingNumber(ORDER_ID, trackingNumber)
                .contextWrite(Context.of("tenantId", TEST_TENANT_ID));

        // Then
        StepVerifier.create(result)
                .assertNext(order -> {
                    assertThat(order.getTrackingNumber()).isEqualTo(trackingNumber);
                    assertThat(order.getStatus()).isEqualTo(OrderStatus.SHIPPED); // Auto-updated
                })
                .verifyComplete();
    }

    @Test
    @DisplayName("findById - should return order when exists")
    void testFindById() {
        // Given
        when(orderRepository.findById(ORDER_ID)).thenReturn(Mono.just(testOrder));

        // When
        Mono<Order> result = orderService.findById(ORDER_ID)
                .contextWrite(Context.of("tenantId", TEST_TENANT_ID));

        // Then
        StepVerifier.create(result)
                .expectNext(testOrder)
                .verifyComplete();
    }

    @Test
    @DisplayName("findById - should filter out other tenant orders")
    void testFindByIdWrongTenant() {
        // Given
        Order otherTenantOrder = createTestOrder(ORDER_ID, OrderStatus.PENDING);
        otherTenantOrder.setTenantId("other-tenant");

        when(orderRepository.findById(ORDER_ID)).thenReturn(Mono.just(otherTenantOrder));

        // When
        Mono<Order> result = orderService.findById(ORDER_ID)
                .contextWrite(Context.of("tenantId", TEST_TENANT_ID));

        // Then
        StepVerifier.create(result)
                .verifyComplete(); // Empty because tenant doesn't match
    }

    @Test
    @DisplayName("findByOrderNumber - should return order")
    void testFindByOrderNumber() {
        // Given
        String orderNumber = "ORD-20240101-0001";
        when(orderRepository.findByOrderNumberAndTenantId(orderNumber, TEST_TENANT_ID))
                .thenReturn(Mono.just(testOrder));

        // When
        Mono<Order> result = orderService.findByOrderNumber(orderNumber)
                .contextWrite(Context.of("tenantId", TEST_TENANT_ID));

        // Then
        StepVerifier.create(result)
                .expectNext(testOrder)
                .verifyComplete();
    }

    @Test
    @DisplayName("findByCustomerEmail - should return customer orders")
    void testFindByCustomerEmail() {
        // Given
        Order order1 = createTestOrder("1", OrderStatus.DELIVERED);
        Order order2 = createTestOrder("2", OrderStatus.SHIPPED);

        when(orderRepository.findByCustomerEmail(CUSTOMER_EMAIL, TEST_TENANT_ID))
                .thenReturn(Flux.just(order1, order2));

        // When
        Flux<Order> result = orderService.findByCustomerEmail(CUSTOMER_EMAIL)
                .contextWrite(Context.of("tenantId", TEST_TENANT_ID));

        // Then
        StepVerifier.create(result)
                .expectNext(order1)
                .expectNext(order2)
                .verifyComplete();
    }

    @Test
    @DisplayName("findByStatus - should return orders with status")
    void testFindByStatus() {
        // Given
        Order order1 = createTestOrder("1", OrderStatus.PROCESSING);
        Order order2 = createTestOrder("2", OrderStatus.PROCESSING);

        when(orderRepository.findByStatusAndTenantId(OrderStatus.PROCESSING, TEST_TENANT_ID))
                .thenReturn(Flux.just(order1, order2));

        // When
        Flux<Order> result = orderService.findByStatus(OrderStatus.PROCESSING)
                .contextWrite(Context.of("tenantId", TEST_TENANT_ID));

        // Then
        StepVerifier.create(result)
                .expectNext(order1)
                .expectNext(order2)
                .verifyComplete();
    }

    @Test
    @DisplayName("cancelOrder - should cancel order with reason")
    void testCancelOrder() {
        // Given
        Order existingOrder = createTestOrder(ORDER_ID, OrderStatus.PENDING);

        when(orderRepository.findById(ORDER_ID)).thenReturn(Mono.just(existingOrder));
        when(orderRepository.save(any(Order.class)))
                .thenAnswer(inv -> Mono.just(inv.getArgument(0)));

        // When
        Mono<Order> result = orderService.cancelOrder(ORDER_ID, "Customer changed mind")
                .contextWrite(Context.of("tenantId", TEST_TENANT_ID));

        // Then
        StepVerifier.create(result)
                .assertNext(order -> {
                    assertThat(order.getStatus()).isEqualTo(OrderStatus.CANCELLED);
                    assertThat(order.getStatusHistory().get(1).note())
                            .contains("Customer changed mind");
                })
                .verifyComplete();
    }

    private Order createTestOrder(String id, OrderStatus status) {
        Order order = new Order();
        order.setId(id);
        order.setTenantId(TEST_TENANT_ID);
        order.setOrderNumber("ORD-20240101-0001");
        order.setCustomer(new Order.Customer(CUSTOMER_EMAIL, CUSTOMER_NAME));
        order.setShippingAddress(new Order.Address("123 St", null, "City", "ST", "12345", "US"));
        order.setItems(new ArrayList<>(List.of(
                new Order.OrderItem("prod1", "Product 1", "SKU-1",
                        BigDecimal.valueOf(50), 1, null, BigDecimal.valueOf(50))
        )));
        order.setPricing(new Order.Pricing(
                BigDecimal.valueOf(50),
                BigDecimal.valueOf(10),
                BigDecimal.valueOf(5),
                BigDecimal.valueOf(65)
        ));
        order.setPayment(new Order.Payment("CREDIT_CARD", PaymentStatus.PENDING, null));
        order.setStatus(status);
        order.setStatusHistory(new ArrayList<>(List.of(
                new Order.StatusHistoryEntry(status, Instant.now(), "Order created")
        )));
        order.setCreatedAt(Instant.now());
        order.setUpdatedAt(Instant.now());
        return order;
    }

    private Cart createTestCart() {
        Cart cart = new Cart();
        cart.setSessionId(SESSION_ID);
        cart.setTenantId(TEST_TENANT_ID);

        List<Cart.CartItem> items = List.of(
                new Cart.CartItem("item1", "prod1", "Product 1", "SKU-1",
                        BigDecimal.valueOf(50), 1, null, null, BigDecimal.valueOf(50)),
                new Cart.CartItem("item2", "prod2", "Product 2", "SKU-2",
                        BigDecimal.valueOf(30), 2, null, null, BigDecimal.valueOf(60))
        );
        cart.setItems(items);

        Cart.CartSummary summary = new Cart.CartSummary(
                BigDecimal.valueOf(110),
                BigDecimal.valueOf(10),
                BigDecimal.valueOf(12),
                BigDecimal.valueOf(132)
        );
        cart.setSummary(summary);

        return cart;
    }
}
