import {
  ShieldCheck,
  Lock,
  Truck,
  RotateCcw,
  CreditCard,
  Award,
  Clock,
  CheckCircle,
  Star,
  BadgeCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type TrustBadgeType =
  | 'secure-checkout'
  | 'ssl-encrypted'
  | 'free-shipping'
  | 'money-back'
  | 'secure-payment'
  | 'verified-seller'
  | 'fast-delivery'
  | 'quality-guarantee'
  | 'best-price'
  | 'authentic-products';

interface TrustBadgeConfig {
  icon: React.ElementType;
  label: string;
  description: string;
  color: string;
  bgColor: string;
}

const BADGE_CONFIGS: Record<TrustBadgeType, TrustBadgeConfig> = {
  'secure-checkout': {
    icon: Lock,
    label: 'Secure Checkout',
    description: '256-bit SSL encryption',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  'ssl-encrypted': {
    icon: ShieldCheck,
    label: 'SSL Encrypted',
    description: 'Your data is protected',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  'free-shipping': {
    icon: Truck,
    label: 'Free Shipping',
    description: 'On orders over $50',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
  'money-back': {
    icon: RotateCcw,
    label: '30-Day Returns',
    description: 'Money-back guarantee',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
  },
  'secure-payment': {
    icon: CreditCard,
    label: 'Secure Payment',
    description: 'All major cards accepted',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
  },
  'verified-seller': {
    icon: BadgeCheck,
    label: 'Verified Seller',
    description: 'Trusted by thousands',
    color: 'text-teal-600',
    bgColor: 'bg-teal-50',
  },
  'fast-delivery': {
    icon: Clock,
    label: 'Fast Delivery',
    description: '2-5 business days',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
  },
  'quality-guarantee': {
    icon: Award,
    label: 'Quality Guarantee',
    description: 'Premium products only',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
  },
  'best-price': {
    icon: Star,
    label: 'Best Price',
    description: 'Price match guarantee',
    color: 'text-pink-600',
    bgColor: 'bg-pink-50',
  },
  'authentic-products': {
    icon: CheckCircle,
    label: '100% Authentic',
    description: 'Genuine products',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
  },
};

interface TrustBadgeProps {
  type: TrustBadgeType;
  variant?: 'default' | 'compact' | 'icon-only';
  className?: string;
}

/**
 * Single Trust Badge
 */
export function TrustBadge({
  type,
  variant = 'default',
  className,
}: TrustBadgeProps) {
  const config = BADGE_CONFIGS[type];
  const Icon = config.icon;

  if (variant === 'icon-only') {
    return (
      <div
        className={cn(
          'p-2 rounded-full',
          config.bgColor,
          config.color,
          className
        )}
        title={config.label}
        data-testid={`trust-badge-${type}`}
      >
        <Icon className="w-5 h-5" />
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm',
          config.bgColor,
          className
        )}
        data-testid={`trust-badge-${type}`}
      >
        <Icon className={cn('w-4 h-4', config.color)} />
        <span className={cn('font-medium', config.color)}>{config.label}</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg',
        config.bgColor,
        className
      )}
      data-testid={`trust-badge-${type}`}
    >
      <div className={cn('p-2 rounded-full bg-white', config.color)}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className={cn('font-semibold text-sm', config.color)}>{config.label}</p>
        <p className="text-xs text-gray-600">{config.description}</p>
      </div>
    </div>
  );
}

interface TrustBadgesRowProps {
  badges?: TrustBadgeType[];
  variant?: 'default' | 'compact' | 'icon-only';
  className?: string;
}

/**
 * Row of Trust Badges
 */
export function TrustBadgesRow({
  badges = ['secure-checkout', 'free-shipping', 'money-back', 'secure-payment'],
  variant = 'compact',
  className,
}: TrustBadgesRowProps) {
  return (
    <div
      className={cn(
        'flex flex-wrap gap-2 items-center',
        variant === 'icon-only' && 'gap-1',
        className
      )}
      data-testid="trust-badges-row"
    >
      {badges.map((badge) => (
        <TrustBadge key={badge} type={badge} variant={variant} />
      ))}
    </div>
  );
}

interface TrustBadgesGridProps {
  badges?: TrustBadgeType[];
  columns?: 2 | 3 | 4;
  className?: string;
}

/**
 * Grid of Trust Badges - Full display with descriptions
 */
export function TrustBadgesGrid({
  badges = [
    'secure-checkout',
    'free-shipping',
    'money-back',
    'secure-payment',
  ],
  columns = 2,
  className,
}: TrustBadgesGridProps) {
  const gridCols = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div
      className={cn('grid gap-3', gridCols[columns], className)}
      data-testid="trust-badges-grid"
    >
      {badges.map((badge) => (
        <TrustBadge key={badge} type={badge} variant="default" />
      ))}
    </div>
  );
}

interface SecurityIndicatorsProps {
  showSSL?: boolean;
  showPaymentIcons?: boolean;
  className?: string;
}

/**
 * Security Indicators for Checkout
 */
export function SecurityIndicators({
  showSSL = true,
  showPaymentIcons = true,
  className,
}: SecurityIndicatorsProps) {
  return (
    <div
      className={cn('space-y-4', className)}
      data-testid="security-indicators"
    >
      {showSSL && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Lock className="w-4 h-4 text-green-600" />
          <span>Your connection is secure</span>
          <ShieldCheck className="w-4 h-4 text-green-600 ml-auto" />
          <span className="text-green-600 font-medium">SSL Encrypted</span>
        </div>
      )}

      {showPaymentIcons && (
        <div className="border-t pt-4">
          <p className="text-xs text-gray-500 mb-2">Accepted Payment Methods</p>
          <div className="flex items-center gap-3">
            {/* Payment method icons (using placeholders) */}
            <div className="flex items-center justify-center w-12 h-8 bg-blue-600 rounded text-white text-xs font-bold">
              VISA
            </div>
            <div className="flex items-center justify-center w-12 h-8 bg-red-500 rounded text-white text-xs font-bold">
              MC
            </div>
            <div className="flex items-center justify-center w-12 h-8 bg-blue-400 rounded text-white text-xs font-bold">
              AMEX
            </div>
            <div className="flex items-center justify-center w-12 h-8 bg-yellow-400 rounded text-blue-800 text-xs font-bold">
              PP
            </div>
            <div className="flex items-center justify-center w-12 h-8 bg-black rounded text-white text-xs font-bold">
              GPay
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface CheckoutTrustSectionProps {
  className?: string;
}

/**
 * Full Trust Section for Checkout Page
 */
export function CheckoutTrustSection({ className }: CheckoutTrustSectionProps) {
  return (
    <div
      className={cn('bg-gray-50 rounded-lg p-6 space-y-6', className)}
      data-testid="checkout-trust-section"
    >
      <div className="flex items-center gap-2 text-lg font-semibold text-gray-900">
        <ShieldCheck className="w-5 h-5 text-green-600" />
        <span>Shop with Confidence</span>
      </div>

      <TrustBadgesGrid
        badges={['secure-checkout', 'money-back', 'free-shipping', 'fast-delivery']}
        columns={2}
      />

      <SecurityIndicators showSSL showPaymentIcons />

      <div className="border-t pt-4 text-center">
        <p className="text-xs text-gray-500">
          Your personal information is protected by industry-standard security measures.
          We never store your complete card details.
        </p>
      </div>
    </div>
  );
}

/**
 * Minimal Footer Trust Strip
 */
export function FooterTrustStrip({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-center gap-6 py-4 bg-gray-100',
        className
      )}
      data-testid="footer-trust-strip"
    >
      <TrustBadgesRow
        badges={['secure-checkout', 'money-back', 'free-shipping', 'verified-seller']}
        variant="icon-only"
      />
      <div className="h-6 w-px bg-gray-300 hidden sm:block" />
      <div className="flex items-center gap-1 text-sm text-gray-600">
        <Lock className="w-4 h-4 text-green-600" />
        <span>Secure Shopping</span>
      </div>
    </div>
  );
}

export default TrustBadge;
