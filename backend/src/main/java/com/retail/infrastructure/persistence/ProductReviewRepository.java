package com.retail.infrastructure.persistence;

import com.retail.domain.review.ProductReview;
import com.retail.domain.review.ReviewStatus;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * Repository for product reviews with tenant isolation.
 */
@Repository
public interface ProductReviewRepository extends TenantAwareRepository<ProductReview, String> {

    /**
     * Find all approved reviews for a product.
     */
    @Query("{ 'tenantId': ?0, 'productId': ?1, 'status': 'APPROVED' }")
    Flux<ProductReview> findApprovedByProduct(String tenantId, String productId);

    /**
     * Find all reviews by a user.
     */
    Flux<ProductReview> findByTenantIdAndUserId(String tenantId, String userId);

    /**
     * Find reviews by product and user.
     */
    Flux<ProductReview> findByTenantIdAndProductIdAndUserId(String tenantId, String productId, String userId);

    /**
     * Find reviews by status.
     */
    Flux<ProductReview> findByTenantIdAndStatus(String tenantId, ReviewStatus status);

    /**
     * Count reviews for a product.
     */
    Mono<Long> countByTenantIdAndProductIdAndStatus(String tenantId, String productId, ReviewStatus status);

    /**
     * Calculate average rating for a product.
     */
    @Query(value = "{ 'tenantId': ?0, 'productId': ?1, 'status': 'APPROVED' }",
           fields = "{ 'rating': 1 }")
    Flux<ProductReview> findRatingsByProduct(String tenantId, String productId);
}
