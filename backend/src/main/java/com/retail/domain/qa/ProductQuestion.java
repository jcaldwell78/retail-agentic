package com.retail.domain.qa;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Product question from customers.
 * Questions can receive multiple answers from sellers or community members.
 */
@Document(collection = "product_questions")
@CompoundIndex(name = "tenant_product", def = "{'tenantId': 1, 'productId': 1}")
@CompoundIndex(name = "product_status", def = "{'productId': 1, 'status': 1}")
public class ProductQuestion {

    @Id
    private String id;

    @Indexed
    private String tenantId;

    @Indexed
    private String productId;

    @Indexed
    private String userId;

    private String userName;

    private String questionText;

    @Indexed
    private QuestionStatus status;

    private Integer upvoteCount;

    private List<String> upvotedBy;

    private Integer answerCount;

    @Indexed
    private Instant createdAt;

    private Instant updatedAt;

    public ProductQuestion() {
        this.status = QuestionStatus.PENDING;
        this.upvoteCount = 0;
        this.upvotedBy = new ArrayList<>();
        this.answerCount = 0;
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

    public String getQuestionText() {
        return questionText;
    }

    public void setQuestionText(String questionText) {
        this.questionText = questionText;
    }

    public QuestionStatus getStatus() {
        return status;
    }

    public void setStatus(QuestionStatus status) {
        this.status = status;
        this.updatedAt = Instant.now();
    }

    public Integer getUpvoteCount() {
        return upvoteCount;
    }

    public void setUpvoteCount(Integer upvoteCount) {
        this.upvoteCount = upvoteCount;
    }

    public List<String> getUpvotedBy() {
        return upvotedBy;
    }

    public void setUpvotedBy(List<String> upvotedBy) {
        this.upvotedBy = upvotedBy;
    }

    public boolean upvote(String userId) {
        if (this.upvotedBy == null) {
            this.upvotedBy = new ArrayList<>();
        }
        if (!this.upvotedBy.contains(userId)) {
            this.upvotedBy.add(userId);
            this.upvoteCount++;
            this.updatedAt = Instant.now();
            return true;
        }
        return false; // Already upvoted
    }

    public boolean removeUpvote(String userId) {
        if (this.upvotedBy != null && this.upvotedBy.remove(userId)) {
            this.upvoteCount = Math.max(0, this.upvoteCount - 1);
            this.updatedAt = Instant.now();
            return true;
        }
        return false;
    }

    public Integer getAnswerCount() {
        return answerCount;
    }

    public void setAnswerCount(Integer answerCount) {
        this.answerCount = answerCount;
    }

    public void incrementAnswerCount() {
        this.answerCount++;
        if (this.status == QuestionStatus.APPROVED) {
            this.status = QuestionStatus.ANSWERED;
        }
        this.updatedAt = Instant.now();
    }

    public void decrementAnswerCount() {
        this.answerCount = Math.max(0, this.answerCount - 1);
        if (this.answerCount == 0 && this.status == QuestionStatus.ANSWERED) {
            this.status = QuestionStatus.APPROVED;
        }
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

    public void approve() {
        this.status = QuestionStatus.APPROVED;
        this.updatedAt = Instant.now();
    }

    public void reject() {
        this.status = QuestionStatus.REJECTED;
        this.updatedAt = Instant.now();
    }

    public boolean isApproved() {
        return this.status == QuestionStatus.APPROVED || this.status == QuestionStatus.ANSWERED;
    }

    public boolean isPending() {
        return this.status == QuestionStatus.PENDING;
    }
}
