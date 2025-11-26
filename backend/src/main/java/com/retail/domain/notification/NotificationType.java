package com.retail.domain.notification;

/**
 * Types of notifications sent to users.
 */
public enum NotificationType {
    // Order notifications
    ORDER_CONFIRMATION,
    ORDER_SHIPPED,
    ORDER_DELIVERED,
    ORDER_CANCELLED,
    ORDER_REFUNDED,

    // User account notifications
    WELCOME,
    PASSWORD_RESET,
    EMAIL_VERIFICATION,
    ACCOUNT_UPDATED,

    // Marketing notifications
    PROMOTIONAL,
    NEWSLETTER,
    ABANDONED_CART,

    // Inventory notifications
    BACK_IN_STOCK,
    LOW_STOCK_ALERT,

    // Payment notifications
    PAYMENT_RECEIVED,
    PAYMENT_FAILED,
    REFUND_PROCESSED
}
