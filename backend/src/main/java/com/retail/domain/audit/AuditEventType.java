package com.retail.domain.audit;

/**
 * Types of audit events tracked in the system.
 */
public enum AuditEventType {
    // Authentication events
    USER_LOGIN,
    USER_LOGOUT,
    USER_LOGIN_FAILED,
    USER_REGISTRATION,
    PASSWORD_CHANGE,
    PASSWORD_RESET,

    // Authorization events
    ACCESS_DENIED,
    PERMISSION_GRANTED,
    PERMISSION_REVOKED,

    // Product events
    PRODUCT_CREATED,
    PRODUCT_UPDATED,
    PRODUCT_DELETED,
    PRODUCT_PUBLISHED,
    PRODUCT_UNPUBLISHED,

    // Order events
    ORDER_CREATED,
    ORDER_UPDATED,
    ORDER_CANCELLED,
    ORDER_FULFILLED,
    ORDER_REFUNDED,

    // Inventory events
    INVENTORY_UPDATED,
    INVENTORY_LOW_STOCK,
    INVENTORY_RECONCILIATION,

    // User management events
    USER_CREATED,
    USER_UPDATED,
    USER_DELETED,
    USER_ROLE_CHANGED,

    // Tenant management events
    TENANT_CREATED,
    TENANT_UPDATED,
    TENANT_SETTINGS_CHANGED,
    TENANT_BRANDING_CHANGED,

    // Payment events
    PAYMENT_PROCESSED,
    PAYMENT_FAILED,
    REFUND_PROCESSED,
    REFUND_FAILED,

    // Search events
    SEARCH_PERFORMED,
    SEARCH_ZERO_RESULTS,

    // Security events
    SUSPICIOUS_ACTIVITY,
    RATE_LIMIT_EXCEEDED,
    SECURITY_VIOLATION,

    // System events
    MIGRATION_EXECUTED,
    CONFIGURATION_CHANGED,
    DATA_EXPORT,
    DATA_IMPORT
}
