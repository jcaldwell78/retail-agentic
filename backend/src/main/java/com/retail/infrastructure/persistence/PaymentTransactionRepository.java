package com.retail.infrastructure.persistence;

import com.retail.domain.payment.PaymentTransaction;
import org.springframework.data.domain.Pageable;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * R2DBC repository for PaymentTransaction entity.
 * Provides reactive database access to payment transactions stored in PostgreSQL.
 */
@Repository
public interface PaymentTransactionRepository extends R2dbcRepository<PaymentTransaction, String> {

    /**
     * Find payment transactions by tenant ID and order ID
     */
    Flux<PaymentTransaction> findByTenantIdAndOrderId(String tenantId, String orderId);

    /**
     * Find payment transaction by gateway transaction ID
     */
    Mono<PaymentTransaction> findByGatewayTransactionId(String gatewayTransactionId);

    /**
     * Find payment transactions by tenant ID and status
     */
    @Query("SELECT * FROM payment_transactions WHERE tenant_id = :tenantId AND status = :status ORDER BY created_at DESC")
    Flux<PaymentTransaction> findByTenantIdAndStatus(String tenantId, String status, Pageable pageable);

    /**
     * Find payment transactions by customer ID
     */
    @Query("SELECT * FROM payment_transactions WHERE tenant_id = :tenantId AND customer_id = :customerId ORDER BY created_at DESC")
    Flux<PaymentTransaction> findByTenantIdAndCustomerId(String tenantId, String customerId, Pageable pageable);

    /**
     * Find failed payment transactions that can be retried
     */
    @Query("SELECT * FROM payment_transactions WHERE tenant_id = :tenantId AND status = 'FAILED' AND retry_count < 3 ORDER BY created_at ASC")
    Flux<PaymentTransaction> findRetryableTransactions(String tenantId);

    /**
     * Count payment transactions by tenant and status
     */
    @Query("SELECT COUNT(*) FROM payment_transactions WHERE tenant_id = :tenantId AND status = :status")
    Mono<Long> countByTenantIdAndStatus(String tenantId, String status);

    /**
     * Calculate total transaction amount by tenant and status
     */
    @Query("SELECT COALESCE(SUM(amount), 0) FROM payment_transactions WHERE tenant_id = :tenantId AND status = :status")
    Mono<Double> sumAmountByTenantIdAndStatus(String tenantId, String status);

    /**
     * Find recent payment transactions by tenant
     */
    @Query("SELECT * FROM payment_transactions WHERE tenant_id = :tenantId ORDER BY created_at DESC LIMIT :limit")
    Flux<PaymentTransaction> findRecentByTenantId(String tenantId, int limit);

    /**
     * Delete old payment transactions (for data retention policy)
     */
    @Query("DELETE FROM payment_transactions WHERE tenant_id = :tenantId AND created_at < :cutoffDate")
    Mono<Void> deleteOldTransactions(String tenantId, java.time.Instant cutoffDate);
}
