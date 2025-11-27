package com.retail.domain.order;

/**
 * Enum representing the payment status of an order.
 */
public enum PaymentStatus {
    /**
     * Payment is pending
     */
    PENDING,

    /**
     * Payment has been successfully processed
     */
    PAID,

    /**
     * Payment processing failed
     */
    FAILED,

    /**
     * Payment has been refunded
     */
    REFUNDED
}
