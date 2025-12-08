package com.retail.domain.gdpr;

import com.retail.domain.cart.PersistedCart;
import com.retail.domain.order.Order;
import com.retail.domain.review.ProductReview;
import com.retail.domain.user.User;
import com.retail.domain.user.UserService;
import com.retail.domain.wishlist.Wishlist;
import com.retail.infrastructure.persistence.PersistedCartRepository;
import com.retail.infrastructure.persistence.ProductReviewRepository;
import com.retail.infrastructure.persistence.UserRepository;
import com.retail.infrastructure.persistence.WishlistRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Service for GDPR data deletion operations.
 * Implements GDPR Article 17 - Right to Erasure ("Right to be Forgotten").
 *
 * Note: Some data may be retained for legal compliance (e.g., order history for tax purposes).
 * Such data is anonymized rather than deleted.
 */
@Service
public class GdprDataDeletionService {

    private static final Logger log = LoggerFactory.getLogger(GdprDataDeletionService.class);

    private final UserService userService;
    private final UserRepository userRepository;
    private final ReactiveMongoTemplate mongoTemplate;
    private final PersistedCartRepository cartRepository;
    private final ProductReviewRepository reviewRepository;
    private final WishlistRepository wishlistRepository;

    // Data retention periods for legal compliance
    private static final int ORDER_RETENTION_YEARS = 7; // Tax/legal requirements

    public GdprDataDeletionService(
            UserService userService,
            UserRepository userRepository,
            ReactiveMongoTemplate mongoTemplate,
            PersistedCartRepository cartRepository,
            ProductReviewRepository reviewRepository,
            WishlistRepository wishlistRepository) {
        this.userService = userService;
        this.userRepository = userRepository;
        this.mongoTemplate = mongoTemplate;
        this.cartRepository = cartRepository;
        this.reviewRepository = reviewRepository;
        this.wishlistRepository = wishlistRepository;
    }

    /**
     * Process a GDPR deletion request for a user.
     * This method:
     * 1. Deletes user's personal data that can be removed
     * 2. Anonymizes data that must be retained for legal reasons
     * 3. Returns a summary of actions taken
     *
     * @param userId The user ID to delete data for
     * @return A deletion result containing summary of actions
     */
    public Mono<DeletionResult> deleteUserData(String userId) {
        log.info("Starting GDPR data deletion for user: {}", userId);

        return userService.findById(userId)
            .switchIfEmpty(Mono.error(new IllegalArgumentException("User not found: " + userId)))
            .flatMap(user -> {
                DeletionResult result = new DeletionResult();
                result.setUserId(userId);
                result.setRequestedAt(Instant.now());
                result.setGdprArticle("Article 17 - Right to Erasure");

                String tenantId = user.getTenantId();

                return Mono.zip(
                    deletePersonalData(user, result),
                    deleteWishlist(userId, tenantId, result),
                    deleteCarts(userId, tenantId, result),
                    anonymizeOrDeleteReviews(userId, tenantId, result),
                    anonymizeOrders(userId, tenantId, result),
                    deleteActivityLog(userId, result)
                ).then(Mono.fromCallable(() -> {
                    result.setCompletedAt(Instant.now());
                    result.setStatus("COMPLETED");
                    log.info("GDPR data deletion completed for user: {}", userId);
                    return result;
                }));
            });
    }

    /**
     * Delete or anonymize user's personal account data.
     */
    private Mono<Void> deletePersonalData(User user, DeletionResult result) {
        // For GDPR compliance, we anonymize the user rather than delete
        // This preserves referential integrity while removing PII

        String userId = user.getId();
        String anonymizedEmail = "deleted_" + userId.substring(0, 8) + "@deleted.local";

        // Clear personal identifiable information
        user.setEmail(anonymizedEmail);
        user.setFirstName("Deleted");
        user.setLastName("User");
        user.setPhone(null);
        user.setAddresses(new ArrayList<>());
        user.setOauth2Provider(null);
        user.setOauth2ProviderId(null);
        user.setPasswordHash(null);
        user.setStatus(com.retail.domain.user.UserStatus.DELETED);

        result.addAction("Personal profile anonymized (name, email, phone, addresses cleared)");

        return userRepository.save(user).then();
    }

    /**
     * Delete user's wishlist completely.
     */
    private Mono<Void> deleteWishlist(String userId, String tenantId, DeletionResult result) {
        return wishlistRepository.findByUserIdAndTenantId(userId, tenantId)
            .flatMap(wishlist -> {
                int itemCount = wishlist.getItems() != null ? wishlist.getItems().size() : 0;
                result.addAction(String.format("Wishlist deleted (%d items)", itemCount));
                return wishlistRepository.delete(wishlist);
            })
            .switchIfEmpty(Mono.defer(() -> {
                result.addAction("No wishlist found");
                return Mono.empty();
            }))
            .then();
    }

    /**
     * Delete user's shopping carts.
     */
    private Mono<Void> deleteCarts(String userId, String tenantId, DeletionResult result) {
        Query query = Query.query(
            Criteria.where("userId").is(userId)
                .and("tenantId").is(tenantId)
        );

        return mongoTemplate.find(query, PersistedCart.class)
            .collectList()
            .flatMap(carts -> {
                if (carts.isEmpty()) {
                    result.addAction("No shopping carts found");
                    return Mono.<Void>empty();
                }
                result.addAction(String.format("Shopping carts deleted (%d carts)", carts.size()));
                return mongoTemplate.remove(query, PersistedCart.class).then();
            })
            .then();
    }

    /**
     * Anonymize or delete user's product reviews.
     * Reviews are anonymized to preserve aggregate ratings while removing PII.
     */
    private Mono<Void> anonymizeOrDeleteReviews(String userId, String tenantId, DeletionResult result) {
        return reviewRepository.findByTenantIdAndUserId(tenantId, userId)
            .collectList()
            .flatMap(reviews -> {
                if (reviews.isEmpty()) {
                    result.addAction("No product reviews found");
                    return Mono.<Void>empty();
                }

                // Anonymize reviews rather than delete to preserve aggregate ratings
                Query updateQuery = Query.query(
                    Criteria.where("userId").is(userId)
                        .and("tenantId").is(tenantId)
                );

                Update update = new Update()
                    .set("userId", "DELETED")
                    .set("displayName", "Deleted User")
                    .set("userEmail", null)
                    .set("anonymizedAt", Instant.now());

                result.addAction(String.format("Product reviews anonymized (%d reviews)", reviews.size()));

                return mongoTemplate.updateMulti(updateQuery, update, ProductReview.class).then();
            })
            .then();
    }

    /**
     * Anonymize orders (cannot delete due to legal/tax requirements).
     * Orders must be retained for 7 years but personal data is removed.
     */
    private Mono<Void> anonymizeOrders(String userId, String tenantId, DeletionResult result) {
        Query query = Query.query(
            Criteria.where("customer.userId").is(userId)
                .and("tenantId").is(tenantId)
        );

        return mongoTemplate.find(query, Order.class)
            .collectList()
            .flatMap(orders -> {
                if (orders.isEmpty()) {
                    result.addAction("No orders found");
                    return Mono.<Void>empty();
                }

                // Anonymize customer data in orders
                Update update = new Update()
                    .set("customer.firstName", "Deleted")
                    .set("customer.lastName", "User")
                    .set("customer.email", "deleted@deleted.local")
                    .set("customer.phone", null)
                    .set("shippingAddress.firstName", "Deleted")
                    .set("shippingAddress.lastName", "User")
                    .set("shippingAddress.phone", null)
                    .set("billingAddress.firstName", "Deleted")
                    .set("billingAddress.lastName", "User")
                    .set("billingAddress.phone", null)
                    .set("customerAnonymizedAt", Instant.now());

                result.addAction(String.format(
                    "Orders anonymized (%d orders) - retained for %d years per legal requirements",
                    orders.size(), ORDER_RETENTION_YEARS
                ));
                result.addRetainedData("Order history",
                    String.format("%d years (tax/legal compliance)", ORDER_RETENTION_YEARS));

                return mongoTemplate.updateMulti(query, update, Order.class).then();
            })
            .then();
    }

    /**
     * Delete user activity log.
     */
    private Mono<Void> deleteActivityLog(String userId, DeletionResult result) {
        Query query = Query.query(Criteria.where("userId").is(userId));

        return mongoTemplate.count(query, "user_activity")
            .flatMap(count -> {
                if (count == 0) {
                    result.addAction("No activity logs found");
                    return Mono.<Void>empty();
                }
                result.addAction(String.format("Activity logs deleted (%d entries)", count));
                return mongoTemplate.remove(query, "user_activity").then();
            })
            .then();
    }

    /**
     * Check if a deletion request can be processed.
     * Some conditions may prevent immediate deletion.
     */
    public Mono<DeletionEligibility> checkDeletionEligibility(String userId) {
        return userService.findById(userId)
            .switchIfEmpty(Mono.error(new IllegalArgumentException("User not found: " + userId)))
            .flatMap(user -> {
                DeletionEligibility eligibility = new DeletionEligibility();
                eligibility.setUserId(userId);
                eligibility.setEligible(true);

                String tenantId = user.getTenantId();

                // Check for pending orders
                Query pendingOrdersQuery = Query.query(
                    Criteria.where("customer.userId").is(userId)
                        .and("tenantId").is(tenantId)
                        .and("status").in("PENDING", "PROCESSING", "SHIPPED")
                );

                return mongoTemplate.count(pendingOrdersQuery, Order.class)
                    .map(pendingCount -> {
                        if (pendingCount > 0) {
                            eligibility.setEligible(false);
                            eligibility.addBlockingReason(String.format(
                                "User has %d pending/processing orders that must be completed or cancelled first",
                                pendingCount
                            ));
                        }

                        eligibility.addInfo("Orders will be anonymized (retained for 7 years per legal requirements)");
                        eligibility.addInfo("Reviews will be anonymized to preserve aggregate ratings");
                        eligibility.addInfo("Personal data (profile, addresses, carts, wishlist) will be deleted");

                        return eligibility;
                    });
            });
    }

    // DTOs

    public static class DeletionResult {
        private String userId;
        private Instant requestedAt;
        private Instant completedAt;
        private String status;
        private String gdprArticle;
        private List<String> actions = new ArrayList<>();
        private List<RetainedDataInfo> retainedData = new ArrayList<>();

        public String getUserId() { return userId; }
        public void setUserId(String userId) { this.userId = userId; }
        public Instant getRequestedAt() { return requestedAt; }
        public void setRequestedAt(Instant requestedAt) { this.requestedAt = requestedAt; }
        public Instant getCompletedAt() { return completedAt; }
        public void setCompletedAt(Instant completedAt) { this.completedAt = completedAt; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        public String getGdprArticle() { return gdprArticle; }
        public void setGdprArticle(String gdprArticle) { this.gdprArticle = gdprArticle; }
        public List<String> getActions() { return actions; }
        public void setActions(List<String> actions) { this.actions = actions; }
        public void addAction(String action) { this.actions.add(action); }
        public List<RetainedDataInfo> getRetainedData() { return retainedData; }
        public void setRetainedData(List<RetainedDataInfo> retainedData) { this.retainedData = retainedData; }
        public void addRetainedData(String dataType, String reason) {
            this.retainedData.add(new RetainedDataInfo(dataType, reason));
        }
    }

    public static class RetainedDataInfo {
        private String dataType;
        private String retentionReason;

        public RetainedDataInfo() {}
        public RetainedDataInfo(String dataType, String retentionReason) {
            this.dataType = dataType;
            this.retentionReason = retentionReason;
        }

        public String getDataType() { return dataType; }
        public void setDataType(String dataType) { this.dataType = dataType; }
        public String getRetentionReason() { return retentionReason; }
        public void setRetentionReason(String retentionReason) { this.retentionReason = retentionReason; }
    }

    public static class DeletionEligibility {
        private String userId;
        private boolean eligible;
        private List<String> blockingReasons = new ArrayList<>();
        private List<String> info = new ArrayList<>();

        public String getUserId() { return userId; }
        public void setUserId(String userId) { this.userId = userId; }
        public boolean isEligible() { return eligible; }
        public void setEligible(boolean eligible) { this.eligible = eligible; }
        public List<String> getBlockingReasons() { return blockingReasons; }
        public void setBlockingReasons(List<String> blockingReasons) { this.blockingReasons = blockingReasons; }
        public void addBlockingReason(String reason) { this.blockingReasons.add(reason); }
        public List<String> getInfo() { return info; }
        public void setInfo(List<String> info) { this.info = info; }
        public void addInfo(String info) { this.info.add(info); }
    }
}
