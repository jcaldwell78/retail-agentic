import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Settings, Store, Palette, Mail, Truck, DollarSign, Shield } from 'lucide-react';

export interface StoreSettings {
  general: {
    storeName: string;
    storeEmail: string;
    supportEmail: string;
    phone: string;
    timezone: string;
    currency: string;
  };
  branding: {
    primaryColor: string;
    secondaryColor: string;
    logo?: string;
    favicon?: string;
  };
  shipping: {
    freeShippingThreshold: number;
    standardShippingCost: number;
    expressShippingCost: number;
    maxProcessingDays: number;
  };
  tax: {
    taxEnabled: boolean;
    taxRate: number;
    taxIncludedInPrices: boolean;
  };
  notifications: {
    orderConfirmationEnabled: boolean;
    shippingNotificationEnabled: boolean;
    lowStockAlertThreshold: number;
  };
}

export default function StoreSettingsPage() {
  const [settings, setSettings] = useState<StoreSettings>({
    general: {
      storeName: 'My Retail Store',
      storeEmail: 'store@example.com',
      supportEmail: 'support@example.com',
      phone: '+1 (555) 123-4567',
      timezone: 'America/New_York',
      currency: 'USD',
    },
    branding: {
      primaryColor: '#3B82F6',
      secondaryColor: '#10B981',
    },
    shipping: {
      freeShippingThreshold: 50,
      standardShippingCost: 5.99,
      expressShippingCost: 12.99,
      maxProcessingDays: 2,
    },
    tax: {
      taxEnabled: true,
      taxRate: 8.5,
      taxIncludedInPrices: false,
    },
    notifications: {
      orderConfirmationEnabled: true,
      shippingNotificationEnabled: true,
      lowStockAlertThreshold: 10,
    },
  });

  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'branding' | 'shipping' | 'tax' | 'notifications'>('general');

  const handleSave = () => {
    // In production, save to backend
    console.log('Saving settings:', settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const updateGeneralSettings = (field: string, value: string) => {
    setSettings({
      ...settings,
      general: { ...settings.general, [field]: value },
    });
  };

  const updateBrandingSettings = (field: string, value: string) => {
    setSettings({
      ...settings,
      branding: { ...settings.branding, [field]: value },
    });
  };

  const updateShippingSettings = (field: string, value: number) => {
    setSettings({
      ...settings,
      shipping: { ...settings.shipping, [field]: value },
    });
  };

  const updateTaxSettings = (field: string, value: boolean | number) => {
    setSettings({
      ...settings,
      tax: { ...settings.tax, [field]: value },
    });
  };

  const updateNotificationSettings = (field: string, value: boolean | number) => {
    setSettings({
      ...settings,
      notifications: { ...settings.notifications, [field]: value },
    });
  };

  return (
    <div className="min-h-screen bg-gray-50" data-testid="store-settings-page">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Settings className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold">Store Settings</h1>
            <p className="text-gray-600">Manage your store configuration</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {[
            { id: 'general', label: 'General', icon: Store },
            { id: 'branding', label: 'Branding', icon: Palette },
            { id: 'shipping', label: 'Shipping', icon: Truck },
            { id: 'tax', label: 'Tax', icon: DollarSign },
            { id: 'notifications', label: 'Notifications', icon: Mail },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === id
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
              data-testid={`tab-${id}`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* General Settings */}
        {activeTab === 'general' && (
          <Card className="p-6" data-testid="general-settings">
            <h2 className="text-xl font-semibold mb-6">General Settings</h2>
            <div className="space-y-4 max-w-2xl">
              <div>
                <label className="block text-sm font-medium mb-2">Store Name *</label>
                <Input
                  value={settings.general.storeName}
                  onChange={(e) => updateGeneralSettings('storeName', e.target.value)}
                  data-testid="store-name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Store Email *</label>
                <Input
                  type="email"
                  value={settings.general.storeEmail}
                  onChange={(e) => updateGeneralSettings('storeEmail', e.target.value)}
                  data-testid="store-email"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Support Email *</label>
                <Input
                  type="email"
                  value={settings.general.supportEmail}
                  onChange={(e) => updateGeneralSettings('supportEmail', e.target.value)}
                  data-testid="support-email"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Phone</label>
                <Input
                  value={settings.general.phone}
                  onChange={(e) => updateGeneralSettings('phone', e.target.value)}
                  data-testid="phone"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Timezone</label>
                <select
                  value={settings.general.timezone}
                  onChange={(e) => updateGeneralSettings('timezone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  data-testid="timezone"
                >
                  <option value="America/New_York">Eastern Time (ET)</option>
                  <option value="America/Chicago">Central Time (CT)</option>
                  <option value="America/Denver">Mountain Time (MT)</option>
                  <option value="America/Los_Angeles">Pacific Time (PT)</option>
                  <option value="UTC">UTC</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Currency</label>
                <select
                  value={settings.general.currency}
                  onChange={(e) => updateGeneralSettings('currency', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  data-testid="currency"
                >
                  <option value="USD">USD - US Dollar ($)</option>
                  <option value="EUR">EUR - Euro (€)</option>
                  <option value="GBP">GBP - British Pound (£)</option>
                  <option value="CAD">CAD - Canadian Dollar (CA$)</option>
                </select>
              </div>
            </div>
          </Card>
        )}

        {/* Branding Settings */}
        {activeTab === 'branding' && (
          <Card className="p-6" data-testid="branding-settings">
            <h2 className="text-xl font-semibold mb-6">Branding</h2>
            <div className="space-y-4 max-w-2xl">
              <div>
                <label className="block text-sm font-medium mb-2">Primary Color</label>
                <div className="flex gap-3">
                  <input
                    type="color"
                    value={settings.branding.primaryColor}
                    onChange={(e) => updateBrandingSettings('primaryColor', e.target.value)}
                    className="h-10 w-20 rounded border"
                    data-testid="primary-color"
                  />
                  <Input
                    value={settings.branding.primaryColor}
                    onChange={(e) => updateBrandingSettings('primaryColor', e.target.value)}
                    placeholder="#3B82F6"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Secondary Color</label>
                <div className="flex gap-3">
                  <input
                    type="color"
                    value={settings.branding.secondaryColor}
                    onChange={(e) => updateBrandingSettings('secondaryColor', e.target.value)}
                    className="h-10 w-20 rounded border"
                    data-testid="secondary-color"
                  />
                  <Input
                    value={settings.branding.secondaryColor}
                    onChange={(e) => updateBrandingSettings('secondaryColor', e.target.value)}
                    placeholder="#10B981"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Logo URL</label>
                <Input
                  value={settings.branding.logo || ''}
                  onChange={(e) => updateBrandingSettings('logo', e.target.value)}
                  placeholder="https://example.com/logo.png"
                  data-testid="logo-url"
                />
                <p className="text-sm text-gray-500 mt-1">Recommended size: 200x50px</p>
              </div>
            </div>
          </Card>
        )}

        {/* Shipping Settings */}
        {activeTab === 'shipping' && (
          <Card className="p-6" data-testid="shipping-settings">
            <h2 className="text-xl font-semibold mb-6">Shipping Settings</h2>
            <div className="space-y-4 max-w-2xl">
              <div>
                <label className="block text-sm font-medium mb-2">Free Shipping Threshold ($)</label>
                <Input
                  type="number"
                  value={settings.shipping.freeShippingThreshold}
                  onChange={(e) => updateShippingSettings('freeShippingThreshold', parseFloat(e.target.value))}
                  data-testid="free-shipping-threshold"
                />
                <p className="text-sm text-gray-500 mt-1">Orders above this amount get free shipping</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Standard Shipping Cost ($)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={settings.shipping.standardShippingCost}
                  onChange={(e) => updateShippingSettings('standardShippingCost', parseFloat(e.target.value))}
                  data-testid="standard-shipping"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Express Shipping Cost ($)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={settings.shipping.expressShippingCost}
                  onChange={(e) => updateShippingSettings('expressShippingCost', parseFloat(e.target.value))}
                  data-testid="express-shipping"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Max Processing Days</label>
                <Input
                  type="number"
                  value={settings.shipping.maxProcessingDays}
                  onChange={(e) => updateShippingSettings('maxProcessingDays', parseInt(e.target.value))}
                  data-testid="processing-days"
                />
                <p className="text-sm text-gray-500 mt-1">Maximum days to process an order before shipping</p>
              </div>
            </div>
          </Card>
        )}

        {/* Tax Settings */}
        {activeTab === 'tax' && (
          <Card className="p-6" data-testid="tax-settings">
            <h2 className="text-xl font-semibold mb-6">Tax Settings</h2>
            <div className="space-y-4 max-w-2xl">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.tax.taxEnabled}
                  onChange={(e) => updateTaxSettings('taxEnabled', e.target.checked)}
                  className="rounded"
                  data-testid="tax-enabled"
                />
                <span>Enable tax calculation</span>
              </label>
              {settings.tax.taxEnabled && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">Tax Rate (%)</label>
                    <Input
                      type="number"
                      step="0.1"
                      value={settings.tax.taxRate}
                      onChange={(e) => updateTaxSettings('taxRate', parseFloat(e.target.value))}
                      data-testid="tax-rate"
                    />
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.tax.taxIncludedInPrices}
                      onChange={(e) => updateTaxSettings('taxIncludedInPrices', e.target.checked)}
                      className="rounded"
                      data-testid="tax-included"
                    />
                    <span>Tax is included in product prices</span>
                  </label>
                </>
              )}
            </div>
          </Card>
        )}

        {/* Notification Settings */}
        {activeTab === 'notifications' && (
          <Card className="p-6" data-testid="notification-settings">
            <h2 className="text-xl font-semibold mb-6">Notification Settings</h2>
            <div className="space-y-4 max-w-2xl">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notifications.orderConfirmationEnabled}
                  onChange={(e) => updateNotificationSettings('orderConfirmationEnabled', e.target.checked)}
                  className="rounded"
                  data-testid="order-confirmation"
                />
                <span>Send order confirmation emails</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notifications.shippingNotificationEnabled}
                  onChange={(e) => updateNotificationSettings('shippingNotificationEnabled', e.target.checked)}
                  className="rounded"
                  data-testid="shipping-notification"
                />
                <span>Send shipping notification emails</span>
              </label>
              <div>
                <label className="block text-sm font-medium mb-2">Low Stock Alert Threshold</label>
                <Input
                  type="number"
                  value={settings.notifications.lowStockAlertThreshold}
                  onChange={(e) => updateNotificationSettings('lowStockAlertThreshold', parseInt(e.target.value))}
                  data-testid="low-stock-threshold"
                />
                <p className="text-sm text-gray-500 mt-1">Alert when stock falls below this number</p>
              </div>
            </div>
          </Card>
        )}

        {/* Save Button */}
        <div className="mt-6 flex gap-3">
          <Button onClick={handleSave} data-testid="save-settings">
            {saved ? (
              <>
                <Shield className="w-4 h-4 mr-2" />
                Saved Successfully!
              </>
            ) : (
              'Save Settings'
            )}
          </Button>
          {saved && (
            <div className="text-sm text-green-600 flex items-center">
              Settings have been saved
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
