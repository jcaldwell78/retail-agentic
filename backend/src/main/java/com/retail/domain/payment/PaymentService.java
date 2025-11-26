package com.retail.domain.payment;

import com.retail.infrastructure.persistence.PaymentTransactionRepository;
import com.retail.security.tenant.TenantContext;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Service for payment transaction management.
 * Handles payment processing, refunds, and transaction tracking.
 */
@Service
public class PaymentService {

    private final PaymentTransactionRepository paymentTransactionRepository;

    public PaymentService(PaymentTransactionRepository paymentTransactionRepository) {
        this.paymentTransactionRepository = paymentTransactionRepository;
    }

    /**
     * Create a new payment transaction
     */
    public Mono<PaymentTransaction> createTransaction(
        String orderId,
        BigDecimal amount,
        String currency,
        PaymentTransaction.PaymentMethod paymentMethod,
        String gateway
    ) {
        return TenantContext.getTenantId()
            .map(tenantId -> {
                PaymentTransaction transaction = new PaymentTransaction();
                transaction.setTenantId(tenantId);
                transaction.setOrderId(orderId);
                transaction.setAmount(amount);
                transaction.setCurrency(currency);
                transaction.setPaymentMethod(paymentMethod);
                transaction.setGateway(gateway);
                transaction.setStatus(PaymentTransaction.PaymentStatus.PENDING);
                return transaction;
            })
            .flatMap(paymentTransactionRepository::save);
    }

    /**
     * Update payment transaction status
     */
    public Mono<PaymentTransaction> updateStatus(
        String transactionId,
        PaymentTransaction.PaymentStatus newStatus,
        String gatewayTransactionId
    ) {
        return TenantContext.getTenantId()
            .flatMap(tenantId ->
                paymentTransactionRepository.findById(transactionId)
                    .filter(tx -> tx.getTenantId().equals(tenantId))
                    .flatMap(transaction -> {
                        transaction.setStatus(newStatus);
                        if (gatewayTransactionId != null) {
                            transaction.setGatewayTransactionId(gatewayTransactionId);
                        }
                        return paymentTransactionRepository.save(transaction);
                    })
            );
    }

    /**
     * Mark payment as failed with error details
     */
    public Mono<PaymentTransaction> markFailed(
        String transactionId,
        String failureCode,
        String failureMessage
    ) {
        return TenantContext.getTenantId()
            .flatMap(tenantId ->
                paymentTransactionRepository.findById(transactionId)
                    .filter(tx -> tx.getTenantId().equals(tenantId))
                    .flatMap(transaction -> {
                        transaction.setStatus(PaymentTransaction.PaymentStatus.FAILED);
                        transaction.setFailureCode(failureCode);
                        transaction.setFailureMessage(failureMessage);
                        return paymentTransactionRepository.save(transaction);
                    })
            );
    }

    /**
     * Process refund for a transaction
     */
    public Mono<PaymentTransaction> refund(
        String transactionId,
        BigDecimal refundAmount,
        String refundReason
    ) {
        return TenantContext.getTenantId()
            .flatMap(tenantId ->
                paymentTransactionRepository.findById(transactionId)
                    .filter(tx -> tx.getTenantId().equals(tenantId))
                    .flatMap(transaction -> {
                        if (transaction.getStatus() != PaymentTransaction.PaymentStatus.SUCCESS) {
                            return Mono.error(new IllegalStateException("Can only refund successful payments"));
                        }

                        // Check if full or partial refund
                        boolean isFullRefund = refundAmount.compareTo(transaction.getAmount()) == 0;

                        transaction.setRefundAmount(refundAmount);
                        transaction.setRefundReason(refundReason);
                        transaction.setRefundedAt(Instant.now());
                        transaction.setStatus(
                            isFullRefund ?
                                PaymentTransaction.PaymentStatus.REFUNDED :
                                PaymentTransaction.PaymentStatus.PARTIALLY_REFUNDED
                        );

                        return paymentTransactionRepository.save(transaction);
                    })
            );
    }

    /**
     * Get payment transactions for an order
     */
    public Flux<PaymentTransaction> getTransactionsByOrder(String orderId) {
        return TenantContext.getTenantId()
            .flatMapMany(tenantId ->
                paymentTransactionRepository.findByTenantIdAndOrderId(tenantId, orderId)
            );
    }

    /**
     * Get payment transaction by gateway transaction ID
     */
    public Mono<PaymentTransaction> getByGatewayTransactionId(String gatewayTransactionId) {
        return TenantContext.getTenantId()
            .flatMap(tenantId ->
                paymentTransactionRepository.findByGatewayTransactionId(gatewayTransactionId)
                    .filter(tx -> tx.getTenantId().equals(tenantId))
            );
    }

    /**
     * Get payment transactions by status
     */
    public Flux<PaymentTransaction> getTransactionsByStatus(
        PaymentTransaction.PaymentStatus status,
        Pageable pageable
    ) {
        return TenantContext.getTenantId()
            .flatMapMany(tenantId ->
                paymentTransactionRepository.findByTenantIdAndStatus(tenantId, status.name(), pageable)
            );
    }

    /**
     * Get retryable failed transactions
     */
    public Flux<PaymentTransaction> getRetryableTransactions() {
        return TenantContext.getTenantId()
            .flatMapMany(paymentTransactionRepository::findRetryableTransactions);
    }

    /**
     * Increment retry count for a transaction
     */
    public Mono<PaymentTransaction> incrementRetryCount(String transactionId) {
        return TenantContext.getTenantId()
            .flatMap(tenantId ->
                paymentTransactionRepository.findById(transactionId)
                    .filter(tx -> tx.getTenantId().equals(tenantId))
                    .flatMap(transaction -> {
                        transaction.incrementRetryCount();
                        return paymentTransactionRepository.save(transaction);
                    })
            );
    }

    /**
     * Get total transaction amount by status
     */
    public Mono<Double> getTotalAmountByStatus(PaymentTransaction.PaymentStatus status) {
        return TenantContext.getTenantId()
            .flatMap(tenantId ->
                paymentTransactionRepository.sumAmountByTenantIdAndStatus(tenantId, status.name())
            );
    }

    /**
     * Get recent payment transactions
     */
    public Flux<PaymentTransaction> getRecentTransactions(int limit) {
        return TenantContext.getTenantId()
            .flatMapMany(tenantId ->
                paymentTransactionRepository.findRecentByTenantId(tenantId, limit)
            );
    }

    /**
     * Count transactions by status
     */
    public Mono<Long> countByStatus(PaymentTransaction.PaymentStatus status) {
        return TenantContext.getTenantId()
            .flatMap(tenantId ->
                paymentTransactionRepository.countByTenantIdAndStatus(tenantId, status.name())
            );
    }
}
