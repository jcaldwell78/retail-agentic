import { useState } from 'react';
import { PaymentMethodSelector, PaymentMethod } from './PaymentMethodSelector';
import { PayPalButton } from './PayPalButton';
import { ApplePayButton } from './ApplePayButton';
import { GooglePayButton } from './GooglePayButton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

interface PaymentProcessorProps {
  amount: number;
  currency?: string;
  orderId: string;
  onSuccess: (paymentData: any) => void;
  onError: (error: any) => void;
  onCancel?: () => void;
  availableMethods?: PaymentMethod[];
}

type PaymentStatus = 'idle' | 'processing' | 'success' | 'error';

export function PaymentProcessor({
  amount,
  currency = 'USD',
  orderId,
  onSuccess,
  onError,
  onCancel,
  availableMethods = ['paypal', 'apple_pay', 'google_pay', 'credit_card'],
}: PaymentProcessorProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [status, setStatus] = useState<PaymentStatus>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');

  const handlePaymentSuccess = (paymentData: any) => {
    setStatus('success');
    setStatusMessage('Payment completed successfully!');
    onSuccess({
      ...paymentData,
      paymentMethod: selectedMethod,
      orderId,
      amount,
      currency,
    });
  };

  const handlePaymentError = (error: any) => {
    setStatus('error');
    setStatusMessage(error.message || 'Payment failed. Please try again.');
    onError(error);
  };

  const handlePaymentCancel = () => {
    setStatus('idle');
    setStatusMessage('Payment cancelled.');
    if (onCancel) {
      onCancel();
    }
  };

  const formatAmount = () => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Complete Your Payment</CardTitle>
        <CardDescription>
          Total amount: <span className="font-semibold text-lg">{formatAmount()}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Messages */}
        {status === 'success' && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{statusMessage}</AlertDescription>
          </Alert>
        )}

        {status === 'error' && (
          <Alert className="bg-red-50 border-red-200">
            <XCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{statusMessage}</AlertDescription>
          </Alert>
        )}

        {status === 'processing' && (
          <Alert className="bg-blue-50 border-blue-200">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">Processing payment...</AlertDescription>
          </Alert>
        )}

        {/* Payment Method Selection */}
        {status !== 'success' && (
          <>
            <div>
              <h3 className="text-sm font-medium mb-3">Select Payment Method</h3>
              <PaymentMethodSelector
                selectedMethod={selectedMethod}
                onMethodSelect={setSelectedMethod}
                availableMethods={availableMethods}
              />
            </div>

            {/* Payment Buttons */}
            {selectedMethod && (
              <div className="pt-4 border-t">
                {selectedMethod === 'paypal' && (
                  <PayPalButton
                    amount={amount}
                    currency={currency}
                    orderId={orderId}
                    onSuccess={handlePaymentSuccess}
                    onError={handlePaymentError}
                    onCancel={handlePaymentCancel}
                  />
                )}

                {selectedMethod === 'apple_pay' && (
                  <ApplePayButton
                    amount={amount}
                    currency={currency}
                    orderId={orderId}
                    onSuccess={handlePaymentSuccess}
                    onError={handlePaymentError}
                    onCancel={handlePaymentCancel}
                  />
                )}

                {selectedMethod === 'google_pay' && (
                  <GooglePayButton
                    amount={amount}
                    currency={currency}
                    orderId={orderId}
                    onSuccess={handlePaymentSuccess}
                    onError={handlePaymentError}
                    onCancel={handlePaymentCancel}
                  />
                )}

                {selectedMethod === 'credit_card' && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Credit card payment form would go here</p>
                    <p className="text-sm mt-2">
                      Integration with Stripe Elements or similar solution
                    </p>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Test Mode Notice */}
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Test Mode:</strong> This payment system is running in sandbox/test mode.
            No real charges will be made.
          </p>
          <div className="mt-2 text-xs text-yellow-700">
            <p>Test credentials:</p>
            <ul className="list-disc list-inside mt-1">
              <li>PayPal: Use sandbox account</li>
              <li>Stripe: Use test card 4242 4242 4242 4242</li>
              <li>Apple Pay: Available on Safari with test device</li>
              <li>Google Pay: Works in TEST environment</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}