import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  ReactNode,
  FormEvent,
  ChangeEvent,
} from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Camera, Video, X, Image as ImageIcon, Play } from 'lucide-react';

// Types
export interface ReviewAuthor {
  id: string;
  name: string;
  avatar?: string;
  isVerifiedPurchase: boolean;
}

export interface ReviewMedia {
  id: string;
  url: string;
  type: 'image' | 'video';
  thumbnail?: string;
}

export interface Review {
  id: string;
  productId: string;
  author: ReviewAuthor;
  rating: number;
  title: string;
  content: string;
  images?: string[];
  videos?: string[];
  media?: ReviewMedia[];
  helpfulCount: number;
  notHelpfulCount: number;
  createdAt: Date;
  isRecommended?: boolean;
  pros?: string[];
  cons?: string[];
}

export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: Record<number, number>;
  recommendedPercentage: number;
}

export interface ReviewFilters {
  rating?: number;
  verified?: boolean;
  withImages?: boolean;
  sortBy: 'newest' | 'oldest' | 'helpful' | 'highest' | 'lowest';
  searchQuery?: string;
}

export interface ProductReviewsContextType {
  reviews: Review[];
  stats: ReviewStats | null;
  filters: ReviewFilters;
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  userVotes: Record<string, 'helpful' | 'notHelpful'>;
  setFilters: (filters: Partial<ReviewFilters>) => void;
  clearFilters: () => void;
  loadMore: () => Promise<void>;
  voteHelpful: (reviewId: string) => Promise<void>;
  voteNotHelpful: (reviewId: string) => Promise<void>;
  submitReview: (review: Omit<Review, 'id' | 'author' | 'helpfulCount' | 'notHelpfulCount' | 'createdAt'>) => Promise<void>;
}

// Context
const ProductReviewsContext = createContext<ProductReviewsContextType | null>(null);

export function useProductReviews(): ProductReviewsContextType {
  const context = useContext(ProductReviewsContext);
  if (!context) {
    throw new Error('useProductReviews must be used within a ProductReviewsProvider');
  }
  return context;
}

// Provider
export interface ProductReviewsProviderProps {
  children: ReactNode;
  productId: string;
  initialReviews?: Review[];
  initialStats?: ReviewStats;
  fetchReviews?: (productId: string, filters: ReviewFilters, page: number) => Promise<{ reviews: Review[]; hasMore: boolean }>;
  onVoteHelpful?: (reviewId: string) => Promise<void>;
  onVoteNotHelpful?: (reviewId: string) => Promise<void>;
  onSubmitReview?: (review: Omit<Review, 'id' | 'author' | 'helpfulCount' | 'notHelpfulCount' | 'createdAt'>) => Promise<void>;
}

const defaultFilters: ReviewFilters = {
  sortBy: 'helpful',
};

export function ProductReviewsProvider({
  children,
  productId,
  initialReviews = [],
  initialStats,
  fetchReviews,
  onVoteHelpful,
  onVoteNotHelpful,
  onSubmitReview,
}: ProductReviewsProviderProps) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [stats] = useState<ReviewStats | null>(initialStats || null);
  const [filters, setFiltersState] = useState<ReviewFilters>(defaultFilters);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [userVotes, setUserVotes] = useState<Record<string, 'helpful' | 'notHelpful'>>({});

  const setFilters = useCallback((newFilters: Partial<ReviewFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...newFilters }));
    setPage(1);
    setReviews([]);
    setHasMore(true);
  }, []);

  const clearFilters = useCallback(() => {
    setFiltersState(defaultFilters);
    setPage(1);
    setReviews([]);
    setHasMore(true);
  }, []);

  const loadMore = useCallback(async () => {
    if (!fetchReviews || isLoading || !hasMore) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchReviews(productId, filters, page);
      setReviews((prev) => [...prev, ...result.reviews]);
      setHasMore(result.hasMore);
      setPage((prev) => prev + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reviews');
    } finally {
      setIsLoading(false);
    }
  }, [fetchReviews, productId, filters, page, isLoading, hasMore]);

  const voteHelpful = useCallback(async (reviewId: string) => {
    if (userVotes[reviewId]) return;

    try {
      await onVoteHelpful?.(reviewId);
      setUserVotes((prev) => ({ ...prev, [reviewId]: 'helpful' }));
      setReviews((prev) =>
        prev.map((r) =>
          r.id === reviewId ? { ...r, helpfulCount: r.helpfulCount + 1 } : r
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to vote');
    }
  }, [onVoteHelpful, userVotes]);

  const voteNotHelpful = useCallback(async (reviewId: string) => {
    if (userVotes[reviewId]) return;

    try {
      await onVoteNotHelpful?.(reviewId);
      setUserVotes((prev) => ({ ...prev, [reviewId]: 'notHelpful' }));
      setReviews((prev) =>
        prev.map((r) =>
          r.id === reviewId ? { ...r, notHelpfulCount: r.notHelpfulCount + 1 } : r
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to vote');
    }
  }, [onVoteNotHelpful, userVotes]);

  const submitReview = useCallback(async (review: Omit<Review, 'id' | 'author' | 'helpfulCount' | 'notHelpfulCount' | 'createdAt'>) => {
    setIsLoading(true);
    setError(null);

    try {
      await onSubmitReview?.(review);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit review');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [onSubmitReview]);

  const value: ProductReviewsContextType = {
    reviews,
    stats,
    filters,
    isLoading,
    error,
    hasMore,
    userVotes,
    setFilters,
    clearFilters,
    loadMore,
    voteHelpful,
    voteNotHelpful,
    submitReview,
  };

  return (
    <ProductReviewsContext.Provider value={value}>
      {children}
    </ProductReviewsContext.Provider>
  );
}

// Components

// Star Rating Display
export interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  interactive?: boolean;
  onChange?: (rating: number) => void;
  className?: string;
}

export function StarRating({
  rating,
  maxRating = 5,
  size = 'md',
  showValue = false,
  interactive = false,
  onChange,
  className,
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0);

  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  const displayRating = hoverRating || rating;

  return (
    <div className={cn('flex items-center gap-1', className)} data-testid="star-rating">
      <div className="flex">
        {Array.from({ length: maxRating }, (_, i) => i + 1).map((star) => (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            className={cn(
              'transition-colors',
              interactive && 'cursor-pointer hover:scale-110'
            )}
            onMouseEnter={() => interactive && setHoverRating(star)}
            onMouseLeave={() => interactive && setHoverRating(0)}
            onClick={() => interactive && onChange?.(star)}
            data-testid={`star-${star}`}
            aria-label={`${star} star${star > 1 ? 's' : ''}`}
          >
            <svg
              className={cn(
                sizeClasses[size],
                star <= displayRating ? 'text-yellow-400' : 'text-gray-200'
              )}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </button>
        ))}
      </div>
      {showValue && (
        <span className="text-sm font-medium ml-1" data-testid="rating-value">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}

// ============================================================================
// Review Media Upload Component
// ============================================================================

export interface UploadedMedia {
  id: string;
  file: File;
  preview: string;
  type: 'image' | 'video';
  uploading?: boolean;
  error?: string;
}

export interface ReviewMediaUploadProps {
  media: UploadedMedia[];
  onMediaAdd: (files: File[]) => void;
  onMediaRemove: (id: string) => void;
  maxImages?: number;
  maxVideos?: number;
  maxFileSizeMB?: number;
  className?: string;
  disabled?: boolean;
}

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ACCEPTED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];

export function ReviewMediaUpload({
  media,
  onMediaAdd,
  onMediaRemove,
  maxImages = 5,
  maxVideos = 2,
  maxFileSizeMB = 50,
  className,
  disabled = false,
}: ReviewMediaUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const imageCount = media.filter((m) => m.type === 'image').length;
  const videoCount = media.filter((m) => m.type === 'video').length;

  // Image count validated in validateFile
  // Video count validated in validateFile

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    const isImage = ACCEPTED_IMAGE_TYPES.includes(file.type);
    const isVideo = ACCEPTED_VIDEO_TYPES.includes(file.type);

    if (!isImage && !isVideo) {
      return { valid: false, error: 'Unsupported file type' };
    }

    if (isImage && imageCount >= maxImages) {
      return { valid: false, error: `Maximum ${maxImages} images allowed` };
    }

    if (isVideo && videoCount >= maxVideos) {
      return { valid: false, error: `Maximum ${maxVideos} videos allowed` };
    }

    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > maxFileSizeMB) {
      return { valid: false, error: `File too large (max ${maxFileSizeMB}MB)` };
    }

    return { valid: true };
  };

  const handleFiles = (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const validFiles: File[] = [];

    for (const file of fileArray) {
      const validation = validateFile(file);
      if (validation.valid) {
        validFiles.push(file);
      }
    }

    if (validFiles.length > 0) {
      onMediaAdd(validFiles);
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
      // Reset input so same file can be selected again
      e.target.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (!disabled && e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={cn('space-y-3', className)} data-testid="review-media-upload">
      {/* Upload Area */}
      <div
        className={cn(
          'border-2 border-dashed rounded-lg p-6 text-center transition-colors',
          dragOver ? 'border-primary bg-primary/5' : 'border-gray-300',
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-primary/50'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={disabled ? undefined : openFilePicker}
        data-testid="upload-dropzone"
        role="button"
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
            openFilePicker();
          }
        }}
        aria-label="Upload photos or videos"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={[...ACCEPTED_IMAGE_TYPES, ...ACCEPTED_VIDEO_TYPES].join(',')}
          multiple
          onChange={handleInputChange}
          className="hidden"
          disabled={disabled}
          data-testid="file-input"
        />

        <div className="flex flex-col items-center gap-2">
          <div className="flex gap-2">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Camera className="h-5 w-5 text-primary" />
            </div>
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Video className="h-5 w-5 text-primary" />
            </div>
          </div>
          <div>
            <p className="font-medium text-sm">
              {dragOver ? 'Drop files here' : 'Add photos or videos'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Drag & drop or click to select
            </p>
          </div>
        </div>
      </div>

      {/* Limits Info */}
      <div className="flex justify-between text-xs text-muted-foreground">
        <span data-testid="image-count">
          {imageCount}/{maxImages} photos
        </span>
        <span data-testid="video-count">
          {videoCount}/{maxVideos} videos
        </span>
        <span>Max {maxFileSizeMB}MB each</span>
      </div>

      {/* Media Preview Grid */}
      {media.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2" data-testid="media-preview-grid">
          {media.map((item) => (
            <MediaPreviewItem
              key={item.id}
              media={item}
              onRemove={() => onMediaRemove(item.id)}
              disabled={disabled}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Media Preview Item
interface MediaPreviewItemProps {
  media: UploadedMedia;
  onRemove: () => void;
  disabled?: boolean;
}

function MediaPreviewItem({ media, onRemove, disabled }: MediaPreviewItemProps) {
  return (
    <div
      className="relative aspect-square group"
      data-testid={`media-item-${media.id}`}
    >
      {media.type === 'image' ? (
        <img
          src={media.preview}
          alt="Review media"
          className="w-full h-full object-cover rounded-lg"
        />
      ) : (
        <div className="w-full h-full relative rounded-lg overflow-hidden bg-gray-900">
          <video
            src={media.preview}
            className="w-full h-full object-cover"
            muted
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <Play className="h-8 w-8 text-white fill-white" />
          </div>
        </div>
      )}

      {/* Upload Status */}
      {media.uploading && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
          <div className="animate-spin h-6 w-6 border-2 border-white border-t-transparent rounded-full" />
        </div>
      )}

      {/* Error Overlay */}
      {media.error && (
        <div className="absolute inset-0 bg-red-500/50 flex items-center justify-center rounded-lg">
          <span className="text-white text-xs px-1 text-center">{media.error}</span>
        </div>
      )}

      {/* Type Badge */}
      <div className="absolute bottom-1 left-1">
        {media.type === 'image' ? (
          <ImageIcon className="h-4 w-4 text-white drop-shadow" />
        ) : (
          <Video className="h-4 w-4 text-white drop-shadow" />
        )}
      </div>

      {/* Remove Button */}
      {!disabled && (
        <button
          type="button"
          className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 text-white flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          aria-label="Remove media"
          data-testid={`remove-media-${media.id}`}
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

// Media Gallery (for viewing review media)
export interface MediaGalleryProps {
  media: ReviewMedia[];
  images?: string[];
  videos?: string[];
  className?: string;
}

export function MediaGallery({ media, images = [], videos = [], className }: MediaGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // Combine legacy images/videos with new media format
  const allMedia: ReviewMedia[] = [
    ...(media || []),
    ...images.map((url, i) => ({ id: `img-${i}`, url, type: 'image' as const })),
    ...videos.map((url, i) => ({ id: `vid-${i}`, url, type: 'video' as const })),
  ];

  if (allMedia.length === 0) return null;

  return (
    <div className={cn('space-y-2', className)} data-testid="media-gallery">
      {/* Thumbnails */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {allMedia.map((item, index) => (
          <button
            key={item.id}
            type="button"
            className={cn(
              'flex-shrink-0 h-16 w-16 rounded-lg overflow-hidden border-2 transition-colors',
              selectedIndex === index ? 'border-primary' : 'border-transparent hover:border-gray-300'
            )}
            onClick={() => setSelectedIndex(index)}
            data-testid={`gallery-thumb-${index}`}
          >
            {item.type === 'image' ? (
              <img
                src={item.thumbnail || item.url}
                alt={`Review media ${index + 1}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-900 flex items-center justify-center relative">
                {item.thumbnail && (
                  <img
                    src={item.thumbnail}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                )}
                <Play className="h-6 w-6 text-white fill-white relative z-10" />
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Selected Preview */}
      {selectedIndex !== null && (
        <div
          className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden"
          data-testid="gallery-preview"
        >
          {allMedia[selectedIndex].type === 'image' ? (
            <img
              src={allMedia[selectedIndex].url}
              alt="Review media"
              className="w-full h-full object-contain"
            />
          ) : (
            <video
              src={allMedia[selectedIndex].url}
              controls
              className="w-full h-full"
              data-testid="video-player"
            />
          )}
          <button
            type="button"
            className="absolute top-2 right-2 h-8 w-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70"
            onClick={() => setSelectedIndex(null)}
            aria-label="Close preview"
            data-testid="close-preview"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
}

// Rating Summary
export interface RatingSummaryProps {
  stats: ReviewStats;
  className?: string;
  onRatingClick?: (rating: number) => void;
}

export function RatingSummary({ stats, className, onRatingClick }: RatingSummaryProps) {
  const maxCount = Math.max(...Object.values(stats.ratingDistribution), 1);

  return (
    <Card className={className} data-testid="rating-summary">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Overall Rating */}
          <div className="text-center md:text-left">
            <div className="text-5xl font-bold" data-testid="average-rating">
              {stats.averageRating.toFixed(1)}
            </div>
            <StarRating rating={stats.averageRating} size="lg" />
            <p className="text-sm text-gray-500 mt-1" data-testid="total-reviews">
              Based on {stats.totalReviews} review{stats.totalReviews !== 1 ? 's' : ''}
            </p>
            {stats.recommendedPercentage > 0 && (
              <p className="text-sm text-green-600 mt-2" data-testid="recommended-percentage">
                {stats.recommendedPercentage}% would recommend
              </p>
            )}
          </div>

          {/* Rating Distribution */}
          <div className="flex-1 space-y-2" data-testid="rating-distribution">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = stats.ratingDistribution[rating] || 0;
              const percentage = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;

              return (
                <button
                  key={rating}
                  className="w-full flex items-center gap-2 group"
                  onClick={() => onRatingClick?.(rating)}
                  data-testid={`rating-bar-${rating}`}
                >
                  <span className="w-12 text-sm text-right">
                    {rating} star{rating > 1 ? 's' : ''}
                  </span>
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-400 transition-all group-hover:bg-yellow-500"
                      style={{ width: `${(count / maxCount) * 100}%` }}
                    />
                  </div>
                  <span className="w-16 text-sm text-gray-500 text-left">
                    {count} ({percentage.toFixed(0)}%)
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Review Filters
export interface ReviewFiltersBarProps {
  className?: string;
}

export function ReviewFiltersBar({ className }: ReviewFiltersBarProps) {
  const { filters, setFilters, clearFilters } = useProductReviews();

  const hasActiveFilters = filters.rating !== undefined ||
    filters.verified !== undefined ||
    filters.withImages !== undefined ||
    filters.searchQuery !== undefined;

  return (
    <div className={cn('space-y-4', className)} data-testid="review-filters">
      {/* Sort and Search */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <Input
            type="search"
            placeholder="Search reviews..."
            value={filters.searchQuery || ''}
            onChange={(e) => setFilters({ searchQuery: e.target.value || undefined })}
            data-testid="search-reviews"
          />
        </div>
        <select
          className="px-3 py-2 border rounded-md"
          value={filters.sortBy}
          onChange={(e) => setFilters({ sortBy: e.target.value as ReviewFilters['sortBy'] })}
          data-testid="sort-reviews"
        >
          <option value="helpful">Most Helpful</option>
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="highest">Highest Rating</option>
          <option value="lowest">Lowest Rating</option>
        </select>
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap gap-2">
        {[5, 4, 3, 2, 1].map((rating) => (
          <button
            key={rating}
            className={cn(
              'px-3 py-1 rounded-full border text-sm transition-colors',
              filters.rating === rating
                ? 'bg-yellow-100 border-yellow-400 text-yellow-800'
                : 'hover:bg-gray-100'
            )}
            onClick={() => setFilters({ rating: filters.rating === rating ? undefined : rating })}
            data-testid={`filter-rating-${rating}`}
          >
            {rating} Star{rating > 1 ? 's' : ''}
          </button>
        ))}

        <button
          className={cn(
            'px-3 py-1 rounded-full border text-sm transition-colors',
            filters.verified
              ? 'bg-green-100 border-green-400 text-green-800'
              : 'hover:bg-gray-100'
          )}
          onClick={() => setFilters({ verified: !filters.verified })}
          data-testid="filter-verified"
        >
          Verified Purchase
        </button>

        <button
          className={cn(
            'px-3 py-1 rounded-full border text-sm transition-colors',
            filters.withImages
              ? 'bg-blue-100 border-blue-400 text-blue-800'
              : 'hover:bg-gray-100'
          )}
          onClick={() => setFilters({ withImages: !filters.withImages })}
          data-testid="filter-with-images"
        >
          With Photos
        </button>

        {hasActiveFilters && (
          <button
            className="px-3 py-1 rounded-full border text-sm text-red-600 hover:bg-red-50"
            onClick={clearFilters}
            data-testid="clear-filters"
          >
            Clear All
          </button>
        )}
      </div>
    </div>
  );
}

// Single Review Card
export interface ReviewCardProps {
  review: Review;
  className?: string;
}

export function ReviewCard({ review: reviewProp, className }: ReviewCardProps) {
  const { voteHelpful, voteNotHelpful, userVotes, reviews } = useProductReviews();
  // Get review from context if available (for updated counts), fallback to prop
  const review = reviews.find((r) => r.id === reviewProp.id) || reviewProp;
  const userVote = userVotes[review.id];

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Card className={className} data-testid={`review-${review.id}`}>
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            {review.author.avatar ? (
              <img
                src={review.author.avatar}
                alt={review.author.name}
                className="h-10 w-10 rounded-full"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                <span className="text-gray-600 font-medium">
                  {review.author.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <p className="font-medium" data-testid="review-author">
                {review.author.name}
              </p>
              {review.author.isVerifiedPurchase && (
                <Badge variant="secondary" className="text-xs" data-testid="verified-badge">
                  Verified Purchase
                </Badge>
              )}
            </div>
          </div>
          <span className="text-sm text-gray-500" data-testid="review-date">
            {formatDate(review.createdAt)}
          </span>
        </div>

        {/* Rating and Title */}
        <div className="mb-2">
          <StarRating rating={review.rating} size="sm" />
          <h4 className="font-semibold mt-1" data-testid="review-title">
            {review.title}
          </h4>
        </div>

        {/* Content */}
        <p className="text-gray-700 mb-3" data-testid="review-content">
          {review.content}
        </p>

        {/* Pros and Cons */}
        {(review.pros?.length || review.cons?.length) && (
          <div className="grid grid-cols-2 gap-4 mb-3">
            {review.pros && review.pros.length > 0 && (
              <div data-testid="review-pros">
                <p className="text-sm font-medium text-green-600 mb-1">Pros</p>
                <ul className="text-sm text-gray-600 space-y-1">
                  {review.pros.map((pro, i) => (
                    <li key={i} className="flex items-center gap-1">
                      <span className="text-green-500">+</span> {pro}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {review.cons && review.cons.length > 0 && (
              <div data-testid="review-cons">
                <p className="text-sm font-medium text-red-600 mb-1">Cons</p>
                <ul className="text-sm text-gray-600 space-y-1">
                  {review.cons.map((con, i) => (
                    <li key={i} className="flex items-center gap-1">
                      <span className="text-red-500">-</span> {con}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Media (Images & Videos) */}
        {((review.images && review.images.length > 0) ||
          (review.videos && review.videos.length > 0) ||
          (review.media && review.media.length > 0)) && (
          <div className="mb-3" data-testid="review-media">
            <MediaGallery
              media={review.media || []}
              images={review.images}
              videos={review.videos}
            />
          </div>
        )}

        {/* Recommendation */}
        {review.isRecommended !== undefined && (
          <p className="text-sm mb-3" data-testid="review-recommendation">
            {review.isRecommended ? (
              <span className="text-green-600">✓ Would recommend this product</span>
            ) : (
              <span className="text-gray-500">Would not recommend this product</span>
            )}
          </p>
        )}

        {/* Helpful Voting */}
        <div className="flex items-center gap-4 pt-3 border-t">
          <span className="text-sm text-gray-500">Was this review helpful?</span>
          <button
            className={cn(
              'flex items-center gap-1 text-sm',
              userVote === 'helpful' ? 'text-green-600 font-medium' : 'text-gray-600 hover:text-green-600'
            )}
            onClick={() => voteHelpful(review.id)}
            disabled={!!userVote}
            data-testid="vote-helpful"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
            </svg>
            Yes ({review.helpfulCount})
          </button>
          <button
            className={cn(
              'flex items-center gap-1 text-sm',
              userVote === 'notHelpful' ? 'text-red-600 font-medium' : 'text-gray-600 hover:text-red-600'
            )}
            onClick={() => voteNotHelpful(review.id)}
            disabled={!!userVote}
            data-testid="vote-not-helpful"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
            </svg>
            No ({review.notHelpfulCount})
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

// Review List
export interface ReviewListProps {
  className?: string;
}

export function ReviewList({ className }: ReviewListProps) {
  const { reviews, isLoading, hasMore, loadMore, error } = useProductReviews();

  return (
    <div className={cn('space-y-4', className)} data-testid="review-list">
      {reviews.map((review) => (
        <ReviewCard key={review.id} review={review} />
      ))}

      {isLoading && (
        <div className="text-center py-4" data-testid="loading-reviews">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
        </div>
      )}

      {error && (
        <div className="text-center py-4 text-red-500" data-testid="review-error">
          {error}
        </div>
      )}

      {!isLoading && hasMore && reviews.length > 0 && (
        <div className="text-center pt-4">
          <Button variant="outline" onClick={loadMore} data-testid="load-more">
            Load More Reviews
          </Button>
        </div>
      )}

      {!isLoading && reviews.length === 0 && (
        <div className="text-center py-8 text-gray-500" data-testid="no-reviews">
          No reviews yet. Be the first to review this product!
        </div>
      )}
    </div>
  );
}

// Review Form
export interface ReviewFormProps {
  productId: string;
  className?: string;
  onSuccess?: () => void;
}

// Helper to generate unique IDs
const generateMediaId = () => `media-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export function ReviewForm({ productId, className, onSuccess }: ReviewFormProps) {
  const { submitReview, isLoading, error } = useProductReviews();
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isRecommended, setIsRecommended] = useState<boolean | undefined>(undefined);
  const [pros, setPros] = useState('');
  const [cons, setCons] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [uploadedMedia, setUploadedMedia] = useState<UploadedMedia[]>([]);

  const handleMediaAdd = useCallback((files: File[]) => {
    const newMedia: UploadedMedia[] = files.map((file) => ({
      id: generateMediaId(),
      file,
      preview: URL.createObjectURL(file),
      type: file.type.startsWith('video/') ? 'video' : 'image',
    }));
    setUploadedMedia((prev) => [...prev, ...newMedia]);
  }, []);

  const handleMediaRemove = useCallback((id: string) => {
    setUploadedMedia((prev) => {
      const item = prev.find((m) => m.id === id);
      if (item) {
        URL.revokeObjectURL(item.preview);
      }
      return prev.filter((m) => m.id !== id);
    });
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (rating === 0) {
      setFormError('Please select a rating');
      return;
    }

    if (!title.trim()) {
      setFormError('Please enter a title');
      return;
    }

    if (!content.trim()) {
      setFormError('Please enter a review');
      return;
    }

    // Separate images and videos from uploaded media
    const images = uploadedMedia.filter((m) => m.type === 'image').map((m) => m.preview);
    const videos = uploadedMedia.filter((m) => m.type === 'video').map((m) => m.preview);

    try {
      await submitReview({
        productId,
        rating,
        title,
        content,
        isRecommended,
        pros: pros.split('\n').filter((p) => p.trim()),
        cons: cons.split('\n').filter((c) => c.trim()),
        images: images.length > 0 ? images : undefined,
        videos: videos.length > 0 ? videos : undefined,
      });

      // Clean up object URLs
      uploadedMedia.forEach((m) => URL.revokeObjectURL(m.preview));

      // Reset form
      setRating(0);
      setTitle('');
      setContent('');
      setIsRecommended(undefined);
      setPros('');
      setCons('');
      setUploadedMedia([]);
      onSuccess?.();
    } catch {
      // Error is handled by context
    }
  };

  return (
    <Card className={className} data-testid="review-form">
      <CardHeader>
        <CardTitle>Write a Review</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Rating */}
          <div>
            <label className="block text-sm font-medium mb-2">Your Rating *</label>
            <StarRating
              rating={rating}
              size="lg"
              interactive
              onChange={setRating}
            />
          </div>

          {/* Title */}
          <div>
            <label htmlFor="review-title" className="block text-sm font-medium mb-1">
              Review Title *
            </label>
            <Input
              id="review-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Sum up your review in a few words"
              data-testid="review-title-input"
            />
          </div>

          {/* Content */}
          <div>
            <label htmlFor="review-content" className="block text-sm font-medium mb-1">
              Your Review *
            </label>
            <textarea
              id="review-content"
              className="w-full px-3 py-2 border rounded-md min-h-[120px]"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Tell us about your experience with this product"
              data-testid="review-content-input"
            />
          </div>

          {/* Media Upload */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Add Photos or Videos (optional)
            </label>
            <ReviewMediaUpload
              media={uploadedMedia}
              onMediaAdd={handleMediaAdd}
              onMediaRemove={handleMediaRemove}
              disabled={isLoading}
            />
          </div>

          {/* Pros and Cons */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="review-pros" className="block text-sm font-medium mb-1">
                Pros (one per line)
              </label>
              <textarea
                id="review-pros"
                className="w-full px-3 py-2 border rounded-md min-h-[80px]"
                value={pros}
                onChange={(e) => setPros(e.target.value)}
                placeholder="What did you like?"
                data-testid="review-pros-input"
              />
            </div>
            <div>
              <label htmlFor="review-cons" className="block text-sm font-medium mb-1">
                Cons (one per line)
              </label>
              <textarea
                id="review-cons"
                className="w-full px-3 py-2 border rounded-md min-h-[80px]"
                value={cons}
                onChange={(e) => setCons(e.target.value)}
                placeholder="What could be improved?"
                data-testid="review-cons-input"
              />
            </div>
          </div>

          {/* Recommendation */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Would you recommend this product?
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="recommend"
                  checked={isRecommended === true}
                  onChange={() => setIsRecommended(true)}
                  data-testid="recommend-yes"
                />
                Yes
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="recommend"
                  checked={isRecommended === false}
                  onChange={() => setIsRecommended(false)}
                  data-testid="recommend-no"
                />
                No
              </label>
            </div>
          </div>

          {/* Error */}
          {(formError || error) && (
            <p className="text-red-500 text-sm" data-testid="form-error">
              {formError || error}
            </p>
          )}

          {/* Submit */}
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
            data-testid="submit-review"
          >
            {isLoading ? 'Submitting...' : 'Submit Review'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// Main Product Reviews Component
export interface ProductReviewsProps {
  productId: string;
  className?: string;
  initialReviews?: Review[];
  initialStats?: ReviewStats;
  fetchReviews?: (productId: string, filters: ReviewFilters, page: number) => Promise<{ reviews: Review[]; hasMore: boolean }>;
  onVoteHelpful?: (reviewId: string) => Promise<void>;
  onVoteNotHelpful?: (reviewId: string) => Promise<void>;
  onSubmitReview?: (review: Omit<Review, 'id' | 'author' | 'helpfulCount' | 'notHelpfulCount' | 'createdAt'>) => Promise<void>;
  showForm?: boolean;
}

export function ProductReviews({
  productId,
  className,
  initialReviews,
  initialStats,
  fetchReviews,
  onVoteHelpful,
  onVoteNotHelpful,
  onSubmitReview,
  showForm = true,
}: ProductReviewsProps) {
  return (
    <ProductReviewsProvider
      productId={productId}
      initialReviews={initialReviews}
      initialStats={initialStats}
      fetchReviews={fetchReviews}
      onVoteHelpful={onVoteHelpful}
      onVoteNotHelpful={onVoteNotHelpful}
      onSubmitReview={onSubmitReview}
    >
      <div className={cn('space-y-6', className)} data-testid="product-reviews">
        {initialStats && (
          <RatingSummary stats={initialStats} />
        )}

        {showForm && (
          <ReviewForm productId={productId} />
        )}

        <ReviewFiltersBar />
        <ReviewList />
      </div>
    </ProductReviewsProvider>
  );
}
