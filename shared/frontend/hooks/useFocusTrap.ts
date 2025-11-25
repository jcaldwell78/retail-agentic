import { useEffect, useRef, RefObject } from 'react';

/**
 * Hook to trap focus within a container (e.g., modal, dialog).
 * Ensures keyboard navigation stays within the component.
 * Essential for accessibility (WCAG 2.1 AA compliance).
 *
 * @param isActive - Whether focus trap is active
 * @returns Ref to attach to container element
 *
 * @example
 * function Modal({ isOpen, onClose }) {
 *   const modalRef = useFocusTrap(isOpen);
 *
 *   return (
 *     <div ref={modalRef} role="dialog" aria-modal="true">
 *       <button onClick={onClose}>Close</button>
 *       <input placeholder="Name" />
 *       <button>Submit</button>
 *     </div>
 *   );
 * }
 */
export function useFocusTrap<T extends HTMLElement = HTMLDivElement>(
  isActive: boolean
): RefObject<T> {
  const containerRef = useRef<T>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isActive) {
      return;
    }

    const container = containerRef.current;
    if (!container) {
      return;
    }

    // Store currently focused element
    previousActiveElement.current = document.activeElement as HTMLElement;

    // Get all focusable elements
    const getFocusableElements = (): HTMLElement[] => {
      if (!container) return [];

      const focusableSelectors = [
        'a[href]',
        'button:not([disabled])',
        'textarea:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
      ].join(', ');

      return Array.from(container.querySelectorAll<HTMLElement>(focusableSelectors));
    };

    // Focus first element
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }

    // Handle Tab key to trap focus
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') {
        return;
      }

      const focusable = getFocusableElements();
      if (focusable.length === 0) {
        return;
      }

      const firstElement = focusable[0];
      const lastElement = focusable[focusable.length - 1];

      if (event.shiftKey) {
        // Shift+Tab: Move focus backward
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab: Move focus forward
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    // Cleanup: restore focus
    return () => {
      container.removeEventListener('keydown', handleKeyDown);

      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [isActive]);

  return containerRef;
}

/**
 * Hook to auto-focus an element when component mounts.
 *
 * @param shouldFocus - Whether to auto-focus (default: true)
 * @returns Ref to attach to element
 *
 * @example
 * function SearchInput() {
 *   const inputRef = useAutoFocus<HTMLInputElement>();
 *
 *   return <input ref={inputRef} placeholder="Search..." />;
 * }
 */
export function useAutoFocus<T extends HTMLElement = HTMLInputElement>(
  shouldFocus = true
): RefObject<T> {
  const elementRef = useRef<T>(null);

  useEffect(() => {
    if (shouldFocus && elementRef.current) {
      elementRef.current.focus();
    }
  }, [shouldFocus]);

  return elementRef;
}

/**
 * Hook to manage focus within a list (e.g., dropdown, menu).
 * Provides keyboard navigation through list items.
 *
 * @param itemCount - Number of items in the list
 * @param isActive - Whether navigation is active
 * @returns Current focused index and setter
 *
 * @example
 * function Dropdown({ items }) {
 *   const [focusedIndex, setFocusedIndex] = useListNavigation(items.length, isOpen);
 *
 *   return (
 *     <ul>
 *       {items.map((item, index) => (
 *         <li
 *           key={index}
 *           tabIndex={focusedIndex === index ? 0 : -1}
 *           onFocus={() => setFocusedIndex(index)}
 *         >
 *           {item}
 *         </li>
 *       ))}
 *     </ul>
 *   );
 * }
 */
export function useListNavigation(
  itemCount: number,
  isActive: boolean
): [number, (index: number) => void] {
  const [focusedIndex, setFocusedIndex] = React.useState(0);

  useEffect(() => {
    if (!isActive) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setFocusedIndex((prev) => (prev + 1) % itemCount);
          break;
        case 'ArrowUp':
          event.preventDefault();
          setFocusedIndex((prev) => (prev - 1 + itemCount) % itemCount);
          break;
        case 'Home':
          event.preventDefault();
          setFocusedIndex(0);
          break;
        case 'End':
          event.preventDefault();
          setFocusedIndex(itemCount - 1);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isActive, itemCount]);

  return [focusedIndex, setFocusedIndex];
}

// Fix the import for React
import React from 'react';
