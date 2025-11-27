package com.retail.infrastructure.persistence;

import com.retail.domain.order.Order;
import org.springframework.data.domain.Pageable;
import com.retail.domain.order.OrderStatus;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.data.mongodb.repository.ReactiveMongoRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Instant;

/**
 * Repository for Order entities with tenant filtering.
 * All queries automatically filter by tenantId for multi-tenant isolation.
 */
@Repository
public interface OrderRepository extends ReactiveMongoRepository<Order, String> {

    /**
     * Find order by order number and tenant
     */
    Mono<Order> findByOrderNumberAndTenantId(String orderNumber, String tenantId);

    /**
     * Find order by ID and tenant
     */
    Mono<Order> findByIdAndTenantId(String id, String tenantId);

    /**
     * Find all orders for tenant with pagination
     */
    Flux<Order> findByTenantId(String tenantId, Pageable pageable);

    /**
     * Find orders by customer email and tenant
     */
    @Query("{ 'tenantId': ?0, 'customer.email': ?1 }")
    Flux<Order> findByTenantIdAndCustomerEmail(String tenantId, String email, Pageable pageable);

    /**
     * Find orders by status and tenant
     */
    @Query("{ 'tenantId': ?0, 'status': ?1 }")
    Flux<Order> findByTenantIdAndStatus(String tenantId, String status, Pageable pageable);

    /**
     * Find orders created within a date range for tenant
     */
    @Query("{ 'tenantId': ?0, 'createdAt': { $gte: ?1, $lte: ?2 } }")
    Flux<Order> findByTenantIdAndCreatedAtBetween(
        String tenantId,
        Instant startDate,
        Instant endDate,
        Pageable pageable
    );

    /**
     * Find orders above a certain total for tenant
     */
    @Query("{ 'tenantId': ?0, 'total': { $gte: ?1 } }")
    Flux<Order> findHighValueOrders(String tenantId, double minTotal, Pageable pageable);

    /**
     * Count orders for tenant
     */
    Mono<Long> countByTenantId(String tenantId);

    /**
     * Count orders by status for tenant
     */
    @Query(value = "{ 'tenantId': ?0, 'status': ?1 }", count = true)
    Mono<Long> countByTenantIdAndStatus(String tenantId, String status);

    /**
     * Calculate total revenue for tenant within date range
     */
    @Query(value = "{ 'tenantId': ?0, 'createdAt': { $gte: ?1, $lte: ?2 } }",
           fields = "{ 'total': 1 }")
    Flux<Order> findOrdersForRevenueCalculation(String tenantId, Instant startDate, Instant endDate);

    /**
     * Find recent orders for tenant
     */
    @Query(value = "{ 'tenantId': ?0 }", sort = "{ 'createdAt': -1 }")
    Flux<Order> findRecentOrders(String tenantId, Pageable pageable);

    /**
     * Delete order by ID and tenant (ensures tenant isolation)
     */
    Mono<Void> deleteByIdAndTenantId(String id, String tenantId);

    /**
     * Find orders by customer email and tenant (2 params)
     */
    @Query("{ 'tenantId': ?1, 'customer.email': ?0 }")
    Flux<Order> findByCustomerEmail(String email, String tenantId);

    /**
     * Find orders by status and tenant (accepts String status)
     */
    @Query("{ 'status': ?0, 'tenantId': ?1 }")
    Flux<Order> findByStatusAndTenantId(OrderStatus status, String tenantId);

    /**
     * Count orders created after a specific date for tenant
     */
    @Query(value = "{ 'tenantId': ?0, 'createdAt': { $gte: ?1 } }", count = true)
    Mono<Long> countByTenantIdAndCreatedAtAfter(String tenantId, Instant after);
}
