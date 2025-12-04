import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { renderHook, act } from '@testing-library/react';
import { ScreenReaderAnnouncer, useScreenReaderAnnounce } from './ScreenReaderAnnouncer';

describe('ScreenReaderAnnouncer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render with polite aria-live by default', () => {
    const { container } = render(<ScreenReaderAnnouncer message="Test message" />);

    const announcer = container.querySelector('[role="status"]');
    expect(announcer).toBeInTheDocument();
    expect(announcer).toHaveAttribute('aria-live', 'polite');
  });

  it('should render with assertive aria-live when specified', () => {
    const { container } = render(
      <ScreenReaderAnnouncer message="Urgent message" politeness="assertive" />
    );

    const announcer = container.querySelector('[role="status"]');
    expect(announcer).toHaveAttribute('aria-live', 'assertive');
  });

  it('should have aria-atomic=true', () => {
    const { container } = render(<ScreenReaderAnnouncer message="Test" />);

    const announcer = container.querySelector('[role="status"]');
    expect(announcer).toHaveAttribute('aria-atomic', 'true');
  });

  it('should be visually hidden with sr-only class', () => {
    const { container } = render(<ScreenReaderAnnouncer message="Test" />);

    const announcer = container.querySelector('[role="status"]');
    expect(announcer).toHaveClass('sr-only');
  });

  it('should display the message', () => {
    const { container } = render(<ScreenReaderAnnouncer message="Test announcement" />);

    const announcer = container.querySelector('[role="status"]');
    expect(announcer).toHaveTextContent('Test announcement');
  });

  it('should clear message after specified time', async () => {
    const { container, rerender } = render(
      <ScreenReaderAnnouncer message="Initial message" clearAfter={3000} />
    );

    const announcer = container.querySelector('[role="status"]');
    expect(announcer).toHaveTextContent('Initial message');

    // Fast-forward time
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    await waitFor(() => {
      expect(announcer).toHaveTextContent('');
    });
  });

  it('should update message when prop changes', () => {
    const { container, rerender } = render(
      <ScreenReaderAnnouncer message="First message" />
    );

    const announcer = container.querySelector('[role="status"]');
    expect(announcer).toHaveTextContent('First message');

    rerender(<ScreenReaderAnnouncer message="Second message" />);
    expect(announcer).toHaveTextContent('Second message');
  });

  it('should not clear message when clearAfter is 0', () => {
    const { container } = render(
      <ScreenReaderAnnouncer message="Persistent message" clearAfter={0} />
    );

    const announcer = container.querySelector('[role="status"]');

    act(() => {
      vi.advanceTimersByTime(10000);
    });

    expect(announcer).toHaveTextContent('Persistent message');
  });
});

describe('useScreenReaderAnnounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should provide announce function and message', () => {
    const { result } = renderHook(() => useScreenReaderAnnounce());

    expect(result.current.message).toBe('');
    expect(typeof result.current.announce).toBe('function');
  });

  it('should update message when announce is called', () => {
    const { result } = renderHook(() => useScreenReaderAnnounce());

    act(() => {
      result.current.announce('Test announcement');
    });

    expect(result.current.message).toBe('Test announcement');
  });

  it('should clear message after default time', async () => {
    const { result } = renderHook(() => useScreenReaderAnnounce());

    act(() => {
      result.current.announce('Temporary message');
    });

    expect(result.current.message).toBe('Temporary message');

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    await waitFor(() => {
      expect(result.current.message).toBe('');
    });
  });

  it('should clear message after custom time', async () => {
    const { result } = renderHook(() => useScreenReaderAnnounce());

    act(() => {
      result.current.announce('Custom time message', 2000);
    });

    expect(result.current.message).toBe('Custom time message');

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    await waitFor(() => {
      expect(result.current.message).toBe('');
    });
  });

  it('should not clear message when clearAfter is 0', () => {
    const { result } = renderHook(() => useScreenReaderAnnounce());

    act(() => {
      result.current.announce('Persistent message', 0);
    });

    expect(result.current.message).toBe('Persistent message');

    act(() => {
      vi.advanceTimersByTime(10000);
    });

    expect(result.current.message).toBe('Persistent message');
  });

  it('should clear previous timeout when new announcement is made', () => {
    const { result } = renderHook(() => useScreenReaderAnnounce());

    act(() => {
      result.current.announce('First message', 5000);
    });

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    // Announce new message before first one clears
    act(() => {
      result.current.announce('Second message', 5000);
    });

    expect(result.current.message).toBe('Second message');

    // Advance to where first message would have cleared
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    // Should still have second message (total 5000ms not passed for second message)
    expect(result.current.message).toBe('Second message');
  });

  it('should cleanup timeout on unmount', () => {
    const { result, unmount } = renderHook(() => useScreenReaderAnnounce());

    act(() => {
      result.current.announce('Message before unmount');
    });

    unmount();

    // Should not throw or cause issues
    act(() => {
      vi.advanceTimersByTime(10000);
    });
  });
});
