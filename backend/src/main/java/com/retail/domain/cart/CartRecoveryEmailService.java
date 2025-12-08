package com.retail.domain.cart;

import com.retail.domain.notification.NotificationChannel;
import com.retail.domain.notification.NotificationService;
import com.retail.domain.notification.NotificationType;
import com.retail.domain.user.User;
import com.retail.domain.user.UserService;
import com.retail.infrastructure.persistence.PersistedCartRepository;
import com.retail.security.tenant.TenantContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Year;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Service for sending cart recovery emails with rich product information.
 * Generates template data including product images for abandoned cart notifications.
 */
@Service
public class CartRecoveryEmailService {

    private static final Logger logger = LoggerFactory.getLogger(CartRecoveryEmailService.class);
    private static final BigDecimal FREE_SHIPPING_THRESHOLD = new BigDecimal("50.00");

    @Value("${app.base-url:http://localhost:3000}")
    private String baseUrl;

    @Value("${app.store.name:Our Store}")
    private String storeName;

    private final PersistedCartRepository persistedCartRepository;
    private final NotificationService notificationService;
    private final UserService userService;

    public CartRecoveryEmailService(
            PersistedCartRepository persistedCartRepository,
            NotificationService notificationService,
            UserService userService) {
        this.persistedCartRepository = persistedCartRepository;
        this.notificationService = notificationService;
        this.userService = userService;
    }

    /**
     * Send a cart recovery email with product images and details.
     *
     * @param cartId     The ID of the abandoned cart
     * @param discountCode Optional discount code to include
     * @param expiresIn  Optional expiration message for urgency
     * @return Mono that completes when the email is sent
     */
    public Mono<Void> sendRecoveryEmail(String cartId, String discountCode, String expiresIn) {
        return persistedCartRepository.findById(cartId)
            .flatMap(persistedCart -> {
                if (persistedCart.getUserId() == null || persistedCart.getUserId().isEmpty()) {
                    logger.debug("Skipping guest cart: {}", cartId);
                    return Mono.empty();
                }

                return userService.findById(persistedCart.getUserId())
                    .contextWrite(TenantContext.withTenantId(persistedCart.getTenantId()))
                    .flatMap(user -> sendEmailWithProductDetails(persistedCart, user, discountCode, expiresIn));
            });
    }

    /**
     * Send recovery email for a specific cart with product images.
     */
    private Mono<Void> sendEmailWithProductDetails(
            PersistedCart persistedCart,
            User user,
            String discountCode,
            String expiresIn) {

        Cart cart = persistedCart.getCart();
        if (cart == null || cart.getItems() == null || cart.getItems().isEmpty()) {
            logger.debug("Cart {} has no items, skipping email", persistedCart.getId());
            return Mono.empty();
        }

        Map<String, Object> templateData = buildTemplateData(persistedCart, user, cart, discountCode, expiresIn);

        String subject = buildSubject(cart, discountCode);

        logger.info("Sending cart recovery email for cart {} to user {}",
            persistedCart.getId(), user.getId());

        return notificationService.createNotificationFromTemplate(
                user.getId(),
                user.getEmail(),
                NotificationType.ABANDONED_CART,
                NotificationChannel.EMAIL,
                "abandoned-cart",
                templateData
            )
            .contextWrite(TenantContext.withTenantId(persistedCart.getTenantId()))
            .doOnSuccess(n -> logger.info("Cart recovery email notification created: {}",
                n != null ? n.getId() : "null"))
            .then();
    }

    /**
     * Build template data with all product information including images.
     */
    private Map<String, Object> buildTemplateData(
            PersistedCart persistedCart,
            User user,
            Cart cart,
            String discountCode,
            String expiresIn) {

        Map<String, Object> data = new HashMap<>();

        // Customer info
        data.put("customerName", getCustomerName(user));

        // Cart items with images
        List<Map<String, Object>> itemsData = new ArrayList<>();
        for (Cart.CartItem item : cart.getItems()) {
            Map<String, Object> itemData = new HashMap<>();
            itemData.put("productName", item.name());
            itemData.put("productId", item.productId());
            itemData.put("sku", item.sku());
            itemData.put("quantity", item.quantity());
            itemData.put("price", formatPrice(item.price()));
            itemData.put("subtotal", formatPrice(item.subtotal()));

            // Include image URL - use placeholder if not available
            String imageUrl = item.imageUrl();
            if (imageUrl != null && !imageUrl.isEmpty()) {
                itemData.put("imageUrl", imageUrl);
            }

            // Include attributes if present
            if (item.attributes() != null && !item.attributes().isEmpty()) {
                itemData.put("attributes", item.attributes());
            }

            itemsData.add(itemData);
        }
        data.put("items", itemsData);

        // Cart summary
        Cart.CartSummary summary = cart.getSummary();
        BigDecimal subtotal = summary != null ? summary.subtotal() : calculateSubtotal(cart);
        BigDecimal shipping = summary != null ? summary.shipping() : BigDecimal.ZERO;
        BigDecimal tax = summary != null ? summary.tax() : BigDecimal.ZERO;
        BigDecimal total = summary != null ? summary.total() : subtotal;

        data.put("itemCount", cart.getItems().size());
        data.put("subtotal", formatPrice(subtotal));
        data.put("shipping", formatPrice(shipping));
        data.put("estimatedTotal", formatPrice(total));

        // Free shipping check
        boolean freeShipping = subtotal.compareTo(FREE_SHIPPING_THRESHOLD) >= 0;
        data.put("freeShipping", freeShipping);

        // Discount code if provided
        if (discountCode != null && !discountCode.isEmpty()) {
            data.put("discountCode", discountCode);
            // Calculate estimated discount (10% for example)
            BigDecimal discountAmount = subtotal.multiply(new BigDecimal("0.10"))
                .setScale(2, RoundingMode.HALF_UP);
            data.put("discount", formatPrice(discountAmount));
        }

        // Expiration urgency
        if (expiresIn != null && !expiresIn.isEmpty()) {
            data.put("expiresIn", expiresIn);
        }

        // URLs
        data.put("cartUrl", baseUrl + "/cart");
        data.put("supportUrl", baseUrl + "/support");
        data.put("unsubscribeUrl", baseUrl + "/unsubscribe?userId=" + user.getId());
        data.put("preferencesUrl", baseUrl + "/account/preferences");

        // Store info
        data.put("storeName", storeName);
        data.put("currentYear", Year.now().getValue());

        return data;
    }

    /**
     * Build email subject line.
     */
    private String buildSubject(Cart cart, String discountCode) {
        int itemCount = cart.getItems().size();
        String itemText = itemCount == 1 ? "item" : "items";

        if (discountCode != null && !discountCode.isEmpty()) {
            return String.format("Complete your order and save! %d %s waiting", itemCount, itemText);
        }
        return String.format("You left %d %s in your cart!", itemCount, itemText);
    }

    /**
     * Get customer display name.
     */
    private String getCustomerName(User user) {
        if (user.getFirstName() != null && !user.getFirstName().isEmpty()) {
            return user.getFirstName();
        }
        return "Valued Customer";
    }

    /**
     * Format price as string with 2 decimal places.
     */
    private String formatPrice(BigDecimal price) {
        if (price == null) {
            return "0.00";
        }
        return price.setScale(2, RoundingMode.HALF_UP).toString();
    }

    /**
     * Calculate subtotal from cart items.
     */
    private BigDecimal calculateSubtotal(Cart cart) {
        return cart.getItems().stream()
            .map(Cart.CartItem::subtotal)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    /**
     * Send a reminder email series (first, second, third reminder).
     *
     * @param cartId        Cart ID
     * @param reminderNumber Which reminder this is (1, 2, or 3)
     * @return Mono that completes when the email is sent
     */
    public Mono<Void> sendReminderEmail(String cartId, int reminderNumber) {
        // Different strategies for each reminder
        String discountCode = null;
        String expiresIn = null;

        switch (reminderNumber) {
            case 1:
                // First reminder - gentle nudge
                expiresIn = "48 hours";
                break;
            case 2:
                // Second reminder - add urgency and small discount
                discountCode = "COMEBACK10";
                expiresIn = "24 hours";
                break;
            case 3:
                // Third reminder - last chance with bigger discount
                discountCode = "LASTCHANCE15";
                expiresIn = "12 hours";
                break;
            default:
                // Just send without extras
                break;
        }

        return sendRecoveryEmail(cartId, discountCode, expiresIn);
    }
}
