import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

// Google Pay types - using module augmentation to avoid conflicts with Google Identity types
interface GooglePayApi {
  PaymentsClient: new (config: { environment: string }) => GooglePaymentsClient;
}

interface GooglePaymentsClient {
  isReadyToPay(request: unknown): Promise<{ result: boolean }>;
  createButton(options: unknown): HTMLElement;
  loadPaymentData(request: unknown): Promise<unknown>;
}

interface GooglePayWindow {
  payments?: {
    api?: GooglePayApi;
  };
}

interface GooglePayButtonProps {
  amount: number;
  currency?: string;
  orderId: string;
  merchantId?: string;
  merchantName?: string;
  onSuccess: (paymentData: any) => void;
  onError: (error: any) => void;
  onCancel?: () => void;
  stripePublishableKey?: string;
}

export function GooglePayButton({
  amount,
  currency = 'USD',
  orderId: _orderId,
  merchantId = 'BCR2DN6T2K7G5ELA', // Test merchant ID
  merchantName = 'Retail Platform',
  onSuccess,
  onError,
  onCancel,
  stripePublishableKey = 'pk_test_51OJHqKSGWnCjP3xkYQZH7X4A2example',
}: GooglePayButtonProps) {
  // Note: orderId is available for future backend integration
  void _orderId;
  const buttonRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const paymentsClient = useRef<any>(null);

  const baseRequest = {
    apiVersion: 2,
    apiVersionMinor: 0,
  };

  const tokenizationSpecification = {
    type: 'PAYMENT_GATEWAY',
    parameters: {
      gateway: 'stripe',
      'stripe:version': '2023-10-16',
      'stripe:publishableKey': stripePublishableKey,
    },
  };

  const cardPaymentMethod = {
    type: 'CARD',
    parameters: {
      allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
      allowedCardNetworks: ['AMEX', 'DISCOVER', 'JCB', 'MASTERCARD', 'VISA'],
    },
    tokenizationSpecification,
  };

  useEffect(() => {
    // Load Google Pay API script
    const script = document.createElement('script');
    script.src = 'https://pay.google.com/gp/p/js/pay.js';
    script.async = true;
    script.onload = () => {
      initializeGooglePay();
    };
    script.onerror = () => {
      setLoading(false);
      onError(new Error('Failed to load Google Pay SDK'));
    };
    document.body.appendChild(script);

    return () => {
      const scriptElement = document.querySelector(
        'script[src*="pay.google.com"]'
      );
      if (scriptElement) {
        scriptElement.remove();
      }
    };
  }, []);

  const initializeGooglePay = async () => {
    const googlePay = (window as unknown as { google?: GooglePayWindow }).google;
    if (!googlePay?.payments?.api) {
      setLoading(false);
      return;
    }

    // Initialize Google Pay client
    paymentsClient.current = new googlePay.payments.api.PaymentsClient({
      environment: 'TEST', // Change to 'PRODUCTION' for live environment
    });

    // Check if Google Pay is available
    const isReadyToPayRequest = {
      ...baseRequest,
      allowedPaymentMethods: [cardPaymentMethod],
    };

    try {
      const response = await paymentsClient.current.isReadyToPay(isReadyToPayRequest);
      setIsReady(response.result);
      setLoading(false);

      if (response.result && buttonRef.current) {
        // Create and append Google Pay button
        const button = paymentsClient.current.createButton({
          onClick: handleGooglePayClick,
          buttonType: 'long',
          buttonSizeMode: 'fill',
        });
        buttonRef.current.appendChild(button);
      }
    } catch (error) {
      console.error('Google Pay initialization error:', error);
      setLoading(false);
      onError(error);
    }
  };

  const handleGooglePayClick = async () => {
    if (!paymentsClient.current) {
      onError(new Error('Google Pay is not initialized'));
      return;
    }

    const paymentDataRequest = {
      ...baseRequest,
      allowedPaymentMethods: [cardPaymentMethod],
      transactionInfo: {
        totalPriceStatus: 'FINAL',
        totalPrice: amount.toFixed(2),
        currencyCode: currency,
        countryCode: 'US',
      },
      merchantInfo: {
        merchantId,
        merchantName,
      },
      callbackIntents: ['PAYMENT_AUTHORIZATION'],
    };

    try {
      const paymentData = await paymentsClient.current.loadPaymentData(paymentDataRequest);

      // Process the payment with your backend
      // For now, we'll simulate success
      onSuccess(paymentData);
    } catch (error: any) {
      if (error.statusCode === 'CANCELED') {
        if (onCancel) {
          onCancel();
        }
      } else {
        console.error('Google Pay error:', error);
        onError(error);
      }
    }
  };

  if (loading) {
    return (
      <Button disabled className="w-full" size="lg">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading Google Pay...
      </Button>
    );
  }

  if (!isReady) {
    // Google Pay is not available
    return null;
  }

  return (
    <div className="w-full">
      <div
        ref={buttonRef}
        className="google-pay-button-container"
        style={{ width: '100%', height: '48px' }}
      />
      <style>{`
        .google-pay-button-container > div {
          width: 100% !important;
        }
      `}</style>
    </div>
  );
}