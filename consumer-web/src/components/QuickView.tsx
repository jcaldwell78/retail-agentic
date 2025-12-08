import { useState, useCallback, createContext, useContext, ReactNode } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  Heart,
  Share2,
  Star,
  Truck,
  Shield,
  RotateCcw,
  Plus,
  Minus,
  ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Types
export interface ProductImage {
  id: string;
  url: string;
  alt: string;
}

export interface ProductVariant {
  id: string;
  name: string;
  type: 'size' | 'color' | 'style' | 'other';
  options: VariantOption[];
}

export interface VariantOption {
  id: string;
  value: string;
  label: string;
  available: boolean;
  priceModifier?: number;
  colorHex?: string;
}

export interface QuickViewProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  currency?: string;
  images: ProductImage[];
  variants?: ProductVariant[];
  rating?: number;
  reviewCount?: number;
  inStock: boolean;
  stockCount?: number;
  sku?: string;
  brand?: string;
  category?: string;
}

export interface QuickViewContextType {
  isOpen: boolean;
  product: QuickViewProduct | null;
  openQuickView: (product: QuickViewProduct) => void;
  closeQuickView: () => void;
}

// Context
const QuickViewContext = createContext<QuickViewContextType | null>(null);

export function QuickViewProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [product, setProduct] = useState<QuickViewProduct | null>(null);

  const openQuickView = useCallback((product: QuickViewProduct) => {
    setProduct(product);
    setIsOpen(true);
  }, []);

  const closeQuickView = useCallback(() => {
    setIsOpen(false);
    // Delay clearing product to allow closing animation
    setTimeout(() => setProduct(null), 200);
  }, []);

  return (
    <QuickViewContext.Provider value={{ isOpen, product, openQuickView, closeQuickView }}>
      {children}
    </QuickViewContext.Provider>
  );
}

export function useQuickView() {
  const context = useContext(QuickViewContext);
  if (!context) {
    throw new Error('useQuickView must be used within a QuickViewProvider');
  }
  return context;
}

// Image Gallery Component
interface ImageGalleryProps {
  images: ProductImage[];
  productName: string;
}

export function ImageGallery({ images, productName }: ImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  }, [images.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  }, [images.length]);

  const selectImage = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  if (images.length === 0) {
    return (
      <div
        className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center"
        data-testid="no-image-placeholder"
      >
        <span className="text-gray-400">No image available</span>
      </div>
    );
  }

  return (
    <div className="space-y-3" data-testid="image-gallery">
      {/* Main Image */}
      <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
        <img
          src={images[currentIndex].url}
          alt={images[currentIndex].alt || productName}
          className="w-full h-full object-cover"
          data-testid="main-image"
        />

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-white/90 rounded-full shadow-md hover:bg-white transition-colors"
              aria-label="Previous image"
              data-testid="prev-image-btn"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-white/90 rounded-full shadow-md hover:bg-white transition-colors"
              aria-label="Next image"
              data-testid="next-image-btn"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Image Counter */}
        {images.length > 1 && (
          <div
            className="absolute bottom-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-black/60 text-white text-xs rounded-full"
            data-testid="image-counter"
          >
            {currentIndex + 1} / {images.length}
          </div>
        )}
      </div>

      {/* Thumbnail Strip */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1" data-testid="thumbnail-strip">
          {images.map((image, index) => (
            <button
              key={image.id}
              onClick={() => selectImage(index)}
              className={cn(
                'flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-all',
                currentIndex === index
                  ? 'border-blue-500 ring-1 ring-blue-500'
                  : 'border-transparent hover:border-gray-300'
              )}
              aria-label={`View image ${index + 1}`}
              data-testid={`thumbnail-${index}`}
            >
              <img
                src={image.url}
                alt={image.alt || `${productName} thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Variant Selector Component
interface VariantSelectorProps {
  variants: ProductVariant[];
  selectedOptions: Record<string, string>;
  onSelectOption: (variantId: string, optionId: string) => void;
}

export function VariantSelector({ variants, selectedOptions, onSelectOption }: VariantSelectorProps) {
  if (variants.length === 0) return null;

  return (
    <div className="space-y-4" data-testid="variant-selector">
      {variants.map((variant) => (
        <div key={variant.id} className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            {variant.name}
            {selectedOptions[variant.id] && (
              <span className="ml-2 text-gray-500">
                : {variant.options.find(o => o.id === selectedOptions[variant.id])?.label}
              </span>
            )}
          </label>

          <div className="flex flex-wrap gap-2" data-testid={`variant-options-${variant.id}`}>
            {variant.options.map((option) => {
              const isSelected = selectedOptions[variant.id] === option.id;

              if (variant.type === 'color' && option.colorHex) {
                return (
                  <button
                    key={option.id}
                    onClick={() => onSelectOption(variant.id, option.id)}
                    disabled={!option.available}
                    className={cn(
                      'w-8 h-8 rounded-full border-2 transition-all',
                      isSelected ? 'ring-2 ring-offset-2 ring-blue-500' : '',
                      !option.available && 'opacity-40 cursor-not-allowed'
                    )}
                    style={{ backgroundColor: option.colorHex }}
                    aria-label={option.label}
                    aria-pressed={isSelected}
                    data-testid={`color-option-${option.id}`}
                  />
                );
              }

              return (
                <button
                  key={option.id}
                  onClick={() => onSelectOption(variant.id, option.id)}
                  disabled={!option.available}
                  className={cn(
                    'px-3 py-1.5 text-sm border rounded-md transition-all',
                    isSelected
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:border-gray-400',
                    !option.available && 'opacity-40 cursor-not-allowed line-through'
                  )}
                  aria-pressed={isSelected}
                  data-testid={`size-option-${option.id}`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// Quantity Selector Component
interface QuantitySelectorProps {
  quantity: number;
  maxQuantity?: number;
  onQuantityChange: (quantity: number) => void;
}

export function QuantitySelector({ quantity, maxQuantity = 99, onQuantityChange }: QuantitySelectorProps) {
  const handleDecrease = useCallback(() => {
    if (quantity > 1) {
      onQuantityChange(quantity - 1);
    }
  }, [quantity, onQuantityChange]);

  const handleIncrease = useCallback(() => {
    if (quantity < maxQuantity) {
      onQuantityChange(quantity + 1);
    }
  }, [quantity, maxQuantity, onQuantityChange]);

  return (
    <div className="flex items-center gap-3" data-testid="quantity-selector">
      <span className="text-sm font-medium text-gray-700">Quantity:</span>
      <div className="flex items-center border rounded-md">
        <button
          onClick={handleDecrease}
          disabled={quantity <= 1}
          className="p-2 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Decrease quantity"
          data-testid="decrease-quantity"
        >
          <Minus className="w-4 h-4" />
        </button>
        <span
          className="px-4 py-2 min-w-[3rem] text-center font-medium"
          data-testid="quantity-value"
        >
          {quantity}
        </span>
        <button
          onClick={handleIncrease}
          disabled={quantity >= maxQuantity}
          className="p-2 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Increase quantity"
          data-testid="increase-quantity"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// Trust Badges Component
export function QuickViewTrustBadges() {
  return (
    <div className="flex flex-wrap gap-4 text-xs text-gray-600" data-testid="trust-badges">
      <div className="flex items-center gap-1">
        <Truck className="w-4 h-4" />
        <span>Free Shipping</span>
      </div>
      <div className="flex items-center gap-1">
        <Shield className="w-4 h-4" />
        <span>Secure Checkout</span>
      </div>
      <div className="flex items-center gap-1">
        <RotateCcw className="w-4 h-4" />
        <span>Easy Returns</span>
      </div>
    </div>
  );
}

// Main Quick View Modal Component
interface QuickViewModalProps {
  product: QuickViewProduct;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart?: (product: QuickViewProduct, quantity: number, selectedOptions: Record<string, string>) => void;
  onAddToWishlist?: (product: QuickViewProduct) => void;
  onShare?: (product: QuickViewProduct) => void;
  onViewDetails?: (product: QuickViewProduct) => void;
}

export function QuickViewModal({
  product,
  isOpen,
  onClose,
  onAddToCart,
  onAddToWishlist,
  onShare,
  onViewDetails,
}: QuickViewModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const handleSelectOption = useCallback((variantId: string, optionId: string) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [variantId]: optionId,
    }));
  }, []);

  const handleAddToCart = useCallback(async () => {
    if (!onAddToCart) return;

    setIsAddingToCart(true);
    try {
      await onAddToCart(product, quantity, selectedOptions);
    } finally {
      setIsAddingToCart(false);
    }
  }, [onAddToCart, product, quantity, selectedOptions]);

  const calculatePrice = useCallback(() => {
    let basePrice = product.price;

    // Apply price modifiers from selected options
    if (product.variants) {
      for (const variant of product.variants) {
        const selectedOptionId = selectedOptions[variant.id];
        if (selectedOptionId) {
          const option = variant.options.find((o) => o.id === selectedOptionId);
          if (option?.priceModifier) {
            basePrice += option.priceModifier;
          }
        }
      }
    }

    return basePrice * quantity;
  }, [product, selectedOptions, quantity]);

  const formatPrice = useCallback((price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: product.currency || 'USD',
    }).format(price);
  }, [product.currency]);

  const discount = product.compareAtPrice
    ? Math.round((1 - product.price / product.compareAtPrice) * 100)
    : 0;

  const allVariantsSelected = !product.variants ||
    product.variants.every((v) => selectedOptions[v.id]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-w-4xl p-0 overflow-hidden"
        data-testid="quick-view-modal"
      >
        <DialogHeader className="sr-only">
          <DialogTitle>{product.name}</DialogTitle>
          <DialogDescription>Quick view of {product.name}</DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-0">
          {/* Left: Image Gallery */}
          <div className="p-6 bg-gray-50">
            <ImageGallery images={product.images} productName={product.name} />
          </div>

          {/* Right: Product Details */}
          <div className="p-6 space-y-5 overflow-y-auto max-h-[80vh]">
            {/* Header */}
            <div className="space-y-2">
              {product.brand && (
                <span className="text-sm text-gray-500 uppercase tracking-wide" data-testid="product-brand">
                  {product.brand}
                </span>
              )}
              <h2 className="text-xl font-semibold" data-testid="product-name">
                {product.name}
              </h2>

              {/* Rating */}
              {product.rating !== undefined && (
                <div className="flex items-center gap-2" data-testid="product-rating">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={cn(
                          'w-4 h-4',
                          star <= product.rating!
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-300'
                        )}
                      />
                    ))}
                  </div>
                  {product.reviewCount !== undefined && (
                    <span className="text-sm text-gray-500">
                      ({product.reviewCount} reviews)
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3" data-testid="product-price">
              <span className="text-2xl font-bold">
                {formatPrice(calculatePrice())}
              </span>
              {product.compareAtPrice && (
                <>
                  <span className="text-lg text-gray-400 line-through">
                    {formatPrice(product.compareAtPrice * quantity)}
                  </span>
                  <Badge variant="destructive" className="text-xs">
                    {discount}% OFF
                  </Badge>
                </>
              )}
            </div>

            {/* Stock Status */}
            <div data-testid="stock-status">
              {product.inStock ? (
                <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                  In Stock
                  {product.stockCount && product.stockCount <= 10 && (
                    <span className="ml-1">- Only {product.stockCount} left!</span>
                  )}
                </Badge>
              ) : (
                <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">
                  Out of Stock
                </Badge>
              )}
            </div>

            {/* Description */}
            <p className="text-gray-600 text-sm line-clamp-3" data-testid="product-description">
              {product.description}
            </p>

            {/* Variants */}
            {product.variants && product.variants.length > 0 && (
              <VariantSelector
                variants={product.variants}
                selectedOptions={selectedOptions}
                onSelectOption={handleSelectOption}
              />
            )}

            {/* Quantity */}
            <QuantitySelector
              quantity={quantity}
              maxQuantity={product.stockCount || 99}
              onQuantityChange={setQuantity}
            />

            {/* Actions */}
            <div className="space-y-3">
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  size="lg"
                  onClick={handleAddToCart}
                  disabled={!product.inStock || !allVariantsSelected || isAddingToCart}
                  data-testid="add-to-cart-btn"
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  {isAddingToCart ? 'Adding...' : 'Add to Cart'}
                </Button>

                {onAddToWishlist && (
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => onAddToWishlist(product)}
                    aria-label="Add to wishlist"
                    data-testid="add-to-wishlist-btn"
                  >
                    <Heart className="w-4 h-4" />
                  </Button>
                )}

                {onShare && (
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => onShare(product)}
                    aria-label="Share product"
                    data-testid="share-btn"
                  >
                    <Share2 className="w-4 h-4" />
                  </Button>
                )}
              </div>

              {onViewDetails && (
                <Button
                  variant="link"
                  className="w-full"
                  onClick={() => onViewDetails(product)}
                  data-testid="view-details-btn"
                >
                  View Full Details
                  <ExternalLink className="w-3 h-3 ml-1" />
                </Button>
              )}
            </div>

            {/* Trust Badges */}
            <QuickViewTrustBadges />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Quick View Button - Can be placed on product cards
interface QuickViewButtonProps {
  product: QuickViewProduct;
  variant?: 'default' | 'icon' | 'overlay';
  className?: string;
}

export function QuickViewButton({ product, variant = 'default', className }: QuickViewButtonProps) {
  const { openQuickView } = useQuickView();

  if (variant === 'icon') {
    return (
      <Button
        variant="ghost"
        size="icon"
        className={cn('bg-white/90 hover:bg-white', className)}
        onClick={() => openQuickView(product)}
        aria-label={`Quick view ${product.name}`}
        data-testid="quick-view-icon-btn"
      >
        <ExternalLink className="w-4 h-4" />
      </Button>
    );
  }

  if (variant === 'overlay') {
    return (
      <button
        className={cn(
          'absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 hover:opacity-100',
          className
        )}
        onClick={() => openQuickView(product)}
        aria-label={`Quick view ${product.name}`}
        data-testid="quick-view-overlay-btn"
      >
        <span className="px-4 py-2 bg-white rounded-md font-medium text-sm shadow-lg">
          Quick View
        </span>
      </button>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className={className}
      onClick={() => openQuickView(product)}
      data-testid="quick-view-btn"
    >
      Quick View
    </Button>
  );
}

// Container component that combines provider and modal
interface QuickViewContainerProps {
  children: ReactNode;
  onAddToCart?: (product: QuickViewProduct, quantity: number, selectedOptions: Record<string, string>) => void;
  onAddToWishlist?: (product: QuickViewProduct) => void;
  onShare?: (product: QuickViewProduct) => void;
  onViewDetails?: (product: QuickViewProduct) => void;
}

export function QuickViewContainer({
  children,
  onAddToCart,
  onAddToWishlist,
  onShare,
  onViewDetails,
}: QuickViewContainerProps) {
  return (
    <QuickViewProvider>
      {children}
      <QuickViewModalConnector
        onAddToCart={onAddToCart}
        onAddToWishlist={onAddToWishlist}
        onShare={onShare}
        onViewDetails={onViewDetails}
      />
    </QuickViewProvider>
  );
}

// Internal connector component
function QuickViewModalConnector({
  onAddToCart,
  onAddToWishlist,
  onShare,
  onViewDetails,
}: Omit<QuickViewContainerProps, 'children'>) {
  const { isOpen, product, closeQuickView } = useQuickView();

  if (!product) return null;

  return (
    <QuickViewModal
      product={product}
      isOpen={isOpen}
      onClose={closeQuickView}
      onAddToCart={onAddToCart}
      onAddToWishlist={onAddToWishlist}
      onShare={onShare}
      onViewDetails={onViewDetails}
    />
  );
}

// Product Card with Quick View - Example implementation
interface ProductCardWithQuickViewProps {
  product: QuickViewProduct;
  onAddToCart?: (product: QuickViewProduct) => void;
}

export function ProductCardWithQuickView({ product, }: ProductCardWithQuickViewProps) {
  const { openQuickView } = useQuickView();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: product.currency || 'USD',
    }).format(price);
  };

  return (
    <Card className="group relative overflow-hidden" data-testid="product-card-quick-view">
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden">
        <img
          src={product.images[0]?.url || '/placeholder.png'}
          alt={product.name}
          className="w-full h-full object-cover transition-transform group-hover:scale-105"
        />

        {/* Quick View Overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
          <Button
            variant="secondary"
            size="sm"
            className="opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0"
            onClick={() => openQuickView(product)}
            data-testid="product-card-quick-view-btn"
          >
            Quick View
          </Button>
        </div>

        {/* Badges */}
        {!product.inStock && (
          <Badge className="absolute top-2 left-2 bg-red-500">
            Out of Stock
          </Badge>
        )}
        {product.compareAtPrice && (
          <Badge className="absolute top-2 right-2 bg-green-500">
            Sale
          </Badge>
        )}
      </div>

      <CardContent className="p-4">
        <h3 className="font-medium line-clamp-2 mb-1">{product.name}</h3>

        <div className="flex items-baseline gap-2">
          <span className="font-bold">{formatPrice(product.price)}</span>
          {product.compareAtPrice && (
            <span className="text-sm text-gray-400 line-through">
              {formatPrice(product.compareAtPrice)}
            </span>
          )}
        </div>

        {/* Rating */}
        {product.rating && (
          <div className="flex items-center gap-1 mt-1">
            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
            <span className="text-xs text-gray-500">
              {product.rating} ({product.reviewCount})
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default QuickViewModal;
