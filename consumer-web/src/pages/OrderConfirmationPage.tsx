import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle, Package, MapPin, CreditCard, Mail } from 'lucide-react';

export default function OrderConfirmationPage() {
  const navigate = useNavigate();

  // Mock order data - in real app this would come from route params or API
  const order = {
    orderNumber: 'ORD-2024-00123',
    date: new Date().toLocaleDateString(),
    estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString(),
    email: 'customer@example.com',
    shippingAddress: {
      name: 'John Doe',
      street: '123 Main St',
      city: 'San Francisco',
      state: 'CA',
      zip: '94105',
      country: 'United States',
    },
    paymentMethod: {
      type: 'Credit Card',
      last4: '4242',
    },
    items: [
      {
        id: '1',
        name: 'Wireless Headphones',
        quantity: 1,
        price: 99.99,
      },
      {
        id: '2',
        name: 'Smart Watch',
        quantity: 1,
        price: 249.99,
      },
    ],
    subtotal: 349.98,
    shipping: 9.99,
    tax: 28.00,
    total: 387.97,
  };

  return (
    <div className="min-h-screen bg-gray-50" data-testid="order-confirmation-page">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
          <p className="text-lg text-gray-600">
            Thank you for your purchase. Your order has been received.
          </p>
        </div>

        {/* Order Details Card */}
        <Card className="p-6 mb-6">
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <h2 className="text-sm font-medium text-gray-500 mb-1">Order Number</h2>
              <p className="text-lg font-semibold" data-testid="order-number">
                {order.orderNumber}
              </p>
            </div>
            <div>
              <h2 className="text-sm font-medium text-gray-500 mb-1">Order Date</h2>
              <p className="text-lg font-semibold">{order.date}</p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <Mail className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">
                  Confirmation Email Sent
                </h3>
                <p className="text-sm text-blue-800">
                  We've sent a confirmation email to <strong>{order.email}</strong> with your order details.
                </p>
              </div>
            </div>
          </div>

          {/* Estimated Delivery */}
          <div className="flex items-center p-4 bg-gray-50 rounded-lg mb-6">
            <Package className="w-6 h-6 text-gray-600 mr-3" />
            <div>
              <h3 className="font-semibold text-gray-900">Estimated Delivery</h3>
              <p className="text-gray-600">{order.estimatedDelivery}</p>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="mb-6">
            <div className="flex items-center mb-3">
              <MapPin className="w-5 h-5 text-gray-600 mr-2" />
              <h3 className="font-semibold text-gray-900">Shipping Address</h3>
            </div>
            <div className="pl-7 text-gray-700">
              <p>{order.shippingAddress.name}</p>
              <p>{order.shippingAddress.street}</p>
              <p>
                {order.shippingAddress.city}, {order.shippingAddress.state}{' '}
                {order.shippingAddress.zip}
              </p>
              <p>{order.shippingAddress.country}</p>
            </div>
          </div>

          {/* Payment Method */}
          <div className="mb-6">
            <div className="flex items-center mb-3">
              <CreditCard className="w-5 h-5 text-gray-600 mr-2" />
              <h3 className="font-semibold text-gray-900">Payment Method</h3>
            </div>
            <div className="pl-7 text-gray-700">
              <p>
                {order.paymentMethod.type} ending in {order.paymentMethod.last4}
              </p>
            </div>
          </div>

          {/* Order Items */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Order Items</h3>
            <div className="space-y-4" data-testid="order-items">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-center pb-4 border-b last:border-b-0"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                      <span className="text-2xl">📦</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{item.name}</h4>
                      <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      ${item.price.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="mt-6 pt-6 border-t">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium" data-testid="subtotal">
                  ${order.subtotal.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Shipping</span>
                <span className="font-medium" data-testid="shipping">
                  ${order.shipping.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tax</span>
                <span className="font-medium" data-testid="tax">
                  ${order.tax.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span className="text-lg font-semibold">Total</span>
                <span className="text-lg font-bold" data-testid="total">
                  ${order.total.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => navigate('/account/orders')}
            data-testid="view-orders-button"
          >
            View All Orders
          </Button>
          <Button
            className="flex-1"
            onClick={() => navigate('/products')}
            data-testid="continue-shopping-button"
          >
            Continue Shopping
          </Button>
        </div>

        {/* Help Section */}
        <Card className="mt-6 p-6">
          <h3 className="font-semibold text-gray-900 mb-3">Need Help?</h3>
          <p className="text-gray-700 mb-4">
            If you have any questions about your order, please contact our customer support team.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link to="/support" className="text-blue-600 hover:text-blue-800 font-medium">
              Contact Support
            </Link>
            <Link to="/faq" className="text-blue-600 hover:text-blue-800 font-medium">
              View FAQ
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
