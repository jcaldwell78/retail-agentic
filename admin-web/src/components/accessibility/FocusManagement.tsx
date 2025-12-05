import { useEffect, useRef } from 'react';

/**
 * Hook to manage focus on mount
 * Useful for modals, dialogs, and dynamic content
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useAutoFocus<T extends HTMLElement = HTMLElement>(
  shouldFocus: boolean = true
) {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (shouldFocus && ref.current) {
      ref.current.focus();
    }
  }, [shouldFocus]);

  return ref;
}

/**
 * Hook to trap focus within a container
 * Essential for modal dialogs and popups (WCAG 2.1 Level A)
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useFocusTrap<T extends HTMLElement = HTMLElement>(
  isActive: boolean = true
) {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!isActive || !ref.current) return;

    const container = ref.current;
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );

    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    // Focus first element on mount
    firstFocusable?.focus();

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [isActive]);

  return ref;
}

/**
 * Hook to restore focus to previous element
 * Used when closing modals/dialogs
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useFocusReturn() {
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const saveFocus = () => {
    previousFocusRef.current = document.activeElement as HTMLElement;
  };

  const restoreFocus = () => {
    previousFocusRef.current?.focus();
  };

  return { saveFocus, restoreFocus };
}

/**
 * Hook to manage focus based on route changes
 * Announces page changes to screen readers
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useRouteAnnouncement(pageName: string) {
  useEffect(() => {
    // Set page title for screen readers
    document.title = `${pageName} - Retail Store`;

    // Focus on main content
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      mainContent.focus();
    }
  }, [pageName]);
}

/**
 * Component to set focus target for skip links
 */
interface FocusTargetProps {
  id: string;
  children: React.ReactNode;
  className?: string;
}

export function FocusTarget({ id, children, className = '' }: FocusTargetProps) {
  return (
    <div id={id} tabIndex={-1} className={className}>
      {children}
    </div>
  );
}
