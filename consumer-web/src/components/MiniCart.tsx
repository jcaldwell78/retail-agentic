import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

interface MiniCartProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MiniCart({ isOpen, onClose }: MiniCartProps) {
  const navigate = useNavigate();

  // Mock cart data - in production this would come from context/state
  const [cartItems] = useState<CartItem[]>([
    {
      id: '1',
      productId: '1',
      name: 'Wireless Headphones',
      price: 99.99,
      quantity: 1,
    },
    {
      id: '2',
      productId: '2',
      name: 'Smart Watch',
      price: 249.99,
      quantity: 1,
    },
  ]);

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const handleViewCart = () => {
    navigate('/cart');
    onClose();
  };

  const handleCheckout = () => {
    navigate('/checkout');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
        data-testid="mini-cart-backdrop"
      />

      {/* Mini Cart Sidebar */}
      <div
        className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col"
        data-testid="mini-cart"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">
            Shopping Cart ({cartItems.length})
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close cart"
            data-testid="mini-cart-close"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Cart Items */}
        {cartItems.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <svg
              className="w-16 h-16 text-gray-400 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <p className="text-gray-600 mb-4">Your cart is empty</p>
            <Button onClick={onClose}>Continue Shopping</Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {cartItems.map((item) => (
                <Card key={item.id} className="p-4">
                  <div className="flex gap-3">
                    <Link
                      to={`/products/${item.productId}`}
                      onClick={onClose}
                      className="flex-shrink-0"
                    >
                      <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                        <span className="text-2xl">📦</span>
                      </div>
                    </Link>

                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/products/${item.productId}`}
                        onClick={onClose}
                        className="block"
                      >
                        <h3 className="font-medium text-sm text-gray-900 hover:text-blue-600 line-clamp-2">
                          {item.name}
                        </h3>
                      </Link>

                      <div className="mt-2 flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                          Qty: {item.quantity}
                        </div>
                        <div className="font-semibold text-gray-900">
                          ${item.price.toFixed(2)}
                        </div>
                      </div>

                      <div className="mt-2 text-sm font-bold text-gray-900">
                        ${(item.price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Footer */}
            <div className="border-t p-4 space-y-4">
              {/* Subtotal */}
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Subtotal</span>
                <span className="text-xl font-bold" data-testid="mini-cart-subtotal">
                  ${subtotal.toFixed(2)}
                </span>
              </div>

              <p className="text-xs text-gray-500 text-center">
                Shipping and taxes calculated at checkout
              </p>

              {/* Action Buttons */}
              <div className="space-y-2">
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleCheckout}
                  data-testid="mini-cart-checkout"
                >
                  Checkout
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  size="lg"
                  onClick={handleViewCart}
                  data-testid="mini-cart-view-cart"
                >
                  View Cart
                </Button>
              </div>

              {/* Continue Shopping */}
              <button
                onClick={onClose}
                className="w-full text-sm text-gray-600 hover:text-gray-900 py-2"
              >
                Continue Shopping
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
