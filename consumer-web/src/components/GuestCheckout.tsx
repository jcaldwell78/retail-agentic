import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
  FormEvent,
} from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// Types
export interface GuestInfo {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface ShippingAddress {
  firstName: string;
  lastName: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
}

export interface GuestCheckoutState {
  guestInfo: Partial<GuestInfo>;
  shippingAddress: Partial<ShippingAddress>;
  useBillingForShipping: boolean;
  isGuest: boolean;
  step: 'email' | 'info' | 'shipping' | 'payment' | 'review';
  errors: Record<string, string>;
  isLoading: boolean;
  savedAddresses?: ShippingAddress[];
}

export interface GuestCheckoutContextType extends GuestCheckoutState {
  setGuestInfo: (info: Partial<GuestInfo>) => void;
  setShippingAddress: (address: Partial<ShippingAddress>) => void;
  setUseBillingForShipping: (use: boolean) => void;
  setStep: (step: GuestCheckoutState['step']) => void;
  validateEmail: (email: string) => boolean;
  validatePhone: (phone: string) => boolean;
  validateForm: () => boolean;
  clearErrors: () => void;
  setError: (field: string, message: string) => void;
  continueAsGuest: () => void;
  goToLogin: () => void;
}

// Context
const GuestCheckoutContext = createContext<GuestCheckoutContextType | null>(null);

export function useGuestCheckout(): GuestCheckoutContextType {
  const context = useContext(GuestCheckoutContext);
  if (!context) {
    throw new Error('useGuestCheckout must be used within a GuestCheckoutProvider');
  }
  return context;
}

// Provider
export interface GuestCheckoutProviderProps {
  children: ReactNode;
  onContinueAsGuest?: (info: GuestInfo) => void;
  onGoToLogin?: () => void;
  onComplete?: (data: { guestInfo: GuestInfo; shippingAddress: ShippingAddress }) => void;
  savedAddresses?: ShippingAddress[];
  isLoading?: boolean;
}

export function GuestCheckoutProvider({
  children,
  onContinueAsGuest,
  onGoToLogin,
  savedAddresses,
  isLoading = false,
}: GuestCheckoutProviderProps) {
  const [guestInfo, setGuestInfoState] = useState<Partial<GuestInfo>>({});
  const [shippingAddress, setShippingAddressState] = useState<Partial<ShippingAddress>>({});
  const [useBillingForShipping, setUseBillingForShippingState] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  const [step, setStepState] = useState<GuestCheckoutState['step']>('email');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const setGuestInfo = useCallback((info: Partial<GuestInfo>) => {
    setGuestInfoState((prev) => ({ ...prev, ...info }));
  }, []);

  const setShippingAddress = useCallback((address: Partial<ShippingAddress>) => {
    setShippingAddressState((prev) => ({ ...prev, ...address }));
  }, []);

  const setUseBillingForShipping = useCallback((use: boolean) => {
    setUseBillingForShippingState(use);
  }, []);

  const setStep = useCallback((newStep: GuestCheckoutState['step']) => {
    setStepState(newStep);
  }, []);

  const validateEmail = useCallback((email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }, []);

  const validatePhone = useCallback((phone: string): boolean => {
    const phoneRegex = /^[\d\s\-+()]{10,}$/;
    return phoneRegex.test(phone);
  }, []);

  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate guest info
    if (!guestInfo.email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(guestInfo.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!guestInfo.firstName) {
      newErrors.firstName = 'First name is required';
    }

    if (!guestInfo.lastName) {
      newErrors.lastName = 'Last name is required';
    }

    if (guestInfo.phone && !validatePhone(guestInfo.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    // Validate shipping address
    if (!shippingAddress.address1) {
      newErrors.address1 = 'Address is required';
    }

    if (!shippingAddress.city) {
      newErrors.city = 'City is required';
    }

    if (!shippingAddress.state) {
      newErrors.state = 'State is required';
    }

    if (!shippingAddress.postalCode) {
      newErrors.postalCode = 'Postal code is required';
    }

    if (!shippingAddress.country) {
      newErrors.country = 'Country is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [guestInfo, shippingAddress, validateEmail, validatePhone]);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const setError = useCallback((field: string, message: string) => {
    setErrors((prev) => ({ ...prev, [field]: message }));
  }, []);

  const continueAsGuest = useCallback(() => {
    setIsGuest(true);
    if (guestInfo.email && guestInfo.firstName && guestInfo.lastName) {
      onContinueAsGuest?.({
        email: guestInfo.email,
        firstName: guestInfo.firstName,
        lastName: guestInfo.lastName,
        phone: guestInfo.phone,
      });
    }
    setStep('shipping');
  }, [guestInfo, onContinueAsGuest, setStep]);

  const goToLogin = useCallback(() => {
    onGoToLogin?.();
  }, [onGoToLogin]);

  const value: GuestCheckoutContextType = {
    guestInfo,
    shippingAddress,
    useBillingForShipping,
    isGuest,
    step,
    errors,
    isLoading,
    savedAddresses,
    setGuestInfo,
    setShippingAddress,
    setUseBillingForShipping,
    setStep,
    validateEmail,
    validatePhone,
    validateForm,
    clearErrors,
    setError,
    continueAsGuest,
    goToLogin,
  };

  return <GuestCheckoutContext.Provider value={value}>{children}</GuestCheckoutContext.Provider>;
}

// Components

// Email Collection
export interface EmailCollectionProps {
  className?: string;
  onSubmit?: (email: string) => void;
  showCreateAccountOption?: boolean;
}

export function EmailCollection({
  className,
  onSubmit,
  showCreateAccountOption = true,
}: EmailCollectionProps) {
  const { guestInfo, setGuestInfo, validateEmail, setError, errors, clearErrors, setStep, goToLogin } =
    useGuestCheckout();
  const [localEmail, setLocalEmail] = useState(guestInfo.email || '');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    clearErrors();

    if (!localEmail) {
      setError('email', 'Email is required');
      return;
    }

    if (!validateEmail(localEmail)) {
      setError('email', 'Please enter a valid email');
      return;
    }

    setGuestInfo({ email: localEmail });
    onSubmit?.(localEmail);
    setStep('info');
  };

  return (
    <Card className={className} data-testid="email-collection">
      <CardHeader>
        <CardTitle className="text-lg">Continue to Checkout</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Email Address
            </label>
            <Input
              id="email"
              type="email"
              value={localEmail}
              onChange={(e) => setLocalEmail(e.target.value)}
              placeholder="you@example.com"
              className={cn(errors.email && 'border-red-500')}
              data-testid="email-input"
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1" data-testid="email-error">
                {errors.email}
              </p>
            )}
          </div>

          <Button type="submit" className="w-full" data-testid="continue-button">
            Continue
          </Button>

          {showCreateAccountOption && (
            <div className="text-center">
              <p className="text-sm text-gray-600">Already have an account?</p>
              <Button variant="link" onClick={goToLogin} type="button" data-testid="login-link">
                Sign in
              </Button>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

// Guest Info Form
export interface GuestInfoFormProps {
  className?: string;
  onSubmit?: (info: GuestInfo) => void;
}

export function GuestInfoForm({ className, onSubmit }: GuestInfoFormProps) {
  const { guestInfo, setGuestInfo, errors, setError, clearErrors, continueAsGuest, validatePhone } =
    useGuestCheckout();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    clearErrors();

    let hasErrors = false;

    if (!guestInfo.firstName) {
      setError('firstName', 'First name is required');
      hasErrors = true;
    }

    if (!guestInfo.lastName) {
      setError('lastName', 'Last name is required');
      hasErrors = true;
    }

    if (guestInfo.phone && !validatePhone(guestInfo.phone)) {
      setError('phone', 'Please enter a valid phone number');
      hasErrors = true;
    }

    if (hasErrors) return;

    if (guestInfo.email && guestInfo.firstName && guestInfo.lastName) {
      onSubmit?.({
        email: guestInfo.email,
        firstName: guestInfo.firstName,
        lastName: guestInfo.lastName,
        phone: guestInfo.phone,
      });
      continueAsGuest();
    }
  };

  return (
    <Card className={className} data-testid="guest-info-form">
      <CardHeader>
        <CardTitle className="text-lg">Your Information</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium mb-1">
                First Name *
              </label>
              <Input
                id="firstName"
                value={guestInfo.firstName || ''}
                onChange={(e) => setGuestInfo({ firstName: e.target.value })}
                className={cn(errors.firstName && 'border-red-500')}
                data-testid="first-name-input"
              />
              {errors.firstName && (
                <p className="text-red-500 text-sm mt-1" data-testid="first-name-error">
                  {errors.firstName}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium mb-1">
                Last Name *
              </label>
              <Input
                id="lastName"
                value={guestInfo.lastName || ''}
                onChange={(e) => setGuestInfo({ lastName: e.target.value })}
                className={cn(errors.lastName && 'border-red-500')}
                data-testid="last-name-input"
              />
              {errors.lastName && (
                <p className="text-red-500 text-sm mt-1" data-testid="last-name-error">
                  {errors.lastName}
                </p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium mb-1">
              Phone Number (optional)
            </label>
            <Input
              id="phone"
              type="tel"
              value={guestInfo.phone || ''}
              onChange={(e) => setGuestInfo({ phone: e.target.value })}
              placeholder="(555) 123-4567"
              className={cn(errors.phone && 'border-red-500')}
              data-testid="phone-input"
            />
            {errors.phone && (
              <p className="text-red-500 text-sm mt-1" data-testid="phone-error">
                {errors.phone}
              </p>
            )}
          </div>

          <Button type="submit" className="w-full" data-testid="continue-to-shipping">
            Continue to Shipping
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// Shipping Address Form
export interface ShippingAddressFormProps {
  className?: string;
  onSubmit?: (address: ShippingAddress) => void;
  showSavedAddresses?: boolean;
}

export function ShippingAddressForm({
  className,
  onSubmit,
  showSavedAddresses = true,
}: ShippingAddressFormProps) {
  const { shippingAddress, setShippingAddress, errors, setError, clearErrors, savedAddresses, setStep } =
    useGuestCheckout();
  const [selectedSavedAddress, setSelectedSavedAddress] = useState<string | null>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    clearErrors();

    let hasErrors = false;

    if (!shippingAddress.firstName) {
      setError('shippingFirstName', 'First name is required');
      hasErrors = true;
    }

    if (!shippingAddress.lastName) {
      setError('shippingLastName', 'Last name is required');
      hasErrors = true;
    }

    if (!shippingAddress.address1) {
      setError('address1', 'Address is required');
      hasErrors = true;
    }

    if (!shippingAddress.city) {
      setError('city', 'City is required');
      hasErrors = true;
    }

    if (!shippingAddress.state) {
      setError('state', 'State is required');
      hasErrors = true;
    }

    if (!shippingAddress.postalCode) {
      setError('postalCode', 'Postal code is required');
      hasErrors = true;
    }

    if (!shippingAddress.country) {
      setError('country', 'Country is required');
      hasErrors = true;
    }

    if (hasErrors) return;

    const fullAddress: ShippingAddress = {
      firstName: shippingAddress.firstName!,
      lastName: shippingAddress.lastName!,
      address1: shippingAddress.address1!,
      address2: shippingAddress.address2,
      city: shippingAddress.city!,
      state: shippingAddress.state!,
      postalCode: shippingAddress.postalCode!,
      country: shippingAddress.country!,
      phone: shippingAddress.phone,
    };

    onSubmit?.(fullAddress);
    setStep('payment');
  };

  const selectSavedAddress = (address: ShippingAddress, index: number) => {
    setSelectedSavedAddress(String(index));
    setShippingAddress(address);
  };

  return (
    <Card className={className} data-testid="shipping-address-form">
      <CardHeader>
        <CardTitle className="text-lg">Shipping Address</CardTitle>
      </CardHeader>
      <CardContent>
        {showSavedAddresses && savedAddresses && savedAddresses.length > 0 && (
          <div className="mb-6" data-testid="saved-addresses">
            <h4 className="text-sm font-medium mb-2">Saved Addresses</h4>
            <div className="space-y-2">
              {savedAddresses.map((addr, index) => (
                <button
                  key={index}
                  type="button"
                  className={cn(
                    'w-full text-left p-3 border rounded-lg transition-colors',
                    selectedSavedAddress === String(index)
                      ? 'border-blue-500 bg-blue-50'
                      : 'hover:border-gray-400'
                  )}
                  onClick={() => selectSavedAddress(addr, index)}
                  data-testid={`saved-address-${index}`}
                >
                  <p className="font-medium">
                    {addr.firstName} {addr.lastName}
                  </p>
                  <p className="text-sm text-gray-600">
                    {addr.address1}, {addr.city}, {addr.state} {addr.postalCode}
                  </p>
                </button>
              ))}
            </div>
            <div className="my-4 flex items-center">
              <div className="flex-1 border-t" />
              <span className="px-4 text-sm text-gray-500">or enter a new address</span>
              <div className="flex-1 border-t" />
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="shippingFirstName" className="block text-sm font-medium mb-1">
                First Name *
              </label>
              <Input
                id="shippingFirstName"
                value={shippingAddress.firstName || ''}
                onChange={(e) => setShippingAddress({ firstName: e.target.value })}
                className={cn(errors.shippingFirstName && 'border-red-500')}
                data-testid="shipping-first-name"
              />
              {errors.shippingFirstName && (
                <p className="text-red-500 text-sm mt-1">{errors.shippingFirstName}</p>
              )}
            </div>
            <div>
              <label htmlFor="shippingLastName" className="block text-sm font-medium mb-1">
                Last Name *
              </label>
              <Input
                id="shippingLastName"
                value={shippingAddress.lastName || ''}
                onChange={(e) => setShippingAddress({ lastName: e.target.value })}
                className={cn(errors.shippingLastName && 'border-red-500')}
                data-testid="shipping-last-name"
              />
              {errors.shippingLastName && (
                <p className="text-red-500 text-sm mt-1">{errors.shippingLastName}</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="address1" className="block text-sm font-medium mb-1">
              Address *
            </label>
            <Input
              id="address1"
              value={shippingAddress.address1 || ''}
              onChange={(e) => setShippingAddress({ address1: e.target.value })}
              placeholder="Street address"
              className={cn(errors.address1 && 'border-red-500')}
              data-testid="address1-input"
            />
            {errors.address1 && (
              <p className="text-red-500 text-sm mt-1" data-testid="address1-error">
                {errors.address1}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="address2" className="block text-sm font-medium mb-1">
              Apartment, suite, etc. (optional)
            </label>
            <Input
              id="address2"
              value={shippingAddress.address2 || ''}
              onChange={(e) => setShippingAddress({ address2: e.target.value })}
              data-testid="address2-input"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="city" className="block text-sm font-medium mb-1">
                City *
              </label>
              <Input
                id="city"
                value={shippingAddress.city || ''}
                onChange={(e) => setShippingAddress({ city: e.target.value })}
                className={cn(errors.city && 'border-red-500')}
                data-testid="city-input"
              />
              {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
            </div>
            <div>
              <label htmlFor="state" className="block text-sm font-medium mb-1">
                State *
              </label>
              <Input
                id="state"
                value={shippingAddress.state || ''}
                onChange={(e) => setShippingAddress({ state: e.target.value })}
                className={cn(errors.state && 'border-red-500')}
                data-testid="state-input"
              />
              {errors.state && <p className="text-red-500 text-sm mt-1">{errors.state}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="postalCode" className="block text-sm font-medium mb-1">
                Postal Code *
              </label>
              <Input
                id="postalCode"
                value={shippingAddress.postalCode || ''}
                onChange={(e) => setShippingAddress({ postalCode: e.target.value })}
                className={cn(errors.postalCode && 'border-red-500')}
                data-testid="postal-code-input"
              />
              {errors.postalCode && <p className="text-red-500 text-sm mt-1">{errors.postalCode}</p>}
            </div>
            <div>
              <label htmlFor="country" className="block text-sm font-medium mb-1">
                Country *
              </label>
              <Input
                id="country"
                value={shippingAddress.country || ''}
                onChange={(e) => setShippingAddress({ country: e.target.value })}
                className={cn(errors.country && 'border-red-500')}
                data-testid="country-input"
              />
              {errors.country && <p className="text-red-500 text-sm mt-1">{errors.country}</p>}
            </div>
          </div>

          <Button type="submit" className="w-full" data-testid="continue-to-payment">
            Continue to Payment
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// Express Checkout Options
export interface ExpressCheckoutProps {
  className?: string;
  onPayPal?: () => void;
  onApplePay?: () => void;
  onGooglePay?: () => void;
  onShopPay?: () => void;
  showPayPal?: boolean;
  showApplePay?: boolean;
  showGooglePay?: boolean;
  showShopPay?: boolean;
}

export function ExpressCheckout({
  className,
  onPayPal,
  onApplePay,
  onGooglePay,
  onShopPay,
  showPayPal = true,
  showApplePay = true,
  showGooglePay = true,
  showShopPay = false,
}: ExpressCheckoutProps) {
  return (
    <div className={cn('space-y-3', className)} data-testid="express-checkout">
      <h4 className="text-sm font-medium text-center text-gray-600">Express Checkout</h4>
      <div className="grid grid-cols-2 gap-2">
        {showPayPal && (
          <Button
            variant="outline"
            className="h-12 bg-[#ffc439] hover:bg-[#f0b72e] text-[#003087] border-[#ffc439]"
            onClick={onPayPal}
            data-testid="paypal-button"
          >
            <svg className="h-5 w-20" viewBox="0 0 100 32" aria-label="PayPal">
              <text x="0" y="22" fontSize="14" fontWeight="bold" fill="currentColor">
                PayPal
              </text>
            </svg>
          </Button>
        )}
        {showApplePay && (
          <Button
            variant="outline"
            className="h-12 bg-black hover:bg-gray-900 text-white border-black"
            onClick={onApplePay}
            data-testid="apple-pay-button"
          >
            <svg className="h-5 w-12" viewBox="0 0 50 20" aria-label="Apple Pay">
              <text x="0" y="15" fontSize="12" fill="currentColor">
                 Pay
              </text>
            </svg>
          </Button>
        )}
        {showGooglePay && (
          <Button
            variant="outline"
            className="h-12"
            onClick={onGooglePay}
            data-testid="google-pay-button"
          >
            <svg className="h-5 w-16" viewBox="0 0 60 20" aria-label="Google Pay">
              <text x="0" y="15" fontSize="11" fill="#4285F4" fontWeight="500">
                G
              </text>
              <text x="12" y="15" fontSize="11" fill="#3C4043" fontWeight="500">
                Pay
              </text>
            </svg>
          </Button>
        )}
        {showShopPay && (
          <Button
            variant="outline"
            className="h-12 bg-[#5a31f4] hover:bg-[#4926c9] text-white border-[#5a31f4]"
            onClick={onShopPay}
            data-testid="shop-pay-button"
          >
            <svg className="h-5 w-20" viewBox="0 0 80 20" aria-label="Shop Pay">
              <text x="0" y="15" fontSize="12" fill="currentColor" fontWeight="500">
                Shop Pay
              </text>
            </svg>
          </Button>
        )}
      </div>
      <div className="flex items-center gap-4">
        <div className="flex-1 border-t" />
        <span className="text-sm text-gray-500">or</span>
        <div className="flex-1 border-t" />
      </div>
    </div>
  );
}

// Create Account Prompt
export interface CreateAccountPromptProps {
  className?: string;
  email?: string;
  onCreateAccount?: (password: string) => void;
  onSkip?: () => void;
}

export function CreateAccountPrompt({
  className,
  email,
  onCreateAccount,
  onSkip,
}: CreateAccountPromptProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    onCreateAccount?.(password);
  };

  return (
    <Card className={className} data-testid="create-account-prompt">
      <CardHeader>
        <CardTitle className="text-lg">Save your information?</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 mb-4">
          Create an account to track your orders and checkout faster next time.
        </p>

        {email && (
          <p className="text-sm mb-4">
            Account email: <span className="font-medium">{email}</span>
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1">
              Create Password
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              data-testid="password-input"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1">
              Confirm Password
            </label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              data-testid="confirm-password-input"
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm" data-testid="password-error">
              {error}
            </p>
          )}

          <div className="flex gap-3">
            <Button type="submit" className="flex-1" data-testid="create-account-button">
              Create Account
            </Button>
            <Button type="button" variant="outline" onClick={onSkip} data-testid="skip-button">
              Skip
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// Order Summary for Guest
export interface GuestOrderSummaryProps {
  className?: string;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
    image?: string;
  }>;
  subtotal: number;
  shipping?: number;
  tax?: number;
  total: number;
  promoCode?: string;
  promoDiscount?: number;
}

export function GuestOrderSummary({
  className,
  items,
  subtotal,
  shipping,
  tax,
  total,
  promoCode,
  promoDiscount,
}: GuestOrderSummaryProps) {
  return (
    <Card className={className} data-testid="guest-order-summary">
      <CardHeader>
        <CardTitle className="text-lg">Order Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-3" data-testid={`summary-item-${item.id}`}>
              {item.image && (
                <img src={item.image} alt="" className="h-12 w-12 rounded object-cover" />
              )}
              <div className="flex-1">
                <p className="text-sm font-medium">{item.name}</p>
                <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
              </div>
              <p className="text-sm font-medium">${(item.price * item.quantity).toFixed(2)}</p>
            </div>
          ))}
        </div>

        <div className="border-t pt-3 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal</span>
            <span data-testid="subtotal">${subtotal.toFixed(2)}</span>
          </div>
          {shipping !== undefined && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Shipping</span>
              <span data-testid="shipping">{shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}</span>
            </div>
          )}
          {tax !== undefined && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Tax</span>
              <span data-testid="tax">${tax.toFixed(2)}</span>
            </div>
          )}
          {promoCode && promoDiscount && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Promo ({promoCode})</span>
              <span data-testid="promo-discount">-${promoDiscount.toFixed(2)}</span>
            </div>
          )}
        </div>

        <div className="border-t pt-3">
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span data-testid="total">${total.toFixed(2)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Main Guest Checkout Component
export interface GuestCheckoutProps {
  className?: string;
  onContinueAsGuest?: (info: GuestInfo) => void;
  onGoToLogin?: () => void;
  onShippingSubmit?: (address: ShippingAddress) => void;
  savedAddresses?: ShippingAddress[];
  showExpressCheckout?: boolean;
  onPayPal?: () => void;
  onApplePay?: () => void;
  onGooglePay?: () => void;
}

export function GuestCheckout({
  className,
  onContinueAsGuest,
  onGoToLogin,
  onShippingSubmit,
  savedAddresses,
  showExpressCheckout = true,
  onPayPal,
  onApplePay,
  onGooglePay,
}: GuestCheckoutProps) {
  return (
    <GuestCheckoutProvider
      onContinueAsGuest={onContinueAsGuest}
      onGoToLogin={onGoToLogin}
      savedAddresses={savedAddresses}
    >
      <div className={cn('space-y-6', className)} data-testid="guest-checkout">
        <GuestCheckoutContent
          showExpressCheckout={showExpressCheckout}
          onPayPal={onPayPal}
          onApplePay={onApplePay}
          onGooglePay={onGooglePay}
          onShippingSubmit={onShippingSubmit}
        />
      </div>
    </GuestCheckoutProvider>
  );
}

function GuestCheckoutContent({
  showExpressCheckout,
  onPayPal,
  onApplePay,
  onGooglePay,
  onShippingSubmit,
}: {
  showExpressCheckout: boolean;
  onPayPal?: () => void;
  onApplePay?: () => void;
  onGooglePay?: () => void;
  onShippingSubmit?: (address: ShippingAddress) => void;
}) {
  const { step } = useGuestCheckout();

  return (
    <>
      {step === 'email' && (
        <>
          {showExpressCheckout && (
            <ExpressCheckout onPayPal={onPayPal} onApplePay={onApplePay} onGooglePay={onGooglePay} />
          )}
          <EmailCollection />
        </>
      )}
      {step === 'info' && <GuestInfoForm />}
      {step === 'shipping' && <ShippingAddressForm onSubmit={onShippingSubmit} />}
    </>
  );
}
