package com.retail.domain.review;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Product review with ratings, comments, and optional media.
 */
@Document(collection = "product_reviews")
@CompoundIndex(name = "tenant_product", def = "{'tenantId': 1, 'productId': 1}")
@CompoundIndex(name = "product_rating", def = "{'productId': 1, 'rating': -1}")
public class ProductReview {

    @Id
    private String id;

    @Indexed
    private String tenantId;

    @Indexed
    private String productId;

    @Indexed
    private String userId;

    private String userName; // Cached for display

    private Integer rating; // 1-5 stars

    private String title;

    private String comment;

    private List<String> images; // URLs to review images

    private Boolean verifiedPurchase; // User purchased this product

    private Integer helpfulCount; // Number of "helpful" votes

    private Integer notHelpfulCount; // Number of "not helpful" votes

    @Indexed
    private ReviewStatus status;

    @Indexed
    private Instant createdAt;

    private Instant updatedAt;

    private Instant verifiedAt; // When moderator approved

    public ProductReview() {
        this.images = new ArrayList<>();
        this.helpfulCount = 0;
        this.notHelpfulCount = 0;
        this.status = ReviewStatus.PENDING;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
        this.verifiedPurchase = false;
    }

    // Getters and Setters

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getTenantId() {
        return tenantId;
    }

    public void setTenantId(String tenantId) {
        this.tenantId = tenantId;
    }

    public String getProductId() {
        return productId;
    }

    public void setProductId(String productId) {
        this.productId = productId;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public Integer getRating() {
        return rating;
    }

    public void setRating(Integer rating) {
        if (rating < 1 || rating > 5) {
            throw new IllegalArgumentException("Rating must be between 1 and 5");
        }
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

    public List<String> getImages() {
        return images;
    }

    public void setImages(List<String> images) {
        this.images = images;
    }

    public void addImage(String imageUrl) {
        if (this.images == null) {
            this.images = new ArrayList<>();
        }
        this.images.add(imageUrl);
    }

    public Boolean getVerifiedPurchase() {
        return verifiedPurchase;
    }

    public void setVerifiedPurchase(Boolean verifiedPurchase) {
        this.verifiedPurchase = verifiedPurchase;
    }

    public Integer getHelpfulCount() {
        return helpfulCount;
    }

    public void setHelpfulCount(Integer helpfulCount) {
        this.helpfulCount = helpfulCount;
    }

    public void incrementHelpful() {
        this.helpfulCount++;
        this.updatedAt = Instant.now();
    }

    public Integer getNotHelpfulCount() {
        return notHelpfulCount;
    }

    public void setNotHelpfulCount(Integer notHelpfulCount) {
        this.notHelpfulCount = notHelpfulCount;
    }

    public void incrementNotHelpful() {
        this.notHelpfulCount++;
        this.updatedAt = Instant.now();
    }

    public ReviewStatus getStatus() {
        return status;
    }

    public void setStatus(ReviewStatus status) {
        this.status = status;
        this.updatedAt = Instant.now();
    }

    public void approve() {
        this.status = ReviewStatus.APPROVED;
        this.verifiedAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    public void reject(String reason) {
        this.status = ReviewStatus.REJECTED;
        this.updatedAt = Instant.now();
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }

    public Instant getVerifiedAt() {
        return verifiedAt;
    }

    public void setVerifiedAt(Instant verifiedAt) {
        this.verifiedAt = verifiedAt;
    }

    public boolean isApproved() {
        return this.status == ReviewStatus.APPROVED;
    }

    public boolean isPending() {
        return this.status == ReviewStatus.PENDING;
    }
}
