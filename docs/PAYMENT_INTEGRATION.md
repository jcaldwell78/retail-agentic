# Payment Integration Guide

This document describes the payment integration implementation for the retail platform, supporting PayPal, Apple Pay, and Google Pay through their development/sandbox environments.

## Overview

The payment system provides a unified interface for processing payments through multiple providers:
- **PayPal** - Using PayPal Checkout SDK with sandbox environment
- **Apple Pay** - Using Stripe as the payment processor with Apple Pay JS API
- **Google Pay** - Using Stripe as the payment processor with Google Pay API
- **Credit Cards** - Using Stripe for direct card payments

All integrations are configured to use **test/sandbox environments** by default.

## Architecture

### Backend Components

1. **Payment Domain Models** (`backend/src/main/java/com/retail/domain/payment/`)
   - `PaymentProvider.java` - Enum of supported payment providers
   - `PaymentRequest.java` - Payment initiation request model
   - `PaymentResponse.java` - Payment response with status and details
   - `PaymentProviderService.java` - Interface for payment provider implementations

2. **Payment Service Implementations** (`backend/src/main/java/com/retail/infrastructure/payment/`)
   - `PayPalPaymentService.java` - PayPal integration using Checkout SDK
   - `StripePaymentService.java` - Stripe integration for Apple Pay, Google Pay, and cards
   - `UnifiedPaymentService.java` - Orchestrates multiple payment providers

3. **REST API** (`backend/src/main/java/com/retail/web/controller/`)
   - `PaymentController.java` - RESTful endpoints for payment operations

### Frontend Components

1. **Payment UI Components** (`consumer-web/src/components/payment/`)
   - `PaymentMethodSelector.tsx` - Payment method selection UI
   - `PayPalButton.tsx` - PayPal checkout button integration
   - `ApplePayButton.tsx` - Apple Pay button (Safari/iOS)
   - `GooglePayButton.tsx` - Google Pay button
   - `PaymentProcessor.tsx` - Unified payment processing component

## Configuration

### Backend Configuration

Add to `application.yml`:

```yaml
payment:
  # PayPal Configuration (Sandbox)
  paypal:
    client-id: ${PAYPAL_CLIENT_ID:AYSq3RDGsmBLJE-otTkBtM-jBRd1TCQwFf9RGfwddNXWz0uFU9ztymylOhRS}
    client-secret: ${PAYPAL_CLIENT_SECRET:EGnHDxD_qRPdaLdZz8iCr8N7_MzF-YHPTkjs6NKYQvQSBngp4PTTVWkPZRbL}
    sandbox: true
    return-url: http://localhost:3000/checkout/success
    cancel-url: http://localhost:3000/checkout/cancel

  # Stripe Configuration (Test keys)
  stripe:
    secret-key: ${STRIPE_SECRET_KEY:sk_test_your_key_here}
    publishable-key: ${STRIPE_PUBLISHABLE_KEY:pk_test_your_key_here}
    webhook-secret: ${STRIPE_WEBHOOK_SECRET:whsec_test_secret}

  # Apple Pay Configuration
  apple-pay:
    merchant-id: merchant.com.retail.platform
    merchant-name: Retail Platform
    country-code: US
    supported-networks: visa,mastercard,amex,discover

  # Google Pay Configuration
  google-pay:
    merchant-id: BCR2DN6T2K7G5ELA  # Test merchant ID
    merchant-name: Retail Platform
    environment: TEST
```

### Test Credentials

#### PayPal Sandbox
- **Client ID**: `AYSq3RDGsmBLJE-otTkBtM-jBRd1TCQwFf9RGfwddNXWz0uFU9ztymylOhRS`
- **Secret**: `EGnHDxD_qRPdaLdZz8iCr8N7_MzF-YHPTkjs6NKYQvQSBngp4PTTVWkPZRbL`
- **Test Buyer Account**:
  - Email: `sb-buyer@business.example.com`
  - Password: `12345678`

#### Stripe Test Mode
- **Test Card Numbers**:
  - Success: `4242 4242 4242 4242`
  - Decline: `4000 0000 0000 0002`
  - 3D Secure: `4000 0025 0000 3155`
- **Expiry**: Any future date
- **CVC**: Any 3 digits
- **ZIP**: Any 5 digits

#### Apple Pay Testing
- Requires Safari browser on macOS or iOS device
- Device must be in developer mode
- Use test cards configured in your Apple Pay Sandbox account

#### Google Pay Testing
- Works in any modern browser
- Uses TEST environment automatically
- No real payment methods required

## API Endpoints

### Initiate Payment
```http
POST /api/v1/payments/initiate
Content-Type: application/json

{
  "provider": "PAYPAL",
  "amount": 99.99,
  "currency": "USD",
  "orderId": "ORD-123456",
  "tenantId": "test-tenant",
  "customerEmail": "customer@example.com",
  "description": "Order #123456",
  "returnUrl": "http://localhost:3000/checkout/success",
  "cancelUrl": "http://localhost:3000/checkout/cancel"
}
```

### Capture Payment
```http
POST /api/v1/payments/{transactionId}/capture
```

### Verify Payment Status
```http
GET /api/v1/payments/{transactionId}/verify
```

### Process Refund
```http
POST /api/v1/payments/{transactionId}/refund?amount=50.00&reason=Customer%20Request
```

### Cancel Payment
```http
POST /api/v1/payments/{transactionId}/cancel
```

### Get Available Providers
```http
GET /api/v1/payments/providers
```

## Frontend Integration

### Using the Payment Processor Component

```tsx
import { PaymentProcessor } from '@/components/payment/PaymentProcessor';

function CheckoutPage() {
  const handlePaymentSuccess = (paymentData) => {
    console.log('Payment successful:', paymentData);
    // Handle successful payment
  };

  const handlePaymentError = (error) => {
    console.error('Payment failed:', error);
    // Handle payment error
  };

  return (
    <PaymentProcessor
      amount={99.99}
      currency="USD"
      orderId="ORD-123456"
      onSuccess={handlePaymentSuccess}
      onError={handlePaymentError}
      availableMethods={['paypal', 'apple_pay', 'google_pay', 'credit_card']}
    />
  );
}
```

### Individual Payment Method Components

```tsx
// PayPal Button
<PayPalButton
  amount={99.99}
  currency="USD"
  orderId="ORD-123456"
  onSuccess={handleSuccess}
  onError={handleError}
/>

// Apple Pay Button (only renders on supported devices)
<ApplePayButton
  amount={99.99}
  currency="USD"
  orderId="ORD-123456"
  onSuccess={handleSuccess}
  onError={handleError}
/>

// Google Pay Button
<GooglePayButton
  amount={99.99}
  currency="USD"
  orderId="ORD-123456"
  onSuccess={handleSuccess}
  onError={handleError}
/>
```

## Payment Flow

### PayPal Flow
1. User selects PayPal as payment method
2. Backend creates PayPal order and returns approval URL
3. User is redirected to PayPal to approve payment
4. User returns to merchant site
5. Backend captures the payment
6. Order is marked as paid

### Apple Pay Flow
1. User clicks Apple Pay button (Safari/iOS only)
2. Apple Pay sheet appears with payment details
3. User authenticates with Touch ID/Face ID
4. Payment token is sent to Stripe via backend
5. Backend processes payment with Stripe
6. Order is marked as paid

### Google Pay Flow
1. User clicks Google Pay button
2. Google Pay sheet appears with saved cards
3. User selects card and confirms
4. Payment token is sent to Stripe via backend
5. Backend processes payment with Stripe
6. Order is marked as paid

## Security Considerations

1. **PCI Compliance**: Credit card details never touch our servers (handled by Stripe)
2. **Webhook Validation**: All webhooks are validated using provider-specific signatures
3. **HTTPS Only**: Payment endpoints require HTTPS in production
4. **Tenant Isolation**: Payments are isolated per tenant
5. **Idempotency**: Payment operations support idempotency keys to prevent duplicate charges

## Testing

### Backend Testing
```bash
# Run tests
cd backend
mvn test

# Test payment initiation
curl -X POST http://localhost:8080/api/v1/payments/initiate \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "PAYPAL",
    "amount": 10.00,
    "currency": "USD",
    "orderId": "TEST-001",
    "tenantId": "test-tenant"
  }'
```

### Frontend Testing
```bash
# Run frontend with payment components
cd consumer-web
npm run dev

# Navigate to checkout page
# Select payment method and test with sandbox credentials
```

## Webhook Configuration

### PayPal Webhooks
Configure webhook URL in PayPal dashboard:
```
https://your-domain.com/api/v1/payments/webhooks/paypal
```

### Stripe Webhooks
Configure webhook URL in Stripe dashboard:
```
https://your-domain.com/api/v1/payments/webhooks/stripe
```

Events to subscribe:
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `charge.refunded`

## Production Deployment

Before deploying to production:

1. **Replace Test Credentials**
   - Update PayPal client ID and secret with live credentials
   - Update Stripe keys with live keys
   - Update merchant IDs for Apple Pay and Google Pay

2. **Update Configuration**
   - Set `payment.paypal.sandbox: false`
   - Update return/cancel URLs to production domain
   - Set `payment.google-pay.environment: PRODUCTION`

3. **SSL/TLS Requirements**
   - Ensure HTTPS is enabled
   - Valid SSL certificate required for Apple Pay
   - Domain verification for Apple Pay and Google Pay

4. **Compliance**
   - Ensure PCI DSS compliance
   - Review and accept provider terms of service
   - Implement proper error logging and monitoring

## Troubleshooting

### Common Issues

1. **PayPal Sandbox Login Issues**
   - Clear browser cookies
   - Use incognito/private browsing mode
   - Ensure sandbox account is active

2. **Apple Pay Not Showing**
   - Only works on Safari browser
   - Device must support Apple Pay
   - Domain must be verified with Apple

3. **Google Pay Not Loading**
   - Check browser console for errors
   - Ensure test merchant ID is correct
   - Verify Stripe publishable key

4. **Stripe Payment Failures**
   - Check Stripe dashboard for detailed error logs
   - Verify API keys are correct
   - Ensure amount is in cents (multiply by 100)

## Support

For payment provider specific issues:
- PayPal Developer Support: https://developer.paypal.com/support/
- Stripe Support: https://support.stripe.com/
- Apple Pay: https://developer.apple.com/apple-pay/
- Google Pay: https://developers.google.com/pay/api/web/support

## License

This implementation uses the following SDKs:
- PayPal Checkout SDK (Apache 2.0)
- Stripe Java SDK (MIT)
- Payment provider JavaScript SDKs (various licenses)

Ensure compliance with all payment provider terms of service and applicable regulations.