import { useEffect, useRef, useState } from 'react';

interface ScreenReaderAnnouncerProps {
  message: string;
  politeness?: 'polite' | 'assertive';
  clearAfter?: number;
}

/**
 * Screen Reader Announcer component
 * Announces dynamic content changes to screen reader users
 * WCAG 2.1 Level A requirement for status messages
 */
export function ScreenReaderAnnouncer({
  message,
  politeness = 'polite',
  clearAfter = 5000,
}: ScreenReaderAnnouncerProps) {
  const [announcement, setAnnouncement] = useState(message);

  useEffect(() => {
    setAnnouncement(message);

    if (clearAfter > 0) {
      const timer = setTimeout(() => {
        setAnnouncement('');
      }, clearAfter);

      return () => clearTimeout(timer);
    }
  }, [message, clearAfter]);

  return (
    <div
      role="status"
      aria-live={politeness}
      aria-atomic="true"
      className="sr-only"
    >
      {announcement}
    </div>
  );
}

/**
 * Hook for managing screen reader announcements
 * Usage: const announce = useScreenReaderAnnounce();
 *        announce('Item added to cart');
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useScreenReaderAnnounce() {
  const [message, setMessage] = useState('');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const announce = (text: string, clearAfter = 5000) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setMessage(text);

    if (clearAfter > 0) {
      timeoutRef.current = setTimeout(() => {
        setMessage('');
      }, clearAfter);
    }
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { message, announce };
}

/**
 * Global Screen Reader Announcer Provider
 * Place this at the root of your app
 */
export function GlobalScreenReaderAnnouncer() {
  const { message } = useScreenReaderAnnounce();

  return <ScreenReaderAnnouncer message={message} />;
}
