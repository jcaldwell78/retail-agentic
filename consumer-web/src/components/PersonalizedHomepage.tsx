import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// Types
export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  rating?: number;
  reviewCount?: number;
  badge?: 'new' | 'sale' | 'trending' | 'bestseller';
  inStock?: boolean;
}

export interface Category {
  id: string;
  name: string;
  image: string;
  productCount: number;
}

export interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  image: string;
  ctaText: string;
  ctaLink: string;
  backgroundColor?: string;
}

export interface PersonalizationData {
  userId?: string;
  recentlyViewed: Product[];
  recommendedForYou: Product[];
  trendingProducts: Product[];
  newArrivals: Product[];
  bestSellers: Product[];
  personalizedCategories: Category[];
  heroBanners: Banner[];
  dealOfTheDay?: Product & { endTime: Date };
  isLoading: boolean;
  error: string | null;
}

export interface PersonalizedHomepageContextType extends PersonalizationData {
  refreshRecommendations: () => Promise<void>;
  trackProductView: (productId: string) => void;
  trackProductClick: (productId: string, section: string) => void;
  clearRecentlyViewed: () => void;
}

// Context
const PersonalizedHomepageContext = createContext<PersonalizedHomepageContextType | null>(null);

export function usePersonalizedHomepage(): PersonalizedHomepageContextType {
  const context = useContext(PersonalizedHomepageContext);
  if (!context) {
    throw new Error('usePersonalizedHomepage must be used within a PersonalizedHomepageProvider');
  }
  return context;
}

// Provider
export interface PersonalizedHomepageProviderProps {
  children: ReactNode;
  userId?: string;
  fetchRecommendations?: (userId?: string) => Promise<Partial<PersonalizationData>>;
  onProductView?: (productId: string) => void;
  onProductClick?: (productId: string, section: string) => void;
  initialData?: Partial<PersonalizationData>;
}

const RECENTLY_VIEWED_KEY = 'recently_viewed_products';
const MAX_RECENTLY_VIEWED = 20;

export function PersonalizedHomepageProvider({
  children,
  userId,
  fetchRecommendations,
  onProductView,
  onProductClick,
  initialData = {},
}: PersonalizedHomepageProviderProps) {
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>(
    initialData.recentlyViewed || []
  );
  const [recommendedForYou, setRecommendedForYou] = useState<Product[]>(
    initialData.recommendedForYou || []
  );
  const [trendingProducts, setTrendingProducts] = useState<Product[]>(
    initialData.trendingProducts || []
  );
  const [newArrivals, setNewArrivals] = useState<Product[]>(
    initialData.newArrivals || []
  );
  const [bestSellers, setBestSellers] = useState<Product[]>(
    initialData.bestSellers || []
  );
  const [personalizedCategories, setPersonalizedCategories] = useState<Category[]>(
    initialData.personalizedCategories || []
  );
  const [heroBanners, setHeroBanners] = useState<Banner[]>(
    initialData.heroBanners || []
  );
  const [dealOfTheDay, setDealOfTheDay] = useState<(Product & { endTime: Date }) | undefined>(
    initialData.dealOfTheDay
  );
  const [isLoading, setIsLoading] = useState(initialData.isLoading || false);
  const [error, setError] = useState<string | null>(initialData.error || null);

  // Load recently viewed from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem(RECENTLY_VIEWED_KEY);
      if (saved && !initialData.recentlyViewed) {
        setRecentlyViewed(JSON.parse(saved));
      }
    } catch {
      // Ignore localStorage errors
    }
  }, [initialData.recentlyViewed]);

  // Save recently viewed to localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(recentlyViewed));
    } catch {
      // Ignore localStorage errors
    }
  }, [recentlyViewed]);

  const refreshRecommendations = useCallback(async () => {
    if (!fetchRecommendations) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchRecommendations(userId);
      if (data.recommendedForYou) setRecommendedForYou(data.recommendedForYou);
      if (data.trendingProducts) setTrendingProducts(data.trendingProducts);
      if (data.newArrivals) setNewArrivals(data.newArrivals);
      if (data.bestSellers) setBestSellers(data.bestSellers);
      if (data.personalizedCategories) setPersonalizedCategories(data.personalizedCategories);
      if (data.heroBanners) setHeroBanners(data.heroBanners);
      if (data.dealOfTheDay) setDealOfTheDay(data.dealOfTheDay);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load recommendations');
    } finally {
      setIsLoading(false);
    }
  }, [fetchRecommendations, userId]);

  const trackProductView = useCallback((productId: string) => {
    onProductView?.(productId);
  }, [onProductView]);

  const trackProductClick = useCallback((productId: string, section: string) => {
    onProductClick?.(productId, section);
  }, [onProductClick]);

  const clearRecentlyViewed = useCallback(() => {
    setRecentlyViewed([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(RECENTLY_VIEWED_KEY);
    }
  }, []);

  const value: PersonalizedHomepageContextType = {
    userId,
    recentlyViewed,
    recommendedForYou,
    trendingProducts,
    newArrivals,
    bestSellers,
    personalizedCategories,
    heroBanners,
    dealOfTheDay,
    isLoading,
    error,
    refreshRecommendations,
    trackProductView,
    trackProductClick,
    clearRecentlyViewed,
  };

  return (
    <PersonalizedHomepageContext.Provider value={value}>
      {children}
    </PersonalizedHomepageContext.Provider>
  );
}

// Helper Components

// Product Card
export interface ProductCardProps {
  product: Product;
  className?: string;
  section?: string;
  showRating?: boolean;
  showBadge?: boolean;
  onAddToCart?: (productId: string) => void;
  onQuickView?: (productId: string) => void;
}

export function ProductCard({
  product,
  className,
  section = 'default',
  showRating = true,
  showBadge = true,
  onAddToCart,
  onQuickView,
}: ProductCardProps) {
  const { trackProductClick } = usePersonalizedHomepage();

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const handleClick = () => {
    trackProductClick(product.id, section);
  };

  const getBadgeVariant = (badge: Product['badge']) => {
    switch (badge) {
      case 'new':
        return 'default';
      case 'sale':
        return 'destructive';
      case 'trending':
        return 'secondary';
      case 'bestseller':
        return 'outline';
      default:
        return 'default';
    }
  };

  return (
    <Card
      className={cn('group cursor-pointer overflow-hidden', className)}
      onClick={handleClick}
      data-testid={`product-card-${product.id}`}
    >
      <div className="relative aspect-square overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          className="h-full w-full object-cover transition-transform group-hover:scale-105"
        />
        {showBadge && product.badge && (
          <Badge
            variant={getBadgeVariant(product.badge)}
            className="absolute left-2 top-2"
            data-testid="product-badge"
          >
            {product.badge === 'bestseller' ? 'Best Seller' : product.badge.charAt(0).toUpperCase() + product.badge.slice(1)}
          </Badge>
        )}
        {discount > 0 && (
          <Badge
            variant="destructive"
            className="absolute right-2 top-2"
            data-testid="discount-badge"
          >
            -{discount}%
          </Badge>
        )}
        {!product.inStock && product.inStock !== undefined && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <span className="text-white font-medium">Out of Stock</span>
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 translate-y-full bg-gradient-to-t from-black/60 to-transparent p-3 transition-transform group-hover:translate-y-0">
          <div className="flex gap-2">
            {onQuickView && (
              <Button
                size="sm"
                variant="secondary"
                className="flex-1"
                onClick={(e) => {
                  e.stopPropagation();
                  onQuickView(product.id);
                }}
                data-testid="quick-view-button"
              >
                Quick View
              </Button>
            )}
            {onAddToCart && product.inStock !== false && (
              <Button
                size="sm"
                className="flex-1"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddToCart(product.id);
                }}
                data-testid="add-to-cart-button"
              >
                Add to Cart
              </Button>
            )}
          </div>
        </div>
      </div>
      <CardContent className="p-3">
        <p className="text-xs text-gray-500 mb-1">{product.category}</p>
        <h3 className="font-medium text-sm line-clamp-2 mb-1" data-testid="product-name">
          {product.name}
        </h3>
        <div className="flex items-center gap-2">
          <span className="font-semibold" data-testid="product-price">
            ${product.price.toFixed(2)}
          </span>
          {product.originalPrice && (
            <span className="text-sm text-gray-400 line-through" data-testid="original-price">
              ${product.originalPrice.toFixed(2)}
            </span>
          )}
        </div>
        {showRating && product.rating !== undefined && (
          <div className="flex items-center gap-1 mt-1" data-testid="product-rating">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <svg
                  key={star}
                  className={cn(
                    'h-3 w-3',
                    star <= product.rating! ? 'text-yellow-400' : 'text-gray-200'
                  )}
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
      </CardContent>
    </Card>
  );
}

// Product Carousel
export interface ProductCarouselProps {
  title: string;
  products: Product[];
  className?: string;
  section: string;
  showViewAll?: boolean;
  onViewAll?: () => void;
  onAddToCart?: (productId: string) => void;
  onQuickView?: (productId: string) => void;
}

export function ProductCarousel({
  title,
  products,
  className,
  section,
  showViewAll = true,
  onViewAll,
  onAddToCart,
  onQuickView,
}: ProductCarouselProps) {
  const [scrollPosition, setScrollPosition] = useState(0);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (!containerRef.current) return;
    const scrollAmount = 300;
    const newPosition = direction === 'left'
      ? Math.max(0, scrollPosition - scrollAmount)
      : scrollPosition + scrollAmount;
    containerRef.current.scrollTo({ left: newPosition, behavior: 'smooth' });
    setScrollPosition(newPosition);
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollPosition(e.currentTarget.scrollLeft);
  };

  if (products.length === 0) return null;

  return (
    <section className={cn('py-6', className)} data-testid={`carousel-${section}`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold" data-testid="carousel-title">{title}</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => scroll('left')}
            disabled={scrollPosition === 0}
            data-testid="scroll-left"
            aria-label="Scroll left"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => scroll('right')}
            data-testid="scroll-right"
            aria-label="Scroll right"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Button>
          {showViewAll && onViewAll && (
            <Button variant="link" onClick={onViewAll} data-testid="view-all">
              View All
            </Button>
          )}
        </div>
      </div>
      <div
        ref={containerRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth"
        onScroll={handleScroll}
        data-testid="product-carousel"
      >
        {products.map((product) => (
          <div key={product.id} className="min-w-[200px] max-w-[200px]">
            <ProductCard
              product={product}
              section={section}
              onAddToCart={onAddToCart}
              onQuickView={onQuickView}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

// Hero Banner
export interface HeroBannerProps {
  banner: Banner;
  className?: string;
  onCtaClick?: (bannerId: string, ctaLink: string) => void;
}

export function HeroBanner({ banner, className, onCtaClick }: HeroBannerProps) {
  return (
    <div
      className={cn(
        'relative h-[400px] md:h-[500px] overflow-hidden rounded-xl',
        className
      )}
      style={{ backgroundColor: banner.backgroundColor }}
      data-testid={`hero-banner-${banner.id}`}
    >
      <img
        src={banner.image}
        alt={banner.title}
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />
      <div className="absolute inset-0 flex flex-col justify-center p-8 md:p-12">
        <h1 className="text-3xl md:text-5xl font-bold text-white mb-2" data-testid="banner-title">
          {banner.title}
        </h1>
        {banner.subtitle && (
          <p className="text-lg md:text-xl text-white/90 mb-6" data-testid="banner-subtitle">
            {banner.subtitle}
          </p>
        )}
        <Button
          size="lg"
          onClick={() => onCtaClick?.(banner.id, banner.ctaLink)}
          data-testid="banner-cta"
        >
          {banner.ctaText}
        </Button>
      </div>
    </div>
  );
}

// Hero Carousel
export interface HeroCarouselProps {
  banners: Banner[];
  className?: string;
  autoPlayInterval?: number;
  onCtaClick?: (bannerId: string, ctaLink: string) => void;
}

export function HeroCarousel({
  banners,
  className,
  autoPlayInterval = 5000,
  onCtaClick,
}: HeroCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (banners.length <= 1 || autoPlayInterval === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [banners.length, autoPlayInterval]);

  if (banners.length === 0) return null;

  return (
    <div className={cn('relative', className)} data-testid="hero-carousel">
      <HeroBanner
        banner={banners[currentIndex]}
        onCtaClick={onCtaClick}
      />
      {banners.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {banners.map((_, index) => (
            <button
              key={index}
              className={cn(
                'h-2 w-2 rounded-full transition-all',
                index === currentIndex ? 'bg-white w-6' : 'bg-white/50'
              )}
              onClick={() => setCurrentIndex(index)}
              aria-label={`Go to slide ${index + 1}`}
              data-testid={`carousel-dot-${index}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Category Grid
export interface CategoryGridProps {
  categories: Category[];
  className?: string;
  title?: string;
  onCategoryClick?: (categoryId: string) => void;
}

export function CategoryGrid({
  categories,
  className,
  title = 'Shop by Category',
  onCategoryClick,
}: CategoryGridProps) {
  if (categories.length === 0) return null;

  return (
    <section className={cn('py-6', className)} data-testid="category-grid">
      <h2 className="text-xl font-semibold mb-4" data-testid="category-grid-title">{title}</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {categories.map((category) => (
          <button
            key={category.id}
            className="group relative aspect-square overflow-hidden rounded-lg"
            onClick={() => onCategoryClick?.(category.id)}
            data-testid={`category-${category.id}`}
          >
            <img
              src={category.image}
              alt={category.name}
              className="h-full w-full object-cover transition-transform group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
              <p className="font-medium">{category.name}</p>
              <p className="text-xs text-white/80">{category.productCount} products</p>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

// Deal of the Day
export interface DealOfTheDayProps {
  product: Product & { endTime: Date };
  className?: string;
  onAddToCart?: (productId: string) => void;
}

export function DealOfTheDay({ product, className, onAddToCart }: DealOfTheDayProps) {
  const [timeRemaining, setTimeRemaining] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
  }>({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date().getTime();
      const end = new Date(product.endTime).getTime();
      const diff = Math.max(0, end - now);

      setTimeRemaining({
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      });
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);
    return () => clearInterval(interval);
  }, [product.endTime]);

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <Card className={cn('overflow-hidden', className)} data-testid="deal-of-the-day">
      <CardHeader className="bg-red-500 text-white">
        <CardTitle className="flex items-center justify-between">
          <span>Deal of the Day</span>
          <div className="flex gap-2 text-sm" data-testid="countdown">
            <div className="bg-white/20 px-2 py-1 rounded">
              <span className="font-bold">{String(timeRemaining.hours).padStart(2, '0')}</span>h
            </div>
            <div className="bg-white/20 px-2 py-1 rounded">
              <span className="font-bold">{String(timeRemaining.minutes).padStart(2, '0')}</span>m
            </div>
            <div className="bg-white/20 px-2 py-1 rounded">
              <span className="font-bold">{String(timeRemaining.seconds).padStart(2, '0')}</span>s
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="flex flex-col md:flex-row">
          <div className="relative aspect-square md:w-1/2">
            <img
              src={product.image}
              alt={product.name}
              className="h-full w-full object-cover"
            />
            {discount > 0 && (
              <Badge variant="destructive" className="absolute left-4 top-4 text-lg px-3 py-1">
                -{discount}%
              </Badge>
            )}
          </div>
          <div className="flex flex-col justify-center p-6 md:w-1/2">
            <p className="text-sm text-gray-500 mb-1">{product.category}</p>
            <h3 className="text-xl font-semibold mb-2" data-testid="deal-name">{product.name}</h3>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl font-bold text-red-500" data-testid="deal-price">
                ${product.price.toFixed(2)}
              </span>
              {product.originalPrice && (
                <span className="text-xl text-gray-400 line-through" data-testid="deal-original-price">
                  ${product.originalPrice.toFixed(2)}
                </span>
              )}
            </div>
            {product.rating !== undefined && (
              <div className="flex items-center gap-2 mb-4">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                      key={star}
                      className={cn(
                        'h-5 w-5',
                        star <= product.rating! ? 'text-yellow-400' : 'text-gray-200'
                      )}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                {product.reviewCount !== undefined && (
                  <span className="text-sm text-gray-500">({product.reviewCount} reviews)</span>
                )}
              </div>
            )}
            <Button
              size="lg"
              className="w-full"
              onClick={() => onAddToCart?.(product.id)}
              disabled={product.inStock === false}
              data-testid="deal-add-to-cart"
            >
              {product.inStock === false ? 'Out of Stock' : 'Add to Cart'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Recently Viewed Section
export interface RecentlyViewedProps {
  className?: string;
  onAddToCart?: (productId: string) => void;
  onQuickView?: (productId: string) => void;
}

export function RecentlyViewed({ className, onAddToCart, onQuickView }: RecentlyViewedProps) {
  const { recentlyViewed, clearRecentlyViewed } = usePersonalizedHomepage();

  if (recentlyViewed.length === 0) return null;

  return (
    <section className={cn('py-6', className)} data-testid="recently-viewed">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Recently Viewed</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearRecentlyViewed}
          data-testid="clear-recently-viewed"
        >
          Clear
        </Button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {recentlyViewed.slice(0, 5).map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            section="recently-viewed"
            onAddToCart={onAddToCart}
            onQuickView={onQuickView}
          />
        ))}
      </div>
    </section>
  );
}

// Loading Skeleton
export function HomepageSkeleton() {
  return (
    <div className="space-y-8" data-testid="homepage-skeleton">
      {/* Hero skeleton */}
      <div className="h-[400px] bg-gray-200 rounded-xl animate-pulse" />

      {/* Category grid skeleton */}
      <div className="py-6">
        <div className="h-7 w-48 bg-gray-200 rounded mb-4" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="aspect-square bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>

      {/* Product carousel skeleton */}
      <div className="py-6">
        <div className="h-7 w-48 bg-gray-200 rounded mb-4" />
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="min-w-[200px] space-y-2">
              <div className="aspect-square bg-gray-200 rounded-lg animate-pulse" />
              <div className="h-4 w-3/4 bg-gray-200 rounded" />
              <div className="h-4 w-1/2 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Main Personalized Homepage Component
export interface PersonalizedHomepageProps {
  className?: string;
  userId?: string;
  fetchRecommendations?: (userId?: string) => Promise<Partial<PersonalizationData>>;
  onProductView?: (productId: string) => void;
  onProductClick?: (productId: string, section: string) => void;
  onAddToCart?: (productId: string) => void;
  onQuickView?: (productId: string) => void;
  onCategoryClick?: (categoryId: string) => void;
  onBannerClick?: (bannerId: string, ctaLink: string) => void;
  onViewAll?: (section: string) => void;
  initialData?: Partial<PersonalizationData>;
}

export function PersonalizedHomepage({
  className,
  userId,
  fetchRecommendations,
  onProductView,
  onProductClick,
  onAddToCart,
  onQuickView,
  onCategoryClick,
  onBannerClick,
  onViewAll,
  initialData,
}: PersonalizedHomepageProps) {
  return (
    <PersonalizedHomepageProvider
      userId={userId}
      fetchRecommendations={fetchRecommendations}
      onProductView={onProductView}
      onProductClick={onProductClick}
      initialData={initialData}
    >
      <PersonalizedHomepageContent
        className={className}
        onAddToCart={onAddToCart}
        onQuickView={onQuickView}
        onCategoryClick={onCategoryClick}
        onBannerClick={onBannerClick}
        onViewAll={onViewAll}
      />
    </PersonalizedHomepageProvider>
  );
}

function PersonalizedHomepageContent({
  className,
  onAddToCart,
  onQuickView,
  onCategoryClick,
  onBannerClick,
  onViewAll,
}: {
  className?: string;
  onAddToCart?: (productId: string) => void;
  onQuickView?: (productId: string) => void;
  onCategoryClick?: (categoryId: string) => void;
  onBannerClick?: (bannerId: string, ctaLink: string) => void;
  onViewAll?: (section: string) => void;
}) {
  const {
    heroBanners,
    personalizedCategories,
    dealOfTheDay,
    recommendedForYou,
    trendingProducts,
    newArrivals,
    bestSellers,
    isLoading,
    error,
  } = usePersonalizedHomepage();

  if (isLoading) {
    return <HomepageSkeleton />;
  }

  if (error) {
    return (
      <div className="text-center py-12" data-testid="homepage-error">
        <p className="text-red-500 mb-4">{error}</p>
        <Button variant="outline">Try Again</Button>
      </div>
    );
  }

  return (
    <div className={cn('space-y-8', className)} data-testid="personalized-homepage">
      {/* Hero Banners */}
      {heroBanners.length > 0 && (
        <HeroCarousel banners={heroBanners} onCtaClick={onBannerClick} />
      )}

      {/* Categories */}
      {personalizedCategories.length > 0 && (
        <CategoryGrid
          categories={personalizedCategories}
          onCategoryClick={onCategoryClick}
        />
      )}

      {/* Deal of the Day */}
      {dealOfTheDay && (
        <DealOfTheDay product={dealOfTheDay} onAddToCart={onAddToCart} />
      )}

      {/* Recommended For You */}
      {recommendedForYou.length > 0 && (
        <ProductCarousel
          title="Recommended For You"
          products={recommendedForYou}
          section="recommended"
          onAddToCart={onAddToCart}
          onQuickView={onQuickView}
          onViewAll={() => onViewAll?.('recommended')}
        />
      )}

      {/* Trending Products */}
      {trendingProducts.length > 0 && (
        <ProductCarousel
          title="Trending Now"
          products={trendingProducts}
          section="trending"
          onAddToCart={onAddToCart}
          onQuickView={onQuickView}
          onViewAll={() => onViewAll?.('trending')}
        />
      )}

      {/* New Arrivals */}
      {newArrivals.length > 0 && (
        <ProductCarousel
          title="New Arrivals"
          products={newArrivals}
          section="new-arrivals"
          onAddToCart={onAddToCart}
          onQuickView={onQuickView}
          onViewAll={() => onViewAll?.('new-arrivals')}
        />
      )}

      {/* Best Sellers */}
      {bestSellers.length > 0 && (
        <ProductCarousel
          title="Best Sellers"
          products={bestSellers}
          section="best-sellers"
          onAddToCart={onAddToCart}
          onQuickView={onQuickView}
          onViewAll={() => onViewAll?.('best-sellers')}
        />
      )}

      {/* Recently Viewed */}
      <RecentlyViewed onAddToCart={onAddToCart} onQuickView={onQuickView} />
    </div>
  );
}
