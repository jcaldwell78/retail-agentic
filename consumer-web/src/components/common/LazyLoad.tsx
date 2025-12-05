import { useEffect, useRef, useState, ReactNode } from 'react';

interface LazyLoadProps {
  children: ReactNode;
  height?: number | string;
  offset?: number; // Load offset in pixels before entering viewport
  placeholder?: ReactNode;
  onLoad?: () => void;
  className?: string;
}

/**
 * LazyLoad component that loads children only when they enter the viewport
 * Useful for heavy components, images, or sections that are below the fold
 */
export default function LazyLoad({
  children,
  height,
  offset = 100,
  placeholder,
  onLoad,
  className = '',
}: LazyLoadProps) {
  const [isInView, setIsInView] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            onLoad?.();
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: `${offset}px`,
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [offset, onLoad]);

  const defaultPlaceholder = (
    <div
      className="bg-gray-100 animate-pulse rounded"
      style={{ height: height || '200px' }}
      data-testid="lazy-placeholder"
    />
  );

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ minHeight: typeof height === 'number' ? `${height}px` : height }}
      data-testid="lazy-load-container"
    >
      {isInView ? children : (placeholder || defaultPlaceholder)}
    </div>
  );
}
