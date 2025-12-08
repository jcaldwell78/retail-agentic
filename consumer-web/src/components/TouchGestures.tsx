import React, {
  useRef,
  useCallback,
  useEffect,
  useState,
  ReactNode,
  TouchEvent as ReactTouchEvent,
} from 'react';
import { cn } from '@/lib/utils';

// Types
export interface TouchPosition {
  x: number;
  y: number;
  timestamp: number;
}

export interface SwipeDirection {
  horizontal: 'left' | 'right' | null;
  vertical: 'up' | 'down' | null;
}

export interface SwipeGestureData {
  direction: SwipeDirection;
  velocity: { x: number; y: number };
  distance: { x: number; y: number };
  duration: number;
}

export interface PinchGestureData {
  scale: number;
  center: { x: number; y: number };
}

export interface LongPressGestureData {
  position: { x: number; y: number };
  duration: number;
}

// Swipe Configuration
export interface SwipeConfig {
  threshold?: number; // Minimum distance to trigger swipe (default: 50px)
  velocityThreshold?: number; // Minimum velocity to trigger swipe (default: 0.3 px/ms)
  preventDefault?: boolean;
}

// Hook: useSwipe
export interface UseSwipeOptions extends SwipeConfig {
  onSwipeLeft?: (data: SwipeGestureData) => void;
  onSwipeRight?: (data: SwipeGestureData) => void;
  onSwipeUp?: (data: SwipeGestureData) => void;
  onSwipeDown?: (data: SwipeGestureData) => void;
  onSwipe?: (data: SwipeGestureData) => void;
}

export function useSwipe<T extends HTMLElement>(options: UseSwipeOptions = {}) {
  const {
    threshold = 50,
    velocityThreshold = 0.3,
    preventDefault = false,
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    onSwipe,
  } = options;

  const ref = useRef<T>(null);
  const startPosition = useRef<TouchPosition | null>(null);

  const handleTouchStart = useCallback((e: globalThis.TouchEvent) => {
    const touch = e.touches[0];
    startPosition.current = {
      x: touch.clientX,
      y: touch.clientY,
      timestamp: Date.now(),
    };
  }, []);

  const handleTouchEnd = useCallback(
    (e: globalThis.TouchEvent) => {
      if (!startPosition.current) return;

      const touch = e.changedTouches[0];
      const endPosition: TouchPosition = {
        x: touch.clientX,
        y: touch.clientY,
        timestamp: Date.now(),
      };

      const deltaX = endPosition.x - startPosition.current.x;
      const deltaY = endPosition.y - startPosition.current.y;
      const duration = endPosition.timestamp - startPosition.current.timestamp;

      // Avoid division by zero and Infinity velocity
      const safeDuration = Math.max(duration, 1);
      const velocityX = Math.abs(deltaX) / safeDuration;
      const velocityY = Math.abs(deltaY) / safeDuration;

      const data: SwipeGestureData = {
        direction: {
          horizontal: null,
          vertical: null,
        },
        velocity: { x: velocityX, y: velocityY },
        distance: { x: deltaX, y: deltaY },
        duration,
      };

      // Determine horizontal direction - must meet BOTH distance AND velocity thresholds
      if (Math.abs(deltaX) >= threshold && velocityX >= velocityThreshold) {
        data.direction.horizontal = deltaX > 0 ? 'right' : 'left';
      }

      // Determine vertical direction - must meet BOTH distance AND velocity thresholds
      if (Math.abs(deltaY) >= threshold && velocityY >= velocityThreshold) {
        data.direction.vertical = deltaY > 0 ? 'down' : 'up';
      }

      // Call appropriate handlers
      if (data.direction.horizontal === 'left') {
        onSwipeLeft?.(data);
      } else if (data.direction.horizontal === 'right') {
        onSwipeRight?.(data);
      }

      if (data.direction.vertical === 'up') {
        onSwipeUp?.(data);
      } else if (data.direction.vertical === 'down') {
        onSwipeDown?.(data);
      }

      if (data.direction.horizontal || data.direction.vertical) {
        onSwipe?.(data);
        if (preventDefault) {
          e.preventDefault();
        }
      }

      startPosition.current = null;
    },
    [threshold, velocityThreshold, preventDefault, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, onSwipe]
  );

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: !preventDefault });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchEnd, preventDefault]);

  return { ref };
}

// Hook: usePinch
export interface UsePinchOptions {
  onPinchStart?: (data: PinchGestureData) => void;
  onPinch?: (data: PinchGestureData) => void;
  onPinchEnd?: (data: PinchGestureData) => void;
  minScale?: number;
  maxScale?: number;
}

export function usePinch<T extends HTMLElement>(options: UsePinchOptions = {}) {
  const { onPinchStart, onPinch, onPinchEnd, minScale = 0.5, maxScale = 3 } = options;

  const ref = useRef<T>(null);
  const initialDistance = useRef<number | null>(null);
  const currentScale = useRef<number>(1);

  const getDistance = useCallback((touches: TouchList): number => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  const getCenter = useCallback((touches: TouchList): { x: number; y: number } => {
    return {
      x: (touches[0].clientX + touches[1].clientX) / 2,
      y: (touches[0].clientY + touches[1].clientY) / 2,
    };
  }, []);

  const handleTouchStart = useCallback(
    (e: globalThis.TouchEvent) => {
      if (e.touches.length === 2) {
        initialDistance.current = getDistance(e.touches);
        const center = getCenter(e.touches);
        onPinchStart?.({ scale: 1, center });
      }
    },
    [getDistance, getCenter, onPinchStart]
  );

  const handleTouchMove = useCallback(
    (e: globalThis.TouchEvent) => {
      if (e.touches.length === 2 && initialDistance.current !== null) {
        const newDistance = getDistance(e.touches);
        let scale = newDistance / initialDistance.current;

        // Clamp scale
        scale = Math.max(minScale, Math.min(maxScale, scale));
        currentScale.current = scale;

        const center = getCenter(e.touches);
        onPinch?.({ scale, center });
      }
    },
    [getDistance, getCenter, onPinch, minScale, maxScale]
  );

  const handleTouchEnd = useCallback(
    (e: globalThis.TouchEvent) => {
      if (initialDistance.current !== null) {
        onPinchEnd?.({ scale: currentScale.current, center: { x: 0, y: 0 } });
        initialDistance.current = null;
      }
    },
    [onPinchEnd]
  );

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return { ref, scale: currentScale.current };
}

// Hook: useLongPress
export interface UseLongPressOptions {
  onLongPress?: (data: LongPressGestureData) => void;
  onPressStart?: () => void;
  onPressEnd?: () => void;
  threshold?: number; // Time in ms to trigger long press (default: 500ms)
  moveThreshold?: number; // Max movement allowed during long press (default: 10px)
}

export function useLongPress<T extends HTMLElement>(options: UseLongPressOptions = {}) {
  const { onLongPress, onPressStart, onPressEnd, threshold = 500, moveThreshold = 10 } = options;

  const ref = useRef<T>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startPosition = useRef<{ x: number; y: number } | null>(null);
  const startTime = useRef<number>(0);
  const [isPressed, setIsPressed] = useState(false);

  const handleTouchStart = useCallback(
    (e: globalThis.TouchEvent) => {
      const touch = e.touches[0];
      startPosition.current = { x: touch.clientX, y: touch.clientY };
      startTime.current = Date.now();
      setIsPressed(true);
      onPressStart?.();

      timerRef.current = setTimeout(() => {
        if (startPosition.current) {
          onLongPress?.({
            position: startPosition.current,
            duration: Date.now() - startTime.current,
          });
        }
      }, threshold);
    },
    [onLongPress, onPressStart, threshold]
  );

  const handleTouchMove = useCallback(
    (e: globalThis.TouchEvent) => {
      if (!startPosition.current) return;

      const touch = e.touches[0];
      const deltaX = Math.abs(touch.clientX - startPosition.current.x);
      const deltaY = Math.abs(touch.clientY - startPosition.current.y);

      if (deltaX > moveThreshold || deltaY > moveThreshold) {
        // Moved too much, cancel long press
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
        startPosition.current = null;
        setIsPressed(false);
        onPressEnd?.();
      }
    },
    [moveThreshold, onPressEnd]
  );

  const handleTouchEnd = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    startPosition.current = null;
    setIsPressed(false);
    onPressEnd?.();
  }, [onPressEnd]);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });
    element.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('touchcancel', handleTouchEnd);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return { ref, isPressed };
}

// Hook: usePullToRefresh
export interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>;
  pullThreshold?: number; // Distance to trigger refresh (default: 80px)
  maxPull?: number; // Maximum pull distance (default: 150px)
  disabled?: boolean;
}

export function usePullToRefresh<T extends HTMLElement>(options: UsePullToRefreshOptions) {
  const { onRefresh, pullThreshold = 80, maxPull = 150, disabled = false } = options;

  const ref = useRef<T>(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef<number>(0);
  const isPulling = useRef<boolean>(false);

  const handleTouchStart = useCallback(
    (e: globalThis.TouchEvent) => {
      if (disabled || isRefreshing) return;

      const element = ref.current;
      if (!element) return;

      // Only allow pull to refresh when at the top of the scroll container
      if (element.scrollTop === 0) {
        startY.current = e.touches[0].clientY;
        isPulling.current = true;
      }
    },
    [disabled, isRefreshing]
  );

  const handleTouchMove = useCallback(
    (e: globalThis.TouchEvent) => {
      if (!isPulling.current || disabled || isRefreshing) return;

      const currentY = e.touches[0].clientY;
      const diff = currentY - startY.current;

      if (diff > 0) {
        // Pulling down
        const distance = Math.min(diff * 0.5, maxPull); // Apply resistance
        setPullDistance(distance);
      }
    },
    [disabled, isRefreshing, maxPull]
  );

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling.current) return;
    isPulling.current = false;

    if (pullDistance >= pullThreshold && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(pullThreshold / 2); // Show loading indicator

      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [pullDistance, pullThreshold, isRefreshing, onRefresh]);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return { ref, pullDistance, isRefreshing };
}

// Component: SwipeableContainer
interface SwipeableContainerProps {
  children: ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
  className?: string;
}

export function SwipeableContainer({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  threshold = 50,
  className,
}: SwipeableContainerProps) {
  const { ref } = useSwipe<HTMLDivElement>({
    onSwipeLeft: onSwipeLeft ? () => onSwipeLeft() : undefined,
    onSwipeRight: onSwipeRight ? () => onSwipeRight() : undefined,
    onSwipeUp: onSwipeUp ? () => onSwipeUp() : undefined,
    onSwipeDown: onSwipeDown ? () => onSwipeDown() : undefined,
    threshold,
  });

  return (
    <div ref={ref} className={className} data-testid="swipeable-container">
      {children}
    </div>
  );
}

// Component: SwipeToDelete
interface SwipeToDeleteProps {
  children: ReactNode;
  onDelete: () => void;
  deleteThreshold?: number;
  className?: string;
}

export function SwipeToDelete({
  children,
  onDelete,
  deleteThreshold = 100,
  className,
}: SwipeToDeleteProps) {
  const [translateX, setTranslateX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: ReactTouchEvent) => {
    startX.current = e.touches[0].clientX;
    setIsDragging(true);
  }, []);

  const handleTouchMove = useCallback((e: ReactTouchEvent) => {
    if (!isDragging) return;

    const currentX = e.touches[0].clientX;
    const diff = currentX - startX.current;

    // Only allow swiping left (negative direction)
    if (diff < 0) {
      setTranslateX(Math.max(diff, -deleteThreshold - 50));
    }
  }, [isDragging, deleteThreshold]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);

    if (Math.abs(translateX) >= deleteThreshold) {
      // Trigger delete animation
      setTranslateX(-500);
      setTimeout(() => {
        onDelete();
      }, 200);
    } else {
      // Snap back
      setTranslateX(0);
    }
  }, [translateX, deleteThreshold, onDelete]);

  return (
    <div className={cn('relative overflow-hidden', className)} data-testid="swipe-to-delete">
      {/* Delete background */}
      <div
        className="absolute inset-y-0 right-0 flex items-center justify-end bg-red-500 px-4"
        style={{ width: Math.abs(translateX) + 20 }}
        data-testid="delete-background"
      >
        <span className="text-white font-medium">Delete</span>
      </div>

      {/* Content */}
      <div
        ref={containerRef}
        className="relative bg-white transition-transform"
        style={{
          transform: `translateX(${translateX}px)`,
          transitionDuration: isDragging ? '0ms' : '200ms',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        data-testid="swipe-content"
      >
        {children}
      </div>
    </div>
  );
}

// Component: PullToRefresh
interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void>;
  pullThreshold?: number;
  className?: string;
}

export function PullToRefresh({
  children,
  onRefresh,
  pullThreshold = 80,
  className,
}: PullToRefreshProps) {
  const { ref, pullDistance, isRefreshing } = usePullToRefresh<HTMLDivElement>({
    onRefresh,
    pullThreshold,
  });

  const progress = Math.min(pullDistance / pullThreshold, 1);

  return (
    <div
      ref={ref}
      className={cn('relative overflow-y-auto', className)}
      data-testid="pull-to-refresh"
    >
      {/* Pull indicator */}
      <div
        className="absolute left-0 right-0 flex items-center justify-center pointer-events-none"
        style={{
          top: -60,
          transform: `translateY(${pullDistance}px)`,
          opacity: progress,
        }}
        data-testid="pull-indicator"
      >
        <div
          className={cn(
            'w-8 h-8 border-2 border-blue-500 rounded-full',
            isRefreshing ? 'animate-spin' : ''
          )}
          style={{
            borderTopColor: 'transparent',
            transform: `rotate(${progress * 360}deg)`,
          }}
          data-testid="refresh-spinner"
        />
      </div>

      {/* Content with pull offset */}
      <div
        style={{ transform: `translateY(${pullDistance}px)` }}
        data-testid="pull-content"
      >
        {children}
      </div>
    </div>
  );
}

// Component: PinchableImage
interface PinchableImageProps {
  src: string;
  alt: string;
  minScale?: number;
  maxScale?: number;
  className?: string;
}

export function PinchableImage({
  src,
  alt,
  minScale = 1,
  maxScale = 3,
  className,
}: PinchableImageProps) {
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const { ref } = usePinch<HTMLDivElement>({
    onPinch: (data) => {
      setScale(data.scale);
    },
    onPinchEnd: (data) => {
      // Reset to min scale if below
      if (data.scale < minScale) {
        setScale(minScale);
        setTranslate({ x: 0, y: 0 });
      }
    },
    minScale,
    maxScale,
  });

  // Double tap to zoom
  const lastTap = useRef<number>(0);
  const handleTouchEnd = useCallback(() => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      // Double tap detected
      if (scale === 1) {
        setScale(2);
      } else {
        setScale(1);
        setTranslate({ x: 0, y: 0 });
      }
    }
    lastTap.current = now;
  }, [scale]);

  return (
    <div
      ref={ref}
      className={cn('overflow-hidden touch-none', className)}
      onTouchEnd={handleTouchEnd}
      data-testid="pinchable-image"
    >
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-contain transition-transform"
        style={{
          transform: `scale(${scale}) translate(${translate.x}px, ${translate.y}px)`,
        }}
        data-testid="pinchable-img"
      />
    </div>
  );
}

// Component: LongPressMenu
interface MenuItem {
  id: string;
  label: string;
  icon?: ReactNode;
  destructive?: boolean;
  onSelect: () => void;
}

interface LongPressMenuProps {
  children: ReactNode;
  items: MenuItem[];
  className?: string;
}

export function LongPressMenu({ children, items, className }: LongPressMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });

  const { ref, isPressed } = useLongPress<HTMLDivElement>({
    onLongPress: (data) => {
      setMenuPosition(data.position);
      setIsOpen(true);
    },
    onPressStart: () => {},
  });

  const handleItemClick = useCallback((item: MenuItem) => {
    item.onSelect();
    setIsOpen(false);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <>
      <div
        ref={ref}
        className={cn('touch-none select-none', className)}
        data-testid="long-press-container"
      >
        {children}
      </div>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-50 bg-black/20"
            onClick={handleClose}
            data-testid="menu-backdrop"
          />

          {/* Menu */}
          <div
            className="fixed z-50 bg-white rounded-lg shadow-lg py-1 min-w-[180px] animate-in fade-in zoom-in-95"
            style={{
              left: Math.min(menuPosition.x, window.innerWidth - 200),
              top: Math.min(menuPosition.y, window.innerHeight - items.length * 48 - 20),
            }}
            data-testid="long-press-menu"
          >
            {items.map((item) => (
              <button
                key={item.id}
                className={cn(
                  'w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-gray-100',
                  item.destructive && 'text-red-600'
                )}
                onClick={() => handleItemClick(item)}
                data-testid={`menu-item-${item.id}`}
              >
                {item.icon && <span className="w-5 h-5">{item.icon}</span>}
                {item.label}
              </button>
            ))}
          </div>
        </>
      )}
    </>
  );
}

// Component: SwipeableCarousel
interface SwipeableCarouselProps {
  children: ReactNode[];
  showDots?: boolean;
  autoPlay?: boolean;
  autoPlayInterval?: number;
  className?: string;
  onChange?: (index: number) => void;
}

export function SwipeableCarousel({
  children,
  showDots = true,
  autoPlay = false,
  autoPlayInterval = 3000,
  className,
  onChange,
}: SwipeableCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [translateX, setTranslateX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalItems = children.length;

  const goToSlide = useCallback(
    (index: number) => {
      const newIndex = Math.max(0, Math.min(index, totalItems - 1));
      setCurrentIndex(newIndex);
      onChange?.(newIndex);
    },
    [totalItems, onChange]
  );

  const handleTouchStart = useCallback((e: ReactTouchEvent) => {
    startX.current = e.touches[0].clientX;
    setIsDragging(true);

    // Stop autoplay while dragging
    if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current);
      autoPlayRef.current = null;
    }
  }, []);

  const handleTouchMove = useCallback((e: ReactTouchEvent) => {
    if (!isDragging) return;

    const currentX = e.touches[0].clientX;
    const diff = currentX - startX.current;
    setTranslateX(diff);
  }, [isDragging]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);

    const threshold = 50;
    if (translateX > threshold && currentIndex > 0) {
      goToSlide(currentIndex - 1);
    } else if (translateX < -threshold && currentIndex < totalItems - 1) {
      goToSlide(currentIndex + 1);
    }

    setTranslateX(0);
  }, [translateX, currentIndex, totalItems, goToSlide]);

  // Auto play
  useEffect(() => {
    if (autoPlay && !isDragging) {
      autoPlayRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % totalItems);
      }, autoPlayInterval);

      return () => {
        if (autoPlayRef.current) {
          clearInterval(autoPlayRef.current);
        }
      };
    }
  }, [autoPlay, autoPlayInterval, totalItems, isDragging]);

  return (
    <div className={cn('relative overflow-hidden', className)} data-testid="swipeable-carousel">
      <div
        ref={containerRef}
        className="flex transition-transform"
        style={{
          transform: `translateX(calc(-${currentIndex * 100}% + ${translateX}px))`,
          transitionDuration: isDragging ? '0ms' : '300ms',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        data-testid="carousel-track"
      >
        {children.map((child, index) => (
          <div key={index} className="flex-shrink-0 w-full" data-testid={`carousel-slide-${index}`}>
            {child}
          </div>
        ))}
      </div>

      {/* Dots */}
      {showDots && totalItems > 1 && (
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2" data-testid="carousel-dots">
          {children.map((_, index) => (
            <button
              key={index}
              className={cn(
                'w-2 h-2 rounded-full transition-colors',
                index === currentIndex ? 'bg-white' : 'bg-white/50'
              )}
              onClick={() => goToSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
              data-testid={`carousel-dot-${index}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default SwipeableContainer;
