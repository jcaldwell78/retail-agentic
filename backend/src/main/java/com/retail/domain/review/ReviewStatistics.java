package com.retail.domain.review;

/**
 * Aggregated statistics for product reviews.
 */
public class ReviewStatistics {

    private Double averageRating;
    private Integer totalReviews;
    private int[] ratingDistribution; // Count of 1-star, 2-star, ..., 5-star reviews

    public ReviewStatistics() {
    }

    public ReviewStatistics(Double averageRating, Integer totalReviews, int[] ratingDistribution) {
        this.averageRating = averageRating;
        this.totalReviews = totalReviews;
        this.ratingDistribution = ratingDistribution;
    }

    public Double getAverageRating() {
        return averageRating;
    }

    public void setAverageRating(Double averageRating) {
        this.averageRating = averageRating;
    }

    public Integer getTotalReviews() {
        return totalReviews;
    }

    public void setTotalReviews(Integer totalReviews) {
        this.totalReviews = totalReviews;
    }

    public int[] getRatingDistribution() {
        return ratingDistribution;
    }

    public void setRatingDistribution(int[] ratingDistribution) {
        this.ratingDistribution = ratingDistribution;
    }

    /**
     * Get percentage of reviews for a specific rating.
     */
    public double getRatingPercentage(int rating) {
        if (totalReviews == 0 || rating < 1 || rating > 5) {
            return 0.0;
        }
        return (ratingDistribution[rating - 1] * 100.0) / totalReviews;
    }

    /**
     * Get count of 5-star reviews.
     */
    public int getFiveStarCount() {
        return ratingDistribution != null && ratingDistribution.length == 5 ?
ratingDistribution[4] : 0;
    }

    /**
     * Get count of 4-star reviews.
     */
    public int getFourStarCount() {
        return ratingDistribution != null && ratingDistribution.length == 5 ? ratingDistribution[3] : 0;
    }

    /**
     * Get count of 3-star reviews.
     */
    public int getThreeStarCount() {
        return ratingDistribution != null && ratingDistribution.length == 5 ? ratingDistribution[2] : 0;
    }

    /**
     * Get count of 2-star reviews.
     */
    public int getTwoStarCount() {
        return ratingDistribution != null && ratingDistribution.length == 5 ? ratingDistribution[1] : 0;
    }

    /**
     * Get count of 1-star reviews.
     */
    public int getOneStarCount() {
        return ratingDistribution != null && ratingDistribution.length == 5 ? ratingDistribution[0] : 0;
    }
}
