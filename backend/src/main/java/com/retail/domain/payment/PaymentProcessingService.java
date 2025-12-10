package com.retail.domain.payment;

import com.retail.domain.payment.gateway.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;
import reactor.util.retry.Retry;

import java.math.BigDecimal;
import java.time.Duration;

/**
 * Service for processing payments through different gateways.
 * Handles payment authorization, capture, and retry logic.
 */
@Service
public class PaymentProcessingService {

    private static final Logger logger = LoggerFactory.getLogger(PaymentProcessingService.class);

    private static final int MAX_RETRY_ATTEMPTS = 3;
    private static final Duration RETRY_BACKOFF = Duration.ofSeconds(2);

    private final PaymentService paymentService;
    private final PayPalGatewayService payPalGatewayService;

    public PaymentProcessingService(
        PaymentService paymentService,
        PayPalGatewayService payPalGatewayService
    ) {
        this.paymentService = paymentService;
        this.payPalGatewayService = payPalGatewayService;
    }

    /**
     * Process a payment using the specified gateway.
     *
     * @param orderId Order ID
     * @param amount Payment amount
     * @param currency Currency code
     * @param paymentMethod Payment method
     * @param customerEmail Customer email
     * @return Processed payment transaction
     */
    public Mono<PaymentTransaction> processPayment(
        String orderId,
        BigDecimal amount,
        String currency,
        PaymentTransaction.PaymentMethod paymentMethod,
        String customerEmail
    ) {
        logger.info("Processing payment for order: {} amount: {} {}", orderId, amount, currency);

        // Determine gateway based on payment method
        PaymentGateway gateway = getGatewayForMethod(paymentMethod);

        // Create gateway payment request
        com.retail.domain.payment.gateway.PaymentRequest request = new com.retail.domain.payment.gateway.PaymentRequest();
        request.setOrderId(orderId);
        request.setAmount(amount);
        request.setCurrency(currency);
        request.setCustomerEmail(customerEmail);
        request.setDescription("Payment for order " + orderId);

        // Create transaction record
        return paymentService.createTransaction(
                orderId,
                amount,
                currency,
                paymentMethod,
                gateway.getGatewayName()
            )
            .flatMap(transaction ->
                // Authorize payment with gateway
                authorizePaymentWithRetry(gateway, request, transaction)
            );
    }

    /**
     * Authorize payment with automatic retry on transient failures.
     */
    private Mono<PaymentTransaction> authorizePaymentWithRetry(
        PaymentGateway gateway,
        com.retail.domain.payment.gateway.PaymentRequest request,
        PaymentTransaction transaction
    ) {
        return gateway.authorizePayment(request)
            .retryWhen(Retry.backoff(MAX_RETRY_ATTEMPTS, RETRY_BACKOFF)
                .filter(this::isRetryableError)
                .doBeforeRetry(retrySignal ->
                    logger.warn("Retrying payment authorization, attempt: {}",
                        retrySignal.totalRetries() + 1)
                )
            )
            .flatMap(response -> {
                if (response.isSuccess()) {
                    // Update transaction with gateway response
                    return paymentService.updateStatus(
                        transaction.getId(),
                        response.getStatus(),
                        response.getTransactionId()
                    );
                } else {
                    // Mark as failed
                    return paymentService.markFailed(
                        transaction.getId(),
                        response.getErrorCode(),
                        response.getMessage()
                    );
                }
            })
            .onErrorResume(error -> {
                logger.error("Payment authorization failed after retries", error);
                return paymentService.markFailed(
                    transaction.getId(),
                    "AUTHORIZATION_FAILED",
                    "Payment authorization failed: " + error.getMessage()
                );
            });
    }

    /**
     * Capture a previously authorized payment.
     *
     * @param transactionId Internal transaction ID
     * @param amount Amount to capture
     * @return Updated payment transaction
     */
    public Mono<PaymentTransaction> capturePayment(String transactionId, BigDecimal amount) {
        logger.info("Capturing payment: {} amount: {}", transactionId, amount);

        return paymentService.getTransactionsByOrder(transactionId)
            .next() // Get first transaction
            .flatMap(transaction -> {
                PaymentGateway gateway = getGatewayForName(transaction.getGateway());

                return gateway.capturePayment(transaction.getGatewayTransactionId(), amount)
                    .flatMap(response -> {
                        if (response.isSuccess()) {
                            return paymentService.updateStatus(
                                transaction.getId(),
                                PaymentTransaction.PaymentStatus.SUCCESS,
                                response.getTransactionId()
                            );
                        } else {
                            return paymentService.markFailed(
                                transaction.getId(),
                                response.getErrorCode(),
                                response.getMessage()
                            );
                        }
                    });
            });
    }

    /**
     * Process a refund for a payment.
     *
     * @param transactionId Internal transaction ID
     * @param refundAmount Amount to refund
     * @param reason Refund reason
     * @return Updated payment transaction
     */
    public Mono<PaymentTransaction> processRefund(
        String transactionId,
        BigDecimal refundAmount,
        String reason
    ) {
        logger.info("Processing refund: {} amount: {} reason: {}",
            transactionId, refundAmount, reason);

        return paymentService.getTransactionsByOrder(transactionId)
            .next()
            .flatMap(transaction -> {
                PaymentGateway gateway = getGatewayForName(transaction.getGateway());

                if (!gateway.supportsPartialRefunds() &&
                    refundAmount.compareTo(transaction.getAmount()) < 0) {
                    return Mono.error(new IllegalArgumentException(
                        "Gateway does not support partial refunds"));
                }

                return gateway.refundPayment(
                        transaction.getGatewayTransactionId(),
                        refundAmount,
                        reason
                    )
                    .flatMap(response -> {
                        if (response.isSuccess()) {
                            return paymentService.refund(
                                transaction.getId(),
                                refundAmount,
                                reason
                            );
                        } else {
                            return Mono.error(new PaymentGatewayException(
                                "Refund failed: " + response.getMessage(),
                                response.getErrorCode()
                            ));
                        }
                    });
            });
    }

    /**
     * Retry failed payments that are eligible for retry.
     *
     * @param transactionId Transaction ID to retry
     * @return Updated payment transaction
     */
    public Mono<PaymentTransaction> retryFailedPayment(String transactionId) {
        logger.info("Retrying failed payment: {}", transactionId);

        return paymentService.getTransactionsByOrder(transactionId)
            .next()
            .flatMap(transaction -> {
                if (transaction.getStatus() != PaymentTransaction.PaymentStatus.FAILED) {
                    return Mono.error(new IllegalStateException(
                        "Can only retry failed payments"));
                }

                if (transaction.getRetryCount() >= MAX_RETRY_ATTEMPTS) {
                    return Mono.error(new IllegalStateException(
                        "Maximum retry attempts exceeded"));
                }

                PaymentGateway gateway = getGatewayForName(transaction.getGateway());

                com.retail.domain.payment.gateway.PaymentRequest request = new com.retail.domain.payment.gateway.PaymentRequest();
                request.setOrderId(transaction.getOrderId());
                request.setAmount(transaction.getAmount());
                request.setCurrency(transaction.getCurrency());

                return paymentService.incrementRetryCount(transaction.getId())
                    .flatMap(updatedTx ->
                        gateway.authorizePayment(request)
                            .flatMap(response -> {
                                if (response.isSuccess()) {
                                    return paymentService.updateStatus(
                                        updatedTx.getId(),
                                        response.getStatus(),
                                        response.getTransactionId()
                                    );
                                } else {
                                    return paymentService.markFailed(
                                        updatedTx.getId(),
                                        response.getErrorCode(),
                                        response.getMessage()
                                    );
                                }
                            })
                    );
            });
    }

    /**
     * Get appropriate payment gateway for payment method.
     */
    private PaymentGateway getGatewayForMethod(PaymentTransaction.PaymentMethod method) {
        // For now, all methods use PayPal
        // In production, route to different gateways based on method
        return payPalGatewayService;
    }

    /**
     * Get payment gateway by name.
     */
    private PaymentGateway getGatewayForName(String gatewayName) {
        // For now, only PayPal is supported
        // In production, maintain a registry of gateways
        if ("PAYPAL".equals(gatewayName)) {
            return payPalGatewayService;
        }
        throw new IllegalArgumentException("Unknown gateway: " + gatewayName);
    }

    /**
     * Determine if an error is retryable.
     */
    private boolean isRetryableError(Throwable error) {
        // Retry on network errors, timeouts, and temporary gateway issues
        // Don't retry on validation errors or permanent failures
        if (error instanceof PaymentGatewayException) {
            PaymentGatewayException gatewayError = (PaymentGatewayException) error;
            String errorCode = gatewayError.getErrorCode();
            return errorCode != null &&
                   (errorCode.contains("TIMEOUT") ||
                    errorCode.contains("NETWORK") ||
                    errorCode.contains("TEMPORARY"));
        }
        return false;
    }
}
