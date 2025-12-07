package com.retail.domain.cart;

import com.retail.domain.notification.NotificationChannel;
import com.retail.domain.notification.NotificationService;
import com.retail.domain.notification.NotificationType;
import com.retail.domain.user.UserService;
import com.retail.infrastructure.persistence.PersistedCartRepository;
import com.retail.security.tenant.TenantContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;

/**
 * Service for detecting and recovering abandoned carts.
 * Sends reminder notifications to users who have items in their cart
 * but haven't completed checkout within a specified time.
 */
@Service
public class AbandonedCartService {

    private static final Logger logger = LoggerFactory.getLogger(AbandonedCartService.class);

    // Cart is considered abandoned after 1 hour of inactivity
    private static final Duration ABANDONMENT_THRESHOLD = Duration.ofHours(1);

    // Wait 24 hours after abandonment before sending first reminder
    private static final Duration FIRST_REMINDER_DELAY = Duration.ofHours(24);

    // Wait 72 hours after abandonment before sending second reminder
    private static final Duration SECOND_REMINDER_DELAY = Duration.ofHours(72);

    private final PersistedCartRepository persistedCartRepository;
    private final NotificationService notificationService;
    private final UserService userService;

    public AbandonedCartService(
            PersistedCartRepository persistedCartRepository,
            NotificationService notificationService,
            UserService userService) {
        this.persistedCartRepository = persistedCartRepository;
        this.notificationService = notificationService;
        this.userService = userService;
    }

    /**
     * Check for abandoned carts and send reminders.
     * Runs every hour.
     */
    @Scheduled(cron = "0 0 * * * *") // Every hour at minute 0
    public void processAbandonedCarts() {
        logger.info("Starting abandoned cart processing");

        Instant firstReminderCutoff = Instant.now().minus(FIRST_REMINDER_DELAY);
        Instant secondReminderCutoff = Instant.now().minus(SECOND_REMINDER_DELAY);

        // Process first reminders
        persistedCartRepository.findAllAbandonedCartsNotNotified(firstReminderCutoff)
            .flatMap(cart -> sendAbandonmentReminder(cart, 1)
                .then(markCartNotified(cart)))
            .doOnComplete(() -> logger.info("Completed first reminder processing"))
            .subscribe();

        // Process second reminders
        persistedCartRepository.findAllAbandonedCartsForSecondReminder(secondReminderCutoff)
            .flatMap(cart -> sendAbandonmentReminder(cart, 2)
                .then(markSecondReminderSent(cart)))
            .doOnComplete(() -> logger.info("Completed second reminder processing"))
            .subscribe();
    }

    /**
     * Find all carts that have been abandoned (not updated recently) for current tenant.
     *
     * @return Flux of abandoned carts
     */
    public Flux<PersistedCart> findAbandonedCarts() {
        Instant abandonmentCutoff = Instant.now().minus(ABANDONMENT_THRESHOLD);

        return TenantContext.getTenantId()
            .flatMapMany(tenantId ->
                persistedCartRepository.findAbandonedCarts(tenantId, abandonmentCutoff)
                    .filter(cart -> hasItems(cart)));
    }

    /**
     * Find abandoned carts eligible for first reminder.
     *
     * @return Flux of abandoned carts not yet notified
     */
    public Flux<PersistedCart> findCartsForFirstReminder() {
        Instant cutoff = Instant.now().minus(FIRST_REMINDER_DELAY);

        return TenantContext.getTenantId()
            .flatMapMany(tenantId ->
                persistedCartRepository.findAbandonedCartsNotNotified(tenantId, cutoff)
                    .filter(this::hasItems));
    }

    /**
     * Find abandoned carts eligible for second reminder.
     *
     * @return Flux of abandoned carts for second reminder
     */
    public Flux<PersistedCart> findCartsForSecondReminder() {
        Instant cutoff = Instant.now().minus(SECOND_REMINDER_DELAY);

        return TenantContext.getTenantId()
            .flatMapMany(tenantId ->
                persistedCartRepository.findAbandonedCartsForSecondReminder(tenantId, cutoff)
                    .filter(this::hasItems));
    }

    /**
     * Get abandoned cart statistics for a tenant.
     *
     * @return Mono with statistics including count and total value
     */
    public Mono<AbandonedCartStats> getAbandonedCartStats() {
        return TenantContext.getTenantId()
            .flatMap(tenantId -> {
                Instant abandonmentCutoff = Instant.now().minus(ABANDONMENT_THRESHOLD);

                return persistedCartRepository.findAbandonedCarts(tenantId, abandonmentCutoff)
                    .filter(this::hasItems)
                    .collectList()
                    .map(carts -> {
                        long count = carts.size();
                        double totalValue = carts.stream()
                            .mapToDouble(this::calculateCartTotal)
                            .sum();

                        long notifiedCount = carts.stream()
                            .filter(PersistedCart::isAbandonmentNotified)
                            .count();

                        return new AbandonedCartStats(count, totalValue, notifiedCount);
                    });
            });
    }

    /**
     * Send an abandonment reminder email to the cart owner.
     */
    private Mono<Void> sendAbandonmentReminder(PersistedCart persistedCart, int reminderNumber) {
        if (persistedCart.getUserId() == null || persistedCart.getUserId().isEmpty()) {
            // Guest cart - skip notification
            logger.debug("Skipping guest cart: {}", persistedCart.getId());
            return Mono.empty();
        }

        logger.info("Sending abandonment reminder {} for cart {} user {}",
            reminderNumber, persistedCart.getId(), persistedCart.getUserId());

        // Calculate cart total
        double cartTotal = calculateCartTotal(persistedCart);
        int itemCount = getItemCount(persistedCart);

        Map<String, Object> templateData = Map.of(
            "cartId", persistedCart.getId(),
            "itemCount", itemCount,
            "cartTotal", String.format("%.2f", cartTotal),
            "currency", "USD",
            "reminderNumber", reminderNumber
        );

        // Get user to get their email
        return userService.findById(persistedCart.getUserId())
            .contextWrite(TenantContext.withTenantId(persistedCart.getTenantId()))
            .flatMap(user -> notificationService.createNotificationFromTemplate(
                    persistedCart.getUserId(),
                    user.getEmail(),
                    NotificationType.ABANDONED_CART,
                    NotificationChannel.EMAIL,
                    "abandoned-cart-reminder-" + reminderNumber,
                    templateData
                )
                .contextWrite(TenantContext.withTenantId(persistedCart.getTenantId()))
            )
            .doOnSuccess(n -> logger.info("Abandonment notification created: {}", n != null ? n.getId() : "null"))
            .then();
    }

    /**
     * Mark a cart as notified (first reminder sent).
     */
    private Mono<Void> markCartNotified(PersistedCart cart) {
        cart.setAbandonmentNotified(true);
        cart.setAbandonmentNotifiedAt(Instant.now());
        return persistedCartRepository.save(cart).then();
    }

    /**
     * Mark a cart as having received the second reminder.
     */
    private Mono<Void> markSecondReminderSent(PersistedCart cart) {
        cart.setSecondReminderSent(true);
        cart.setSecondReminderSentAt(Instant.now());
        return persistedCartRepository.save(cart).then();
    }

    /**
     * Manually trigger a recovery email for a specific cart.
     *
     * @param cartId Cart ID
     * @return Mono that completes when the email is sent
     */
    public Mono<Void> sendRecoveryEmail(String cartId) {
        return persistedCartRepository.findById(cartId)
            .flatMap(cart -> sendAbandonmentReminder(cart, 0));
    }

    /**
     * Reset abandonment tracking for a cart (e.g., when the cart is updated).
     *
     * @param cart The cart to reset
     * @return Mono with the updated cart
     */
    public Mono<PersistedCart> resetAbandonmentTracking(PersistedCart cart) {
        cart.resetAbandonmentTracking();
        return persistedCartRepository.save(cart);
    }

    /**
     * Check if cart has items.
     */
    private boolean hasItems(PersistedCart persistedCart) {
        return persistedCart.getCart() != null &&
               persistedCart.getCart().getItems() != null &&
               !persistedCart.getCart().getItems().isEmpty();
    }

    /**
     * Calculate cart total value.
     */
    private double calculateCartTotal(PersistedCart persistedCart) {
        if (!hasItems(persistedCart)) {
            return 0.0;
        }
        return persistedCart.getCart().getItems().stream()
            .mapToDouble(item -> item.price().doubleValue() * item.quantity())
            .sum();
    }

    /**
     * Get item count from cart.
     */
    private int getItemCount(PersistedCart persistedCart) {
        if (!hasItems(persistedCart)) {
            return 0;
        }
        return persistedCart.getCart().getItems().size();
    }

    /**
     * Statistics for abandoned carts.
     */
    public record AbandonedCartStats(
            long count,
            double totalValue,
            long notifiedCount
    ) {
        public double getAverageValue() {
            return count > 0 ? totalValue / count : 0;
        }

        public double getNotifiedPercentage() {
            return count > 0 ? (notifiedCount * 100.0 / count) : 0;
        }
    }
}
