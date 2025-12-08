import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import {
  Check,
  X,
  AlertTriangle,
  Info,
  ShoppingCart,
  Heart,
  Loader2,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

// Types
export type FeedbackType = 'success' | 'error' | 'warning' | 'info' | 'loading';

export interface FeedbackConfig {
  type: FeedbackType;
  message: string;
  title?: string;
  duration?: number;
  onDismiss?: () => void;
}

// Context for global feedback state
interface FeedbackContextType {
  showFeedback: (config: FeedbackConfig) => void;
  hideFeedback: () => void;
  feedback: FeedbackConfig | null;
}

const FeedbackContext = createContext<FeedbackContextType | null>(null);

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [feedback, setFeedback] = useState<FeedbackConfig | null>(null);
  const [timeoutId, setTimeoutId] = useState<ReturnType<typeof setTimeout> | null>(null);

  const hideFeedback = useCallback(() => {
    setFeedback(null);
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
  }, [timeoutId]);

  const showFeedback = useCallback((config: FeedbackConfig) => {
    // Clear existing timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    setFeedback(config);

    // Auto-dismiss after duration (default 3s, loading doesn't auto-dismiss)
    if (config.type !== 'loading') {
      const duration = config.duration ?? 3000;
      const id = setTimeout(() => {
        setFeedback(null);
        config.onDismiss?.();
      }, duration);
      setTimeoutId(id);
    }
  }, [timeoutId]);

  return (
    <FeedbackContext.Provider value={{ showFeedback, hideFeedback, feedback }}>
      {children}
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  const context = useContext(FeedbackContext);
  if (!context) {
    throw new Error('useFeedback must be used within a FeedbackProvider');
  }
  return context;
}

// Hook for triggering animations imperatively
export function useAnimatedFeedback() {
  const { showFeedback, hideFeedback } = useFeedback();

  const success = useCallback((message: string, title?: string) => {
    showFeedback({ type: 'success', message, title });
  }, [showFeedback]);

  const error = useCallback((message: string, title?: string) => {
    showFeedback({ type: 'error', message, title, duration: 5000 });
  }, [showFeedback]);

  const warning = useCallback((message: string, title?: string) => {
    showFeedback({ type: 'warning', message, title, duration: 4000 });
  }, [showFeedback]);

  const info = useCallback((message: string, title?: string) => {
    showFeedback({ type: 'info', message, title });
  }, [showFeedback]);

  const loading = useCallback((message: string, title?: string) => {
    showFeedback({ type: 'loading', message, title });
  }, [showFeedback]);

  return { success, error, warning, info, loading, dismiss: hideFeedback };
}

// Icon mapping
const feedbackIcons: Record<FeedbackType, ReactNode> = {
  success: <Check className="w-5 h-5" />,
  error: <X className="w-5 h-5" />,
  warning: <AlertTriangle className="w-5 h-5" />,
  info: <Info className="w-5 h-5" />,
  loading: <Loader2 className="w-5 h-5 animate-spin" />,
};

const feedbackColors: Record<FeedbackType, string> = {
  success: 'bg-green-500',
  error: 'bg-red-500',
  warning: 'bg-yellow-500',
  info: 'bg-blue-500',
  loading: 'bg-gray-500',
};

const feedbackBgColors: Record<FeedbackType, string> = {
  success: 'bg-green-50 border-green-200',
  error: 'bg-red-50 border-red-200',
  warning: 'bg-yellow-50 border-yellow-200',
  info: 'bg-blue-50 border-blue-200',
  loading: 'bg-gray-50 border-gray-200',
};

const feedbackTextColors: Record<FeedbackType, string> = {
  success: 'text-green-800',
  error: 'text-red-800',
  warning: 'text-yellow-800',
  info: 'text-blue-800',
  loading: 'text-gray-800',
};

// Success Checkmark Animation
interface SuccessCheckmarkProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onComplete?: () => void;
}

export function SuccessCheckmark({ size = 'md', className, onComplete }: SuccessCheckmarkProps) {
  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnimating(false);
      onComplete?.();
    }, 600);
    return () => clearTimeout(timer);
  }, [onComplete]);

  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <div
      className={cn(
        'rounded-full bg-green-500 flex items-center justify-center text-white',
        sizes[size],
        isAnimating && 'animate-bounce-in',
        className
      )}
      data-testid="success-checkmark"
    >
      <Check className={cn(iconSizes[size], isAnimating && 'animate-draw-check')} />
    </div>
  );
}

// Error X Animation
interface ErrorXProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onComplete?: () => void;
}

export function ErrorX({ size = 'md', className, onComplete }: ErrorXProps) {
  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnimating(false);
      onComplete?.();
    }, 600);
    return () => clearTimeout(timer);
  }, [onComplete]);

  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <div
      className={cn(
        'rounded-full bg-red-500 flex items-center justify-center text-white',
        sizes[size],
        isAnimating && 'animate-shake',
        className
      )}
      data-testid="error-x"
    >
      <X className={iconSizes[size]} />
    </div>
  );
}

// Loading Spinner
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

export function LoadingSpinner({ size = 'md', className, label }: LoadingSpinnerProps) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className={cn('flex flex-col items-center gap-2', className)} data-testid="loading-spinner">
      <Loader2 className={cn(sizes[size], 'animate-spin text-blue-500')} />
      {label && <span className="text-sm text-gray-600">{label}</span>}
    </div>
  );
}

// Progress Indicator
interface ProgressIndicatorProps {
  progress: number; // 0-100
  size?: 'sm' | 'md' | 'lg';
  showPercentage?: boolean;
  className?: string;
}

export function ProgressIndicator({
  progress,
  size = 'md',
  showPercentage = true,
  className,
}: ProgressIndicatorProps) {
  const clampedProgress = Math.min(100, Math.max(0, progress));

  const heights = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };

  return (
    <div className={cn('w-full', className)} data-testid="progress-indicator">
      <div className={cn('w-full bg-gray-200 rounded-full overflow-hidden', heights[size])}>
        <div
          className={cn(
            'bg-blue-500 transition-all duration-300 ease-out rounded-full',
            heights[size]
          )}
          style={{ width: `${clampedProgress}%` }}
          data-testid="progress-bar"
        />
      </div>
      {showPercentage && (
        <div className="text-sm text-gray-600 text-center mt-1" data-testid="progress-percentage">
          {Math.round(clampedProgress)}%
        </div>
      )}
    </div>
  );
}

// Pulse Animation (for highlighting elements)
interface PulseAnimationProps {
  children: ReactNode;
  isPulsing?: boolean;
  color?: 'blue' | 'green' | 'red' | 'yellow';
  className?: string;
}

export function PulseAnimation({
  children,
  isPulsing = true,
  color = 'blue',
  className,
}: PulseAnimationProps) {
  const ringColors = {
    blue: 'ring-blue-400',
    green: 'ring-green-400',
    red: 'ring-red-400',
    yellow: 'ring-yellow-400',
  };

  return (
    <div
      className={cn(
        'relative',
        isPulsing && 'animate-pulse',
        className
      )}
      data-testid="pulse-animation"
    >
      {isPulsing && (
        <div
          className={cn(
            'absolute inset-0 rounded-full ring-4 animate-ping',
            ringColors[color]
          )}
          data-testid="pulse-ring"
        />
      )}
      {children}
    </div>
  );
}

// Add to Cart Animation
interface AddToCartAnimationProps {
  isAnimating: boolean;
  onComplete?: () => void;
  className?: string;
}

export function AddToCartAnimation({ isAnimating, onComplete, className }: AddToCartAnimationProps) {
  useEffect(() => {
    if (isAnimating) {
      const timer = setTimeout(() => {
        onComplete?.();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [isAnimating, onComplete]);

  if (!isAnimating) return null;

  return (
    <div
      className={cn(
        'fixed inset-0 pointer-events-none flex items-center justify-center z-50',
        className
      )}
      data-testid="add-to-cart-animation"
    >
      <div className="animate-fly-to-cart">
        <div className="bg-green-500 text-white rounded-full p-3 shadow-lg">
          <ShoppingCart className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}

// Add to Wishlist Animation
interface AddToWishlistAnimationProps {
  isAnimating: boolean;
  onComplete?: () => void;
  className?: string;
}

export function AddToWishlistAnimation({ isAnimating, onComplete, className }: AddToWishlistAnimationProps) {
  useEffect(() => {
    if (isAnimating) {
      const timer = setTimeout(() => {
        onComplete?.();
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [isAnimating, onComplete]);

  if (!isAnimating) return null;

  return (
    <div
      className={cn(
        'absolute inset-0 flex items-center justify-center pointer-events-none',
        className
      )}
      data-testid="add-to-wishlist-animation"
    >
      <Heart className="w-12 h-12 text-red-500 fill-red-500 animate-heart-pop" />
    </div>
  );
}

// Toast Notification
interface ToastProps {
  type: FeedbackType;
  title?: string;
  message: string;
  isVisible: boolean;
  onDismiss?: () => void;
  position?: 'top-right' | 'top-center' | 'bottom-right' | 'bottom-center';
}

export function Toast({
  type,
  title,
  message,
  isVisible,
  onDismiss,
  position = 'top-right',
}: ToastProps) {
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
    'bottom-right': 'bottom-4 right-4',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
  };

  return (
    <div
      className={cn(
        'fixed z-50 transition-all duration-300',
        positionClasses[position],
        isVisible
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 -translate-y-2 pointer-events-none'
      )}
      data-testid="toast"
      role="alert"
    >
      <div
        className={cn(
          'flex items-start gap-3 px-4 py-3 rounded-lg shadow-lg border max-w-sm',
          feedbackBgColors[type]
        )}
      >
        <div className={cn('rounded-full p-1 text-white', feedbackColors[type])}>
          {feedbackIcons[type]}
        </div>
        <div className="flex-1">
          {title && (
            <div className={cn('font-semibold text-sm', feedbackTextColors[type])}>
              {title}
            </div>
          )}
          <div className={cn('text-sm', feedbackTextColors[type])}>{message}</div>
        </div>
        {onDismiss && type !== 'loading' && (
          <button
            onClick={onDismiss}
            className={cn('text-gray-400 hover:text-gray-600')}
            aria-label="Dismiss"
            data-testid="toast-dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

// Inline Feedback (for form fields, etc.)
interface InlineFeedbackProps {
  type: FeedbackType;
  message: string;
  className?: string;
}

export function InlineFeedback({ type, message, className }: InlineFeedbackProps) {
  const icons: Record<FeedbackType, ReactNode> = {
    success: <CheckCircle2 className="w-4 h-4 text-green-500" />,
    error: <XCircle className="w-4 h-4 text-red-500" />,
    warning: <AlertTriangle className="w-4 h-4 text-yellow-500" />,
    info: <Info className="w-4 h-4 text-blue-500" />,
    loading: <Loader2 className="w-4 h-4 text-gray-500 animate-spin" />,
  };

  const textColors: Record<FeedbackType, string> = {
    success: 'text-green-600',
    error: 'text-red-600',
    warning: 'text-yellow-600',
    info: 'text-blue-600',
    loading: 'text-gray-600',
  };

  return (
    <div
      className={cn(
        'flex items-center gap-1.5 text-sm animate-fade-in',
        textColors[type],
        className
      )}
      data-testid="inline-feedback"
      role={type === 'error' ? 'alert' : 'status'}
    >
      {icons[type]}
      <span>{message}</span>
    </div>
  );
}

// Button with Loading State
interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  loadingText?: string;
  successText?: string;
  isSuccess?: boolean;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export function LoadingButton({
  children,
  isLoading = false,
  loadingText = 'Loading...',
  successText,
  isSuccess = false,
  variant = 'default',
  size = 'md',
  className,
  disabled,
  ...props
}: LoadingButtonProps) {
  const variantClasses = {
    default: 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-400',
    outline: 'border border-gray-300 bg-white hover:bg-gray-50 disabled:bg-gray-100',
    ghost: 'hover:bg-gray-100 disabled:bg-transparent',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg',
  };

  const successClass = isSuccess ? 'bg-green-600 hover:bg-green-600' : '';

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-md font-medium transition-all duration-200',
        variantClasses[variant],
        sizeClasses[size],
        successClass,
        className
      )}
      disabled={disabled || isLoading}
      data-testid="loading-button"
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" data-testid="button-spinner" />}
      {isSuccess && <Check className="w-4 h-4 mr-2" data-testid="button-check" />}
      {isLoading ? loadingText : isSuccess && successText ? successText : children}
    </button>
  );
}

// Skeleton with shimmer
interface SkeletonShimmerProps {
  width?: string | number;
  height?: string | number;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  className?: string;
}

export function SkeletonShimmer({
  width = '100%',
  height = 20,
  rounded = 'md',
  className,
}: SkeletonShimmerProps) {
  const roundedClasses = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full',
  };

  return (
    <div
      className={cn(
        'bg-gray-200 animate-shimmer bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%]',
        roundedClasses[rounded],
        className
      )}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
      }}
      data-testid="skeleton-shimmer"
    />
  );
}

// Confetti Animation (for celebrations)
interface ConfettiProps {
  isActive: boolean;
  duration?: number;
  particleCount?: number;
  className?: string;
}

export function Confetti({
  isActive,
  duration = 3000,
  particleCount = 50,
  className,
}: ConfettiProps) {
  const [particles, setParticles] = useState<Array<{ id: number; style: React.CSSProperties }>>([]);

  useEffect(() => {
    if (isActive) {
      const newParticles = Array.from({ length: particleCount }, (_, i) => ({
        id: i,
        style: {
          left: `${Math.random() * 100}%`,
          animationDelay: `${Math.random() * 0.5}s`,
          backgroundColor: ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'][
            Math.floor(Math.random() * 6)
          ],
        } as React.CSSProperties,
      }));
      setParticles(newParticles);

      const timer = setTimeout(() => {
        setParticles([]);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isActive, particleCount, duration]);

  if (particles.length === 0) return null;

  return (
    <div
      className={cn('fixed inset-0 pointer-events-none overflow-hidden z-50', className)}
      data-testid="confetti"
    >
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute w-2 h-2 rounded-sm animate-confetti"
          style={particle.style}
          data-testid="confetti-particle"
        />
      ))}
    </div>
  );
}

// Notification Badge (animated)
interface NotificationBadgeProps {
  count: number;
  maxCount?: number;
  showZero?: boolean;
  className?: string;
}

export function NotificationBadge({
  count,
  maxCount = 99,
  showZero = false,
  className,
}: NotificationBadgeProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [prevCount, setPrevCount] = useState(count);

  useEffect(() => {
    if (count !== prevCount && count > 0) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 300);
      setPrevCount(count);
      return () => clearTimeout(timer);
    }
    setPrevCount(count);
  }, [count, prevCount]);

  if (count === 0 && !showZero) return null;

  const displayCount = count > maxCount ? `${maxCount}+` : count;

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 text-xs font-bold text-white bg-red-500 rounded-full',
        isAnimating && 'animate-bounce-in',
        className
      )}
      data-testid="notification-badge"
    >
      {displayCount}
    </span>
  );
}

// Global Feedback Display
export function FeedbackDisplay() {
  const { feedback, hideFeedback } = useFeedback();

  if (!feedback) return null;

  return (
    <Toast
      type={feedback.type}
      title={feedback.title}
      message={feedback.message}
      isVisible={true}
      onDismiss={hideFeedback}
    />
  );
}

// Container component
interface FeedbackContainerProps {
  children: ReactNode;
}

export function FeedbackContainer({ children }: FeedbackContainerProps) {
  return (
    <FeedbackProvider>
      {children}
      <FeedbackDisplay />
    </FeedbackProvider>
  );
}

export default FeedbackContainer;
