import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  ProductReviewsProvider,
  useProductReviews,
  StarRating,
  RatingSummary,
  ReviewFiltersBar,
  ReviewCard,
  ReviewList,
  ReviewForm,
  ProductReviews,
  ReviewMediaUpload,
  MediaGallery,
  Review,
  ReviewStats,
  UploadedMedia,
  ReviewMedia,
} from './ProductReviews';

// Test consumer component
function TestReviewsConsumer() {
  const context = useProductReviews();

  return (
    <div>
      <span data-testid="reviews-count">{context.reviews.length}</span>
      <span data-testid="is-loading">{context.isLoading.toString()}</span>
      <span data-testid="error">{context.error || 'none'}</span>
      <span data-testid="has-more">{context.hasMore.toString()}</span>
      <span data-testid="filter-rating">{context.filters.rating || 'none'}</span>
      <span data-testid="filter-sort">{context.filters.sortBy}</span>
      <button
        data-testid="set-filter"
        onClick={() => context.setFilters({ rating: 5 })}
      >
        Set Filter
      </button>
      <button
        data-testid="clear-filters"
        onClick={() => context.clearFilters()}
      >
        Clear
      </button>
      <button
        data-testid="load-more"
        onClick={() => context.loadMore()}
      >
        Load More
      </button>
    </div>
  );
}

// Mock data
const mockReview: Review = {
  id: 'review-1',
  productId: 'prod-1',
  author: {
    id: 'user-1',
    name: 'John Doe',
    avatar: '/avatar.jpg',
    isVerifiedPurchase: true,
  },
  rating: 4,
  title: 'Great product!',
  content: 'I really enjoyed using this product. It exceeded my expectations.',
  images: ['/image1.jpg', '/image2.jpg'],
  helpfulCount: 10,
  notHelpfulCount: 2,
  createdAt: new Date('2024-01-15'),
  isRecommended: true,
  pros: ['Great quality', 'Fast shipping'],
  cons: ['A bit pricey'],
};

const mockReviews: Review[] = [
  mockReview,
  { ...mockReview, id: 'review-2', title: 'Good but not great', rating: 3 },
  { ...mockReview, id: 'review-3', title: 'Excellent!', rating: 5 },
];

const mockStats: ReviewStats = {
  averageRating: 4.2,
  totalReviews: 150,
  ratingDistribution: { 5: 80, 4: 40, 3: 20, 2: 7, 1: 3 },
  recommendedPercentage: 85,
};

describe('ProductReviewsProvider', () => {
  it('should provide default context values', () => {
    render(
      <ProductReviewsProvider productId="prod-1">
        <TestReviewsConsumer />
      </ProductReviewsProvider>
    );

    expect(screen.getByTestId('reviews-count')).toHaveTextContent('0');
    expect(screen.getByTestId('is-loading')).toHaveTextContent('false');
    expect(screen.getByTestId('error')).toHaveTextContent('none');
    expect(screen.getByTestId('filter-sort')).toHaveTextContent('helpful');
  });

  it('should accept initial reviews', () => {
    render(
      <ProductReviewsProvider productId="prod-1" initialReviews={mockReviews}>
        <TestReviewsConsumer />
      </ProductReviewsProvider>
    );

    expect(screen.getByTestId('reviews-count')).toHaveTextContent('3');
  });

  it('should update filters', async () => {
    render(
      <ProductReviewsProvider productId="prod-1">
        <TestReviewsConsumer />
      </ProductReviewsProvider>
    );

    await userEvent.click(screen.getByTestId('set-filter'));
    expect(screen.getByTestId('filter-rating')).toHaveTextContent('5');
  });

  it('should clear filters', async () => {
    render(
      <ProductReviewsProvider productId="prod-1">
        <TestReviewsConsumer />
      </ProductReviewsProvider>
    );

    await userEvent.click(screen.getByTestId('set-filter'));
    expect(screen.getByTestId('filter-rating')).toHaveTextContent('5');

    await userEvent.click(screen.getByTestId('clear-filters'));
    expect(screen.getByTestId('filter-rating')).toHaveTextContent('none');
  });

  it('should call fetchReviews when loading more', async () => {
    const fetchReviews = vi.fn().mockResolvedValue({ reviews: mockReviews, hasMore: false });

    render(
      <ProductReviewsProvider productId="prod-1" fetchReviews={fetchReviews}>
        <TestReviewsConsumer />
      </ProductReviewsProvider>
    );

    await userEvent.click(screen.getByTestId('load-more'));

    await waitFor(() => {
      expect(fetchReviews).toHaveBeenCalledWith('prod-1', expect.any(Object), 1);
    });
  });

  it('should handle fetch error', async () => {
    const fetchReviews = vi.fn().mockRejectedValue(new Error('Network error'));

    render(
      <ProductReviewsProvider productId="prod-1" fetchReviews={fetchReviews}>
        <TestReviewsConsumer />
      </ProductReviewsProvider>
    );

    await userEvent.click(screen.getByTestId('load-more'));

    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('Network error');
    });
  });
});

describe('useProductReviews', () => {
  it('should throw error when used outside provider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<TestReviewsConsumer />);
    }).toThrow('useProductReviews must be used within a ProductReviewsProvider');

    consoleError.mockRestore();
  });
});

describe('StarRating', () => {
  it('should render correct number of stars', () => {
    render(<StarRating rating={3} />);

    expect(screen.getByTestId('star-rating')).toBeInTheDocument();
    expect(screen.getByTestId('star-1')).toBeInTheDocument();
    expect(screen.getByTestId('star-5')).toBeInTheDocument();
  });

  it('should display rating value when showValue is true', () => {
    render(<StarRating rating={4.5} showValue />);

    expect(screen.getByTestId('rating-value')).toHaveTextContent('4.5');
  });

  it('should be interactive when interactive prop is true', async () => {
    const onChange = vi.fn();
    render(<StarRating rating={0} interactive onChange={onChange} />);

    await userEvent.click(screen.getByTestId('star-4'));
    expect(onChange).toHaveBeenCalledWith(4);
  });

  it('should not be interactive by default', async () => {
    const onChange = vi.fn();
    render(<StarRating rating={3} onChange={onChange} />);

    await userEvent.click(screen.getByTestId('star-4'));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('should have aria-labels for accessibility', () => {
    render(<StarRating rating={3} />);

    expect(screen.getByLabelText('1 star')).toBeInTheDocument();
    expect(screen.getByLabelText('3 stars')).toBeInTheDocument();
  });
});

describe('RatingSummary', () => {
  it('should render rating summary', () => {
    render(<RatingSummary stats={mockStats} />);

    expect(screen.getByTestId('rating-summary')).toBeInTheDocument();
    expect(screen.getByTestId('average-rating')).toHaveTextContent('4.2');
    expect(screen.getByTestId('total-reviews')).toHaveTextContent('Based on 150 reviews');
  });

  it('should show recommended percentage', () => {
    render(<RatingSummary stats={mockStats} />);

    expect(screen.getByTestId('recommended-percentage')).toHaveTextContent('85% would recommend');
  });

  it('should render rating distribution bars', () => {
    render(<RatingSummary stats={mockStats} />);

    expect(screen.getByTestId('rating-distribution')).toBeInTheDocument();
    expect(screen.getByTestId('rating-bar-5')).toBeInTheDocument();
    expect(screen.getByTestId('rating-bar-1')).toBeInTheDocument();
  });

  it('should call onRatingClick when rating bar clicked', async () => {
    const onRatingClick = vi.fn();
    render(<RatingSummary stats={mockStats} onRatingClick={onRatingClick} />);

    await userEvent.click(screen.getByTestId('rating-bar-5'));
    expect(onRatingClick).toHaveBeenCalledWith(5);
  });
});

describe('ReviewFiltersBar', () => {
  const renderFiltersBar = () => {
    return render(
      <ProductReviewsProvider productId="prod-1">
        <ReviewFiltersBar />
      </ProductReviewsProvider>
    );
  };

  it('should render filter options', () => {
    renderFiltersBar();

    expect(screen.getByTestId('review-filters')).toBeInTheDocument();
    expect(screen.getByTestId('search-reviews')).toBeInTheDocument();
    expect(screen.getByTestId('sort-reviews')).toBeInTheDocument();
  });

  it('should render rating filter buttons', () => {
    renderFiltersBar();

    for (let i = 1; i <= 5; i++) {
      expect(screen.getByTestId(`filter-rating-${i}`)).toBeInTheDocument();
    }
  });

  it('should have verified purchase filter', () => {
    renderFiltersBar();

    expect(screen.getByTestId('filter-verified')).toBeInTheDocument();
  });

  it('should have with photos filter', () => {
    renderFiltersBar();

    expect(screen.getByTestId('filter-with-images')).toBeInTheDocument();
  });

  it('should toggle rating filter', async () => {
    renderFiltersBar();

    const ratingButton = screen.getByTestId('filter-rating-5');
    await userEvent.click(ratingButton);
    expect(ratingButton).toHaveClass('bg-yellow-100');

    await userEvent.click(ratingButton);
    expect(ratingButton).not.toHaveClass('bg-yellow-100');
  });

  it('should show clear filters when filters active', async () => {
    renderFiltersBar();

    await userEvent.click(screen.getByTestId('filter-rating-5'));
    expect(screen.getByTestId('clear-filters')).toBeInTheDocument();
  });
});

describe('ReviewCard', () => {
  const renderReviewCard = (review: Review = mockReview) => {
    return render(
      <ProductReviewsProvider productId="prod-1">
        <ReviewCard review={review} />
      </ProductReviewsProvider>
    );
  };

  it('should render review card', () => {
    renderReviewCard();

    expect(screen.getByTestId('review-review-1')).toBeInTheDocument();
    expect(screen.getByTestId('review-author')).toHaveTextContent('John Doe');
    expect(screen.getByTestId('review-title')).toHaveTextContent('Great product!');
    expect(screen.getByTestId('review-content')).toHaveTextContent('I really enjoyed');
  });

  it('should show verified purchase badge', () => {
    renderReviewCard();

    expect(screen.getByTestId('verified-badge')).toBeInTheDocument();
  });

  it('should not show verified badge when not verified', () => {
    const review = {
      ...mockReview,
      author: { ...mockReview.author, isVerifiedPurchase: false },
    };
    renderReviewCard(review);

    expect(screen.queryByTestId('verified-badge')).not.toBeInTheDocument();
  });

  it('should display review date', () => {
    renderReviewCard();

    expect(screen.getByTestId('review-date')).toBeInTheDocument();
  });

  it('should show pros and cons', () => {
    renderReviewCard();

    expect(screen.getByTestId('review-pros')).toBeInTheDocument();
    expect(screen.getByTestId('review-cons')).toBeInTheDocument();
    expect(screen.getByText('Great quality')).toBeInTheDocument();
    expect(screen.getByText('A bit pricey')).toBeInTheDocument();
  });

  it('should show review media', () => {
    renderReviewCard();

    // Uses new MediaGallery component
    expect(screen.getByTestId('review-media')).toBeInTheDocument();
    expect(screen.getByTestId('media-gallery')).toBeInTheDocument();
  });

  it('should show recommendation status', () => {
    renderReviewCard();

    expect(screen.getByTestId('review-recommendation')).toHaveTextContent('Would recommend');
  });

  it('should show helpful voting buttons', () => {
    renderReviewCard();

    expect(screen.getByTestId('vote-helpful')).toHaveTextContent('Yes (10)');
    expect(screen.getByTestId('vote-not-helpful')).toHaveTextContent('No (2)');
  });

  it('should call voteHelpful when clicked', async () => {
    const onVoteHelpful = vi.fn().mockResolvedValue(undefined);

    render(
      <ProductReviewsProvider productId="prod-1" onVoteHelpful={onVoteHelpful}>
        <ReviewCard review={mockReview} />
      </ProductReviewsProvider>
    );

    await userEvent.click(screen.getByTestId('vote-helpful'));
    expect(onVoteHelpful).toHaveBeenCalledWith('review-1');
  });

  it('should call voteNotHelpful when clicked', async () => {
    const onVoteNotHelpful = vi.fn().mockResolvedValue(undefined);

    render(
      <ProductReviewsProvider productId="prod-1" onVoteNotHelpful={onVoteNotHelpful}>
        <ReviewCard review={mockReview} />
      </ProductReviewsProvider>
    );

    await userEvent.click(screen.getByTestId('vote-not-helpful'));
    expect(onVoteNotHelpful).toHaveBeenCalledWith('review-1');
  });

  it('should show avatar or initial', () => {
    renderReviewCard();

    expect(screen.getByAltText('John Doe')).toBeInTheDocument();
  });

  it('should show initial when no avatar', () => {
    const review = {
      ...mockReview,
      author: { ...mockReview.author, avatar: undefined },
    };
    renderReviewCard(review);

    expect(screen.getByText('J')).toBeInTheDocument();
  });
});

describe('ReviewList', () => {
  it('should render list of reviews', () => {
    render(
      <ProductReviewsProvider productId="prod-1" initialReviews={mockReviews}>
        <ReviewList />
      </ProductReviewsProvider>
    );

    expect(screen.getByTestId('review-list')).toBeInTheDocument();
    expect(screen.getByTestId('review-review-1')).toBeInTheDocument();
    expect(screen.getByTestId('review-review-2')).toBeInTheDocument();
    expect(screen.getByTestId('review-review-3')).toBeInTheDocument();
  });

  it('should show no reviews message when empty', () => {
    render(
      <ProductReviewsProvider productId="prod-1" initialReviews={[]}>
        <ReviewList />
      </ProductReviewsProvider>
    );

    expect(screen.getByTestId('no-reviews')).toHaveTextContent('No reviews yet');
  });

  it('should show load more button when hasMore is true', () => {
    const fetchReviews = vi.fn().mockResolvedValue({ reviews: [], hasMore: true });

    render(
      <ProductReviewsProvider productId="prod-1" initialReviews={mockReviews} fetchReviews={fetchReviews}>
        <ReviewList />
      </ProductReviewsProvider>
    );

    expect(screen.getByTestId('load-more')).toBeInTheDocument();
  });

  it('should call loadMore when button clicked', async () => {
    const fetchReviews = vi.fn().mockResolvedValue({ reviews: [], hasMore: false });

    render(
      <ProductReviewsProvider productId="prod-1" initialReviews={mockReviews} fetchReviews={fetchReviews}>
        <ReviewList />
      </ProductReviewsProvider>
    );

    await userEvent.click(screen.getByTestId('load-more'));
    expect(fetchReviews).toHaveBeenCalled();
  });
});

describe('ReviewForm', () => {
  const renderReviewForm = (onSubmitReview = vi.fn().mockResolvedValue(undefined)) => {
    return render(
      <ProductReviewsProvider productId="prod-1" onSubmitReview={onSubmitReview}>
        <ReviewForm productId="prod-1" />
      </ProductReviewsProvider>
    );
  };

  it('should render review form', () => {
    renderReviewForm();

    expect(screen.getByTestId('review-form')).toBeInTheDocument();
    expect(screen.getByTestId('review-title-input')).toBeInTheDocument();
    expect(screen.getByTestId('review-content-input')).toBeInTheDocument();
    expect(screen.getByTestId('submit-review')).toBeInTheDocument();
  });

  it('should have interactive star rating', async () => {
    renderReviewForm();

    await userEvent.click(screen.getByTestId('star-4'));
    // Star 4 should be filled (yellow)
    expect(screen.getByTestId('star-4').querySelector('svg')).toHaveClass('text-yellow-400');
  });

  it('should show error for missing rating', async () => {
    renderReviewForm();

    await userEvent.type(screen.getByTestId('review-title-input'), 'Test Title');
    await userEvent.type(screen.getByTestId('review-content-input'), 'Test content');
    await userEvent.click(screen.getByTestId('submit-review'));

    expect(screen.getByTestId('form-error')).toHaveTextContent('Please select a rating');
  });

  it('should show error for missing title', async () => {
    renderReviewForm();

    await userEvent.click(screen.getByTestId('star-5'));
    await userEvent.type(screen.getByTestId('review-content-input'), 'Test content');
    await userEvent.click(screen.getByTestId('submit-review'));

    expect(screen.getByTestId('form-error')).toHaveTextContent('Please enter a title');
  });

  it('should show error for missing content', async () => {
    renderReviewForm();

    await userEvent.click(screen.getByTestId('star-5'));
    await userEvent.type(screen.getByTestId('review-title-input'), 'Test Title');
    await userEvent.click(screen.getByTestId('submit-review'));

    expect(screen.getByTestId('form-error')).toHaveTextContent('Please enter a review');
  });

  it('should call onSubmitReview with valid data', async () => {
    const onSubmitReview = vi.fn().mockResolvedValue(undefined);
    renderReviewForm(onSubmitReview);

    await userEvent.click(screen.getByTestId('star-5'));
    await userEvent.type(screen.getByTestId('review-title-input'), 'Great product!');
    await userEvent.type(screen.getByTestId('review-content-input'), 'I love this product');
    await userEvent.click(screen.getByTestId('submit-review'));

    await waitFor(() => {
      expect(onSubmitReview).toHaveBeenCalledWith(expect.objectContaining({
        productId: 'prod-1',
        rating: 5,
        title: 'Great product!',
        content: 'I love this product',
      }));
    });
  });

  it('should have pros and cons inputs', () => {
    renderReviewForm();

    expect(screen.getByTestId('review-pros-input')).toBeInTheDocument();
    expect(screen.getByTestId('review-cons-input')).toBeInTheDocument();
  });

  it('should have recommendation radio buttons', () => {
    renderReviewForm();

    expect(screen.getByTestId('recommend-yes')).toBeInTheDocument();
    expect(screen.getByTestId('recommend-no')).toBeInTheDocument();
  });

  it('should reset form after successful submission', async () => {
    const onSubmitReview = vi.fn().mockResolvedValue(undefined);
    renderReviewForm(onSubmitReview);

    await userEvent.click(screen.getByTestId('star-5'));
    await userEvent.type(screen.getByTestId('review-title-input'), 'Great product!');
    await userEvent.type(screen.getByTestId('review-content-input'), 'I love this product');
    await userEvent.click(screen.getByTestId('submit-review'));

    await waitFor(() => {
      expect(screen.getByTestId('review-title-input')).toHaveValue('');
      expect(screen.getByTestId('review-content-input')).toHaveValue('');
    });
  });
});

describe('ProductReviews', () => {
  it('should render product reviews component', () => {
    render(
      <ProductReviews
        productId="prod-1"
        initialReviews={mockReviews}
        initialStats={mockStats}
      />
    );

    expect(screen.getByTestId('product-reviews')).toBeInTheDocument();
    expect(screen.getByTestId('rating-summary')).toBeInTheDocument();
    expect(screen.getByTestId('review-form')).toBeInTheDocument();
    expect(screen.getByTestId('review-filters')).toBeInTheDocument();
    expect(screen.getByTestId('review-list')).toBeInTheDocument();
  });

  it('should hide form when showForm is false', () => {
    render(
      <ProductReviews
        productId="prod-1"
        initialReviews={mockReviews}
        showForm={false}
      />
    );

    expect(screen.queryByTestId('review-form')).not.toBeInTheDocument();
  });

  it('should not show stats when not provided', () => {
    render(
      <ProductReviews
        productId="prod-1"
        initialReviews={mockReviews}
      />
    );

    expect(screen.queryByTestId('rating-summary')).not.toBeInTheDocument();
  });
});

describe('Accessibility', () => {
  it('StarRating stars should have aria-labels', () => {
    render(<StarRating rating={3} />);

    expect(screen.getByLabelText('1 star')).toBeInTheDocument();
    expect(screen.getByLabelText('2 stars')).toBeInTheDocument();
    expect(screen.getByLabelText('5 stars')).toBeInTheDocument();
  });

  it('ReviewForm should have labels for inputs', () => {
    render(
      <ProductReviewsProvider productId="prod-1">
        <ReviewForm productId="prod-1" />
      </ProductReviewsProvider>
    );

    expect(screen.getByLabelText(/review title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/your review/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/pros/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/cons/i)).toBeInTheDocument();
  });

  it('ReviewCard author image should have alt text', () => {
    render(
      <ProductReviewsProvider productId="prod-1">
        <ReviewCard review={mockReview} />
      </ProductReviewsProvider>
    );

    expect(screen.getByAltText('John Doe')).toBeInTheDocument();
  });
});

describe('Voting', () => {
  it('should disable vote buttons after voting helpful', async () => {
    const onVoteHelpful = vi.fn().mockResolvedValue(undefined);

    render(
      <ProductReviewsProvider productId="prod-1" onVoteHelpful={onVoteHelpful}>
        <ReviewCard review={mockReview} />
      </ProductReviewsProvider>
    );

    await userEvent.click(screen.getByTestId('vote-helpful'));

    await waitFor(() => {
      expect(screen.getByTestId('vote-helpful')).toBeDisabled();
      expect(screen.getByTestId('vote-not-helpful')).toBeDisabled();
    });
  });

  it('should update helpful count after voting', async () => {
    const onVoteHelpful = vi.fn().mockResolvedValue(undefined);

    render(
      <ProductReviewsProvider productId="prod-1" initialReviews={[mockReview]} onVoteHelpful={onVoteHelpful}>
        <ReviewCard review={mockReview} />
      </ProductReviewsProvider>
    );

    expect(screen.getByTestId('vote-helpful')).toHaveTextContent('Yes (10)');

    await userEvent.click(screen.getByTestId('vote-helpful'));

    await waitFor(() => {
      expect(screen.getByTestId('vote-helpful')).toHaveTextContent('Yes (11)');
    });
  });

  it('should not allow double voting', async () => {
    const onVoteHelpful = vi.fn().mockResolvedValue(undefined);

    render(
      <ProductReviewsProvider productId="prod-1" onVoteHelpful={onVoteHelpful}>
        <ReviewCard review={mockReview} />
      </ProductReviewsProvider>
    );

    await userEvent.click(screen.getByTestId('vote-helpful'));
    await userEvent.click(screen.getByTestId('vote-helpful'));

    expect(onVoteHelpful).toHaveBeenCalledTimes(1);
  });
});

describe('Filtering', () => {
  it('should filter by search query', async () => {
    render(
      <ProductReviewsProvider productId="prod-1">
        <ReviewFiltersBar />
        <TestReviewsConsumer />
      </ProductReviewsProvider>
    );

    await userEvent.type(screen.getByTestId('search-reviews'), 'great');
    // Filters should update and trigger fetch
    expect(screen.getByTestId('search-reviews')).toHaveValue('great');
  });

  it('should change sort order', async () => {
    render(
      <ProductReviewsProvider productId="prod-1">
        <ReviewFiltersBar />
        <TestReviewsConsumer />
      </ProductReviewsProvider>
    );

    await userEvent.selectOptions(screen.getByTestId('sort-reviews'), 'newest');
    expect(screen.getByTestId('filter-sort')).toHaveTextContent('newest');
  });

  it('should toggle verified filter', async () => {
    render(
      <ProductReviewsProvider productId="prod-1">
        <ReviewFiltersBar />
      </ProductReviewsProvider>
    );

    const verifiedButton = screen.getByTestId('filter-verified');
    await userEvent.click(verifiedButton);
    expect(verifiedButton).toHaveClass('bg-green-100');

    await userEvent.click(verifiedButton);
    expect(verifiedButton).not.toHaveClass('bg-green-100');
  });

  it('should toggle with images filter', async () => {
    render(
      <ProductReviewsProvider productId="prod-1">
        <ReviewFiltersBar />
      </ProductReviewsProvider>
    );

    const imagesButton = screen.getByTestId('filter-with-images');
    await userEvent.click(imagesButton);
    expect(imagesButton).toHaveClass('bg-blue-100');
  });
});

// ============================================================================
// ReviewMediaUpload Tests
// ============================================================================

describe('ReviewMediaUpload', () => {
  const mockOnMediaAdd = vi.fn();
  const mockOnMediaRemove = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockFile = (name: string, type: string): File => {
    const blob = new Blob([''], { type });
    return new File([blob], name, { type });
  };

  const mockUploadedMedia: UploadedMedia[] = [
    { id: '1', file: createMockFile('image1.jpg', 'image/jpeg'), preview: 'blob:image1', type: 'image' },
    { id: '2', file: createMockFile('video1.mp4', 'video/mp4'), preview: 'blob:video1', type: 'video' },
  ];

  it('should render upload dropzone', () => {
    render(
      <ReviewMediaUpload
        media={[]}
        onMediaAdd={mockOnMediaAdd}
        onMediaRemove={mockOnMediaRemove}
      />
    );

    expect(screen.getByTestId('review-media-upload')).toBeInTheDocument();
    expect(screen.getByTestId('upload-dropzone')).toBeInTheDocument();
    expect(screen.getByText('Add photos or videos')).toBeInTheDocument();
  });

  it('should show file input', () => {
    render(
      <ReviewMediaUpload
        media={[]}
        onMediaAdd={mockOnMediaAdd}
        onMediaRemove={mockOnMediaRemove}
      />
    );

    expect(screen.getByTestId('file-input')).toBeInTheDocument();
  });

  it('should display media count', () => {
    render(
      <ReviewMediaUpload
        media={mockUploadedMedia}
        onMediaAdd={mockOnMediaAdd}
        onMediaRemove={mockOnMediaRemove}
      />
    );

    expect(screen.getByTestId('image-count')).toHaveTextContent('1/5 photos');
    expect(screen.getByTestId('video-count')).toHaveTextContent('1/2 videos');
  });

  it('should render media preview grid', () => {
    render(
      <ReviewMediaUpload
        media={mockUploadedMedia}
        onMediaAdd={mockOnMediaAdd}
        onMediaRemove={mockOnMediaRemove}
      />
    );

    expect(screen.getByTestId('media-preview-grid')).toBeInTheDocument();
    expect(screen.getByTestId('media-item-1')).toBeInTheDocument();
    expect(screen.getByTestId('media-item-2')).toBeInTheDocument();
  });

  it('should call onMediaRemove when remove button clicked', () => {
    render(
      <ReviewMediaUpload
        media={mockUploadedMedia}
        onMediaAdd={mockOnMediaAdd}
        onMediaRemove={mockOnMediaRemove}
      />
    );

    fireEvent.click(screen.getByTestId('remove-media-1'));
    expect(mockOnMediaRemove).toHaveBeenCalledWith('1');
  });

  it('should be disabled when disabled prop is true', () => {
    render(
      <ReviewMediaUpload
        media={mockUploadedMedia}
        onMediaAdd={mockOnMediaAdd}
        onMediaRemove={mockOnMediaRemove}
        disabled
      />
    );

    const dropzone = screen.getByTestId('upload-dropzone');
    expect(dropzone).toHaveClass('opacity-50');
    expect(dropzone).toHaveClass('cursor-not-allowed');
  });

  it('should hide remove buttons when disabled', () => {
    render(
      <ReviewMediaUpload
        media={mockUploadedMedia}
        onMediaAdd={mockOnMediaAdd}
        onMediaRemove={mockOnMediaRemove}
        disabled
      />
    );

    expect(screen.queryByTestId('remove-media-1')).not.toBeInTheDocument();
    expect(screen.queryByTestId('remove-media-2')).not.toBeInTheDocument();
  });

  it('should accept custom max limits', () => {
    render(
      <ReviewMediaUpload
        media={[]}
        onMediaAdd={mockOnMediaAdd}
        onMediaRemove={mockOnMediaRemove}
        maxImages={10}
        maxVideos={5}
      />
    );

    expect(screen.getByTestId('image-count')).toHaveTextContent('0/10 photos');
    expect(screen.getByTestId('video-count')).toHaveTextContent('0/5 videos');
  });

  it('should have accessible dropzone', () => {
    render(
      <ReviewMediaUpload
        media={[]}
        onMediaAdd={mockOnMediaAdd}
        onMediaRemove={mockOnMediaRemove}
      />
    );

    const dropzone = screen.getByTestId('upload-dropzone');
    expect(dropzone).toHaveAttribute('role', 'button');
    expect(dropzone).toHaveAttribute('aria-label', 'Upload photos or videos');
  });
});

// ============================================================================
// MediaGallery Tests
// ============================================================================

describe('MediaGallery', () => {
  const mockMedia: ReviewMedia[] = [
    { id: 'img1', url: '/image1.jpg', type: 'image' },
    { id: 'vid1', url: '/video1.mp4', type: 'video', thumbnail: '/thumb1.jpg' },
  ];

  it('should render nothing when no media provided', () => {
    const { container } = render(<MediaGallery media={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('should render media gallery', () => {
    render(<MediaGallery media={mockMedia} />);

    expect(screen.getByTestId('media-gallery')).toBeInTheDocument();
  });

  it('should render thumbnails for all media', () => {
    render(<MediaGallery media={mockMedia} />);

    expect(screen.getByTestId('gallery-thumb-0')).toBeInTheDocument();
    expect(screen.getByTestId('gallery-thumb-1')).toBeInTheDocument();
  });

  it('should show preview when thumbnail is clicked', () => {
    render(<MediaGallery media={mockMedia} />);

    fireEvent.click(screen.getByTestId('gallery-thumb-0'));
    expect(screen.getByTestId('gallery-preview')).toBeInTheDocument();
  });

  it('should close preview when close button clicked', () => {
    render(<MediaGallery media={mockMedia} />);

    fireEvent.click(screen.getByTestId('gallery-thumb-0'));
    expect(screen.getByTestId('gallery-preview')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('close-preview'));
    expect(screen.queryByTestId('gallery-preview')).not.toBeInTheDocument();
  });

  it('should render video player for video media', () => {
    render(<MediaGallery media={mockMedia} />);

    fireEvent.click(screen.getByTestId('gallery-thumb-1'));
    expect(screen.getByTestId('video-player')).toBeInTheDocument();
  });

  it('should support legacy images array', () => {
    render(<MediaGallery media={[]} images={['/legacy1.jpg', '/legacy2.jpg']} />);

    expect(screen.getByTestId('gallery-thumb-0')).toBeInTheDocument();
    expect(screen.getByTestId('gallery-thumb-1')).toBeInTheDocument();
  });

  it('should support legacy videos array', () => {
    render(<MediaGallery media={[]} videos={['/legacy-video.mp4']} />);

    expect(screen.getByTestId('gallery-thumb-0')).toBeInTheDocument();
  });

  it('should combine media, images, and videos', () => {
    render(
      <MediaGallery
        media={mockMedia}
        images={['/extra.jpg']}
        videos={['/extra.mp4']}
      />
    );

    // 2 from media + 1 image + 1 video = 4 thumbnails
    expect(screen.getByTestId('gallery-thumb-0')).toBeInTheDocument();
    expect(screen.getByTestId('gallery-thumb-1')).toBeInTheDocument();
    expect(screen.getByTestId('gallery-thumb-2')).toBeInTheDocument();
    expect(screen.getByTestId('gallery-thumb-3')).toBeInTheDocument();
  });
});

// ============================================================================
// ReviewForm with Media Upload Tests
// ============================================================================

describe('ReviewForm with Media Upload', () => {
  function renderReviewForm() {
    return render(
      <ProductReviewsProvider productId="prod-1">
        <ReviewForm productId="prod-1" />
      </ProductReviewsProvider>
    );
  }

  it('should render media upload section', () => {
    renderReviewForm();

    expect(screen.getByTestId('review-media-upload')).toBeInTheDocument();
    expect(screen.getByText('Add Photos or Videos (optional)')).toBeInTheDocument();
  });

  it('should render upload dropzone in form', () => {
    renderReviewForm();

    expect(screen.getByTestId('upload-dropzone')).toBeInTheDocument();
  });
});
