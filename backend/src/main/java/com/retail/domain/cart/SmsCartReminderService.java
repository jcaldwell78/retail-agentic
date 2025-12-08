package com.retail.domain.cart;

import com.retail.domain.notification.Notification;
import com.retail.domain.notification.NotificationChannel;
import com.retail.domain.notification.NotificationService;
import com.retail.domain.notification.NotificationType;
import com.retail.domain.user.User;
import com.retail.domain.user.UserService;
import com.retail.security.tenant.TenantContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;

/**
 * Service for sending SMS cart abandonment reminders.
 * Requires explicit user opt-in for TCPA/GDPR compliance.
 */
@Service
public class SmsCartReminderService {

    private static final Logger logger = LoggerFactory.getLogger(SmsCartReminderService.class);

    // Default reminder delay: 1 hour after cart becomes abandoned
    private static final Duration DEFAULT_REMINDER_DELAY = Duration.ofHours(1);

    // Maximum cart age for SMS reminders (don't send for very old carts)
    private static final Duration MAX_CART_AGE = Duration.ofHours(48);

    private final AbandonedCartService abandonedCartService;
    private final UserService userService;
    private final NotificationService notificationService;

    public SmsCartReminderService(
            AbandonedCartService abandonedCartService,
            UserService userService,
            NotificationService notificationService) {
        this.abandonedCartService = abandonedCartService;
        this.userService = userService;
        this.notificationService = notificationService;
    }

    /**
     * Process abandoned carts and send SMS reminders to opted-in users.
     *
     * @return Flux of sent notifications
     */
    public Flux<Notification> processAbandonedCartSmsReminders() {
        return TenantContext.getTenantId()
            .flatMapMany(tenantId -> {
                logger.info("Processing SMS cart reminders for tenant: {}", tenantId);

                Instant cutoffTime = Instant.now().minus(DEFAULT_REMINDER_DELAY);
                Instant maxAgeTime = Instant.now().minus(MAX_CART_AGE);

                return abandonedCartService.findAbandonedCarts()
                    .filter(cart -> cart.getUserId() != null)
                    .filter(cart -> {
                        Instant updatedAt = cart.getUpdatedAt();
                        // Cart must be older than reminder delay but not too old
                        return updatedAt.isBefore(cutoffTime) && updatedAt.isAfter(maxAgeTime);
                    })
                    .flatMap(cart -> sendSmsReminderIfOptedIn(cart, tenantId));
            });
    }

    /**
     * Send SMS reminder if user has opted in.
     */
    private Mono<Notification> sendSmsReminderIfOptedIn(PersistedCart cart, String tenantId) {
        return userService.findById(cart.getUserId())
            .filter(this::isSmsCartReminderEnabled)
            .filter(this::hasValidPhoneNumber)
            .flatMap(user -> {
                logger.info("Sending SMS cart reminder to user: {}", user.getId());
                return createSmsReminder(user, cart, tenantId);
            })
            .doOnNext(notification ->
                logger.info("SMS cart reminder sent: notificationId={}", notification.getId())
            );
    }

    /**
     * Check if user has SMS cart reminders enabled.
     */
    private boolean isSmsCartReminderEnabled(User user) {
        var prefs = user.getNotificationPreferences();
        return prefs != null &&
               prefs.isSmsConsentGiven() &&
               prefs.isSmsCartReminders();
    }

    /**
     * Check if user has a valid phone number.
     */
    private boolean hasValidPhoneNumber(User user) {
        String phone = user.getPhone();
        return phone != null && !phone.isBlank() && phone.length() >= 10;
    }

    /**
     * Create SMS notification for abandoned cart.
     */
    private Mono<Notification> createSmsReminder(User user, PersistedCart cart, String tenantId) {
        // Build SMS content - access items and total from embedded Cart object
        int itemCount = getItemCount(cart);
        java.math.BigDecimal total = getCartTotal(cart);
        String content = buildSmsContent(user, itemCount, total);

        Map<String, Object> templateData = Map.of(
            "userName", user.getFirstName(),
            "itemCount", itemCount,
            "cartTotal", total,
            "cartId", cart.getId()
        );

        return notificationService.createNotification(
            user.getId(),
            user.getEmail(), // Still include email for tracking
            NotificationType.ABANDONED_CART,
            NotificationChannel.SMS,
            null, // No subject for SMS
            content,
            templateData
        );
    }

    /**
     * Build SMS message content.
     * Keep it short for SMS (160 chars or less for single SMS).
     */
    private String buildSmsContent(User user, int itemCount, java.math.BigDecimal total) {
        String firstName = user.getFirstName();
        if (firstName.length() > 10) {
            firstName = firstName.substring(0, 10);
        }

        // Format: "Hi John! You left 3 items ($49.99) in your cart. Complete your order: example.com/cart"
        return String.format(
            "Hi %s! You left %d item%s ($%.2f) in your cart. Complete your order now!",
            firstName,
            itemCount,
            itemCount == 1 ? "" : "s",
            total
        );
    }

    /**
     * Update user's SMS cart reminder opt-in status.
     *
     * @param userId User ID
     * @param optIn Whether to opt in (true) or opt out (false)
     * @param consentSource Source of consent (e.g., "checkout", "account-settings")
     * @return Updated user
     */
    public Mono<User> updateSmsCartReminderOptIn(String userId, boolean optIn, String consentSource) {
        return userService.findById(userId)
            .flatMap(user -> {
                var prefs = user.getNotificationPreferences();

                if (optIn) {
                    // User is opting in
                    if (!prefs.isSmsConsentGiven()) {
                        prefs.recordSmsConsent(consentSource);
                    }
                    prefs.setSmsCartReminders(true);
                    logger.info("User {} opted in to SMS cart reminders (source: {})",
                        userId, consentSource);
                } else {
                    // User is opting out
                    prefs.setSmsCartReminders(false);
                    // Note: We don't revoke SMS consent entirely, just this preference
                    logger.info("User {} opted out of SMS cart reminders", userId);
                }

                return userService.updateProfile(userId, user);
            });
    }

    /**
     * Get SMS opt-in status for a user.
     */
    public Mono<SmsOptInStatus> getSmsOptInStatus(String userId) {
        return userService.findById(userId)
            .map(user -> {
                var prefs = user.getNotificationPreferences();
                return new SmsOptInStatus(
                    prefs.isSmsConsentGiven(),
                    prefs.isSmsCartReminders(),
                    prefs.getSmsConsentTimestamp(),
                    prefs.getSmsConsentSource(),
                    hasValidPhoneNumber(user)
                );
            })
            .defaultIfEmpty(new SmsOptInStatus(false, false, null, null, false));
    }

    /**
     * SMS opt-in status DTO.
     */
    public record SmsOptInStatus(
        boolean consentGiven,
        boolean cartRemindersEnabled,
        Instant consentTimestamp,
        String consentSource,
        boolean hasValidPhone
    ) {
        public boolean canReceiveSmsReminders() {
            return consentGiven && cartRemindersEnabled && hasValidPhone;
        }
    }

    /**
     * Get count of users opted in to SMS cart reminders.
     */
    public Mono<Long> getOptedInUserCount() {
        // This would need a repository method in production
        // For now, return placeholder
        return Mono.just(0L);
    }

    /**
     * Get item count from persisted cart.
     */
    private int getItemCount(PersistedCart persistedCart) {
        if (persistedCart.getCart() == null ||
            persistedCart.getCart().getItems() == null) {
            return 0;
        }
        return persistedCart.getCart().getItems().size();
    }

    /**
     * Get cart total from persisted cart.
     */
    private java.math.BigDecimal getCartTotal(PersistedCart persistedCart) {
        if (persistedCart.getCart() == null ||
            persistedCart.getCart().getSummary() == null) {
            return java.math.BigDecimal.ZERO;
        }
        return persistedCart.getCart().getSummary().total();
    }
}
