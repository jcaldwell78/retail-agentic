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
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
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
                assertThat(summary.totalRevenue()).isEqualByComparingTo(new BigDecimal("300.00"));
                assertThat(summary.avgOrderValue()).isEqualByComparingTo(new BigDecimal("100.00"));
                assertThat(summary.totalItems()).isEqualTo(6);
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
            .assertNext(dailySales -> {
                assertThat(dailySales.date()).isNotNull();
                assertThat(dailySales.orderCount()).isPositive();
                assertThat(dailySales.revenue()).isGreaterThan(BigDecimal.ZERO);
            })
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
        order1.setUserId("user-1");
        order1.setOrderNumber("ORD-001");
        order1.setStatus("CONFIRMED");
        order1.setTotalAmount(new BigDecimal("100.00"));
        order1.setCreatedAt(Instant.now().minus(1, ChronoUnit.DAYS));

        List<Order.OrderItem> items1 = new ArrayList<>();
        items1.add(new Order.OrderItem(
            "item-1",
            "product-1",
            "Product 1",
            "SKU-001",
            new BigDecimal("50.00"),
            2,
            java.util.Map.of("category", "Electronics"),
            "image1.jpg",
            new BigDecimal("100.00")
        ));
        order1.setItems(items1);

        // Order 2
        Order order2 = new Order();
        order2.setId("order-2");
        order2.setTenantId(TEST_TENANT_ID);
        order2.setUserId("user-2");
        order2.setOrderNumber("ORD-002");
        order2.setStatus("CONFIRMED");
        order2.setTotalAmount(new BigDecimal("100.00"));
        order2.setCreatedAt(Instant.now().minus(2, ChronoUnit.DAYS));

        List<Order.OrderItem> items2 = new ArrayList<>();
        items2.add(new Order.OrderItem(
            "item-2",
            "product-2",
            "Product 2",
            "SKU-002",
            new BigDecimal("50.00"),
            2,
            java.util.Map.of("category", "Clothing"),
            "image2.jpg",
            new BigDecimal("100.00")
        ));
        order2.setItems(items2);

        // Order 3
        Order order3 = new Order();
        order3.setId("order-3");
        order3.setTenantId(TEST_TENANT_ID);
        order3.setUserId("user-1");
        order3.setOrderNumber("ORD-003");
        order3.setStatus("CONFIRMED");
        order3.setTotalAmount(new BigDecimal("100.00"));
        order3.setCreatedAt(Instant.now().minus(3, ChronoUnit.DAYS));

        List<Order.OrderItem> items3 = new ArrayList<>();
        items3.add(new Order.OrderItem(
            "item-3",
            "product-1",
            "Product 1",
            "SKU-001",
            new BigDecimal("50.00"),
            2,
            java.util.Map.of("category", "Electronics"),
            "image1.jpg",
            new BigDecimal("100.00")
        ));
        order3.setItems(items3);

        orders.add(order1);
        orders.add(order2);
        orders.add(order3);

        return orders;
    }
}
