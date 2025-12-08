import { useState, useCallback } from 'react';
import {
  Share2,
  Link2,
  Mail,
  Copy,
  Check,
  Facebook,
  Twitter,
  MessageCircle,
  Send,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

export interface WishlistItem {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
}

export interface ShareWishlistConfig {
  shareUrl: string;
  wishlistName?: string;
  wishlistId?: string;
  itemCount?: number;
}

export type ShareMethod = 'copy' | 'email' | 'facebook' | 'twitter' | 'whatsapp' | 'telegram';

interface ShareWishlistProps {
  config: ShareWishlistConfig;
  onShare?: (method: ShareMethod) => void;
  className?: string;
}

/**
 * Generate sharing URLs for different platforms
 */
function getShareUrl(method: ShareMethod, config: ShareWishlistConfig): string {
  const { shareUrl, wishlistName } = config;
  const text = wishlistName
    ? `Check out my wishlist: ${wishlistName}`
    : 'Check out my wishlist!';
  const encodedText = encodeURIComponent(text);
  const encodedUrl = encodeURIComponent(shareUrl);

  switch (method) {
    case 'facebook':
      return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
    case 'twitter':
      return `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
    case 'whatsapp':
      return `https://wa.me/?text=${encodedText}%20${encodedUrl}`;
    case 'telegram':
      return `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`;
    case 'email':
      return `mailto:?subject=${encodedText}&body=${encodedText}%0A%0A${encodedUrl}`;
    default:
      return shareUrl;
  }
}

interface ShareButtonProps {
  method: ShareMethod;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  className?: string;
}

function ShareButton({ method, icon, label, onClick, className }: ShareButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-center gap-2 p-4 rounded-lg transition-colors',
        'hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500',
        className
      )}
      data-testid={`share-${method}`}
      aria-label={`Share via ${label}`}
    >
      <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gray-100">
        {icon}
      </div>
      <span className="text-sm text-gray-600">{label}</span>
    </button>
  );
}

/**
 * Share Wishlist Button - Simple button that opens share dialog
 */
export function ShareWishlistButton({
  config,
  onShare,
  className,
  variant = 'default',
}: ShareWishlistProps & { variant?: 'default' | 'icon' | 'outline' }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {variant === 'icon' ? (
          <Button
            variant="ghost"
            size="icon"
            className={className}
            data-testid="share-wishlist-button"
          >
            <Share2 className="w-5 h-5" />
          </Button>
        ) : (
          <Button
            variant={variant === 'outline' ? 'outline' : 'default'}
            className={className}
            data-testid="share-wishlist-button"
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share Wishlist
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" data-testid="share-wishlist-dialog">
        <DialogHeader>
          <DialogTitle>Share your wishlist</DialogTitle>
          <DialogDescription>
            Share your wishlist with friends and family
            {config.itemCount !== undefined && ` (${config.itemCount} items)`}
          </DialogDescription>
        </DialogHeader>
        <ShareWishlistContent
          config={config}
          onShare={(method) => {
            onShare?.(method);
            if (method !== 'copy') {
              setIsOpen(false);
            }
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

/**
 * Share Wishlist Content - The actual sharing options
 */
export function ShareWishlistContent({
  config,
  onShare,
  className,
}: ShareWishlistProps) {
  const [copied, setCopied] = useState(false);
  const [emailValue, setEmailValue] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(config.shareUrl);
      setCopied(true);
      onShare?.('copy');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [config.shareUrl, onShare]);

  const handleShareClick = useCallback(
    (method: ShareMethod) => {
      const url = getShareUrl(method, config);
      if (method === 'email') {
        window.location.href = url;
      } else {
        window.open(url, '_blank', 'width=600,height=400');
      }
      onShare?.(method);
    },
    [config, onShare]
  );

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (emailValue) {
      // In a real app, this would send an API request
      setEmailSent(true);
      onShare?.('email');
      setTimeout(() => {
        setEmailSent(false);
        setEmailValue('');
      }, 3000);
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Copy link section */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Share link</label>
        <div className="flex gap-2">
          <Input
            value={config.shareUrl}
            readOnly
            className="flex-1"
            data-testid="share-url-input"
          />
          <Button
            onClick={handleCopyLink}
            variant="outline"
            size="icon"
            data-testid="copy-link-button"
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-600" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </Button>
        </div>
        {copied && (
          <p className="text-sm text-green-600" data-testid="copied-message">
            Link copied to clipboard!
          </p>
        )}
      </div>

      {/* Social sharing */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Share via</label>
        <div className="grid grid-cols-4 gap-2" data-testid="social-share-buttons">
          <ShareButton
            method="facebook"
            icon={<Facebook className="w-6 h-6 text-blue-600" />}
            label="Facebook"
            onClick={() => handleShareClick('facebook')}
          />
          <ShareButton
            method="twitter"
            icon={<Twitter className="w-6 h-6 text-sky-500" />}
            label="Twitter"
            onClick={() => handleShareClick('twitter')}
          />
          <ShareButton
            method="whatsapp"
            icon={<MessageCircle className="w-6 h-6 text-green-600" />}
            label="WhatsApp"
            onClick={() => handleShareClick('whatsapp')}
          />
          <ShareButton
            method="telegram"
            icon={<Send className="w-6 h-6 text-blue-500" />}
            label="Telegram"
            onClick={() => handleShareClick('telegram')}
          />
        </div>
      </div>

      {/* Email sharing */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">
          Send via email
        </label>
        <form onSubmit={handleEmailSubmit} className="flex gap-2">
          <Input
            type="email"
            placeholder="Enter email address"
            value={emailValue}
            onChange={(e) => setEmailValue(e.target.value)}
            className="flex-1"
            data-testid="email-share-input"
          />
          <Button type="submit" data-testid="send-email-button">
            <Mail className="w-4 h-4 mr-2" />
            Send
          </Button>
        </form>
        {emailSent && (
          <p className="text-sm text-green-600" data-testid="email-sent-message">
            Email sent successfully!
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Inline Share Wishlist - Compact inline version
 */
export function ShareWishlistInline({
  config,
  onShare,
  className,
}: ShareWishlistProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(config.shareUrl);
      setCopied(true);
      onShare?.('copy');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleShare = (method: ShareMethod) => {
    const url = getShareUrl(method, config);
    window.open(url, '_blank', 'width=600,height=400');
    onShare?.(method);
  };

  return (
    <div
      className={cn('flex items-center gap-2', className)}
      data-testid="share-wishlist-inline"
    >
      <Button
        variant="ghost"
        size="icon"
        onClick={handleCopyLink}
        title={copied ? 'Copied!' : 'Copy link'}
        data-testid="inline-copy-button"
      >
        {copied ? (
          <Check className="w-5 h-5 text-green-600" />
        ) : (
          <Link2 className="w-5 h-5" />
        )}
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => handleShare('facebook')}
        title="Share on Facebook"
        data-testid="inline-facebook-button"
      >
        <Facebook className="w-5 h-5 text-blue-600" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => handleShare('twitter')}
        title="Share on Twitter"
        data-testid="inline-twitter-button"
      >
        <Twitter className="w-5 h-5 text-sky-500" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => handleShare('whatsapp')}
        title="Share on WhatsApp"
        data-testid="inline-whatsapp-button"
      >
        <MessageCircle className="w-5 h-5 text-green-600" />
      </Button>
    </div>
  );
}

/**
 * Share Wishlist Card - Card version for embedding
 */
export function ShareWishlistCard({
  config,
  onShare,
  items,
  className,
}: ShareWishlistProps & { items?: WishlistItem[] }) {
  return (
    <Card className={cn('', className)} data-testid="share-wishlist-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Share2 className="w-5 h-5" />
          Share Your Wishlist
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items && items.length > 0 && (
          <div className="mb-6">
            <p className="text-sm text-gray-500 mb-3">
              Sharing {items.length} item{items.length !== 1 ? 's' : ''}
            </p>
            <div
              className="flex gap-2 overflow-x-auto pb-2"
              data-testid="wishlist-preview"
            >
              {items.slice(0, 4).map((item) => (
                <div
                  key={item.id}
                  className="flex-shrink-0 w-16 h-16 rounded bg-gray-100 overflow-hidden"
                  data-testid={`preview-item-${item.id}`}
                >
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                      No image
                    </div>
                  )}
                </div>
              ))}
              {items.length > 4 && (
                <div className="flex-shrink-0 w-16 h-16 rounded bg-gray-200 flex items-center justify-center text-sm text-gray-600">
                  +{items.length - 4}
                </div>
              )}
            </div>
          </div>
        )}
        <ShareWishlistContent config={config} onShare={onShare} />
      </CardContent>
    </Card>
  );
}

/**
 * Hook to generate shareable wishlist config
 */
export function useShareableWishlist(wishlistId: string, wishlistName?: string) {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const shareUrl = `${baseUrl}/wishlist/shared/${wishlistId}`;

  return {
    shareUrl,
    wishlistId,
    wishlistName,
  };
}

export default ShareWishlistButton;
