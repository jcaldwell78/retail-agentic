package com.retail.controller;

import com.retail.domain.review.ProductReview;
import com.retail.domain.review.ProductReviewService;
import com.retail.domain.review.ReviewStatistics;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * REST API for product reviews.
 */
@RestController
@RequestMapping("/api/v1/reviews")
public class ProductReviewController {

    private final ProductReviewService reviewService;

    public ProductReviewController(ProductReviewService reviewService) {
        this.reviewService = reviewService;
    }

    /**
     * Submit a new review for a product.
     */
    @PostMapping("/products/{productId}")
    public Mono<ResponseEntity<ProductReview>> submitReview(
            @PathVariable String productId,
            @RequestParam String userId,
            @Valid @RequestBody SubmitReviewRequest request) {

        ProductReview review = new ProductReview();
        review.setRating(request.getRating());
        review.setTitle(request.getTitle());
        review.setComment(request.getComment());
        if (request.getImages() != null) {
            review.setImages(request.getImages());
        }

        return reviewService.submitReview(userId, productId, review)
            .map(savedReview -> ResponseEntity.status(HttpStatus.CREATED).body(savedReview))
            .onErrorResume(IllegalStateException.class, error ->
                Mono.just(ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(null))
            );
    }

    /**
     * Get all approved reviews for a product.
     */
    @GetMapping("/products/{productId}")
    public Flux<ProductReview> getProductReviews(@PathVariable String productId) {
        return reviewService.getProductReviews(productId);
    }

    /**
     * Get review statistics for a product.
     */
    @GetMapping("/products/{productId}/statistics")
    public Mono<ReviewStatistics> getProductStatistics(@PathVariable String productId) {
        return reviewService.getProductStatistics(productId);
    }

    /**
     * Get reviews by a specific user.
     */
    @GetMapping("/users/{userId}")
    public Flux<ProductReview> getUserReviews(@PathVariable String userId) {
        return reviewService.getUserReviews(userId);
    }

    /**
     * Mark a review as helpful.
     */
    @PostMapping("/{reviewId}/helpful")
    public Mono<ProductReview> markHelpful(@PathVariable String reviewId) {
        return reviewService.markHelpful(reviewId);
    }

    /**
     * Mark a review as not helpful.
     */
    @PostMapping("/{reviewId}/not-helpful")
    public Mono<ProductReview> markNotHelpful(@PathVariable String reviewId) {
        return reviewService.markNotHelpful(reviewId);
    }

    /**
     * Delete a review (user can delete their own).
     */
    @DeleteMapping("/{reviewId}")
    public Mono<ResponseEntity<Void>> deleteReview(
            @PathVariable String reviewId,
            @RequestParam String userId) {

        return reviewService.deleteReview(reviewId, userId, false)
            .then(Mono.just(ResponseEntity.noContent().<Void>build()))
            .onErrorResume(IllegalStateException.class, error ->
                Mono.just(ResponseEntity.status(HttpStatus.FORBIDDEN).<Void>build())
            );
    }

    // Admin endpoints

    /**
     * Get pending reviews for moderation (admin only).
     */
    @GetMapping("/admin/pending")
    public Flux<ProductReview> getPendingReviews() {
        return reviewService.getPendingReviews();
    }

    /**
     * Approve a review (admin only).
     */
    @PostMapping("/admin/{reviewId}/approve")
    public Mono<ProductReview> approveReview(@PathVariable String reviewId) {
        return reviewService.approveReview(reviewId);
    }

    /**
     * Reject a review (admin only).
     */
    @PostMapping("/admin/{reviewId}/reject")
    public Mono<ProductReview> rejectReview(
            @PathVariable String reviewId,
            @RequestParam String reason) {

        return reviewService.rejectReview(reviewId, reason);
    }

    // DTOs

    public static class SubmitReviewRequest {
        @NotNull(message = "Rating is required")
        @Min(value = 1, message = "Rating must be at least 1")
        @Max(value = 5, message = "Rating must not exceed 5")
        private Integer rating;

        @NotBlank(message = "Title is required")
        @Size(max = 200, message = "Title must not exceed 200 characters")
        private String title;

        @NotBlank(message = "Comment is required")
        @Size(max = 2000, message = "Comment must not exceed 2000 characters")
        private String comment;

        private java.util.List<String> images;

        public Integer getRating() {
            return rating;
        }

        public void setRating(Integer rating) {
            this.rating = rating;
        }

        public String getTitle() {
            return title;
        }

        public void setTitle(String title) {
            this.title = title;
        }

        public String getComment() {
            return comment;
        }

        public void setComment(String comment) {
            this.comment = comment;
        }

        public java.util.List<String> getImages() {
            return images;
        }

        public void setImages(java.util.List<String> images) {
            this.images = images;
        }
    }
}
