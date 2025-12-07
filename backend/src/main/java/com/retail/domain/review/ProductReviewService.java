package com.retail.domain.review;

import com.retail.domain.order.OrderService;
import com.retail.domain.user.UserService;
import com.retail.infrastructure.persistence.ProductReviewRepository;
import com.retail.security.tenant.TenantContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Instant;

/**
 * Service for managing product reviews.
 */
@Service
public class ProductReviewService {

    private static final Logger logger = LoggerFactory.getLogger(ProductReviewService.class);

    private final ProductReviewRepository reviewRepository;
    private final UserService userService;
    private final OrderService orderService;

    public ProductReviewService(
            ProductReviewRepository reviewRepository,
            UserService userService,
            OrderService orderService) {
        this.reviewRepository = reviewRepository;
        this.userService = userService;
        this.orderService = orderService;
    }

    /**
     * Submit a new product review.
     */
    public Mono<ProductReview> submitReview(String userId, String productId, ProductReview review) {
        return TenantContext.getTenantId()
            .flatMap(tenantId -> {
                // Check if user already reviewed this product
                return reviewRepository.findByTenantIdAndProductIdAndUserId(tenantId, productId, userId)
                    .hasElements()
                    .flatMap(exists -> {
                        if (exists) {
                            return Mono.error(new IllegalStateException("You have already reviewed this product"));
                        }

                        // Get user name
                        return userService.findById(userId)
                            .flatMap(user -> {
                                review.setTenantId(tenantId);
                                review.setProductId(productId);
                                review.setUserId(userId);
                                review.setUserName(user.getFirstName() + " " + user.getLastName().charAt(0) + ".");
                                review.setCreatedAt(Instant.now());
                                review.setUpdatedAt(Instant.now());
                                review.setStatus(ReviewStatus.PENDING);

                                // Check if user purchased this product
                                return orderService.hasUserPurchasedProduct(userId, productId)
                                    .defaultIfEmpty(false)
                                    .flatMap(purchased -> {
                                        review.setVerifiedPurchase(purchased);
                                        return reviewRepository.save(review);
                                    });
                            });
                    });
            })
            .doOnSuccess(savedReview ->
                logger.info("Review submitted for product {} by user {}", productId, userId))
            .doOnError(error ->
                logger.error("Failed to submit review for product {}", productId, error));
    }

    /**
     * Get all approved reviews for a product.
     */
    public Flux<ProductReview> getProductReviews(String productId) {
        return TenantContext.getTenantId()
            .flatMapMany(tenantId ->
                reviewRepository.findApprovedByProduct(tenantId, productId)
            );
    }

    /**
     * Get reviews by a specific user.
     */
    public Flux<ProductReview> getUserReviews(String userId) {
        return TenantContext.getTenantId()
            .flatMapMany(tenantId ->
                reviewRepository.findByTenantIdAndUserId(tenantId, userId)
            );
    }

    /**
     * Mark a review as helpful.
     */
    public Mono<ProductReview> markHelpful(String reviewId) {
        return reviewRepository.findById(reviewId)
            .flatMap(review -> {
                review.incrementHelpful();
                return reviewRepository.save(review);
            });
    }

    /**
     * Mark a review as not helpful.
     */
    public Mono<ProductReview> markNotHelpful(String reviewId) {
        return reviewRepository.findById(reviewId)
            .flatMap(review -> {
                review.incrementNotHelpful();
                return reviewRepository.save(review);
            });
    }

    /**
     * Approve a review (admin only).
     */
    public Mono<ProductReview> approveReview(String reviewId) {
        return reviewRepository.findById(reviewId)
            .flatMap(review -> {
                review.approve();
                return reviewRepository.save(review);
            })
            .doOnSuccess(review ->
                logger.info("Review {} approved", reviewId));
    }

    /**
     * Reject a review (admin only).
     */
    public Mono<ProductReview> rejectReview(String reviewId, String reason) {
        return reviewRepository.findById(reviewId)
            .flatMap(review -> {
                review.reject(reason);
                return reviewRepository.save(review);
            })
            .doOnSuccess(review ->
                logger.info("Review {} rejected", reviewId));
    }

    /**
     * Get pending reviews for moderation (admin only).
     */
    public Flux<ProductReview> getPendingReviews() {
        return TenantContext.getTenantId()
            .flatMapMany(tenantId ->
                reviewRepository.findByTenantIdAndStatus(tenantId, ReviewStatus.PENDING)
            );
    }

    /**
     * Calculate product rating statistics.
     */
    public Mono<ReviewStatistics> getProductStatistics(String productId) {
        return TenantContext.getTenantId()
            .flatMap(tenantId ->
                reviewRepository.findRatingsByProduct(tenantId, productId)
                    .collectList()
                    .map(reviews -> {
                        if (reviews.isEmpty()) {
                            return new ReviewStatistics(0.0, 0, new int[]{0, 0, 0, 0, 0});
                        }

                        double sum = 0;
                        int[] distribution = new int[5]; // 1-star to 5-star counts

                        for (ProductReview review : reviews) {
                            sum += review.getRating();
                            distribution[review.getRating() - 1]++;
                        }

                        double average = sum / reviews.size();
                        return new ReviewStatistics(average, reviews.size(), distribution);
                    })
            );
    }

    /**
     * Delete a review (user can delete their own, admin can delete any).
     */
    public Mono<Void> deleteReview(String reviewId, String userId, boolean isAdmin) {
        return reviewRepository.findById(reviewId)
            .flatMap(review -> {
                if (!isAdmin && !review.getUserId().equals(userId)) {
                    return Mono.error(new IllegalStateException("You can only delete your own reviews"));
                }
                return reviewRepository.deleteById(reviewId);
            })
            .doOnSuccess(v -> logger.info("Review {} deleted", reviewId));
    }
}
