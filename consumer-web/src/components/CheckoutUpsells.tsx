import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  ReactNode,
  useEffect,
} from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// Types
export interface UpsellProduct {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  rating?: number;
  reviewCount?: number;
  badge?: string;
  inStock?: boolean;
}

export interface ProductBundle {
  id: string;
  name: string;
  products: UpsellProduct[];
  bundlePrice: number;
  regularPrice: number;
  savings: number;
  savingsPercent: number;
}

export interface UpsellsState {
  frequentlyBoughtTogether: UpsellProduct[];
  recommendedAddons: UpsellProduct[];
  bundles: ProductBundle[];
  selectedProducts: string[];
  isLoading: boolean;
}

export interface UpsellsContextType extends UpsellsState {
  toggleProduct: (productId: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  addSelectedToCart: () => void;
  addBundleToCart: (bundleId: string) => void;
  getTotalPrice: () => number;
  getTotalSavings: () => number;
  isProductSelected: (productId: string) => boolean;
}

// Context
const UpsellsContext = createContext<UpsellsContextType | null>(null);

export function useUpsells(): UpsellsContextType {
  const context = useContext(UpsellsContext);
  if (!context) {
    throw new Error('useUpsells must be used within an UpsellsProvider');
  }
  return context;
}

// Provider
export interface UpsellsProviderProps {
  children: ReactNode;
  frequentlyBoughtTogether?: UpsellProduct[];
  recommendedAddons?: UpsellProduct[];
  bundles?: ProductBundle[];
  onAddToCart?: (productIds: string[]) => void;
  onAddBundleToCart?: (bundleId: string) => void;
  isLoading?: boolean;
}

export function UpsellsProvider({
  children,
  frequentlyBoughtTogether = [],
  recommendedAddons = [],
  bundles = [],
  onAddToCart,
  onAddBundleToCart,
  isLoading = false,
}: UpsellsProviderProps) {
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  const toggleProduct = useCallback((productId: string) => {
    setSelectedProducts((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  }, []);

  const selectAll = useCallback(() => {
    const allIds = frequentlyBoughtTogether.map((p) => p.id);
    setSelectedProducts(allIds);
  }, [frequentlyBoughtTogether]);

  const clearSelection = useCallback(() => {
    setSelectedProducts([]);
  }, []);

  const addSelectedToCart = useCallback(() => {
    if (selectedProducts.length > 0) {
      onAddToCart?.(selectedProducts);
    }
  }, [selectedProducts, onAddToCart]);

  const addBundleToCart = useCallback(
    (bundleId: string) => {
      onAddBundleToCart?.(bundleId);
    },
    [onAddBundleToCart]
  );

  const getTotalPrice = useCallback(() => {
    return frequentlyBoughtTogether
      .filter((p) => selectedProducts.includes(p.id))
      .reduce((sum, p) => sum + p.price, 0);
  }, [frequentlyBoughtTogether, selectedProducts]);

  const getTotalSavings = useCallback(() => {
    return frequentlyBoughtTogether
      .filter((p) => selectedProducts.includes(p.id))
      .reduce((sum, p) => sum + ((p.originalPrice || p.price) - p.price), 0);
  }, [frequentlyBoughtTogether, selectedProducts]);

  const isProductSelected = useCallback(
    (productId: string) => selectedProducts.includes(productId),
    [selectedProducts]
  );

  const value: UpsellsContextType = {
    frequentlyBoughtTogether,
    recommendedAddons,
    bundles,
    selectedProducts,
    isLoading,
    toggleProduct,
    selectAll,
    clearSelection,
    addSelectedToCart,
    addBundleToCart,
    getTotalPrice,
    getTotalSavings,
    isProductSelected,
  };

  return <UpsellsContext.Provider value={value}>{children}</UpsellsContext.Provider>;
}

// Components

// Product Card for upsells
export interface UpsellProductCardProps {
  product: UpsellProduct;
  selectable?: boolean;
  selected?: boolean;
  onSelect?: () => void;
  onAddToCart?: () => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function UpsellProductCard({
  product,
  selectable = false,
  selected = false,
  onSelect,
  onAddToCart,
  size = 'md',
  className,
}: UpsellProductCardProps) {
  const hasDiscount = product.originalPrice && product.originalPrice > product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100)
    : 0;

  const sizeClasses = {
    sm: 'w-32',
    md: 'w-40',
    lg: 'w-48',
  };

  const imageSizes = {
    sm: 'h-24',
    md: 'h-32',
    lg: 'h-40',
  };

  return (
    <div
      className={cn(
        'relative flex flex-col rounded-lg border bg-white transition-all',
        selectable && 'cursor-pointer hover:border-blue-400',
        selected && 'border-blue-500 ring-2 ring-blue-200',
        !product.inStock && product.inStock !== undefined && 'opacity-60',
        sizeClasses[size],
        className
      )}
      onClick={selectable ? onSelect : undefined}
      data-testid={`upsell-product-${product.id}`}
    >
      {/* Selection checkbox */}
      {selectable && (
        <div className="absolute top-2 left-2 z-10">
          <input
            type="checkbox"
            checked={selected}
            onChange={onSelect}
            className="h-4 w-4 rounded border-gray-300 text-blue-600"
            onClick={(e) => e.stopPropagation()}
            data-testid={`select-product-${product.id}`}
          />
        </div>
      )}

      {/* Badge */}
      {product.badge && (
        <Badge
          className="absolute top-2 right-2 z-10 text-xs"
          variant="secondary"
          data-testid={`product-badge-${product.id}`}
        >
          {product.badge}
        </Badge>
      )}

      {/* Discount badge */}
      {hasDiscount && (
        <Badge
          className="absolute top-2 right-2 z-10 bg-red-500 text-white text-xs"
          data-testid={`discount-badge-${product.id}`}
        >
          -{discountPercent}%
        </Badge>
      )}

      {/* Image */}
      <div className={cn('relative overflow-hidden rounded-t-lg bg-gray-100', imageSizes[size])}>
        <img
          src={product.image}
          alt={product.name}
          className="h-full w-full object-cover"
          data-testid={`product-image-${product.id}`}
        />
        {!product.inStock && product.inStock !== undefined && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <span className="text-white text-xs font-medium">Out of Stock</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col gap-1 p-2">
        <h4 className="text-xs font-medium line-clamp-2" data-testid={`product-name-${product.id}`}>
          {product.name}
        </h4>

        {/* Rating */}
        {product.rating !== undefined && (
          <div className="flex items-center gap-1" data-testid={`product-rating-${product.id}`}>
            <div className="flex">
              {Array.from({ length: 5 }, (_, i) => (
                <svg
                  key={i}
                  className={cn('h-3 w-3', i < Math.round(product.rating!) ? 'text-yellow-400' : 'text-gray-300')}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            {product.reviewCount !== undefined && (
              <span className="text-xs text-gray-500">({product.reviewCount})</span>
            )}
          </div>
        )}

        {/* Price */}
        <div className="flex items-center gap-1 mt-auto">
          <span className="text-sm font-semibold" data-testid={`product-price-${product.id}`}>
            ${product.price.toFixed(2)}
          </span>
          {hasDiscount && (
            <span className="text-xs text-gray-500 line-through" data-testid={`original-price-${product.id}`}>
              ${product.originalPrice!.toFixed(2)}
            </span>
          )}
        </div>

        {/* Add to cart button (non-selectable mode) */}
        {!selectable && onAddToCart && (
          <Button
            size="sm"
            variant="outline"
            className="mt-2 w-full text-xs h-7"
            onClick={onAddToCart}
            disabled={!product.inStock && product.inStock !== undefined}
            data-testid={`add-to-cart-${product.id}`}
          >
            Add to Cart
          </Button>
        )}
      </div>
    </div>
  );
}

// Frequently Bought Together Section
export interface FrequentlyBoughtTogetherProps {
  className?: string;
  title?: string;
  showTotal?: boolean;
}

export function FrequentlyBoughtTogether({
  className,
  title = 'Frequently Bought Together',
  showTotal = true,
}: FrequentlyBoughtTogetherProps) {
  const {
    frequentlyBoughtTogether,
    selectedProducts,
    toggleProduct,
    selectAll,
    clearSelection,
    addSelectedToCart,
    getTotalPrice,
    isProductSelected,
    isLoading,
  } = useUpsells();

  if (isLoading) {
    return (
      <div className={cn('space-y-4', className)} data-testid="fbt-loading">
        <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="flex gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-40 h-48 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (frequentlyBoughtTogether.length === 0) {
    return null;
  }

  return (
    <div className={cn('space-y-4', className)} data-testid="frequently-bought-together">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">{title}</h3>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={selectAll}
            className="text-xs"
            data-testid="select-all-fbt"
          >
            Select All
          </Button>
          {selectedProducts.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSelection}
              className="text-xs"
              data-testid="clear-selection-fbt"
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {frequentlyBoughtTogether.map((product, index) => (
          <React.Fragment key={product.id}>
            <UpsellProductCard
              product={product}
              selectable
              selected={isProductSelected(product.id)}
              onSelect={() => toggleProduct(product.id)}
            />
            {index < frequentlyBoughtTogether.length - 1 && (
              <span className="text-2xl text-gray-400 font-light" data-testid="plus-separator">+</span>
            )}
          </React.Fragment>
        ))}
      </div>

      {showTotal && selectedProducts.length > 0 && (
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <span className="text-sm text-gray-600">Total for {selectedProducts.length} items:</span>
            <span className="ml-2 text-lg font-bold" data-testid="fbt-total">
              ${getTotalPrice().toFixed(2)}
            </span>
          </div>
          <Button onClick={addSelectedToCart} data-testid="add-selected-to-cart">
            Add Selected to Cart
          </Button>
        </div>
      )}
    </div>
  );
}

// Bundle Deal Card
export interface BundleDealCardProps {
  bundle: ProductBundle;
  onAdd?: () => void;
  className?: string;
}

export function BundleDealCard({ bundle, onAdd, className }: BundleDealCardProps) {
  return (
    <Card className={cn('overflow-hidden', className)} data-testid={`bundle-${bundle.id}`}>
      <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3">
        <CardTitle className="text-sm font-medium">
          {bundle.name}
          <Badge className="ml-2 bg-yellow-400 text-black" data-testid={`bundle-savings-${bundle.id}`}>
            Save ${bundle.savings.toFixed(2)} ({bundle.savingsPercent}%)
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="flex gap-2 mb-4">
          {bundle.products.map((product) => (
            <div key={product.id} className="flex-1 text-center">
              <img
                src={product.image}
                alt={product.name}
                className="h-16 w-16 mx-auto object-cover rounded"
              />
              <p className="text-xs mt-1 line-clamp-1">{product.name}</p>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-lg font-bold" data-testid={`bundle-price-${bundle.id}`}>
              ${bundle.bundlePrice.toFixed(2)}
            </span>
            <span className="text-sm text-gray-500 line-through ml-2">
              ${bundle.regularPrice.toFixed(2)}
            </span>
          </div>
          <Button onClick={onAdd} size="sm" data-testid={`add-bundle-${bundle.id}`}>
            Add Bundle
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Bundle Deals Section
export interface BundleDealsProps {
  className?: string;
  title?: string;
}

export function BundleDeals({ className, title = 'Bundle Deals' }: BundleDealsProps) {
  const { bundles, addBundleToCart, isLoading } = useUpsells();

  if (isLoading) {
    return (
      <div className={cn('space-y-4', className)} data-testid="bundles-loading">
        <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
        <div className="h-40 bg-gray-200 rounded animate-pulse" />
      </div>
    );
  }

  if (bundles.length === 0) {
    return null;
  }

  return (
    <div className={cn('space-y-4', className)} data-testid="bundle-deals">
      <h3 className="font-semibold text-lg">{title}</h3>
      <div className="grid gap-4 md:grid-cols-2">
        {bundles.map((bundle) => (
          <BundleDealCard
            key={bundle.id}
            bundle={bundle}
            onAdd={() => addBundleToCart(bundle.id)}
          />
        ))}
      </div>
    </div>
  );
}

// Recommended Add-ons Carousel
export interface RecommendedAddonsProps {
  className?: string;
  title?: string;
  onAddToCart?: (productId: string) => void;
}

export function RecommendedAddons({
  className,
  title = 'You May Also Like',
  onAddToCart,
}: RecommendedAddonsProps) {
  const { recommendedAddons, isLoading } = useUpsells();
  const [scrollPosition, setScrollPosition] = useState(0);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const canScrollLeft = scrollPosition > 0;
  const canScrollRight = scrollRef.current
    ? scrollPosition < scrollRef.current.scrollWidth - scrollRef.current.clientWidth - 10
    : false;

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 200;
      const newPosition =
        direction === 'left'
          ? Math.max(0, scrollPosition - scrollAmount)
          : scrollPosition + scrollAmount;
      scrollRef.current.scrollTo({ left: newPosition, behavior: 'smooth' });
      setScrollPosition(newPosition);
    }
  };

  const handleScroll = () => {
    if (scrollRef.current) {
      setScrollPosition(scrollRef.current.scrollLeft);
    }
  };

  if (isLoading) {
    return (
      <div className={cn('space-y-4', className)} data-testid="addons-loading">
        <div className="h-6 w-40 bg-gray-200 rounded animate-pulse" />
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="w-40 h-48 bg-gray-200 rounded animate-pulse flex-shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  if (recommendedAddons.length === 0) {
    return null;
  }

  return (
    <div className={cn('space-y-4', className)} data-testid="recommended-addons">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">{title}</h3>
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            aria-label="Scroll left"
            data-testid="scroll-left"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            aria-label="Scroll right"
            data-testid="scroll-right"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide pb-2"
        onScroll={handleScroll}
        data-testid="addons-scroll-container"
      >
        {recommendedAddons.map((product) => (
          <UpsellProductCard
            key={product.id}
            product={product}
            onAddToCart={() => onAddToCart?.(product.id)}
            className="flex-shrink-0"
          />
        ))}
      </div>
    </div>
  );
}

// Checkout Upsells Summary (for checkout page)
export interface CheckoutUpsellsSummaryProps {
  className?: string;
  maxItems?: number;
}

export function CheckoutUpsellsSummary({ className, maxItems = 3 }: CheckoutUpsellsSummaryProps) {
  const { frequentlyBoughtTogether, recommendedAddons, toggleProduct, isProductSelected, addSelectedToCart, selectedProducts, getTotalPrice } = useUpsells();

  const displayProducts = [...frequentlyBoughtTogether, ...recommendedAddons].slice(0, maxItems);

  if (displayProducts.length === 0) {
    return null;
  }

  return (
    <div className={cn('p-4 border rounded-lg bg-gray-50', className)} data-testid="checkout-upsells-summary">
      <h4 className="font-medium mb-3">Complete Your Order</h4>
      <div className="space-y-3">
        {displayProducts.map((product) => (
          <div key={product.id} className="flex items-center gap-3" data-testid={`summary-item-${product.id}`}>
            <input
              type="checkbox"
              checked={isProductSelected(product.id)}
              onChange={() => toggleProduct(product.id)}
              className="h-4 w-4 rounded border-gray-300"
              data-testid={`summary-checkbox-${product.id}`}
            />
            <img src={product.image} alt="" className="h-12 w-12 rounded object-cover" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{product.name}</p>
              <p className="text-sm text-gray-600">${product.price.toFixed(2)}</p>
            </div>
          </div>
        ))}
      </div>
      {selectedProducts.length > 0 && (
        <div className="mt-4 pt-3 border-t">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Add {selectedProducts.length} items:</span>
            <span className="font-medium" data-testid="summary-total">${getTotalPrice().toFixed(2)}</span>
          </div>
          <Button className="w-full" size="sm" onClick={addSelectedToCart} data-testid="summary-add-to-cart">
            Add to Order
          </Button>
        </div>
      )}
    </div>
  );
}

// Mini Upsell (inline suggestion)
export interface MiniUpsellProps {
  product: UpsellProduct;
  onAdd: () => void;
  onDismiss?: () => void;
  className?: string;
}

export function MiniUpsell({ product, onAdd, onDismiss, className }: MiniUpsellProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 bg-blue-50 border border-blue-100 rounded-lg',
        className
      )}
      data-testid="mini-upsell"
    >
      <img src={product.image} alt="" className="h-12 w-12 rounded object-cover" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{product.name}</p>
        <p className="text-sm text-blue-600 font-medium">${product.price.toFixed(2)}</p>
      </div>
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={onAdd} data-testid="mini-upsell-add">
          Add
        </Button>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Dismiss"
            data-testid="mini-upsell-dismiss"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

// Main Checkout Upsells component
export interface CheckoutUpsellsProps {
  frequentlyBoughtTogether?: UpsellProduct[];
  recommendedAddons?: UpsellProduct[];
  bundles?: ProductBundle[];
  onAddToCart?: (productIds: string[]) => void;
  onAddBundleToCart?: (bundleId: string) => void;
  onAddSingleProduct?: (productId: string) => void;
  isLoading?: boolean;
  className?: string;
  layout?: 'full' | 'compact' | 'summary';
}

export function CheckoutUpsells({
  frequentlyBoughtTogether = [],
  recommendedAddons = [],
  bundles = [],
  onAddToCart,
  onAddBundleToCart,
  onAddSingleProduct,
  isLoading = false,
  className,
  layout = 'full',
}: CheckoutUpsellsProps) {
  return (
    <UpsellsProvider
      frequentlyBoughtTogether={frequentlyBoughtTogether}
      recommendedAddons={recommendedAddons}
      bundles={bundles}
      onAddToCart={onAddToCart}
      onAddBundleToCart={onAddBundleToCart}
      isLoading={isLoading}
    >
      <div className={cn('space-y-8', className)} data-testid="checkout-upsells">
        {layout === 'full' && (
          <>
            <FrequentlyBoughtTogether />
            <BundleDeals />
            <RecommendedAddons onAddToCart={onAddSingleProduct} />
          </>
        )}
        {layout === 'compact' && (
          <>
            <FrequentlyBoughtTogether />
            <RecommendedAddons onAddToCart={onAddSingleProduct} />
          </>
        )}
        {layout === 'summary' && <CheckoutUpsellsSummary />}
      </div>
    </UpsellsProvider>
  );
}
