import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle,
  XCircle,
  Star,
  Clock,
  User,
  AlertCircle,
  Trash2,
  Search,
  Filter,
  RefreshCw,
  Image as ImageIcon,
  ShieldCheck,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';
import { reviewsApi, type ProductReview, type ReviewStatus } from '@/lib/api/reviews';

export type ModerationTab = 'pending' | 'all';
export type FilterStatus = 'ALL' | ReviewStatus;

interface ReviewModerationProps {
  className?: string;
  onApprove?: (reviewId: string) => Promise<void>;
  onReject?: (reviewId: string, reason: string) => Promise<void>;
  onDelete?: (reviewId: string) => Promise<void>;
}

export default function ReviewModeration({
  className = '',
  onApprove,
  onReject,
  onDelete,
}: ReviewModerationProps) {
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ModerationTab>('pending');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('ALL');
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [rejectReasonDialogId, setRejectReasonDialogId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const fetchReviews = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = activeTab === 'pending'
        ? await reviewsApi.getPendingReviews()
        : await reviewsApi.getAllReviews();
      setReviews(data);
    } catch (err) {
      setError('Failed to load reviews');
      console.error('Error loading reviews:', err);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleApprove = async (reviewId: string) => {
    setProcessingIds(prev => new Set(prev).add(reviewId));
    try {
      if (onApprove) {
        await onApprove(reviewId);
      } else {
        await reviewsApi.approveReview(reviewId);
      }
      setReviews(prev => prev.map(r =>
        r.id === reviewId ? { ...r, status: 'APPROVED' as const } : r
      ));
    } catch (err) {
      console.error('Error approving review:', err);
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(reviewId);
        return newSet;
      });
    }
  };

  const handleReject = async (reviewId: string) => {
    if (!rejectReason.trim()) return;

    setProcessingIds(prev => new Set(prev).add(reviewId));
    try {
      if (onReject) {
        await onReject(reviewId, rejectReason);
      } else {
        await reviewsApi.rejectReview(reviewId, rejectReason);
      }
      setReviews(prev => prev.map(r =>
        r.id === reviewId ? { ...r, status: 'REJECTED' as const } : r
      ));
      setRejectReasonDialogId(null);
      setRejectReason('');
    } catch (err) {
      console.error('Error rejecting review:', err);
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(reviewId);
        return newSet;
      });
    }
  };

  const handleDelete = async (reviewId: string) => {
    if (!confirm('Are you sure you want to delete this review?')) {
      return;
    }
    setProcessingIds(prev => new Set(prev).add(reviewId));
    try {
      if (onDelete) {
        await onDelete(reviewId);
      } else {
        await reviewsApi.deleteReview(reviewId);
      }
      setReviews(prev => prev.filter(r => r.id !== reviewId));
    } catch (err) {
      console.error('Error deleting review:', err);
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(reviewId);
        return newSet;
      });
    }
  };

  const filteredReviews = reviews.filter(r => {
    const matchesStatus = filterStatus === 'ALL' || r.status === filterStatus;
    const matchesRating = filterRating === null || r.rating === filterRating;
    const matchesSearch = !searchQuery ||
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.comment.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.userName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesRating && matchesSearch;
  });

  const getStatusBadge = (status: ReviewStatus) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'APPROVED':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Approved</Badge>;
      case 'REJECTED':
        return <Badge variant="secondary" className="bg-red-100 text-red-800">Rejected</Badge>;
      case 'FLAGGED':
        return <Badge variant="secondary" className="bg-orange-100 text-orange-800">Flagged</Badge>;
      default:
        return null;
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5" data-testid={`stars-${rating}`}>
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            className={`w-4 h-4 ${star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
          />
        ))}
        <span className="ml-1 text-sm text-gray-600">({rating}/5)</span>
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`} data-testid="review-moderation">
        <Card className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${className}`} data-testid="review-moderation">
        <Card className="p-6">
          <div className="text-center text-red-600">
            <AlertCircle className="w-12 h-12 mx-auto mb-2" />
            <p>{error}</p>
            <Button onClick={fetchReviews} className="mt-4" variant="outline">
              Try Again
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`} data-testid="review-moderation">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Review Moderation</h1>
        <Button onClick={fetchReviews} variant="outline" size="sm" data-testid="refresh-btn">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <Button
          variant={activeTab === 'pending' ? 'default' : 'outline'}
          onClick={() => setActiveTab('pending')}
          data-testid="tab-pending"
        >
          <Clock className="w-4 h-4 mr-2" />
          Pending Review
        </Button>
        <Button
          variant={activeTab === 'all' ? 'default' : 'outline'}
          onClick={() => setActiveTab('all')}
          data-testid="tab-all"
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          All Reviews
        </Button>
      </div>

      {/* Search and Filters */}
      <Card className="p-4">
        <div className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search reviews..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              data-testid="search-input"
            />
          </div>
          {activeTab === 'all' && (
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                data-testid="filter-status"
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="FLAGGED">Flagged</option>
              </select>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-gray-400" />
            <select
              value={filterRating ?? ''}
              onChange={(e) => setFilterRating(e.target.value ? Number(e.target.value) : null)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              data-testid="filter-rating"
            >
              <option value="">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Reviews List */}
      <Card>
        {filteredReviews.length === 0 ? (
          <div className="p-8 text-center text-gray-500" data-testid="empty-state">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p className="font-medium">No reviews found</p>
            <p className="text-sm mt-1">
              {activeTab === 'pending'
                ? 'All reviews have been moderated'
                : 'No reviews match your search criteria'}
            </p>
          </div>
        ) : (
          <div className="divide-y" data-testid="reviews-list">
            {filteredReviews.map((review) => (
              <div
                key={review.id}
                className="p-4"
                data-testid={`review-${review.id}`}
              >
                {/* Review Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-sm">{review.userName}</span>
                      <span className="text-gray-400">|</span>
                      <span className="text-sm text-gray-500">{formatDate(review.createdAt)}</span>
                      {getStatusBadge(review.status)}
                      {review.verifiedPurchase && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          <ShieldCheck className="w-3 h-3 mr-1" />
                          Verified Purchase
                        </Badge>
                      )}
                    </div>

                    {/* Rating */}
                    {renderStars(review.rating)}

                    {/* Title & Comment */}
                    <h3 className="font-semibold mt-2">{review.title}</h3>
                    <p className="text-gray-700 mt-1">{review.comment}</p>

                    {/* Images */}
                    {review.images && review.images.length > 0 && (
                      <div className="flex items-center gap-2 mt-3">
                        <ImageIcon className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-500">
                          {review.images.length} image{review.images.length > 1 ? 's' : ''} attached
                        </span>
                        <div className="flex gap-2">
                          {review.images.slice(0, 3).map((img, idx) => (
                            <img
                              key={idx}
                              src={img}
                              alt={`Review image ${idx + 1}`}
                              className="w-12 h-12 object-cover rounded border"
                            />
                          ))}
                          {review.images.length > 3 && (
                            <div className="w-12 h-12 rounded border bg-gray-100 flex items-center justify-center text-sm text-gray-500">
                              +{review.images.length - 3}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Helpful Counts */}
                    <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="w-4 h-4" />
                        {review.helpfulCount} helpful
                      </span>
                      <span className="flex items-center gap-1">
                        <ThumbsDown className="w-4 h-4" />
                        {review.notHelpfulCount} not helpful
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    {review.status === 'PENDING' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          onClick={() => handleApprove(review.id)}
                          disabled={processingIds.has(review.id)}
                          data-testid={`approve-${review.id}`}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => setRejectReasonDialogId(review.id)}
                          disabled={processingIds.has(review.id)}
                          data-testid={`reject-${review.id}`}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleDelete(review.id)}
                      disabled={processingIds.has(review.id)}
                      data-testid={`delete-${review.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Reject Reason Dialog */}
                {rejectReasonDialogId === review.id && (
                  <div className="mt-4 p-4 bg-red-50 rounded-lg" data-testid={`reject-dialog-${review.id}`}>
                    <h4 className="font-medium text-red-800 mb-2">Rejection Reason</h4>
                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Enter reason for rejecting this review..."
                      className="w-full p-2 border border-red-200 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                      rows={3}
                      data-testid="reject-reason-input"
                    />
                    <div className="flex gap-2 mt-2">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleReject(review.id)}
                        disabled={!rejectReason.trim() || processingIds.has(review.id)}
                        data-testid="confirm-reject"
                      >
                        Confirm Rejection
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setRejectReasonDialogId(null);
                          setRejectReason('');
                        }}
                        data-testid="cancel-reject"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Stats Footer */}
      <Card className="p-4">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            Showing {filteredReviews.length} of {reviews.length} reviews
          </span>
          <span>
            {reviews.filter(r => r.status === 'PENDING').length} pending moderation
          </span>
        </div>
      </Card>
    </div>
  );
}
