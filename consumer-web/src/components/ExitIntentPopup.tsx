import { useState, useEffect, useCallback } from 'react';
import { X, ShoppingCart, Gift, Percent, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

export interface ExitIntentConfig {
  enabled?: boolean;
  delay?: number; // ms before enabling detection
  threshold?: number; // px from top to trigger
  cookieDuration?: number; // days to remember dismissal
  showOnMobile?: boolean;
}

export type PopupVariant = 'discount' | 'reminder' | 'email-capture' | 'countdown';

interface ExitIntentPopupProps {
  isOpen?: boolean;
  onClose: () => void;
  cartItems?: CartItem[];
  cartTotal?: number;
  variant?: PopupVariant;
  discountCode?: string;
  discountPercent?: number;
  onApplyDiscount?: (code: string) => void;
  onEmailSubmit?: (email: string) => void;
  onContinueShopping?: () => void;
  onViewCart?: () => void;
  className?: string;
}

/**
 * Hook to detect exit intent (mouse leaving viewport)
 */
export function useExitIntent(config: ExitIntentConfig = {}) {
  const {
    enabled = true,
    delay = 1000,
    threshold = 50,
    showOnMobile = false,
  } = config;

  const [isTriggered, setIsTriggered] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    // Check if on mobile and should not show
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
    if (isMobile && !showOnMobile) return;

    // Delay before enabling detection
    const timer = setTimeout(() => {
      setIsEnabled(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [enabled, delay, showOnMobile]);

  useEffect(() => {
    if (!isEnabled) return;

    const handleMouseLeave = (e: MouseEvent) => {
      // Only trigger if mouse leaves through the top of the viewport
      if (e.clientY <= threshold) {
        setIsTriggered(true);
      }
    };

    document.addEventListener('mouseout', handleMouseLeave);

    return () => {
      document.removeEventListener('mouseout', handleMouseLeave);
    };
  }, [isEnabled, threshold]);

  const reset = useCallback(() => {
    setIsTriggered(false);
  }, []);

  return { isTriggered, reset, isEnabled };
}

/**
 * Format currency
 */
function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price);
}

/**
 * Discount variant popup
 */
function DiscountPopup({
  discountCode = 'COMEBACK10',
  discountPercent = 10,
  onClose,
  onApplyDiscount,
  onViewCart,
}: {
  discountCode: string;
  discountPercent: number;
  onClose: () => void;
  onApplyDiscount?: (code: string) => void;
  onViewCart?: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(discountCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <CardHeader className="text-center pb-2">
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <Percent className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Wait! Don't Go!</h2>
        <p className="text-gray-600 mt-2">
          Here's {discountPercent}% off your order
        </p>
      </CardHeader>
      <CardContent className="text-center">
        <div className="bg-gray-100 rounded-lg p-4 mb-4">
          <p className="text-sm text-gray-500 mb-1">Use code:</p>
          <div className="flex items-center justify-center gap-2">
            <span
              className="text-2xl font-mono font-bold text-blue-600"
              data-testid="discount-code"
            >
              {discountCode}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyCode}
              data-testid="copy-code-button"
            >
              {copied ? 'Copied!' : 'Copy'}
            </Button>
          </div>
        </div>
        <p className="text-sm text-gray-500">
          Valid for your current cart. Expires in 24 hours.
        </p>
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        <Button
          className="w-full"
          onClick={() => {
            onApplyDiscount?.(discountCode);
            onViewCart?.();
          }}
          data-testid="apply-discount-button"
        >
          Apply & View Cart
        </Button>
        <Button
          variant="ghost"
          className="w-full"
          onClick={onClose}
          data-testid="no-thanks-button"
        >
          No thanks, I'll pay full price
        </Button>
      </CardFooter>
    </>
  );
}

/**
 * Reminder variant popup
 */
function ReminderPopup({
  cartItems = [],
  cartTotal = 0,
  onClose,
  onViewCart,
  onContinueShopping,
}: {
  cartItems: CartItem[];
  cartTotal: number;
  onClose: () => void;
  onViewCart?: () => void;
  onContinueShopping?: () => void;
}) {
  const displayItems = cartItems.slice(0, 3);
  const remainingCount = cartItems.length - 3;

  return (
    <>
      <CardHeader className="text-center pb-2">
        <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
          <ShoppingCart className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Leaving so soon?</h2>
        <p className="text-gray-600 mt-2">
          You have {cartItems.length} item{cartItems.length !== 1 ? 's' : ''} in your cart
        </p>
      </CardHeader>
      <CardContent>
        {displayItems.length > 0 && (
          <div className="space-y-3 mb-4" data-testid="cart-preview">
            {displayItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg"
                data-testid={`cart-item-${item.id}`}
              >
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-12 h-12 object-cover rounded"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                    <ShoppingCart className="w-6 h-6 text-gray-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {item.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    Qty: {item.quantity} × {formatPrice(item.price)}
                  </p>
                </div>
              </div>
            ))}
            {remainingCount > 0 && (
              <p className="text-sm text-gray-500 text-center">
                +{remainingCount} more item{remainingCount !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        )}
        <div className="border-t pt-3">
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-900">Cart Total:</span>
            <span className="text-xl font-bold text-gray-900" data-testid="cart-total">
              {formatPrice(cartTotal)}
            </span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        <Button
          className="w-full"
          onClick={onViewCart}
          data-testid="view-cart-button"
        >
          <ShoppingCart className="w-4 h-4 mr-2" />
          View Cart & Checkout
        </Button>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => {
            onContinueShopping?.();
            onClose();
          }}
          data-testid="continue-shopping-button"
        >
          Continue Shopping
        </Button>
      </CardFooter>
    </>
  );
}

/**
 * Email capture variant popup
 */
function EmailCapturePopup({
  onClose,
  onEmailSubmit,
  discountPercent = 10,
}: {
  onClose: () => void;
  onEmailSubmit?: (email: string) => void;
  discountPercent: number;
}) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      setError('Please enter your email');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email');
      return;
    }

    setError('');
    setSubmitted(true);
    onEmailSubmit?.(email);
  };

  if (submitted) {
    return (
      <>
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <Gift className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Check Your Email!</h2>
          <p className="text-gray-600 mt-2">
            We've sent your {discountPercent}% discount code to {email}
          </p>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-gray-500">
            The code will expire in 24 hours. Happy shopping!
          </p>
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={onClose} data-testid="close-success-button">
            Continue Shopping
          </Button>
        </CardFooter>
      </>
    );
  }

  return (
    <>
      <CardHeader className="text-center pb-2">
        <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
          <Gift className="w-8 h-8 text-purple-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Get {discountPercent}% Off!</h2>
        <p className="text-gray-600 mt-2">
          Subscribe to get your exclusive discount code
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={cn(error && 'border-red-500')}
              data-testid="email-input"
            />
            {error && (
              <p className="text-sm text-red-500 mt-1" data-testid="email-error">
                {error}
              </p>
            )}
          </div>
          <Button type="submit" className="w-full" data-testid="subscribe-button">
            Get My Discount
          </Button>
        </form>
        <p className="text-xs text-gray-400 text-center mt-3">
          By subscribing, you agree to receive marketing emails. Unsubscribe anytime.
        </p>
      </CardContent>
      <CardFooter>
        <Button
          variant="ghost"
          className="w-full"
          onClick={onClose}
          data-testid="no-thanks-email-button"
        >
          No thanks
        </Button>
      </CardFooter>
    </>
  );
}

/**
 * Countdown variant popup
 */
function CountdownPopup({
  discountCode = 'FLASH15',
  discountPercent = 15,
  onClose,
  onApplyDiscount,
  onViewCart,
}: {
  discountCode: string;
  discountPercent: number;
  onClose: () => void;
  onApplyDiscount?: (code: string) => void;
  onViewCart?: () => void;
}) {
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutes in seconds

  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <>
      <CardHeader className="text-center pb-2">
        <div className="bg-red-600 text-white py-2 px-4 rounded-lg mb-4">
          <p className="text-sm font-medium">LIMITED TIME OFFER</p>
        </div>
        <h2 className="text-2xl font-bold text-gray-900">
          {discountPercent}% OFF Expires In:
        </h2>
        <div
          className="flex justify-center gap-2 mt-4"
          data-testid="countdown-timer"
        >
          <div className="bg-gray-900 text-white rounded-lg px-4 py-2">
            <span className="text-3xl font-mono font-bold">
              {String(minutes).padStart(2, '0')}
            </span>
            <p className="text-xs text-gray-400">MIN</p>
          </div>
          <span className="text-3xl font-bold text-gray-900">:</span>
          <div className="bg-gray-900 text-white rounded-lg px-4 py-2">
            <span className="text-3xl font-mono font-bold">
              {String(seconds).padStart(2, '0')}
            </span>
            <p className="text-xs text-gray-400">SEC</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="text-center">
        <p className="text-gray-600">
          Use code <span className="font-bold text-blue-600">{discountCode}</span> at checkout
        </p>
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        <Button
          className="w-full bg-red-600 hover:bg-red-700"
          onClick={() => {
            onApplyDiscount?.(discountCode);
            onViewCart?.();
          }}
          data-testid="claim-offer-button"
        >
          Claim Offer Now
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
        <Button
          variant="ghost"
          className="w-full"
          onClick={onClose}
          data-testid="miss-out-button"
        >
          I'll miss out on this deal
        </Button>
      </CardFooter>
    </>
  );
}

/**
 * Main Exit Intent Popup Component
 */
export function ExitIntentPopup({
  isOpen = false,
  onClose,
  cartItems = [],
  cartTotal = 0,
  variant = 'reminder',
  discountCode = 'COMEBACK10',
  discountPercent = 10,
  onApplyDiscount,
  onEmailSubmit,
  onContinueShopping,
  onViewCart,
  className,
}: ExitIntentPopupProps) {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when popup is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const renderContent = () => {
    switch (variant) {
      case 'discount':
        return (
          <DiscountPopup
            discountCode={discountCode}
            discountPercent={discountPercent}
            onClose={onClose}
            onApplyDiscount={onApplyDiscount}
            onViewCart={onViewCart}
          />
        );
      case 'email-capture':
        return (
          <EmailCapturePopup
            onClose={onClose}
            onEmailSubmit={onEmailSubmit}
            discountPercent={discountPercent}
          />
        );
      case 'countdown':
        return (
          <CountdownPopup
            discountCode={discountCode}
            discountPercent={discountPercent}
            onClose={onClose}
            onApplyDiscount={onApplyDiscount}
            onViewCart={onViewCart}
          />
        );
      case 'reminder':
      default:
        return (
          <ReminderPopup
            cartItems={cartItems}
            cartTotal={cartTotal}
            onClose={onClose}
            onViewCart={onViewCart}
            onContinueShopping={onContinueShopping}
          />
        );
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-50 animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
        data-testid="exit-intent-backdrop"
      />

      {/* Popup */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="exit-intent-title"
        data-testid="exit-intent-popup"
      >
        <Card
          className={cn(
            'relative w-full max-w-md animate-in zoom-in-95 fade-in duration-300',
            className
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Close popup"
            data-testid="close-popup-button"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>

          {renderContent()}
        </Card>
      </div>
    </>
  );
}

/**
 * Container component that combines exit intent detection with popup
 */
export function ExitIntentContainer({
  cartItems = [],
  cartTotal = 0,
  variant = 'reminder',
  discountCode,
  discountPercent,
  onApplyDiscount,
  onEmailSubmit,
  onContinueShopping,
  onViewCart,
  config,
}: {
  cartItems?: CartItem[];
  cartTotal?: number;
  variant?: PopupVariant;
  discountCode?: string;
  discountPercent?: number;
  onApplyDiscount?: (code: string) => void;
  onEmailSubmit?: (email: string) => void;
  onContinueShopping?: () => void;
  onViewCart?: () => void;
  config?: ExitIntentConfig;
}) {
  const { isTriggered, reset } = useExitIntent({
    enabled: cartItems.length > 0,
    ...config,
  });
  const [isDismissed, setIsDismissed] = useState(false);

  const handleClose = () => {
    setIsDismissed(true);
    reset();
  };

  const isOpen = isTriggered && !isDismissed;

  return (
    <ExitIntentPopup
      isOpen={isOpen}
      onClose={handleClose}
      cartItems={cartItems}
      cartTotal={cartTotal}
      variant={variant}
      discountCode={discountCode}
      discountPercent={discountPercent}
      onApplyDiscount={onApplyDiscount}
      onEmailSubmit={onEmailSubmit}
      onContinueShopping={onContinueShopping}
      onViewCart={onViewCart}
    />
  );
}

export default ExitIntentPopup;
