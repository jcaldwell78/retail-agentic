import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  BarChart3,
  Settings,
  Box,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const navItems = [
  {
    title: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
  },
  {
    title: 'Products',
    href: '/products',
    icon: Package,
  },
  {
    title: 'Orders',
    href: '/orders',
    icon: ShoppingCart,
  },
  {
    title: 'Customers',
    href: '/customers',
    icon: Users,
  },
  {
    title: 'Inventory',
    href: '/inventory',
    icon: Box,
  },
  {
    title: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
  },
];

export function AdminSidebar() {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const SidebarContent = ({ onNavigate }: { onNavigate?: () => void }) => (
    <>
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-6">
        <Link to="/" className="flex items-center space-x-2" onClick={onNavigate}>
          <LayoutDashboard className="h-6 w-6" />
          <span className="text-xl font-bold">Admin</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4" id="sidebar">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;

          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={onNavigate}
              className={cn(
                'flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.title}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t p-4">
        <div className="text-xs text-muted-foreground">
          Admin Portal v1.0.0
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 flex h-16 items-center justify-between border-b bg-background px-4">
        <Link to="/" className="flex items-center space-x-2">
          <LayoutDashboard className="h-6 w-6" />
          <span className="text-xl font-bold">Admin</span>
        </Link>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
        >
          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex h-screen w-64 flex-col border-r bg-background">
        <SidebarContent />
      </div>

      {/* Mobile Sidebar Drawer */}
      {isMobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          {/* Drawer */}
          <div className="fixed inset-y-0 left-0 w-64 bg-background z-50 shadow-lg md:hidden flex flex-col">
            <SidebarContent onNavigate={() => setIsMobileMenuOpen(false)} />
          </div>
        </>
      )}
    </>
  );
}
