import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import LazyLoad from './LazyLoad';

// Mock IntersectionObserver
class MockIntersectionObserver {
  callback: IntersectionObserverCallback;
  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
  }

  trigger(isIntersecting: boolean) {
    this.callback(
      [{ isIntersecting } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver
    );
  }
}

let mockObserver: MockIntersectionObserver;

global.IntersectionObserver = vi.fn((callback) => {
  mockObserver = new MockIntersectionObserver(callback);
  return mockObserver as unknown as IntersectionObserver;
}) as unknown as typeof IntersectionObserver;

describe('LazyLoad', () => {
  it('renders placeholder initially', () => {
    render(
      <LazyLoad>
        <div data-testid="content">Lazy content</div>
      </LazyLoad>
    );

    expect(screen.getByTestId('lazy-placeholder')).toBeInTheDocument();
    expect(screen.queryByTestId('content')).not.toBeInTheDocument();
  });

  it('loads content when entering viewport', async () => {
    render(
      <LazyLoad>
        <div data-testid="content">Lazy content</div>
      </LazyLoad>
    );

    // Trigger intersection
    mockObserver.trigger(true);

    await waitFor(() => {
      expect(screen.getByTestId('content')).toBeInTheDocument();
      expect(screen.queryByTestId('lazy-placeholder')).not.toBeInTheDocument();
    });
  });

  it('renders custom placeholder', () => {
    render(
      <LazyLoad placeholder={<div data-testid="custom-placeholder">Loading...</div>}>
        <div data-testid="content">Lazy content</div>
      </LazyLoad>
    );

    expect(screen.getByTestId('custom-placeholder')).toBeInTheDocument();
    expect(screen.queryByTestId('lazy-placeholder')).not.toBeInTheDocument();
  });

  it('applies custom height to placeholder', () => {
    render(
      <LazyLoad height={400}>
        <div data-testid="content">Lazy content</div>
      </LazyLoad>
    );

    const placeholder = screen.getByTestId('lazy-placeholder');
    expect(placeholder).toHaveStyle({ height: '400px' });
  });

  it('applies custom className to container', () => {
    render(
      <LazyLoad className="custom-class">
        <div data-testid="content">Lazy content</div>
      </LazyLoad>
    );

    const container = screen.getByTestId('lazy-load-container');
    expect(container).toHaveClass('custom-class');
  });

  it('calls onLoad when content enters viewport', async () => {
    const onLoad = vi.fn();

    render(
      <LazyLoad onLoad={onLoad}>
        <div data-testid="content">Lazy content</div>
      </LazyLoad>
    );

    mockObserver.trigger(true);

    await waitFor(() => {
      expect(onLoad).toHaveBeenCalled();
    });
  });

  it('uses custom offset for intersection observer', () => {
    render(
      <LazyLoad offset={200}>
        <div data-testid="content">Lazy content</div>
      </LazyLoad>
    );

    expect(global.IntersectionObserver).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({
        rootMargin: '200px',
      })
    );
  });

  it('disconnects observer after loading', async () => {
    render(
      <LazyLoad>
        <div data-testid="content">Lazy content</div>
      </LazyLoad>
    );

    mockObserver.trigger(true);

    await waitFor(() => {
      expect(mockObserver.disconnect).toHaveBeenCalled();
    });
  });

  it('supports string height values', () => {
    render(
      <LazyLoad height="50vh">
        <div data-testid="content">Lazy content</div>
      </LazyLoad>
    );

    const container = screen.getByTestId('lazy-load-container');
    expect(container).toHaveStyle({ minHeight: '50vh' });
  });

  it('renders container with minimum height', () => {
    render(
      <LazyLoad height={300}>
        <div data-testid="content">Lazy content</div>
      </LazyLoad>
    );

    const container = screen.getByTestId('lazy-load-container');
    expect(container).toHaveStyle({ minHeight: '300px' });
  });
});
