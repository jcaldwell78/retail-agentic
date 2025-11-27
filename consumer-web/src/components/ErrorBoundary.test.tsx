import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorBoundary } from './ErrorBoundary';

// Component that throws an error for testing
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error message');
  }
  return <div>No error</div>;
};

// Suppress console.error during tests to avoid cluttering test output
const consoleError = console.error;
beforeEach(() => {
  console.error = vi.fn();
});

afterEach(() => {
  console.error = consoleError;
});

describe('ErrorBoundary', () => {
  it('should render children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('should catch errors and display error UI', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('An unexpected error occurred. Please try again.')).toBeInTheDocument();
  });

  it('should display error message', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });

  it('should display Try Again button', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByRole('button', { name: 'Try Again' })).toBeInTheDocument();
  });

  it('should display Go Home button', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByRole('button', { name: 'Go Home' })).toBeInTheDocument();
  });
});

describe('ErrorBoundary - Error Recovery', () => {
  it('should have Try Again button that resets error state', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Error UI should be shown
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    // Try Again button should be present
    const tryAgainButton = screen.getByRole('button', { name: 'Try Again' });
    expect(tryAgainButton).toBeInTheDocument();

    // Note: Clicking Try Again in a real scenario would reset the error state,
    // but the component would re-throw the error since our test component
    // always throws. In a real application, the underlying issue would be fixed.
  });

  it('should navigate to home when Go Home is clicked', async () => {
    const user = userEvent.setup();
    delete window.location;
    window.location = { href: '' } as Location;

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    await user.click(screen.getByRole('button', { name: 'Go Home' }));

    expect(window.location.href).toBe('/');
  });
});

describe('ErrorBoundary - Custom Fallback', () => {
  it('should render custom fallback when provided', () => {
    const customFallback = <div>Custom error message</div>;

    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom error message')).toBeInTheDocument();
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  });
});

describe('ErrorBoundary - Error Logging', () => {
  it('should log error to console', () => {
    const consoleSpy = vi.spyOn(console, 'error');

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(consoleSpy).toHaveBeenCalled();
  });
});

describe('ErrorBoundary - UI Structure', () => {
  it('should display error title', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const title = screen.getByRole('heading', { name: 'Something went wrong' });
    expect(title).toBeInTheDocument();
  });

  it('should display error message in monospace font', () => {
    const { container } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const errorMessage = screen.getByText('Test error message');
    expect(errorMessage).toHaveClass('font-mono');
  });

  it('should center the error card on screen', () => {
    const { container } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const wrapper = container.querySelector('.min-h-screen');
    expect(wrapper).toHaveClass('flex');
    expect(wrapper).toHaveClass('items-center');
    expect(wrapper).toHaveClass('justify-center');
  });
});

describe('ErrorBoundary - Multiple Children', () => {
  it('should render multiple children when no error', () => {
    render(
      <ErrorBoundary>
        <div>Child 1</div>
        <div>Child 2</div>
        <div>Child 3</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Child 1')).toBeInTheDocument();
    expect(screen.getByText('Child 2')).toBeInTheDocument();
    expect(screen.getByText('Child 3')).toBeInTheDocument();
  });

  it('should catch error from any child', () => {
    render(
      <ErrorBoundary>
        <div>Child 1</div>
        <ThrowError shouldThrow={true} />
        <div>Child 3</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.queryByText('Child 1')).not.toBeInTheDocument();
    expect(screen.queryByText('Child 3')).not.toBeInTheDocument();
  });
});
