import { useState, useEffect, useMemo } from 'react';
import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  XCircle,
  MapPin,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  orderTrackingApi,
  type OrderTrackingInfo,
  type OrderStatus,
  type StatusHistoryEntry,
} from '@/lib/api/orderTracking';

interface OrderTrackingTimelineProps {
  orderId?: string;
  orderNumber?: string;
  email?: string;
  className?: string;
  compact?: boolean;
}

/**
 * Status configuration for timeline display
 */
const STATUS_CONFIG: Record<
  OrderStatus,
  {
    label: string;
    icon: React.ElementType;
    color: string;
    bgColor: string;
    description: string;
  }
> = {
  PENDING: {
    label: 'Order Placed',
    icon: Clock,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    description: 'Your order has been received and is being reviewed',
  },
  PROCESSING: {
    label: 'Processing',
    icon: Package,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    description: 'Your order is being prepared for shipment',
  },
  SHIPPED: {
    label: 'Shipped',
    icon: Truck,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    description: 'Your order is on its way',
  },
  DELIVERED: {
    label: 'Delivered',
    icon: CheckCircle2,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    description: 'Your order has been delivered',
  },
  CANCELLED: {
    label: 'Cancelled',
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    description: 'Your order has been cancelled',
  },
};

/**
 * Order status flow (for timeline progression)
 */
const STATUS_FLOW: OrderStatus[] = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED'];

/**
 * Format date for display
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format time for display
 */
function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Format datetime for display
 */
function formatDateTime(dateString: string): string {
  return `${formatDate(dateString)} at ${formatTime(dateString)}`;
}

/**
 * Status step component for the timeline
 */
function TimelineStep({
  status,
  isActive,
  isCompleted,
  isCancelled,
  historyEntry,
  isLast,
}: {
  status: OrderStatus;
  isActive: boolean;
  isCompleted: boolean;
  isCancelled: boolean;
  historyEntry?: StatusHistoryEntry;
  isLast: boolean;
}) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  const getStepStyles = () => {
    if (isCancelled && status === 'CANCELLED') {
      return {
        icon: 'bg-red-100 text-red-600 border-red-600',
        line: 'bg-red-200',
        text: 'text-red-600',
      };
    }
    if (isCompleted) {
      return {
        icon: 'bg-green-100 text-green-600 border-green-600',
        line: 'bg-green-500',
        text: 'text-gray-900',
      };
    }
    if (isActive) {
      return {
        icon: `${config.bgColor} ${config.color} border-current`,
        line: 'bg-gray-200',
        text: config.color,
      };
    }
    return {
      icon: 'bg-gray-100 text-gray-400 border-gray-300',
      line: 'bg-gray-200',
      text: 'text-gray-400',
    };
  };

  const styles = getStepStyles();

  return (
    <div className="flex items-start" data-testid={`timeline-step-${status.toLowerCase()}`}>
      {/* Icon and connector line */}
      <div className="flex flex-col items-center mr-4">
        <div
          className={`w-10 h-10 rounded-full border-2 flex items-center justify-center ${styles.icon}`}
        >
          <Icon className="w-5 h-5" />
        </div>
        {!isLast && <div className={`w-0.5 h-16 mt-2 ${styles.line}`} />}
      </div>

      {/* Content */}
      <div className="flex-1 pb-8">
        <div className="flex items-center gap-2">
          <h4 className={`font-medium ${styles.text}`}>{config.label}</h4>
          {isActive && !isCompleted && (
            <Badge variant="secondary" className={`${config.bgColor} ${config.color} text-xs`}>
              Current
            </Badge>
          )}
        </div>
        <p className="text-sm text-gray-500 mt-1">{config.description}</p>
        {historyEntry && (
          <div className="mt-2">
            <p className="text-xs text-gray-500">{formatDateTime(historyEntry.timestamp)}</p>
            {historyEntry.note && (
              <p className="text-sm text-gray-600 mt-1">{historyEntry.note}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Shipping info card
 */
function ShippingInfoCard({
  tracking,
}: {
  tracking: OrderTrackingInfo;
}) {
  if (!tracking.carrier && !tracking.trackingNumber) {
    return null;
  }

  return (
    <div className="bg-gray-50 rounded-lg p-4 mb-6" data-testid="shipping-info-card">
      <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
        <Truck className="w-4 h-4" />
        Shipping Information
      </h3>
      <div className="space-y-2 text-sm">
        {tracking.carrier && (
          <div className="flex justify-between">
            <span className="text-gray-600">Carrier</span>
            <span className="font-medium">{tracking.carrier}</span>
          </div>
        )}
        {tracking.trackingNumber && (
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Tracking Number</span>
            <div className="flex items-center gap-2">
              <span className="font-mono font-medium">{tracking.trackingNumber}</span>
              {tracking.trackingUrl && (
                <a
                  href={tracking.trackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800"
                  aria-label="Track package on carrier website"
                  data-testid="tracking-link"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>
        )}
        {tracking.estimatedDeliveryDate && (
          <div className="flex justify-between">
            <span className="text-gray-600">Estimated Delivery</span>
            <span className="font-medium text-green-600">
              {formatDate(tracking.estimatedDeliveryDate)}
            </span>
          </div>
        )}
        {tracking.actualDeliveryDate && (
          <div className="flex justify-between">
            <span className="text-gray-600">Delivered On</span>
            <span className="font-medium text-green-600">
              {formatDateTime(tracking.actualDeliveryDate)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Compact timeline for order history pages
 */
function CompactTimeline({ tracking }: { tracking: OrderTrackingInfo }) {
  const currentStatusIndex = STATUS_FLOW.indexOf(tracking.status);
  const isCancelled = tracking.status === 'CANCELLED';

  return (
    <div className="flex items-center justify-between" data-testid="compact-timeline">
      {STATUS_FLOW.map((status, index) => {
        const config = STATUS_CONFIG[status];
        const Icon = config.icon;
        const isCompleted = !isCancelled && index < currentStatusIndex;
        const isActive = !isCancelled && index === currentStatusIndex;

        return (
          <div key={status} className="flex items-center flex-1 last:flex-none">
            {/* Step */}
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  isCompleted
                    ? 'bg-green-100 text-green-600'
                    : isActive
                      ? `${config.bgColor} ${config.color}`
                      : 'bg-gray-100 text-gray-400'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
              </div>
              <span
                className={`text-xs mt-1 ${
                  isActive ? config.color : isCompleted ? 'text-gray-600' : 'text-gray-400'
                }`}
              >
                {config.label}
              </span>
            </div>

            {/* Connector */}
            {index < STATUS_FLOW.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-2 ${
                  isCompleted ? 'bg-green-500' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        );
      })}

      {/* Show cancelled indicator if cancelled */}
      {isCancelled && (
        <div className="flex flex-col items-center ml-4">
          <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
            <XCircle className="w-4 h-4" />
          </div>
          <span className="text-xs mt-1 text-red-600">Cancelled</span>
        </div>
      )}
    </div>
  );
}

/**
 * Order Tracking Timeline Component
 */
export function OrderTrackingTimeline({
  orderId,
  orderNumber,
  email,
  className = '',
  compact = false,
}: OrderTrackingTimelineProps) {
  const [tracking, setTracking] = useState<OrderTrackingInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadTracking = async () => {
    try {
      let data: OrderTrackingInfo;
      if (orderId) {
        data = await orderTrackingApi.getTrackingInfo(orderId);
      } else if (orderNumber && email) {
        data = await orderTrackingApi.trackOrderByNumber(orderNumber, email);
      } else {
        throw new Error('Either orderId or orderNumber+email must be provided');
      }
      setTracking(data);
      setError(null);
    } catch (err) {
      console.error('Failed to load tracking info:', err);
      setError('Unable to load tracking information');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadTracking();
  }, [orderId, orderNumber, email]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadTracking();
  };

  // Build history map for quick lookup
  const historyMap = useMemo(() => {
    if (!tracking) return new Map<OrderStatus, StatusHistoryEntry>();
    const map = new Map<OrderStatus, StatusHistoryEntry>();
    tracking.statusHistory.forEach((entry) => {
      // Keep the most recent entry for each status
      if (!map.has(entry.status) || new Date(entry.timestamp) > new Date(map.get(entry.status)!.timestamp)) {
        map.set(entry.status, entry);
      }
    });
    return map;
  }, [tracking]);

  // Determine which statuses to show
  const statusesToShow = useMemo(() => {
    if (!tracking) return [];
    if (tracking.status === 'CANCELLED') {
      // Show statuses up to where it was cancelled, plus cancelled
      const completedStatuses = tracking.statusHistory
        .filter((h) => h.status !== 'CANCELLED')
        .map((h) => h.status);
      const uniqueStatuses = [...new Set(completedStatuses)];
      return [...uniqueStatuses, 'CANCELLED'] as OrderStatus[];
    }
    return STATUS_FLOW;
  }, [tracking]);

  if (isLoading) {
    return (
      <Card className={className} data-testid="order-tracking-loading">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-start">
                <Skeleton className="w-10 h-10 rounded-full mr-4" />
                <div className="flex-1">
                  <Skeleton className="h-5 w-32 mb-2" />
                  <Skeleton className="h-4 w-48" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !tracking) {
    return (
      <Card className={className} data-testid="order-tracking-error">
        <CardContent className="py-8 text-center">
          <XCircle className="w-12 h-12 mx-auto mb-3 text-red-400" />
          <p className="font-medium text-gray-900">Unable to load tracking</p>
          <p className="text-sm text-gray-500 mt-1">{error || 'Order not found'}</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  const currentStatusIndex = STATUS_FLOW.indexOf(tracking.status);
  const isCancelled = tracking.status === 'CANCELLED';

  if (compact) {
    return (
      <Card className={className} data-testid="order-tracking-compact">
        <CardContent className="py-4">
          <CompactTimeline tracking={tracking} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className} data-testid="order-tracking-timeline">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <MapPin className="w-5 h-5 text-gray-600" />
          <div>
            <CardTitle className="text-lg">Order Tracking</CardTitle>
            {tracking.orderNumber && (
              <p className="text-sm text-gray-500">Order #{tracking.orderNumber}</p>
            )}
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          aria-label="Refresh tracking"
          data-testid="refresh-tracking-button"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>

      <CardContent>
        {/* Shipping Info Card */}
        <ShippingInfoCard tracking={tracking} />

        {/* Timeline */}
        <div className="relative" data-testid="tracking-timeline">
          {statusesToShow.map((status, index) => {
            const isCompleted = !isCancelled && STATUS_FLOW.indexOf(status) < currentStatusIndex;
            const isActive =
              (isCancelled && status === 'CANCELLED') ||
              (!isCancelled && STATUS_FLOW.indexOf(status) === currentStatusIndex);

            return (
              <TimelineStep
                key={status}
                status={status}
                isActive={isActive}
                isCompleted={isCompleted}
                isCancelled={isCancelled}
                historyEntry={historyMap.get(status)}
                isLast={index === statusesToShow.length - 1}
              />
            );
          })}
        </div>

        {/* Last updated */}
        <div className="mt-4 pt-4 border-t text-xs text-gray-500 text-center">
          Last updated: {formatDateTime(tracking.lastUpdatedAt)}
        </div>
      </CardContent>
    </Card>
  );
}

export default OrderTrackingTimeline;
