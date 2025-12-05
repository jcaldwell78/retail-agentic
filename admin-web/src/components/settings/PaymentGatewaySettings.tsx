import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

export interface PayPalConfig {
  enabled: boolean;
  mode: 'sandbox' | 'live';
  clientId: string;
  clientSecret: string;
  webhookId?: string;
}

export interface StripeConfig {
  enabled: boolean;
  mode: 'test' | 'live';
  publishableKey: string;
  secretKey: string;
  webhookSecret?: string;
}

export interface PaymentGatewayConfig {
  paypal?: PayPalConfig;
  stripe?: StripeConfig;
}

export interface PaymentGatewaySettingsProps {
  config?: PaymentGatewayConfig;
  onSave?: (config: PaymentGatewayConfig) => void;
  onTestConnection?: (gateway: 'paypal' | 'stripe') => Promise<{ success: boolean; message: string }>;
}

export default function PaymentGatewaySettings({
  config,
  onSave,
  onTestConnection,
}: PaymentGatewaySettingsProps) {
  const [paypalConfig, setPaypalConfig] = useState<PayPalConfig>(
    config?.paypal || {
      enabled: false,
      mode: 'sandbox',
      clientId: '',
      clientSecret: '',
      webhookId: '',
    }
  );

  const [stripeConfig, setStripeConfig] = useState<StripeConfig>(
    config?.stripe || {
      enabled: false,
      mode: 'test',
      publishableKey: '',
      secretKey: '',
      webhookSecret: '',
    }
  );

  const [testingPayPal, setTestingPayPal] = useState(false);
  const [testingStripe, setTestingStripe] = useState(false);
  const [paypalTestResult, setPaypalTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [stripeTestResult, setStripeTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showPayPalSecret, setShowPayPalSecret] = useState(false);
  const [showStripeSecret, setShowStripeSecret] = useState(false);

  const handleSavePayPal = () => {
    const newConfig: PaymentGatewayConfig = {
      paypal: paypalConfig,
      stripe: stripeConfig,
    };
    onSave?.(newConfig);
  };

  const handleSaveStripe = () => {
    const newConfig: PaymentGatewayConfig = {
      paypal: paypalConfig,
      stripe: stripeConfig,
    };
    onSave?.(newConfig);
  };

  const handleTestPayPal = async () => {
    if (!onTestConnection) return;

    setTestingPayPal(true);
    setPaypalTestResult(null);

    try {
      const result = await onTestConnection('paypal');
      setPaypalTestResult(result);
    } catch (error) {
      setPaypalTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'Connection test failed',
      });
    } finally {
      setTestingPayPal(false);
    }
  };

  const handleTestStripe = async () => {
    if (!onTestConnection) return;

    setTestingStripe(true);
    setStripeTestResult(null);

    try {
      const result = await onTestConnection('stripe');
      setStripeTestResult(result);
    } catch (error) {
      setStripeTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'Connection test failed',
      });
    } finally {
      setTestingStripe(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Payment Gateway Configuration</CardTitle>
          <CardDescription>
            Configure payment processors to accept payments from customers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="paypal" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="paypal" data-testid="paypal-tab">
                PayPal
                {paypalConfig.enabled && (
                  <Badge variant="default" className="ml-2">
                    Active
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="stripe" data-testid="stripe-tab">
                Stripe
                {stripeConfig.enabled && (
                  <Badge variant="default" className="ml-2">
                    Active
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* PayPal Configuration */}
            <TabsContent value="paypal" className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <Checkbox
                  id="paypal-enabled"
                  checked={paypalConfig.enabled}
                  onCheckedChange={(checked) =>
                    setPaypalConfig({ ...paypalConfig, enabled: checked as boolean })
                  }
                  data-testid="paypal-enabled"
                />
                <Label htmlFor="paypal-enabled" className="font-semibold">
                  Enable PayPal Payments
                </Label>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="paypal-mode">Environment</Label>
                  <select
                    id="paypal-mode"
                    value={paypalConfig.mode}
                    onChange={(e) =>
                      setPaypalConfig({
                        ...paypalConfig,
                        mode: e.target.value as 'sandbox' | 'live',
                      })
                    }
                    className="w-full mt-1 px-3 py-2 border rounded-md"
                    data-testid="paypal-mode"
                  >
                    <option value="sandbox">Sandbox (Testing)</option>
                    <option value="live">Live (Production)</option>
                  </select>
                  <p className="text-sm text-muted-foreground mt-1">
                    Use sandbox mode for testing, live mode for production
                  </p>
                </div>

                <div>
                  <Label htmlFor="paypal-client-id">Client ID</Label>
                  <Input
                    id="paypal-client-id"
                    value={paypalConfig.clientId}
                    onChange={(e) =>
                      setPaypalConfig({ ...paypalConfig, clientId: e.target.value })
                    }
                    placeholder="Enter PayPal Client ID"
                    data-testid="paypal-client-id"
                  />
                </div>

                <div>
                  <Label htmlFor="paypal-client-secret">Client Secret</Label>
                  <div className="relative">
                    <Input
                      id="paypal-client-secret"
                      type={showPayPalSecret ? 'text' : 'password'}
                      value={paypalConfig.clientSecret}
                      onChange={(e) =>
                        setPaypalConfig({ ...paypalConfig, clientSecret: e.target.value })
                      }
                      placeholder="Enter PayPal Client Secret"
                      data-testid="paypal-client-secret"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full"
                      onClick={() => setShowPayPalSecret(!showPayPalSecret)}
                      data-testid="toggle-paypal-secret"
                    >
                      {showPayPalSecret ? 'Hide' : 'Show'}
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="paypal-webhook-id">Webhook ID (Optional)</Label>
                  <Input
                    id="paypal-webhook-id"
                    value={paypalConfig.webhookId || ''}
                    onChange={(e) =>
                      setPaypalConfig({ ...paypalConfig, webhookId: e.target.value })
                    }
                    placeholder="Enter PayPal Webhook ID"
                    data-testid="paypal-webhook-id"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    For webhook signature verification
                  </p>
                </div>

                {paypalTestResult && (
                  <div
                    className={`p-3 rounded-md ${
                      paypalTestResult.success
                        ? 'bg-green-50 text-green-800 border border-green-200'
                        : 'bg-red-50 text-red-800 border border-red-200'
                    }`}
                    data-testid="paypal-test-result"
                  >
                    {paypalTestResult.message}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={handleTestPayPal}
                    variant="outline"
                    disabled={
                      testingPayPal || !paypalConfig.clientId || !paypalConfig.clientSecret
                    }
                    data-testid="test-paypal-button"
                  >
                    {testingPayPal ? 'Testing...' : 'Test Connection'}
                  </Button>
                  <Button
                    onClick={handleSavePayPal}
                    disabled={!paypalConfig.clientId || !paypalConfig.clientSecret}
                    data-testid="save-paypal-button"
                  >
                    Save PayPal Settings
                  </Button>
                </div>
              </div>

              <div className="border-t pt-4 mt-4">
                <h4 className="font-semibold mb-2">Setup Instructions</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                  <li>Create a PayPal Business account at paypal.com</li>
                  <li>Go to Developer Dashboard and create a REST API app</li>
                  <li>Copy your Client ID and Client Secret from the app credentials</li>
                  <li>Configure webhook endpoints for payment notifications</li>
                  <li>Test in sandbox mode before going live</li>
                </ol>
              </div>
            </TabsContent>

            {/* Stripe Configuration */}
            <TabsContent value="stripe" className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <Checkbox
                  id="stripe-enabled"
                  checked={stripeConfig.enabled}
                  onCheckedChange={(checked) =>
                    setStripeConfig({ ...stripeConfig, enabled: checked as boolean })
                  }
                  data-testid="stripe-enabled"
                />
                <Label htmlFor="stripe-enabled" className="font-semibold">
                  Enable Stripe Payments
                </Label>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="stripe-mode">Environment</Label>
                  <select
                    id="stripe-mode"
                    value={stripeConfig.mode}
                    onChange={(e) =>
                      setStripeConfig({
                        ...stripeConfig,
                        mode: e.target.value as 'test' | 'live',
                      })
                    }
                    className="w-full mt-1 px-3 py-2 border rounded-md"
                    data-testid="stripe-mode"
                  >
                    <option value="test">Test Mode</option>
                    <option value="live">Live Mode</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="stripe-publishable-key">Publishable Key</Label>
                  <Input
                    id="stripe-publishable-key"
                    value={stripeConfig.publishableKey}
                    onChange={(e) =>
                      setStripeConfig({ ...stripeConfig, publishableKey: e.target.value })
                    }
                    placeholder="pk_test_..."
                    data-testid="stripe-publishable-key"
                  />
                </div>

                <div>
                  <Label htmlFor="stripe-secret-key">Secret Key</Label>
                  <div className="relative">
                    <Input
                      id="stripe-secret-key"
                      type={showStripeSecret ? 'text' : 'password'}
                      value={stripeConfig.secretKey}
                      onChange={(e) =>
                        setStripeConfig({ ...stripeConfig, secretKey: e.target.value })
                      }
                      placeholder="sk_test_..."
                      data-testid="stripe-secret-key"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full"
                      onClick={() => setShowStripeSecret(!showStripeSecret)}
                      data-testid="toggle-stripe-secret"
                    >
                      {showStripeSecret ? 'Hide' : 'Show'}
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="stripe-webhook-secret">Webhook Secret (Optional)</Label>
                  <Input
                    id="stripe-webhook-secret"
                    type="password"
                    value={stripeConfig.webhookSecret || ''}
                    onChange={(e) =>
                      setStripeConfig({ ...stripeConfig, webhookSecret: e.target.value })
                    }
                    placeholder="whsec_..."
                    data-testid="stripe-webhook-secret"
                  />
                </div>

                {stripeTestResult && (
                  <div
                    className={`p-3 rounded-md ${
                      stripeTestResult.success
                        ? 'bg-green-50 text-green-800 border border-green-200'
                        : 'bg-red-50 text-red-800 border border-red-200'
                    }`}
                    data-testid="stripe-test-result"
                  >
                    {stripeTestResult.message}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={handleTestStripe}
                    variant="outline"
                    disabled={
                      testingStripe ||
                      !stripeConfig.publishableKey ||
                      !stripeConfig.secretKey
                    }
                    data-testid="test-stripe-button"
                  >
                    {testingStripe ? 'Testing...' : 'Test Connection'}
                  </Button>
                  <Button
                    onClick={handleSaveStripe}
                    disabled={!stripeConfig.publishableKey || !stripeConfig.secretKey}
                    data-testid="save-stripe-button"
                  >
                    Save Stripe Settings
                  </Button>
                </div>
              </div>

              <div className="border-t pt-4 mt-4">
                <h4 className="font-semibold mb-2">Setup Instructions</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                  <li>Create a Stripe account at stripe.com</li>
                  <li>Get your API keys from the Developers section</li>
                  <li>Use test keys (pk_test_ and sk_test_) for testing</li>
                  <li>Configure webhooks for payment events</li>
                  <li>Switch to live keys when ready for production</li>
                </ol>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Security Best Practices</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Never share your API keys or commit them to version control</li>
            <li>• Use environment variables to store sensitive credentials</li>
            <li>• Rotate keys regularly and immediately if compromised</li>
            <li>• Always test in sandbox/test mode before going live</li>
            <li>• Enable webhook signature verification for security</li>
            <li>• Monitor payment gateway dashboards for unusual activity</li>
            <li>• Use HTTPS for all payment-related communications</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
