import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  TrustBadge,
  TrustBadgesRow,
  TrustBadgesGrid,
  SecurityIndicators,
  CheckoutTrustSection,
  FooterTrustStrip,
  type TrustBadgeType,
} from './TrustBadges';

describe('TrustBadge', () => {
  const badgeTypes: TrustBadgeType[] = [
    'secure-checkout',
    'ssl-encrypted',
    'free-shipping',
    'money-back',
    'secure-payment',
    'verified-seller',
    'fast-delivery',
    'quality-guarantee',
    'best-price',
    'authentic-products',
  ];

  describe('Default variant', () => {
    it.each(badgeTypes)('should render %s badge', (type) => {
      render(<TrustBadge type={type} />);
      expect(screen.getByTestId(`trust-badge-${type}`)).toBeInTheDocument();
    });

    it('should display label and description', () => {
      render(<TrustBadge type="secure-checkout" />);
      expect(screen.getByText('Secure Checkout')).toBeInTheDocument();
      expect(screen.getByText('256-bit SSL encryption')).toBeInTheDocument();
    });
  });

  describe('Compact variant', () => {
    it('should render compact badge', () => {
      render(<TrustBadge type="free-shipping" variant="compact" />);
      expect(screen.getByTestId('trust-badge-free-shipping')).toBeInTheDocument();
      expect(screen.getByText('Free Shipping')).toBeInTheDocument();
    });

    it('should not display description in compact mode', () => {
      render(<TrustBadge type="free-shipping" variant="compact" />);
      expect(screen.queryByText('On orders over $50')).not.toBeInTheDocument();
    });
  });

  describe('Icon-only variant', () => {
    it('should render icon-only badge', () => {
      render(<TrustBadge type="money-back" variant="icon-only" />);
      const badge = screen.getByTestId('trust-badge-money-back');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveAttribute('title', '30-Day Returns');
    });

    it('should not display text in icon-only mode', () => {
      render(<TrustBadge type="money-back" variant="icon-only" />);
      expect(screen.queryByText('30-Day Returns')).not.toBeInTheDocument();
    });
  });
});

describe('TrustBadgesRow', () => {
  it('should render row with default badges', () => {
    render(<TrustBadgesRow />);
    expect(screen.getByTestId('trust-badges-row')).toBeInTheDocument();
    expect(screen.getByTestId('trust-badge-secure-checkout')).toBeInTheDocument();
    expect(screen.getByTestId('trust-badge-free-shipping')).toBeInTheDocument();
    expect(screen.getByTestId('trust-badge-money-back')).toBeInTheDocument();
    expect(screen.getByTestId('trust-badge-secure-payment')).toBeInTheDocument();
  });

  it('should render custom badges', () => {
    render(<TrustBadgesRow badges={['ssl-encrypted', 'verified-seller']} />);
    expect(screen.getByTestId('trust-badge-ssl-encrypted')).toBeInTheDocument();
    expect(screen.getByTestId('trust-badge-verified-seller')).toBeInTheDocument();
    expect(screen.queryByTestId('trust-badge-secure-checkout')).not.toBeInTheDocument();
  });

  it('should render with compact variant', () => {
    render(<TrustBadgesRow variant="compact" />);
    expect(screen.getByText('Secure Checkout')).toBeInTheDocument();
  });

  it('should render with icon-only variant', () => {
    render(<TrustBadgesRow variant="icon-only" />);
    expect(screen.queryByText('Secure Checkout')).not.toBeInTheDocument();
  });
});

describe('TrustBadgesGrid', () => {
  it('should render grid with default badges', () => {
    render(<TrustBadgesGrid />);
    expect(screen.getByTestId('trust-badges-grid')).toBeInTheDocument();
    expect(screen.getByTestId('trust-badge-secure-checkout')).toBeInTheDocument();
    expect(screen.getByTestId('trust-badge-free-shipping')).toBeInTheDocument();
    expect(screen.getByTestId('trust-badge-money-back')).toBeInTheDocument();
    expect(screen.getByTestId('trust-badge-secure-payment')).toBeInTheDocument();
  });

  it('should render custom badges', () => {
    render(<TrustBadgesGrid badges={['fast-delivery', 'quality-guarantee']} />);
    expect(screen.getByTestId('trust-badge-fast-delivery')).toBeInTheDocument();
    expect(screen.getByTestId('trust-badge-quality-guarantee')).toBeInTheDocument();
  });

  it('should display descriptions in grid', () => {
    render(<TrustBadgesGrid badges={['secure-checkout']} />);
    expect(screen.getByText('Secure Checkout')).toBeInTheDocument();
    expect(screen.getByText('256-bit SSL encryption')).toBeInTheDocument();
  });

  it('should accept different column configurations', () => {
    const { rerender } = render(<TrustBadgesGrid columns={2} />);
    expect(screen.getByTestId('trust-badges-grid')).toBeInTheDocument();

    rerender(<TrustBadgesGrid columns={3} />);
    expect(screen.getByTestId('trust-badges-grid')).toBeInTheDocument();

    rerender(<TrustBadgesGrid columns={4} />);
    expect(screen.getByTestId('trust-badges-grid')).toBeInTheDocument();
  });
});

describe('SecurityIndicators', () => {
  it('should render security indicators', () => {
    render(<SecurityIndicators />);
    expect(screen.getByTestId('security-indicators')).toBeInTheDocument();
  });

  it('should display SSL indicator by default', () => {
    render(<SecurityIndicators />);
    expect(screen.getByText('Your connection is secure')).toBeInTheDocument();
    expect(screen.getByText('SSL Encrypted')).toBeInTheDocument();
  });

  it('should display payment icons by default', () => {
    render(<SecurityIndicators />);
    expect(screen.getByText('Accepted Payment Methods')).toBeInTheDocument();
    expect(screen.getByText('VISA')).toBeInTheDocument();
    expect(screen.getByText('MC')).toBeInTheDocument();
    expect(screen.getByText('AMEX')).toBeInTheDocument();
    expect(screen.getByText('PP')).toBeInTheDocument();
    expect(screen.getByText('GPay')).toBeInTheDocument();
  });

  it('should hide SSL when showSSL is false', () => {
    render(<SecurityIndicators showSSL={false} />);
    expect(screen.queryByText('Your connection is secure')).not.toBeInTheDocument();
  });

  it('should hide payment icons when showPaymentIcons is false', () => {
    render(<SecurityIndicators showPaymentIcons={false} />);
    expect(screen.queryByText('Accepted Payment Methods')).not.toBeInTheDocument();
    expect(screen.queryByText('VISA')).not.toBeInTheDocument();
  });
});

describe('CheckoutTrustSection', () => {
  it('should render checkout trust section', () => {
    render(<CheckoutTrustSection />);
    expect(screen.getByTestId('checkout-trust-section')).toBeInTheDocument();
  });

  it('should display heading', () => {
    render(<CheckoutTrustSection />);
    expect(screen.getByText('Shop with Confidence')).toBeInTheDocument();
  });

  it('should display trust badges grid', () => {
    render(<CheckoutTrustSection />);
    expect(screen.getByTestId('trust-badges-grid')).toBeInTheDocument();
  });

  it('should display security indicators', () => {
    render(<CheckoutTrustSection />);
    expect(screen.getByTestId('security-indicators')).toBeInTheDocument();
  });

  it('should display privacy disclaimer', () => {
    render(<CheckoutTrustSection />);
    expect(
      screen.getByText(/Your personal information is protected/i)
    ).toBeInTheDocument();
  });
});

describe('FooterTrustStrip', () => {
  it('should render footer trust strip', () => {
    render(<FooterTrustStrip />);
    expect(screen.getByTestId('footer-trust-strip')).toBeInTheDocument();
  });

  it('should display trust badges row', () => {
    render(<FooterTrustStrip />);
    expect(screen.getByTestId('trust-badges-row')).toBeInTheDocument();
  });

  it('should display secure shopping text', () => {
    render(<FooterTrustStrip />);
    expect(screen.getByText('Secure Shopping')).toBeInTheDocument();
  });
});

describe('Badge Configuration', () => {
  it('should render all badge types correctly', () => {
    const allBadges: TrustBadgeType[] = [
      'secure-checkout',
      'ssl-encrypted',
      'free-shipping',
      'money-back',
      'secure-payment',
      'verified-seller',
      'fast-delivery',
      'quality-guarantee',
      'best-price',
      'authentic-products',
    ];

    render(<TrustBadgesGrid badges={allBadges} />);

    expect(screen.getByText('Secure Checkout')).toBeInTheDocument();
    expect(screen.getByText('SSL Encrypted')).toBeInTheDocument();
    expect(screen.getByText('Free Shipping')).toBeInTheDocument();
    expect(screen.getByText('30-Day Returns')).toBeInTheDocument();
    expect(screen.getByText('Secure Payment')).toBeInTheDocument();
    expect(screen.getByText('Verified Seller')).toBeInTheDocument();
    expect(screen.getByText('Fast Delivery')).toBeInTheDocument();
    expect(screen.getByText('Quality Guarantee')).toBeInTheDocument();
    expect(screen.getByText('Best Price')).toBeInTheDocument();
    expect(screen.getByText('100% Authentic')).toBeInTheDocument();
  });

  it('should display correct descriptions', () => {
    render(
      <TrustBadgesGrid
        badges={['free-shipping', 'fast-delivery', 'money-back']}
      />
    );

    expect(screen.getByText('On orders over $50')).toBeInTheDocument();
    expect(screen.getByText('2-5 business days')).toBeInTheDocument();
    expect(screen.getByText('Money-back guarantee')).toBeInTheDocument();
  });
});
