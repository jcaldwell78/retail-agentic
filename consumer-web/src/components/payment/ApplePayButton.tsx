import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Apple } from 'lucide-react';

declare global {
  interface Window {
    ApplePaySession?: any;
  }
}

interface ApplePayButtonProps {
  amount: number;
  currency?: string;
  orderId: string;
  merchantIdentifier?: string;
  countryCode?: string;
  onSuccess: (payment: any) => void;
  onError: (error: any) => void;
  onCancel?: () => void;
  stripePublishableKey?: string;
}

export function ApplePayButton({
  amount,
  currency = 'USD',
  orderId,
  merchantIdentifier = 'merchant.com.retail.platform',
  countryCode = 'US',
  onSuccess,
  onError,
  onCancel,
  stripePublishableKey: _stripePublishableKey,
}: ApplePayButtonProps) {
  // Note: stripePublishableKey is available for future Stripe integration
  void _stripePublishableKey;
  const [canMakePayments, setCanMakePayments] = useState(false);

  useEffect(() => {
    // Check if Apple Pay is available
    if (window.ApplePaySession) {
      const canMake = window.ApplePaySession.canMakePayments();
      setCanMakePayments(canMake);

      // Check if the user has an active card
      if (canMake && window.ApplePaySession.canMakePaymentsWithActiveCard) {
        window.ApplePaySession.canMakePaymentsWithActiveCard(merchantIdentifier)
          .then((canMakePaymentsWithActiveCard: boolean) => {
            setCanMakePayments(canMakePaymentsWithActiveCard);
          })
          .catch(() => {
            setCanMakePayments(false);
          });
      }
    }
  }, [merchantIdentifier]);

  const handleApplePayClick = () => {
    if (!window.ApplePaySession) {
      onError(new Error('Apple Pay is not available'));
      return;
    }

    // Define the payment request
    const paymentRequest = {
      countryCode,
      currencyCode: currency,
      supportedNetworks: ['visa', 'masterCard', 'amex', 'discover'],
      merchantCapabilities: ['supports3DS'],
      total: {
        label: `Order ${orderId}`,
        amount: amount.toFixed(2),
      },
    };

    // Create new Apple Pay session
    const session = new window.ApplePaySession(3, paymentRequest);

    // Handle merchant validation
    session.onvalidatemerchant = async (_event: unknown) => {
      try {
        // In production, you would call your backend to get a merchant session from Apple
        // For now, we'll simulate this
        const merchantSession = {
          epochTimestamp: Date.now(),
          expiresAt: Date.now() + 300000, // 5 minutes
          merchantSessionIdentifier: 'mock_session_id',
          nonce: 'mock_nonce',
          merchantIdentifier,
          domainName: window.location.hostname,
          displayName: 'Retail Platform',
          signature: 'mock_signature',
        };

        session.completeMerchantValidation(merchantSession);
      } catch (error) {
        session.abort();
        onError(error);
      }
    };

    // Handle payment authorization
    session.onpaymentauthorized = (event: any) => {
      // Process the payment with Stripe or your payment processor
      // For now, we'll simulate success
      const result = {
        status: window.ApplePaySession.STATUS_SUCCESS,
      };

      session.completePayment(result);
      onSuccess(event.payment);
    };

    // Handle cancellation
    session.oncancel = () => {
      if (onCancel) {
        onCancel();
      }
    };

    // Start the session
    session.begin();
  };

  if (!canMakePayments) {
    // Apple Pay is not available on this device
    return null;
  }

  return (
    <Button
      onClick={handleApplePayClick}
      className="w-full bg-black hover:bg-gray-900 text-white"
      size="lg"
    >
      <Apple className="mr-2 h-5 w-5" />
      Pay with Apple Pay
    </Button>
  );
}