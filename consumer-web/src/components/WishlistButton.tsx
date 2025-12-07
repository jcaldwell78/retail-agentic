import { Heart } from 'lucide-react';
import { useWishlistStore } from '@/store/wishlistStore';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useState } from 'react';

export interface WishlistButtonProps {
  product: {
    productId: string;
    variantId?: string;
    name: string;
    price: number;
    imageUrl?: string;
    inStock: boolean;
  };
  variant?: 'icon' | 'button'; // Icon for product cards, button for detail page
  className?: string;
  showToast?: boolean; // Show toast notification on add/remove
}

/**
 * Wishlist button component with heart icon animation
 *
 * Variants:
 * - icon: Floating heart icon for product cards
 * - button: Full button with text for product detail page
 *
 * Features:
 * - Animated heart fill on add
 * - Toast notifications
 * - Optimistic UI updates
 * - Accessible keyboard navigation
 */
export function WishlistButton({
  product,
  variant = 'icon',
  className,
  showToast = true,
}: WishlistButtonProps) {
  const { isInWishlist, toggleItem } = useWishlistStore();
  const [isAnimating, setIsAnimating] = useState(false);

  const saved = isInWishlist(product.productId, product.variantId);

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Trigger animation
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);

    // Toggle wishlist
    toggleItem(product);

    // Show toast notification
    if (showToast) {
      if (saved) {
        toast.success('Removed from wishlist', {
          description: `${product.name} has been removed from your wishlist.`,
        });
      } else {
        toast.success('Added to wishlist', {
          description: `${product.name} has been saved to your wishlist.`,
          action: {
            label: 'View Wishlist',
            onClick: () => {
              window.location.href = '/wishlist';
            },
          },
        });
      }
    }
  };

  if (variant === 'icon') {
    return (
      <button
        onClick={handleToggle}
        className={cn(
          'group w-10 h-10 flex items-center justify-center',
          'rounded-full bg-white/90 backdrop-blur-sm hover:bg-white',
          'shadow-md hover:shadow-lg transition-all duration-200',
          'focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:outline-none',
          isAnimating && 'animate-[heartFill_0.3s_ease-out]',
          className
        )}
        aria-label={saved ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
        aria-pressed={saved}
        title={saved ? 'Remove from wishlist' : 'Add to wishlist'}
      >
        <Heart
          className={cn(
            'w-5 h-5 transition-colors duration-200',
            saved
              ? 'fill-primary-600 text-primary-600'
              : 'text-neutral-700 group-hover:text-primary-600'
          )}
        />
      </button>
    );
  }

  // Button variant for product detail page
  return (
    <Button
      onClick={handleToggle}
      variant={saved ? 'default' : 'outline'}
      className={cn(
        'flex items-center gap-2 transition-all duration-200',
        saved && 'bg-primary-50 border-primary-600 text-primary-600 hover:bg-primary-100',
        !saved && 'border-neutral-300 hover:border-primary-600 hover:text-primary-600',
        isAnimating && 'animate-[heartFill_0.3s_ease-out]',
        className
      )}
      aria-label={saved ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
      aria-pressed={saved}
    >
      <Heart
        className={cn(
          'w-5 h-5 transition-colors duration-200',
          saved && 'fill-current'
        )}
      />
      <span className="font-semibold">{saved ? 'Saved' : 'Save'}</span>
    </Button>
  );
}

// Add heart fill animation to global CSS (add to index.css or globals.css)
// @keyframes heartFill {
//   0% { transform: scale(1); }
//   50% { transform: scale(1.3); }
//   100% { transform: scale(1); }
// }
