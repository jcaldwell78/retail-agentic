import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { AdminSidebar } from '@/components/AdminSidebar';
import { SkipLinks } from '@/components/accessibility/SkipLink';
import { FocusTarget } from '@/components/accessibility/FocusManagement';

// Eager load critical pages
import DashboardPage from '@/pages/DashboardPage';
import LoginPage from '@/pages/LoginPage';

// Lazy load other pages for code splitting
const ProductsPage = lazy(() => import('@/pages/ProductsPage'));
const ProductCreatePage = lazy(() => import('@/pages/ProductCreatePage'));
const ProductEditPage = lazy(() => import('@/pages/ProductEditPage'));
const OrdersPage = lazy(() => import('@/pages/OrdersPage'));
const OrderDetailPage = lazy(() => import('@/pages/OrderDetailPage'));
const CustomersPage = lazy(() => import('@/pages/CustomersPage'));
const CustomerDetailPage = lazy(() => import('@/pages/CustomerDetailPage'));
const InventoryPage = lazy(() => import('@/pages/InventoryPage'));
const StoreSettingsPage = lazy(() => import('@/pages/StoreSettingsPage'));
const ThemeSettingsPage = lazy(() => import('@/pages/ThemeSettingsPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

// Loading fallback component
function PageLoader() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
        <p className="mt-2 text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

// Pages where sidebar should be hidden
const noSidebarRoutes = ['/login'];

function AppContent() {
  const location = useLocation();
  const showSidebar = !noSidebarRoutes.includes(location.pathname);

  const skipLinks = [
    { href: '#main-content', label: 'Skip to main content' },
    { href: '#sidebar', label: 'Skip to navigation' },
  ];

  if (!showSidebar) {
    return (
      <>
        <SkipLinks links={skipLinks} />
        <FocusTarget id="main-content" className="focus:outline-none">
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </FocusTarget>
      </>
    );
  }

  return (
    <>
      <SkipLinks links={skipLinks} />
      <div className="flex h-screen overflow-hidden">
        <AdminSidebar />
        <FocusTarget id="main-content" className="flex-1 overflow-y-auto bg-background focus:outline-none md:mt-0 mt-16">
          <main>
            <Suspense fallback={<PageLoader />}>
              <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/products/new" element={<ProductCreatePage />} />
            <Route path="/products/:id/edit" element={<ProductEditPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/orders/:id" element={<OrderDetailPage />} />
            <Route path="/customers" element={<CustomersPage />} />
            <Route path="/customers/:id" element={<CustomerDetailPage />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/settings" element={<StoreSettingsPage />} />
            <Route path="/settings/theme" element={<ThemeSettingsPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
          </main>
        </FocusTarget>
      </div>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
