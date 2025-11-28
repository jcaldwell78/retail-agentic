import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, X, Check, Package, DollarSign, AlertTriangle, Users, TrendingUp, Settings } from 'lucide-react';

export interface Notification {
  id: string;
  type: 'order' | 'inventory' | 'payment' | 'customer' | 'system' | 'alert';
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  isImportant: boolean;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: Record<string, any>;
}

interface NotificationCenterProps {
  maxDisplayed?: number;
  onNotificationClick?: (notification: Notification) => void;
  onMarkAsRead?: (notificationId: string) => void;
  onMarkAllAsRead?: () => void;
  onClearAll?: () => void;
}

export default function NotificationCenter({
  maxDisplayed = 5,
  onNotificationClick,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAll,
}: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'order',
      title: 'New Order Received',
      message: 'Order #12345 - $299.99 from John Doe',
      timestamp: new Date(Date.now() - 300000),
      isRead: false,
      isImportant: true,
      actionUrl: '/orders/12345',
      actionLabel: 'View Order',
    },
    {
      id: '2',
      type: 'inventory',
      title: 'Low Stock Alert',
      message: 'Wireless Headphones Pro - Only 5 units remaining',
      timestamp: new Date(Date.now() - 900000),
      isRead: false,
      isImportant: true,
      actionUrl: '/inventory',
      actionLabel: 'Restock',
    },
    {
      id: '3',
      type: 'payment',
      title: 'Payment Received',
      message: 'Payment of $599.99 confirmed for Order #12344',
      timestamp: new Date(Date.now() - 1800000),
      isRead: true,
      isImportant: false,
    },
    {
      id: '4',
      type: 'customer',
      title: 'New Customer Registration',
      message: 'Jane Smith just created an account',
      timestamp: new Date(Date.now() - 3600000),
      isRead: true,
      isImportant: false,
    },
    {
      id: '5',
      type: 'alert',
      title: 'System Alert',
      message: 'High traffic detected - Performance may be affected',
      timestamp: new Date(Date.now() - 7200000),
      isRead: false,
      isImportant: true,
    },
  ]);

  const [showOnlyUnread, setShowOnlyUnread] = useState(false);

  // Simulate real-time notifications
  useEffect(() => {
    const interval = setInterval(() => {
      // Randomly add new notifications (10% chance every 10 seconds)
      if (Math.random() < 0.1) {
        const newNotification: Notification = {
          id: `notif-${Date.now()}`,
          type: ['order', 'inventory', 'payment', 'customer'][Math.floor(Math.random() * 4)] as Notification['type'],
          title: 'New Activity',
          message: 'Something happened in your store',
          timestamp: new Date(),
          isRead: false,
          isImportant: Math.random() < 0.3,
        };
        setNotifications(prev => [newNotification, ...prev].slice(0, 50)); // Keep max 50
      }
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const importantUnreadCount = notifications.filter(n => !n.isRead && n.isImportant).length;

  const displayedNotifications = showOnlyUnread
    ? notifications.filter(n => !n.isRead)
    : notifications;

  const getNotificationIcon = (type: Notification['type']) => {
    const iconClass = "w-5 h-5";
    switch (type) {
      case 'order':
        return <Package className={`${iconClass} text-blue-600`} />;
      case 'inventory':
        return <AlertTriangle className={`${iconClass} text-orange-600`} />;
      case 'payment':
        return <DollarSign className={`${iconClass} text-green-600`} />;
      case 'customer':
        return <Users className={`${iconClass} text-purple-600`} />;
      case 'alert':
        return <AlertTriangle className={`${iconClass} text-red-600`} />;
      case 'system':
        return <Settings className={`${iconClass} text-gray-600`} />;
      default:
        return <Bell className={`${iconClass} text-gray-600`} />;
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      handleMarkAsRead(notification.id);
    }
    onNotificationClick?.(notification);
  };

  const handleMarkAsRead = (notificationId: string) => {
    setNotifications(notifications.map(n =>
      n.id === notificationId ? { ...n, isRead: true } : n
    ));
    onMarkAsRead?.(notificationId);
  };

  const handleMarkAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    onMarkAllAsRead?.();
  };

  const handleClearAll = () => {
    if (confirm('Are you sure you want to clear all notifications?')) {
      setNotifications([]);
      onClearAll?.();
    }
  };

  const formatTimestamp = (date: Date) => {
    const now = Date.now();
    const diff = now - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="relative" data-testid="notification-center">
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
        data-testid="notification-bell"
      >
        <Bell className="w-6 h-6 text-gray-700" />
        {unreadCount > 0 && (
          <span
            className={`absolute top-0 right-0 ${
              importantUnreadCount > 0 ? 'bg-red-600' : 'bg-blue-600'
            } text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center`}
            data-testid="unread-badge"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-96 max-h-[600px] bg-white rounded-lg shadow-xl border border-gray-200 z-50 flex flex-col"
          data-testid="notification-dropdown"
        >
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-lg">Notifications</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-100 rounded"
                data-testid="close-notifications"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center justify-between gap-2">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={showOnlyUnread}
                  onChange={(e) => setShowOnlyUnread(e.target.checked)}
                  className="rounded"
                  data-testid="filter-unread"
                />
                Show unread only
              </label>

              {unreadCount > 0 && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleMarkAllAsRead}
                  data-testid="mark-all-read"
                >
                  <Check className="w-4 h-4 mr-1" />
                  Mark all read
                </Button>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto">
            {displayedNotifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No notifications</p>
                <p className="text-sm text-gray-500 mt-1">
                  {showOnlyUnread ? 'All caught up!' : "You're all set"}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {displayedNotifications.slice(0, maxDisplayed).map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                      !notification.isRead ? 'bg-blue-50' : ''
                    } ${notification.isImportant ? 'border-l-4 border-l-red-500' : ''}`}
                    data-testid={`notification-${notification.id}`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className={`font-semibold text-sm ${
                            !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                          }`}>
                            {notification.title}
                          </h4>
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-1" />
                          )}
                        </div>

                        <p className="text-sm text-gray-600 mb-2">
                          {notification.message}
                        </p>

                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            {formatTimestamp(notification.timestamp)}
                          </span>

                          {notification.actionLabel && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-xs h-6 px-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleNotificationClick(notification);
                              }}
                            >
                              {notification.actionLabel}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 flex justify-between items-center">
              <span className="text-xs text-gray-600">
                {displayedNotifications.length} notification{displayedNotifications.length !== 1 ? 's' : ''}
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleClearAll}
                className="text-xs"
                data-testid="clear-all"
              >
                Clear all
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
