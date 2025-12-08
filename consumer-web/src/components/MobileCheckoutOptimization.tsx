import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// Types
export interface AddressAutofillData {
  streetAddress?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface PaymentMethod {
  id: string;
  type: 'apple_pay' | 'google_pay' | 'card' | 'paypal';
  label: string;
  isAvailable: boolean;
  isPrimary?: boolean;
}

export interface SupportContact {
  phone: string;
  hours: string;
  email?: string;
}

export interface MobileCheckoutContextValue {
  isMobile: boolean;
  supportContact: SupportContact | null;
  availablePaymentMethods: PaymentMethod[];
  selectedPaymentMethod: string | null;
  isAddressAutofillEnabled: boolean;
  setSelectedPaymentMethod: (id: string) => void;
  handleAddressAutofill: (data: AddressAutofillData) => void;
  callSupport: () => void;
}

const MobileCheckoutContext = createContext<MobileCheckoutContextValue | null>(null);

export function useMobileCheckout(): MobileCheckoutContextValue {
  const context = useContext(MobileCheckoutContext);
  if (!context) {
    throw new Error('useMobileCheckout must be used within a MobileCheckoutProvider');
  }
  return context;
}

// Detect mobile device
function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor;
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      const isSmallScreen = window.innerWidth < 768;
      setIsMobile(isMobileDevice || isSmallScreen);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}

// Check payment method availability
function usePaymentMethodAvailability(): {
  applePayAvailable: boolean;
  googlePayAvailable: boolean;
} {
  const [applePayAvailable, setApplePayAvailable] = useState(false);
  const [googlePayAvailable, setGooglePayAvailable] = useState(false);

  useEffect(() => {
    // Check Apple Pay availability
    const ApplePaySessionGlobal = (window as unknown as { ApplePaySession?: { canMakePayments?: () => boolean } }).ApplePaySession;
    if (ApplePaySessionGlobal && ApplePaySessionGlobal.canMakePayments) {
      setApplePayAvailable(true);
    }

    // Check Google Pay availability (simplified check)
    const isChrome = /Chrome/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    setGooglePayAvailable(isChrome || isAndroid);
  }, []);

  return { applePayAvailable, googlePayAvailable };
}

// Provider
interface MobileCheckoutProviderProps {
  children: ReactNode;
  supportContact?: SupportContact | null;
  onAddressAutofill?: (data: AddressAutofillData) => void;
  onPaymentMethodSelect?: (methodId: string) => void;
  customPaymentMethods?: PaymentMethod[];
}

export function MobileCheckoutProvider({
  children,
  supportContact = null,
  onAddressAutofill,
  onPaymentMethodSelect,
  customPaymentMethods,
}: MobileCheckoutProviderProps) {
  const isMobile = useIsMobile();
  const { applePayAvailable, googlePayAvailable } = usePaymentMethodAvailability();
  const [selectedPaymentMethod, setSelectedPaymentMethodState] = useState<string | null>(null);

  // Build available payment methods
  const availablePaymentMethods: PaymentMethod[] = customPaymentMethods || [
    {
      id: 'apple_pay',
      type: 'apple_pay',
      label: 'Apple Pay',
      isAvailable: applePayAvailable,
      isPrimary: applePayAvailable && isMobile,
    },
    {
      id: 'google_pay',
      type: 'google_pay',
      label: 'Google Pay',
      isAvailable: googlePayAvailable,
      isPrimary: googlePayAvailable && isMobile && !applePayAvailable,
    },
    {
      id: 'paypal',
      type: 'paypal',
      label: 'PayPal',
      isAvailable: true,
      isPrimary: false,
    },
    {
      id: 'card',
      type: 'card',
      label: 'Credit/Debit Card',
      isAvailable: true,
      isPrimary: false,
    },
  ];

  const setSelectedPaymentMethod = useCallback((id: string) => {
    setSelectedPaymentMethodState(id);
    onPaymentMethodSelect?.(id);
  }, [onPaymentMethodSelect]);

  const handleAddressAutofill = useCallback((data: AddressAutofillData) => {
    onAddressAutofill?.(data);
  }, [onAddressAutofill]);

  const callSupport = useCallback(() => {
    if (supportContact?.phone) {
      window.location.href = `tel:${supportContact.phone}`;
    }
  }, [supportContact]);

  const value: MobileCheckoutContextValue = {
    isMobile,
    supportContact,
    availablePaymentMethods,
    selectedPaymentMethod,
    isAddressAutofillEnabled: true,
    setSelectedPaymentMethod,
    handleAddressAutofill,
    callSupport,
  };

  return (
    <MobileCheckoutContext.Provider value={value}>
      {children}
    </MobileCheckoutContext.Provider>
  );
}

// Mobile Express Pay Buttons
interface MobileExpressPayProps {
  className?: string;
  onApplePay?: () => void;
  onGooglePay?: () => void;
  onPayPal?: () => void;
}

export function MobileExpressPay({
  className,
  onApplePay,
  onGooglePay,
  onPayPal,
}: MobileExpressPayProps) {
  const { availablePaymentMethods, isMobile, setSelectedPaymentMethod } = useMobileCheckout();

  const applePay = availablePaymentMethods.find((m) => m.type === 'apple_pay');
  const googlePay = availablePaymentMethods.find((m) => m.type === 'google_pay');
  const paypal = availablePaymentMethods.find((m) => m.type === 'paypal');

  // Sort by primary status for mobile
  const primaryMethods = availablePaymentMethods
    .filter((m) => m.isPrimary && m.isAvailable)
    .sort((a, b) => (a.isPrimary === b.isPrimary ? 0 : a.isPrimary ? -1 : 1));

  const handleApplePay = () => {
    setSelectedPaymentMethod('apple_pay');
    onApplePay?.();
  };

  const handleGooglePay = () => {
    setSelectedPaymentMethod('google_pay');
    onGooglePay?.();
  };

  const handlePayPal = () => {
    setSelectedPaymentMethod('paypal');
    onPayPal?.();
  };

  return (
    <div className={cn('space-y-3', className)} data-testid="mobile-express-pay">
      <h4 className="text-sm font-medium text-center text-muted-foreground">
        Express Checkout
      </h4>

      {/* Primary methods (large buttons on mobile) */}
      {isMobile && primaryMethods.length > 0 && (
        <div className="space-y-2">
          {applePay?.isPrimary && applePay.isAvailable && (
            <Button
              variant="default"
              className="w-full h-14 bg-black hover:bg-gray-900 text-white text-lg font-medium"
              onClick={handleApplePay}
              data-testid="apple-pay-primary"
              aria-label="Pay with Apple Pay"
            >
              <svg className="w-6 h-6 mr-2" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.36-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.36C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.53 4.08zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
              </svg>
              Apple Pay
            </Button>
          )}
          {googlePay?.isPrimary && googlePay.isAvailable && (
            <Button
              variant="outline"
              className="w-full h-14 text-lg font-medium"
              onClick={handleGooglePay}
              data-testid="google-pay-primary"
              aria-label="Pay with Google Pay"
            >
              <svg className="w-6 h-6 mr-2" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.389-7.439-7.574s3.345-7.574 7.439-7.574c2.33 0 3.891.989 4.785 1.849l3.254-3.138C18.189 1.186 15.479 0 12.24 0c-6.635 0-12 5.365-12 12s5.365 12 12 12c6.926 0 11.52-4.869 11.52-11.726 0-.788-.085-1.39-.189-1.989H12.24z" />
              </svg>
              Google Pay
            </Button>
          )}
        </div>
      )}

      {/* Standard express checkout grid */}
      <div className={cn('grid gap-2', isMobile ? 'grid-cols-1' : 'grid-cols-3')}>
        {!applePay?.isPrimary && applePay?.isAvailable && (
          <Button
            variant="outline"
            className={cn('h-12', isMobile && 'h-14')}
            onClick={handleApplePay}
            data-testid="apple-pay-button"
            aria-label="Pay with Apple Pay"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M17.05 20.28c-.98.95-2.05.8-3.08.36-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.36C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.53 4.08zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
            </svg>
            Pay
          </Button>
        )}
        {!googlePay?.isPrimary && googlePay?.isAvailable && (
          <Button
            variant="outline"
            className={cn('h-12', isMobile && 'h-14')}
            onClick={handleGooglePay}
            data-testid="google-pay-button"
            aria-label="Pay with Google Pay"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.389-7.439-7.574s3.345-7.574 7.439-7.574c2.33 0 3.891.989 4.785 1.849l3.254-3.138C18.189 1.186 15.479 0 12.24 0c-6.635 0-12 5.365-12 12s5.365 12 12 12c6.926 0 11.52-4.869 11.52-11.726 0-.788-.085-1.39-.189-1.989H12.24z" />
            </svg>
            Pay
          </Button>
        )}
        {paypal?.isAvailable && (
          <Button
            variant="outline"
            className={cn(
              'h-12 bg-[#ffc439] hover:bg-[#f0b72e] text-[#003087] border-[#ffc439]',
              isMobile && 'h-14'
            )}
            onClick={handlePayPal}
            data-testid="paypal-button"
            aria-label="Pay with PayPal"
          >
            <span className="font-bold">PayPal</span>
          </Button>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1 border-t" />
        <span className="text-sm text-muted-foreground">or pay with card</span>
        <div className="flex-1 border-t" />
      </div>
    </div>
  );
}

// Mobile-Optimized Address Input
interface MobileAddressInputProps {
  className?: string;
  value?: AddressAutofillData;
  onChange?: (data: AddressAutofillData) => void;
  errors?: Record<string, string>;
}

export function MobileAddressInput({
  className,
  value = {},
  onChange,
  errors = {},
}: MobileAddressInputProps) {
  const { isMobile, handleAddressAutofill } = useMobileCheckout();

  const handleChange = (field: keyof AddressAutofillData, fieldValue: string) => {
    const newData = { ...value, [field]: fieldValue };
    onChange?.(newData);
    handleAddressAutofill(newData);
  };

  const inputClassName = cn(
    'w-full',
    isMobile && 'h-12 text-base' // Larger touch targets on mobile
  );

  return (
    <div className={cn('space-y-4', className)} data-testid="mobile-address-input">
      <div>
        <label htmlFor="streetAddress" className="block text-sm font-medium mb-1">
          Street Address *
        </label>
        <Input
          id="streetAddress"
          name="street-address"
          autoComplete="street-address"
          value={value.streetAddress || ''}
          onChange={(e) => handleChange('streetAddress', e.target.value)}
          placeholder="123 Main St"
          className={cn(inputClassName, errors.streetAddress && 'border-destructive')}
          data-testid="street-address-input"
        />
        {errors.streetAddress && (
          <p className="text-destructive text-sm mt-1">{errors.streetAddress}</p>
        )}
      </div>

      <div>
        <label htmlFor="addressLine2" className="block text-sm font-medium mb-1">
          Apt, Suite, Unit (optional)
        </label>
        <Input
          id="addressLine2"
          name="address-line2"
          autoComplete="address-line2"
          value={value.addressLine2 || ''}
          onChange={(e) => handleChange('addressLine2', e.target.value)}
          placeholder="Apt 4B"
          className={inputClassName}
          data-testid="address-line2-input"
        />
      </div>

      <div className={cn('grid gap-4', isMobile ? 'grid-cols-1' : 'grid-cols-2')}>
        <div>
          <label htmlFor="city" className="block text-sm font-medium mb-1">
            City *
          </label>
          <Input
            id="city"
            name="address-level2"
            autoComplete="address-level2"
            value={value.city || ''}
            onChange={(e) => handleChange('city', e.target.value)}
            placeholder="New York"
            className={cn(inputClassName, errors.city && 'border-destructive')}
            data-testid="city-input"
          />
          {errors.city && (
            <p className="text-destructive text-sm mt-1">{errors.city}</p>
          )}
        </div>

        <div>
          <label htmlFor="state" className="block text-sm font-medium mb-1">
            State *
          </label>
          <Input
            id="state"
            name="address-level1"
            autoComplete="address-level1"
            value={value.state || ''}
            onChange={(e) => handleChange('state', e.target.value)}
            placeholder="NY"
            className={cn(inputClassName, errors.state && 'border-destructive')}
            data-testid="state-input"
          />
          {errors.state && (
            <p className="text-destructive text-sm mt-1">{errors.state}</p>
          )}
        </div>
      </div>

      <div className={cn('grid gap-4', isMobile ? 'grid-cols-1' : 'grid-cols-2')}>
        <div>
          <label htmlFor="postalCode" className="block text-sm font-medium mb-1">
            ZIP Code *
          </label>
          <Input
            id="postalCode"
            name="postal-code"
            autoComplete="postal-code"
            inputMode="numeric"
            pattern="[0-9]*"
            value={value.postalCode || ''}
            onChange={(e) => handleChange('postalCode', e.target.value)}
            placeholder="10001"
            className={cn(inputClassName, errors.postalCode && 'border-destructive')}
            data-testid="postal-code-input"
          />
          {errors.postalCode && (
            <p className="text-destructive text-sm mt-1">{errors.postalCode}</p>
          )}
        </div>

        <div>
          <label htmlFor="country" className="block text-sm font-medium mb-1">
            Country *
          </label>
          <Input
            id="country"
            name="country"
            autoComplete="country-name"
            value={value.country || ''}
            onChange={(e) => handleChange('country', e.target.value)}
            placeholder="United States"
            className={cn(inputClassName, errors.country && 'border-destructive')}
            data-testid="country-input"
          />
          {errors.country && (
            <p className="text-destructive text-sm mt-1">{errors.country}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// Mobile-Optimized Card Input
interface MobileCardInputProps {
  className?: string;
  onCardChange?: (card: {
    number: string;
    expiry: string;
    cvc: string;
    name: string;
  }) => void;
  errors?: Record<string, string>;
}

export function MobileCardInput({
  className,
  onCardChange,
  errors = {},
}: MobileCardInputProps) {
  const { isMobile } = useMobileCheckout();
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [name, setName] = useState('');

  const formatCardNumber = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    const groups = numbers.match(/.{1,4}/g) || [];
    return groups.join(' ').substr(0, 19);
  };

  const formatExpiry = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length >= 2) {
      return numbers.slice(0, 2) + '/' + numbers.slice(2, 4);
    }
    return numbers;
  };

  const handleCardNumberChange = (value: string) => {
    const formatted = formatCardNumber(value);
    setCardNumber(formatted);
    onCardChange?.({ number: formatted, expiry, cvc, name });
  };

  const handleExpiryChange = (value: string) => {
    const formatted = formatExpiry(value);
    setExpiry(formatted);
    onCardChange?.({ number: cardNumber, expiry: formatted, cvc, name });
  };

  const handleCvcChange = (value: string) => {
    const numbers = value.replace(/\D/g, '').substr(0, 4);
    setCvc(numbers);
    onCardChange?.({ number: cardNumber, expiry, cvc: numbers, name });
  };

  const handleNameChange = (value: string) => {
    setName(value);
    onCardChange?.({ number: cardNumber, expiry, cvc, name: value });
  };

  const inputClassName = cn(
    'w-full',
    isMobile && 'h-12 text-base'
  );

  return (
    <div className={cn('space-y-4', className)} data-testid="mobile-card-input">
      <div>
        <label htmlFor="cardNumber" className="block text-sm font-medium mb-1">
          Card Number *
        </label>
        <Input
          id="cardNumber"
          name="cc-number"
          autoComplete="cc-number"
          inputMode="numeric"
          value={cardNumber}
          onChange={(e) => handleCardNumberChange(e.target.value)}
          placeholder="1234 5678 9012 3456"
          className={cn(inputClassName, errors.cardNumber && 'border-destructive')}
          data-testid="card-number-input"
          aria-describedby={errors.cardNumber ? 'card-number-error' : undefined}
        />
        {errors.cardNumber && (
          <p id="card-number-error" className="text-destructive text-sm mt-1">
            {errors.cardNumber}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="cardName" className="block text-sm font-medium mb-1">
          Name on Card *
        </label>
        <Input
          id="cardName"
          name="cc-name"
          autoComplete="cc-name"
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="John Doe"
          className={cn(inputClassName, errors.cardName && 'border-destructive')}
          data-testid="card-name-input"
        />
        {errors.cardName && (
          <p className="text-destructive text-sm mt-1">{errors.cardName}</p>
        )}
      </div>

      <div className={cn('grid gap-4', isMobile ? 'grid-cols-2' : 'grid-cols-2')}>
        <div>
          <label htmlFor="expiry" className="block text-sm font-medium mb-1">
            Expiry *
          </label>
          <Input
            id="expiry"
            name="cc-exp"
            autoComplete="cc-exp"
            inputMode="numeric"
            value={expiry}
            onChange={(e) => handleExpiryChange(e.target.value)}
            placeholder="MM/YY"
            className={cn(inputClassName, errors.expiry && 'border-destructive')}
            data-testid="expiry-input"
          />
          {errors.expiry && (
            <p className="text-destructive text-sm mt-1">{errors.expiry}</p>
          )}
        </div>

        <div>
          <label htmlFor="cvc" className="block text-sm font-medium mb-1">
            CVC *
          </label>
          <Input
            id="cvc"
            name="cc-csc"
            autoComplete="cc-csc"
            inputMode="numeric"
            value={cvc}
            onChange={(e) => handleCvcChange(e.target.value)}
            placeholder="123"
            maxLength={4}
            className={cn(inputClassName, errors.cvc && 'border-destructive')}
            data-testid="cvc-input"
          />
          {errors.cvc && (
            <p className="text-destructive text-sm mt-1">{errors.cvc}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// Click-to-Call Support Banner
interface ClickToCallSupportProps {
  className?: string;
  message?: string;
}

export function ClickToCallSupport({
  className,
  message = 'Need help? Call our checkout support',
}: ClickToCallSupportProps) {
  const { supportContact, callSupport, isMobile } = useMobileCheckout();

  if (!supportContact) return null;

  return (
    <Card className={cn('bg-muted', className)} data-testid="click-to-call-support">
      <CardContent className="py-3">
        <div className={cn(
          'flex items-center gap-3',
          isMobile ? 'flex-col text-center' : 'flex-row'
        )}>
          <div className="flex-1">
            <p className="text-sm font-medium">{message}</p>
            <p className="text-xs text-muted-foreground">{supportContact.hours}</p>
          </div>
          <Button
            variant="outline"
            size={isMobile ? 'lg' : 'default'}
            className={cn('gap-2', isMobile && 'w-full')}
            onClick={callSupport}
            data-testid="call-support-button"
            aria-label={`Call support at ${supportContact.phone}`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            {supportContact.phone}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Sticky Mobile Checkout Button
interface StickyCheckoutButtonProps {
  className?: string;
  total: number;
  onCheckout: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  label?: string;
}

export function StickyCheckoutButton({
  className,
  total,
  onCheckout,
  isLoading = false,
  disabled = false,
  label = 'Complete Order',
}: StickyCheckoutButtonProps) {
  const { isMobile } = useMobileCheckout();

  if (!isMobile) {
    return (
      <Button
        className={cn('w-full', className)}
        onClick={onCheckout}
        disabled={disabled || isLoading}
        data-testid="checkout-button"
      >
        {isLoading ? 'Processing...' : `${label} - $${total.toFixed(2)}`}
      </Button>
    );
  }

  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 p-4 bg-background border-t shadow-lg z-50',
        className
      )}
      data-testid="sticky-checkout-button"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-muted-foreground">Total</span>
        <span className="text-lg font-bold" data-testid="checkout-total">
          ${total.toFixed(2)}
        </span>
      </div>
      <Button
        className="w-full h-14 text-lg font-semibold"
        onClick={onCheckout}
        disabled={disabled || isLoading}
        data-testid="checkout-button"
      >
        {isLoading ? 'Processing...' : label}
      </Button>
    </div>
  );
}

// Payment Method Selector
interface PaymentMethodSelectorProps {
  className?: string;
  onSelect?: (methodId: string) => void;
}

export function PaymentMethodSelector({
  className,
  onSelect,
}: PaymentMethodSelectorProps) {
  const { availablePaymentMethods, selectedPaymentMethod, setSelectedPaymentMethod, isMobile } = useMobileCheckout();

  const handleSelect = (methodId: string) => {
    setSelectedPaymentMethod(methodId);
    onSelect?.(methodId);
  };

  return (
    <div className={cn('space-y-3', className)} data-testid="payment-method-selector">
      <h4 className="text-sm font-medium">Select Payment Method</h4>
      <div className={cn('grid gap-2', isMobile ? 'grid-cols-1' : 'grid-cols-2')}>
        {availablePaymentMethods
          .filter((m) => m.isAvailable)
          .map((method) => (
            <button
              key={method.id}
              type="button"
              onClick={() => handleSelect(method.id)}
              className={cn(
                'flex items-center gap-3 p-4 border rounded-lg transition-all',
                selectedPaymentMethod === method.id
                  ? 'border-primary bg-primary/5 ring-2 ring-primary'
                  : 'hover:border-primary/50',
                isMobile && 'h-16'
              )}
              data-testid={`payment-method-${method.id}`}
              aria-pressed={selectedPaymentMethod === method.id}
            >
              {method.type === 'apple_pay' && (
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.36-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.36C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.53 4.08zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                </svg>
              )}
              {method.type === 'google_pay' && (
                <svg className="w-6 h-6" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285F4" d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.389-7.439-7.574s3.345-7.574 7.439-7.574c2.33 0 3.891.989 4.785 1.849l3.254-3.138C18.189 1.186 15.479 0 12.24 0c-6.635 0-12 5.365-12 12s5.365 12 12 12c6.926 0 11.52-4.869 11.52-11.726 0-.788-.085-1.39-.189-1.989H12.24z" />
                </svg>
              )}
              {method.type === 'paypal' && (
                <svg className="w-6 h-6" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#003087" d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797H9.14a.788.788 0 0 0-.779.664l-.92 5.832-.262 1.652a.474.474 0 0 1-.468.404h-1.636z"/>
                </svg>
              )}
              {method.type === 'card' && (
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                  <line x1="1" y1="10" x2="23" y2="10" />
                </svg>
              )}
              <span className="font-medium">{method.label}</span>
              {method.isPrimary && (
                <span className="ml-auto text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                  Recommended
                </span>
              )}
            </button>
          ))}
      </div>
    </div>
  );
}

// Main Mobile Checkout Component
interface MobileCheckoutOptimizationProps {
  className?: string;
  supportContact?: SupportContact;
  total: number;
  onApplePay?: () => void;
  onGooglePay?: () => void;
  onPayPal?: () => void;
  onCheckout: () => void;
  onAddressChange?: (address: AddressAutofillData) => void;
  onCardChange?: (card: { number: string; expiry: string; cvc: string; name: string }) => void;
  addressErrors?: Record<string, string>;
  cardErrors?: Record<string, string>;
  isLoading?: boolean;
  showExpressPay?: boolean;
  showSupportBanner?: boolean;
}

export function MobileCheckoutOptimization({
  className,
  supportContact,
  total,
  onApplePay,
  onGooglePay,
  onPayPal,
  onCheckout,
  onAddressChange,
  onCardChange,
  addressErrors,
  cardErrors,
  isLoading = false,
  showExpressPay = true,
  showSupportBanner = true,
}: MobileCheckoutOptimizationProps) {
  const [address, setAddress] = useState<AddressAutofillData>({});

  const handleAddressChange = (data: AddressAutofillData) => {
    setAddress(data);
    onAddressChange?.(data);
  };

  return (
    <MobileCheckoutProvider
      supportContact={supportContact}
      onAddressAutofill={onAddressChange}
    >
      <div className={cn('space-y-6 pb-24', className)} data-testid="mobile-checkout-optimization">
        {showExpressPay && (
          <MobileExpressPay
            onApplePay={onApplePay}
            onGooglePay={onGooglePay}
            onPayPal={onPayPal}
          />
        )}

        {showSupportBanner && <ClickToCallSupport />}

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Shipping Address</CardTitle>
          </CardHeader>
          <CardContent>
            <MobileAddressInput
              value={address}
              onChange={handleAddressChange}
              errors={addressErrors}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Payment</CardTitle>
          </CardHeader>
          <CardContent>
            <MobileCardInput
              onCardChange={onCardChange}
              errors={cardErrors}
            />
          </CardContent>
        </Card>

        <StickyCheckoutButton
          total={total}
          onCheckout={onCheckout}
          isLoading={isLoading}
        />
      </div>
    </MobileCheckoutProvider>
  );
}

export default MobileCheckoutOptimization;
