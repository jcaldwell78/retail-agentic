import { api } from './client';

/**
 * Product review types for admin moderation
 */
export type ReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'FLAGGED';

export interface ProductReview {
  id: string;
  tenantId: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  title: string;
  comment: string;
  images: string[];
  verifiedPurchase: boolean;
  helpfulCount: number;
  notHelpfulCount: number;
  status: ReviewStatus;
  createdAt: string;
  updatedAt: string;
  verifiedAt?: string;
}

export interface ReviewStatistics {
  totalReviews: number;
  pendingReviews: number;
  averageRating: number;
  ratingDistribution: Record<number, number>;
}

const BASE_URL = '/api/v1/reviews';

/**
 * Get all pending reviews for moderation
 */
export async function getPendingReviews(): Promise<ProductReview[]> {
  return api.get<ProductReview[]>(`${BASE_URL}/admin/pending`);
}

/**
 * Get all reviews (for admin view)
 */
export async function getAllReviews(): Promise<ProductReview[]> {
  return api.get<ProductReview[]>(`${BASE_URL}/admin/all`);
}

/**
 * Approve a review
 */
export async function approveReview(reviewId: string): Promise<ProductReview> {
  return api.post<ProductReview>(`${BASE_URL}/admin/${reviewId}/approve`);
}

/**
 * Reject a review
 */
export async function rejectReview(reviewId: string, reason: string): Promise<ProductReview> {
  return api.post<ProductReview>(`${BASE_URL}/admin/${reviewId}/reject?reason=${encodeURIComponent(reason)}`);
}

/**
 * Delete a review (admin only)
 */
export async function deleteReview(reviewId: string): Promise<void> {
  return api.delete<void>(`${BASE_URL}/admin/${reviewId}`);
}

/**
 * Get review statistics
 */
export async function getReviewStatistics(productId?: string): Promise<ReviewStatistics> {
  const url = productId
    ? `${BASE_URL}/products/${productId}/statistics`
    : `${BASE_URL}/admin/statistics`;
  return api.get<ReviewStatistics>(url);
}

export const reviewsApi = {
  getPendingReviews,
  getAllReviews,
  approveReview,
  rejectReview,
  deleteReview,
  getReviewStatistics,
};
