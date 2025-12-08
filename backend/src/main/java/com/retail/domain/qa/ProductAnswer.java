package com.retail.domain.qa;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Answer to a product question.
 * Can be from sellers (official) or community members.
 */
@Document(collection = "product_answers")
@CompoundIndex(name = "tenant_question", def = "{'tenantId': 1, 'questionId': 1}")
public class ProductAnswer {

    @Id
    private String id;

    @Indexed
    private String tenantId;

    @Indexed
    private String questionId;

    @Indexed
    private String productId; // Denormalized for efficient queries

    @Indexed
    private String userId;

    private String userName;

    private String answerText;

    private Boolean isSellerAnswer; // Official answer from store owner/staff

    private Boolean isVerified; // Answer verified by moderator

    private Integer helpfulCount;

    private Integer notHelpfulCount;

    private List<String> helpfulVotedBy;

    @Indexed
    private Instant createdAt;

    private Instant updatedAt;

    public ProductAnswer() {
        this.isSellerAnswer = false;
        this.isVerified = false;
        this.helpfulCount = 0;
        this.notHelpfulCount = 0;
        this.helpfulVotedBy = new ArrayList<>();
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
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

    public String getQuestionId() {
        return questionId;
    }

    public void setQuestionId(String questionId) {
        this.questionId = questionId;
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

    public String getAnswerText() {
        return answerText;
    }

    public void setAnswerText(String answerText) {
        this.answerText = answerText;
    }

    public Boolean getIsSellerAnswer() {
        return isSellerAnswer;
    }

    public void setIsSellerAnswer(Boolean isSellerAnswer) {
        this.isSellerAnswer = isSellerAnswer;
    }

    public Boolean getIsVerified() {
        return isVerified;
    }

    public void setIsVerified(Boolean isVerified) {
        this.isVerified = isVerified;
    }

    public void verify() {
        this.isVerified = true;
        this.updatedAt = Instant.now();
    }

    public Integer getHelpfulCount() {
        return helpfulCount;
    }

    public void setHelpfulCount(Integer helpfulCount) {
        this.helpfulCount = helpfulCount;
    }

    public Integer getNotHelpfulCount() {
        return notHelpfulCount;
    }

    public void setNotHelpfulCount(Integer notHelpfulCount) {
        this.notHelpfulCount = notHelpfulCount;
    }

    public List<String> getHelpfulVotedBy() {
        return helpfulVotedBy;
    }

    public void setHelpfulVotedBy(List<String> helpfulVotedBy) {
        this.helpfulVotedBy = helpfulVotedBy;
    }

    public boolean markHelpful(String voterId) {
        if (this.helpfulVotedBy == null) {
            this.helpfulVotedBy = new ArrayList<>();
        }
        if (!this.helpfulVotedBy.contains(voterId)) {
            this.helpfulVotedBy.add(voterId);
            this.helpfulCount++;
            this.updatedAt = Instant.now();
            return true;
        }
        return false; // Already voted
    }

    public void incrementNotHelpful() {
        this.notHelpfulCount++;
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

    /**
     * Calculate helpfulness score for sorting.
     * Seller answers get a boost.
     */
    public double getHelpfulnessScore() {
        double baseScore = helpfulCount - (notHelpfulCount * 0.5);
        if (isSellerAnswer) {
            baseScore += 100; // Seller answers always prioritized
        }
        if (isVerified) {
            baseScore += 10;
        }
        return baseScore;
    }
}
