import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  FeedbackProvider,
  useFeedback,
  useAnimatedFeedback,
  SuccessCheckmark,
  ErrorX,
  LoadingSpinner,
  ProgressIndicator,
  PulseAnimation,
  AddToCartAnimation,
  AddToWishlistAnimation,
  Toast,
  InlineFeedback,
  LoadingButton,
  SkeletonShimmer,
  Confetti,
  NotificationBadge,
  FeedbackDisplay,
  FeedbackContainer,
} from './FeedbackAnimations';

// Test component for useFeedback hook
function TestFeedbackConsumer() {
  const { feedback, showFeedback, hideFeedback } = useFeedback();

  return (
    <div>
      <span data-testid="feedback-type">{feedback?.type || 'none'}</span>
      <span data-testid="feedback-message">{feedback?.message || 'none'}</span>
      <button
        data-testid="show-success"
        onClick={() => showFeedback({ type: 'success', message: 'Success!' })}
      >
        Show Success
      </button>
      <button
        data-testid="show-error"
        onClick={() => showFeedback({ type: 'error', message: 'Error!' })}
      >
        Show Error
      </button>
      <button data-testid="hide" onClick={hideFeedback}>
        Hide
      </button>
    </div>
  );
}

// Test component for useAnimatedFeedback hook
function TestAnimatedFeedbackConsumer() {
  const { success, error, warning, info, loading, dismiss } = useAnimatedFeedback();

  return (
    <div>
      <button data-testid="success-btn" onClick={() => success('Success message', 'Success')}>
        Success
      </button>
      <button data-testid="error-btn" onClick={() => error('Error message')}>
        Error
      </button>
      <button data-testid="warning-btn" onClick={() => warning('Warning message')}>
        Warning
      </button>
      <button data-testid="info-btn" onClick={() => info('Info message')}>
        Info
      </button>
      <button data-testid="loading-btn" onClick={() => loading('Loading...')}>
        Loading
      </button>
      <button data-testid="dismiss-btn" onClick={dismiss}>
        Dismiss
      </button>
    </div>
  );
}

describe('FeedbackProvider', () => {
  it('should provide default context values', () => {
    render(
      <FeedbackProvider>
        <TestFeedbackConsumer />
      </FeedbackProvider>
    );

    expect(screen.getByTestId('feedback-type')).toHaveTextContent('none');
    expect(screen.getByTestId('feedback-message')).toHaveTextContent('none');
  });

  it('should show feedback when triggered', async () => {
    render(
      <FeedbackProvider>
        <TestFeedbackConsumer />
      </FeedbackProvider>
    );

    await userEvent.click(screen.getByTestId('show-success'));

    expect(screen.getByTestId('feedback-type')).toHaveTextContent('success');
    expect(screen.getByTestId('feedback-message')).toHaveTextContent('Success!');
  });

  it('should hide feedback when dismissed', async () => {
    render(
      <FeedbackProvider>
        <TestFeedbackConsumer />
      </FeedbackProvider>
    );

    await userEvent.click(screen.getByTestId('show-success'));
    await userEvent.click(screen.getByTestId('hide'));

    expect(screen.getByTestId('feedback-type')).toHaveTextContent('none');
  });
});

describe('useFeedback', () => {
  it('should throw error when used outside provider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<TestFeedbackConsumer />);
    }).toThrow('useFeedback must be used within a FeedbackProvider');

    consoleError.mockRestore();
  });
});

describe('useAnimatedFeedback', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should show success feedback', async () => {
    render(
      <FeedbackProvider>
        <TestAnimatedFeedbackConsumer />
        <TestFeedbackConsumer />
      </FeedbackProvider>
    );

    fireEvent.click(screen.getByTestId('success-btn'));

    expect(screen.getByTestId('feedback-type')).toHaveTextContent('success');
    expect(screen.getByTestId('feedback-message')).toHaveTextContent('Success message');
  });

  it('should show error feedback with longer duration', async () => {
    render(
      <FeedbackProvider>
        <TestAnimatedFeedbackConsumer />
        <TestFeedbackConsumer />
      </FeedbackProvider>
    );

    fireEvent.click(screen.getByTestId('error-btn'));

    expect(screen.getByTestId('feedback-type')).toHaveTextContent('error');
  });

  it('should dismiss feedback', async () => {
    render(
      <FeedbackProvider>
        <TestAnimatedFeedbackConsumer />
        <TestFeedbackConsumer />
      </FeedbackProvider>
    );

    fireEvent.click(screen.getByTestId('success-btn'));
    fireEvent.click(screen.getByTestId('dismiss-btn'));

    expect(screen.getByTestId('feedback-type')).toHaveTextContent('none');
  });
});

describe('SuccessCheckmark', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render success checkmark', () => {
    render(<SuccessCheckmark />);

    expect(screen.getByTestId('success-checkmark')).toBeInTheDocument();
  });

  it('should call onComplete after animation', () => {
    const onComplete = vi.fn();
    render(<SuccessCheckmark onComplete={onComplete} />);

    act(() => {
      vi.advanceTimersByTime(600);
    });

    expect(onComplete).toHaveBeenCalled();
  });

  it('should render with different sizes', () => {
    const { rerender } = render(<SuccessCheckmark size="sm" />);
    expect(screen.getByTestId('success-checkmark')).toHaveClass('w-8', 'h-8');

    rerender(<SuccessCheckmark size="md" />);
    expect(screen.getByTestId('success-checkmark')).toHaveClass('w-12', 'h-12');

    rerender(<SuccessCheckmark size="lg" />);
    expect(screen.getByTestId('success-checkmark')).toHaveClass('w-16', 'h-16');
  });

  it('should accept custom className', () => {
    render(<SuccessCheckmark className="custom-class" />);
    expect(screen.getByTestId('success-checkmark')).toHaveClass('custom-class');
  });
});

describe('ErrorX', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render error X', () => {
    render(<ErrorX />);

    expect(screen.getByTestId('error-x')).toBeInTheDocument();
  });

  it('should call onComplete after animation', () => {
    const onComplete = vi.fn();
    render(<ErrorX onComplete={onComplete} />);

    act(() => {
      vi.advanceTimersByTime(600);
    });

    expect(onComplete).toHaveBeenCalled();
  });

  it('should render with different sizes', () => {
    const { rerender } = render(<ErrorX size="sm" />);
    expect(screen.getByTestId('error-x')).toHaveClass('w-8', 'h-8');

    rerender(<ErrorX size="md" />);
    expect(screen.getByTestId('error-x')).toHaveClass('w-12', 'h-12');

    rerender(<ErrorX size="lg" />);
    expect(screen.getByTestId('error-x')).toHaveClass('w-16', 'h-16');
  });
});

describe('LoadingSpinner', () => {
  it('should render loading spinner', () => {
    render(<LoadingSpinner />);

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('should render with label', () => {
    render(<LoadingSpinner label="Loading..." />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should render with different sizes', () => {
    const { container, rerender } = render(<LoadingSpinner size="sm" />);
    expect(container.querySelector('svg')).toHaveClass('w-4', 'h-4');

    rerender(<LoadingSpinner size="lg" />);
    expect(container.querySelector('svg')).toHaveClass('w-12', 'h-12');
  });
});

describe('ProgressIndicator', () => {
  it('should render progress indicator', () => {
    render(<ProgressIndicator progress={50} />);

    expect(screen.getByTestId('progress-indicator')).toBeInTheDocument();
  });

  it('should show progress percentage', () => {
    render(<ProgressIndicator progress={75} />);

    expect(screen.getByTestId('progress-percentage')).toHaveTextContent('75%');
  });

  it('should hide percentage when showPercentage is false', () => {
    render(<ProgressIndicator progress={50} showPercentage={false} />);

    expect(screen.queryByTestId('progress-percentage')).not.toBeInTheDocument();
  });

  it('should clamp progress between 0 and 100', () => {
    const { rerender } = render(<ProgressIndicator progress={150} />);
    expect(screen.getByTestId('progress-percentage')).toHaveTextContent('100%');

    rerender(<ProgressIndicator progress={-10} />);
    expect(screen.getByTestId('progress-percentage')).toHaveTextContent('0%');
  });

  it('should update progress bar width', () => {
    render(<ProgressIndicator progress={60} />);

    expect(screen.getByTestId('progress-bar')).toHaveStyle({ width: '60%' });
  });
});

describe('PulseAnimation', () => {
  it('should render children', () => {
    render(
      <PulseAnimation>
        <span>Content</span>
      </PulseAnimation>
    );

    expect(screen.getByText('Content')).toBeInTheDocument();
    expect(screen.getByTestId('pulse-animation')).toBeInTheDocument();
  });

  it('should show pulse ring when isPulsing', () => {
    render(
      <PulseAnimation isPulsing={true}>
        <span>Content</span>
      </PulseAnimation>
    );

    expect(screen.getByTestId('pulse-ring')).toBeInTheDocument();
  });

  it('should hide pulse ring when not pulsing', () => {
    render(
      <PulseAnimation isPulsing={false}>
        <span>Content</span>
      </PulseAnimation>
    );

    expect(screen.queryByTestId('pulse-ring')).not.toBeInTheDocument();
  });

  it('should apply different colors', () => {
    const { rerender } = render(
      <PulseAnimation isPulsing={true} color="green">
        <span>Content</span>
      </PulseAnimation>
    );

    expect(screen.getByTestId('pulse-ring')).toHaveClass('ring-green-400');

    rerender(
      <PulseAnimation isPulsing={true} color="red">
        <span>Content</span>
      </PulseAnimation>
    );

    expect(screen.getByTestId('pulse-ring')).toHaveClass('ring-red-400');
  });
});

describe('AddToCartAnimation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render when animating', () => {
    render(<AddToCartAnimation isAnimating={true} />);

    expect(screen.getByTestId('add-to-cart-animation')).toBeInTheDocument();
  });

  it('should not render when not animating', () => {
    render(<AddToCartAnimation isAnimating={false} />);

    expect(screen.queryByTestId('add-to-cart-animation')).not.toBeInTheDocument();
  });

  it('should call onComplete after animation', () => {
    const onComplete = vi.fn();
    render(<AddToCartAnimation isAnimating={true} onComplete={onComplete} />);

    act(() => {
      vi.advanceTimersByTime(800);
    });

    expect(onComplete).toHaveBeenCalled();
  });
});

describe('AddToWishlistAnimation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render when animating', () => {
    render(<AddToWishlistAnimation isAnimating={true} />);

    expect(screen.getByTestId('add-to-wishlist-animation')).toBeInTheDocument();
  });

  it('should not render when not animating', () => {
    render(<AddToWishlistAnimation isAnimating={false} />);

    expect(screen.queryByTestId('add-to-wishlist-animation')).not.toBeInTheDocument();
  });

  it('should call onComplete after animation', () => {
    const onComplete = vi.fn();
    render(<AddToWishlistAnimation isAnimating={true} onComplete={onComplete} />);

    act(() => {
      vi.advanceTimersByTime(600);
    });

    expect(onComplete).toHaveBeenCalled();
  });
});

describe('Toast', () => {
  it('should render when visible', () => {
    render(
      <Toast type="success" message="Success!" isVisible={true} />
    );

    expect(screen.getByTestId('toast')).toBeInTheDocument();
    expect(screen.getByText('Success!')).toBeInTheDocument();
  });

  it('should render with title', () => {
    render(
      <Toast type="success" title="Title" message="Message" isVisible={true} />
    );

    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Message')).toBeInTheDocument();
  });

  it('should render dismiss button when onDismiss provided', () => {
    const onDismiss = vi.fn();
    render(
      <Toast type="success" message="Success!" isVisible={true} onDismiss={onDismiss} />
    );

    expect(screen.getByTestId('toast-dismiss')).toBeInTheDocument();
  });

  it('should not render dismiss button for loading type', () => {
    const onDismiss = vi.fn();
    render(
      <Toast type="loading" message="Loading..." isVisible={true} onDismiss={onDismiss} />
    );

    expect(screen.queryByTestId('toast-dismiss')).not.toBeInTheDocument();
  });

  it('should call onDismiss when dismiss button clicked', async () => {
    const onDismiss = vi.fn();
    render(
      <Toast type="success" message="Success!" isVisible={true} onDismiss={onDismiss} />
    );

    await userEvent.click(screen.getByTestId('toast-dismiss'));

    expect(onDismiss).toHaveBeenCalled();
  });

  it('should render different toast types', () => {
    const { rerender } = render(
      <Toast type="success" message="Success" isVisible={true} />
    );

    expect(screen.getByTestId('toast').querySelector('.bg-green-50')).toBeInTheDocument();

    rerender(<Toast type="error" message="Error" isVisible={true} />);
    expect(screen.getByTestId('toast').querySelector('.bg-red-50')).toBeInTheDocument();

    rerender(<Toast type="warning" message="Warning" isVisible={true} />);
    expect(screen.getByTestId('toast').querySelector('.bg-yellow-50')).toBeInTheDocument();

    rerender(<Toast type="info" message="Info" isVisible={true} />);
    expect(screen.getByTestId('toast').querySelector('.bg-blue-50')).toBeInTheDocument();
  });

  it('should have correct role attribute', () => {
    render(
      <Toast type="error" message="Error!" isVisible={true} />
    );

    expect(screen.getByTestId('toast')).toHaveAttribute('role', 'alert');
  });
});

describe('InlineFeedback', () => {
  it('should render inline feedback', () => {
    render(<InlineFeedback type="success" message="Success!" />);

    expect(screen.getByTestId('inline-feedback')).toBeInTheDocument();
    expect(screen.getByText('Success!')).toBeInTheDocument();
  });

  it('should have alert role for error type', () => {
    render(<InlineFeedback type="error" message="Error!" />);

    expect(screen.getByTestId('inline-feedback')).toHaveAttribute('role', 'alert');
  });

  it('should have status role for non-error types', () => {
    render(<InlineFeedback type="success" message="Success!" />);

    expect(screen.getByTestId('inline-feedback')).toHaveAttribute('role', 'status');
  });

  it('should apply correct colors for each type', () => {
    const { rerender } = render(<InlineFeedback type="success" message="Success!" />);
    expect(screen.getByTestId('inline-feedback')).toHaveClass('text-green-600');

    rerender(<InlineFeedback type="error" message="Error!" />);
    expect(screen.getByTestId('inline-feedback')).toHaveClass('text-red-600');

    rerender(<InlineFeedback type="warning" message="Warning!" />);
    expect(screen.getByTestId('inline-feedback')).toHaveClass('text-yellow-600');

    rerender(<InlineFeedback type="info" message="Info!" />);
    expect(screen.getByTestId('inline-feedback')).toHaveClass('text-blue-600');
  });
});

describe('LoadingButton', () => {
  it('should render button', () => {
    render(<LoadingButton>Click me</LoadingButton>);

    expect(screen.getByTestId('loading-button')).toBeInTheDocument();
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('should show loading state', () => {
    render(<LoadingButton isLoading={true}>Click me</LoadingButton>);

    expect(screen.getByTestId('button-spinner')).toBeInTheDocument();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should show custom loading text', () => {
    render(
      <LoadingButton isLoading={true} loadingText="Please wait...">
        Click me
      </LoadingButton>
    );

    expect(screen.getByText('Please wait...')).toBeInTheDocument();
  });

  it('should show success state', () => {
    render(
      <LoadingButton isSuccess={true} successText="Done!">
        Click me
      </LoadingButton>
    );

    expect(screen.getByTestId('button-check')).toBeInTheDocument();
    expect(screen.getByText('Done!')).toBeInTheDocument();
  });

  it('should be disabled when loading', () => {
    render(<LoadingButton isLoading={true}>Click me</LoadingButton>);

    expect(screen.getByTestId('loading-button')).toBeDisabled();
  });

  it('should render different variants', () => {
    const { rerender } = render(<LoadingButton variant="default">Click me</LoadingButton>);
    expect(screen.getByTestId('loading-button')).toHaveClass('bg-blue-600');

    rerender(<LoadingButton variant="outline">Click me</LoadingButton>);
    expect(screen.getByTestId('loading-button')).toHaveClass('border');

    rerender(<LoadingButton variant="ghost">Click me</LoadingButton>);
    expect(screen.getByTestId('loading-button')).toHaveClass('hover:bg-gray-100');
  });

  it('should render different sizes', () => {
    const { rerender } = render(<LoadingButton size="sm">Click me</LoadingButton>);
    expect(screen.getByTestId('loading-button')).toHaveClass('px-3', 'py-1.5');

    rerender(<LoadingButton size="lg">Click me</LoadingButton>);
    expect(screen.getByTestId('loading-button')).toHaveClass('px-6', 'py-3');
  });
});

describe('SkeletonShimmer', () => {
  it('should render skeleton shimmer', () => {
    render(<SkeletonShimmer />);

    expect(screen.getByTestId('skeleton-shimmer')).toBeInTheDocument();
  });

  it('should accept width and height', () => {
    render(<SkeletonShimmer width={200} height={50} />);

    expect(screen.getByTestId('skeleton-shimmer')).toHaveStyle({
      width: '200px',
      height: '50px',
    });
  });

  it('should accept string dimensions', () => {
    render(<SkeletonShimmer width="50%" height="auto" />);

    expect(screen.getByTestId('skeleton-shimmer')).toHaveStyle({
      width: '50%',
      height: 'auto',
    });
  });

  it('should render different border radius', () => {
    const { rerender } = render(<SkeletonShimmer rounded="none" />);
    expect(screen.getByTestId('skeleton-shimmer')).toHaveClass('rounded-none');

    rerender(<SkeletonShimmer rounded="full" />);
    expect(screen.getByTestId('skeleton-shimmer')).toHaveClass('rounded-full');
  });
});

describe('Confetti', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render when active', () => {
    render(<Confetti isActive={true} />);

    expect(screen.getByTestId('confetti')).toBeInTheDocument();
  });

  it('should not render when not active', () => {
    render(<Confetti isActive={false} />);

    expect(screen.queryByTestId('confetti')).not.toBeInTheDocument();
  });

  it('should create particles when active', () => {
    render(<Confetti isActive={true} particleCount={10} />);

    expect(screen.getAllByTestId('confetti-particle')).toHaveLength(10);
  });

  it('should clear particles after duration', () => {
    render(<Confetti isActive={true} duration={1000} />);

    expect(screen.getByTestId('confetti')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.queryByTestId('confetti')).not.toBeInTheDocument();
  });
});

describe('NotificationBadge', () => {
  it('should render badge with count', () => {
    render(<NotificationBadge count={5} />);

    expect(screen.getByTestId('notification-badge')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('should not render when count is 0', () => {
    render(<NotificationBadge count={0} />);

    expect(screen.queryByTestId('notification-badge')).not.toBeInTheDocument();
  });

  it('should render when count is 0 and showZero is true', () => {
    render(<NotificationBadge count={0} showZero={true} />);

    expect(screen.getByTestId('notification-badge')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('should cap count at maxCount', () => {
    render(<NotificationBadge count={150} maxCount={99} />);

    expect(screen.getByText('99+')).toBeInTheDocument();
  });

  it('should accept custom className', () => {
    render(<NotificationBadge count={5} className="custom-class" />);

    expect(screen.getByTestId('notification-badge')).toHaveClass('custom-class');
  });
});

describe('FeedbackDisplay', () => {
  it('should not render when no feedback', () => {
    render(
      <FeedbackProvider>
        <FeedbackDisplay />
      </FeedbackProvider>
    );

    expect(screen.queryByTestId('toast')).not.toBeInTheDocument();
  });

  it('should render toast when feedback is shown', async () => {
    render(
      <FeedbackProvider>
        <TestFeedbackConsumer />
        <FeedbackDisplay />
      </FeedbackProvider>
    );

    await userEvent.click(screen.getByTestId('show-success'));

    expect(screen.getByTestId('toast')).toBeInTheDocument();
    // The toast message appears in the toast component
    expect(screen.getByTestId('toast')).toHaveTextContent('Success!');
  });
});

describe('FeedbackContainer', () => {
  it('should render children', () => {
    render(
      <FeedbackContainer>
        <div data-testid="child">Child content</div>
      </FeedbackContainer>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('should provide feedback context', async () => {
    render(
      <FeedbackContainer>
        <TestFeedbackConsumer />
      </FeedbackContainer>
    );

    await userEvent.click(screen.getByTestId('show-success'));

    // Check toast is rendered - there will be two because FeedbackContainer also renders FeedbackDisplay
    expect(screen.getAllByTestId('toast').length).toBeGreaterThanOrEqual(1);
  });
});

describe('Accessibility', () => {
  it('Toast should have role="alert"', () => {
    render(<Toast type="error" message="Error" isVisible={true} />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('InlineFeedback should have appropriate role', () => {
    const { rerender } = render(<InlineFeedback type="error" message="Error" />);
    expect(screen.getByRole('alert')).toBeInTheDocument();

    rerender(<InlineFeedback type="success" message="Success" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('Toast dismiss button should have aria-label', () => {
    render(<Toast type="success" message="Success" isVisible={true} onDismiss={vi.fn()} />);

    expect(screen.getByLabelText('Dismiss')).toBeInTheDocument();
  });

  it('LoadingButton should be properly disabled', () => {
    render(<LoadingButton isLoading={true}>Click</LoadingButton>);

    expect(screen.getByTestId('loading-button')).toBeDisabled();
    expect(screen.getByTestId('loading-button')).toHaveAttribute('disabled');
  });
});
