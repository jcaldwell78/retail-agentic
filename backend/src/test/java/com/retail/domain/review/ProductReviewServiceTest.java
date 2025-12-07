package com.retail.domain.review;

import com.retail.domain.order.OrderService;
import com.retail.domain.user.User;
import com.retail.domain.user.UserService;
import com.retail.infrastructure.persistence.ProductReviewRepository;
import com.retail.security.tenant.TenantContext;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.time.Instant;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Integration tests for ProductReviewService.
 */
@ExtendWith(MockitoExtension.class)
class ProductReviewServiceTest {

    @Mock
    private ProductReviewRepository reviewRepository;

    @Mock
    private UserService userService;

    @Mock
    private OrderService orderService;

    @InjectMocks
    private ProductReviewService reviewService;

    private static final String TENANT_ID = "tenant-123";
    private static final String USER_ID = "user-456";
    private static final String PRODUCT_ID = "product-789";

    @Test
    void submitReview_Success() {
        // Arrange
        User mockUser = new User();
        mockUser.setFirstName("John");
        mockUser.setLastName("Doe");

        ProductReview review = new ProductReview();
        review.setRating(5);
        review.setTitle("Great product!");
        review.setComment("I love this product");

        when(reviewRepository.findByTenantIdAndProductIdAndUserId(TENANT_ID, PRODUCT_ID, USER_ID))
            .thenReturn(Flux.empty());
        when(userService.findById(USER_ID))
            .thenReturn(Mono.just(mockUser));
        when(orderService.hasUserPurchasedProduct(USER_ID, PRODUCT_ID))
            .thenReturn(Mono.just(true));
        when(reviewRepository.save(any(ProductReview.class)))
            .thenAnswer(invocation -> Mono.just(invocation.getArgument(0)));

        // Act & Assert
        StepVerifier.create(reviewService.submitReview(USER_ID, PRODUCT_ID, review)
                        .contextWrite(TenantContext.withTenantId(TENANT_ID)))
            .expectNextMatches(savedReview ->
                savedReview.getTenantId().equals(TENANT_ID) &&
                savedReview.getProductId().equals(PRODUCT_ID) &&
                savedReview.getUserId().equals(USER_ID) &&
                savedReview.getUserName().equals("John D.") &&
                savedReview.getVerifiedPurchase() &&
                savedReview.getStatus() == ReviewStatus.PENDING &&
                savedReview.getRating() == 5
            )
            .verifyComplete();

        verify(reviewRepository).save(any(ProductReview.class));
    }

    @Test
    void submitReview_DuplicateReview_ThrowsError() {
        // Arrange
        ProductReview existingReview = new ProductReview();
        existingReview.setUserId(USER_ID);
        existingReview.setProductId(PRODUCT_ID);

        when(reviewRepository.findByTenantIdAndProductIdAndUserId(TENANT_ID, PRODUCT_ID, USER_ID))
            .thenReturn(Flux.just(existingReview));

        ProductReview newReview = new ProductReview();
        newReview.setRating(4);
        newReview.setTitle("Another review");

        // Act & Assert
        StepVerifier.create(reviewService.submitReview(USER_ID, PRODUCT_ID, newReview)
                        .contextWrite(TenantContext.withTenantId(TENANT_ID)))
            .expectErrorMatches(error ->
                error instanceof IllegalStateException &&
                error.getMessage().contains("already reviewed")
            )
            .verify();

        verify(reviewRepository, never()).save(any());
    }

    @Test
    void getProductReviews_ReturnsApprovedOnly() {
        // Arrange
        ProductReview approved1 = createReview("review-1", ReviewStatus.APPROVED);
        ProductReview approved2 = createReview("review-2", ReviewStatus.APPROVED);

        when(reviewRepository.findApprovedByProduct(TENANT_ID, PRODUCT_ID))
            .thenReturn(Flux.just(approved1, approved2));

        // Act & Assert
        StepVerifier.create(reviewService.getProductReviews(PRODUCT_ID)
                        .contextWrite(TenantContext.withTenantId(TENANT_ID)))
            .expectNext(approved1)
            .expectNext(approved2)
            .verifyComplete();
    }

    @Test
    void markHelpful_IncrementsCount() {
        // Arrange
        ProductReview review = createReview("review-1", ReviewStatus.APPROVED);
        review.setHelpfulCount(5);

        when(reviewRepository.findById("review-1"))
            .thenReturn(Mono.just(review));
        when(reviewRepository.save(any(ProductReview.class)))
            .thenAnswer(invocation -> Mono.just(invocation.getArgument(0)));

        // Act & Assert
        StepVerifier.create(reviewService.markHelpful("review-1"))
            .expectNextMatches(savedReview ->
                savedReview.getHelpfulCount() == 6
            )
            .verifyComplete();
    }

    @Test
    void approveReview_UpdatesStatus() {
        // Arrange
        ProductReview review = createReview("review-1", ReviewStatus.PENDING);

        when(reviewRepository.findById("review-1"))
            .thenReturn(Mono.just(review));
        when(reviewRepository.save(any(ProductReview.class)))
            .thenAnswer(invocation -> Mono.just(invocation.getArgument(0)));

        // Act & Assert
        StepVerifier.create(reviewService.approveReview("review-1"))
            .expectNextMatches(savedReview ->
                savedReview.getStatus() == ReviewStatus.APPROVED &&
                savedReview.getVerifiedAt() != null
            )
            .verifyComplete();
    }

    @Test
    void rejectReview_UpdatesStatus() {
        // Arrange
        ProductReview review = createReview("review-1", ReviewStatus.PENDING);

        when(reviewRepository.findById("review-1"))
            .thenReturn(Mono.just(review));
        when(reviewRepository.save(any(ProductReview.class)))
            .thenAnswer(invocation -> Mono.just(invocation.getArgument(0)));

        // Act & Assert
        StepVerifier.create(reviewService.rejectReview("review-1", "Inappropriate content"))
            .expectNextMatches(savedReview ->
                savedReview.getStatus() == ReviewStatus.REJECTED
            )
            .verifyComplete();
    }

    @Test
    void getProductStatistics_CalculatesCorrectly() {
        // Arrange
        ProductReview review1 = createReview("r1", ReviewStatus.APPROVED);
        review1.setRating(5);
        ProductReview review2 = createReview("r2", ReviewStatus.APPROVED);
        review2.setRating(4);
        ProductReview review3 = createReview("r3", ReviewStatus.APPROVED);
        review3.setRating(5);
        ProductReview review4 = createReview("r4", ReviewStatus.APPROVED);
        review4.setRating(3);

        when(reviewRepository.findRatingsByProduct(TENANT_ID, PRODUCT_ID))
            .thenReturn(Flux.just(review1, review2, review3, review4));

        // Act & Assert
        StepVerifier.create(reviewService.getProductStatistics(PRODUCT_ID)
                        .contextWrite(TenantContext.withTenantId(TENANT_ID)))
            .expectNextMatches(stats ->
                stats.getTotalReviews() == 4 &&
                Math.abs(stats.getAverageRating() - 4.25) < 0.01 &&
                stats.getFiveStarCount() == 2 &&
                stats.getFourStarCount() == 1 &&
                stats.getThreeStarCount() == 1 &&
                stats.getTwoStarCount() == 0 &&
                stats.getOneStarCount() == 0
            )
            .verifyComplete();
    }

    @Test
    void deleteReview_UserOwnsReview_Success() {
        // Arrange
        ProductReview review = createReview("review-1", ReviewStatus.APPROVED);
        review.setUserId(USER_ID);

        when(reviewRepository.findById("review-1"))
            .thenReturn(Mono.just(review));
        when(reviewRepository.deleteById(eq("review-1")))
            .thenReturn(Mono.empty());

        // Act & Assert
        StepVerifier.create(reviewService.deleteReview("review-1", USER_ID, false))
            .verifyComplete();

        verify(reviewRepository).deleteById(eq("review-1"));
    }

    @Test
    void deleteReview_UserDoesNotOwnReview_ThrowsError() {
        // Arrange
        ProductReview review = createReview("review-1", ReviewStatus.APPROVED);
        review.setUserId("different-user");

        when(reviewRepository.findById("review-1"))
            .thenReturn(Mono.just(review));

        // Act & Assert
        StepVerifier.create(reviewService.deleteReview("review-1", USER_ID, false))
            .expectErrorMatches(error ->
                error instanceof IllegalStateException &&
                error.getMessage().contains("your own reviews")
            )
            .verify();

        verify(reviewRepository, never()).deleteById(anyString());
    }

    @Test
    void deleteReview_AdminCanDeleteAny() {
        // Arrange
        ProductReview review = createReview("review-1", ReviewStatus.APPROVED);
        review.setUserId("different-user");

        when(reviewRepository.findById("review-1"))
            .thenReturn(Mono.just(review));
        when(reviewRepository.deleteById(eq("review-1")))
            .thenReturn(Mono.empty());

        // Act & Assert
        StepVerifier.create(reviewService.deleteReview("review-1", USER_ID, true))
            .verifyComplete();

        verify(reviewRepository).deleteById(eq("review-1"));
    }

    private ProductReview createReview(String id, ReviewStatus status) {
        ProductReview review = new ProductReview();
        review.setId(id);
        review.setTenantId(TENANT_ID);
        review.setProductId(PRODUCT_ID);
        review.setUserId(USER_ID);
        review.setUserName("Test User");
        review.setRating(5);
        review.setTitle("Test Review");
        review.setComment("Test comment");
        review.setStatus(status);
        review.setCreatedAt(Instant.now());
        review.setUpdatedAt(Instant.now());
        return review;
    }
}
