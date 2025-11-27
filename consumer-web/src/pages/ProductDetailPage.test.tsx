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
  beforeEach(() => {
    mockNavigate.mockClear();
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

  it('should show share menu when share button is clicked', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ProductDetailPage />);

    const shareButton = screen.getByTestId('share-button');
    await user.click(shareButton);

    expect(screen.getByTestId('share-menu')).toBeInTheDocument();
    expect(screen.getByTestId('copy-link-button')).toBeInTheDocument();
    expect(screen.getByTestId('facebook-share-button')).toBeInTheDocument();
    expect(screen.getByTestId('twitter-share-button')).toBeInTheDocument();
    expect(screen.getByTestId('email-share-button')).toBeInTheDocument();
  });

  it('should close share menu when share button is clicked again', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ProductDetailPage />);

    const shareButton = screen.getByTestId('share-button');

    // Open menu
    await user.click(shareButton);
    expect(screen.getByTestId('share-menu')).toBeInTheDocument();

    // Close menu
    await user.click(shareButton);
    expect(screen.queryByTestId('share-menu')).not.toBeInTheDocument();
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

    expect(screen.getByTestId('review-form')).toBeInTheDocument();
    expect(screen.getByTestId('review-title-input')).toBeInTheDocument();
    expect(screen.getByTestId('review-comment-input')).toBeInTheDocument();
    expect(screen.getByTestId('submit-review-button')).toBeInTheDocument();
  });

  it('should hide review form when cancelled', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ProductDetailPage />);

    const writeReviewButton = screen.getByTestId('write-review-button');
    await user.click(writeReviewButton);

    expect(screen.getByTestId('review-form')).toBeInTheDocument();

    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    await user.click(cancelButton);

    expect(screen.queryByTestId('review-form')).not.toBeInTheDocument();
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
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('should display product name and price', () => {
    renderWithRouter(<ProductDetailPage />);
    expect(screen.getByTestId('product-name')).toHaveTextContent('Wireless Headphones');
    expect(screen.getByTestId('product-price')).toHaveTextContent('$99.99');
  });

  it('should display product images and thumbnails', () => {
    renderWithRouter(<ProductDetailPage />);

    expect(screen.getByTestId('thumbnail-0')).toBeInTheDocument();
    expect(screen.getByTestId('thumbnail-1')).toBeInTheDocument();
    expect(screen.getByTestId('thumbnail-2')).toBeInTheDocument();
    expect(screen.getByTestId('thumbnail-3')).toBeInTheDocument();
  });

  it('should display color and size options', () => {
    renderWithRouter(<ProductDetailPage />);

    expect(screen.getByTestId('color-black')).toBeInTheDocument();
    expect(screen.getByTestId('color-silver')).toBeInTheDocument();
    expect(screen.getByTestId('size-small')).toBeInTheDocument();
    expect(screen.getByTestId('size-medium')).toBeInTheDocument();
    expect(screen.getByTestId('size-large')).toBeInTheDocument();
  });

  it('should display quantity controls', () => {
    renderWithRouter(<ProductDetailPage />);

    expect(screen.getByTestId('quantity-display')).toHaveTextContent('1');
    expect(screen.getByTestId('increase-quantity')).toBeInTheDocument();
    expect(screen.getByTestId('decrease-quantity')).toBeInTheDocument();
  });

  it('should display action buttons', () => {
    renderWithRouter(<ProductDetailPage />);

    expect(screen.getByTestId('add-to-cart-button')).toBeInTheDocument();
    expect(screen.getByTestId('buy-now-button')).toBeInTheDocument();
  });

  it('should navigate to checkout when buy now is clicked', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ProductDetailPage />);

    const buyNowButton = screen.getByTestId('buy-now-button');
    await user.click(buyNowButton);

    expect(mockNavigate).toHaveBeenCalledWith('/checkout');
  });
});
