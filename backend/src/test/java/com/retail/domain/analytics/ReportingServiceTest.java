package com.retail.domain.analytics;

import com.retail.domain.order.Order;
import com.retail.infrastructure.persistence.OrderRepository;
import com.retail.security.tenant.TenantContext;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.query.Query;
import reactor.core.publisher.Flux;
import reactor.test.StepVerifier;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReportingServiceTest {

    @Mock
    private ReactiveMongoTemplate mongoTemplate;

    @Mock
    private OrderRepository orderRepository;

    private ReportingService reportingService;

    private static final String TEST_TENANT_ID = "tenant-123";

    @BeforeEach
    void setUp() {
        reportingService = new ReportingService(mongoTemplate, orderRepository);
        TenantContext.setTenantId(TEST_TENANT_ID);
    }

    @Test
    void getSalesSummary_shouldReturnCorrectMetrics() {
        // Arrange
        Instant startDate = Instant.now().minus(7, ChronoUnit.DAYS);
        Instant endDate = Instant.now();

        List<Order> orders = createTestOrders();

        when(mongoTemplate.find(any(Query.class), eq(Order.class)))
            .thenReturn(Flux.fromIterable(orders));

        // Act & Assert
        StepVerifier.create(reportingService.getSalesSummary(startDate, endDate))
            .assertNext(summary -> {
                assertThat(summary.orderCount()).isEqualTo(3);
                assertThat(summary.totalRevenue()).isGreaterThan(BigDecimal.ZERO);
                assertThat(summary.avgOrderValue()).isGreaterThan(BigDecimal.ZERO);
                assertThat(summary.totalItems()).isEqualTo(3);
            })
            .verifyComplete();
    }

    @Test
    void getSalesSummary_withNoOrders_shouldReturnZeroMetrics() {
        // Arrange
        Instant startDate = Instant.now().minus(7, ChronoUnit.DAYS);
        Instant endDate = Instant.now();

        when(mongoTemplate.find(any(Query.class), eq(Order.class)))
            .thenReturn(Flux.empty());

        // Act & Assert
        StepVerifier.create(reportingService.getSalesSummary(startDate, endDate))
            .assertNext(summary -> {
                assertThat(summary.orderCount()).isZero();
                assertThat(summary.totalRevenue()).isEqualByComparingTo(BigDecimal.ZERO);
                assertThat(summary.avgOrderValue()).isEqualByComparingTo(BigDecimal.ZERO);
                assertThat(summary.totalItems()).isZero();
            })
            .verifyComplete();
    }

    @Test
    void getDailySales_shouldGroupOrdersByDay() {
        // Arrange
        int days = 7;
        List<Order> orders = createTestOrders();

        when(mongoTemplate.find(any(Query.class), eq(Order.class)))
            .thenReturn(Flux.fromIterable(orders));

        // Act & Assert
        StepVerifier.create(reportingService.getDailySales(days))
            .expectNextCount(3) // We have 3 orders on different days
            .verifyComplete();
    }

    @Test
    void getTopProducts_shouldReturnProductsSortedByRevenue() {
        // Arrange
        int limit = 5;
        int days = 30;
        List<Order> orders = createTestOrders();

        when(mongoTemplate.find(any(Query.class), eq(Order.class)))
            .thenReturn(Flux.fromIterable(orders));

        // Act & Assert
        StepVerifier.create(reportingService.getTopProducts(limit, days))
            .expectNextCount(2) // We have 2 unique products in test data
            .verifyComplete();
    }

    @Test
    void getOrderStatusBreakdown_shouldReturnStatusCounts() {
        // Arrange
        int days = 30;
        List<Order> orders = createTestOrders();

        when(mongoTemplate.find(any(Query.class), eq(Order.class)))
            .thenReturn(Flux.fromIterable(orders));

        // Act & Assert
        StepVerifier.create(reportingService.getOrderStatusBreakdown(days))
            .expectNextCount(1) // All test orders have same status
            .verifyComplete();
    }

    @Test
    void getRevenueByCategory_shouldReturnCategoryRevenue() {
        // Arrange
        int days = 30;
        List<Order> orders = createTestOrders();

        when(mongoTemplate.find(any(Query.class), eq(Order.class)))
            .thenReturn(Flux.fromIterable(orders));

        // Act & Assert
        StepVerifier.create(reportingService.getRevenueByCategory(days))
            .expectNextCount(2) // We have 2 categories in test data
            .verifyComplete();
    }

    // Helper method to create test orders
    private List<Order> createTestOrders() {
        List<Order> orders = new ArrayList<>();

        // Order 1
        Order order1 = new Order();
        order1.setId("order-1");
        order1.setTenantId(TEST_TENANT_ID);
        order1.setOrderNumber("ORD-001");
        order1.setStatus(Order.OrderStatus.PROCESSING);
        order1.setCustomer(new Order.Customer("user1@test.com", "User One"));
        order1.setShippingAddress(new Order.Address("123 Main St", null, "City", "ST", "12345", "US"));
        order1.setPricing(new Order.Pricing(
            new BigDecimal("100.00"),
            new BigDecimal("10.00"),
            new BigDecimal("8.00"),
            new BigDecimal("118.00")
        ));
        order1.setCreatedAt(Instant.now().minus(1, ChronoUnit.DAYS));

        List<Order.OrderItem> items1 = new ArrayList<>();
        items1.add(new Order.OrderItem(
            "product-1",
            "Product 1",
            "SKU-001",
            new BigDecimal("50.00"),
            2,
            java.util.Map.of("category", "Electronics"),
            new BigDecimal("100.00")
        ));
        order1.setItems(items1);

        // Order 2
        Order order2 = new Order();
        order2.setId("order-2");
        order2.setTenantId(TEST_TENANT_ID);
        order2.setOrderNumber("ORD-002");
        order2.setStatus(Order.OrderStatus.PROCESSING);
        order2.setCustomer(new Order.Customer("user2@test.com", "User Two"));
        order2.setShippingAddress(new Order.Address("456 Oak Ave", null, "Town", "ST", "67890", "US"));
        order2.setPricing(new Order.Pricing(
            new BigDecimal("100.00"),
            new BigDecimal("10.00"),
            new BigDecimal("8.00"),
            new BigDecimal("118.00")
        ));
        order2.setCreatedAt(Instant.now().minus(2, ChronoUnit.DAYS));

        List<Order.OrderItem> items2 = new ArrayList<>();
        items2.add(new Order.OrderItem(
            "product-2",
            "Product 2",
            "SKU-002",
            new BigDecimal("50.00"),
            2,
            java.util.Map.of("category", "Clothing"),
            new BigDecimal("100.00")
        ));
        order2.setItems(items2);

        // Order 3
        Order order3 = new Order();
        order3.setId("order-3");
        order3.setTenantId(TEST_TENANT_ID);
        order3.setOrderNumber("ORD-003");
        order3.setStatus(Order.OrderStatus.PROCESSING);
        order3.setCustomer(new Order.Customer("user1@test.com", "User One"));
        order3.setShippingAddress(new Order.Address("123 Main St", null, "City", "ST", "12345", "US"));
        order3.setPricing(new Order.Pricing(
            new BigDecimal("100.00"),
            new BigDecimal("10.00"),
            new BigDecimal("8.00"),
            new BigDecimal("118.00")
        ));
        order3.setCreatedAt(Instant.now().minus(3, ChronoUnit.DAYS));

        List<Order.OrderItem> items3 = new ArrayList<>();
        items3.add(new Order.OrderItem(
            "product-1",
            "Product 1",
            "SKU-001",
            new BigDecimal("50.00"),
            2,
            java.util.Map.of("category", "Electronics"),
            new BigDecimal("100.00")
        ));
        order3.setItems(items3);

        orders.add(order1);
        orders.add(order2);
        orders.add(order3);

        return orders;
    }
}
