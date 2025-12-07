import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import type { Product } from '@/lib/api/types';

interface RecentlyViewedProductsProps {
  /** Maximum number of products to display */
  limit?: number;
  /** Title for the section */
  title?: string;
  /** Whether to show the clear all button */
  showClearButton?: boolean;
  /** Whether to show remove buttons on individual items */
  showRemoveButtons?: boolean;
  /** CSS class for the container */
  className?: string;
  /** Callback when a product is clicked */
  onProductClick?: (product: Product) => void;
}

/**
 * Product card for recently viewed items
 */
function ProductCard({
  product,
  onRemove,
  showRemoveButton,
  onClick,
}: {
  product: Product;
  onRemove?: () => void;
  showRemoveButton?: boolean;
  onClick?: () => void;
}) {
  const handleRemove = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onRemove?.();
  };

  return (
    <Link
      to={`/products/${product.id}`}
      onClick={onClick}
      className="group block"
      aria-label={`View ${product.name}`}
    >
      <Card className="overflow-hidden hover:shadow-lg transition-all duration-200 relative h-full">
        {showRemoveButton && (
          <button
            onClick={handleRemove}
            className="absolute top-2 right-2 z-10 p-1.5 bg-white/90 hover:bg-white rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            aria-label={`Remove ${product.name} from recently viewed`}
          >
            <X className="h-4 w-4 text-gray-500 hover:text-gray-700" />
          </button>
        )}

        {/* Product Image */}
        <div className="aspect-square bg-gray-100 relative overflow-hidden">
          {product.images && product.images.length > 0 ? (
            <img
              src={product.images[0]}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl text-gray-300">
              <span aria-hidden="true">📦</span>
            </div>
          )}

          {/* Sale badge */}
          {product.compareAtPrice && product.compareAtPrice > product.price && (
            <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded">
              Sale
            </span>
          )}
        </div>

        {/* Product Info */}
        <CardContent className="p-3">
          <h3 className="font-medium text-sm line-clamp-2 mb-1 group-hover:text-blue-600 transition-colors">
            {product.name}
          </h3>

          <div className="flex items-center gap-2">
            <span className="font-bold text-sm">${product.price.toFixed(2)}</span>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span className="text-xs text-gray-400 line-through">
                ${product.compareAtPrice.toFixed(2)}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

/**
 * Loading skeleton for product cards
 */
function ProductCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="aspect-square w-full" />
      <CardContent className="p-3">
        <Skeleton className="h-4 w-3/4 mb-2" />
        <Skeleton className="h-4 w-1/2" />
      </CardContent>
    </Card>
  );
}

/**
 * Recently Viewed Products Section
 * Displays a horizontal scrollable list of recently viewed products
 */
export function RecentlyViewedProducts({
  limit = 10,
  title = 'Recently Viewed',
  showClearButton = true,
  showRemoveButtons = true,
  className = '',
  onProductClick,
}: RecentlyViewedProductsProps) {
  const { products, isLoading, remove, clear, count } = useRecentlyViewed({ limit });

  // Don't render if no products and not loading
  if (!isLoading && products.length === 0) {
    return null;
  }

  const handleRemove = async (productId: string) => {
    try {
      await remove(productId);
    } catch {
      // Error already logged in hook
    }
  };

  const handleClearAll = async () => {
    try {
      await clear();
    } catch {
      // Error already logged in hook
    }
  };

  return (
    <section
      className={`py-8 ${className}`}
      aria-label="Recently viewed products"
      data-testid="recently-viewed-section"
    >
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold" id="recently-viewed-title">
              {title}
            </h2>
            {count > 0 && (
              <p className="text-sm text-gray-500 mt-1">
                {count} {count === 1 ? 'item' : 'items'}
              </p>
            )}
          </div>

          {showClearButton && products.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              className="text-gray-500 hover:text-gray-700"
              aria-label="Clear all recently viewed products"
            >
              Clear All
            </Button>
          )}
        </div>

        {/* Products Grid */}
        <div
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
          role="list"
          aria-labelledby="recently-viewed-title"
        >
          {isLoading
            ? // Loading skeletons
              Array.from({ length: Math.min(limit, 6) }).map((_, index) => (
                <div key={index} role="listitem">
                  <ProductCardSkeleton />
                </div>
              ))
            : // Product cards
              products.map((product) => (
                <div key={product.id} role="listitem">
                  <ProductCard
                    product={product}
                    onRemove={() => handleRemove(product.id)}
                    showRemoveButton={showRemoveButtons}
                    onClick={() => onProductClick?.(product)}
                  />
                </div>
              ))}
        </div>

        {/* View All Link (if more products than shown) */}
        {count > products.length && (
          <div className="mt-6 text-center">
            <Link to="/account/recently-viewed">
              <Button variant="outline" size="sm">
                View All ({count})
              </Button>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

/**
 * Compact version for sidebar or smaller spaces
 */
export function RecentlyViewedCompact({
  limit = 4,
  className = '',
}: {
  limit?: number;
  className?: string;
}) {
  const { products, isLoading, remove } = useRecentlyViewed({ limit });

  if (!isLoading && products.length === 0) {
    return null;
  }

  return (
    <div className={className} data-testid="recently-viewed-compact">
      <h3 className="font-semibold text-sm mb-3 text-gray-700">Recently Viewed</h3>

      <div className="space-y-3">
        {isLoading
          ? Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="flex gap-3">
                <Skeleton className="w-16 h-16 rounded" />
                <div className="flex-1">
                  <Skeleton className="h-3 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))
          : products.map((product) => (
              <Link
                key={product.id}
                to={`/products/${product.id}`}
                className="flex gap-3 group"
              >
                <div className="w-16 h-16 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                  {product.images && product.images.length > 0 ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl text-gray-300">
                      📦
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium line-clamp-2 group-hover:text-blue-600 transition-colors">
                    {product.name}
                  </p>
                  <p className="text-sm font-bold mt-1">${product.price.toFixed(2)}</p>
                </div>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    remove(product.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-gray-600 transition-opacity"
                  aria-label={`Remove ${product.name}`}
                >
                  <X className="h-4 w-4" />
                </button>
              </Link>
            ))}
      </div>
    </div>
  );
}

export default RecentlyViewedProducts;
