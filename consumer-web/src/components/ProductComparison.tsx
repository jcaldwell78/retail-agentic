import { useState, useCallback, createContext, useContext, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  X,
  Plus,
  Scale,
  Check,
  Minus,
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface ComparableProduct {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  imageUrl?: string;
  rating?: number;
  reviewCount?: number;
  inStock: boolean;
  attributes: Record<string, string | number | boolean | null>;
  category?: string;
  brand?: string;
}

interface ComparisonContextType {
  products: ComparableProduct[];
  addProduct: (product: ComparableProduct) => boolean;
  removeProduct: (productId: string) => void;
  clearAll: () => void;
  isInComparison: (productId: string) => boolean;
  maxProducts: number;
  canAdd: boolean;
}

const ComparisonContext = createContext<ComparisonContextType | null>(null);

const MAX_PRODUCTS = 4;

/**
 * Provider for product comparison state
 */
export function ComparisonProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<ComparableProduct[]>([]);

  const addProduct = useCallback((product: ComparableProduct): boolean => {
    if (products.length >= MAX_PRODUCTS) {
      return false;
    }
    if (products.some((p) => p.id === product.id)) {
      return false;
    }
    setProducts((prev) => [...prev, product]);
    return true;
  }, [products]);

  const removeProduct = useCallback((productId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
  }, []);

  const clearAll = useCallback(() => {
    setProducts([]);
  }, []);

  const isInComparison = useCallback(
    (productId: string) => products.some((p) => p.id === productId),
    [products]
  );

  const canAdd = products.length < MAX_PRODUCTS;

  return (
    <ComparisonContext.Provider
      value={{
        products,
        addProduct,
        removeProduct,
        clearAll,
        isInComparison,
        maxProducts: MAX_PRODUCTS,
        canAdd,
      }}
    >
      {children}
    </ComparisonContext.Provider>
  );
}

/**
 * Hook to use comparison context
 */
export function useComparison() {
  const context = useContext(ComparisonContext);
  if (!context) {
    throw new Error('useComparison must be used within a ComparisonProvider');
  }
  return context;
}

/**
 * Format price
 */
function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price);
}

interface CompareButtonProps {
  product: ComparableProduct;
  className?: string;
  variant?: 'default' | 'icon' | 'outline';
}

/**
 * Button to add/remove product from comparison
 */
export function CompareButton({ product, className, variant = 'default' }: CompareButtonProps) {
  const { addProduct, removeProduct, isInComparison, canAdd } = useComparison();
  const inComparison = isInComparison(product.id);

  const handleClick = () => {
    if (inComparison) {
      removeProduct(product.id);
    } else {
      addProduct(product);
    }
  };

  if (variant === 'icon') {
    return (
      <Button
        variant={inComparison ? 'default' : 'outline'}
        size="icon"
        onClick={handleClick}
        disabled={!inComparison && !canAdd}
        className={className}
        data-testid={`compare-button-${product.id}`}
        title={inComparison ? 'Remove from comparison' : 'Add to comparison'}
      >
        <Scale className="w-4 h-4" />
      </Button>
    );
  }

  return (
    <Button
      variant={inComparison ? 'default' : 'outline'}
      onClick={handleClick}
      disabled={!inComparison && !canAdd}
      className={cn('gap-2', className)}
      data-testid={`compare-button-${product.id}`}
    >
      <Scale className="w-4 h-4" />
      {inComparison ? 'Remove from Compare' : 'Compare'}
    </Button>
  );
}

/**
 * Floating bar showing products in comparison
 */
export function ComparisonBar({ className }: { className?: string }) {
  const { products, removeProduct, clearAll } = useComparison();

  if (products.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 z-40 bg-white border-t shadow-lg',
        'p-4 animate-in slide-in-from-bottom duration-300',
        className
      )}
      data-testid="comparison-bar"
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 overflow-x-auto">
          <Badge variant="secondary" className="flex-shrink-0">
            {products.length} items
          </Badge>
          {products.map((product) => (
            <div
              key={product.id}
              className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2 flex-shrink-0"
              data-testid={`bar-product-${product.id}`}
            >
              {product.imageUrl && (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-10 h-10 object-cover rounded"
                />
              )}
              <span className="text-sm font-medium max-w-[120px] truncate">
                {product.name}
              </span>
              <button
                onClick={() => removeProduct(product.id)}
                className="p-1 hover:bg-gray-200 rounded"
                aria-label={`Remove ${product.name} from comparison`}
                data-testid={`bar-remove-${product.id}`}
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button variant="ghost" onClick={clearAll} data-testid="clear-comparison">
            Clear All
          </Button>
          <Button asChild data-testid="view-comparison">
            <Link to="/compare">
              Compare Now
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

interface ComparisonTableProps {
  products?: ComparableProduct[];
  onAddToCart?: (product: ComparableProduct) => void;
  className?: string;
}

/**
 * Get all unique attribute keys from products
 */
function getAttributeKeys(products: ComparableProduct[]): string[] {
  const keys = new Set<string>();
  products.forEach((product) => {
    Object.keys(product.attributes).forEach((key) => keys.add(key));
  });
  return Array.from(keys).sort();
}

/**
 * Format attribute value for display
 */
function formatAttributeValue(value: string | number | boolean | null): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return String(value);
}

/**
 * Check if values differ across products for an attribute
 */
function hasDifference(products: ComparableProduct[], key: string): boolean {
  const values = products.map((p) => p.attributes[key]);
  const uniqueValues = new Set(values.map((v) => JSON.stringify(v)));
  return uniqueValues.size > 1;
}

/**
 * Full comparison table view
 */
export function ComparisonTable({ products: propProducts, onAddToCart, className }: ComparisonTableProps) {
  const context = useComparison();
  const products = propProducts || context.products;
  const removeProduct = context.removeProduct;
  const [showDifferencesOnly, setShowDifferencesOnly] = useState(false);

  if (products.length === 0) {
    return (
      <div
        className={cn('text-center py-16', className)}
        data-testid="comparison-empty"
      >
        <Scale className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          No products to compare
        </h3>
        <p className="text-gray-500 mb-6">
          Add products to compare by clicking the compare button on product cards
        </p>
        <Button asChild>
          <Link to="/products">Browse Products</Link>
        </Button>
      </div>
    );
  }

  const attributeKeys = getAttributeKeys(products);
  const filteredKeys = showDifferencesOnly
    ? attributeKeys.filter((key) => hasDifference(products, key))
    : attributeKeys;

  return (
    <div className={cn('overflow-x-auto', className)} data-testid="comparison-table">
      {/* Filter toggle */}
      <div className="flex justify-end mb-4">
        <Button
          variant={showDifferencesOnly ? 'default' : 'outline'}
          size="sm"
          onClick={() => setShowDifferencesOnly(!showDifferencesOnly)}
          data-testid="toggle-differences"
        >
          {showDifferencesOnly ? 'Show All' : 'Show Differences Only'}
        </Button>
      </div>

      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="p-4 text-left bg-gray-50 border-b w-48" />
            {products.map((product) => (
              <th
                key={product.id}
                className="p-4 text-left bg-gray-50 border-b min-w-[200px]"
                data-testid={`header-${product.id}`}
              >
                <div className="relative">
                  <button
                    onClick={() => removeProduct(product.id)}
                    className="absolute -top-2 -right-2 p-1 bg-white border rounded-full hover:bg-gray-100"
                    aria-label={`Remove ${product.name}`}
                    data-testid={`remove-${product.id}`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                  {product.imageUrl && (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-32 h-32 object-cover rounded-lg mb-3"
                    />
                  )}
                  <Link
                    to={`/products/${product.id}`}
                    className="font-semibold text-blue-600 hover:underline line-clamp-2"
                  >
                    {product.name}
                  </Link>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {/* Price row */}
          <tr className="border-b">
            <td className="p-4 font-medium text-gray-700 bg-gray-50">Price</td>
            {products.map((product) => (
              <td key={product.id} className="p-4" data-testid={`price-${product.id}`}>
                <div className="flex flex-col">
                  <span className="text-lg font-bold text-gray-900">
                    {formatPrice(product.price)}
                  </span>
                  {product.originalPrice && product.originalPrice > product.price && (
                    <span className="text-sm text-gray-500 line-through">
                      {formatPrice(product.originalPrice)}
                    </span>
                  )}
                </div>
              </td>
            ))}
          </tr>

          {/* Rating row */}
          <tr className="border-b">
            <td className="p-4 font-medium text-gray-700 bg-gray-50">Rating</td>
            {products.map((product) => (
              <td key={product.id} className="p-4" data-testid={`rating-${product.id}`}>
                {product.rating ? (
                  <div className="flex items-center gap-1">
                    <span className="text-yellow-500">★</span>
                    <span>{product.rating.toFixed(1)}</span>
                    {product.reviewCount !== undefined && (
                      <span className="text-gray-500 text-sm">
                        ({product.reviewCount})
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-gray-400">No ratings</span>
                )}
              </td>
            ))}
          </tr>

          {/* Stock row */}
          <tr className="border-b">
            <td className="p-4 font-medium text-gray-700 bg-gray-50">Availability</td>
            {products.map((product) => (
              <td key={product.id} className="p-4" data-testid={`stock-${product.id}`}>
                {product.inStock ? (
                  <Badge variant="default" className="bg-green-600">
                    <Check className="w-3 h-3 mr-1" />
                    In Stock
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <Minus className="w-3 h-3 mr-1" />
                    Out of Stock
                  </Badge>
                )}
              </td>
            ))}
          </tr>

          {/* Brand row if any product has brand */}
          {products.some((p) => p.brand) && (
            <tr className="border-b">
              <td className="p-4 font-medium text-gray-700 bg-gray-50">Brand</td>
              {products.map((product) => (
                <td key={product.id} className="p-4" data-testid={`brand-${product.id}`}>
                  {product.brand || '—'}
                </td>
              ))}
            </tr>
          )}

          {/* Dynamic attributes */}
          {filteredKeys.map((key) => (
            <tr
              key={key}
              className={cn(
                'border-b',
                hasDifference(products, key) && 'bg-yellow-50'
              )}
            >
              <td className="p-4 font-medium text-gray-700 bg-gray-50 capitalize">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </td>
              {products.map((product) => (
                <td
                  key={product.id}
                  className="p-4"
                  data-testid={`attr-${key}-${product.id}`}
                >
                  {formatAttributeValue(product.attributes[key])}
                </td>
              ))}
            </tr>
          ))}

          {/* Add to cart row */}
          <tr>
            <td className="p-4 bg-gray-50" />
            {products.map((product) => (
              <td key={product.id} className="p-4" data-testid={`action-${product.id}`}>
                <Button
                  onClick={() => onAddToCart?.(product)}
                  disabled={!product.inStock}
                  className="w-full"
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Add to Cart
                </Button>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

/**
 * Mobile-friendly comparison cards with swipe
 */
export function ComparisonCards({
  products: propProducts,
  onAddToCart,
  className,
}: ComparisonTableProps) {
  const context = useComparison();
  const products = propProducts || context.products;
  const removeProduct = context.removeProduct;
  const [currentIndex, setCurrentIndex] = useState(0);

  if (products.length === 0) {
    return (
      <div
        className={cn('text-center py-16', className)}
        data-testid="comparison-cards-empty"
      >
        <Scale className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          No products to compare
        </h3>
        <p className="text-gray-500 mb-6">
          Add products to compare by clicking the compare button
        </p>
      </div>
    );
  }

  const attributeKeys = getAttributeKeys(products);
  const currentProduct = products[currentIndex];

  return (
    <div className={cn('', className)} data-testid="comparison-cards">
      {/* Navigation dots */}
      <div className="flex justify-center gap-2 mb-4">
        {products.map((product, index) => (
          <button
            key={product.id}
            onClick={() => setCurrentIndex(index)}
            className={cn(
              'w-3 h-3 rounded-full transition-colors',
              index === currentIndex ? 'bg-blue-600' : 'bg-gray-300'
            )}
            aria-label={`View ${product.name}`}
            data-testid={`dot-${product.id}`}
          />
        ))}
      </div>

      {/* Card with navigation */}
      <div className="relative">
        {currentIndex > 0 && (
          <button
            onClick={() => setCurrentIndex(currentIndex - 1)}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-white rounded-full shadow-lg hover:bg-gray-50"
            aria-label="Previous product"
            data-testid="prev-product"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {currentIndex < products.length - 1 && (
          <button
            onClick={() => setCurrentIndex(currentIndex + 1)}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-white rounded-full shadow-lg hover:bg-gray-50"
            aria-label="Next product"
            data-testid="next-product"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}

        <Card className="mx-8" data-testid={`card-${currentProduct.id}`}>
          <CardHeader className="relative">
            <button
              onClick={() => removeProduct(currentProduct.id)}
              className="absolute top-4 right-4 p-1 bg-gray-100 rounded-full hover:bg-gray-200"
              aria-label={`Remove ${currentProduct.name}`}
            >
              <X className="w-4 h-4" />
            </button>
            {currentProduct.imageUrl && (
              <img
                src={currentProduct.imageUrl}
                alt={currentProduct.name}
                className="w-full h-48 object-cover rounded-lg mb-4"
              />
            )}
            <CardTitle>
              <Link
                to={`/products/${currentProduct.id}`}
                className="text-blue-600 hover:underline"
              >
                {currentProduct.name}
              </Link>
            </CardTitle>
            <div className="flex items-center gap-4 mt-2">
              <span className="text-2xl font-bold">
                {formatPrice(currentProduct.price)}
              </span>
              {currentProduct.inStock ? (
                <Badge variant="default" className="bg-green-600">In Stock</Badge>
              ) : (
                <Badge variant="destructive">Out of Stock</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3">
              {currentProduct.rating && (
                <div className="flex justify-between">
                  <dt className="text-gray-600">Rating</dt>
                  <dd className="flex items-center gap-1">
                    <span className="text-yellow-500">★</span>
                    {currentProduct.rating.toFixed(1)}
                    {currentProduct.reviewCount !== undefined && (
                      <span className="text-gray-400">
                        ({currentProduct.reviewCount})
                      </span>
                    )}
                  </dd>
                </div>
              )}
              {currentProduct.brand && (
                <div className="flex justify-between">
                  <dt className="text-gray-600">Brand</dt>
                  <dd>{currentProduct.brand}</dd>
                </div>
              )}
              {attributeKeys.slice(0, 5).map((key) => (
                <div key={key} className="flex justify-between">
                  <dt className="text-gray-600 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </dt>
                  <dd>{formatAttributeValue(currentProduct.attributes[key])}</dd>
                </div>
              ))}
            </dl>
            <Button
              onClick={() => onAddToCart?.(currentProduct)}
              disabled={!currentProduct.inStock}
              className="w-full mt-6"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Add to Cart
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/**
 * Compact comparison widget for sidebars
 */
export function ComparisonWidget({ className }: { className?: string }) {
  const { products, removeProduct, clearAll } = useComparison();

  return (
    <Card className={cn('', className)} data-testid="comparison-widget">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Scale className="w-5 h-5" />
          Compare Products
        </CardTitle>
      </CardHeader>
      <CardContent>
        {products.length === 0 ? (
          <p className="text-sm text-gray-500" data-testid="widget-empty">
            Add products to compare them side by side
          </p>
        ) : (
          <>
            <div className="space-y-2 mb-4">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg"
                  data-testid={`widget-product-${product.id}`}
                >
                  {product.imageUrl && (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-10 h-10 object-cover rounded"
                    />
                  )}
                  <span className="flex-1 text-sm truncate">{product.name}</span>
                  <button
                    onClick={() => removeProduct(product.id)}
                    className="p-1 hover:bg-gray-200 rounded"
                    aria-label={`Remove ${product.name}`}
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={clearAll} className="flex-1">
                Clear
              </Button>
              <Button asChild size="sm" className="flex-1">
                <Link to="/compare">Compare</Link>
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default ComparisonTable;
