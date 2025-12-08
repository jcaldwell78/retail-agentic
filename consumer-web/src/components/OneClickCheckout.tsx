import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// Types
export interface SavedPaymentMethod {
  id: string;
  type: 'card' | 'paypal' | 'apple_pay' | 'google_pay';
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  email?: string;
  isDefault: boolean;
  isExpired?: boolean;
}

export interface SavedAddress {
  id: string;
  firstName: string;
  lastName: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
  isDefault: boolean;
}

export interface OneClickSettings {
  isEnabled: boolean;
  defaultPaymentMethodId: string | null;
  defaultAddressId: string | null;
  expressCheckoutEnabled: boolean;
}

export interface OneClickContextValue {
  savedPaymentMethods: SavedPaymentMethod[];
  savedAddresses: SavedAddress[];
  settings: OneClickSettings;
  selectedPaymentMethod: SavedPaymentMethod | null;
  selectedAddress: SavedAddress | null;
  isLoading: boolean;
  canUseOneClick: boolean;
  selectPaymentMethod: (id: string) => void;
  selectAddress: (id: string) => void;
  setDefaultPaymentMethod: (id: string) => void;
  setDefaultAddress: (id: string) => void;
  removePaymentMethod: (id: string) => void;
  removeAddress: (id: string) => void;
  performOneClickCheckout: (productId?: string, quantity?: number) => Promise<string | null>;
  enableOneClick: () => void;
  disableOneClick: () => void;
}

const OneClickContext = createContext<OneClickContextValue | null>(null);

export function useOneClickCheckout(): OneClickContextValue {
  const context = useContext(OneClickContext);
  if (!context) {
    throw new Error('useOneClickCheckout must be used within a OneClickCheckoutProvider');
  }
  return context;
}

// Provider
interface OneClickCheckoutProviderProps {
  children: ReactNode;
  initialPaymentMethods?: SavedPaymentMethod[];
  initialAddresses?: SavedAddress[];
  initialSettings?: Partial<OneClickSettings>;
  onCheckout?: (data: {
    paymentMethodId: string;
    addressId: string;
    productId?: string;
    quantity?: number;
  }) => Promise<string | null>;
  onSetDefaultPaymentMethod?: (id: string) => void;
  onSetDefaultAddress?: (id: string) => void;
  onRemovePaymentMethod?: (id: string) => void;
  onRemoveAddress?: (id: string) => void;
  onSettingsChange?: (settings: OneClickSettings) => void;
}

export function OneClickCheckoutProvider({
  children,
  initialPaymentMethods = [],
  initialAddresses = [],
  initialSettings,
  onCheckout,
  onSetDefaultPaymentMethod,
  onSetDefaultAddress,
  onRemovePaymentMethod,
  onRemoveAddress,
  onSettingsChange,
}: OneClickCheckoutProviderProps) {
  const [savedPaymentMethods, setSavedPaymentMethods] = useState<SavedPaymentMethod[]>(
    initialPaymentMethods
  );
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>(initialAddresses);
  const [settings, setSettings] = useState<OneClickSettings>({
    isEnabled: true,
    defaultPaymentMethodId: initialPaymentMethods.find((m) => m.isDefault)?.id || null,
    defaultAddressId: initialAddresses.find((a) => a.isDefault)?.id || null,
    expressCheckoutEnabled: true,
    ...initialSettings,
  });
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string | null>(
    settings.defaultPaymentMethodId
  );
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    settings.defaultAddressId
  );
  const [isLoading, setIsLoading] = useState(false);

  const selectedPaymentMethod = savedPaymentMethods.find(
    (m) => m.id === selectedPaymentMethodId
  ) || null;
  const selectedAddress = savedAddresses.find((a) => a.id === selectedAddressId) || null;

  const canUseOneClick =
    settings.isEnabled &&
    savedPaymentMethods.some((m) => !m.isExpired) &&
    savedAddresses.length > 0;

  const selectPaymentMethod = useCallback((id: string) => {
    setSelectedPaymentMethodId(id);
  }, []);

  const selectAddress = useCallback((id: string) => {
    setSelectedAddressId(id);
  }, []);

  const setDefaultPaymentMethod = useCallback(
    (id: string) => {
      setSavedPaymentMethods((prev) =>
        prev.map((m) => ({ ...m, isDefault: m.id === id }))
      );
      setSettings((prev) => {
        const newSettings = { ...prev, defaultPaymentMethodId: id };
        onSettingsChange?.(newSettings);
        return newSettings;
      });
      onSetDefaultPaymentMethod?.(id);
    },
    [onSetDefaultPaymentMethod, onSettingsChange]
  );

  const setDefaultAddress = useCallback(
    (id: string) => {
      setSavedAddresses((prev) =>
        prev.map((a) => ({ ...a, isDefault: a.id === id }))
      );
      setSettings((prev) => {
        const newSettings = { ...prev, defaultAddressId: id };
        onSettingsChange?.(newSettings);
        return newSettings;
      });
      onSetDefaultAddress?.(id);
    },
    [onSetDefaultAddress, onSettingsChange]
  );

  const removePaymentMethod = useCallback(
    (id: string) => {
      setSavedPaymentMethods((prev) => prev.filter((m) => m.id !== id));
      if (selectedPaymentMethodId === id) {
        setSelectedPaymentMethodId(null);
      }
      if (settings.defaultPaymentMethodId === id) {
        setSettings((prev) => ({ ...prev, defaultPaymentMethodId: null }));
      }
      onRemovePaymentMethod?.(id);
    },
    [selectedPaymentMethodId, settings.defaultPaymentMethodId, onRemovePaymentMethod]
  );

  const removeAddress = useCallback(
    (id: string) => {
      setSavedAddresses((prev) => prev.filter((a) => a.id !== id));
      if (selectedAddressId === id) {
        setSelectedAddressId(null);
      }
      if (settings.defaultAddressId === id) {
        setSettings((prev) => ({ ...prev, defaultAddressId: null }));
      }
      onRemoveAddress?.(id);
    },
    [selectedAddressId, settings.defaultAddressId, onRemoveAddress]
  );

  const performOneClickCheckout = useCallback(
    async (productId?: string, quantity?: number): Promise<string | null> => {
      if (!selectedPaymentMethod || !selectedAddress) {
        return null;
      }

      setIsLoading(true);
      try {
        const orderId = await onCheckout?.({
          paymentMethodId: selectedPaymentMethod.id,
          addressId: selectedAddress.id,
          productId,
          quantity,
        });
        return orderId || null;
      } catch (error) {
        console.error('One-click checkout failed:', error);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [selectedPaymentMethod, selectedAddress, onCheckout]
  );

  const enableOneClick = useCallback(() => {
    setSettings((prev) => {
      const newSettings = { ...prev, isEnabled: true };
      onSettingsChange?.(newSettings);
      return newSettings;
    });
  }, [onSettingsChange]);

  const disableOneClick = useCallback(() => {
    setSettings((prev) => {
      const newSettings = { ...prev, isEnabled: false };
      onSettingsChange?.(newSettings);
      return newSettings;
    });
  }, [onSettingsChange]);

  const value: OneClickContextValue = {
    savedPaymentMethods,
    savedAddresses,
    settings,
    selectedPaymentMethod,
    selectedAddress,
    isLoading,
    canUseOneClick,
    selectPaymentMethod,
    selectAddress,
    setDefaultPaymentMethod,
    setDefaultAddress,
    removePaymentMethod,
    removeAddress,
    performOneClickCheckout,
    enableOneClick,
    disableOneClick,
  };

  return (
    <OneClickContext.Provider value={value}>{children}</OneClickContext.Provider>
  );
}

// Buy Now Button
interface BuyNowButtonProps {
  className?: string;
  productId?: string;
  quantity?: number;
  onSuccess?: (orderId: string) => void;
  onError?: (error: Error) => void;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  disabled?: boolean;
}

export function BuyNowButton({
  className,
  productId,
  quantity = 1,
  onSuccess,
  onError,
  variant = 'default',
  size = 'default',
  disabled,
}: BuyNowButtonProps) {
  const { canUseOneClick, isLoading, performOneClickCheckout, selectedPaymentMethod, selectedAddress } =
    useOneClickCheckout();

  const handleClick = async () => {
    try {
      const orderId = await performOneClickCheckout(productId, quantity);
      if (orderId) {
        onSuccess?.(orderId);
      } else {
        onError?.(new Error('One-click checkout failed'));
      }
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error('Unknown error'));
    }
  };

  const isDisabled = disabled || !canUseOneClick || isLoading || !selectedPaymentMethod || !selectedAddress;

  return (
    <Button
      variant={variant}
      size={size}
      className={cn('gap-2', className)}
      onClick={handleClick}
      disabled={isDisabled}
      data-testid="buy-now-button"
      aria-label="Buy now with one click"
    >
      {isLoading ? (
        <>
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Processing...
        </>
      ) : (
        <>
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
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
          Buy Now
        </>
      )}
    </Button>
  );
}

// Saved Payment Method Card
interface PaymentMethodCardProps {
  method: SavedPaymentMethod;
  isSelected?: boolean;
  onSelect?: () => void;
  onSetDefault?: () => void;
  onRemove?: () => void;
  showActions?: boolean;
  className?: string;
}

export function PaymentMethodCard({
  method,
  isSelected,
  onSelect,
  onSetDefault,
  onRemove,
  showActions = true,
  className,
}: PaymentMethodCardProps) {
  const getCardIcon = () => {
    switch (method.type) {
      case 'card':
        return (
          <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
            <line x1="1" y1="10" x2="23" y2="10" />
          </svg>
        );
      case 'paypal':
        return (
          <svg className="w-8 h-8" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#003087" d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797H9.14a.788.788 0 0 0-.779.664l-.92 5.832-.262 1.652a.474.474 0 0 1-.468.404h-1.636z"/>
          </svg>
        );
      case 'apple_pay':
        return (
          <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M17.05 20.28c-.98.95-2.05.8-3.08.36-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.36C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.53 4.08zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
          </svg>
        );
      case 'google_pay':
        return (
          <svg className="w-8 h-8" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.389-7.439-7.574s3.345-7.574 7.439-7.574c2.33 0 3.891.989 4.785 1.849l3.254-3.138C18.189 1.186 15.479 0 12.24 0c-6.635 0-12 5.365-12 12s5.365 12 12 12c6.926 0 11.52-4.869 11.52-11.726 0-.788-.085-1.39-.189-1.989H12.24z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getDisplayName = () => {
    switch (method.type) {
      case 'card':
        return `${method.brand || 'Card'} •••• ${method.last4}`;
      case 'paypal':
        return method.email ? `PayPal (${method.email})` : 'PayPal';
      case 'apple_pay':
        return 'Apple Pay';
      case 'google_pay':
        return 'Google Pay';
      default:
        return 'Payment Method';
    }
  };

  const isExpired = method.isExpired || (
    method.expiryMonth &&
    method.expiryYear &&
    new Date(method.expiryYear, method.expiryMonth - 1) < new Date()
  );

  return (
    <div
      className={cn(
        'flex items-center gap-4 p-4 border rounded-lg transition-all cursor-pointer',
        isSelected ? 'border-primary bg-primary/5 ring-2 ring-primary' : 'hover:border-primary/50',
        isExpired && 'opacity-50',
        className
      )}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      aria-selected={isSelected}
      data-testid={`payment-method-${method.id}`}
    >
      <div className="flex-shrink-0">{getCardIcon()}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{getDisplayName()}</span>
          {method.isDefault && (
            <Badge variant="secondary" className="text-xs">Default</Badge>
          )}
          {isExpired && (
            <Badge variant="destructive" className="text-xs">Expired</Badge>
          )}
        </div>
        {method.type === 'card' && method.expiryMonth && method.expiryYear && (
          <span className="text-sm text-muted-foreground">
            Expires {method.expiryMonth.toString().padStart(2, '0')}/{method.expiryYear.toString().slice(-2)}
          </span>
        )}
      </div>
      {showActions && (
        <div className="flex gap-2">
          {!method.isDefault && !isExpired && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onSetDefault?.();
              }}
              data-testid={`set-default-payment-${method.id}`}
            >
              Set Default
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onRemove?.();
            }}
            className="text-destructive hover:text-destructive"
            data-testid={`remove-payment-${method.id}`}
          >
            Remove
          </Button>
        </div>
      )}
    </div>
  );
}

// Saved Address Card
interface SavedAddressCardProps {
  address: SavedAddress;
  isSelected?: boolean;
  onSelect?: () => void;
  onSetDefault?: () => void;
  onRemove?: () => void;
  showActions?: boolean;
  className?: string;
}

export function SavedAddressCard({
  address,
  isSelected,
  onSelect,
  onSetDefault,
  onRemove,
  showActions = true,
  className,
}: SavedAddressCardProps) {
  return (
    <div
      className={cn(
        'flex items-start gap-4 p-4 border rounded-lg transition-all cursor-pointer',
        isSelected ? 'border-primary bg-primary/5 ring-2 ring-primary' : 'hover:border-primary/50',
        className
      )}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      aria-selected={isSelected}
      data-testid={`address-${address.id}`}
    >
      <div className="flex-shrink-0">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-muted-foreground"
          aria-hidden="true"
        >
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium">
            {address.firstName} {address.lastName}
          </span>
          {address.isDefault && (
            <Badge variant="secondary" className="text-xs">Default</Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          {address.address1}
          {address.address2 && `, ${address.address2}`}
        </p>
        <p className="text-sm text-muted-foreground">
          {address.city}, {address.state} {address.postalCode}
        </p>
        <p className="text-sm text-muted-foreground">{address.country}</p>
      </div>
      {showActions && (
        <div className="flex gap-2">
          {!address.isDefault && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onSetDefault?.();
              }}
              data-testid={`set-default-address-${address.id}`}
            >
              Set Default
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onRemove?.();
            }}
            className="text-destructive hover:text-destructive"
            data-testid={`remove-address-${address.id}`}
          >
            Remove
          </Button>
        </div>
      )}
    </div>
  );
}

// One-Click Checkout Summary
interface OneClickSummaryProps {
  className?: string;
  showEditLinks?: boolean;
  onEditPayment?: () => void;
  onEditAddress?: () => void;
}

export function OneClickSummary({
  className,
  showEditLinks = true,
  onEditPayment,
  onEditAddress,
}: OneClickSummaryProps) {
  const { selectedPaymentMethod, selectedAddress, canUseOneClick } = useOneClickCheckout();

  if (!canUseOneClick) {
    return (
      <Card className={className} data-testid="one-click-summary-disabled">
        <CardContent className="pt-4">
          <p className="text-sm text-muted-foreground text-center">
            One-click checkout is not available. Please add a payment method and address.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className} data-testid="one-click-summary">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-primary"
            aria-hidden="true"
          >
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
          One-Click Checkout
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Payment Summary */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium">Payment</span>
            {showEditLinks && (
              <Button variant="link" size="sm" onClick={onEditPayment} className="h-auto p-0">
                Change
              </Button>
            )}
          </div>
          {selectedPaymentMethod ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {selectedPaymentMethod.type === 'card' ? (
                <span>
                  {selectedPaymentMethod.brand} •••• {selectedPaymentMethod.last4}
                </span>
              ) : (
                <span className="capitalize">{selectedPaymentMethod.type.replace('_', ' ')}</span>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No payment method selected</p>
          )}
        </div>

        {/* Address Summary */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium">Ship to</span>
            {showEditLinks && (
              <Button variant="link" size="sm" onClick={onEditAddress} className="h-auto p-0">
                Change
              </Button>
            )}
          </div>
          {selectedAddress ? (
            <div className="text-sm text-muted-foreground">
              <p>{selectedAddress.firstName} {selectedAddress.lastName}</p>
              <p>{selectedAddress.address1}, {selectedAddress.city}, {selectedAddress.state}</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No address selected</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Payment Methods Selector
interface PaymentMethodsSelectorProps {
  className?: string;
}

export function PaymentMethodsSelector({ className }: PaymentMethodsSelectorProps) {
  const {
    savedPaymentMethods,
    selectedPaymentMethod,
    selectPaymentMethod,
    setDefaultPaymentMethod,
    removePaymentMethod,
  } = useOneClickCheckout();

  if (savedPaymentMethods.length === 0) {
    return (
      <div className={cn('text-center py-8', className)} data-testid="no-payment-methods">
        <p className="text-muted-foreground">No saved payment methods</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)} data-testid="payment-methods-selector">
      {savedPaymentMethods.map((method) => (
        <PaymentMethodCard
          key={method.id}
          method={method}
          isSelected={selectedPaymentMethod?.id === method.id}
          onSelect={() => selectPaymentMethod(method.id)}
          onSetDefault={() => setDefaultPaymentMethod(method.id)}
          onRemove={() => removePaymentMethod(method.id)}
        />
      ))}
    </div>
  );
}

// Addresses Selector
interface AddressesSelectorProps {
  className?: string;
}

export function AddressesSelector({ className }: AddressesSelectorProps) {
  const {
    savedAddresses,
    selectedAddress,
    selectAddress,
    setDefaultAddress,
    removeAddress,
  } = useOneClickCheckout();

  if (savedAddresses.length === 0) {
    return (
      <div className={cn('text-center py-8', className)} data-testid="no-addresses">
        <p className="text-muted-foreground">No saved addresses</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)} data-testid="addresses-selector">
      {savedAddresses.map((address) => (
        <SavedAddressCard
          key={address.id}
          address={address}
          isSelected={selectedAddress?.id === address.id}
          onSelect={() => selectAddress(address.id)}
          onSetDefault={() => setDefaultAddress(address.id)}
          onRemove={() => removeAddress(address.id)}
        />
      ))}
    </div>
  );
}

// One-Click Settings Toggle
interface OneClickSettingsToggleProps {
  className?: string;
}

export function OneClickSettingsToggle({ className }: OneClickSettingsToggleProps) {
  const { settings, enableOneClick, disableOneClick } = useOneClickCheckout();

  return (
    <div className={cn('flex items-center justify-between', className)} data-testid="one-click-settings">
      <div>
        <h4 className="font-medium">One-Click Checkout</h4>
        <p className="text-sm text-muted-foreground">
          Enable faster checkout with saved payment and shipping info
        </p>
      </div>
      <Button
        variant={settings.isEnabled ? 'default' : 'outline'}
        size="sm"
        onClick={settings.isEnabled ? disableOneClick : enableOneClick}
        aria-pressed={settings.isEnabled}
        data-testid="one-click-toggle"
      >
        {settings.isEnabled ? 'Enabled' : 'Disabled'}
      </Button>
    </div>
  );
}

// Main One-Click Checkout Component
interface OneClickCheckoutProps {
  className?: string;
  productId?: string;
  quantity?: number;
  productName?: string;
  productPrice?: number;
  productImage?: string;
  onSuccess?: (orderId: string) => void;
  onError?: (error: Error) => void;
  onCancel?: () => void;
  paymentMethods?: SavedPaymentMethod[];
  addresses?: SavedAddress[];
  onCheckout?: (data: {
    paymentMethodId: string;
    addressId: string;
    productId?: string;
    quantity?: number;
  }) => Promise<string | null>;
}

export function OneClickCheckout({
  className,
  productId,
  quantity = 1,
  productName,
  productPrice,
  productImage,
  onSuccess,
  onError,
  onCancel,
  paymentMethods = [],
  addresses = [],
  onCheckout,
}: OneClickCheckoutProps) {
  return (
    <OneClickCheckoutProvider
      initialPaymentMethods={paymentMethods}
      initialAddresses={addresses}
      onCheckout={onCheckout}
    >
      <Card className={className} data-testid="one-click-checkout">
        <CardHeader>
          <CardTitle className="text-lg">Quick Checkout</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Product Preview */}
          {productName && (
            <div className="flex items-center gap-4" data-testid="product-preview">
              {productImage && (
                <img
                  src={productImage}
                  alt={productName}
                  className="w-16 h-16 object-cover rounded-lg"
                />
              )}
              <div className="flex-1">
                <p className="font-medium">{productName}</p>
                <p className="text-sm text-muted-foreground">Qty: {quantity}</p>
              </div>
              {productPrice && (
                <p className="font-semibold">${(productPrice * quantity).toFixed(2)}</p>
              )}
            </div>
          )}

          <OneClickSummary showEditLinks={false} />

          <div className="flex gap-3">
            <BuyNowButton
              className="flex-1"
              productId={productId}
              quantity={quantity}
              onSuccess={onSuccess}
              onError={onError}
              size="lg"
            />
            {onCancel && (
              <Button variant="outline" onClick={onCancel} data-testid="cancel-button">
                Cancel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </OneClickCheckoutProvider>
  );
}

export default OneClickCheckout;
