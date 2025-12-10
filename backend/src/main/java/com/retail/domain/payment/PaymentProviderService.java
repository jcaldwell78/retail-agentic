package com.retail.domain.payment;

import reactor.core.publisher.Mono;

/**
 * Interface for payment provider implementations.
 */
public interface PaymentProviderService {

    /**
     * Initialize a payment transaction.
     *
     * @param request The payment request
     * @return A Mono containing the payment response
     */
    Mono<PaymentResponse> initiatePayment(PaymentRequest request);

    /**
     * Capture a previously authorized payment.
     *
     * @param transactionId The transaction ID to capture
     * @param amount The amount to capture (may be less than authorized amount)
     * @return A Mono containing the payment response
     */
    Mono<PaymentResponse> capturePayment(String transactionId, java.math.BigDecimal amount);

    /**
     * Verify a payment transaction status.
     *
     * @param transactionId The transaction ID to verify
     * @return A Mono containing the payment response
     */
    Mono<PaymentResponse> verifyPayment(String transactionId);

    /**
     * Refund a payment transaction.
     *
     * @param transactionId The transaction ID to refund
     * @param amount The amount to refund (null for full refund)
     * @param reason The reason for the refund
     * @return A Mono containing the payment response
     */
    Mono<PaymentResponse> refundPayment(String transactionId, java.math.BigDecimal amount, String reason);

    /**
     * Cancel a payment transaction.
     *
     * @param transactionId The transaction ID to cancel
     * @return A Mono containing the payment response
     */
    Mono<PaymentResponse> cancelPayment(String transactionId);

    /**
     * Get the payment provider type.
     *
     * @return The payment provider
     */
    PaymentProvider getProvider();

    /**
     * Check if this provider supports the given payment provider.
     *
     * @param provider The provider to check
     * @return true if supported, false otherwise
     */
    default boolean supports(PaymentProvider provider) {
        return getProvider() == provider;
    }
}