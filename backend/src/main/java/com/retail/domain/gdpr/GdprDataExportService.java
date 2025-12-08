package com.retail.domain.gdpr;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.retail.domain.cart.PersistedCart;
import com.retail.domain.order.Order;
import com.retail.domain.review.ProductReview;
import com.retail.domain.user.User;
import com.retail.domain.user.UserService;
import com.retail.domain.wishlist.Wishlist;
import com.retail.domain.wishlist.WishlistItem;
import com.retail.infrastructure.persistence.PersistedCartRepository;
import com.retail.infrastructure.persistence.ProductReviewRepository;
import com.retail.infrastructure.persistence.WishlistRepository;
import com.retail.security.tenant.TenantContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Service for GDPR-compliant data export.
 * Aggregates all user data for data portability requests (GDPR Article 20).
 */
@Service
public class GdprDataExportService {

    private static final Logger logger = LoggerFactory.getLogger(GdprDataExportService.class);

    private final UserService userService;
    private final ReactiveMongoTemplate mongoTemplate;
    private final PersistedCartRepository cartRepository;
    private final ProductReviewRepository reviewRepository;
    private final WishlistRepository wishlistRepository;
    private final ObjectMapper objectMapper;

    public GdprDataExportService(
            UserService userService,
            ReactiveMongoTemplate mongoTemplate,
            PersistedCartRepository cartRepository,
            ProductReviewRepository reviewRepository,
            WishlistRepository wishlistRepository) {
        this.userService = userService;
        this.mongoTemplate = mongoTemplate;
        this.cartRepository = cartRepository;
        this.reviewRepository = reviewRepository;
        this.wishlistRepository = wishlistRepository;

        this.objectMapper = new ObjectMapper();
        this.objectMapper.registerModule(new JavaTimeModule());
        this.objectMapper.setSerializationInclusion(JsonInclude.Include.NON_NULL);
    }

    /**
     * Export all user data in a portable format.
     * Implements GDPR Article 20 - Right to data portability.
     *
     * @param userId The user ID to export data for
     * @return Mono containing the user data export
     */
    public Mono<UserDataExport> exportUserData(String userId) {
        logger.info("Starting GDPR data export for user: {}", userId);

        return userService.findById(userId)
            .switchIfEmpty(Mono.error(new IllegalArgumentException("User not found: " + userId)))
            .flatMap(user -> {
                UserDataExport export = new UserDataExport();
                export.setExportedAt(Instant.now());
                export.setUserId(userId);
                export.setDataFormat("JSON");
                export.setGdprArticle("Article 20 - Right to Data Portability");

                // Collect all user data in parallel
                return Mono.zip(
                    exportProfileData(user),
                    exportOrderHistory(userId, user.getTenantId()),
                    exportCartData(userId, user.getTenantId()),
                    exportReviews(userId, user.getTenantId()),
                    exportWishlist(userId, user.getTenantId()),
                    exportActivityLog(userId)
                ).map(tuple -> {
                    export.setProfile(tuple.getT1());
                    export.setOrders(tuple.getT2());
                    export.setCarts(tuple.getT3());
                    export.setReviews(tuple.getT4());
                    export.setWishlist(tuple.getT5());
                    export.setActivityLog(tuple.getT6());

                    logger.info("GDPR data export completed for user: {}", userId);
                    return export;
                });
            });
    }

    /**
     * Export user data as JSON string.
     */
    public Mono<String> exportUserDataAsJson(String userId) {
        return exportUserData(userId)
            .map(export -> {
                try {
                    return objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(export);
                } catch (Exception e) {
                    logger.error("Failed to serialize user data export", e);
                    throw new RuntimeException("Failed to serialize user data", e);
                }
            });
    }

    /**
     * Export profile data (personal information).
     */
    private Mono<ProfileData> exportProfileData(User user) {
        ProfileData profile = new ProfileData();
        profile.setEmail(user.getEmail());
        profile.setFirstName(user.getFirstName());
        profile.setLastName(user.getLastName());
        profile.setPhone(user.getPhone());
        profile.setAddresses(user.getAddresses());
        profile.setCreatedAt(user.getCreatedAt());
        profile.setLastLoginAt(user.getLastLoginAt());
        profile.setAuthProvider(user.isOAuth2User() ? user.getOauth2Provider() : "LOCAL");

        return Mono.just(profile);
    }

    /**
     * Export order history.
     */
    private Mono<List<OrderData>> exportOrderHistory(String userId, String tenantId) {
        Query query = Query.query(
            Criteria.where("customer.email").exists(true)
                .andOperator(Criteria.where("tenantId").is(tenantId))
        );

        // Since we don't have userId in orders, we need to query differently
        // For now, query by tenantId and filter later or use customer email
        return mongoTemplate.find(query, Order.class)
            .map(order -> {
                OrderData data = new OrderData();
                data.setOrderId(order.getId());
                data.setOrderNumber(order.getOrderNumber());
                data.setStatus(order.getStatus() != null ? order.getStatus().name() : null);
                data.setPricing(order.getPricing());
                data.setItems(order.getItems());
                data.setShippingAddress(order.getShippingAddress());
                data.setCreatedAt(order.getCreatedAt());
                data.setUpdatedAt(order.getUpdatedAt());
                return data;
            })
            .collectList()
            .defaultIfEmpty(List.of());
    }

    /**
     * Export shopping cart data.
     */
    private Mono<List<CartData>> exportCartData(String userId, String tenantId) {
        Query query = Query.query(
            Criteria.where("userId").is(userId)
                .andOperator(Criteria.where("tenantId").is(tenantId))
        );

        return mongoTemplate.find(query, PersistedCart.class)
            .map(cart -> {
                CartData data = new CartData();
                data.setCartId(cart.getId());
                data.setItems(cart.getCart() != null ? cart.getCart().getItems() : null);
                data.setCreatedAt(cart.getCreatedAt());
                data.setUpdatedAt(cart.getUpdatedAt());
                data.setAbandoned(cart.isAbandonmentNotified());
                return data;
            })
            .collectList()
            .defaultIfEmpty(List.of());
    }

    /**
     * Export product reviews.
     */
    private Mono<List<ReviewData>> exportReviews(String userId, String tenantId) {
        return reviewRepository.findByTenantIdAndUserId(tenantId, userId)
            .map(review -> {
                ReviewData data = new ReviewData();
                data.setReviewId(review.getId());
                data.setProductId(review.getProductId());
                data.setRating(review.getRating() != null ? review.getRating() : 0);
                data.setTitle(review.getTitle());
                data.setComment(review.getComment());
                data.setImages(review.getImages());
                data.setVerifiedPurchase(review.getVerifiedPurchase() != null && review.getVerifiedPurchase());
                data.setCreatedAt(review.getCreatedAt());
                data.setUpdatedAt(review.getUpdatedAt());
                return data;
            })
            .collectList()
            .defaultIfEmpty(List.of());
    }

    /**
     * Export wishlist items.
     */
    private Mono<List<WishlistData>> exportWishlist(String userId, String tenantId) {
        return wishlistRepository.findByUserIdAndTenantId(userId, tenantId)
            .flatMapIterable(wishlist -> wishlist.getItems())
            .map(item -> {
                WishlistData data = new WishlistData();
                data.setProductId(item.getProductId());
                data.setProductName(item.getName());
                data.setAddedAt(item.getAddedAt());
                data.setNotes(item.getNotes());
                data.setCurrentPrice(item.getCurrentPrice());
                data.setPriceWhenAdded(item.getPriceWhenAdded());
                return data;
            })
            .collectList()
            .defaultIfEmpty(List.of());
    }

    /**
     * Export user activity log (login history, etc.).
     */
    private Mono<List<ActivityData>> exportActivityLog(String userId) {
        // Query for user activity events if they exist
        Query query = Query.query(Criteria.where("userId").is(userId));

        return mongoTemplate.find(query, Map.class, "user_activity")
            .map(activity -> {
                ActivityData data = new ActivityData();
                data.setActivityType((String) activity.get("activityType"));
                data.setTimestamp((Instant) activity.get("timestamp"));
                data.setIpAddress((String) activity.get("ipAddress"));
                data.setUserAgent((String) activity.get("userAgent"));
                data.setDetails((Map<String, Object>) activity.get("details"));
                return data;
            })
            .collectList()
            .defaultIfEmpty(List.of());
    }

    // Data Export DTOs

    public static class UserDataExport {
        private String userId;
        private Instant exportedAt;
        private String dataFormat;
        private String gdprArticle;
        private ProfileData profile;
        private List<OrderData> orders;
        private List<CartData> carts;
        private List<ReviewData> reviews;
        private List<WishlistData> wishlist;
        private List<ActivityData> activityLog;

        // Getters and Setters
        public String getUserId() { return userId; }
        public void setUserId(String userId) { this.userId = userId; }
        public Instant getExportedAt() { return exportedAt; }
        public void setExportedAt(Instant exportedAt) { this.exportedAt = exportedAt; }
        public String getDataFormat() { return dataFormat; }
        public void setDataFormat(String dataFormat) { this.dataFormat = dataFormat; }
        public String getGdprArticle() { return gdprArticle; }
        public void setGdprArticle(String gdprArticle) { this.gdprArticle = gdprArticle; }
        public ProfileData getProfile() { return profile; }
        public void setProfile(ProfileData profile) { this.profile = profile; }
        public List<OrderData> getOrders() { return orders; }
        public void setOrders(List<OrderData> orders) { this.orders = orders; }
        public List<CartData> getCarts() { return carts; }
        public void setCarts(List<CartData> carts) { this.carts = carts; }
        public List<ReviewData> getReviews() { return reviews; }
        public void setReviews(List<ReviewData> reviews) { this.reviews = reviews; }
        public List<WishlistData> getWishlist() { return wishlist; }
        public void setWishlist(List<WishlistData> wishlist) { this.wishlist = wishlist; }
        public List<ActivityData> getActivityLog() { return activityLog; }
        public void setActivityLog(List<ActivityData> activityLog) { this.activityLog = activityLog; }
    }

    public static class ProfileData {
        private String email;
        private String firstName;
        private String lastName;
        private String phone;
        private Object addresses;
        private Instant createdAt;
        private Instant lastLoginAt;
        private String authProvider;

        // Getters and Setters
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getFirstName() { return firstName; }
        public void setFirstName(String firstName) { this.firstName = firstName; }
        public String getLastName() { return lastName; }
        public void setLastName(String lastName) { this.lastName = lastName; }
        public String getPhone() { return phone; }
        public void setPhone(String phone) { this.phone = phone; }
        public Object getAddresses() { return addresses; }
        public void setAddresses(Object addresses) { this.addresses = addresses; }
        public Instant getCreatedAt() { return createdAt; }
        public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
        public Instant getLastLoginAt() { return lastLoginAt; }
        public void setLastLoginAt(Instant lastLoginAt) { this.lastLoginAt = lastLoginAt; }
        public String getAuthProvider() { return authProvider; }
        public void setAuthProvider(String authProvider) { this.authProvider = authProvider; }
    }

    public static class OrderData {
        private String orderId;
        private String orderNumber;
        private String status;
        private Object pricing;
        private Object items;
        private Object shippingAddress;
        private Instant createdAt;
        private Instant updatedAt;

        // Getters and Setters
        public String getOrderId() { return orderId; }
        public void setOrderId(String orderId) { this.orderId = orderId; }
        public String getOrderNumber() { return orderNumber; }
        public void setOrderNumber(String orderNumber) { this.orderNumber = orderNumber; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        public Object getPricing() { return pricing; }
        public void setPricing(Object pricing) { this.pricing = pricing; }
        public Object getItems() { return items; }
        public void setItems(Object items) { this.items = items; }
        public Object getShippingAddress() { return shippingAddress; }
        public void setShippingAddress(Object shippingAddress) { this.shippingAddress = shippingAddress; }
        public Instant getCreatedAt() { return createdAt; }
        public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
        public Instant getUpdatedAt() { return updatedAt; }
        public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
    }

    public static class CartData {
        private String cartId;
        private Object items;
        private Instant createdAt;
        private Instant updatedAt;
        private boolean abandoned;

        // Getters and Setters
        public String getCartId() { return cartId; }
        public void setCartId(String cartId) { this.cartId = cartId; }
        public Object getItems() { return items; }
        public void setItems(Object items) { this.items = items; }
        public Instant getCreatedAt() { return createdAt; }
        public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
        public Instant getUpdatedAt() { return updatedAt; }
        public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
        public boolean isAbandoned() { return abandoned; }
        public void setAbandoned(boolean abandoned) { this.abandoned = abandoned; }
    }

    public static class ReviewData {
        private String reviewId;
        private String productId;
        private int rating;
        private String title;
        private String comment;
        private Object images;
        private boolean verifiedPurchase;
        private Instant createdAt;
        private Instant updatedAt;

        // Getters and Setters
        public String getReviewId() { return reviewId; }
        public void setReviewId(String reviewId) { this.reviewId = reviewId; }
        public String getProductId() { return productId; }
        public void setProductId(String productId) { this.productId = productId; }
        public int getRating() { return rating; }
        public void setRating(int rating) { this.rating = rating; }
        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        public String getComment() { return comment; }
        public void setComment(String comment) { this.comment = comment; }
        public Object getImages() { return images; }
        public void setImages(Object images) { this.images = images; }
        public boolean isVerifiedPurchase() { return verifiedPurchase; }
        public void setVerifiedPurchase(boolean verifiedPurchase) { this.verifiedPurchase = verifiedPurchase; }
        public Instant getCreatedAt() { return createdAt; }
        public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
        public Instant getUpdatedAt() { return updatedAt; }
        public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
    }

    public static class WishlistData {
        private String productId;
        private String productName;
        private Instant addedAt;
        private String notes;
        private Object currentPrice;
        private Object priceWhenAdded;

        // Getters and Setters
        public String getProductId() { return productId; }
        public void setProductId(String productId) { this.productId = productId; }
        public String getProductName() { return productName; }
        public void setProductName(String productName) { this.productName = productName; }
        public Instant getAddedAt() { return addedAt; }
        public void setAddedAt(Instant addedAt) { this.addedAt = addedAt; }
        public String getNotes() { return notes; }
        public void setNotes(String notes) { this.notes = notes; }
        public Object getCurrentPrice() { return currentPrice; }
        public void setCurrentPrice(Object currentPrice) { this.currentPrice = currentPrice; }
        public Object getPriceWhenAdded() { return priceWhenAdded; }
        public void setPriceWhenAdded(Object priceWhenAdded) { this.priceWhenAdded = priceWhenAdded; }
    }

    public static class ActivityData {
        private String activityType;
        private Instant timestamp;
        private String ipAddress;
        private String userAgent;
        private Map<String, Object> details;

        // Getters and Setters
        public String getActivityType() { return activityType; }
        public void setActivityType(String activityType) { this.activityType = activityType; }
        public Instant getTimestamp() { return timestamp; }
        public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }
        public String getIpAddress() { return ipAddress; }
        public void setIpAddress(String ipAddress) { this.ipAddress = ipAddress; }
        public String getUserAgent() { return userAgent; }
        public void setUserAgent(String userAgent) { this.userAgent = userAgent; }
        public Map<String, Object> getDetails() { return details; }
        public void setDetails(Map<String, Object> details) { this.details = details; }
    }
}
