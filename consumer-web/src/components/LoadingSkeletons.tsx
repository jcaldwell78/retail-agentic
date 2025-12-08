import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

/**
 * Product Card Skeleton - Loading state for product cards
 */
export function ProductCardSkeleton({ className }: SkeletonProps) {
  return (
    <Card className={cn('overflow-hidden', className)} data-testid="product-card-skeleton">
      {/* Product Image */}
      <Skeleton className="aspect-square w-full" data-testid="product-image-skeleton" />
      <CardContent className="p-4 space-y-3">
        {/* Product Title */}
        <Skeleton className="h-5 w-3/4" data-testid="product-title-skeleton" />
        {/* Product Price */}
        <Skeleton className="h-6 w-1/3" data-testid="product-price-skeleton" />
        {/* Rating */}
        <div className="flex items-center gap-1">
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-4 w-16" />
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Product Grid Skeleton - Loading state for product grid
 */
export function ProductGridSkeleton({
  count = 8,
  columns = 4,
  className,
}: SkeletonProps & { count?: number; columns?: number }) {
  return (
    <div
      className={cn(
        'grid gap-6',
        columns === 2 && 'grid-cols-2',
        columns === 3 && 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
        columns === 4 && 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
        className
      )}
      data-testid="product-grid-skeleton"
    >
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Product Detail Skeleton - Loading state for product detail page
 */
export function ProductDetailSkeleton({ className }: SkeletonProps) {
  return (
    <div className={cn('grid md:grid-cols-2 gap-8', className)} data-testid="product-detail-skeleton">
      {/* Image Gallery */}
      <div className="space-y-4">
        <Skeleton className="aspect-square w-full rounded-lg" data-testid="main-image-skeleton" />
        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="w-20 h-20 rounded-md" />
          ))}
        </div>
      </div>

      {/* Product Info */}
      <div className="space-y-6">
        {/* Title */}
        <div className="space-y-2">
          <Skeleton className="h-8 w-3/4" data-testid="detail-title-skeleton" />
          <Skeleton className="h-5 w-1/2" />
        </div>

        {/* Rating */}
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="w-5 h-5 rounded-full" />
            ))}
          </div>
          <Skeleton className="h-4 w-20" />
        </div>

        {/* Price */}
        <Skeleton className="h-10 w-32" data-testid="detail-price-skeleton" />

        {/* Description */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>

        {/* Size Selector */}
        <div className="space-y-2">
          <Skeleton className="h-5 w-24" />
          <div className="flex gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="w-12 h-10 rounded-md" />
            ))}
          </div>
        </div>

        {/* Add to Cart Button */}
        <Skeleton className="h-12 w-full rounded-lg" data-testid="add-to-cart-skeleton" />
      </div>
    </div>
  );
}

/**
 * Cart Item Skeleton - Loading state for cart items
 */
export function CartItemSkeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn('flex gap-4 p-4 border-b', className)}
      data-testid="cart-item-skeleton"
    >
      {/* Product Image */}
      <Skeleton className="w-24 h-24 rounded-md flex-shrink-0" />

      {/* Product Info */}
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-24" />
      </div>

      {/* Quantity & Price */}
      <div className="flex flex-col items-end gap-2">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-6 w-16" />
      </div>
    </div>
  );
}

/**
 * Cart Skeleton - Full cart loading state
 */
export function CartSkeleton({ itemCount = 3, className }: SkeletonProps & { itemCount?: number }) {
  return (
    <div className={cn('space-y-4', className)} data-testid="cart-skeleton">
      {/* Cart Items */}
      <div className="space-y-0">
        {Array.from({ length: itemCount }).map((_, i) => (
          <CartItemSkeleton key={i} />
        ))}
      </div>

      {/* Cart Summary */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="flex justify-between">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="flex justify-between pt-2 border-t">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-6 w-20" />
          </div>
          <Skeleton className="h-12 w-full rounded-lg" />
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Order Summary Skeleton - Loading state for order summary
 */
export function OrderSummarySkeleton({ className }: SkeletonProps) {
  return (
    <Card className={className} data-testid="order-summary-skeleton">
      <CardHeader>
        <Skeleton className="h-6 w-32" />
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Order Items */}
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="w-16 h-16 rounded-md" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/4" />
            </div>
          </div>
        ))}

        {/* Totals */}
        <div className="space-y-2 pt-4 border-t">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="flex justify-between">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-12" />
          </div>
          <div className="flex justify-between">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-14" />
          </div>
          <div className="flex justify-between pt-2 border-t">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-6 w-20" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Review Card Skeleton - Loading state for reviews
 */
export function ReviewCardSkeleton({ className }: SkeletonProps) {
  return (
    <div className={cn('p-4 border-b space-y-3', className)} data-testid="review-card-skeleton">
      {/* User Info */}
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-full" />
        <div className="space-y-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>

      {/* Rating */}
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="w-4 h-4 rounded-full" />
        ))}
      </div>

      {/* Review Content */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  );
}

/**
 * Reviews List Skeleton - Loading state for review list
 */
export function ReviewsListSkeleton({
  count = 3,
  className,
}: SkeletonProps & { count?: number }) {
  return (
    <div className={cn('space-y-0', className)} data-testid="reviews-list-skeleton">
      {Array.from({ length: count }).map((_, i) => (
        <ReviewCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * User Profile Skeleton - Loading state for user profile
 */
export function UserProfileSkeleton({ className }: SkeletonProps) {
  return (
    <div className={cn('space-y-6', className)} data-testid="user-profile-skeleton">
      {/* Avatar and Name */}
      <div className="flex items-center gap-4">
        <Skeleton className="w-20 h-20 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>

      {/* Profile Details */}
      <Card>
        <CardContent className="p-4 space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-32" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Order Card Skeleton - Loading state for order cards
 */
export function OrderCardSkeleton({ className }: SkeletonProps) {
  return (
    <Card className={className} data-testid="order-card-skeleton">
      <CardContent className="p-4 space-y-4">
        {/* Order Header */}
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>

        {/* Order Items */}
        <div className="flex gap-2 overflow-hidden">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="w-16 h-16 rounded-md flex-shrink-0" />
          ))}
        </div>

        {/* Order Footer */}
        <div className="flex justify-between items-center pt-2 border-t">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-9 w-28 rounded-md" />
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Orders List Skeleton - Loading state for order history
 */
export function OrdersListSkeleton({
  count = 3,
  className,
}: SkeletonProps & { count?: number }) {
  return (
    <div className={cn('space-y-4', className)} data-testid="orders-list-skeleton">
      {Array.from({ length: count }).map((_, i) => (
        <OrderCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Address Card Skeleton - Loading state for address cards
 */
export function AddressCardSkeleton({ className }: SkeletonProps) {
  return (
    <Card className={className} data-testid="address-card-skeleton">
      <CardContent className="p-4 space-y-3">
        <div className="flex justify-between">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <div className="space-y-1">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <div className="flex gap-2 pt-2">
          <Skeleton className="h-8 w-16 rounded-md" />
          <Skeleton className="h-8 w-16 rounded-md" />
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Category Card Skeleton - Loading state for category cards
 */
export function CategoryCardSkeleton({ className }: SkeletonProps) {
  return (
    <Card className={cn('overflow-hidden', className)} data-testid="category-card-skeleton">
      <Skeleton className="aspect-video w-full" />
      <CardContent className="p-4">
        <Skeleton className="h-5 w-3/4" />
      </CardContent>
    </Card>
  );
}

/**
 * Categories Grid Skeleton - Loading state for category grid
 */
export function CategoriesGridSkeleton({
  count = 6,
  className,
}: SkeletonProps & { count?: number }) {
  return (
    <div
      className={cn('grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4', className)}
      data-testid="categories-grid-skeleton"
    >
      {Array.from({ length: count }).map((_, i) => (
        <CategoryCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Banner Skeleton - Loading state for hero banners
 */
export function BannerSkeleton({ className }: SkeletonProps) {
  return (
    <Skeleton
      className={cn('w-full aspect-[3/1] rounded-lg', className)}
      data-testid="banner-skeleton"
    />
  );
}

/**
 * Notification Item Skeleton - Loading state for notifications
 */
export function NotificationItemSkeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn('flex gap-3 p-4 border-b', className)}
      data-testid="notification-item-skeleton"
    >
      <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-3 w-3/4" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
}

/**
 * Notifications List Skeleton - Loading state for notifications list
 */
export function NotificationsListSkeleton({
  count = 5,
  className,
}: SkeletonProps & { count?: number }) {
  return (
    <div className={className} data-testid="notifications-list-skeleton">
      {Array.from({ length: count }).map((_, i) => (
        <NotificationItemSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Search Results Skeleton - Loading state for search results
 */
export function SearchResultsSkeleton({
  count = 6,
  className,
}: SkeletonProps & { count?: number }) {
  return (
    <div className={cn('space-y-4', className)} data-testid="search-results-skeleton">
      {/* Search Info */}
      <div className="flex justify-between items-center">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-9 w-32 rounded-md" />
      </div>

      {/* Results Grid */}
      <ProductGridSkeleton count={count} columns={4} />
    </div>
  );
}

/**
 * Table Row Skeleton - Loading state for table rows
 */
export function TableRowSkeleton({
  columns = 4,
  className,
}: SkeletonProps & { columns?: number }) {
  return (
    <tr className={className} data-testid="table-row-skeleton">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="p-4">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  );
}

/**
 * Table Skeleton - Loading state for tables
 */
export function TableSkeleton({
  rows = 5,
  columns = 4,
  className,
}: SkeletonProps & { rows?: number; columns?: number }) {
  return (
    <div className={cn('overflow-x-auto', className)} data-testid="table-skeleton">
      <table className="w-full">
        <thead>
          <tr className="border-b bg-gray-50">
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="p-4 text-left">
                <Skeleton className="h-4 w-20" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <TableRowSkeleton key={i} columns={columns} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Text Block Skeleton - Loading state for text content
 */
export function TextBlockSkeleton({
  lines = 3,
  className,
}: SkeletonProps & { lines?: number }) {
  return (
    <div className={cn('space-y-2', className)} data-testid="text-block-skeleton">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-4"
          style={{ width: i === lines - 1 ? '75%' : '100%' }}
        />
      ))}
    </div>
  );
}

/**
 * Form Field Skeleton - Loading state for form fields
 */
export function FormFieldSkeleton({ className }: SkeletonProps) {
  return (
    <div className={cn('space-y-2', className)} data-testid="form-field-skeleton">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-10 w-full rounded-md" />
    </div>
  );
}

/**
 * Form Skeleton - Loading state for forms
 */
export function FormSkeleton({
  fields = 4,
  className,
}: SkeletonProps & { fields?: number }) {
  return (
    <div className={cn('space-y-4', className)} data-testid="form-skeleton">
      {Array.from({ length: fields }).map((_, i) => (
        <FormFieldSkeleton key={i} />
      ))}
      <Skeleton className="h-10 w-full rounded-md" />
    </div>
  );
}

/**
 * Checkout Skeleton - Loading state for checkout page
 */
export function CheckoutSkeleton({ className }: SkeletonProps) {
  return (
    <div className={cn('grid lg:grid-cols-3 gap-8', className)} data-testid="checkout-skeleton">
      {/* Main Content */}
      <div className="lg:col-span-2 space-y-6">
        {/* Shipping Address */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent>
            <FormSkeleton fields={5} />
          </CardContent>
        </Card>

        {/* Payment Method */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-36" />
          </CardHeader>
          <CardContent>
            <FormSkeleton fields={3} />
          </CardContent>
        </Card>
      </div>

      {/* Order Summary */}
      <div>
        <OrderSummarySkeleton />
      </div>
    </div>
  );
}

/**
 * Dashboard Skeleton - Loading state for dashboard pages
 */
export function DashboardSkeleton({ className }: SkeletonProps) {
  return (
    <div className={cn('space-y-6', className)} data-testid="dashboard-skeleton">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4 space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-28" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Table */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-36" />
        </CardHeader>
        <CardContent>
          <TableSkeleton rows={5} columns={5} />
        </CardContent>
      </Card>
    </div>
  );
}

export default {
  ProductCardSkeleton,
  ProductGridSkeleton,
  ProductDetailSkeleton,
  CartItemSkeleton,
  CartSkeleton,
  OrderSummarySkeleton,
  ReviewCardSkeleton,
  ReviewsListSkeleton,
  UserProfileSkeleton,
  OrderCardSkeleton,
  OrdersListSkeleton,
  AddressCardSkeleton,
  CategoryCardSkeleton,
  CategoriesGridSkeleton,
  BannerSkeleton,
  NotificationItemSkeleton,
  NotificationsListSkeleton,
  SearchResultsSkeleton,
  TableRowSkeleton,
  TableSkeleton,
  TextBlockSkeleton,
  FormFieldSkeleton,
  FormSkeleton,
  CheckoutSkeleton,
  DashboardSkeleton,
};
