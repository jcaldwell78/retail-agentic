package com.retail.infrastructure.persistence;

import com.retail.domain.order.Order;
import com.retail.domain.order.OrderStatus;
import com.retail.domain.order.PaymentStatus;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.data.mongo.DataMongoTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;
import reactor.test.StepVerifier;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Integration tests for OrderRepository.
 * Tests tenant-aware order repository operations with MongoDB.
 */
@DataMongoTest
@ActiveProfiles("test")
class OrderRepositoryIntegrationTest {

    @Autowired
    private OrderRepository orderRepository;

    private static final String TEST_TENANT_ID = "test-tenant-001";

    private Order testOrder1;
    private Order testOrder2;
    private Order testOrder3;

    @BeforeEach
    void setupTestData() {
        // Create test orders for tenant 1
        testOrder1 = createOrder(
                "order-001",
                "ORD-2024-001",
                "customer@example.com",
                "John Doe",
                BigDecimal.valueOf(150.00),
                OrderStatus.PROCESSING,
                Instant.now().minus(5, ChronoUnit.DAYS)
        );

        testOrder2 = createOrder(
                "order-002",
                "ORD-2024-002",
                "customer@example.com",
                "John Doe",
                BigDecimal.valueOf(500.00),
                OrderStatus.SHIPPED,
                Instant.now().minus(2, ChronoUnit.DAYS)
        );

        testOrder3 = createOrder(
                "order-003",
                "ORD-2024-003",
                "another@example.com",
                "Jane Smith",
                BigDecimal.valueOf(75.00),
                OrderStatus.PENDING,
                Instant.now().minus(1, ChronoUnit.DAYS)
        );

        // Save all orders
        orderRepository.save(testOrder1)
                .then(orderRepository.save(testOrder2))
                .then(orderRepository.save(testOrder3))
                .block();
    }

    @AfterEach
    void cleanup() {
        orderRepository.deleteAll().block();
    }

    @Test
    void testSaveAndFindById() {
        Order newOrder = createOrder(
                "order-004",
                "ORD-2024-004",
                "test@example.com",
                "Test User",
                BigDecimal.valueOf(99.99),
                OrderStatus.PENDING,
                Instant.now()
        );

        StepVerifier.create(
                orderRepository.save(newOrder)
                        .flatMap(saved -> orderRepository.findByIdAndTenantId(
                                saved.getId(),
                                TEST_TENANT_ID
                        ))
        )
                .assertNext(found -> {
                    assertThat(found).isNotNull();
                    assertThat(found.getOrderNumber()).isEqualTo("ORD-2024-004");
                    assertThat(found.getTenantId()).isEqualTo(TEST_TENANT_ID);
                    assertThat(found.getCustomer().email()).isEqualTo("test@example.com");
                })
                .verifyComplete();
    }

    @Test
    void testFindByOrderNumber() {
        StepVerifier.create(
                orderRepository.findByOrderNumberAndTenantId("ORD-2024-001", TEST_TENANT_ID)
        )
                .assertNext(order -> {
                    assertThat(order).isNotNull();
                    assertThat(order.getOrderNumber()).isEqualTo("ORD-2024-001");
                    assertThat(order.getCustomer().name()).isEqualTo("John Doe");
                })
                .verifyComplete();
    }

    @Test
    void testFindByTenantId() {
        StepVerifier.create(
                orderRepository.findByTenantId(TEST_TENANT_ID, PageRequest.of(0, 10))
        )
                .expectNextCount(3)
                .verifyComplete();
    }

    @Test
    void testFindByCustomerEmail() {
        StepVerifier.create(
                orderRepository.findByTenantIdAndCustomerEmail(
                        TEST_TENANT_ID,
                        "customer@example.com",
                        PageRequest.of(0, 10)
                )
        )
                .expectNextCount(2)
                .verifyComplete();
    }

    @Test
    void testFindByStatus() {
        StepVerifier.create(
                orderRepository.findByTenantIdAndStatus(
                        TEST_TENANT_ID,
                        OrderStatus.SHIPPED.name(),
                        PageRequest.of(0, 10)
                )
        )
                .assertNext(order -> {
                    assertThat(order.getStatus()).isEqualTo(OrderStatus.SHIPPED);
                    assertThat(order.getOrderNumber()).isEqualTo("ORD-2024-002");
                })
                .verifyComplete();
    }

    @Test
    void testFindByDateRange() {
        Instant startDate = Instant.now().minus(3, ChronoUnit.DAYS);
        Instant endDate = Instant.now();

        StepVerifier.create(
                orderRepository.findByTenantIdAndCreatedAtBetween(
                        TEST_TENANT_ID,
                        startDate,
                        endDate,
                        PageRequest.of(0, 10)
                )
        )
                .expectNextCount(2) // order-002 and order-003
                .verifyComplete();
    }

    @Test
    void testFindHighValueOrders() {
        StepVerifier.create(
                orderRepository.findHighValueOrders(
                        TEST_TENANT_ID,
                        200.00,
                        PageRequest.of(0, 10)
                )
        )
                .assertNext(order -> {
                    assertThat(order.getPricing().total()).isGreaterThanOrEqualTo(BigDecimal.valueOf(200.00));
                    assertThat(order.getOrderNumber()).isEqualTo("ORD-2024-002");
                })
                .verifyComplete();
    }

    @Test
    void testCountByTenantId() {
        StepVerifier.create(
                orderRepository.countByTenantId(TEST_TENANT_ID)
        )
                .assertNext(count -> assertThat(count).isEqualTo(3))
                .verifyComplete();
    }

    @Test
    void testCountByStatus() {
        StepVerifier.create(
                orderRepository.countByTenantIdAndStatus(TEST_TENANT_ID, OrderStatus.PENDING.name())
        )
                .assertNext(count -> assertThat(count).isEqualTo(1))
                .verifyComplete();
    }

    @Test
    void testFindRecentOrders() {
        StepVerifier.create(
                orderRepository.findRecentOrders(TEST_TENANT_ID, PageRequest.of(0, 2))
        )
                .expectNextCount(2)
                .verifyComplete();
    }

    @Test
    void testTenantIsolation() {
        // Create order for different tenant
        String otherTenantId = "other-tenant-002";
        Order otherTenantOrder = createOrder(
                "other-order-001",
                "OTHER-ORD-001",
                "other@example.com",
                "Other Customer",
                BigDecimal.valueOf(99.99),
                OrderStatus.PENDING,
                Instant.now()
        );
        otherTenantOrder.setTenantId(otherTenantId);

        // Save order for other tenant
        orderRepository.save(otherTenantOrder).block();

        // Verify tenant 1 cannot see other tenant's order
        StepVerifier.create(
                orderRepository.findByOrderNumberAndTenantId("OTHER-ORD-001", TEST_TENANT_ID)
        )
                .verifyComplete();

        // Verify other tenant can see their order
        StepVerifier.create(
                orderRepository.findByOrderNumberAndTenantId("OTHER-ORD-001", otherTenantId)
        )
                .assertNext(order -> {
                    assertThat(order.getOrderNumber()).isEqualTo("OTHER-ORD-001");
                    assertThat(order.getTenantId()).isEqualTo(otherTenantId);
                })
                .verifyComplete();

        // Cleanup
        orderRepository.deleteByIdAndTenantId(otherTenantOrder.getId(), otherTenantId).block();
    }

    @Test
    void testUpdateOrderStatus() {
        StepVerifier.create(
                orderRepository.findByOrderNumberAndTenantId("ORD-2024-003", TEST_TENANT_ID)
                        .flatMap(order -> {
                            order.setStatus(OrderStatus.PROCESSING);
                            order.setUpdatedAt(Instant.now());
                            return orderRepository.save(order);
                        })
                        .flatMap(updated -> orderRepository.findById(updated.getId()))
        )
                .assertNext(order -> {
                    assertThat(order.getStatus()).isEqualTo(OrderStatus.PROCESSING);
                })
                .verifyComplete();
    }

    @Test
    void testDeleteOrder() {
        StepVerifier.create(
                orderRepository.findByOrderNumberAndTenantId("ORD-2024-001", TEST_TENANT_ID)
                        .flatMap(order -> orderRepository.deleteByIdAndTenantId(
                                order.getId(),
                                TEST_TENANT_ID
                        ))
                        .then(orderRepository.findByOrderNumberAndTenantId("ORD-2024-001", TEST_TENANT_ID))
        )
                .verifyComplete();
    }

    private Order createOrder(
            String id,
            String orderNumber,
            String email,
            String name,
            BigDecimal total,
            OrderStatus status,
            Instant createdAt
    ) {
        Order order = new Order();
        order.setId(id);
        order.setTenantId(TEST_TENANT_ID);
        order.setOrderNumber(orderNumber);

        order.setCustomer(new Order.Customer(email, name));

        order.setShippingAddress(new Order.Address(
                "123 Main St",
                "Apt 4",
                "Springfield",
                "IL",
                "62701",
                "US"
        ));

        BigDecimal subtotal = total.multiply(BigDecimal.valueOf(0.85));
        BigDecimal shipping = BigDecimal.valueOf(10.00);
        BigDecimal tax = total.subtract(subtotal).subtract(shipping);

        order.setItems(List.of(
                new Order.OrderItem(
                        "prod-001",
                        "Test Product",
                        "SKU-001",
                        BigDecimal.valueOf(50.00),
                        1,
                        null,
                        subtotal
                )
        ));

        order.setPricing(new Order.Pricing(subtotal, shipping, tax, total));

        order.setPayment(new Order.Payment(
                "CREDIT_CARD",
                PaymentStatus.PAID,
                "txn-" + orderNumber
        ));

        order.setStatus(status);
        order.setCreatedAt(createdAt);
        order.setUpdatedAt(createdAt);

        return order;
    }
}
