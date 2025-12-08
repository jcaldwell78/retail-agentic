import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  ShareWishlistButton,
  ShareWishlistContent,
  ShareWishlistInline,
  ShareWishlistCard,
  useShareableWishlist,
  type ShareWishlistConfig,
  type WishlistItem,
} from './ShareWishlist';
import { renderHook } from '@testing-library/react';

const mockConfig: ShareWishlistConfig = {
  shareUrl: 'https://example.com/wishlist/shared/abc123',
  wishlistName: 'My Wishlist',
  wishlistId: 'abc123',
  itemCount: 5,
};

const mockItems: WishlistItem[] = [
  { id: '1', name: 'Product 1', price: 29.99, imageUrl: '/img1.jpg' },
  { id: '2', name: 'Product 2', price: 49.99, imageUrl: '/img2.jpg' },
  { id: '3', name: 'Product 3', price: 19.99 },
  { id: '4', name: 'Product 4', price: 39.99, imageUrl: '/img4.jpg' },
  { id: '5', name: 'Product 5', price: 59.99, imageUrl: '/img5.jpg' },
];

describe('ShareWishlistButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render share button', () => {
    render(<ShareWishlistButton config={mockConfig} />);
    expect(screen.getByTestId('share-wishlist-button')).toBeInTheDocument();
    expect(screen.getByText('Share Wishlist')).toBeInTheDocument();
  });

  it('should render icon variant', () => {
    render(<ShareWishlistButton config={mockConfig} variant="icon" />);
    const button = screen.getByTestId('share-wishlist-button');
    expect(button).toBeInTheDocument();
    expect(screen.queryByText('Share Wishlist')).not.toBeInTheDocument();
  });

  it('should render outline variant', () => {
    render(<ShareWishlistButton config={mockConfig} variant="outline" />);
    expect(screen.getByTestId('share-wishlist-button')).toBeInTheDocument();
    expect(screen.getByText('Share Wishlist')).toBeInTheDocument();
  });

  it('should open dialog when clicked', async () => {
    render(<ShareWishlistButton config={mockConfig} />);

    await userEvent.click(screen.getByTestId('share-wishlist-button'));

    await waitFor(() => {
      expect(screen.getByTestId('share-wishlist-dialog')).toBeInTheDocument();
    });
  });

  it('should display item count in dialog', async () => {
    render(<ShareWishlistButton config={mockConfig} />);

    await userEvent.click(screen.getByTestId('share-wishlist-button'));

    await waitFor(() => {
      expect(screen.getByText(/5 items/)).toBeInTheDocument();
    });
  });

  it('should call onShare when sharing', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    const mockOnShare = vi.fn();
    render(<ShareWishlistButton config={mockConfig} onShare={mockOnShare} />);

    await userEvent.click(screen.getByTestId('share-wishlist-button'));

    await waitFor(() => {
      expect(screen.getByTestId('copy-link-button')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByTestId('copy-link-button'));
    expect(mockOnShare).toHaveBeenCalledWith('copy');
  });
});

describe('ShareWishlistContent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render share URL input', () => {
    render(<ShareWishlistContent config={mockConfig} />);
    const input = screen.getByTestId('share-url-input');
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue(mockConfig.shareUrl);
  });

  it('should render copy button', () => {
    render(<ShareWishlistContent config={mockConfig} />);
    expect(screen.getByTestId('copy-link-button')).toBeInTheDocument();
  });

  it('should copy link to clipboard when copy button clicked', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    render(<ShareWishlistContent config={mockConfig} />);

    await userEvent.click(screen.getByTestId('copy-link-button'));

    expect(writeText).toHaveBeenCalledWith(mockConfig.shareUrl);
  });

  it('should show copied message after copying', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    render(<ShareWishlistContent config={mockConfig} />);

    await userEvent.click(screen.getByTestId('copy-link-button'));

    expect(screen.getByTestId('copied-message')).toBeInTheDocument();
    expect(screen.getByText('Link copied to clipboard!')).toBeInTheDocument();
  });

  it('should call onShare with copy when copying', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    const mockOnShare = vi.fn();
    render(<ShareWishlistContent config={mockConfig} onShare={mockOnShare} />);

    await userEvent.click(screen.getByTestId('copy-link-button'));

    expect(mockOnShare).toHaveBeenCalledWith('copy');
  });

  it('should render social share buttons', () => {
    render(<ShareWishlistContent config={mockConfig} />);
    expect(screen.getByTestId('social-share-buttons')).toBeInTheDocument();
    expect(screen.getByTestId('share-facebook')).toBeInTheDocument();
    expect(screen.getByTestId('share-twitter')).toBeInTheDocument();
    expect(screen.getByTestId('share-whatsapp')).toBeInTheDocument();
    expect(screen.getByTestId('share-telegram')).toBeInTheDocument();
  });

  it('should open Facebook share in new window', async () => {
    const windowOpen = vi.fn();
    vi.stubGlobal('open', windowOpen);

    const mockOnShare = vi.fn();
    render(<ShareWishlistContent config={mockConfig} onShare={mockOnShare} />);

    await userEvent.click(screen.getByTestId('share-facebook'));

    expect(windowOpen).toHaveBeenCalled();
    expect(windowOpen.mock.calls[0][0]).toContain('facebook.com');
    expect(mockOnShare).toHaveBeenCalledWith('facebook');
  });

  it('should open Twitter share in new window', async () => {
    const windowOpen = vi.fn();
    vi.stubGlobal('open', windowOpen);

    const mockOnShare = vi.fn();
    render(<ShareWishlistContent config={mockConfig} onShare={mockOnShare} />);

    await userEvent.click(screen.getByTestId('share-twitter'));

    expect(windowOpen).toHaveBeenCalled();
    expect(windowOpen.mock.calls[0][0]).toContain('twitter.com');
    expect(mockOnShare).toHaveBeenCalledWith('twitter');
  });

  it('should open WhatsApp share in new window', async () => {
    const windowOpen = vi.fn();
    vi.stubGlobal('open', windowOpen);

    const mockOnShare = vi.fn();
    render(<ShareWishlistContent config={mockConfig} onShare={mockOnShare} />);

    await userEvent.click(screen.getByTestId('share-whatsapp'));

    expect(windowOpen).toHaveBeenCalled();
    expect(windowOpen.mock.calls[0][0]).toContain('wa.me');
    expect(mockOnShare).toHaveBeenCalledWith('whatsapp');
  });

  it('should open Telegram share in new window', async () => {
    const windowOpen = vi.fn();
    vi.stubGlobal('open', windowOpen);

    const mockOnShare = vi.fn();
    render(<ShareWishlistContent config={mockConfig} onShare={mockOnShare} />);

    await userEvent.click(screen.getByTestId('share-telegram'));

    expect(windowOpen).toHaveBeenCalled();
    expect(windowOpen.mock.calls[0][0]).toContain('t.me');
    expect(mockOnShare).toHaveBeenCalledWith('telegram');
  });

  it('should render email input', () => {
    render(<ShareWishlistContent config={mockConfig} />);
    expect(screen.getByTestId('email-share-input')).toBeInTheDocument();
    expect(screen.getByTestId('send-email-button')).toBeInTheDocument();
  });

  it('should show email sent message after submitting', async () => {
    const mockOnShare = vi.fn();
    render(<ShareWishlistContent config={mockConfig} onShare={mockOnShare} />);

    const emailInput = screen.getByTestId('email-share-input');
    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.click(screen.getByTestId('send-email-button'));

    expect(screen.getByTestId('email-sent-message')).toBeInTheDocument();
    expect(mockOnShare).toHaveBeenCalledWith('email');
  });
});

describe('ShareWishlistInline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render inline share buttons', () => {
    render(<ShareWishlistInline config={mockConfig} />);
    expect(screen.getByTestId('share-wishlist-inline')).toBeInTheDocument();
    expect(screen.getByTestId('inline-copy-button')).toBeInTheDocument();
    expect(screen.getByTestId('inline-facebook-button')).toBeInTheDocument();
    expect(screen.getByTestId('inline-twitter-button')).toBeInTheDocument();
    expect(screen.getByTestId('inline-whatsapp-button')).toBeInTheDocument();
  });

  it('should copy link when copy button clicked', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    const mockOnShare = vi.fn();
    render(<ShareWishlistInline config={mockConfig} onShare={mockOnShare} />);

    await userEvent.click(screen.getByTestId('inline-copy-button'));

    expect(writeText).toHaveBeenCalledWith(mockConfig.shareUrl);
    expect(mockOnShare).toHaveBeenCalledWith('copy');
  });

  it('should open Facebook share when clicked', async () => {
    const windowOpen = vi.fn();
    vi.stubGlobal('open', windowOpen);

    const mockOnShare = vi.fn();
    render(<ShareWishlistInline config={mockConfig} onShare={mockOnShare} />);

    await userEvent.click(screen.getByTestId('inline-facebook-button'));

    expect(windowOpen).toHaveBeenCalled();
    expect(mockOnShare).toHaveBeenCalledWith('facebook');
  });

  it('should open Twitter share when clicked', async () => {
    const windowOpen = vi.fn();
    vi.stubGlobal('open', windowOpen);

    const mockOnShare = vi.fn();
    render(<ShareWishlistInline config={mockConfig} onShare={mockOnShare} />);

    await userEvent.click(screen.getByTestId('inline-twitter-button'));

    expect(windowOpen).toHaveBeenCalled();
    expect(mockOnShare).toHaveBeenCalledWith('twitter');
  });

  it('should open WhatsApp share when clicked', async () => {
    const windowOpen = vi.fn();
    vi.stubGlobal('open', windowOpen);

    const mockOnShare = vi.fn();
    render(<ShareWishlistInline config={mockConfig} onShare={mockOnShare} />);

    await userEvent.click(screen.getByTestId('inline-whatsapp-button'));

    expect(windowOpen).toHaveBeenCalled();
    expect(mockOnShare).toHaveBeenCalledWith('whatsapp');
  });
});

describe('ShareWishlistCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render card', () => {
    render(<ShareWishlistCard config={mockConfig} />);
    expect(screen.getByTestId('share-wishlist-card')).toBeInTheDocument();
    expect(screen.getByText('Share Your Wishlist')).toBeInTheDocument();
  });

  it('should render wishlist preview with items', () => {
    render(<ShareWishlistCard config={mockConfig} items={mockItems} />);
    expect(screen.getByTestId('wishlist-preview')).toBeInTheDocument();
    expect(screen.getByText('Sharing 5 items')).toBeInTheDocument();
  });

  it('should render up to 4 item previews', () => {
    render(<ShareWishlistCard config={mockConfig} items={mockItems} />);
    expect(screen.getByTestId('preview-item-1')).toBeInTheDocument();
    expect(screen.getByTestId('preview-item-2')).toBeInTheDocument();
    expect(screen.getByTestId('preview-item-3')).toBeInTheDocument();
    expect(screen.getByTestId('preview-item-4')).toBeInTheDocument();
    expect(screen.queryByTestId('preview-item-5')).not.toBeInTheDocument();
  });

  it('should show remaining count when more than 4 items', () => {
    render(<ShareWishlistCard config={mockConfig} items={mockItems} />);
    expect(screen.getByText('+1')).toBeInTheDocument();
  });

  it('should render items with images', () => {
    render(<ShareWishlistCard config={mockConfig} items={mockItems} />);
    const itemWithImage = screen.getByTestId('preview-item-1');
    const img = itemWithImage.querySelector('img');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', '/img1.jpg');
  });

  it('should render placeholder for items without images', () => {
    render(<ShareWishlistCard config={mockConfig} items={mockItems} />);
    const itemWithoutImage = screen.getByTestId('preview-item-3');
    expect(itemWithoutImage).toHaveTextContent('No image');
  });

  it('should use singular item text for single item', () => {
    render(
      <ShareWishlistCard
        config={mockConfig}
        items={[mockItems[0]]}
      />
    );
    expect(screen.getByText('Sharing 1 item')).toBeInTheDocument();
  });

  it('should not render preview when no items', () => {
    render(<ShareWishlistCard config={mockConfig} />);
    expect(screen.queryByTestId('wishlist-preview')).not.toBeInTheDocument();
  });

  it('should not render preview when items array is empty', () => {
    render(<ShareWishlistCard config={mockConfig} items={[]} />);
    expect(screen.queryByTestId('wishlist-preview')).not.toBeInTheDocument();
  });

  it('should include sharing content', () => {
    render(<ShareWishlistCard config={mockConfig} />);
    expect(screen.getByTestId('share-url-input')).toBeInTheDocument();
    expect(screen.getByTestId('copy-link-button')).toBeInTheDocument();
  });
});

describe('useShareableWishlist', () => {
  it('should generate shareable config', () => {
    const { result } = renderHook(() =>
      useShareableWishlist('wishlist123', 'My Wishlist')
    );

    expect(result.current.wishlistId).toBe('wishlist123');
    expect(result.current.wishlistName).toBe('My Wishlist');
    expect(result.current.shareUrl).toContain('/wishlist/shared/wishlist123');
  });

  it('should work without wishlist name', () => {
    const { result } = renderHook(() => useShareableWishlist('wishlist123'));

    expect(result.current.wishlistId).toBe('wishlist123');
    expect(result.current.wishlistName).toBeUndefined();
  });
});

describe('Accessibility', () => {
  it('should have accessible share buttons', () => {
    render(<ShareWishlistContent config={mockConfig} />);

    expect(screen.getByRole('button', { name: /Share via Facebook/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Share via Twitter/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Share via WhatsApp/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Share via Telegram/i })).toBeInTheDocument();
  });

  it('should have accessible inline buttons with titles', () => {
    render(<ShareWishlistInline config={mockConfig} />);

    const copyButton = screen.getByTestId('inline-copy-button');
    expect(copyButton).toHaveAttribute('title', 'Copy link');

    const facebookButton = screen.getByTestId('inline-facebook-button');
    expect(facebookButton).toHaveAttribute('title', 'Share on Facebook');
  });
});
