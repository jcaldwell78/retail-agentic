import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  inStock: boolean;
}

export default function CartPage() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<CartItem[]>([
    {
      id: '1',
      productId: '1',
      name: 'Wireless Headphones',
      price: 99.99,
      quantity: 1,
      inStock: true,
    },
    {
      id: '2',
      productId: '2',
      name: 'Smart Watch',
      price: 249.99,
      quantity: 2,
      inStock: true,
    },
    {
      id: '3',
      productId: '5',
      name: 'Laptop Stand',
      price: 49.99,
      quantity: 1,
      inStock: false,
    },
  ]);
  const [savedItems, setSavedItems] = useState<CartItem[]>([]);
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);

  const updateQuantity = (id: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    setCartItems(
      cartItems.map((item) =>
        item.id === id ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const removeItem = (id: string) => {
    setCartItems(cartItems.filter((item) => item.id !== id));
  };

  const saveForLater = (id: string) => {
    const item = cartItems.find((item) => item.id === id);
    if (item) {
      setSavedItems([...savedItems, item]);
      setCartItems(cartItems.filter((item) => item.id !== id));
    }
  };

  const moveToCart = (id: string) => {
    const item = savedItems.find((item) => item.id === id);
    if (item) {
      setCartItems([...cartItems, item]);
      setSavedItems(savedItems.filter((item) => item.id !== id));
    }
  };

  const removeSavedItem = (id: string) => {
    setSavedItems(savedItems.filter((item) => item.id !== id));
  };

  const applyPromoCode = () => {
    if (promoCode.trim()) {
      setPromoApplied(true);
      // TODO: Validate and apply promo code
    }
  };

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const shipping = subtotal > 100 ? 0 : 9.99;
  const discount = promoApplied ? subtotal * 0.1 : 0;
  const tax = (subtotal - discount) * 0.08;
  const total = subtotal + shipping - discount + tax;

  const hasOutOfStock = cartItems.some((item) => !item.inStock);

  return (
    <main className="min-h-screen bg-gray-50" data-testid="cart-page">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            to="/products"
            className="text-sm text-gray-600 hover:text-gray-900 inline-flex items-center"
          >
            ← Continue Shopping
          </Link>
          <h1 className="mt-4 text-3xl font-bold text-gray-900">Shopping Cart</h1>
          <p className="mt-2 text-gray-600">
            {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} in your cart
          </p>
        </div>

        {cartItems.length === 0 ? (
          /* Empty Cart State */
          <Card className="p-12">
            <div className="text-center">
              <svg
                className="mx-auto h-16 w-16 text-gray-400"
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
              <h3 className="mt-4 text-lg font-medium text-gray-900">Your cart is empty</h3>
              <p className="mt-2 text-sm text-gray-500">
                Start adding some products to your cart!
              </p>
              <div className="mt-6">
                <Button onClick={() => navigate('/products')}>Browse Products</Button>
              </div>
            </div>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <Card>
                <div className="divide-y" data-testid="cart-items">
                  {cartItems.map((item) => (
                    <div key={item.id} className="p-6">
                      <div className="flex gap-4">
                        {/* Product Image */}
                        <Link
                          to={`/products/${item.productId}`}
                          className="flex-shrink-0"
                        >
                          <div className="w-24 h-24 bg-gray-200 rounded-lg flex items-center justify-center">
                            <span className="text-3xl">📦</span>
                          </div>
                        </Link>

                        {/* Product Info */}
                        <div className="flex-1 min-w-0">
                          <Link
                            to={`/products/${item.productId}`}
                            className="block"
                          >
                            <p className="text-lg font-semibold text-gray-900 hover:text-blue-600">
                              {item.name}
                            </p>
                          </Link>

                          {!item.inStock && (
                            <div className="mt-1 flex items-center text-red-600 text-sm">
                              <svg
                                className="w-4 h-4 mr-1"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              Out of Stock
                            </div>
                          )}

                          <div className="mt-2 text-xl font-bold text-gray-900">
                            ${item.price.toFixed(2)}
                          </div>

                          {/* Quantity Controls */}
                          <div className="mt-4 flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() =>
                                  updateQuantity(item.id, item.quantity - 1)
                                }
                                className="w-8 h-8 border border-gray-300 rounded-md hover:bg-gray-100"
                                data-testid={`decrease-quantity-${item.id}`}
                                disabled={!item.inStock}
                                aria-label={`Decrease quantity for ${item.name}`}
                              >
                                −
                              </button>
                              <span
                                className="w-12 text-center font-medium"
                                data-testid={`quantity-${item.id}`}
                              >
                                {item.quantity}
                              </span>
                              <button
                                onClick={() =>
                                  updateQuantity(item.id, item.quantity + 1)
                                }
                                className="w-8 h-8 border border-gray-300 rounded-md hover:bg-gray-100"
                                data-testid={`increase-quantity-${item.id}`}
                                disabled={!item.inStock}
                                aria-label={`Increase quantity for ${item.name}`}
                              >
                                +
                              </button>
                            </div>

                            <div className="flex gap-3">
                              <button
                                onClick={() => saveForLater(item.id)}
                                className="text-sm text-blue-600 hover:text-blue-800"
                                data-testid={`save-for-later-${item.id}`}
                              >
                                Save for Later
                              </button>
                              <button
                                onClick={() => removeItem(item.id)}
                                className="text-sm text-red-600 hover:text-red-800"
                                data-testid={`remove-item-${item.id}`}
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Item Total */}
                        <div className="text-right">
                          <div className="text-lg font-bold text-gray-900">
                            ${(item.price * item.quantity).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Out of Stock Warning */}
              {hasOutOfStock && (
                <Card className="mt-4 p-4 bg-red-50 border-red-200">
                  <div className="flex items-start">
                    <svg
                      className="w-5 h-5 text-red-600 mr-3 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-red-800">
                        Some items are out of stock
                      </p>
                      <p className="mt-1 text-sm text-red-700">
                        Please remove out-of-stock items to proceed with checkout.
                      </p>
                    </div>
                  </div>
                </Card>
              )}

              {/* Saved for Later Section */}
              {savedItems.length > 0 && (
                <div className="mt-8" data-testid="saved-for-later-section">
                  <h2 className="text-2xl font-bold mb-4">
                    Saved for Later ({savedItems.length})
                  </h2>
                  <Card>
                    <div className="divide-y">
                      {savedItems.map((item) => (
                        <div key={item.id} className="p-6">
                          <div className="flex gap-4">
                            {/* Product Image */}
                            <Link
                              to={`/products/${item.productId}`}
                              className="flex-shrink-0"
                            >
                              <div className="w-24 h-24 bg-gray-200 rounded-lg flex items-center justify-center">
                                <span className="text-3xl">📦</span>
                              </div>
                            </Link>

                            {/* Product Info */}
                            <div className="flex-1 min-w-0">
                              <Link
                                to={`/products/${item.productId}`}
                                className="block"
                              >
                                <p className="text-lg font-semibold text-gray-900 hover:text-blue-600">
                                  {item.name}
                                </p>
                              </Link>

                              {!item.inStock && (
                                <div className="mt-1 flex items-center text-red-600 text-sm">
                                  <svg
                                    className="w-4 h-4 mr-1"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                  Out of Stock
                                </div>
                              )}

                              <div className="mt-2 text-xl font-bold text-gray-900">
                                ${item.price.toFixed(2)}
                              </div>

                              {/* Action Buttons */}
                              <div className="mt-4 flex gap-3">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => moveToCart(item.id)}
                                  disabled={!item.inStock}
                                  data-testid={`move-to-cart-${item.id}`}
                                >
                                  Move to Cart
                                </Button>
                                <button
                                  onClick={() => removeSavedItem(item.id)}
                                  className="text-sm text-red-600 hover:text-red-800"
                                  data-testid={`remove-saved-${item.id}`}
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              )}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="p-6 sticky top-4">
                <h2 className="text-lg font-semibold mb-4">Order Summary</h2>

                {/* Promo Code */}
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2">
                    Promo Code
                  </label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter code"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      disabled={promoApplied}
                      data-testid="promo-code-input"
                    />
                    <Button
                      variant="outline"
                      onClick={applyPromoCode}
                      disabled={promoApplied}
                      data-testid="apply-promo-button"
                    >
                      {promoApplied ? 'Applied' : 'Apply'}
                    </Button>
                  </div>
                  {promoApplied && (
                    <p className="mt-2 text-sm text-green-600">
                      10% discount applied!
                    </p>
                  )}
                </div>

                {/* Price Breakdown */}
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium" data-testid="subtotal">
                      ${subtotal.toFixed(2)}
                    </span>
                  </div>

                  {discount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Discount</span>
                      <span className="font-medium text-green-600" data-testid="discount">
                        -${discount.toFixed(2)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-medium" data-testid="shipping">
                      {shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}
                    </span>
                  </div>

                  {subtotal > 100 && shipping === 0 && (
                    <p className="text-xs text-green-600">
                      You qualify for free shipping!
                    </p>
                  )}

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax (8%)</span>
                    <span className="font-medium" data-testid="tax">
                      ${tax.toFixed(2)}
                    </span>
                  </div>

                  <div className="border-t pt-3 flex justify-between">
                    <span className="text-lg font-semibold">Total</span>
                    <span className="text-lg font-bold" data-testid="total">
                      ${total.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Checkout Button */}
                <Button
                  size="lg"
                  className="w-full"
                  onClick={() => navigate('/checkout')}
                  disabled={hasOutOfStock}
                  data-testid="checkout-button"
                >
                  Proceed to Checkout
                </Button>

                <div className="mt-4 space-y-2 text-xs text-gray-500">
                  <div className="flex items-center">
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
                    Secure checkout
                  </div>
                  <div className="flex items-center">
                    <svg
                      className="w-4 h-4 mr-2 text-green-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                      <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z" />
                    </svg>
                    Free shipping over $100
                  </div>
                  <div className="flex items-center">
                    <svg
                      className="w-4 h-4 mr-2 text-green-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                        clipRule="evenodd"
                      />
                    </svg>
                    30-day return policy
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
