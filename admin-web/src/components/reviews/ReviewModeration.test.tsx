import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ReviewModeration from './ReviewModeration';
import * as reviewsApi from '@/lib/api/reviews';

// Mock the API
vi.mock('@/lib/api/reviews', () => ({
  reviewsApi: {
    getPendingReviews: vi.fn(),
    getAllReviews: vi.fn(),
    approveReview: vi.fn(),
    rejectReview: vi.fn(),
    deleteReview: vi.fn(),
  },
}));

const mockPendingReviews: reviewsApi.ProductReview[] = [
  {
    id: 'r1',
    tenantId: 'tenant-1',
    productId: 'prod-1',
    userId: 'user-1',
    userName: 'John Doe',
    rating: 4,
    title: 'Great product!',
    comment: 'I really liked this product. It exceeded my expectations.',
    images: ['/img1.jpg', '/img2.jpg'],
    verifiedPurchase: true,
    helpfulCount: 5,
    notHelpfulCount: 1,
    status: 'PENDING',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'r2',
    tenantId: 'tenant-1',
    productId: 'prod-2',
    userId: 'user-2',
    userName: 'Jane Smith',
    rating: 2,
    title: 'Not satisfied',
    comment: 'The product did not meet my expectations.',
    images: [],
    verifiedPurchase: false,
    helpfulCount: 2,
    notHelpfulCount: 8,
    status: 'PENDING',
    createdAt: '2024-01-14T08:00:00Z',
    updatedAt: '2024-01-14T08:00:00Z',
  },
];

const mockAllReviews: reviewsApi.ProductReview[] = [
  ...mockPendingReviews,
  {
    id: 'r3',
    tenantId: 'tenant-1',
    productId: 'prod-1',
    userId: 'user-3',
    userName: 'Bob Wilson',
    rating: 5,
    title: 'Excellent!',
    comment: 'Best purchase I have ever made.',
    images: [],
    verifiedPurchase: true,
    helpfulCount: 20,
    notHelpfulCount: 0,
    status: 'APPROVED',
    createdAt: '2024-01-13T09:00:00Z',
    updatedAt: '2024-01-13T09:00:00Z',
  },
  {
    id: 'r4',
    tenantId: 'tenant-1',
    productId: 'prod-3',
    userId: 'user-4',
    userName: 'Alice Brown',
    rating: 1,
    title: 'Terrible',
    comment: 'Do not buy this product.',
    images: [],
    verifiedPurchase: false,
    helpfulCount: 0,
    notHelpfulCount: 5,
    status: 'REJECTED',
    createdAt: '2024-01-12T14:00:00Z',
    updatedAt: '2024-01-12T14:00:00Z',
  },
];

describe('ReviewModeration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(reviewsApi.reviewsApi.getPendingReviews).mockResolvedValue(mockPendingReviews);
    vi.mocked(reviewsApi.reviewsApi.getAllReviews).mockResolvedValue(mockAllReviews);
  });

  describe('Rendering', () => {
    it('should render the review moderation section', async () => {
      render(<ReviewModeration />);

      await waitFor(() => {
        expect(screen.getByTestId('review-moderation')).toBeInTheDocument();
      });

      expect(screen.getByText('Review Moderation')).toBeInTheDocument();
    });

    it('should display pending reviews by default', async () => {
      render(<ReviewModeration />);

      await waitFor(() => {
        expect(screen.getByText('Great product!')).toBeInTheDocument();
        expect(screen.getByText('Not satisfied')).toBeInTheDocument();
      });

      expect(reviewsApi.reviewsApi.getPendingReviews).toHaveBeenCalled();
    });

    it('should display user names with reviews', async () => {
      render(<ReviewModeration />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      });
    });

    it('should display star ratings', async () => {
      render(<ReviewModeration />);

      await waitFor(() => {
        expect(screen.getByTestId('stars-4')).toBeInTheDocument();
        expect(screen.getByTestId('stars-2')).toBeInTheDocument();
      });
    });

    it('should display helpful counts', async () => {
      render(<ReviewModeration />);

      await waitFor(() => {
        expect(screen.getByText('5 helpful')).toBeInTheDocument();
        expect(screen.getByText('2 helpful')).toBeInTheDocument();
      });
    });

    it('should show Verified Purchase badge', async () => {
      render(<ReviewModeration />);

      await waitFor(() => {
        expect(screen.getByText('Verified Purchase')).toBeInTheDocument();
      });
    });

    it('should show Pending badge for pending reviews', async () => {
      render(<ReviewModeration />);

      await waitFor(() => {
        const badges = screen.getAllByText('Pending');
        expect(badges.length).toBeGreaterThan(0);
      });
    });

    it('should display image count when images are present', async () => {
      render(<ReviewModeration />);

      await waitFor(() => {
        expect(screen.getByText('2 images attached')).toBeInTheDocument();
      });
    });
  });

  describe('Tab Navigation', () => {
    it('should switch to all reviews when tab is clicked', async () => {
      const user = userEvent.setup();
      render(<ReviewModeration />);

      await waitFor(() => {
        expect(screen.getByTestId('review-moderation')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('tab-all'));

      await waitFor(() => {
        expect(reviewsApi.reviewsApi.getAllReviews).toHaveBeenCalled();
      });
    });

    it('should show status filter only on all reviews tab', async () => {
      const user = userEvent.setup();
      render(<ReviewModeration />);

      await waitFor(() => {
        expect(screen.getByTestId('review-moderation')).toBeInTheDocument();
      });

      // Filter should not be visible on pending tab
      expect(screen.queryByTestId('filter-status')).not.toBeInTheDocument();

      // Switch to all tab
      await user.click(screen.getByTestId('tab-all'));

      await waitFor(() => {
        expect(screen.getByTestId('filter-status')).toBeInTheDocument();
      });
    });

    it('should switch back to pending reviews', async () => {
      const user = userEvent.setup();
      render(<ReviewModeration />);

      await waitFor(() => {
        expect(screen.getByTestId('review-moderation')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('tab-all'));
      await waitFor(() => {
        expect(reviewsApi.reviewsApi.getAllReviews).toHaveBeenCalled();
      });

      await user.click(screen.getByTestId('tab-pending'));

      await waitFor(() => {
        expect(reviewsApi.reviewsApi.getPendingReviews).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Approve and Reject', () => {
    it('should show approve and reject buttons for pending reviews', async () => {
      render(<ReviewModeration />);

      await waitFor(() => {
        expect(screen.getByTestId('approve-r1')).toBeInTheDocument();
        expect(screen.getByTestId('reject-r1')).toBeInTheDocument();
      });
    });

    it('should call approve API when approve button is clicked', async () => {
      const user = userEvent.setup();
      const updatedReview = { ...mockPendingReviews[0], status: 'APPROVED' as const };
      vi.mocked(reviewsApi.reviewsApi.approveReview).mockResolvedValue(updatedReview);

      render(<ReviewModeration />);

      await waitFor(() => {
        expect(screen.getByTestId('approve-r1')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('approve-r1'));

      await waitFor(() => {
        expect(reviewsApi.reviewsApi.approveReview).toHaveBeenCalledWith('r1');
      });
    });

    it('should show reject dialog when reject button is clicked', async () => {
      const user = userEvent.setup();
      render(<ReviewModeration />);

      await waitFor(() => {
        expect(screen.getByTestId('reject-r1')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('reject-r1'));

      expect(screen.getByTestId('reject-dialog-r1')).toBeInTheDocument();
      expect(screen.getByTestId('reject-reason-input')).toBeInTheDocument();
    });

    it('should call reject API with reason when confirmed', async () => {
      const user = userEvent.setup();
      const updatedReview = { ...mockPendingReviews[0], status: 'REJECTED' as const };
      vi.mocked(reviewsApi.reviewsApi.rejectReview).mockResolvedValue(updatedReview);

      render(<ReviewModeration />);

      await waitFor(() => {
        expect(screen.getByTestId('reject-r1')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('reject-r1'));
      await user.type(screen.getByTestId('reject-reason-input'), 'Inappropriate content');
      await user.click(screen.getByTestId('confirm-reject'));

      await waitFor(() => {
        expect(reviewsApi.reviewsApi.rejectReview).toHaveBeenCalledWith('r1', 'Inappropriate content');
      });
    });

    it('should cancel reject dialog', async () => {
      const user = userEvent.setup();
      render(<ReviewModeration />);

      await waitFor(() => {
        expect(screen.getByTestId('reject-r1')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('reject-r1'));
      expect(screen.getByTestId('reject-dialog-r1')).toBeInTheDocument();

      await user.click(screen.getByTestId('cancel-reject'));

      expect(screen.queryByTestId('reject-dialog-r1')).not.toBeInTheDocument();
    });

    it('should use custom onApprove handler if provided', async () => {
      const user = userEvent.setup();
      const onApprove = vi.fn().mockResolvedValue(undefined);

      render(<ReviewModeration onApprove={onApprove} />);

      await waitFor(() => {
        expect(screen.getByTestId('approve-r1')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('approve-r1'));

      await waitFor(() => {
        expect(onApprove).toHaveBeenCalledWith('r1');
        expect(reviewsApi.reviewsApi.approveReview).not.toHaveBeenCalled();
      });
    });

    it('should use custom onReject handler if provided', async () => {
      const user = userEvent.setup();
      const onReject = vi.fn().mockResolvedValue(undefined);

      render(<ReviewModeration onReject={onReject} />);

      await waitFor(() => {
        expect(screen.getByTestId('reject-r1')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('reject-r1'));
      await user.type(screen.getByTestId('reject-reason-input'), 'Spam content');
      await user.click(screen.getByTestId('confirm-reject'));

      await waitFor(() => {
        expect(onReject).toHaveBeenCalledWith('r1', 'Spam content');
        expect(reviewsApi.reviewsApi.rejectReview).not.toHaveBeenCalled();
      });
    });

    it('should update review status after approval', async () => {
      const user = userEvent.setup();
      const updatedReview = { ...mockPendingReviews[0], status: 'APPROVED' as const };
      vi.mocked(reviewsApi.reviewsApi.approveReview).mockResolvedValue(updatedReview);

      render(<ReviewModeration />);

      await waitFor(() => {
        expect(screen.getByTestId('approve-r1')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('approve-r1'));

      await waitFor(() => {
        const reviewElement = screen.getByTestId('review-r1');
        expect(reviewElement).toContainElement(screen.getByText('Approved'));
      });
    });
  });

  describe('Search', () => {
    it('should have a search input', async () => {
      render(<ReviewModeration />);

      await waitFor(() => {
        expect(screen.getByTestId('search-input')).toBeInTheDocument();
      });
    });

    it('should filter reviews by search query in title', async () => {
      const user = userEvent.setup();
      render(<ReviewModeration />);

      await waitFor(() => {
        expect(screen.getByTestId('search-input')).toBeInTheDocument();
      });

      await user.type(screen.getByTestId('search-input'), 'Great');

      await waitFor(() => {
        expect(screen.getByText('Great product!')).toBeInTheDocument();
        expect(screen.queryByText('Not satisfied')).not.toBeInTheDocument();
      });
    });

    it('should filter reviews by search query in comment', async () => {
      const user = userEvent.setup();
      render(<ReviewModeration />);

      await waitFor(() => {
        expect(screen.getByTestId('search-input')).toBeInTheDocument();
      });

      await user.type(screen.getByTestId('search-input'), 'expectations');

      await waitFor(() => {
        expect(screen.getByText('Great product!')).toBeInTheDocument();
        expect(screen.getByText('Not satisfied')).toBeInTheDocument();
      });
    });

    it('should filter reviews by user name', async () => {
      const user = userEvent.setup();
      render(<ReviewModeration />);

      await waitFor(() => {
        expect(screen.getByTestId('search-input')).toBeInTheDocument();
      });

      await user.type(screen.getByTestId('search-input'), 'Jane');

      await waitFor(() => {
        expect(screen.queryByText('Great product!')).not.toBeInTheDocument();
        expect(screen.getByText('Not satisfied')).toBeInTheDocument();
      });
    });
  });

  describe('Status Filter', () => {
    it('should filter by status when on all tab', async () => {
      const user = userEvent.setup();
      render(<ReviewModeration />);

      await waitFor(() => {
        expect(screen.getByTestId('review-moderation')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('tab-all'));

      await waitFor(() => {
        expect(screen.getByTestId('filter-status')).toBeInTheDocument();
      });

      await user.selectOptions(screen.getByTestId('filter-status'), 'APPROVED');

      await waitFor(() => {
        expect(screen.getByText('Excellent!')).toBeInTheDocument();
        expect(screen.queryByText('Great product!')).not.toBeInTheDocument();
      });
    });
  });

  describe('Rating Filter', () => {
    it('should filter by rating', async () => {
      const user = userEvent.setup();
      render(<ReviewModeration />);

      await waitFor(() => {
        expect(screen.getByTestId('filter-rating')).toBeInTheDocument();
      });

      await user.selectOptions(screen.getByTestId('filter-rating'), '4');

      await waitFor(() => {
        expect(screen.getByText('Great product!')).toBeInTheDocument();
        expect(screen.queryByText('Not satisfied')).not.toBeInTheDocument();
      });
    });
  });

  describe('Delete Review', () => {
    it('should show delete button for all reviews', async () => {
      render(<ReviewModeration />);

      await waitFor(() => {
        expect(screen.getByTestId('delete-r1')).toBeInTheDocument();
        expect(screen.getByTestId('delete-r2')).toBeInTheDocument();
      });
    });

    it('should confirm before deleting', async () => {
      const user = userEvent.setup();
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

      render(<ReviewModeration />);

      await waitFor(() => {
        expect(screen.getByTestId('delete-r1')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('delete-r1'));

      expect(confirmSpy).toHaveBeenCalledWith('Are you sure you want to delete this review?');
      expect(reviewsApi.reviewsApi.deleteReview).not.toHaveBeenCalled();

      confirmSpy.mockRestore();
    });

    it('should delete review when confirmed', async () => {
      const user = userEvent.setup();
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
      vi.mocked(reviewsApi.reviewsApi.deleteReview).mockResolvedValue(undefined);

      render(<ReviewModeration />);

      await waitFor(() => {
        expect(screen.getByTestId('delete-r1')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('delete-r1'));

      await waitFor(() => {
        expect(reviewsApi.reviewsApi.deleteReview).toHaveBeenCalledWith('r1');
      });

      confirmSpy.mockRestore();
    });

    it('should remove review from list after deletion', async () => {
      const user = userEvent.setup();
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
      vi.mocked(reviewsApi.reviewsApi.deleteReview).mockResolvedValue(undefined);

      render(<ReviewModeration />);

      await waitFor(() => {
        expect(screen.getByTestId('review-r1')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('delete-r1'));

      await waitFor(() => {
        expect(screen.queryByTestId('review-r1')).not.toBeInTheDocument();
      });

      confirmSpy.mockRestore();
    });
  });

  describe('Empty State', () => {
    it('should display empty state when no pending reviews', async () => {
      vi.mocked(reviewsApi.reviewsApi.getPendingReviews).mockResolvedValue([]);

      render(<ReviewModeration />);

      await waitFor(() => {
        expect(screen.getByTestId('empty-state')).toBeInTheDocument();
        expect(screen.getByText('No reviews found')).toBeInTheDocument();
        expect(screen.getByText('All reviews have been moderated')).toBeInTheDocument();
      });
    });

    it('should display empty state when search has no results', async () => {
      const user = userEvent.setup();
      render(<ReviewModeration />);

      await waitFor(() => {
        expect(screen.getByTestId('search-input')).toBeInTheDocument();
      });

      await user.type(screen.getByTestId('search-input'), 'nonexistent query xyz');

      await waitFor(() => {
        expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      });
    });
  });

  describe('Loading State', () => {
    it('should show loading skeleton while fetching data', () => {
      vi.mocked(reviewsApi.reviewsApi.getPendingReviews).mockImplementation(
        () => new Promise(() => {})
      );

      render(<ReviewModeration />);

      expect(document.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
    });
  });

  describe('Error State', () => {
    it('should display error message when API fails', async () => {
      vi.mocked(reviewsApi.reviewsApi.getPendingReviews).mockRejectedValue(new Error('API Error'));

      render(<ReviewModeration />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load reviews')).toBeInTheDocument();
      });
    });

    it('should show retry button on error', async () => {
      vi.mocked(reviewsApi.reviewsApi.getPendingReviews).mockRejectedValue(new Error('API Error'));

      render(<ReviewModeration />);

      await waitFor(() => {
        expect(screen.getByText('Try Again')).toBeInTheDocument();
      });
    });

    it('should retry fetching when retry button is clicked', async () => {
      const user = userEvent.setup();
      vi.mocked(reviewsApi.reviewsApi.getPendingReviews)
        .mockRejectedValueOnce(new Error('API Error'))
        .mockResolvedValueOnce(mockPendingReviews);

      render(<ReviewModeration />);

      await waitFor(() => {
        expect(screen.getByText('Try Again')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Try Again'));

      await waitFor(() => {
        expect(reviewsApi.reviewsApi.getPendingReviews).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Refresh', () => {
    it('should have a refresh button', async () => {
      render(<ReviewModeration />);

      await waitFor(() => {
        expect(screen.getByTestId('refresh-btn')).toBeInTheDocument();
      });
    });

    it('should refresh reviews when refresh button is clicked', async () => {
      const user = userEvent.setup();
      render(<ReviewModeration />);

      await waitFor(() => {
        expect(screen.getByTestId('refresh-btn')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('refresh-btn'));

      await waitFor(() => {
        expect(reviewsApi.reviewsApi.getPendingReviews).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Stats Footer', () => {
    it('should display review count', async () => {
      render(<ReviewModeration />);

      await waitFor(() => {
        expect(screen.getByText('Showing 2 of 2 reviews')).toBeInTheDocument();
      });
    });

    it('should display pending moderation count', async () => {
      render(<ReviewModeration />);

      await waitFor(() => {
        expect(screen.getByText('2 pending moderation')).toBeInTheDocument();
      });
    });
  });
});
