import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export interface GuestCheckoutPromptProps {
  onGuestCheckout?: (email: string) => void;
  onSignIn?: () => void;
  onCreateAccount?: () => void;
}

export default function GuestCheckoutPrompt({
  onGuestCheckout,
  onSignIn,
  onCreateAccount,
}: GuestCheckoutPromptProps) {
  const [guestEmail, setGuestEmail] = useState('');
  const [emailError, setEmailError] = useState('');

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleGuestCheckout = (e: React.FormEvent) => {
    e.preventDefault();

    if (!guestEmail.trim()) {
      setEmailError('Please enter a valid email address');
      return;
    }

    if (!validateEmail(guestEmail)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    setEmailError('');
    onGuestCheckout?.(guestEmail);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Checkout</h1>
          <p className="text-gray-600">Choose how you'd like to proceed</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Guest Checkout */}
          <Card className="p-6">
            <div className="mb-4">
              <h2 className="text-xl font-semibold mb-2">Guest Checkout</h2>
              <p className="text-sm text-gray-600">
                Continue as a guest - no account required
              </p>
            </div>

            <form onSubmit={handleGuestCheckout} data-testid="guest-checkout-form" noValidate>
              <div className="space-y-4">
                <div>
                  <label htmlFor="guest-email" className="block text-sm font-medium mb-2">
                    Email Address <span className="text-red-600">*</span>
                  </label>
                  <Input
                    id="guest-email"
                    type="email"
                    required
                    value={guestEmail}
                    onChange={(e) => {
                      setGuestEmail(e.target.value);
                      setEmailError('');
                    }}
                    placeholder="john@example.com"
                    data-testid="guest-email-input"
                    className={emailError ? 'border-red-500' : ''}
                  />
                  {emailError && (
                    <p className="text-sm text-red-600 mt-1" data-testid="email-error">
                      {emailError}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    We'll send your order confirmation to this email
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  data-testid="continue-as-guest-button"
                >
                  Continue as Guest
                </Button>
              </div>
            </form>

            <div className="mt-4 pt-4 border-t">
              <div className="text-xs text-gray-600">
                <span className="font-semibold">Guest checkout benefits:</span>
                <ul className="mt-2 space-y-1 ml-4 list-disc">
                  <li>Fast checkout process</li>
                  <li>No password required</li>
                  <li>Order confirmation via email</li>
                </ul>
              </div>
            </div>
          </Card>

          {/* Existing Customer */}
          <Card className="p-6">
            <div className="mb-4">
              <h2 className="text-xl font-semibold mb-2">Returning Customer</h2>
              <p className="text-sm text-gray-600">
                Sign in for faster checkout and order tracking
              </p>
            </div>

            <div className="space-y-4">
              <Button
                onClick={onSignIn}
                variant="outline"
                className="w-full"
                data-testid="sign-in-button"
              >
                Sign In to Your Account
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">or</span>
                </div>
              </div>

              <Button
                onClick={onCreateAccount}
                variant="default"
                className="w-full"
                data-testid="create-account-button"
              >
                Create New Account
              </Button>
            </div>

            <div className="mt-4 pt-4 border-t">
              <div className="text-xs text-gray-600">
                <span className="font-semibold">Account benefits:</span>
                <ul className="mt-2 space-y-1 ml-4 list-disc">
                  <li>Save addresses for faster checkout</li>
                  <li>Track orders and view history</li>
                  <li>Manage returns and refunds</li>
                  <li>Save items to wishlist</li>
                  <li>Receive exclusive offers</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            By continuing, you agree to our{' '}
            <a href="/terms" className="text-blue-600 hover:underline">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="/privacy" className="text-blue-600 hover:underline">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
