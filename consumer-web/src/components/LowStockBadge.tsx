import { AlertTriangle, Clock, XCircle, Flame } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface StockInfo {
  quantity: number;
  reservedQuantity?: number;
  lowStockThreshold?: number;
  trackInventory?: boolean;
  allowBackorder?: boolean;
}

interface LowStockBadgeProps {
  stock: StockInfo;
  className?: string;
  showCount?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Get available quantity after reservations
 */
function getAvailableQuantity(stock: StockInfo): number {
  return stock.quantity - (stock.reservedQuantity || 0);
}

/**
 * Determine stock status for display
 */
function getStockStatus(stock: StockInfo): {
  type: 'out-of-stock' | 'very-low' | 'low' | 'in-stock';
  label: string;
  icon: React.ElementType;
  colorClass: string;
  bgColorClass: string;
  urgency: 'high' | 'medium' | 'low' | 'none';
} {
  const available = getAvailableQuantity(stock);
  const threshold = stock.lowStockThreshold ?? 10;
  const trackInventory = stock.trackInventory ?? true;

  // Not tracking inventory - always in stock
  if (!trackInventory) {
    return {
      type: 'in-stock',
      label: 'In Stock',
      icon: Clock,
      colorClass: 'text-green-700',
      bgColorClass: 'bg-green-100 border-green-200',
      urgency: 'none',
    };
  }

  // Out of stock
  if (available <= 0) {
    if (stock.allowBackorder) {
      return {
        type: 'out-of-stock',
        label: 'Backordered',
        icon: Clock,
        colorClass: 'text-orange-700',
        bgColorClass: 'bg-orange-100 border-orange-200',
        urgency: 'medium',
      };
    }
    return {
      type: 'out-of-stock',
      label: 'Out of Stock',
      icon: XCircle,
      colorClass: 'text-red-700',
      bgColorClass: 'bg-red-100 border-red-200',
      urgency: 'high',
    };
  }

  // Very low stock (less than 5 or 50% of threshold)
  const veryLowThreshold = Math.min(5, Math.floor(threshold / 2));
  if (available <= veryLowThreshold) {
    return {
      type: 'very-low',
      label: `Only ${available} left!`,
      icon: Flame,
      colorClass: 'text-orange-700',
      bgColorClass: 'bg-orange-100 border-orange-200 animate-pulse',
      urgency: 'high',
    };
  }

  // Low stock
  if (available <= threshold) {
    return {
      type: 'low',
      label: `${available} left`,
      icon: AlertTriangle,
      colorClass: 'text-yellow-700',
      bgColorClass: 'bg-yellow-100 border-yellow-200',
      urgency: 'medium',
    };
  }

  // In stock
  return {
    type: 'in-stock',
    label: 'In Stock',
    icon: Clock,
    colorClass: 'text-green-700',
    bgColorClass: 'bg-green-100 border-green-200',
    urgency: 'none',
  };
}

const sizeClasses = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-1',
  lg: 'text-sm px-3 py-1.5',
};

const iconSizeClasses = {
  sm: 'w-3 h-3',
  md: 'w-4 h-4',
  lg: 'w-4 h-4',
};

/**
 * Low Stock Badge Component
 * Displays urgency indicators when products have low inventory
 */
export function LowStockBadge({
  stock,
  className,
  showCount = true,
  size = 'sm',
}: LowStockBadgeProps) {
  const status = getStockStatus(stock);
  const Icon = status.icon;

  // Don't show badge for normal in-stock items (optional display)
  if (status.type === 'in-stock') {
    return null;
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        'font-medium inline-flex items-center gap-1 border',
        sizeClasses[size],
        status.bgColorClass,
        status.colorClass,
        className
      )}
      data-testid="low-stock-badge"
      data-stock-status={status.type}
      data-urgency={status.urgency}
    >
      <Icon className={iconSizeClasses[size]} />
      <span>{showCount ? status.label : status.type === 'out-of-stock' ? 'Out of Stock' : 'Low Stock'}</span>
    </Badge>
  );
}

/**
 * Stock Status Indicator
 * Shows current stock status with optional quantity
 */
export function StockStatusIndicator({
  stock,
  className,
  showQuantity = false,
  size = 'md',
}: {
  stock: StockInfo;
  className?: string;
  showQuantity?: boolean;
  size?: 'sm' | 'md' | 'lg';
}) {
  const available = getAvailableQuantity(stock);
  const status = getStockStatus(stock);
  const Icon = status.icon;
  const trackInventory = stock.trackInventory ?? true;

  return (
    <div
      className={cn('flex items-center gap-2', className)}
      data-testid="stock-status-indicator"
    >
      <div className={cn('flex items-center gap-1', status.colorClass)}>
        <Icon className={iconSizeClasses[size]} />
        <span className={cn('font-medium', sizeClasses[size].split(' ')[0])}>
          {status.label}
        </span>
      </div>
      {showQuantity && trackInventory && status.type !== 'out-of-stock' && (
        <span className="text-gray-500 text-sm">({available} available)</span>
      )}
    </div>
  );
}

/**
 * Compact Low Stock Warning
 * Minimal inline warning for product listings
 */
export function LowStockWarning({
  stock,
  className,
}: {
  stock: StockInfo;
  className?: string;
}) {
  const status = getStockStatus(stock);

  if (status.urgency === 'none') {
    return null;
  }

  const urgencyMessages = {
    high: status.type === 'out-of-stock' ? 'Currently unavailable' : 'Selling fast - order soon!',
    medium: 'Limited availability',
    low: 'In stock',
    none: '',
  };

  return (
    <p
      className={cn(
        'text-sm flex items-center gap-1',
        status.colorClass,
        className
      )}
      data-testid="low-stock-warning"
    >
      {status.urgency === 'high' && <Flame className="w-4 h-4" />}
      {urgencyMessages[status.urgency]}
    </p>
  );
}

/**
 * Stock Progress Bar
 * Visual indicator of stock levels
 */
export function StockProgressBar({
  stock,
  className,
  maxDisplay = 100,
}: {
  stock: StockInfo;
  className?: string;
  maxDisplay?: number;
}) {
  const available = getAvailableQuantity(stock);
  const threshold = stock.lowStockThreshold ?? 10;
  const trackInventory = stock.trackInventory ?? true;

  if (!trackInventory) {
    return null;
  }

  // Calculate percentage (cap at maxDisplay for visual purposes)
  const percentage = Math.min((available / maxDisplay) * 100, 100);

  // Determine color based on stock level
  let barColor = 'bg-green-500';
  if (available <= 0) {
    barColor = 'bg-red-500';
  } else if (available <= Math.min(5, threshold / 2)) {
    barColor = 'bg-orange-500';
  } else if (available <= threshold) {
    barColor = 'bg-yellow-500';
  }

  return (
    <div className={cn('w-full', className)} data-testid="stock-progress-bar">
      <div className="flex justify-between text-xs text-gray-600 mb-1">
        <span>Stock Level</span>
        <span>{available} units</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={cn('h-full transition-all duration-300', barColor)}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={available}
          aria-valuemin={0}
          aria-valuemax={maxDisplay}
        />
      </div>
    </div>
  );
}

export default LowStockBadge;
