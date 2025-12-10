import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

declare global {
  interface Window {
    paypal?: any;
  }
}

interface PayPalButtonProps {
  amount: number;
  currency?: string;
  orderId: string;
  onSuccess: (details: any) => void;
  onError: (error: any) => void;
  onCancel?: () => void;
  clientId?: string;
}

export function PayPalButton({
  amount,
  currency = 'USD',
  orderId,
  onSuccess,
  onError,
  onCancel,
  clientId = 'AYSq3RDGsmBLJE-otTkBtM-jBRd1TCQwFf9RGfwddNXWz0uFU9ztymylOhRS', // Default sandbox client ID
}: PayPalButtonProps) {
  const paypalRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load PayPal SDK script
    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=${currency}`;
    script.async = true;
    script.onload = () => {
      setLoading(false);
      if (window.paypal && paypalRef.current) {
        window.paypal
          .Buttons({
            style: {
              layout: 'vertical',
              color: 'gold',
              shape: 'rect',
              label: 'paypal',
            },
            createOrder: (_data: unknown, actions: { order: { create: (order: unknown) => Promise<string> } }) => {
              return actions.order.create({
                purchase_units: [
                  {
                    reference_id: orderId,
                    amount: {
                      currency_code: currency,
                      value: amount.toFixed(2),
                    },
                  },
                ],
              });
            },
            onApprove: async (_data: unknown, actions: { order: { capture: () => Promise<unknown> } }) => {
              try {
                const order = await actions.order.capture();
                onSuccess(order);
              } catch (error) {
                onError(error);
              }
            },
            onError: (err: any) => {
              console.error('PayPal Checkout Error:', err);
              onError(err);
            },
            onCancel: () => {
              if (onCancel) {
                onCancel();
              }
            },
          })
          .render(paypalRef.current);
      }
    };

    script.onerror = () => {
      setLoading(false);
      onError(new Error('Failed to load PayPal SDK'));
    };

    document.body.appendChild(script);

    return () => {
      // Clean up
      const scriptElement = document.querySelector(
        `script[src*="paypal.com/sdk/js"]`
      );
      if (scriptElement) {
        scriptElement.remove();
      }
    };
  }, [amount, currency, orderId, clientId, onSuccess, onError, onCancel]);

  if (loading) {
    return (
      <Button disabled className="w-full" size="lg">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading PayPal...
      </Button>
    );
  }

  return (
    <div className="w-full">
      <div ref={paypalRef} />
    </div>
  );
}