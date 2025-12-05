import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import OptimizedImage from './OptimizedImage';

// Mock IntersectionObserver
const mockObserve = vi.fn();
const mockDisconnect = vi.fn();
const mockUnobserve = vi.fn();

class MockIntersectionObserver {
  observe = mockObserve;
  disconnect = mockDisconnect;
  unobserve = mockUnobserve;
}

global.IntersectionObserver = MockIntersectionObserver as any;

describe('OptimizedImage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders image with alt text', () => {
    render(<OptimizedImage src="/test.jpg" alt="Test image" priority />);

    const img = screen.getByTestId('optimized-image');
    expect(img).toHaveAttribute('alt', 'Test image');
  });

  it('applies lazy loading by default', async () => {
    render(<OptimizedImage src="/test.jpg" alt="Test" />);

    await waitFor(() => {
      expect(mockObserve).toHaveBeenCalled();
    });
  });

  it('disables lazy loading when priority is true', () => {
    render(<OptimizedImage src="/test.jpg" alt="Test" priority />);

    const img = screen.getByTestId('optimized-image');
    expect(img).toHaveAttribute('loading', 'eager');
  });

  it('shows blur placeholder while loading', () => {
    render(<OptimizedImage src="/test.jpg" alt="Test" blur priority />);

    // Initially should show placeholder
    expect(screen.queryByTestId('image-placeholder')).toBeInTheDocument();
  });

  it('calls onLoad when image loads', async () => {
    const onLoad = vi.fn();
    render(<OptimizedImage src="/test.jpg" alt="Test" onLoad={onLoad} priority />);

    const img = screen.getByTestId('optimized-image');

    // Simulate image load
    img.dispatchEvent(new Event('load'));

    await waitFor(() => {
      expect(onLoad).toHaveBeenCalled();
    });
  });

  it('calls onError when image fails to load', async () => {
    const onError = vi.fn();
    render(<OptimizedImage src="/invalid.jpg" alt="Test" onError={onError} priority />);

    const img = screen.getByTestId('optimized-image');

    // Simulate image error
    img.dispatchEvent(new Event('error'));

    await waitFor(() => {
      expect(onError).toHaveBeenCalled();
    });
  });

  it('shows fallback image when main image fails', async () => {
    render(
      <OptimizedImage
        src="/invalid.jpg"
        alt="Test"
        fallbackSrc="/fallback.jpg"
        priority
      />
    );

    const img = screen.getByTestId('optimized-image');
    img.dispatchEvent(new Event('error'));

    await waitFor(() => {
      expect(img).toHaveAttribute('src', '/fallback.jpg');
    });
  });

  it('shows error state when no fallback is provided', async () => {
    render(<OptimizedImage src="/invalid.jpg" alt="Test" priority />);

    const img = screen.getByTestId('optimized-image');
    img.dispatchEvent(new Event('error'));

    await waitFor(() => {
      expect(screen.getByTestId('image-error')).toBeInTheDocument();
      expect(screen.getByText('Image not available')).toBeInTheDocument();
    });
  });

  it('applies custom className', () => {
    render(<OptimizedImage src="/test.jpg" alt="Test" className="custom-class" priority />);

    const container = screen.getByTestId('optimized-image').parentElement;
    expect(container).toHaveClass('custom-class');
  });

  it('applies custom dimensions', () => {
    render(<OptimizedImage src="/test.jpg" alt="Test" width={800} height={600} priority />);

    const img = screen.getByTestId('optimized-image');
    expect(img).toHaveAttribute('width', '800');
    expect(img).toHaveAttribute('height', '600');
  });

  it('applies object-fit style', () => {
    render(<OptimizedImage src="/test.jpg" alt="Test" objectFit="contain" priority />);

    const img = screen.getByTestId('optimized-image');
    expect(img).toHaveStyle({ objectFit: 'contain' });
  });

  it('uses eager loading for priority images', () => {
    render(<OptimizedImage src="/test.jpg" alt="Test" priority />);

    const img = screen.getByTestId('optimized-image');
    expect(img).toHaveAttribute('loading', 'eager');
    expect(img).toHaveAttribute('decoding', 'sync');
  });

  it('uses lazy loading for non-priority images', () => {
    render(<OptimizedImage src="/test.jpg" alt="Test" priority={false} lazy={false} />);

    const img = screen.getByTestId('optimized-image');
    expect(img).toHaveAttribute('loading', 'lazy');
    expect(img).toHaveAttribute('decoding', 'async');
  });

  it('hides placeholder after image loads', async () => {
    render(<OptimizedImage src="/test.jpg" alt="Test" blur priority />);

    expect(screen.getByTestId('image-placeholder')).toBeInTheDocument();

    const img = screen.getByTestId('optimized-image');
    img.dispatchEvent(new Event('load'));

    await waitFor(() => {
      const placeholder = screen.queryByTestId('image-placeholder');
      expect(placeholder).not.toBeInTheDocument();
    });
  });

  it('renders with default object-fit cover', () => {
    render(<OptimizedImage src="/test.jpg" alt="Test" priority />);

    const img = screen.getByTestId('optimized-image');
    expect(img).toHaveStyle({ objectFit: 'cover' });
  });
});
