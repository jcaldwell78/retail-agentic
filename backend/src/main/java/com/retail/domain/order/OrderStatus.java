package com.retail.domain.order;

/**
 * Enum representing the various states of an order.
 */
public enum OrderStatus {
    /**
     * Order has been created but not yet processed
     */
    PENDING,

    /**
     * Order is being prepared/processed
     */
    PROCESSING,

    /**
     * Order has been shipped to customer
     */
    SHIPPED,

    /**
     * Order has been delivered to customer
     */
    DELIVERED,

    /**
     * Order has been cancelled
     */
    CANCELLED
}
