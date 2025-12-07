package com.retail.domain.review;

/**
 * Status of a product review in the moderation workflow.
 */
public enum ReviewStatus {
    PENDING,   // Awaiting moderation
    APPROVED,  // Approved by moderator, visible to public
    REJECTED,  // Rejected by moderator, not visible
    FLAGGED    // Flagged for review (spam, inappropriate)
}
