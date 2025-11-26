import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

type CheckoutStep = 'shipping' | 'payment' | 'review';

interface ShippingAddress {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('shipping');
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States',
  });

  // Mock cart data
  const cartItems = [
    {
      id: '1',
      name: 'Wireless Headphones',
      price: 99.99,
      quantity: 1,
    },
    {
      id: '2',
      name: 'Smart Watch',
      price: 249.99,
      quantity: 1,
    },
  ];

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = 9.99;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  const handleShippingContinue = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentStep('payment');
  };

  const steps = [
    { id: 'shipping', name: 'Shipping', completed: false },
    { id: 'payment', name: 'Payment', completed: false },
    { id: 'review', name: 'Review', completed: false },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);

  return (
    <div className="min-h-screen bg-gray-50" data-testid="checkout-page">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Checkout</h1>
          <p className="text-gray-600">Complete your purchase</p>
        </div>

        {/* Progress Indicator */}
        <Card className="p-6 mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                      index <= currentStepIndex
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                    data-testid={`step-${step.id}`}
                  >
                    {index < currentStepIndex ? (
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      index + 1
                    )}
                  </div>
                  <span
                    className={`ml-3 font-medium ${
                      index <= currentStepIndex ? 'text-gray-900' : 'text-gray-500'
                    }`}
                  >
                    {step.name}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-4 ${
                      index < currentStepIndex ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </Card>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Shipping Address Form */}
            {currentStep === 'shipping' && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-6">Shipping Address</h2>

                <form onSubmit={handleShippingContinue} data-testid="shipping-form">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Full Name <span className="text-red-600">*</span>
                      </label>
                      <Input
                        required
                        value={shippingAddress.fullName}
                        onChange={(e) =>
                          setShippingAddress({ ...shippingAddress, fullName: e.target.value })
                        }
                        placeholder="John Doe"
                        data-testid="fullName"
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Email <span className="text-red-600">*</span>
                        </label>
                        <Input
                          type="email"
                          required
                          value={shippingAddress.email}
                          onChange={(e) =>
                            setShippingAddress({ ...shippingAddress, email: e.target.value })
                          }
                          placeholder="john@example.com"
                          data-testid="email"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Phone <span className="text-red-600">*</span>
                        </label>
                        <Input
                          type="tel"
                          required
                          value={shippingAddress.phone}
                          onChange={(e) =>
                            setShippingAddress({ ...shippingAddress, phone: e.target.value })
                          }
                          placeholder="(555) 123-4567"
                          data-testid="phone"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Address <span className="text-red-600">*</span>
                      </label>
                      <Input
                        required
                        value={shippingAddress.address}
                        onChange={(e) =>
                          setShippingAddress({ ...shippingAddress, address: e.target.value })
                        }
                        placeholder="123 Main St, Apt 4B"
                        data-testid="address"
                      />
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          City <span className="text-red-600">*</span>
                        </label>
                        <Input
                          required
                          value={shippingAddress.city}
                          onChange={(e) =>
                            setShippingAddress({ ...shippingAddress, city: e.target.value })
                          }
                          placeholder="San Francisco"
                          data-testid="city"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          State <span className="text-red-600">*</span>
                        </label>
                        <Input
                          required
                          value={shippingAddress.state}
                          onChange={(e) =>
                            setShippingAddress({ ...shippingAddress, state: e.target.value })
                          }
                          placeholder="CA"
                          data-testid="state"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          ZIP Code <span className="text-red-600">*</span>
                        </label>
                        <Input
                          required
                          value={shippingAddress.zipCode}
                          onChange={(e) =>
                            setShippingAddress({ ...shippingAddress, zipCode: e.target.value })
                          }
                          placeholder="94102"
                          data-testid="zipCode"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Country <span className="text-red-600">*</span>
                      </label>
                      <select
                        required
                        value={shippingAddress.country}
                        onChange={(e) =>
                          setShippingAddress({ ...shippingAddress, country: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        data-testid="country"
                      >
                        <option value="United States">United States</option>
                        <option value="Canada">Canada</option>
                        <option value="United Kingdom">United Kingdom</option>
                        <option value="Australia">Australia</option>
                      </select>
                    </div>

                    <div className="pt-4 flex gap-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => navigate('/cart')}
                        data-testid="back-to-cart"
                      >
                        Back to Cart
                      </Button>
                      <Button
                        type="submit"
                        className="flex-1"
                        data-testid="continue-to-payment"
                      >
                        Continue to Payment
                      </Button>
                    </div>
                  </div>
                </form>
              </Card>
            )}

            {/* Payment Step (Placeholder) */}
            {currentStep === 'payment' && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-6">Payment Information</h2>
                <p className="text-gray-600 mb-6">
                  PayPal integration will be implemented here.
                </p>
                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep('shipping')}
                  >
                    Back
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => setCurrentStep('review')}
                  >
                    Continue to Review
                  </Button>
                </div>
              </Card>
            )}

            {/* Review Step (Placeholder) */}
            {currentStep === 'review' && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-6">Review Order</h2>
                <p className="text-gray-600 mb-6">
                  Order review and confirmation will be implemented here.
                </p>
                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep('payment')}
                  >
                    Back
                  </Button>
                  <Button className="flex-1">Place Order</Button>
                </div>
              </Card>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-4">
              <h2 className="text-lg font-semibold mb-4">Order Summary</h2>

              {/* Cart Items */}
              <div className="space-y-4 mb-6">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-2xl">📦</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 line-clamp-2">
                        {item.name}
                      </h3>
                      <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                      <p className="text-sm font-semibold text-gray-900">
                        ${item.price.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Price Breakdown */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium">${shipping.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax</span>
                  <span className="font-medium">${tax.toFixed(2)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between">
                  <span className="font-semibold">Total</span>
                  <span className="font-bold text-lg">${total.toFixed(2)}</span>
                </div>
              </div>

              {/* Security Badge */}
              <div className="mt-6 pt-6 border-t">
                <div className="flex items-center text-xs text-gray-500">
                  <svg
                    className="w-4 h-4 mr-2 text-green-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Secure SSL encrypted checkout
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
