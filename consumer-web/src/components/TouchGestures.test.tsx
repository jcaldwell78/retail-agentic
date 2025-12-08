import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  useSwipe,
  usePinch,
  useLongPress,
  usePullToRefresh,
  SwipeableContainer,
  SwipeToDelete,
  PullToRefresh,
  PinchableImage,
  LongPressMenu,
  SwipeableCarousel,
} from './TouchGestures';

// Helper to create touch events
function createTouchEvent(type: string, touches: { clientX: number; clientY: number }[]) {
  const touchList = touches.map((touch, i) => ({
    identifier: i,
    clientX: touch.clientX,
    clientY: touch.clientY,
    target: document.body,
  }));

  return new TouchEvent(type, {
    bubbles: true,
    cancelable: true,
    touches: touchList as unknown as Touch[],
    changedTouches: touchList as unknown as Touch[],
  });
}

// Test component for useSwipe hook
function SwipeTestComponent({
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  onSwipe,
}: {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onSwipe?: () => void;
}) {
  const { ref } = useSwipe<HTMLDivElement>({
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    onSwipe,
    threshold: 50,
  });

  return (
    <div ref={ref} data-testid="swipe-test" style={{ width: 200, height: 200 }}>
      Swipe me
    </div>
  );
}

// Test component for usePinch hook
function PinchTestComponent({
  onPinchStart,
  onPinch,
  onPinchEnd,
}: {
  onPinchStart?: () => void;
  onPinch?: (data: { scale: number }) => void;
  onPinchEnd?: () => void;
}) {
  const { ref } = usePinch<HTMLDivElement>({
    onPinchStart,
    onPinch,
    onPinchEnd,
  });

  return (
    <div ref={ref} data-testid="pinch-test" style={{ width: 200, height: 200 }}>
      Pinch me
    </div>
  );
}

// Test component for useLongPress hook
function LongPressTestComponent({
  onLongPress,
  onPressStart,
  onPressEnd,
  threshold,
}: {
  onLongPress?: () => void;
  onPressStart?: () => void;
  onPressEnd?: () => void;
  threshold?: number;
}) {
  const { ref, isPressed } = useLongPress<HTMLDivElement>({
    onLongPress,
    onPressStart,
    onPressEnd,
    threshold,
  });

  return (
    <div ref={ref} data-testid="long-press-test" style={{ width: 200, height: 200 }}>
      <span data-testid="is-pressed">{isPressed.toString()}</span>
      Long press me
    </div>
  );
}

describe('useSwipe Hook', () => {
  it('should detect swipe left', () => {
    const onSwipeLeft = vi.fn();
    render(<SwipeTestComponent onSwipeLeft={onSwipeLeft} />);

    const element = screen.getByTestId('swipe-test');

    // Simulate swipe left
    fireEvent.touchStart(element, {
      touches: [{ clientX: 100, clientY: 50 }],
    });

    fireEvent.touchEnd(element, {
      changedTouches: [{ clientX: 0, clientY: 50 }],
    });

    expect(onSwipeLeft).toHaveBeenCalled();
  });

  it('should detect swipe right', () => {
    const onSwipeRight = vi.fn();
    render(<SwipeTestComponent onSwipeRight={onSwipeRight} />);

    const element = screen.getByTestId('swipe-test');

    fireEvent.touchStart(element, {
      touches: [{ clientX: 0, clientY: 50 }],
    });

    fireEvent.touchEnd(element, {
      changedTouches: [{ clientX: 100, clientY: 50 }],
    });

    expect(onSwipeRight).toHaveBeenCalled();
  });

  it('should detect swipe up', () => {
    const onSwipeUp = vi.fn();
    render(<SwipeTestComponent onSwipeUp={onSwipeUp} />);

    const element = screen.getByTestId('swipe-test');

    fireEvent.touchStart(element, {
      touches: [{ clientX: 50, clientY: 100 }],
    });

    fireEvent.touchEnd(element, {
      changedTouches: [{ clientX: 50, clientY: 0 }],
    });

    expect(onSwipeUp).toHaveBeenCalled();
  });

  it('should detect swipe down', () => {
    const onSwipeDown = vi.fn();
    render(<SwipeTestComponent onSwipeDown={onSwipeDown} />);

    const element = screen.getByTestId('swipe-test');

    fireEvent.touchStart(element, {
      touches: [{ clientX: 50, clientY: 0 }],
    });

    fireEvent.touchEnd(element, {
      changedTouches: [{ clientX: 50, clientY: 100 }],
    });

    expect(onSwipeDown).toHaveBeenCalled();
  });

  it('should call onSwipe for any direction', () => {
    const onSwipe = vi.fn();
    render(<SwipeTestComponent onSwipe={onSwipe} />);

    const element = screen.getByTestId('swipe-test');

    fireEvent.touchStart(element, {
      touches: [{ clientX: 100, clientY: 50 }],
    });

    fireEvent.touchEnd(element, {
      changedTouches: [{ clientX: 0, clientY: 50 }],
    });

    expect(onSwipe).toHaveBeenCalled();
  });

  it('should not trigger swipe below threshold', () => {
    const onSwipeLeft = vi.fn();
    render(<SwipeTestComponent onSwipeLeft={onSwipeLeft} />);

    const element = screen.getByTestId('swipe-test');

    // Small movement (< 50px threshold)
    fireEvent.touchStart(element, {
      touches: [{ clientX: 100, clientY: 50 }],
    });

    fireEvent.touchEnd(element, {
      changedTouches: [{ clientX: 80, clientY: 50 }],
    });

    expect(onSwipeLeft).not.toHaveBeenCalled();
  });
});

describe('usePinch Hook', () => {
  it('should detect pinch gesture start', () => {
    const onPinchStart = vi.fn();
    render(<PinchTestComponent onPinchStart={onPinchStart} />);

    const element = screen.getByTestId('pinch-test');

    fireEvent.touchStart(element, {
      touches: [
        { clientX: 0, clientY: 0 },
        { clientX: 100, clientY: 0 },
      ],
    });

    expect(onPinchStart).toHaveBeenCalled();
  });

  it('should calculate scale on pinch', () => {
    const onPinch = vi.fn();
    render(<PinchTestComponent onPinch={onPinch} />);

    const element = screen.getByTestId('pinch-test');

    // Start with distance of 100
    fireEvent.touchStart(element, {
      touches: [
        { clientX: 0, clientY: 0 },
        { clientX: 100, clientY: 0 },
      ],
    });

    // Move to distance of 200 (2x scale)
    fireEvent.touchMove(element, {
      touches: [
        { clientX: 0, clientY: 0 },
        { clientX: 200, clientY: 0 },
      ],
    });

    expect(onPinch).toHaveBeenCalled();
    expect(onPinch.mock.calls[0][0].scale).toBeCloseTo(2, 1);
  });

  it('should call onPinchEnd when pinch ends', () => {
    const onPinchEnd = vi.fn();
    render(<PinchTestComponent onPinchEnd={onPinchEnd} />);

    const element = screen.getByTestId('pinch-test');

    fireEvent.touchStart(element, {
      touches: [
        { clientX: 0, clientY: 0 },
        { clientX: 100, clientY: 0 },
      ],
    });

    fireEvent.touchEnd(element, {
      changedTouches: [{ clientX: 0, clientY: 0 }],
    });

    expect(onPinchEnd).toHaveBeenCalled();
  });
});

describe('useLongPress Hook', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should trigger long press after threshold', () => {
    const onLongPress = vi.fn();
    render(<LongPressTestComponent onLongPress={onLongPress} threshold={500} />);

    const element = screen.getByTestId('long-press-test');

    fireEvent.touchStart(element, {
      touches: [{ clientX: 50, clientY: 50 }],
    });

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(onLongPress).toHaveBeenCalled();
  });

  it('should not trigger if released before threshold', () => {
    const onLongPress = vi.fn();
    render(<LongPressTestComponent onLongPress={onLongPress} threshold={500} />);

    const element = screen.getByTestId('long-press-test');

    fireEvent.touchStart(element, {
      touches: [{ clientX: 50, clientY: 50 }],
    });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    fireEvent.touchEnd(element);

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(onLongPress).not.toHaveBeenCalled();
  });

  it('should call onPressStart when touch starts', () => {
    const onPressStart = vi.fn();
    render(<LongPressTestComponent onPressStart={onPressStart} />);

    const element = screen.getByTestId('long-press-test');

    fireEvent.touchStart(element, {
      touches: [{ clientX: 50, clientY: 50 }],
    });

    expect(onPressStart).toHaveBeenCalled();
  });

  it('should call onPressEnd when touch ends', () => {
    const onPressEnd = vi.fn();
    render(<LongPressTestComponent onPressEnd={onPressEnd} />);

    const element = screen.getByTestId('long-press-test');

    fireEvent.touchStart(element, {
      touches: [{ clientX: 50, clientY: 50 }],
    });

    fireEvent.touchEnd(element);

    expect(onPressEnd).toHaveBeenCalled();
  });

  it('should set isPressed to true while pressing', () => {
    render(<LongPressTestComponent />);

    const element = screen.getByTestId('long-press-test');

    expect(screen.getByTestId('is-pressed')).toHaveTextContent('false');

    fireEvent.touchStart(element, {
      touches: [{ clientX: 50, clientY: 50 }],
    });

    expect(screen.getByTestId('is-pressed')).toHaveTextContent('true');

    fireEvent.touchEnd(element);

    expect(screen.getByTestId('is-pressed')).toHaveTextContent('false');
  });

  it('should cancel long press if moved too much', () => {
    const onLongPress = vi.fn();
    render(<LongPressTestComponent onLongPress={onLongPress} threshold={500} />);

    const element = screen.getByTestId('long-press-test');

    fireEvent.touchStart(element, {
      touches: [{ clientX: 50, clientY: 50 }],
    });

    // Move more than threshold
    fireEvent.touchMove(element, {
      touches: [{ clientX: 100, clientY: 100 }],
    });

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(onLongPress).not.toHaveBeenCalled();
  });
});

describe('SwipeableContainer', () => {
  it('should render children', () => {
    render(
      <SwipeableContainer>
        <span>Content</span>
      </SwipeableContainer>
    );

    expect(screen.getByText('Content')).toBeInTheDocument();
    expect(screen.getByTestId('swipeable-container')).toBeInTheDocument();
  });

  it('should call onSwipeLeft when swiping left', () => {
    const onSwipeLeft = vi.fn();
    render(
      <SwipeableContainer onSwipeLeft={onSwipeLeft}>
        <span>Content</span>
      </SwipeableContainer>
    );

    const element = screen.getByTestId('swipeable-container');

    fireEvent.touchStart(element, {
      touches: [{ clientX: 100, clientY: 50 }],
    });

    fireEvent.touchEnd(element, {
      changedTouches: [{ clientX: 0, clientY: 50 }],
    });

    expect(onSwipeLeft).toHaveBeenCalled();
  });

  it('should call onSwipeRight when swiping right', () => {
    const onSwipeRight = vi.fn();
    render(
      <SwipeableContainer onSwipeRight={onSwipeRight}>
        <span>Content</span>
      </SwipeableContainer>
    );

    const element = screen.getByTestId('swipeable-container');

    fireEvent.touchStart(element, {
      touches: [{ clientX: 0, clientY: 50 }],
    });

    fireEvent.touchEnd(element, {
      changedTouches: [{ clientX: 100, clientY: 50 }],
    });

    expect(onSwipeRight).toHaveBeenCalled();
  });

  it('should accept custom className', () => {
    render(
      <SwipeableContainer className="custom-class">
        <span>Content</span>
      </SwipeableContainer>
    );

    expect(screen.getByTestId('swipeable-container')).toHaveClass('custom-class');
  });
});

describe('SwipeToDelete', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render children', () => {
    render(
      <SwipeToDelete onDelete={vi.fn()}>
        <span>Item content</span>
      </SwipeToDelete>
    );

    expect(screen.getByText('Item content')).toBeInTheDocument();
    expect(screen.getByTestId('swipe-to-delete')).toBeInTheDocument();
  });

  it('should show delete background when swiping', () => {
    render(
      <SwipeToDelete onDelete={vi.fn()}>
        <span>Item content</span>
      </SwipeToDelete>
    );

    expect(screen.getByTestId('delete-background')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('should call onDelete when swiped past threshold', () => {
    const onDelete = vi.fn();
    render(
      <SwipeToDelete onDelete={onDelete} deleteThreshold={100}>
        <span>Item content</span>
      </SwipeToDelete>
    );

    const content = screen.getByTestId('swipe-content');

    // Start touch
    fireEvent.touchStart(content, {
      touches: [{ clientX: 200, clientY: 50 }],
    });

    // Swipe left past threshold
    fireEvent.touchMove(content, {
      touches: [{ clientX: 50, clientY: 50 }],
    });

    // End touch
    fireEvent.touchEnd(content);

    // Wait for animation
    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(onDelete).toHaveBeenCalled();
  });

  it('should snap back if not swiped past threshold', () => {
    const onDelete = vi.fn();
    render(
      <SwipeToDelete onDelete={onDelete} deleteThreshold={100}>
        <span>Item content</span>
      </SwipeToDelete>
    );

    const content = screen.getByTestId('swipe-content');

    // Start touch
    fireEvent.touchStart(content, {
      touches: [{ clientX: 200, clientY: 50 }],
    });

    // Small swipe (not past threshold)
    fireEvent.touchMove(content, {
      touches: [{ clientX: 180, clientY: 50 }],
    });

    // End touch
    fireEvent.touchEnd(content);

    expect(onDelete).not.toHaveBeenCalled();
  });
});

describe('PullToRefresh', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render children', () => {
    render(
      <PullToRefresh onRefresh={async () => {}}>
        <span>Content</span>
      </PullToRefresh>
    );

    expect(screen.getByText('Content')).toBeInTheDocument();
    expect(screen.getByTestId('pull-to-refresh')).toBeInTheDocument();
  });

  it('should render pull indicator', () => {
    render(
      <PullToRefresh onRefresh={async () => {}}>
        <span>Content</span>
      </PullToRefresh>
    );

    expect(screen.getByTestId('pull-indicator')).toBeInTheDocument();
    expect(screen.getByTestId('refresh-spinner')).toBeInTheDocument();
  });

  it('should render content container', () => {
    render(
      <PullToRefresh onRefresh={async () => {}}>
        <span>Content</span>
      </PullToRefresh>
    );

    expect(screen.getByTestId('pull-content')).toBeInTheDocument();
  });
});

describe('PinchableImage', () => {
  it('should render image', () => {
    render(<PinchableImage src="/test.jpg" alt="Test image" />);

    expect(screen.getByTestId('pinchable-image')).toBeInTheDocument();
    expect(screen.getByTestId('pinchable-img')).toHaveAttribute('src', '/test.jpg');
    expect(screen.getByTestId('pinchable-img')).toHaveAttribute('alt', 'Test image');
  });

  it('should accept custom className', () => {
    render(<PinchableImage src="/test.jpg" alt="Test" className="custom-class" />);

    expect(screen.getByTestId('pinchable-image')).toHaveClass('custom-class');
  });
});

describe('LongPressMenu', () => {
  const mockItems = [
    { id: 'edit', label: 'Edit', onSelect: vi.fn() },
    { id: 'share', label: 'Share', onSelect: vi.fn() },
    { id: 'delete', label: 'Delete', destructive: true, onSelect: vi.fn() },
  ];

  it('should render children', () => {
    render(
      <LongPressMenu items={mockItems}>
        <span>Press me</span>
      </LongPressMenu>
    );

    expect(screen.getByText('Press me')).toBeInTheDocument();
    expect(screen.getByTestId('long-press-container')).toBeInTheDocument();
  });

  it('should render long press container with correct classes', () => {
    render(
      <LongPressMenu items={mockItems}>
        <span>Press me</span>
      </LongPressMenu>
    );

    expect(screen.getByTestId('long-press-container')).toHaveClass('touch-none');
    expect(screen.getByTestId('long-press-container')).toHaveClass('select-none');
  });

  it('should accept custom className', () => {
    render(
      <LongPressMenu items={mockItems} className="custom-class">
        <span>Press me</span>
      </LongPressMenu>
    );

    expect(screen.getByTestId('long-press-container')).toHaveClass('custom-class');
  });

  // Note: Testing the actual long press menu opening requires native DOM touch events
  // which are difficult to simulate in jsdom. The useLongPress hook is tested separately.
});

describe('SwipeableCarousel', () => {
  const slides = [
    <div key={1}>Slide 1</div>,
    <div key={2}>Slide 2</div>,
    <div key={3}>Slide 3</div>,
  ];

  it('should render carousel', () => {
    render(<SwipeableCarousel>{slides}</SwipeableCarousel>);

    expect(screen.getByTestId('swipeable-carousel')).toBeInTheDocument();
  });

  it('should render all slides', () => {
    render(<SwipeableCarousel>{slides}</SwipeableCarousel>);

    expect(screen.getByTestId('carousel-slide-0')).toBeInTheDocument();
    expect(screen.getByTestId('carousel-slide-1')).toBeInTheDocument();
    expect(screen.getByTestId('carousel-slide-2')).toBeInTheDocument();
  });

  it('should render dots by default', () => {
    render(<SwipeableCarousel>{slides}</SwipeableCarousel>);

    expect(screen.getByTestId('carousel-dots')).toBeInTheDocument();
    expect(screen.getByTestId('carousel-dot-0')).toBeInTheDocument();
    expect(screen.getByTestId('carousel-dot-1')).toBeInTheDocument();
    expect(screen.getByTestId('carousel-dot-2')).toBeInTheDocument();
  });

  it('should not render dots when showDots is false', () => {
    render(<SwipeableCarousel showDots={false}>{slides}</SwipeableCarousel>);

    expect(screen.queryByTestId('carousel-dots')).not.toBeInTheDocument();
  });

  it('should not render dots for single slide', () => {
    render(<SwipeableCarousel>{[<div key={1}>Single</div>]}</SwipeableCarousel>);

    expect(screen.queryByTestId('carousel-dots')).not.toBeInTheDocument();
  });

  it('should navigate when clicking dots', async () => {
    const onChange = vi.fn();
    render(<SwipeableCarousel onChange={onChange}>{slides}</SwipeableCarousel>);

    await userEvent.click(screen.getByTestId('carousel-dot-1'));

    expect(onChange).toHaveBeenCalledWith(1);
  });

  it('should navigate on swipe left', () => {
    const onChange = vi.fn();
    render(<SwipeableCarousel onChange={onChange}>{slides}</SwipeableCarousel>);

    const track = screen.getByTestId('carousel-track');

    fireEvent.touchStart(track, {
      touches: [{ clientX: 200, clientY: 50 }],
    });

    fireEvent.touchMove(track, {
      touches: [{ clientX: 50, clientY: 50 }],
    });

    fireEvent.touchEnd(track);

    expect(onChange).toHaveBeenCalledWith(1);
  });

  it('should navigate on swipe right', async () => {
    const onChange = vi.fn();
    render(<SwipeableCarousel onChange={onChange}>{slides}</SwipeableCarousel>);

    // First go to slide 1
    await userEvent.click(screen.getByTestId('carousel-dot-1'));
    onChange.mockClear();

    const track = screen.getByTestId('carousel-track');

    fireEvent.touchStart(track, {
      touches: [{ clientX: 50, clientY: 50 }],
    });

    fireEvent.touchMove(track, {
      touches: [{ clientX: 200, clientY: 50 }],
    });

    fireEvent.touchEnd(track);

    expect(onChange).toHaveBeenCalledWith(0);
  });

  it('should not go below first slide', () => {
    const onChange = vi.fn();
    render(<SwipeableCarousel onChange={onChange}>{slides}</SwipeableCarousel>);

    const track = screen.getByTestId('carousel-track');

    // Try to swipe right on first slide
    fireEvent.touchStart(track, {
      touches: [{ clientX: 50, clientY: 50 }],
    });

    fireEvent.touchMove(track, {
      touches: [{ clientX: 200, clientY: 50 }],
    });

    fireEvent.touchEnd(track);

    // Should not change (stays at 0)
    expect(onChange).not.toHaveBeenCalled();
  });

  it('should not go past last slide', async () => {
    const onChange = vi.fn();
    render(<SwipeableCarousel onChange={onChange}>{slides}</SwipeableCarousel>);

    // Go to last slide
    await userEvent.click(screen.getByTestId('carousel-dot-2'));
    onChange.mockClear();

    const track = screen.getByTestId('carousel-track');

    // Try to swipe left on last slide
    fireEvent.touchStart(track, {
      touches: [{ clientX: 200, clientY: 50 }],
    });

    fireEvent.touchMove(track, {
      touches: [{ clientX: 50, clientY: 50 }],
    });

    fireEvent.touchEnd(track);

    // Should not change (stays at 2)
    expect(onChange).not.toHaveBeenCalled();
  });

  it('should accept custom className', () => {
    render(
      <SwipeableCarousel className="custom-class">{slides}</SwipeableCarousel>
    );

    expect(screen.getByTestId('swipeable-carousel')).toHaveClass('custom-class');
  });

  it('should have proper aria labels on dots', () => {
    render(<SwipeableCarousel>{slides}</SwipeableCarousel>);

    expect(screen.getByLabelText('Go to slide 1')).toBeInTheDocument();
    expect(screen.getByLabelText('Go to slide 2')).toBeInTheDocument();
    expect(screen.getByLabelText('Go to slide 3')).toBeInTheDocument();
  });
});

describe('Accessibility', () => {
  it('SwipeableCarousel dots should have aria-label', () => {
    render(
      <SwipeableCarousel>
        {[<div key={1}>Slide 1</div>, <div key={2}>Slide 2</div>]}
      </SwipeableCarousel>
    );

    expect(screen.getByLabelText('Go to slide 1')).toBeInTheDocument();
    expect(screen.getByLabelText('Go to slide 2')).toBeInTheDocument();
  });

  it('LongPressMenu container should have touch-none class for gesture handling', () => {
    const items = [
      { id: 'edit', label: 'Edit', onSelect: vi.fn() },
    ];

    render(
      <LongPressMenu items={items}>
        <span>Press me</span>
      </LongPressMenu>
    );

    // Container should have touch-none for proper gesture handling
    expect(screen.getByTestId('long-press-container')).toHaveClass('touch-none');
  });
});
