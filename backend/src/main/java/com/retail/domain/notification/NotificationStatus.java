package com.retail.domain.notification;

/**
 * Status of notification delivery.
 */
public enum NotificationStatus {
    PENDING,
    SENT,
    DELIVERED,
    FAILED,
    CANCELLED
}
