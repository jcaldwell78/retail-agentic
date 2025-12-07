import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingCart,
  Heart,
  Package,
  Search,
  FileText,
  CreditCard,
  MapPin,
  Bell,
  Users,
  Star,
  MessageSquare,
  Inbox,
  Calendar,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type EmptyStateType =
  | 'cart'
  | 'wishlist'
  | 'orders'
  | 'search'
  | 'products'
  | 'payment-methods'
  | 'addresses'
  | 'notifications'
  | 'reviews'
  | 'questions'
  | 'messages'
  | 'favorites'
  | 'history'
  | 'custom';

interface EmptyStateConfig {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionPath?: string;
  secondaryLabel?: string;
  secondaryPath?: string;
}

const EMPTY_STATE_CONFIG: Record<Exclude<EmptyStateType, 'custom'>, EmptyStateConfig> = {
  cart: {
    icon: ShoppingCart,
    title: 'Your cart is empty',
    description: "Looks like you haven't added any items to your cart yet. Start shopping to fill it up!",
    actionLabel: 'Start Shopping',
    actionPath: '/products',
  },
  wishlist: {
    icon: Heart,
    title: 'Your wishlist is empty',
    description: "Save items you love by clicking the heart icon. They'll appear here for easy access.",
    actionLabel: 'Discover Products',
    actionPath: '/products',
  },
  orders: {
    icon: Package,
    title: 'No orders yet',
    description: "You haven't placed any orders yet. Once you do, they'll show up here.",
    actionLabel: 'Start Shopping',
    actionPath: '/products',
  },
  search: {
    icon: Search,
    title: 'No results found',
    description: "We couldn't find any products matching your search. Try adjusting your filters or search terms.",
    actionLabel: 'Clear Filters',
  },
  products: {
    icon: FileText,
    title: 'No products available',
    description: 'There are no products in this category at the moment. Check back later!',
    actionLabel: 'Browse All Products',
    actionPath: '/products',
  },
  'payment-methods': {
    icon: CreditCard,
    title: 'No payment methods',
    description: "You haven't saved any payment methods yet. Add one for faster checkout.",
    actionLabel: 'Add Payment Method',
  },
  addresses: {
    icon: MapPin,
    title: 'No saved addresses',
    description: "You don't have any saved addresses. Add one for faster shipping.",
    actionLabel: 'Add Address',
  },
  notifications: {
    icon: Bell,
    title: 'No notifications',
    description: "You're all caught up! Check back later for updates on your orders and deals.",
  },
  reviews: {
    icon: Star,
    title: 'No reviews yet',
    description: 'Be the first to review this product and help other shoppers!',
    actionLabel: 'Write a Review',
  },
  questions: {
    icon: MessageSquare,
    title: 'No questions yet',
    description: 'Have a question about this product? Be the first to ask!',
    actionLabel: 'Ask a Question',
  },
  messages: {
    icon: Inbox,
    title: 'No messages',
    description: "You don't have any messages yet. Start a conversation!",
  },
  favorites: {
    icon: Heart,
    title: 'No favorites',
    description: "You haven't favorited any items. Click the heart icon to save your favorites.",
    actionLabel: 'Browse Products',
    actionPath: '/products',
  },
  history: {
    icon: Calendar,
    title: 'No browsing history',
    description: 'Your recently viewed products will appear here.',
    actionLabel: 'Start Browsing',
    actionPath: '/products',
  },
};

interface EmptyStateProps {
  type: EmptyStateType;
  title?: string;
  description?: string;
  icon?: LucideIcon;
  actionLabel?: string;
  actionPath?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  secondaryPath?: string;
  onSecondaryAction?: () => void;
  children?: ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  illustration?: ReactNode;
}

/**
 * SVG Illustrations for empty states
 */
function CartIllustration({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 200 150"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      data-testid="cart-illustration"
    >
      <rect x="40" y="40" width="120" height="80" rx="8" fill="#E5E7EB" />
      <rect x="50" y="55" width="100" height="50" rx="4" fill="white" />
      <circle cx="70" cy="130" r="10" fill="#9CA3AF" />
      <circle cx="130" cy="130" r="10" fill="#9CA3AF" />
      <path d="M25 30 L40 40 L40 120 L160 120 L175 30" stroke="#6B7280" strokeWidth="3" fill="none" />
      <line x1="60" y1="70" x2="140" y2="70" stroke="#E5E7EB" strokeWidth="2" />
      <line x1="60" y1="85" x2="120" y2="85" stroke="#E5E7EB" strokeWidth="2" />
    </svg>
  );
}

function WishlistIllustration({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 200 150"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      data-testid="wishlist-illustration"
    >
      <path
        d="M100 130 C50 90 20 60 50 35 C80 10 100 40 100 40 C100 40 120 10 150 35 C180 60 150 90 100 130Z"
        fill="#FEE2E2"
        stroke="#F87171"
        strokeWidth="3"
      />
      <circle cx="80" cy="55" r="8" fill="white" opacity="0.6" />
    </svg>
  );
}

function OrdersIllustration({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 200 150"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      data-testid="orders-illustration"
    >
      <rect x="50" y="30" width="100" height="100" rx="8" fill="#E5E7EB" />
      <rect x="60" y="50" width="80" height="10" rx="2" fill="#9CA3AF" />
      <rect x="60" y="70" width="60" height="10" rx="2" fill="#D1D5DB" />
      <rect x="60" y="90" width="70" height="10" rx="2" fill="#D1D5DB" />
      <rect x="60" y="110" width="40" height="10" rx="2" fill="#D1D5DB" />
      <path d="M130 40 L150 20 L180 50 L150 50 Z" fill="#6B7280" />
    </svg>
  );
}

function SearchIllustration({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 200 150"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      data-testid="search-illustration"
    >
      <circle cx="85" cy="65" r="45" fill="#E5E7EB" stroke="#9CA3AF" strokeWidth="4" />
      <circle cx="85" cy="65" r="25" fill="white" />
      <line x1="118" y1="98" x2="155" y2="135" stroke="#6B7280" strokeWidth="8" strokeLinecap="round" />
      <path d="M75 55 Q85 70 95 55" stroke="#D1D5DB" strokeWidth="2" fill="none" />
      <circle cx="75" cy="60" r="3" fill="#D1D5DB" />
      <circle cx="95" cy="60" r="3" fill="#D1D5DB" />
    </svg>
  );
}

function NotificationsIllustration({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 200 150"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      data-testid="notifications-illustration"
    >
      <path
        d="M100 20 C60 20 40 50 40 80 L40 100 L30 110 L170 110 L160 100 L160 80 C160 50 140 20 100 20Z"
        fill="#E5E7EB"
        stroke="#9CA3AF"
        strokeWidth="3"
      />
      <ellipse cx="100" cy="125" rx="15" ry="10" fill="#9CA3AF" />
      <circle cx="100" cy="20" r="5" fill="#9CA3AF" />
    </svg>
  );
}

function DefaultIllustration({ icon: Icon, className }: { icon: LucideIcon; className?: string }) {
  return (
    <div className={cn('flex items-center justify-center', className)} data-testid="default-illustration">
      <div className="rounded-full bg-gray-100 p-6">
        <Icon className="w-16 h-16 text-gray-400" />
      </div>
    </div>
  );
}

function getIllustration(type: EmptyStateType, icon: LucideIcon, size: 'sm' | 'md' | 'lg') {
  const sizeClasses = {
    sm: 'w-24 h-24',
    md: 'w-32 h-32',
    lg: 'w-48 h-48',
  };

  const illustrationClass = sizeClasses[size];

  switch (type) {
    case 'cart':
      return <CartIllustration className={illustrationClass} />;
    case 'wishlist':
    case 'favorites':
      return <WishlistIllustration className={illustrationClass} />;
    case 'orders':
      return <OrdersIllustration className={illustrationClass} />;
    case 'search':
    case 'products':
      return <SearchIllustration className={illustrationClass} />;
    case 'notifications':
      return <NotificationsIllustration className={illustrationClass} />;
    default:
      return <DefaultIllustration icon={icon} className={illustrationClass} />;
  }
}

/**
 * Empty State Component
 * Displays a message with illustration when content is empty
 */
export function EmptyState({
  type,
  title,
  description,
  icon,
  actionLabel,
  actionPath,
  onAction,
  secondaryLabel,
  secondaryPath,
  onSecondaryAction,
  children,
  className,
  size = 'md',
  illustration,
}: EmptyStateProps) {
  // Get config for non-custom types
  const config = type !== 'custom' ? EMPTY_STATE_CONFIG[type] : null;

  // Merge props with config (props take precedence)
  const finalIcon = icon || config?.icon || FileText;
  const finalTitle = title || config?.title || 'Nothing here';
  const finalDescription = description || config?.description || '';
  const finalActionLabel = actionLabel || config?.actionLabel;
  const finalActionPath = actionPath || config?.actionPath;
  const finalSecondaryLabel = secondaryLabel || config?.secondaryLabel;
  const finalSecondaryPath = secondaryPath || config?.secondaryPath;

  const sizeClasses = {
    sm: {
      container: 'py-8 px-4',
      title: 'text-lg',
      description: 'text-sm',
      button: 'h-9 text-sm',
    },
    md: {
      container: 'py-12 px-6',
      title: 'text-xl',
      description: 'text-base',
      button: 'h-10',
    },
    lg: {
      container: 'py-16 px-8',
      title: 'text-2xl',
      description: 'text-lg',
      button: 'h-11 text-lg px-6',
    },
  };

  const styles = sizeClasses[size];

  const renderActionButton = () => {
    if (!finalActionLabel) return null;

    if (finalActionPath) {
      return (
        <Button asChild className={styles.button} data-testid="empty-state-action">
          <Link to={finalActionPath}>{finalActionLabel}</Link>
        </Button>
      );
    }

    if (onAction) {
      return (
        <Button onClick={onAction} className={styles.button} data-testid="empty-state-action">
          {finalActionLabel}
        </Button>
      );
    }

    return null;
  };

  const renderSecondaryButton = () => {
    if (!finalSecondaryLabel) return null;

    if (finalSecondaryPath) {
      return (
        <Button variant="outline" asChild className={styles.button} data-testid="empty-state-secondary">
          <Link to={finalSecondaryPath}>{finalSecondaryLabel}</Link>
        </Button>
      );
    }

    if (onSecondaryAction) {
      return (
        <Button variant="outline" onClick={onSecondaryAction} className={styles.button} data-testid="empty-state-secondary">
          {finalSecondaryLabel}
        </Button>
      );
    }

    return null;
  };

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        styles.container,
        className
      )}
      data-testid={`empty-state-${type}`}
    >
      {/* Illustration */}
      <div className="mb-6">
        {illustration || getIllustration(type, finalIcon, size)}
      </div>

      {/* Title */}
      <h3 className={cn('font-semibold text-gray-900 mb-2', styles.title)}>
        {finalTitle}
      </h3>

      {/* Description */}
      {finalDescription && (
        <p className={cn('text-gray-500 max-w-md mb-6', styles.description)}>
          {finalDescription}
        </p>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        {renderActionButton()}
        {renderSecondaryButton()}
      </div>

      {/* Custom content */}
      {children && <div className="mt-6">{children}</div>}
    </div>
  );
}

/**
 * Empty Cart State
 */
export function EmptyCart({ className, ...props }: Omit<EmptyStateProps, 'type'>) {
  return <EmptyState type="cart" className={className} {...props} />;
}

/**
 * Empty Wishlist State
 */
export function EmptyWishlist({ className, ...props }: Omit<EmptyStateProps, 'type'>) {
  return <EmptyState type="wishlist" className={className} {...props} />;
}

/**
 * Empty Orders State
 */
export function EmptyOrders({ className, ...props }: Omit<EmptyStateProps, 'type'>) {
  return <EmptyState type="orders" className={className} {...props} />;
}

/**
 * No Search Results State
 */
export function NoSearchResults({
  query,
  className,
  ...props
}: Omit<EmptyStateProps, 'type'> & { query?: string }) {
  return (
    <EmptyState
      type="search"
      title={query ? `No results for "${query}"` : 'No results found'}
      className={className}
      {...props}
    />
  );
}

/**
 * Empty Notifications State
 */
export function EmptyNotifications({ className, ...props }: Omit<EmptyStateProps, 'type'>) {
  return <EmptyState type="notifications" className={className} {...props} />;
}

/**
 * Empty Reviews State
 */
export function EmptyReviews({ className, ...props }: Omit<EmptyStateProps, 'type'>) {
  return <EmptyState type="reviews" className={className} {...props} />;
}

/**
 * Empty Questions State
 */
export function EmptyQuestions({ className, ...props }: Omit<EmptyStateProps, 'type'>) {
  return <EmptyState type="questions" className={className} {...props} />;
}

export default EmptyState;
