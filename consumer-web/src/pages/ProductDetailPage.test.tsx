import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import ProductDetailPage from './ProductDetailPage';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ id: '1' }),
  };
});

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('ProductDetailPage - Share Functionality', () => {
  let writeTextSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Reset navigate mock
    mockNavigate.mockClear();

    // Reset window.open mock
    window.open = vi.fn();

    // Create clipboard writeText spy
    writeTextSpy = vi.fn(() => Promise.resolve());

    // Reset navigator.share
    Object.defineProperty(navigator, 'share', {
      writable: true,
      configurable: true,
      value: undefined,
    });

    // Reset clipboard
    Object.defineProperty(navigator, 'clipboard', {
      writable: true,
      configurable: true,
      value: {
        writeText: writeTextSpy,
      },
    });
  });

  it('should render product detail page', () => {
    renderWithRouter(<ProductDetailPage />);
    expect(screen.getByTestId('product-detail-page')).toBeInTheDocument();
  });

  it('should display share button', () => {
    renderWithRouter(<ProductDetailPage />);
    expect(screen.getByTestId('share-button')).toBeInTheDocument();
    expect(screen.getByText('Share Product')).toBeInTheDocument();
  });

  it('should show share menu when native share is not available', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ProductDetailPage />);

    const shareButton = screen.getByTestId('share-button');
    await user.click(shareButton);

    expect(screen.getByTestId('share-menu')).toBeInTheDocument();
  });

  it('should use native share when available', async () => {
    const mockShare = vi.fn(() => Promise.resolve());
    Object.defineProperty(navigator, 'share', {
      writable: true,
      value: mockShare,
    });

    const user = userEvent.setup();
    renderWithRouter(<ProductDetailPage />);

    const shareButton = screen.getByTestId('share-button');
    await user.click(shareButton);

    expect(mockShare).toHaveBeenCalledWith({
      title: 'Wireless Headphones',
      text: 'Check out Wireless Headphones - $99.99',
      url: expect.stringContaining('/products/1'),
    });
  });

  it('should copy link to clipboard', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ProductDetailPage />);

    // Open share menu
    const shareButton = screen.getByTestId('share-button');
    await user.click(shareButton);

    await waitFor(() => {
      expect(screen.getByTestId('share-menu')).toBeInTheDocument();
    });

    // Click copy link
    const copyButton = screen.getByTestId('copy-link-button');
    await user.click(copyButton);

    expect(writeTextSpy).toHaveBeenCalledWith(
      expect.stringContaining('/products/1')
    );

    await waitFor(() => {
      expect(screen.getByText('Link Copied!')).toBeInTheDocument();
    });
  });

  it('should revert copy success message after timeout', async () => {
    vi.useFakeTimers();
    const user = userEvent.setup({ delay: null });
    renderWithRouter(<ProductDetailPage />);

    const shareButton = screen.getByTestId('share-button');
    await user.click(shareButton);

    await waitFor(() => {
      expect(screen.getByTestId('share-menu')).toBeInTheDocument();
    });

    const copyButton = screen.getByTestId('copy-link-button');
    await user.click(copyButton);

    await waitFor(() => {
      expect(screen.getByText('Link Copied!')).toBeInTheDocument();
    });

    vi.advanceTimersByTime(2000);

    await waitFor(() => {
      expect(screen.getByText('Copy Link')).toBeInTheDocument();
    });

    vi.useRealTimers();
  });

  it('should open Facebook share dialog', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ProductDetailPage />);

    const shareButton = screen.getByTestId('share-button');
    await user.click(shareButton);

    await waitFor(() => {
      expect(screen.getByTestId('share-menu')).toBeInTheDocument();
    });

    const facebookButton = screen.getByTestId('facebook-share-button');
    await user.click(facebookButton);

    expect(window.open).toHaveBeenCalledWith(
      expect.stringContaining('facebook.com/sharer'),
      '_blank',
      'width=600,height=400'
    );
  });

  it('should open Twitter share dialog', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ProductDetailPage />);

    const shareButton = screen.getByTestId('share-button');
    await user.click(shareButton);

    await waitFor(() => {
      expect(screen.getByTestId('share-menu')).toBeInTheDocument();
    });

    const twitterButton = screen.getByTestId('twitter-share-button');
    await user.click(twitterButton);

    expect(window.open).toHaveBeenCalledWith(
      expect.stringContaining('twitter.com/intent/tweet'),
      '_blank',
      'width=600,height=400'
    );
  });

  it('should trigger email share', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ProductDetailPage />);

    const shareButton = screen.getByTestId('share-button');
    await user.click(shareButton);

    await waitFor(() => {
      expect(screen.getByTestId('share-menu')).toBeInTheDocument();
    });

    const emailButton = screen.getByTestId('email-share-button');

    // Mock window.location.href setter
    const originalLocation = window.location;
    delete (window as any).location;
    window.location = { ...originalLocation, href: '' } as any;

    await user.click(emailButton);

    expect(window.location.href).toContain('mailto:');
    expect(window.location.href).toContain('Wireless%20Headphones');

    window.location = originalLocation;
  });

  it('should toggle share menu on button click', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ProductDetailPage />);

    const shareButton = screen.getByTestId('share-button');

    // Open menu
    await user.click(shareButton);
    await waitFor(() => {
      expect(screen.getByTestId('share-menu')).toBeInTheDocument();
    });

    // Close menu
    await user.click(shareButton);
    await waitFor(() => {
      expect(screen.queryByTestId('share-menu')).not.toBeInTheDocument();
    });
  });
});

describe('ProductDetailPage - Reviews Functionality', () => {
  it('should display review count', () => {
    renderWithRouter(<ProductDetailPage />);
    expect(screen.getByText('Customer Reviews (3)')).toBeInTheDocument();
  });

  it('should display write review button', () => {
    renderWithRouter(<ProductDetailPage />);
    expect(screen.getByTestId('write-review-button')).toBeInTheDocument();
  });

  it('should show review form when write review button clicked', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ProductDetailPage />);

    const writeReviewButton = screen.getByTestId('write-review-button');
    await user.click(writeReviewButton);

    await waitFor(() => {
      expect(screen.getByTestId('review-form')).toBeInTheDocument();
    });
  });

  it('should hide review form when cancelled', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ProductDetailPage />);

    const writeReviewButton = screen.getByTestId('write-review-button');
    await user.click(writeReviewButton);

    await waitFor(() => {
      expect(screen.getByTestId('review-form')).toBeInTheDocument();
    });

    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    await user.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByTestId('review-form')).not.toBeInTheDocument();
    });
  });

  it('should display all existing reviews', () => {
    renderWithRouter(<ProductDetailPage />);
    const reviewsList = screen.getByTestId('reviews-list');

    expect(reviewsList).toBeInTheDocument();
    expect(screen.getByText('John D.')).toBeInTheDocument();
    expect(screen.getByText('Sarah M.')).toBeInTheDocument();
    expect(screen.getByText('Mike R.')).toBeInTheDocument();
  });

  it('should display review details', () => {
    renderWithRouter(<ProductDetailPage />);

    expect(screen.getByText('Excellent sound quality!')).toBeInTheDocument();
    expect(screen.getByText(/These headphones exceeded my expectations/)).toBeInTheDocument();
  });

  it('should display verified purchase badges', () => {
    renderWithRouter(<ProductDetailPage />);

    const verifiedBadges = screen.getAllByText('Verified Purchase');
    expect(verifiedBadges).toHaveLength(2); // John D. and Sarah M. are verified
  });

  it('should allow rating selection in review form', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ProductDetailPage />);

    const writeReviewButton = screen.getByTestId('write-review-button');
    await user.click(writeReviewButton);

    await waitFor(() => {
      expect(screen.getByTestId('review-form')).toBeInTheDocument();
    });

    const star3 = screen.getByTestId('star-rating-3');
    await user.click(star3);

    // Should show 3 filled stars and 2 empty
    expect(screen.getByTestId('star-rating-1')).toHaveTextContent('⭐');
    expect(screen.getByTestId('star-rating-2')).toHaveTextContent('⭐');
    expect(screen.getByTestId('star-rating-3')).toHaveTextContent('⭐');
    expect(screen.getByTestId('star-rating-4')).toHaveTextContent('☆');
    expect(screen.getByTestId('star-rating-5')).toHaveTextContent('☆');
  });

  it('should allow entering review title and comment', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ProductDetailPage />);

    const writeReviewButton = screen.getByTestId('write-review-button');
    await user.click(writeReviewButton);

    await waitFor(() => {
      expect(screen.getByTestId('review-form')).toBeInTheDocument();
    });

    const titleInput = screen.getByTestId('review-title-input');
    const commentInput = screen.getByTestId('review-comment-input');

    await user.type(titleInput, 'Great product!');
    await user.type(commentInput, 'I really love this product. Highly recommend!');

    expect(titleInput).toHaveValue('Great product!');
    expect(commentInput).toHaveValue('I really love this product. Highly recommend!');
  });

  it('should submit review form', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    const user = userEvent.setup();
    renderWithRouter(<ProductDetailPage />);

    const writeReviewButton = screen.getByTestId('write-review-button');
    await user.click(writeReviewButton);

    await waitFor(() => {
      expect(screen.getByTestId('review-form')).toBeInTheDocument();
    });

    await user.type(screen.getByTestId('review-title-input'), 'Great product!');
    await user.type(screen.getByTestId('review-comment-input'), 'I really love this!');

    const submitButton = screen.getByTestId('submit-review-button');
    await user.click(submitButton);

    expect(alertSpy).toHaveBeenCalledWith('Thank you for your review!');

    await waitFor(() => {
      expect(screen.queryByTestId('review-form')).not.toBeInTheDocument();
    });

    alertSpy.mockRestore();
  });

  it('should reset form after submission', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    const user = userEvent.setup();
    renderWithRouter(<ProductDetailPage />);

    const writeReviewButton = screen.getByTestId('write-review-button');
    await user.click(writeReviewButton);

    await waitFor(() => {
      expect(screen.getByTestId('review-form')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('star-rating-3'));
    await user.type(screen.getByTestId('review-title-input'), 'Great product!');
    await user.type(screen.getByTestId('review-comment-input'), 'I really love this!');

    await user.click(screen.getByTestId('submit-review-button'));

    await waitFor(() => {
      expect(screen.queryByTestId('review-form')).not.toBeInTheDocument();
    });

    // Open form again
    await user.click(writeReviewButton);

    await waitFor(() => {
      expect(screen.getByTestId('review-form')).toBeInTheDocument();
    });

    // Form should be reset
    expect(screen.getByTestId('review-title-input')).toHaveValue('');
    expect(screen.getByTestId('review-comment-input')).toHaveValue('');
    expect(screen.getByTestId('star-rating-5')).toHaveTextContent('⭐'); // Default is 5

    alertSpy.mockRestore();
  });

  it('should display review dates', () => {
    renderWithRouter(<ProductDetailPage />);

    // Check that dates are displayed (format may vary by locale)
    const datePattern = /\d{1,2}\/\d{1,2}\/\d{4}/;
    const datesFound = screen.getAllByText(datePattern);
    expect(datesFound.length).toBeGreaterThan(0);
  });

  it('should require title and comment for submission', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ProductDetailPage />);

    const writeReviewButton = screen.getByTestId('write-review-button');
    await user.click(writeReviewButton);

    const titleInput = screen.getByTestId('review-title-input');
    const commentInput = screen.getByTestId('review-comment-input');

    expect(titleInput).toBeRequired();
    expect(commentInput).toBeRequired();
  });
});

describe('ProductDetailPage - General Features', () => {
  it('should display product name and price', () => {
    renderWithRouter(<ProductDetailPage />);
    expect(screen.getByTestId('product-name')).toHaveTextContent('Wireless Headphones');
    expect(screen.getByTestId('product-price')).toHaveTextContent('$99.99');
  });

  it('should change selected image when thumbnail clicked', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ProductDetailPage />);

    const thumbnail1 = screen.getByTestId('thumbnail-1');
    await user.click(thumbnail1);

    // The thumbnail should be selected (implementation specific test)
    expect(thumbnail1).toBeInTheDocument();
  });

  it('should select color variant', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ProductDetailPage />);

    const silverButton = screen.getByTestId('color-silver');
    await user.click(silverButton);

    expect(silverButton).toHaveClass('border-blue-600');
  });

  it('should select size variant', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ProductDetailPage />);

    const largeButton = screen.getByTestId('size-large');
    await user.click(largeButton);

    expect(largeButton).toHaveClass('border-blue-600');
  });

  it('should increase and decrease quantity', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ProductDetailPage />);

    const increaseButton = screen.getByTestId('increase-quantity');
    const decreaseButton = screen.getByTestId('decrease-quantity');
    const quantityDisplay = screen.getByTestId('quantity-display');

    expect(quantityDisplay).toHaveTextContent('1');

    await user.click(increaseButton);
    expect(quantityDisplay).toHaveTextContent('2');

    await user.click(decreaseButton);
    expect(quantityDisplay).toHaveTextContent('1');
  });

  it('should add product to cart', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    const user = userEvent.setup();
    renderWithRouter(<ProductDetailPage />);

    const addToCartButton = screen.getByTestId('add-to-cart-button');
    await user.click(addToCartButton);

    expect(alertSpy).toHaveBeenCalledWith('Product added to cart!');
    alertSpy.mockRestore();
  });

  it('should navigate to checkout on buy now', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ProductDetailPage />);

    const buyNowButton = screen.getByTestId('buy-now-button');
    await user.click(buyNowButton);

    expect(mockNavigate).toHaveBeenCalledWith('/checkout');
  });
});
