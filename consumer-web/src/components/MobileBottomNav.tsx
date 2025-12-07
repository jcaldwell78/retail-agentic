import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  Search,
  ShoppingCart,
  Heart,
  User,
  Menu,
  Grid,
  Package,
  Settings,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type NavItem = {
  id: string;
  label: string;
  icon: React.ElementType;
  path: string;
  badge?: number;
  showBadge?: boolean;
};

const DEFAULT_NAV_ITEMS: NavItem[] = [
  { id: 'home', label: 'Home', icon: Home, path: '/' },
  { id: 'categories', label: 'Categories', icon: Grid, path: '/products' },
  { id: 'cart', label: 'Cart', icon: ShoppingCart, path: '/cart', showBadge: true },
  { id: 'wishlist', label: 'Wishlist', icon: Heart, path: '/wishlist' },
  { id: 'account', label: 'Account', icon: User, path: '/profile' },
];

interface MobileBottomNavProps {
  items?: NavItem[];
  cartItemCount?: number;
  className?: string;
  hideOnScroll?: boolean;
}

/**
 * Hook to detect scroll direction
 */
function useScrollDirection() {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollingDown = currentScrollY > lastScrollY;
      const scrollDelta = Math.abs(currentScrollY - lastScrollY);

      // Only trigger if scrolling more than 10px
      if (scrollDelta > 10) {
        setIsVisible(!scrollingDown || currentScrollY < 50);
        setLastScrollY(currentScrollY);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return isVisible;
}

/**
 * Single navigation item
 */
function NavItemButton({
  item,
  isActive,
  badgeCount,
}: {
  item: NavItem;
  isActive: boolean;
  badgeCount?: number;
}) {
  const Icon = item.icon;

  return (
    <Link
      to={item.path}
      className={cn(
        'flex flex-col items-center justify-center flex-1 py-2 px-1 min-w-[64px]',
        'transition-colors duration-200',
        isActive
          ? 'text-blue-600'
          : 'text-gray-500 hover:text-gray-700'
      )}
      data-testid={`nav-item-${item.id}`}
      aria-current={isActive ? 'page' : undefined}
    >
      <div className="relative">
        <Icon className={cn('w-6 h-6', isActive && 'stroke-[2.5px]')} />
        {item.showBadge && badgeCount !== undefined && badgeCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-2 -right-2 h-5 min-w-[20px] px-1.5 text-xs flex items-center justify-center"
            data-testid={`nav-badge-${item.id}`}
          >
            {badgeCount > 99 ? '99+' : badgeCount}
          </Badge>
        )}
      </div>
      <span className={cn('text-xs mt-1', isActive && 'font-medium')}>
        {item.label}
      </span>
    </Link>
  );
}

/**
 * Mobile Bottom Navigation Bar
 */
export function MobileBottomNav({
  items = DEFAULT_NAV_ITEMS,
  cartItemCount = 0,
  className,
  hideOnScroll = false,
}: MobileBottomNavProps) {
  const location = useLocation();
  const isVisible = useScrollDirection();

  // Determine if path matches (handle root path specially)
  const isPathActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50',
        'bg-white border-t border-gray-200 shadow-lg',
        'md:hidden', // Only show on mobile
        'transition-transform duration-300',
        hideOnScroll && !isVisible && 'translate-y-full',
        className
      )}
      data-testid="mobile-bottom-nav"
      role="navigation"
      aria-label="Mobile navigation"
    >
      <div className="flex items-center justify-around max-w-lg mx-auto safe-area-inset-bottom">
        {items.map((item) => (
          <NavItemButton
            key={item.id}
            item={item}
            isActive={isPathActive(item.path)}
            badgeCount={item.id === 'cart' ? cartItemCount : item.badge}
          />
        ))}
      </div>
    </nav>
  );
}

/**
 * Spacer component to prevent content from being hidden behind the nav
 */
export function MobileBottomNavSpacer({ className }: { className?: string }) {
  return (
    <div
      className={cn('h-16 md:hidden', className)}
      aria-hidden="true"
      data-testid="mobile-nav-spacer"
    />
  );
}

/**
 * Expanded mobile menu with more options
 */
export function MobileExpandedNav({
  isOpen,
  onClose,
  className,
}: {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}) {
  const menuItems = [
    { id: 'orders', label: 'My Orders', icon: Package, path: '/orders' },
    { id: 'wishlist', label: 'Wishlist', icon: Heart, path: '/wishlist' },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
  ];

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 md:hidden"
        onClick={onClose}
        aria-hidden="true"
        data-testid="mobile-nav-backdrop"
      />

      {/* Menu panel */}
      <div
        className={cn(
          'fixed bottom-16 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-xl',
          'p-4 md:hidden animate-in slide-in-from-bottom duration-300',
          className
        )}
        data-testid="mobile-expanded-nav"
        role="menu"
      >
        <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
        <div className="grid grid-cols-3 gap-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.id}
                to={item.path}
                onClick={onClose}
                className="flex flex-col items-center p-3 rounded-lg hover:bg-gray-100 transition-colors"
                role="menuitem"
                data-testid={`expanded-nav-${item.id}`}
              >
                <Icon className="w-6 h-6 text-gray-600 mb-1" />
                <span className="text-sm text-gray-700">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}

/**
 * Hook to use mobile navigation with cart count
 */
export function useMobileNav() {
  // This could be connected to cart store in a real implementation
  const [cartItemCount, setCartItemCount] = useState(0);

  return {
    cartItemCount,
    setCartItemCount,
  };
}

export default MobileBottomNav;
