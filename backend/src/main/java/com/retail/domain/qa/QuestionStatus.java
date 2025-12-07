package com.retail.domain.qa;

/**
 * Status of a product question.
 */
public enum QuestionStatus {
    /**
     * Question is pending moderation.
     */
    PENDING,

    /**
     * Question has been approved and is visible.
     */
    APPROVED,

    /**
     * Question was rejected by moderators.
     */
    REJECTED,

    /**
     * Question was answered by the seller/owner.
     */
    ANSWERED
}
