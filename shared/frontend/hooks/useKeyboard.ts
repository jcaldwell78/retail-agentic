import { useEffect, useCallback, useRef } from 'react';

/**
 * Keyboard event handler callback
 */
type KeyHandler = (event: KeyboardEvent) => void;

/**
 * Options for keyboard event listeners
 */
interface UseKeyboardOptions {
  /**
   * Listen for keydown events (default: true)
   */
  keydown?: boolean;

  /**
   * Listen for keyup events (default: false)
   */
  keyup?: boolean;

  /**
   * Prevent default behavior (default: false)
   */
  preventDefault?: boolean;

  /**
   * Stop event propagation (default: false)
   */
  stopPropagation?: boolean;

  /**
   * Only trigger when element is focused (default: false)
   */
  requireFocus?: boolean;

  /**
   * Debounce delay in milliseconds (default: 0)
   */
  debounce?: number;
}

/**
 * Custom hook for keyboard event handling with accessibility support.
 * Provides utilities for keyboard navigation, shortcuts, and interactions.
 *
 * @param key - Key or keys to listen for (e.g., 'Enter', 'Escape', ['ArrowUp', 'ArrowDown'])
 * @param handler - Callback function when key is pressed
 * @param options - Configuration options
 *
 * @example
 * // Listen for Enter key
 * useKeyboard('Enter', () => {
 *   console.log('Enter pressed');
 * });
 *
 * @example
 * // Listen for multiple keys
 * useKeyboard(['ArrowUp', 'ArrowDown'], (event) => {
 *   if (event.key === 'ArrowUp') navigateUp();
 *   if (event.key === 'ArrowDown') navigateDown();
 * });
 *
 * @example
 * // With modifiers
 * useKeyboard('s', (event) => {
 *   if (event.ctrlKey || event.metaKey) {
 *     event.preventDefault();
 *     save();
 *   }
 * });
 */
export function useKeyboard(
  key: string | string[],
  handler: KeyHandler,
  options: UseKeyboardOptions = {}
): void {
  const {
    keydown = true,
    keyup = false,
    preventDefault = false,
    stopPropagation = false,
    requireFocus = false,
    debounce = 0,
  } = options;

  const handlerRef = useRef(handler);
  const debounceTimerRef = useRef<NodeJS.Timeout>();

  // Update handler ref when it changes
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  const handleKeyEvent = useCallback(
    (event: KeyboardEvent) => {
      const keys = Array.isArray(key) ? key : [key];

      // Check if pressed key matches
      if (!keys.includes(event.key)) {
        return;
      }

      // Check focus requirement
      if (requireFocus && document.activeElement === document.body) {
        return;
      }

      // Prevent default if requested
      if (preventDefault) {
        event.preventDefault();
      }

      // Stop propagation if requested
      if (stopPropagation) {
        event.stopPropagation();
      }

      // Handle debouncing
      if (debounce > 0) {
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
        debounceTimerRef.current = setTimeout(() => {
          handlerRef.current(event);
        }, debounce);
      } else {
        handlerRef.current(event);
      }
    },
    [key, requireFocus, preventDefault, stopPropagation, debounce]
  );

  useEffect(() => {
    if (keydown) {
      document.addEventListener('keydown', handleKeyEvent);
    }

    if (keyup) {
      document.addEventListener('keyup', handleKeyEvent);
    }

    return () => {
      if (keydown) {
        document.removeEventListener('keydown', handleKeyEvent);
      }
      if (keyup) {
        document.removeEventListener('keyup', handleKeyEvent);
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [keydown, keyup, handleKeyEvent]);
}

/**
 * Hook for keyboard shortcuts with modifier keys.
 * Handles Ctrl/Cmd key differences between platforms.
 *
 * @param key - Key to listen for
 * @param handler - Callback function
 * @param modifiers - Required modifier keys
 *
 * @example
 * // Ctrl+S or Cmd+S to save
 * useKeyboardShortcut('s', handleSave, { ctrl: true });
 *
 * @example
 * // Ctrl+Shift+K
 * useKeyboardShortcut('k', handleShortcut, { ctrl: true, shift: true });
 */
export function useKeyboardShortcut(
  key: string,
  handler: KeyHandler,
  modifiers: {
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
    meta?: boolean;
  } = {}
): void {
  const { ctrl = false, shift = false, alt = false, meta = false } = modifiers;

  useKeyboard(
    key,
    (event) => {
      // Check modifiers
      const ctrlPressed = ctrl ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey;
      const shiftPressed = shift ? event.shiftKey : !event.shiftKey;
      const altPressed = alt ? event.altKey : !event.altKey;
      const metaPressed = meta ? event.metaKey : !event.metaKey;

      if (ctrlPressed && shiftPressed && altPressed && metaPressed) {
        handler(event);
      }
    },
    { preventDefault: true }
  );
}

/**
 * Hook for arrow key navigation.
 * Provides callbacks for up, down, left, right arrow keys.
 *
 * @param handlers - Callbacks for each direction
 *
 * @example
 * useArrowNavigation({
 *   up: () => setSelectedIndex(i => Math.max(0, i - 1)),
 *   down: () => setSelectedIndex(i => Math.min(items.length - 1, i + 1)),
 *   left: () => navigateLeft(),
 *   right: () => navigateRight(),
 * });
 */
export function useArrowNavigation(handlers: {
  up?: () => void;
  down?: () => void;
  left?: () => void;
  right?: () => void;
}): void {
  useKeyboard(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'], (event) => {
    switch (event.key) {
      case 'ArrowUp':
        handlers.up?.();
        break;
      case 'ArrowDown':
        handlers.down?.();
        break;
      case 'ArrowLeft':
        handlers.left?.();
        break;
      case 'ArrowRight':
        handlers.right?.();
        break;
    }
  }, { preventDefault: true });
}

/**
 * Hook for escape key to close modals/dialogs.
 *
 * @param handler - Callback when Escape is pressed
 *
 * @example
 * useEscapeKey(() => setIsOpen(false));
 */
export function useEscapeKey(handler: () => void): void {
  useKeyboard('Escape', handler);
}

/**
 * Hook for Enter key to submit forms or confirm actions.
 *
 * @param handler - Callback when Enter is pressed
 * @param options - Configuration options
 *
 * @example
 * useEnterKey(() => handleSubmit(), { preventDefault: true });
 */
export function useEnterKey(handler: () => void, options?: UseKeyboardOptions): void {
  useKeyboard('Enter', handler, options);
}
