package com.retail.controller;

import com.retail.domain.review.ProductReview;
import com.retail.domain.review.ProductReviewService;
import com.retail.domain.review.ReviewStatistics;
import com.retail.domain.review.ReviewStatus;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.reactive.WebFluxTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.reactive.server.WebTestClient;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Instant;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Controller tests for ProductReviewController REST API.
 * TODO: Fix WebFluxTest context loading - currently requires full app context with MongoDB
 */
@org.junit.jupiter.api.Disabled("WebFluxTest requires full app context - fix tenant/security config")
@WebFluxTest(ProductReviewController.class)
class ProductReviewControllerTest {

    @Autowired
    private WebTestClient webTestClient;

    @MockBean
    private ProductReviewService reviewService;

    private static final String PRODUCT_ID = "product-123";
    private static final String USER_ID = "user-456";

    @Test
    void submitReview_ValidRequest_ReturnsCreated() {
        // Arrange
        ProductReview savedReview = createReview("review-1", ReviewStatus.PENDING);

        when(reviewService.submitReview(eq(USER_ID), eq(PRODUCT_ID), any(ProductReview.class)))
            .thenReturn(Mono.just(savedReview));

        String requestBody = """
            {
                "rating": 5,
                "title": "Great product!",
                "comment": "I really enjoyed this product",
                "images": ["https://example.com/image1.jpg"]
            }
            """;

        // Act & Assert
        webTestClient.post()
            .uri("/api/v1/reviews/products/{productId}?userId={userId}", PRODUCT_ID, USER_ID)
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(requestBody)
            .exchange()
            .expectStatus().isCreated()
            .expectBody()
            .jsonPath("$.id").isEqualTo("review-1")
            .jsonPath("$.rating").isEqualTo(5)
            .jsonPath("$.status").isEqualTo("PENDING");

        verify(reviewService).submitReview(eq(USER_ID), eq(PRODUCT_ID), any(ProductReview.class));
    }

    @Test
    void submitReview_DuplicateReview_ReturnsConflict() {
        // Arrange
        when(reviewService.submitReview(eq(USER_ID), eq(PRODUCT_ID), any(ProductReview.class)))
            .thenReturn(Mono.error(new IllegalStateException("You have already reviewed this product")));

        String requestBody = """
            {
                "rating": 5,
                "title": "Great product!",
                "comment": "I really enjoyed this product"
            }
            """;

        // Act & Assert
        webTestClient.post()
            .uri("/api/v1/reviews/products/{productId}?userId={userId}", PRODUCT_ID, USER_ID)
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(requestBody)
            .exchange()
            .expectStatus().isEqualTo(409); // Conflict
    }

    @Test
    void submitReview_InvalidRating_ReturnsBadRequest() {
        // Arrange - rating > 5
        String requestBody = """
            {
                "rating": 6,
                "title": "Great product!",
                "comment": "I really enjoyed this product"
            }
            """;

        // Act & Assert
        webTestClient.post()
            .uri("/api/v1/reviews/products/{productId}?userId={userId}", PRODUCT_ID, USER_ID)
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(requestBody)
            .exchange()
            .expectStatus().isBadRequest();
    }

    @Test
    void submitReview_MissingTitle_ReturnsBadRequest() {
        // Arrange
        String requestBody = """
            {
                "rating": 5,
                "comment": "I really enjoyed this product"
            }
            """;

        // Act & Assert
        webTestClient.post()
            .uri("/api/v1/reviews/products/{productId}?userId={userId}", PRODUCT_ID, USER_ID)
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(requestBody)
            .exchange()
            .expectStatus().isBadRequest();
    }

    @Test
    void getProductReviews_ReturnsApprovedReviews() {
        // Arrange
        ProductReview review1 = createReview("review-1", ReviewStatus.APPROVED);
        ProductReview review2 = createReview("review-2", ReviewStatus.APPROVED);

        when(reviewService.getProductReviews(PRODUCT_ID))
            .thenReturn(Flux.just(review1, review2));

        // Act & Assert
        webTestClient.get()
            .uri("/api/v1/reviews/products/{productId}", PRODUCT_ID)
            .exchange()
            .expectStatus().isOk()
            .expectBodyList(ProductReview.class)
            .hasSize(2);

        verify(reviewService).getProductReviews(PRODUCT_ID);
    }

    @Test
    void getProductStatistics_ReturnsStats() {
        // Arrange
        ReviewStatistics stats = new ReviewStatistics(4.5, 100, new int[]{2, 3, 10, 25, 60});

        when(reviewService.getProductStatistics(PRODUCT_ID))
            .thenReturn(Mono.just(stats));

        // Act & Assert
        webTestClient.get()
            .uri("/api/v1/reviews/products/{productId}/statistics", PRODUCT_ID)
            .exchange()
            .expectStatus().isOk()
            .expectBody()
            .jsonPath("$.averageRating").isEqualTo(4.5)
            .jsonPath("$.totalReviews").isEqualTo(100)
            .jsonPath("$.ratingDistribution[0]").isEqualTo(2)
            .jsonPath("$.ratingDistribution[4]").isEqualTo(60);

        verify(reviewService).getProductStatistics(PRODUCT_ID);
    }

    @Test
    void getUserReviews_ReturnsUserReviews() {
        // Arrange
        ProductReview review1 = createReview("review-1", ReviewStatus.APPROVED);
        ProductReview review2 = createReview("review-2", ReviewStatus.PENDING);

        when(reviewService.getUserReviews(USER_ID))
            .thenReturn(Flux.just(review1, review2));

        // Act & Assert
        webTestClient.get()
            .uri("/api/v1/reviews/users/{userId}", USER_ID)
            .exchange()
            .expectStatus().isOk()
            .expectBodyList(ProductReview.class)
            .hasSize(2);

        verify(reviewService).getUserReviews(USER_ID);
    }

    @Test
    void markHelpful_UpdatesReview() {
        // Arrange
        ProductReview review = createReview("review-1", ReviewStatus.APPROVED);
        review.setHelpfulCount(10);

        when(reviewService.markHelpful("review-1"))
            .thenReturn(Mono.just(review));

        // Act & Assert
        webTestClient.post()
            .uri("/api/v1/reviews/{reviewId}/helpful", "review-1")
            .exchange()
            .expectStatus().isOk()
            .expectBody()
            .jsonPath("$.helpfulCount").isEqualTo(10);

        verify(reviewService).markHelpful("review-1");
    }

    @Test
    void markNotHelpful_UpdatesReview() {
        // Arrange
        ProductReview review = createReview("review-1", ReviewStatus.APPROVED);
        review.setNotHelpfulCount(3);

        when(reviewService.markNotHelpful("review-1"))
            .thenReturn(Mono.just(review));

        // Act & Assert
        webTestClient.post()
            .uri("/api/v1/reviews/{reviewId}/not-helpful", "review-1")
            .exchange()
            .expectStatus().isOk()
            .expectBody()
            .jsonPath("$.notHelpfulCount").isEqualTo(3);

        verify(reviewService).markNotHelpful("review-1");
    }

    @Test
    void deleteReview_Success_ReturnsNoContent() {
        // Arrange
        when(reviewService.deleteReview("review-1", USER_ID, false))
            .thenReturn(Mono.empty());

        // Act & Assert
        webTestClient.delete()
            .uri("/api/v1/reviews/{reviewId}?userId={userId}", "review-1", USER_ID)
            .exchange()
            .expectStatus().isNoContent();

        verify(reviewService).deleteReview("review-1", USER_ID, false);
    }

    @Test
    void deleteReview_NotOwner_ReturnsForbidden() {
        // Arrange
        when(reviewService.deleteReview("review-1", USER_ID, false))
            .thenReturn(Mono.error(new IllegalStateException("You can only delete your own reviews")));

        // Act & Assert
        webTestClient.delete()
            .uri("/api/v1/reviews/{reviewId}?userId={userId}", "review-1", USER_ID)
            .exchange()
            .expectStatus().isForbidden();
    }

    @Test
    void getPendingReviews_ReturnsReviews() {
        // Arrange
        ProductReview review1 = createReview("review-1", ReviewStatus.PENDING);
        ProductReview review2 = createReview("review-2", ReviewStatus.PENDING);

        when(reviewService.getPendingReviews())
            .thenReturn(Flux.just(review1, review2));

        // Act & Assert
        webTestClient.get()
            .uri("/api/v1/reviews/admin/pending")
            .exchange()
            .expectStatus().isOk()
            .expectBodyList(ProductReview.class)
            .hasSize(2);

        verify(reviewService).getPendingReviews();
    }

    @Test
    void approveReview_UpdatesStatus() {
        // Arrange
        ProductReview review = createReview("review-1", ReviewStatus.APPROVED);
        review.setVerifiedAt(Instant.now());

        when(reviewService.approveReview("review-1"))
            .thenReturn(Mono.just(review));

        // Act & Assert
        webTestClient.post()
            .uri("/api/v1/reviews/admin/{reviewId}/approve", "review-1")
            .exchange()
            .expectStatus().isOk()
            .expectBody()
            .jsonPath("$.status").isEqualTo("APPROVED")
            .jsonPath("$.verifiedAt").exists();

        verify(reviewService).approveReview("review-1");
    }

    @Test
    void rejectReview_UpdatesStatus() {
        // Arrange
        ProductReview review = createReview("review-1", ReviewStatus.REJECTED);

        when(reviewService.rejectReview("review-1", "Inappropriate content"))
            .thenReturn(Mono.just(review));

        // Act & Assert
        webTestClient.post()
            .uri("/api/v1/reviews/admin/{reviewId}/reject?reason={reason}",
                "review-1", "Inappropriate content")
            .exchange()
            .expectStatus().isOk()
            .expectBody()
            .jsonPath("$.status").isEqualTo("REJECTED");

        verify(reviewService).rejectReview("review-1", "Inappropriate content");
    }

    private ProductReview createReview(String id, ReviewStatus status) {
        ProductReview review = new ProductReview();
        review.setId(id);
        review.setProductId(PRODUCT_ID);
        review.setUserId(USER_ID);
        review.setUserName("Test User");
        review.setRating(5);
        review.setTitle("Great product!");
        review.setComment("I really enjoyed this product");
        review.setStatus(status);
        review.setCreatedAt(Instant.now());
        review.setUpdatedAt(Instant.now());
        return review;
    }
}
