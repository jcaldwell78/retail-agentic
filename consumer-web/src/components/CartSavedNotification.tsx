'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { X, ShoppingCart, Clock, ArrowRight, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

interface CartItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  imageUrl?: string;
}

interface CartSavedState {
  // State
  hasReturnedWithCart: boolean;
  cartItemCount: number;
  cartTotal: number;
  lastVisitTimestamp: number | null;
  timeSinceLastVisit: string | null;
  isNotificationVisible: boolean;
  cartItems: CartItem[];

  // Actions
  dismissNotification: () => void;
  showNotification: () => void;
  navigateToCart: () => void;
  markAsReturning: () => void;
  updateCartData: (items: CartItem[], total: number) => void;
}

interface CartSavedProviderProps {
  children: ReactNode;
  onNavigateToCart?: () => void;
  sessionStorageKey?: string;
  localStorageKey?: string;
  minTimeAwayMs?: number;
}

// ============================================================================
// Context
// ============================================================================

const CartSavedContext = createContext<CartSavedState | null>(null);

export function useCartSaved(): CartSavedState {
  const context = useContext(CartSavedContext);
  if (!context) {
    throw new Error('useCartSaved must be used within a CartSavedProvider');
  }
  return context;
}

// ============================================================================
// Utility Functions
// ============================================================================

function formatTimeSince(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days > 0) {
    return days === 1 ? '1 day ago' : `${days} days ago`;
  }
  if (hours > 0) {
    return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
  }
  if (minutes > 0) {
    return minutes === 1 ? '1 minute ago' : `${minutes} minutes ago`;
  }
  return 'just now';
}

// ============================================================================
// Provider Component
// ============================================================================

export function CartSavedProvider({
  children,
  onNavigateToCart,
  sessionStorageKey = 'cart-saved-session',
  localStorageKey = 'cart-saved-last-visit',
  minTimeAwayMs = 5 * 60 * 1000, // 5 minutes default
}: CartSavedProviderProps) {
  const [hasReturnedWithCart, setHasReturnedWithCart] = useState(false);
  const [isNotificationVisible, setIsNotificationVisible] = useState(false);
  const [lastVisitTimestamp, setLastVisitTimestamp] = useState<number | null>(null);
  const [timeSinceLastVisit, setTimeSinceLastVisit] = useState<string | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartTotal, setCartTotal] = useState(0);

  // Calculate cart item count
  const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  // Check if this is a returning session
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if we've already shown notification this session
    const sessionFlag = sessionStorage.getItem(sessionStorageKey);
    if (sessionFlag === 'shown') {
      return;
    }

    // Get last visit timestamp
    const lastVisit = localStorage.getItem(localStorageKey);
    if (lastVisit) {
      const timestamp = parseInt(lastVisit, 10);
      const timeSinceVisit = Date.now() - timestamp;

      // Only show notification if user was away for minimum time
      if (timeSinceVisit >= minTimeAwayMs) {
        setLastVisitTimestamp(timestamp);
        setTimeSinceLastVisit(formatTimeSince(timestamp));
        setHasReturnedWithCart(true);
      }
    }

    // Update last visit timestamp
    localStorage.setItem(localStorageKey, Date.now().toString());
  }, [sessionStorageKey, localStorageKey, minTimeAwayMs]);

  // Show notification when cart data is available and user has returned
  useEffect(() => {
    if (hasReturnedWithCart && cartItems.length > 0 && !isNotificationVisible) {
      const sessionFlag = sessionStorage.getItem(sessionStorageKey);
      if (sessionFlag !== 'shown') {
        setIsNotificationVisible(true);
      }
    }
  }, [hasReturnedWithCart, cartItems.length, isNotificationVisible, sessionStorageKey]);

  const dismissNotification = useCallback(() => {
    setIsNotificationVisible(false);
    sessionStorage.setItem(sessionStorageKey, 'shown');
  }, [sessionStorageKey]);

  const showNotification = useCallback(() => {
    setIsNotificationVisible(true);
  }, []);

  const navigateToCart = useCallback(() => {
    dismissNotification();
    onNavigateToCart?.();
  }, [dismissNotification, onNavigateToCart]);

  const markAsReturning = useCallback(() => {
    setHasReturnedWithCart(true);
  }, []);

  const updateCartData = useCallback((items: CartItem[], total: number) => {
    setCartItems(items);
    setCartTotal(total);
  }, []);

  const value: CartSavedState = {
    hasReturnedWithCart,
    cartItemCount,
    cartTotal,
    lastVisitTimestamp,
    timeSinceLastVisit,
    isNotificationVisible,
    cartItems,
    dismissNotification,
    showNotification,
    navigateToCart,
    markAsReturning,
    updateCartData,
  };

  return <CartSavedContext.Provider value={value}>{children}</CartSavedContext.Provider>;
}

// ============================================================================
// Toast Notification Component
// ============================================================================

interface CartSavedToastProps {
  className?: string;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  showItemCount?: boolean;
  showTotal?: boolean;
  showTimestamp?: boolean;
  autoHideDuration?: number | null;
}

export function CartSavedToast({
  className,
  position = 'bottom-right',
  showItemCount = true,
  showTotal = true,
  showTimestamp = true,
  autoHideDuration = null,
}: CartSavedToastProps) {
  const { isNotificationVisible, cartItemCount, cartTotal, timeSinceLastVisit, dismissNotification, navigateToCart } =
    useCartSaved();

  // Auto-hide after duration
  useEffect(() => {
    if (autoHideDuration && isNotificationVisible) {
      const timer = setTimeout(() => {
        dismissNotification();
      }, autoHideDuration);
      return () => clearTimeout(timer);
    }
  }, [autoHideDuration, isNotificationVisible, dismissNotification]);

  if (!isNotificationVisible || cartItemCount === 0) {
    return null;
  }

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
  };

  return (
    <div
      className={cn(
        'fixed z-50 w-full max-w-sm bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 animate-in slide-in-from-bottom-5 duration-300',
        positionClasses[position],
        className
      )}
      role="alert"
      aria-live="polite"
      data-testid="cart-saved-toast"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 p-2 bg-primary/10 rounded-full">
          <ShoppingCart className="h-5 w-5 text-primary" aria-hidden="true" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100" data-testid="toast-title">
            Welcome back!
          </h3>

          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400" data-testid="toast-message">
            {showItemCount && (
              <span>
                You have{' '}
                <strong>
                  {cartItemCount} {cartItemCount === 1 ? 'item' : 'items'}
                </strong>{' '}
                in your cart
              </span>
            )}
            {showTotal && cartTotal > 0 && (
              <span data-testid="toast-total"> worth ${cartTotal.toFixed(2)}</span>
            )}
            {showTimestamp && timeSinceLastVisit && (
              <span className="block mt-1 text-xs text-gray-500" data-testid="toast-timestamp">
                <Clock className="inline-block h-3 w-3 mr-1" aria-hidden="true" />
                Last visited {timeSinceLastVisit}
              </span>
            )}
          </p>

          <div className="mt-3 flex gap-2">
            <Button size="sm" onClick={navigateToCart} className="gap-1" data-testid="view-cart-button">
              View Cart
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button size="sm" variant="ghost" onClick={dismissNotification} data-testid="continue-shopping-button">
              Continue Shopping
            </Button>
          </div>
        </div>

        <button
          onClick={dismissNotification}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          aria-label="Dismiss notification"
          data-testid="dismiss-toast-button"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// Banner Notification Component
// ============================================================================

interface CartSavedBannerProps {
  className?: string;
  showItemCount?: boolean;
  showTotal?: boolean;
  variant?: 'default' | 'compact';
}

export function CartSavedBanner({
  className,
  showItemCount = true,
  showTotal = true,
  variant = 'default',
}: CartSavedBannerProps) {
  const { isNotificationVisible, cartItemCount, cartTotal, dismissNotification, navigateToCart } = useCartSaved();

  if (!isNotificationVisible || cartItemCount === 0) {
    return null;
  }

  if (variant === 'compact') {
    return (
      <div
        className={cn(
          'bg-primary text-primary-foreground py-2 px-4 flex items-center justify-between gap-4',
          className
        )}
        role="alert"
        aria-live="polite"
        data-testid="cart-saved-banner"
      >
        <div className="flex items-center gap-2 text-sm">
          <ShoppingCart className="h-4 w-4" aria-hidden="true" />
          <span data-testid="banner-message">
            Your cart is waiting! {showItemCount && `(${cartItemCount} ${cartItemCount === 1 ? 'item' : 'items'})`}
            {showTotal && cartTotal > 0 && ` • $${cartTotal.toFixed(2)}`}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={navigateToCart}
            className="h-7 text-xs"
            data-testid="banner-view-cart-button"
          >
            View Cart
          </Button>
          <button
            onClick={dismissNotification}
            className="text-primary-foreground/80 hover:text-primary-foreground"
            aria-label="Dismiss banner"
            data-testid="dismiss-banner-button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn('bg-primary/5 border-b border-primary/20 py-3 px-4', className)}
      role="alert"
      aria-live="polite"
      data-testid="cart-saved-banner"
    >
      <div className="container mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-full">
            <ShoppingCart className="h-5 w-5 text-primary" aria-hidden="true" />
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-gray-100" data-testid="banner-title">
              Welcome back!
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400" data-testid="banner-message">
              {showItemCount && (
                <>
                  You have{' '}
                  <strong>
                    {cartItemCount} {cartItemCount === 1 ? 'item' : 'items'}
                  </strong>{' '}
                  saved in your cart
                </>
              )}
              {showTotal && cartTotal > 0 && <> worth ${cartTotal.toFixed(2)}</>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={navigateToCart} className="gap-1" data-testid="banner-view-cart-button">
            View Cart
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
          <button
            onClick={dismissNotification}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            aria-label="Dismiss banner"
            data-testid="dismiss-banner-button"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Cart Preview Component
// ============================================================================

interface CartPreviewProps {
  className?: string;
  maxItems?: number;
  showImages?: boolean;
}

export function CartPreview({ className, maxItems = 3, showImages = true }: CartPreviewProps) {
  const { cartItems, cartTotal, cartItemCount, navigateToCart } = useCartSaved();

  if (cartItems.length === 0) {
    return null;
  }

  const displayItems = cartItems.slice(0, maxItems);
  const remainingCount = cartItems.length - maxItems;

  return (
    <div className={cn('bg-white dark:bg-gray-900 rounded-lg border shadow-sm p-4', className)} data-testid="cart-preview">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <ShoppingCart className="h-4 w-4" aria-hidden="true" />
          Your Cart
        </h3>
        <span className="text-sm text-gray-500" data-testid="cart-item-count">
          {cartItemCount} {cartItemCount === 1 ? 'item' : 'items'}
        </span>
      </div>

      <div className="space-y-3">
        {displayItems.map((item) => (
          <div key={item.productId} className="flex items-center gap-3" data-testid={`cart-item-${item.productId}`}>
            {showImages && item.imageUrl && (
              <img
                src={item.imageUrl}
                alt={item.name}
                className="w-12 h-12 object-cover rounded"
                data-testid={`cart-item-image-${item.productId}`}
              />
            )}
            {showImages && !item.imageUrl && (
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center">
                <Package className="h-6 w-6 text-gray-400" aria-hidden="true" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{item.name}</p>
              <p className="text-xs text-gray-500">
                Qty: {item.quantity} × ${item.price.toFixed(2)}
              </p>
            </div>
            <p className="text-sm font-medium">${(item.quantity * item.price).toFixed(2)}</p>
          </div>
        ))}
      </div>

      {remainingCount > 0 && (
        <p className="text-sm text-gray-500 mt-3" data-testid="remaining-items-count">
          +{remainingCount} more {remainingCount === 1 ? 'item' : 'items'}
        </p>
      )}

      <div className="mt-4 pt-3 border-t flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">Total</p>
          <p className="text-lg font-semibold" data-testid="preview-cart-total">
            ${cartTotal.toFixed(2)}
          </p>
        </div>
        <Button onClick={navigateToCart} className="gap-1" data-testid="preview-view-cart-button">
          View Cart
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}

// ============================================================================
// Floating Cart Reminder Component
// ============================================================================

interface FloatingCartReminderProps {
  className?: string;
  position?: 'bottom-right' | 'bottom-left';
}

export function FloatingCartReminder({ className, position = 'bottom-right' }: FloatingCartReminderProps) {
  const { hasReturnedWithCart, cartItemCount, cartTotal, navigateToCart, isNotificationVisible } = useCartSaved();
  const [isExpanded, setIsExpanded] = useState(false);

  // Don't show if main notification is visible or no cart items
  if (isNotificationVisible || cartItemCount === 0 || !hasReturnedWithCart) {
    return null;
  }

  const positionClass = position === 'bottom-right' ? 'right-4' : 'left-4';

  return (
    <div className={cn('fixed bottom-4 z-40', positionClass, className)} data-testid="floating-cart-reminder">
      {isExpanded ? (
        <div
          className="bg-white dark:bg-gray-900 rounded-lg shadow-lg border p-4 w-64 animate-in zoom-in-95 duration-200"
          data-testid="floating-expanded"
        >
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-sm">Your Cart</h4>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Collapse"
              data-testid="collapse-button"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            {cartItemCount} {cartItemCount === 1 ? 'item' : 'items'} • ${cartTotal.toFixed(2)}
          </p>
          <Button size="sm" className="w-full" onClick={navigateToCart} data-testid="floating-view-cart-button">
            View Cart
          </Button>
        </div>
      ) : (
        <button
          onClick={() => setIsExpanded(true)}
          className="bg-primary text-primary-foreground rounded-full p-3 shadow-lg hover:bg-primary/90 transition-colors relative"
          aria-label={`View cart with ${cartItemCount} items`}
          data-testid="floating-collapsed"
        >
          <ShoppingCart className="h-6 w-6" />
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
            {cartItemCount > 99 ? '99+' : cartItemCount}
          </span>
        </button>
      )}
    </div>
  );
}

// ============================================================================
// Main Export Component
// ============================================================================

interface CartSavedNotificationProps {
  className?: string;
  variant?: 'toast' | 'banner' | 'floating';
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  bannerVariant?: 'default' | 'compact';
  showItemCount?: boolean;
  showTotal?: boolean;
  showTimestamp?: boolean;
  autoHideDuration?: number | null;
}

export function CartSavedNotification({
  className,
  variant = 'toast',
  position = 'bottom-right',
  bannerVariant = 'default',
  showItemCount = true,
  showTotal = true,
  showTimestamp = true,
  autoHideDuration = null,
}: CartSavedNotificationProps) {
  if (variant === 'banner') {
    return (
      <CartSavedBanner className={className} showItemCount={showItemCount} showTotal={showTotal} variant={bannerVariant} />
    );
  }

  if (variant === 'floating') {
    return (
      <FloatingCartReminder
        className={className}
        position={position === 'bottom-left' ? 'bottom-left' : 'bottom-right'}
      />
    );
  }

  return (
    <CartSavedToast
      className={className}
      position={position}
      showItemCount={showItemCount}
      showTotal={showTotal}
      showTimestamp={showTimestamp}
      autoHideDuration={autoHideDuration}
    />
  );
}
