import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { Eye, ShoppingCart, Users, Clock, TrendingUp, Star, Flame } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// Types
export interface ViewerData {
  productId: string;
  viewerCount: number;
  lastUpdated: Date;
}

export interface RecentPurchase {
  id: string;
  productId: string;
  productName: string;
  buyerLocation?: string;
  timeAgo: string;
  timestamp: Date;
}

export interface ProductPopularity {
  productId: string;
  purchaseCount: number;
  period: 'hour' | 'day' | 'week';
  trending: boolean;
}

export interface SocialProofConfig {
  showViewers?: boolean;
  showRecentPurchases?: boolean;
  showPopularity?: boolean;
  showRatings?: boolean;
  minViewersToShow?: number;
  purchaseUpdateInterval?: number;
  viewerUpdateInterval?: number;
}

// Context for global social proof data
interface SocialProofContextType {
  viewers: Map<string, ViewerData>;
  recentPurchases: RecentPurchase[];
  popularity: Map<string, ProductPopularity>;
  updateViewers: (productId: string, count: number) => void;
  addPurchase: (purchase: RecentPurchase) => void;
}

const SocialProofContext = createContext<SocialProofContextType | null>(null);

interface SocialProofProviderProps {
  children: React.ReactNode;
  initialViewers?: Map<string, ViewerData>;
  initialPurchases?: RecentPurchase[];
}

/**
 * Provider for social proof data
 */
export function SocialProofProvider({
  children,
  initialViewers = new Map(),
  initialPurchases = [],
}: SocialProofProviderProps) {
  const [viewers, setViewers] = useState<Map<string, ViewerData>>(initialViewers);
  const [recentPurchases, setRecentPurchases] = useState<RecentPurchase[]>(initialPurchases);
  const [popularity] = useState<Map<string, ProductPopularity>>(new Map());

  const updateViewers = useCallback((productId: string, count: number) => {
    setViewers(prev => {
      const next = new Map(prev);
      next.set(productId, {
        productId,
        viewerCount: count,
        lastUpdated: new Date(),
      });
      return next;
    });
  }, []);

  const addPurchase = useCallback((purchase: RecentPurchase) => {
    setRecentPurchases(prev => [purchase, ...prev].slice(0, 50));
  }, []);

  return (
    <SocialProofContext.Provider
      value={{
        viewers,
        recentPurchases,
        popularity,
        updateViewers,
        addPurchase,
      }}
    >
      {children}
    </SocialProofContext.Provider>
  );
}

/**
 * Hook to access social proof data
 */
export function useSocialProof() {
  const context = useContext(SocialProofContext);
  if (!context) {
    throw new Error('useSocialProof must be used within a SocialProofProvider');
  }
  return context;
}

interface LiveViewersProps {
  productId: string;
  viewerCount?: number;
  minToShow?: number;
  variant?: 'badge' | 'text' | 'compact';
  className?: string;
  animate?: boolean;
}

/**
 * Live Viewers Badge - Shows how many people are viewing a product
 */
export function LiveViewers({
  productId,
  viewerCount: externalCount,
  minToShow = 2,
  variant = 'badge',
  className,
  animate = true,
}: LiveViewersProps) {
  const [count, setCount] = useState(externalCount || 0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (externalCount !== undefined) {
      setCount(externalCount);
    }
  }, [externalCount]);

  useEffect(() => {
    if (animate && count >= minToShow) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 500);
      return () => clearTimeout(timer);
    }
  }, [count, animate, minToShow]);

  if (count < minToShow) {
    return null;
  }

  if (variant === 'text') {
    return (
      <span
        className={cn('text-sm text-gray-600 flex items-center gap-1', className)}
        data-testid={`live-viewers-${productId}`}
      >
        <Eye className="w-4 h-4" />
        {count} people viewing now
      </span>
    );
  }

  if (variant === 'compact') {
    return (
      <span
        className={cn('text-xs text-orange-600 flex items-center gap-1', className)}
        data-testid={`live-viewers-${productId}`}
      >
        <Eye className="w-3 h-3" />
        {count}
      </span>
    );
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        'bg-orange-50 text-orange-700 border-orange-200 flex items-center gap-1',
        isAnimating && 'animate-pulse',
        className
      )}
      data-testid={`live-viewers-${productId}`}
    >
      <Eye className="w-3 h-3" />
      <span className="font-medium">{count}</span> viewing
    </Badge>
  );
}

interface RecentPurchaseNotificationProps {
  purchase: RecentPurchase;
  onClose?: () => void;
  autoHide?: boolean;
  autoHideDelay?: number;
  className?: string;
}

/**
 * Recent Purchase Notification - Toast-style notification
 */
export function RecentPurchaseNotification({
  purchase,
  onClose,
  autoHide = true,
  autoHideDelay = 5000,
  className,
}: RecentPurchaseNotificationProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (autoHide) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onClose?.();
      }, autoHideDelay);
      return () => clearTimeout(timer);
    }
  }, [autoHide, autoHideDelay, onClose]);

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-4 bg-white rounded-lg shadow-lg border animate-in slide-in-from-bottom-2',
        className
      )}
      data-testid={`purchase-notification-${purchase.id}`}
    >
      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
        <ShoppingCart className="w-5 h-5 text-green-600" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-900" data-testid="purchase-product">
          {purchase.productName}
        </p>
        <p className="text-xs text-gray-500" data-testid="purchase-details">
          {purchase.buyerLocation && `Someone from ${purchase.buyerLocation} `}
          purchased {purchase.timeAgo}
        </p>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
          data-testid="close-notification"
        >
          &times;
        </button>
      )}
    </div>
  );
}

interface RecentPurchasesFeedProps {
  purchases: RecentPurchase[];
  limit?: number;
  className?: string;
}

/**
 * Recent Purchases Feed - Shows a list of recent purchases
 */
export function RecentPurchasesFeed({
  purchases,
  limit = 5,
  className,
}: RecentPurchasesFeedProps) {
  const displayPurchases = purchases.slice(0, limit);

  if (displayPurchases.length === 0) {
    return null;
  }

  return (
    <div className={cn('space-y-3', className)} data-testid="recent-purchases-feed">
      <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
        <Clock className="w-4 h-4" />
        Recent Activity
      </h4>
      <div className="space-y-2">
        {displayPurchases.map((purchase) => (
          <div
            key={purchase.id}
            className="flex items-center gap-3 text-sm"
            data-testid={`purchase-item-${purchase.id}`}
          >
            <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
              <ShoppingCart className="w-3 h-3 text-green-600" />
            </div>
            <span className="text-gray-600">
              {purchase.buyerLocation && (
                <span className="font-medium">{purchase.buyerLocation} - </span>
              )}
              <span data-testid="purchase-time">{purchase.timeAgo}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface PopularityBadgeProps {
  count: number;
  period: 'hour' | 'day' | 'week';
  trending?: boolean;
  variant?: 'badge' | 'text' | 'flame';
  className?: string;
}

/**
 * Popularity Badge - Shows purchase count in a period
 */
export function PopularityBadge({
  count,
  period,
  trending = false,
  variant = 'badge',
  className,
}: PopularityBadgeProps) {
  const periodText = {
    hour: 'in the last hour',
    day: 'today',
    week: 'this week',
  };

  if (count === 0) return null;

  if (variant === 'text') {
    return (
      <span
        className={cn('text-sm text-gray-600', className)}
        data-testid="popularity-text"
      >
        {count} sold {periodText[period]}
      </span>
    );
  }

  if (variant === 'flame') {
    return (
      <span
        className={cn(
          'flex items-center gap-1 text-sm font-medium',
          trending ? 'text-red-600' : 'text-orange-600',
          className
        )}
        data-testid="popularity-flame"
      >
        <Flame className="w-4 h-4" />
        {count} sold
      </span>
    );
  }

  return (
    <Badge
      variant="secondary"
      className={cn(
        'flex items-center gap-1',
        trending && 'bg-red-100 text-red-700',
        className
      )}
      data-testid="popularity-badge"
    >
      <TrendingUp className="w-3 h-3" />
      {count} sold {periodText[period]}
    </Badge>
  );
}

interface LowStockUrgencyProps {
  stockCount: number;
  threshold?: number;
  className?: string;
}

/**
 * Low Stock Urgency - Urgency indicator for low stock
 */
export function LowStockUrgency({
  stockCount,
  threshold = 10,
  className,
}: LowStockUrgencyProps) {
  if (stockCount <= 0 || stockCount > threshold) {
    return null;
  }

  const isVeryLow = stockCount <= 3;

  return (
    <span
      className={cn(
        'text-sm font-medium flex items-center gap-1',
        isVeryLow ? 'text-red-600' : 'text-orange-600',
        isVeryLow && 'animate-pulse',
        className
      )}
      data-testid="low-stock-urgency"
    >
      <Flame className="w-4 h-4" />
      Only {stockCount} left{isVeryLow ? '!' : ' in stock'}
    </span>
  );
}

interface RatingBadgeProps {
  rating: number;
  reviewCount?: number;
  variant?: 'stars' | 'compact' | 'full';
  className?: string;
}

/**
 * Rating Badge - Shows product rating
 */
export function RatingBadge({
  rating,
  reviewCount,
  variant = 'compact',
  className,
}: RatingBadgeProps) {
  const roundedRating = Math.round(rating * 10) / 10;

  if (variant === 'stars') {
    return (
      <div
        className={cn('flex items-center gap-1', className)}
        data-testid="rating-stars"
      >
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(
              'w-4 h-4',
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            )}
          />
        ))}
        {reviewCount !== undefined && (
          <span className="text-sm text-gray-500 ml-1">({reviewCount})</span>
        )}
      </div>
    );
  }

  if (variant === 'full') {
    return (
      <div
        className={cn('flex items-center gap-2', className)}
        data-testid="rating-full"
      >
        <div className="flex items-center gap-1">
          <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
          <span className="font-semibold">{roundedRating}</span>
        </div>
        {reviewCount !== undefined && (
          <span className="text-sm text-gray-500">
            ({reviewCount} review{reviewCount !== 1 ? 's' : ''})
          </span>
        )}
      </div>
    );
  }

  return (
    <span
      className={cn('flex items-center gap-1 text-sm', className)}
      data-testid="rating-compact"
    >
      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
      <span className="font-medium">{roundedRating}</span>
      {reviewCount !== undefined && (
        <span className="text-gray-500">({reviewCount})</span>
      )}
    </span>
  );
}

interface SocialProofWidgetProps {
  productId: string;
  viewerCount?: number;
  purchaseCount?: number;
  purchasePeriod?: 'hour' | 'day' | 'week';
  stockCount?: number;
  rating?: number;
  reviewCount?: number;
  config?: SocialProofConfig;
  className?: string;
}

/**
 * Social Proof Widget - Combined display of all social proof indicators
 */
export function SocialProofWidget({
  productId,
  viewerCount,
  purchaseCount,
  purchasePeriod = 'day',
  stockCount,
  rating,
  reviewCount,
  config = {},
  className,
}: SocialProofWidgetProps) {
  const {
    showViewers = true,
    showPopularity = true,
    showRatings = true,
    minViewersToShow = 2,
  } = config;

  const hasContent =
    (showViewers && viewerCount && viewerCount >= minViewersToShow) ||
    (showPopularity && purchaseCount && purchaseCount > 0) ||
    (stockCount !== undefined && stockCount > 0 && stockCount <= 10) ||
    (showRatings && rating !== undefined);

  if (!hasContent) {
    return null;
  }

  return (
    <div
      className={cn('flex flex-wrap items-center gap-3', className)}
      data-testid={`social-proof-widget-${productId}`}
    >
      {showViewers && viewerCount !== undefined && viewerCount >= minViewersToShow && (
        <LiveViewers productId={productId} viewerCount={viewerCount} minToShow={minViewersToShow} />
      )}
      {showPopularity && purchaseCount !== undefined && purchaseCount > 0 && (
        <PopularityBadge count={purchaseCount} period={purchasePeriod} />
      )}
      {stockCount !== undefined && stockCount > 0 && stockCount <= 10 && (
        <LowStockUrgency stockCount={stockCount} />
      )}
      {showRatings && rating !== undefined && (
        <RatingBadge rating={rating} reviewCount={reviewCount} />
      )}
    </div>
  );
}

interface SocialProofBannerProps {
  message: string;
  icon?: 'users' | 'trending' | 'fire' | 'star';
  variant?: 'info' | 'success' | 'warning';
  className?: string;
}

/**
 * Social Proof Banner - Full-width banner for social proof messaging
 */
export function SocialProofBanner({
  message,
  icon = 'users',
  variant = 'info',
  className,
}: SocialProofBannerProps) {
  const icons = {
    users: Users,
    trending: TrendingUp,
    fire: Flame,
    star: Star,
  };

  const variants = {
    info: 'bg-blue-50 text-blue-700 border-blue-200',
    success: 'bg-green-50 text-green-700 border-green-200',
    warning: 'bg-orange-50 text-orange-700 border-orange-200',
  };

  const Icon = icons[icon];

  return (
    <div
      className={cn(
        'flex items-center justify-center gap-2 py-2 px-4 border-b text-sm font-medium',
        variants[variant],
        className
      )}
      data-testid="social-proof-banner"
    >
      <Icon className="w-4 h-4" />
      {message}
    </div>
  );
}

/**
 * Hook to simulate live viewer updates
 */
export function useLiveViewers(
  productId: string,
  initialCount: number = 0,
  options: { minVariation?: number; maxVariation?: number; updateInterval?: number } = {}
) {
  const { minVariation = -2, maxVariation = 3, updateInterval = 10000 } = options;
  const [viewerCount, setViewerCount] = useState(initialCount);

  useEffect(() => {
    const interval = setInterval(() => {
      setViewerCount((prev) => {
        const change = Math.floor(Math.random() * (maxVariation - minVariation + 1)) + minVariation;
        return Math.max(0, prev + change);
      });
    }, updateInterval);

    return () => clearInterval(interval);
  }, [minVariation, maxVariation, updateInterval]);

  return { viewerCount, productId };
}

/**
 * Hook to generate fake recent purchases for demo
 */
export function useRecentPurchases(productId: string, productName: string) {
  const [purchases, setPurchases] = useState<RecentPurchase[]>([]);

  const locations = [
    'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix',
    'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose',
  ];

  const addPurchase = useCallback(() => {
    const id = `purchase-${Date.now()}`;
    const location = locations[Math.floor(Math.random() * locations.length)];

    const purchase: RecentPurchase = {
      id,
      productId,
      productName,
      buyerLocation: location,
      timeAgo: 'just now',
      timestamp: new Date(),
    };

    setPurchases((prev) => [purchase, ...prev].slice(0, 10));
  }, [productId, productName]);

  return { purchases, addPurchase };
}

export default SocialProofWidget;
