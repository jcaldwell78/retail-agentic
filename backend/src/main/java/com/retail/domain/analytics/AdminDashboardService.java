package com.retail.domain.analytics;

import com.retail.domain.order.Order;
import com.retail.infrastructure.persistence.OrderRepository;
import com.retail.infrastructure.persistence.ProductRepository;
import com.retail.infrastructure.persistence.UserRepository;
import com.retail.security.tenant.TenantContext;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.Map;

/**
 * Service providing analytics data for admin dashboard.
 * Aggregates metrics across products, orders, users, and revenue.
 */
@Service
public class AdminDashboardService {

    private final ReactiveMongoTemplate mongoTemplate;
    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final ReportingService reportingService;

    public AdminDashboardService(
            ReactiveMongoTemplate mongoTemplate,
            OrderRepository orderRepository,
            ProductRepository productRepository,
            UserRepository userRepository,
            ReportingService reportingService) {
        this.mongoTemplate = mongoTemplate;
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
        this.reportingService = reportingService;
    }

    /**
     * Get complete dashboard overview.
     *
     * @return Mono<DashboardOverview>
     */
    public Mono<DashboardOverview> getDashboardOverview() {
        Instant now = Instant.now();
        Instant startOfToday = LocalDate.now().atStartOfDay(ZoneId.systemDefault()).toInstant();
        Instant startOf30DaysAgo = now.minus(30, ChronoUnit.DAYS);
        Instant startOf7DaysAgo = now.minus(7, ChronoUnit.DAYS);

        return TenantContext.getTenantId()
            .flatMap(tenantId -> {
                // Gather all metrics in parallel
                Mono<KeyMetrics> todayMetrics = getKeyMetrics(startOfToday, now);
                Mono<KeyMetrics> last30DaysMetrics = getKeyMetrics(startOf30DaysAgo, now);
                Mono<KeyMetrics> last7DaysMetrics = getKeyMetrics(startOf7DaysAgo, now);
                Mono<Long> totalProducts = productRepository.countByTenantId(tenantId);
                Mono<Long> totalUsers = userRepository.countByTenantId(tenantId);
                Mono<Long> activeProducts = productRepository.countByTenantIdAndActiveTrue(tenantId);
                Flux<ReportingService.TopProduct> topProducts = reportingService.getTopProducts(5, 30);
                Flux<ReportingService.StatusCount> orderStatusBreakdown = reportingService.getOrderStatusBreakdown(30);
                Flux<ReportingService.DailySales> last7DaysSales = reportingService.getDailySales(7);

                return Mono.zip(
                    todayMetrics,
                    last30DaysMetrics,
                    last7DaysMetrics,
                    totalProducts,
                    totalUsers,
                    activeProducts,
                    topProducts.collectList(),
                    orderStatusBreakdown.collectList(),
                    last7DaysSales.collectList()
                ).map(tuple -> new DashboardOverview(
                    tuple.getT1(),  // today metrics
                    tuple.getT2(),  // last 30 days metrics
                    tuple.getT3(),  // last 7 days metrics
                    tuple.getT4(),  // total products
                    tuple.getT5(),  // total users
                    tuple.getT6(),  // active products
                    tuple.getT7(),  // top products
                    tuple.getT8(),  // order status breakdown
                    tuple.getT9()   // last 7 days sales
                ));
            });
    }

    /**
     * Get key metrics for a date range.
     *
     * @param startDate Start date
     * @param endDate End date
     * @return Mono<KeyMetrics>
     */
    public Mono<KeyMetrics> getKeyMetrics(Instant startDate, Instant endDate) {
        return TenantContext.getTenantId()
            .flatMap(tenantId -> {
                Criteria criteria = Criteria.where("tenantId").is(tenantId)
                    .and("createdAt").gte(startDate).lte(endDate)
                    .and("status").ne("CANCELLED");

                return mongoTemplate.find(
                    org.springframework.data.mongodb.core.query.Query.query(criteria),
                    Order.class
                )
                .collectList()
                .map(orders -> {
                    long orderCount = orders.size();
                    BigDecimal totalRevenue = orders.stream()
                        .map(Order::getTotalAmount)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);

                    BigDecimal avgOrderValue = orderCount > 0
                        ? totalRevenue.divide(BigDecimal.valueOf(orderCount), 2, BigDecimal.ROUND_HALF_UP)
                        : BigDecimal.ZERO;

                    int totalItems = orders.stream()
                        .mapToInt(order -> order.getItems().size())
                        .sum();

                    // Count unique customers
                    long uniqueCustomers = orders.stream()
                        .map(Order::getUserId)
                        .filter(userId -> userId != null && !userId.isEmpty())
                        .distinct()
                        .count();

                    return new KeyMetrics(
                        totalRevenue,
                        orderCount,
                        avgOrderValue,
                        totalItems,
                        uniqueCustomers
                    );
                });
            });
    }

    /**
     * Get revenue trend comparison (current vs previous period).
     *
     * @param days Number of days for comparison
     * @return Mono<RevenueTrend>
     */
    public Mono<RevenueTrend> getRevenueTrend(int days) {
        Instant now = Instant.now();
        Instant currentPeriodStart = now.minus(days, ChronoUnit.DAYS);
        Instant previousPeriodStart = now.minus(days * 2, ChronoUnit.DAYS);
        Instant previousPeriodEnd = currentPeriodStart;

        return Mono.zip(
            getKeyMetrics(currentPeriodStart, now),
            getKeyMetrics(previousPeriodStart, previousPeriodEnd)
        ).map(tuple -> {
            KeyMetrics currentMetrics = tuple.getT1();
            KeyMetrics previousMetrics = tuple.getT2();

            BigDecimal currentRevenue = currentMetrics.totalRevenue();
            BigDecimal previousRevenue = previousMetrics.totalRevenue();

            BigDecimal percentageChange = BigDecimal.ZERO;
            if (previousRevenue.compareTo(BigDecimal.ZERO) > 0) {
                percentageChange = currentRevenue.subtract(previousRevenue)
                    .divide(previousRevenue, 4, BigDecimal.ROUND_HALF_UP)
                    .multiply(BigDecimal.valueOf(100));
            }

            long orderCountChange = currentMetrics.orderCount() - previousMetrics.orderCount();

            return new RevenueTrend(
                currentRevenue,
                previousRevenue,
                percentageChange,
                currentMetrics.orderCount(),
                orderCountChange
            );
        });
    }

    /**
     * Get low stock products alert.
     *
     * @param threshold Stock threshold
     * @return Flux<LowStockProduct>
     */
    public Flux<LowStockProduct> getLowStockProducts(int threshold) {
        return TenantContext.getTenantId()
            .flatMapMany(tenantId ->
                productRepository.findByTenantIdAndActiveTrueAndStockQuantityLessThan(
                    tenantId,
                    threshold
                )
                .map(product -> new LowStockProduct(
                    product.getId(),
                    product.getName(),
                    product.getSku(),
                    product.getStockQuantity(),
                    threshold
                ))
            );
    }

    /**
     * Get recent order activity.
     *
     * @param limit Number of recent orders
     * @return Flux<RecentOrder>
     */
    public Flux<RecentOrder> getRecentOrders(int limit) {
        return TenantContext.getTenantId()
            .flatMapMany(tenantId ->
                mongoTemplate.find(
                    org.springframework.data.mongodb.core.query.Query.query(
                        Criteria.where("tenantId").is(tenantId)
                    ).limit(limit),
                    Order.class
                )
                .sort((o1, o2) -> o2.getCreatedAt().compareTo(o1.getCreatedAt()))
                .map(order -> new RecentOrder(
                    order.getId(),
                    order.getOrderNumber(),
                    order.getUserId(),
                    order.getTotalAmount(),
                    order.getStatus(),
                    order.getCreatedAt()
                ))
            );
    }

    /**
     * Get customer growth metrics.
     *
     * @param days Number of days
     * @return Mono<CustomerGrowth>
     */
    public Mono<CustomerGrowth> getCustomerGrowth(int days) {
        return TenantContext.getTenantId()
            .flatMap(tenantId -> {
                Instant startDate = Instant.now().minus(days, ChronoUnit.DAYS);

                Criteria criteria = Criteria.where("tenantId").is(tenantId)
                    .and("createdAt").gte(startDate);

                return userRepository.findByTenantIdAndCreatedAtAfter(tenantId, startDate)
                    .collectList()
                    .zipWith(userRepository.countByTenantId(tenantId))
                    .map(tuple -> {
                        int newCustomers = tuple.getT1().size();
                        long totalCustomers = tuple.getT2();

                        // Group by day
                        Map<LocalDate, Long> dailySignups = new HashMap<>();
                        tuple.getT1().forEach(user -> {
                            LocalDate date = user.getCreatedAt()
                                .atZone(ZoneId.systemDefault())
                                .toLocalDate();
                            dailySignups.put(date, dailySignups.getOrDefault(date, 0L) + 1);
                        });

                        return new CustomerGrowth(
                            totalCustomers,
                            newCustomers,
                            dailySignups
                        );
                    });
            });
    }

    /**
     * Get conversion metrics.
     *
     * @param days Number of days
     * @return Mono<ConversionMetrics>
     */
    public Mono<ConversionMetrics> getConversionMetrics(int days) {
        return TenantContext.getTenantId()
            .flatMap(tenantId -> {
                Instant startDate = Instant.now().minus(days, ChronoUnit.DAYS);

                // This is simplified - in reality you'd track sessions/visits
                return Mono.zip(
                    orderRepository.countByTenantIdAndCreatedAtAfter(tenantId, startDate),
                    userRepository.countByTenantIdAndCreatedAtAfter(tenantId, startDate)
                ).map(tuple -> {
                    long orderCount = tuple.getT1();
                    long visitorCount = tuple.getT2();

                    // Simple conversion rate calculation
                    double conversionRate = visitorCount > 0
                        ? (orderCount * 100.0 / visitorCount)
                        : 0.0;

                    return new ConversionMetrics(
                        visitorCount,
                        orderCount,
                        conversionRate
                    );
                });
            });
    }

    // Result records
    public record DashboardOverview(
        KeyMetrics today,
        KeyMetrics last30Days,
        KeyMetrics last7Days,
        long totalProducts,
        long totalUsers,
        long activeProducts,
        java.util.List<ReportingService.TopProduct> topProducts,
        java.util.List<ReportingService.StatusCount> orderStatusBreakdown,
        java.util.List<ReportingService.DailySales> recentSales
    ) {}

    public record KeyMetrics(
        BigDecimal totalRevenue,
        long orderCount,
        BigDecimal avgOrderValue,
        int totalItems,
        long uniqueCustomers
    ) {}

    public record RevenueTrend(
        BigDecimal currentRevenue,
        BigDecimal previousRevenue,
        BigDecimal percentageChange,
        long currentOrderCount,
        long orderCountChange
    ) {}

    public record LowStockProduct(
        String productId,
        String productName,
        String sku,
        Integer currentStock,
        Integer threshold
    ) {}

    public record RecentOrder(
        String orderId,
        String orderNumber,
        String userId,
        BigDecimal total,
        String status,
        Instant createdAt
    ) {}

    public record CustomerGrowth(
        long totalCustomers,
        int newCustomers,
        Map<LocalDate, Long> dailySignups
    ) {}

    public record ConversionMetrics(
        long visitors,
        long orders,
        double conversionRate
    ) {}
}
