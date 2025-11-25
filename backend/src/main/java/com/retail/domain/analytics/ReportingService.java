package com.retail.domain.analytics;

import com.retail.domain.order.Order;
import com.retail.infrastructure.persistence.OrderRepository;
import com.retail.security.tenant.TenantContext;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.aggregation.AggregationResults;
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
 * Service for generating reporting aggregations and analytics.
 * Provides business intelligence data for admin dashboards.
 */
@Service
public class ReportingService {

    private final ReactiveMongoTemplate mongoTemplate;
    private final OrderRepository orderRepository;

    public ReportingService(
            ReactiveMongoTemplate mongoTemplate,
            OrderRepository orderRepository) {
        this.mongoTemplate = mongoTemplate;
        this.orderRepository = orderRepository;
    }

    /**
     * Get sales summary for a date range.
     *
     * @param startDate Start date
     * @param endDate End date
     * @return Mono<SalesSummary> Sales metrics
     */
    public Mono<SalesSummary> getSalesSummary(Instant startDate, Instant endDate) {
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

                    return new SalesSummary(
                        orderCount,
                        totalRevenue,
                        avgOrderValue,
                        totalItems,
                        startDate,
                        endDate
                    );
                });
            });
    }

    /**
     * Get daily sales data for charting.
     *
     * @param days Number of days to include
     * @return Flux<DailySales> Daily sales data
     */
    public Flux<DailySales> getDailySales(int days) {
        return TenantContext.getTenantId()
            .flatMapMany(tenantId -> {
                Instant startDate = Instant.now().minus(days, ChronoUnit.DAYS);

                Criteria criteria = Criteria.where("tenantId").is(tenantId)
                    .and("createdAt").gte(startDate)
                    .and("status").ne("CANCELLED");

                return mongoTemplate.find(
                    org.springframework.data.mongodb.core.query.Query.query(criteria),
                    Order.class
                )
                .collectList()
                .flatMapMany(orders -> {
                    // Group by day
                    Map<LocalDate, DailySalesBuilder> dailyMap = new HashMap<>();

                    orders.forEach(order -> {
                        LocalDate date = order.getCreatedAt()
                            .atZone(ZoneId.systemDefault())
                            .toLocalDate();

                        DailySalesBuilder builder = dailyMap.computeIfAbsent(
                            date,
                            d -> new DailySalesBuilder(d)
                        );

                        builder.addOrder(order);
                    });

                    return Flux.fromIterable(
                        dailyMap.values().stream()
                            .map(DailySalesBuilder::build)
                            .sorted((a, b) -> a.date().compareTo(b.date()))
                            .toList()
                    );
                });
            });
    }

    /**
     * Get top selling products.
     *
     * @param limit Number of products to return
     * @param days Number of days to analyze
     * @return Flux<TopProduct> Top products by revenue
     */
    public Flux<TopProduct> getTopProducts(int limit, int days) {
        return TenantContext.getTenantId()
            .flatMapMany(tenantId -> {
                Instant startDate = Instant.now().minus(days, ChronoUnit.DAYS);

                Criteria criteria = Criteria.where("tenantId").is(tenantId)
                    .and("createdAt").gte(startDate)
                    .and("status").ne("CANCELLED");

                return mongoTemplate.find(
                    org.springframework.data.mongodb.core.query.Query.query(criteria),
                    Order.class
                )
                .collectList()
                .flatMapMany(orders -> {
                    // Aggregate product sales
                    Map<String, TopProductBuilder> productMap = new HashMap<>();

                    orders.forEach(order -> {
                        order.getItems().forEach(item -> {
                            TopProductBuilder builder = productMap.computeIfAbsent(
                                item.productId(),
                                id -> new TopProductBuilder(
                                    item.productId(),
                                    item.productName()
                                )
                            );

                            builder.addSale(item.quantity(), item.subtotal());
                        });
                    });

                    return Flux.fromIterable(
                        productMap.values().stream()
                            .map(TopProductBuilder::build)
                            .sorted((a, b) -> b.revenue().compareTo(a.revenue()))
                            .limit(limit)
                            .toList()
                    );
                });
            });
    }

    /**
     * Get order status breakdown.
     *
     * @param days Number of days to analyze
     * @return Flux<StatusCount> Order counts by status
     */
    public Flux<StatusCount> getOrderStatusBreakdown(int days) {
        return TenantContext.getTenantId()
            .flatMapMany(tenantId -> {
                Instant startDate = Instant.now().minus(days, ChronoUnit.DAYS);

                Criteria criteria = Criteria.where("tenantId").is(tenantId)
                    .and("createdAt").gte(startDate);

                return mongoTemplate.find(
                    org.springframework.data.mongodb.core.query.Query.query(criteria),
                    Order.class
                )
                .collectList()
                .flatMapMany(orders -> {
                    Map<String, Long> statusCounts = new HashMap<>();

                    orders.forEach(order -> {
                        String status = order.getStatus();
                        statusCounts.put(status, statusCounts.getOrDefault(status, 0L) + 1);
                    });

                    return Flux.fromIterable(
                        statusCounts.entrySet().stream()
                            .map(entry -> new StatusCount(entry.getKey(), entry.getValue()))
                            .sorted((a, b) -> Long.compare(b.count(), a.count()))
                            .toList()
                    );
                });
            });
    }

    /**
     * Get revenue by category.
     *
     * @param days Number of days to analyze
     * @return Flux<CategoryRevenue> Revenue per category
     */
    public Flux<CategoryRevenue> getRevenueByCategory(int days) {
        return TenantContext.getTenantId()
            .flatMapMany(tenantId -> {
                Instant startDate = Instant.now().minus(days, ChronoUnit.DAYS);

                Criteria criteria = Criteria.where("tenantId").is(tenantId)
                    .and("createdAt").gte(startDate)
                    .and("status").ne("CANCELLED");

                return mongoTemplate.find(
                    org.springframework.data.mongodb.core.query.Query.query(criteria),
                    Order.class
                )
                .collectList()
                .flatMapMany(orders -> {
                    Map<String, BigDecimal> categoryRevenue = new HashMap<>();

                    orders.forEach(order -> {
                        order.getItems().forEach(item -> {
                            // Assuming category is in item attributes
                            String category = item.attributes() != null
                                ? (String) item.attributes().getOrDefault("category", "Uncategorized")
                                : "Uncategorized";

                            categoryRevenue.put(
                                category,
                                categoryRevenue.getOrDefault(category, BigDecimal.ZERO)
                                    .add(item.subtotal())
                            );
                        });
                    });

                    return Flux.fromIterable(
                        categoryRevenue.entrySet().stream()
                            .map(entry -> new CategoryRevenue(entry.getKey(), entry.getValue()))
                            .sorted((a, b) -> b.revenue().compareTo(a.revenue()))
                            .toList()
                    );
                });
            });
    }

    // Helper classes for building aggregates
    private static class DailySalesBuilder {
        private final LocalDate date;
        private long orderCount = 0;
        private BigDecimal revenue = BigDecimal.ZERO;

        DailySalesBuilder(LocalDate date) {
            this.date = date;
        }

        void addOrder(Order order) {
            orderCount++;
            revenue = revenue.add(order.getTotalAmount());
        }

        DailySales build() {
            return new DailySales(date, orderCount, revenue);
        }
    }

    private static class TopProductBuilder {
        private final String productId;
        private final String productName;
        private int quantitySold = 0;
        private BigDecimal revenue = BigDecimal.ZERO;

        TopProductBuilder(String productId, String productName) {
            this.productId = productId;
            this.productName = productName;
        }

        void addSale(int quantity, BigDecimal amount) {
            quantitySold += quantity;
            revenue = revenue.add(amount);
        }

        TopProduct build() {
            return new TopProduct(productId, productName, quantitySold, revenue);
        }
    }

    // Result records
    public record SalesSummary(
        long orderCount,
        BigDecimal totalRevenue,
        BigDecimal avgOrderValue,
        int totalItems,
        Instant startDate,
        Instant endDate
    ) {}

    public record DailySales(
        LocalDate date,
        long orderCount,
        BigDecimal revenue
    ) {}

    public record TopProduct(
        String productId,
        String productName,
        int quantitySold,
        BigDecimal revenue
    ) {}

    public record StatusCount(
        String status,
        long count
    ) {}

    public record CategoryRevenue(
        String category,
        BigDecimal revenue
    ) {}
}
