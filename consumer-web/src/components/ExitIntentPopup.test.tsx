import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  ExitIntentPopup,
  ExitIntentContainer,
  useExitIntent,
  type CartItem,
} from './ExitIntentPopup';
import { renderHook } from '@testing-library/react';

const mockCartItems: CartItem[] = [
  { id: '1', name: 'Product 1', price: 29.99, quantity: 2, imageUrl: '/img1.jpg' },
  { id: '2', name: 'Product 2', price: 49.99, quantity: 1 },
  { id: '3', name: 'Product 3', price: 19.99, quantity: 3 },
  { id: '4', name: 'Product 4', price: 99.99, quantity: 1 },
];

describe('ExitIntentPopup', () => {
  const mockOnClose = vi.fn();
  const mockOnViewCart = vi.fn();
  const mockOnContinueShopping = vi.fn();
  const mockOnApplyDiscount = vi.fn();
  const mockOnEmailSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    document.body.style.overflow = '';
  });

  describe('Rendering', () => {
    it('should not render when isOpen is false', () => {
      render(<ExitIntentPopup isOpen={false} onClose={mockOnClose} />);
      expect(screen.queryByTestId('exit-intent-popup')).not.toBeInTheDocument();
    });

    it('should render when isOpen is true', () => {
      render(<ExitIntentPopup isOpen={true} onClose={mockOnClose} />);
      expect(screen.getByTestId('exit-intent-popup')).toBeInTheDocument();
    });

    it('should render backdrop', () => {
      render(<ExitIntentPopup isOpen={true} onClose={mockOnClose} />);
      expect(screen.getByTestId('exit-intent-backdrop')).toBeInTheDocument();
    });

    it('should render close button', () => {
      render(<ExitIntentPopup isOpen={true} onClose={mockOnClose} />);
      expect(screen.getByTestId('close-popup-button')).toBeInTheDocument();
    });

    it('should have dialog role', () => {
      render(<ExitIntentPopup isOpen={true} onClose={mockOnClose} />);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should have aria-modal attribute', () => {
      render(<ExitIntentPopup isOpen={true} onClose={mockOnClose} />);
      expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
    });
  });

  describe('Close behavior', () => {
    it('should call onClose when close button is clicked', async () => {
      render(<ExitIntentPopup isOpen={true} onClose={mockOnClose} />);
      await userEvent.click(screen.getByTestId('close-popup-button'));
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when backdrop is clicked', async () => {
      render(<ExitIntentPopup isOpen={true} onClose={mockOnClose} />);
      await userEvent.click(screen.getByTestId('exit-intent-backdrop'));
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when Escape key is pressed', () => {
      render(<ExitIntentPopup isOpen={true} onClose={mockOnClose} />);
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should prevent body scroll when open', () => {
      render(<ExitIntentPopup isOpen={true} onClose={mockOnClose} />);
      expect(document.body.style.overflow).toBe('hidden');
    });

    it('should restore body scroll when closed', () => {
      const { rerender } = render(
        <ExitIntentPopup isOpen={true} onClose={mockOnClose} />
      );
      rerender(<ExitIntentPopup isOpen={false} onClose={mockOnClose} />);
      expect(document.body.style.overflow).toBe('');
    });
  });

  describe('Reminder variant', () => {
    it('should render reminder variant by default', () => {
      render(
        <ExitIntentPopup
          isOpen={true}
          onClose={mockOnClose}
          cartItems={mockCartItems}
          cartTotal={199.96}
        />
      );
      expect(screen.getByText('Leaving so soon?')).toBeInTheDocument();
    });

    it('should display cart item count', () => {
      render(
        <ExitIntentPopup
          isOpen={true}
          onClose={mockOnClose}
          cartItems={mockCartItems}
          cartTotal={199.96}
        />
      );
      expect(screen.getByText(/4 items in your cart/)).toBeInTheDocument();
    });

    it('should display cart preview with first 3 items', () => {
      render(
        <ExitIntentPopup
          isOpen={true}
          onClose={mockOnClose}
          cartItems={mockCartItems}
          cartTotal={199.96}
        />
      );
      expect(screen.getByTestId('cart-preview')).toBeInTheDocument();
      expect(screen.getByTestId('cart-item-1')).toBeInTheDocument();
      expect(screen.getByTestId('cart-item-2')).toBeInTheDocument();
      expect(screen.getByTestId('cart-item-3')).toBeInTheDocument();
      expect(screen.queryByTestId('cart-item-4')).not.toBeInTheDocument();
    });

    it('should show remaining items count', () => {
      render(
        <ExitIntentPopup
          isOpen={true}
          onClose={mockOnClose}
          cartItems={mockCartItems}
          cartTotal={199.96}
        />
      );
      expect(screen.getByText('+1 more item')).toBeInTheDocument();
    });

    it('should display cart total', () => {
      render(
        <ExitIntentPopup
          isOpen={true}
          onClose={mockOnClose}
          cartItems={mockCartItems}
          cartTotal={199.96}
        />
      );
      expect(screen.getByTestId('cart-total')).toHaveTextContent('$199.96');
    });

    it('should call onViewCart when View Cart button is clicked', async () => {
      render(
        <ExitIntentPopup
          isOpen={true}
          onClose={mockOnClose}
          cartItems={mockCartItems}
          cartTotal={199.96}
          onViewCart={mockOnViewCart}
        />
      );
      await userEvent.click(screen.getByTestId('view-cart-button'));
      expect(mockOnViewCart).toHaveBeenCalledTimes(1);
    });

    it('should call onContinueShopping and onClose when Continue Shopping is clicked', async () => {
      render(
        <ExitIntentPopup
          isOpen={true}
          onClose={mockOnClose}
          cartItems={mockCartItems}
          cartTotal={199.96}
          onContinueShopping={mockOnContinueShopping}
        />
      );
      await userEvent.click(screen.getByTestId('continue-shopping-button'));
      expect(mockOnContinueShopping).toHaveBeenCalledTimes(1);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should display singular item text for single item', () => {
      render(
        <ExitIntentPopup
          isOpen={true}
          onClose={mockOnClose}
          cartItems={[mockCartItems[0]]}
          cartTotal={29.99}
        />
      );
      expect(screen.getByText(/1 item in your cart/)).toBeInTheDocument();
    });
  });

  describe('Discount variant', () => {
    it('should render discount variant', () => {
      render(
        <ExitIntentPopup
          isOpen={true}
          onClose={mockOnClose}
          variant="discount"
          discountCode="SAVE20"
          discountPercent={20}
        />
      );
      expect(screen.getByText("Wait! Don't Go!")).toBeInTheDocument();
      expect(screen.getByText(/20% off/)).toBeInTheDocument();
    });

    it('should display discount code', () => {
      render(
        <ExitIntentPopup
          isOpen={true}
          onClose={mockOnClose}
          variant="discount"
          discountCode="SAVE20"
        />
      );
      expect(screen.getByTestId('discount-code')).toHaveTextContent('SAVE20');
    });

    it('should copy discount code when Copy button is clicked', async () => {
      const writeText = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: { writeText },
      });

      render(
        <ExitIntentPopup
          isOpen={true}
          onClose={mockOnClose}
          variant="discount"
          discountCode="SAVE20"
        />
      );

      await userEvent.click(screen.getByTestId('copy-code-button'));
      expect(writeText).toHaveBeenCalledWith('SAVE20');
    });

    it('should show Copied text after copying', async () => {
      const writeText = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: { writeText },
      });

      render(
        <ExitIntentPopup
          isOpen={true}
          onClose={mockOnClose}
          variant="discount"
          discountCode="SAVE20"
        />
      );

      await userEvent.click(screen.getByTestId('copy-code-button'));
      expect(screen.getByText('Copied!')).toBeInTheDocument();
    });

    it('should call onApplyDiscount and onViewCart when Apply button is clicked', async () => {
      render(
        <ExitIntentPopup
          isOpen={true}
          onClose={mockOnClose}
          variant="discount"
          discountCode="SAVE20"
          onApplyDiscount={mockOnApplyDiscount}
          onViewCart={mockOnViewCart}
        />
      );

      await userEvent.click(screen.getByTestId('apply-discount-button'));
      expect(mockOnApplyDiscount).toHaveBeenCalledWith('SAVE20');
      expect(mockOnViewCart).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when No Thanks button is clicked', async () => {
      render(
        <ExitIntentPopup
          isOpen={true}
          onClose={mockOnClose}
          variant="discount"
        />
      );

      await userEvent.click(screen.getByTestId('no-thanks-button'));
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Email capture variant', () => {
    it('should render email capture variant', () => {
      render(
        <ExitIntentPopup
          isOpen={true}
          onClose={mockOnClose}
          variant="email-capture"
          discountPercent={15}
        />
      );
      expect(screen.getByText('Get 15% Off!')).toBeInTheDocument();
    });

    it('should render email input', () => {
      render(
        <ExitIntentPopup
          isOpen={true}
          onClose={mockOnClose}
          variant="email-capture"
        />
      );
      expect(screen.getByTestId('email-input')).toBeInTheDocument();
    });

    it('should show error for empty email', async () => {
      render(
        <ExitIntentPopup
          isOpen={true}
          onClose={mockOnClose}
          variant="email-capture"
        />
      );

      await userEvent.click(screen.getByTestId('subscribe-button'));
      expect(screen.getByTestId('email-error')).toHaveTextContent(
        'Please enter your email'
      );
    });

    it('should show error for invalid email', async () => {
      render(
        <ExitIntentPopup
          isOpen={true}
          onClose={mockOnClose}
          variant="email-capture"
        />
      );

      const input = screen.getByTestId('email-input');
      const form = input.closest('form')!;

      // Set a value that fails our custom regex validation
      fireEvent.change(input, { target: { value: 'invalid@' } });
      // Submit form directly bypassing browser validation
      fireEvent.submit(form);

      expect(screen.getByTestId('email-error')).toHaveTextContent(
        'Please enter a valid email'
      );
    });

    it('should call onEmailSubmit with valid email', async () => {
      render(
        <ExitIntentPopup
          isOpen={true}
          onClose={mockOnClose}
          variant="email-capture"
          onEmailSubmit={mockOnEmailSubmit}
        />
      );

      await userEvent.type(screen.getByTestId('email-input'), 'test@example.com');
      await userEvent.click(screen.getByTestId('subscribe-button'));
      expect(mockOnEmailSubmit).toHaveBeenCalledWith('test@example.com');
    });

    it('should show success message after submission', async () => {
      render(
        <ExitIntentPopup
          isOpen={true}
          onClose={mockOnClose}
          variant="email-capture"
          onEmailSubmit={mockOnEmailSubmit}
        />
      );

      await userEvent.type(screen.getByTestId('email-input'), 'test@example.com');
      await userEvent.click(screen.getByTestId('subscribe-button'));
      expect(screen.getByText('Check Your Email!')).toBeInTheDocument();
    });

    it('should call onClose when No Thanks button is clicked', async () => {
      render(
        <ExitIntentPopup
          isOpen={true}
          onClose={mockOnClose}
          variant="email-capture"
        />
      );

      await userEvent.click(screen.getByTestId('no-thanks-email-button'));
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Countdown variant', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should render countdown variant', () => {
      render(
        <ExitIntentPopup
          isOpen={true}
          onClose={mockOnClose}
          variant="countdown"
          discountPercent={15}
        />
      );
      expect(screen.getByText('LIMITED TIME OFFER')).toBeInTheDocument();
      expect(screen.getByText('15% OFF Expires In:')).toBeInTheDocument();
    });

    it('should display countdown timer', () => {
      render(
        <ExitIntentPopup
          isOpen={true}
          onClose={mockOnClose}
          variant="countdown"
        />
      );
      expect(screen.getByTestId('countdown-timer')).toBeInTheDocument();
      expect(screen.getByText('15')).toBeInTheDocument(); // 15 minutes
      expect(screen.getByText('00')).toBeInTheDocument(); // 0 seconds
    });

    it('should countdown timer decreases', async () => {
      render(
        <ExitIntentPopup
          isOpen={true}
          onClose={mockOnClose}
          variant="countdown"
        />
      );

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(screen.getByText('59')).toBeInTheDocument(); // 14:59
    });

    it('should call onApplyDiscount when Claim Offer is clicked', async () => {
      vi.useRealTimers();
      render(
        <ExitIntentPopup
          isOpen={true}
          onClose={mockOnClose}
          variant="countdown"
          discountCode="FLASH15"
          onApplyDiscount={mockOnApplyDiscount}
          onViewCart={mockOnViewCart}
        />
      );

      await userEvent.click(screen.getByTestId('claim-offer-button'));
      expect(mockOnApplyDiscount).toHaveBeenCalledWith('FLASH15');
      expect(mockOnViewCart).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when Miss Out button is clicked', async () => {
      vi.useRealTimers();
      render(
        <ExitIntentPopup
          isOpen={true}
          onClose={mockOnClose}
          variant="countdown"
        />
      );

      await userEvent.click(screen.getByTestId('miss-out-button'));
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });
});

describe('useExitIntent', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should not trigger immediately', () => {
    const { result } = renderHook(() => useExitIntent());
    expect(result.current.isTriggered).toBe(false);
  });

  it('should enable detection after delay', () => {
    const { result } = renderHook(() => useExitIntent({ delay: 1000 }));

    expect(result.current.isEnabled).toBe(false);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.isEnabled).toBe(true);
  });

  it('should trigger on mouseout near top of viewport', () => {
    const { result } = renderHook(() =>
      useExitIntent({ delay: 0, threshold: 50 })
    );

    act(() => {
      vi.advanceTimersByTime(0);
    });

    act(() => {
      document.dispatchEvent(
        new MouseEvent('mouseout', {
          clientY: 10,
          bubbles: true,
        })
      );
    });

    expect(result.current.isTriggered).toBe(true);
  });

  it('should not trigger on mouseout below threshold', () => {
    const { result } = renderHook(() =>
      useExitIntent({ delay: 0, threshold: 50 })
    );

    act(() => {
      vi.advanceTimersByTime(0);
    });

    act(() => {
      document.dispatchEvent(
        new MouseEvent('mouseout', {
          clientY: 100,
          bubbles: true,
        })
      );
    });

    expect(result.current.isTriggered).toBe(false);
  });

  it('should reset trigger state', () => {
    const { result } = renderHook(() =>
      useExitIntent({ delay: 0, threshold: 50 })
    );

    act(() => {
      vi.advanceTimersByTime(0);
    });

    act(() => {
      document.dispatchEvent(
        new MouseEvent('mouseout', {
          clientY: 10,
          bubbles: true,
        })
      );
    });

    expect(result.current.isTriggered).toBe(true);

    act(() => {
      result.current.reset();
    });

    expect(result.current.isTriggered).toBe(false);
  });

  it('should not enable when enabled is false', () => {
    const { result } = renderHook(() => useExitIntent({ enabled: false }));

    act(() => {
      vi.advanceTimersByTime(10000);
    });

    expect(result.current.isEnabled).toBe(false);
  });
});

describe('ExitIntentContainer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render without crashing', () => {
    render(<ExitIntentContainer cartItems={mockCartItems} cartTotal={199.96} />);
    // Container should not show popup initially
    expect(screen.queryByTestId('exit-intent-popup')).not.toBeInTheDocument();
  });

  it('should not enable when cart is empty', () => {
    render(<ExitIntentContainer cartItems={[]} cartTotal={0} />);

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    act(() => {
      document.dispatchEvent(
        new MouseEvent('mouseout', {
          clientY: 10,
          bubbles: true,
        })
      );
    });

    expect(screen.queryByTestId('exit-intent-popup')).not.toBeInTheDocument();
  });

  it('should show popup when exit intent is triggered', () => {
    render(
      <ExitIntentContainer
        cartItems={mockCartItems}
        cartTotal={199.96}
        config={{ delay: 0 }}
      />
    );

    act(() => {
      vi.advanceTimersByTime(0);
    });

    act(() => {
      document.dispatchEvent(
        new MouseEvent('mouseout', {
          clientY: 10,
          bubbles: true,
        })
      );
    });

    expect(screen.getByTestId('exit-intent-popup')).toBeInTheDocument();
  });

  it('should dismiss popup and not show again after closing', async () => {
    render(
      <ExitIntentContainer
        cartItems={mockCartItems}
        cartTotal={199.96}
        config={{ delay: 0 }}
      />
    );

    // Wait for enable then trigger
    act(() => {
      vi.advanceTimersByTime(0);
    });

    act(() => {
      document.dispatchEvent(
        new MouseEvent('mouseout', {
          clientY: 10,
          bubbles: true,
        })
      );
    });

    // Should show popup
    expect(screen.getByTestId('exit-intent-popup')).toBeInTheDocument();

    // Close it - need real timers for userEvent
    vi.useRealTimers();
    await userEvent.click(screen.getByTestId('close-popup-button'));

    // Should be dismissed
    expect(screen.queryByTestId('exit-intent-popup')).not.toBeInTheDocument();
  });
});

describe('Cart item display', () => {
  it('should display item with image', () => {
    render(
      <ExitIntentPopup
        isOpen={true}
        onClose={vi.fn()}
        cartItems={[mockCartItems[0]]}
        cartTotal={29.99}
      />
    );

    const img = screen.getByAltText('Product 1');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', '/img1.jpg');
  });

  it('should display placeholder for item without image', () => {
    render(
      <ExitIntentPopup
        isOpen={true}
        onClose={vi.fn()}
        cartItems={[mockCartItems[1]]}
        cartTotal={49.99}
      />
    );

    expect(screen.queryByAltText('Product 2')).not.toBeInTheDocument();
    // Should have placeholder icon instead
  });

  it('should display item quantity and price', () => {
    render(
      <ExitIntentPopup
        isOpen={true}
        onClose={vi.fn()}
        cartItems={[mockCartItems[0]]}
        cartTotal={59.98}
      />
    );

    expect(screen.getByText('Qty: 2 × $29.99')).toBeInTheDocument();
  });
});
