import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, Lock } from 'lucide-react';

export interface PaymentFormData {
  paymentMethod: 'credit_card' | 'paypal' | 'apple_pay' | 'google_pay';
  cardNumber?: string;
  cardName?: string;
  expiryDate?: string;
  cvv?: string;
  saveCard?: boolean;
}

interface PaymentFormProps {
  onSubmit: (data: PaymentFormData) => void;
  onBack: () => void;
  loading?: boolean;
}

export default function PaymentForm({ onSubmit, onBack, loading = false }: PaymentFormProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentFormData['paymentMethod']>('credit_card');
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [saveCard, setSaveCard] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
    return formatted.substring(0, 19); // 16 digits + 3 spaces
  };

  const formatExpiryDate = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return `${cleaned.substring(0, 2)}/${cleaned.substring(2, 4)}`;
    }
    return cleaned;
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (paymentMethod === 'credit_card') {
      if (!cardNumber || cardNumber.replace(/\s/g, '').length !== 16) {
        newErrors.cardNumber = 'Please enter a valid 16-digit card number';
      }
      if (!cardName || cardName.trim().length < 3) {
        newErrors.cardName = 'Please enter the name on the card';
      }
      if (!expiryDate || !/^\d{2}\/\d{2}$/.test(expiryDate)) {
        newErrors.expiryDate = 'Please enter a valid expiry date (MM/YY)';
      }
      if (!cvv || cvv.length < 3) {
        newErrors.cvv = 'Please enter a valid CVV';
      }

      // Validate expiry date is in the future
      if (expiryDate && /^\d{2}\/\d{2}$/.test(expiryDate)) {
        const [month, year] = expiryDate.split('/').map(Number);
        const now = new Date();
        const currentYear = now.getFullYear() % 100;
        const currentMonth = now.getMonth() + 1;

        if (year < currentYear || (year === currentYear && month < currentMonth)) {
          newErrors.expiryDate = 'Card has expired';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const formData: PaymentFormData = {
      paymentMethod,
      ...(paymentMethod === 'credit_card' && {
        cardNumber: cardNumber.replace(/\s/g, ''),
        cardName,
        expiryDate,
        cvv,
        saveCard,
      }),
    };

    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} data-testid="payment-form">
      <Card className="p-6 mb-6">
        <div className="flex items-center mb-6">
          <Lock className="w-5 h-5 text-green-600 mr-2" />
          <h2 className="text-xl font-semibold">Payment Information</h2>
        </div>

        {/* Payment Method Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-3">Payment Method</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button
              type="button"
              onClick={() => setPaymentMethod('credit_card')}
              className={`p-4 border-2 rounded-lg transition-colors ${
                paymentMethod === 'credit_card'
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              data-testid="payment-method-credit-card"
            >
              <CreditCard className="w-6 h-6 mx-auto mb-2" />
              <div className="text-sm font-medium">Credit Card</div>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('paypal')}
              className={`p-4 border-2 rounded-lg transition-colors ${
                paymentMethod === 'paypal'
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              data-testid="payment-method-paypal"
            >
              <div className="text-2xl mb-1">💳</div>
              <div className="text-sm font-medium">PayPal</div>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('apple_pay')}
              className={`p-4 border-2 rounded-lg transition-colors ${
                paymentMethod === 'apple_pay'
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              data-testid="payment-method-apple-pay"
            >
              <div className="text-2xl mb-1">🍎</div>
              <div className="text-sm font-medium">Apple Pay</div>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('google_pay')}
              className={`p-4 border-2 rounded-lg transition-colors ${
                paymentMethod === 'google_pay'
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              data-testid="payment-method-google-pay"
            >
              <div className="text-2xl mb-1">💰</div>
              <div className="text-sm font-medium">Google Pay</div>
            </button>
          </div>
        </div>

        {/* Credit Card Form */}
        {paymentMethod === 'credit_card' && (
          <>
            <div className="mb-4">
              <label htmlFor="cardNumber" className="block text-sm font-medium mb-2">
                Card Number
              </label>
              <input
                id="cardNumber"
                type="text"
                value={cardNumber}
                onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                placeholder="1234 5678 9012 3456"
                className={`w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.cardNumber ? 'border-red-500' : 'border-gray-300'
                }`}
                data-testid="card-number-input"
              />
              {errors.cardNumber && (
                <p className="text-sm text-red-600 mt-1">{errors.cardNumber}</p>
              )}
            </div>

            <div className="mb-4">
              <label htmlFor="cardName" className="block text-sm font-medium mb-2">
                Cardholder Name
              </label>
              <input
                id="cardName"
                type="text"
                value={cardName}
                onChange={(e) => setCardName(e.target.value.toUpperCase())}
                placeholder="JOHN DOE"
                className={`w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.cardName ? 'border-red-500' : 'border-gray-300'
                }`}
                data-testid="card-name-input"
              />
              {errors.cardName && (
                <p className="text-sm text-red-600 mt-1">{errors.cardName}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="expiryDate" className="block text-sm font-medium mb-2">
                  Expiry Date
                </label>
                <input
                  id="expiryDate"
                  type="text"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(formatExpiryDate(e.target.value))}
                  placeholder="MM/YY"
                  className={`w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.expiryDate ? 'border-red-500' : 'border-gray-300'
                  }`}
                  data-testid="expiry-date-input"
                />
                {errors.expiryDate && (
                  <p className="text-sm text-red-600 mt-1">{errors.expiryDate}</p>
                )}
              </div>

              <div>
                <label htmlFor="cvv" className="block text-sm font-medium mb-2">
                  CVV
                </label>
                <input
                  id="cvv"
                  type="text"
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').substring(0, 4))}
                  placeholder="123"
                  className={`w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.cvv ? 'border-red-500' : 'border-gray-300'
                  }`}
                  data-testid="cvv-input"
                />
                {errors.cvv && (
                  <p className="text-sm text-red-600 mt-1">{errors.cvv}</p>
                )}
              </div>
            </div>

            <div className="mb-6">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={saveCard}
                  onChange={(e) => setSaveCard(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  data-testid="save-card-checkbox"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Save card for future purchases
                </span>
              </label>
            </div>
          </>
        )}

        {/* PayPal/Apple Pay/Google Pay placeholders */}
        {paymentMethod !== 'credit_card' && (
          <div className="py-8 text-center text-gray-600">
            <p className="mb-4">
              You will be redirected to complete your payment with {paymentMethod.replace('_', ' ')}
            </p>
            <div className="text-4xl">🔒</div>
          </div>
        )}

        {/* Security Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <Lock className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
            <div className="text-sm text-blue-800">
              <strong>Secure Payment:</strong> Your payment information is encrypted and secure.
              We never store your full card details.
            </div>
          </div>
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="flex-1"
          disabled={loading}
          data-testid="payment-back-button"
        >
          Back
        </Button>
        <Button
          type="submit"
          className="flex-1"
          disabled={loading}
          data-testid="payment-submit-button"
        >
          {loading ? 'Processing...' : 'Complete Order'}
        </Button>
      </div>
    </form>
  );
}
