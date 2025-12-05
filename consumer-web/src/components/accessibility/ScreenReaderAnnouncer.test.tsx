import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { renderHook, act } from '@testing-library/react';
import { ScreenReaderAnnouncer, useScreenReaderAnnounce } from './ScreenReaderAnnouncer';

describe('ScreenReaderAnnouncer', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
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
    const { container } = render(
      <ScreenReaderAnnouncer message="Initial message" clearAfter={100} />
    );

    const announcer = container.querySelector('[role="status"]');
    expect(announcer).toHaveTextContent('Initial message');

    // Wait for message to clear
    await waitFor(() => {
      expect(announcer).toHaveTextContent('');
    }, { timeout: 200 });
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

  it('should not clear message when clearAfter is 0', async () => {
    const { container } = render(
      <ScreenReaderAnnouncer message="Persistent message" clearAfter={0} />
    );

    const announcer = container.querySelector('[role="status"]');

    // Wait a bit to ensure it doesn't clear
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(announcer).toHaveTextContent('Persistent message');
  });
});

describe('useScreenReaderAnnounce', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
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
      result.current.announce('Temporary message', 100);
    });

    expect(result.current.message).toBe('Temporary message');

    await waitFor(() => {
      expect(result.current.message).toBe('');
    }, { timeout: 200 });
  });

  it('should clear message after custom time', async () => {
    const { result } = renderHook(() => useScreenReaderAnnounce());

    act(() => {
      result.current.announce('Custom time message', 50);
    });

    expect(result.current.message).toBe('Custom time message');

    await waitFor(() => {
      expect(result.current.message).toBe('');
    }, { timeout: 150 });
  });

  it('should not clear message when clearAfter is 0', async () => {
    const { result } = renderHook(() => useScreenReaderAnnounce());

    act(() => {
      result.current.announce('Persistent message', 0);
    });

    expect(result.current.message).toBe('Persistent message');

    // Wait a bit to ensure it doesn't clear
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(result.current.message).toBe('Persistent message');
  });

  it('should clear previous timeout when new announcement is made', async () => {
    const { result } = renderHook(() => useScreenReaderAnnounce());

    act(() => {
      result.current.announce('First message', 200);
    });

    // Wait a bit but not long enough to clear
    await new Promise(resolve => setTimeout(resolve, 50));

    // Announce new message before first one clears
    act(() => {
      result.current.announce('Second message', 200);
    });

    expect(result.current.message).toBe('Second message');

    // Wait until the first message would have cleared
    await new Promise(resolve => setTimeout(resolve, 170));

    // Should still have second message (total 200ms not passed for second message)
    expect(result.current.message).toBe('Second message');
  });

  it('should cleanup timeout on unmount', async () => {
    const { result, unmount } = renderHook(() => useScreenReaderAnnounce());

    act(() => {
      result.current.announce('Message before unmount', 100);
    });

    unmount();

    // Should not throw or cause issues
    await new Promise(resolve => setTimeout(resolve, 150));
  });
});
