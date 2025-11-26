package com.retail.domain.analytics;

import com.retail.domain.order.Order;
import com.retail.domain.product.Product;
import com.retail.domain.user.User;
import com.retail.infrastructure.persistence.OrderRepository;
import com.retail.infrastructure.persistence.ProductRepository;
import com.retail.infrastructure.persistence.UserRepository;
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
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminDashboardServiceTest {

    @Mock
    private ReactiveMongoTemplate mongoTemplate;

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ReportingService reportingService;

    private AdminDashboardService adminDashboardService;

    private static final String TEST_TENANT_ID = "tenant-123";

    @BeforeEach
    void setUp() {
        adminDashboardService = new AdminDashboardService(
            mongoTemplate,
            orderRepository,
            productRepository,
            userRepository,
            reportingService
        );
        TenantContext.setTenantId(TEST_TENANT_ID);
    }

    @Test
    void getDashboardOverview_shouldReturnCompleteOverview() {
        // Arrange
        List<Order> orders = createTestOrders();

        when(mongoTemplate.find(any(Query.class), eq(Order.class)))
            .thenReturn(Flux.fromIterable(orders));
        when(productRepository.countByTenantId(TEST_TENANT_ID))
            .thenReturn(Mono.just(100L));
        when(userRepository.countByTenantId(TEST_TENANT_ID))
            .thenReturn(Mono.just(50L));
        when(productRepository.countByTenantIdAndActiveTrue(TEST_TENANT_ID))
            .thenReturn(Mono.just(90L));
        when(reportingService.getTopProducts(5, 30))
            .thenReturn(Flux.empty());
        when(reportingService.getOrderStatusBreakdown(30))
            .thenReturn(Flux.empty());
        when(reportingService.getDailySales(7))
            .thenReturn(Flux.empty());

        // Act & Assert
        StepVerifier.create(adminDashboardService.getDashboardOverview())
            .assertNext(overview -> {
                assertThat(overview.totalProducts()).isEqualTo(100L);
                assertThat(overview.totalUsers()).isEqualTo(50L);
                assertThat(overview.activeProducts()).isEqualTo(90L);
                assertThat(overview.today()).isNotNull();
                assertThat(overview.last30Days()).isNotNull();
                assertThat(overview.last7Days()).isNotNull();
            })
            .verifyComplete();
    }

    @Test
    void getKeyMetrics_shouldCalculateCorrectMetrics() {
        // Arrange
        Instant startDate = Instant.now().minus(7, ChronoUnit.DAYS);
        Instant endDate = Instant.now();
        List<Order> orders = createTestOrders();

        when(mongoTemplate.find(any(Query.class), eq(Order.class)))
            .thenReturn(Flux.fromIterable(orders));

        // Act & Assert
        StepVerifier.create(adminDashboardService.getKeyMetrics(startDate, endDate))
            .assertNext(metrics -> {
                assertThat(metrics.totalRevenue()).isGreaterThan(BigDecimal.ZERO);
                assertThat(metrics.orderCount()).isEqualTo(3);
                assertThat(metrics.avgOrderValue()).isGreaterThan(BigDecimal.ZERO);
                assertThat(metrics.totalItems()).isPositive();
                assertThat(metrics.uniqueCustomers()).isPositive();
            })
            .verifyComplete();
    }

    @Test
    void getRevenueTrend_shouldCompareCurrentAndPreviousPeriod() {
        // Arrange
        int days = 7;
        List<Order> currentOrders = createTestOrders();
        List<Order> previousOrders = createTestOrders();

        when(mongoTemplate.find(any(Query.class), eq(Order.class)))
            .thenReturn(Flux.fromIterable(currentOrders))
            .thenReturn(Flux.fromIterable(previousOrders));

        // Act & Assert
        StepVerifier.create(adminDashboardService.getRevenueTrend(days))
            .assertNext(trend -> {
                assertThat(trend.currentRevenue()).isGreaterThan(BigDecimal.ZERO);
                assertThat(trend.previousRevenue()).isGreaterThan(BigDecimal.ZERO);
                assertThat(trend.currentOrderCount()).isPositive();
            })
            .verifyComplete();
    }

    @Test
    void getLowStockProducts_shouldReturnProductsBelowThreshold() {
        // Arrange
        int threshold = 10;
        Product lowStockProduct = new Product();
        lowStockProduct.setId("product-1");
        lowStockProduct.setName("Low Stock Product");
        lowStockProduct.setSku("SKU-001");
        lowStockProduct.setStockQuantity(5);
        lowStockProduct.setActive(true);

        when(productRepository.findByTenantIdAndActiveTrueAndStockQuantityLessThan(
            TEST_TENANT_ID, threshold
        ))
        .thenReturn(Flux.just(lowStockProduct));

        // Act & Assert
        StepVerifier.create(adminDashboardService.getLowStockProducts(threshold))
            .assertNext(lowStock -> {
                assertThat(lowStock.productId()).isEqualTo("product-1");
                assertThat(lowStock.currentStock()).isEqualTo(5);
                assertThat(lowStock.threshold()).isEqualTo(threshold);
            })
            .verifyComplete();
    }

    @Test
    void getRecentOrders_shouldReturnLimitedOrders() {
        // Arrange
        int limit = 10;
        List<Order> orders = createTestOrders();

        when(mongoTemplate.find(any(Query.class), eq(Order.class)))
            .thenReturn(Flux.fromIterable(orders));

        // Act & Assert
        StepVerifier.create(adminDashboardService.getRecentOrders(limit))
            .expectNextCount(3)
            .verifyComplete();
    }

    @Test
    void getCustomerGrowth_shouldReturnGrowthMetrics() {
        // Arrange
        int days = 30;
        Instant startDate = Instant.now().minus(days, ChronoUnit.DAYS);

        User user1 = new User();
        user1.setCreatedAt(Instant.now().minus(5, ChronoUnit.DAYS));

        User user2 = new User();
        user2.setCreatedAt(Instant.now().minus(10, ChronoUnit.DAYS));

        when(userRepository.findByTenantIdAndCreatedAtAfter(TEST_TENANT_ID, startDate))
            .thenReturn(Flux.just(user1, user2));
        when(userRepository.countByTenantId(TEST_TENANT_ID))
            .thenReturn(Mono.just(100L));

        // Act & Assert
        StepVerifier.create(adminDashboardService.getCustomerGrowth(days))
            .assertNext(growth -> {
                assertThat(growth.totalCustomers()).isEqualTo(100L);
                assertThat(growth.newCustomers()).isEqualTo(2);
                assertThat(growth.dailySignups()).isNotEmpty();
            })
            .verifyComplete();
    }

    @Test
    void getConversionMetrics_shouldCalculateConversionRate() {
        // Arrange
        int days = 30;
        Instant startDate = Instant.now().minus(days, ChronoUnit.DAYS);

        when(orderRepository.countByTenantIdAndCreatedAtAfter(TEST_TENANT_ID, startDate))
            .thenReturn(Mono.just(50L));
        when(userRepository.countByTenantIdAndCreatedAtAfter(TEST_TENANT_ID, startDate))
            .thenReturn(Mono.just(100L));

        // Act & Assert
        StepVerifier.create(adminDashboardService.getConversionMetrics(days))
            .assertNext(metrics -> {
                assertThat(metrics.visitors()).isEqualTo(100L);
                assertThat(metrics.orders()).isEqualTo(50L);
                assertThat(metrics.conversionRate()).isEqualTo(50.0);
            })
            .verifyComplete();
    }

    @Test
    void getConversionMetrics_withZeroVisitors_shouldHandleGracefully() {
        // Arrange
        int days = 30;
        Instant startDate = Instant.now().minus(days, ChronoUnit.DAYS);

        when(orderRepository.countByTenantIdAndCreatedAtAfter(TEST_TENANT_ID, startDate))
            .thenReturn(Mono.just(0L));
        when(userRepository.countByTenantIdAndCreatedAtAfter(TEST_TENANT_ID, startDate))
            .thenReturn(Mono.just(0L));

        // Act & Assert
        StepVerifier.create(adminDashboardService.getConversionMetrics(days))
            .assertNext(metrics -> {
                assertThat(metrics.visitors()).isZero();
                assertThat(metrics.orders()).isZero();
                assertThat(metrics.conversionRate()).isZero();
            })
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
            java.util.Map.of(),
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
            new BigDecimal("150.00"),
            new BigDecimal("15.00"),
            new BigDecimal("12.00"),
            new BigDecimal("177.00")
        ));
        order2.setCreatedAt(Instant.now().minus(2, ChronoUnit.DAYS));

        List<Order.OrderItem> items2 = new ArrayList<>();
        items2.add(new Order.OrderItem(
            "product-2",
            "Product 2",
            "SKU-002",
            new BigDecimal("75.00"),
            2,
            java.util.Map.of(),
            new BigDecimal("150.00")
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
            new BigDecimal("200.00"),
            new BigDecimal("20.00"),
            new BigDecimal("16.00"),
            new BigDecimal("236.00")
        ));
        order3.setCreatedAt(Instant.now().minus(3, ChronoUnit.DAYS));

        List<Order.OrderItem> items3 = new ArrayList<>();
        items3.add(new Order.OrderItem(
            "product-1",
            "Product 1",
            "SKU-001",
            new BigDecimal("100.00"),
            2,
            java.util.Map.of(),
            new BigDecimal("200.00")
        ));
        order3.setItems(items3);

        orders.add(order1);
        orders.add(order2);
        orders.add(order3);

        return orders;
    }
}
