package com.retail.domain.payment.gateway;

import reactor.core.publisher.Mono;

import java.math.BigDecimal;

/**
 * Payment Gateway interface for different payment providers.
 * Implementations handle provider-specific payment processing.
 */
public interface PaymentGateway {

    /**
     * Authorize a payment (create order/authorization).
     *
     * @param request Payment request details
     * @return Payment response with transaction ID and status
     */
    Mono<PaymentResponse> authorizePayment(PaymentRequest request);

    /**
     * Capture a previously authorized payment.
     *
     * @param transactionId Gateway transaction ID
     * @param amount Amount to capture
     * @return Payment response with capture status
     */
    Mono<PaymentResponse> capturePayment(String transactionId, BigDecimal amount);

    /**
     * Refund a captured payment.
     *
     * @param transactionId Gateway transaction ID
     * @param refundAmount Amount to refund
     * @param reason Refund reason
     * @return Payment response with refund status
     */
    Mono<PaymentResponse> refundPayment(String transactionId, BigDecimal refundAmount, String reason);

    /**
     * Get the gateway name/identifier.
     *
     * @return Gateway name (e.g., "PAYPAL", "STRIPE")
     */
    String getGatewayName();

    /**
     * Check if gateway supports recurring payments.
     *
     * @return true if recurring payments are supported
     */
    boolean supportsRecurring();

    /**
     * Check if gateway supports partial refunds.
     *
     * @return true if partial refunds are supported
     */
    boolean supportsPartialRefunds();
}
