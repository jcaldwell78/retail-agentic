import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, Mail, MessageSquare, Globe, Moon, Sun } from 'lucide-react';

export default function AccountPreferencesPage() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);
  const [orderUpdates, setOrderUpdates] = useState(true);
  const [productRecommendations, setProductRecommendations] = useState(true);
  const [priceAlerts, setPriceAlerts] = useState(false);
  const [language, setLanguage] = useState('en');
  const [currency, setCurrency] = useState('USD');
  const [theme, setTheme] = useState<'light' | 'dark' | 'auto'>('auto');
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Saving preferences...');
    // TODO: Save to backend
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const Switch = ({ checked, onChange, label }: { checked: boolean; onChange: (checked: boolean) => void; label: string }) => (
    <label className="flex items-center justify-between cursor-pointer group">
      <span className="text-sm text-gray-700 group-hover:text-gray-900">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? 'bg-blue-600' : 'bg-gray-300'
        }`}
        data-testid={`switch-${label.toLowerCase().replace(/\s+/g, '-')}`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </label>
  );

  return (
    <div className="min-h-screen bg-gray-50" data-testid="account-preferences-page">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Account Preferences</h1>
          <p className="text-gray-600">Manage your notification and display preferences</p>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Notifications */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <Bell className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-semibold">Notifications</h2>
            </div>

            <div className="space-y-4">
              <div className="pb-4 border-b">
                <h3 className="font-medium mb-3">Channels</h3>
                <div className="space-y-3">
                  <Switch
                    checked={emailNotifications}
                    onChange={setEmailNotifications}
                    label="Email notifications"
                  />
                  <Switch
                    checked={smsNotifications}
                    onChange={setSmsNotifications}
                    label="SMS notifications"
                  />
                  <Switch
                    checked={pushNotifications}
                    onChange={setPushNotifications}
                    label="Push notifications"
                  />
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-3">Notification Types</h3>
                <div className="space-y-3">
                  <Switch
                    checked={orderUpdates}
                    onChange={setOrderUpdates}
                    label="Order updates and shipping notifications"
                  />
                  <Switch
                    checked={productRecommendations}
                    onChange={setProductRecommendations}
                    label="Personalized product recommendations"
                  />
                  <Switch
                    checked={priceAlerts}
                    onChange={setPriceAlerts}
                    label="Price drop alerts on wishlist items"
                  />
                  <Switch
                    checked={marketingEmails}
                    onChange={setMarketingEmails}
                    label="Marketing emails and promotions"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Language & Region */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <Globe className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-semibold">Language & Region</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="language" className="block text-sm font-medium mb-2">
                  Language
                </label>
                <select
                  id="language"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  data-testid="language-select"
                >
                  <option value="en">English</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                  <option value="de">Deutsch</option>
                  <option value="zh">中文</option>
                  <option value="ja">日本語</option>
                </select>
              </div>

              <div>
                <label htmlFor="currency" className="block text-sm font-medium mb-2">
                  Currency
                </label>
                <select
                  id="currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  data-testid="currency-select"
                >
                  <option value="USD">USD - US Dollar ($)</option>
                  <option value="EUR">EUR - Euro (€)</option>
                  <option value="GBP">GBP - British Pound (£)</option>
                  <option value="JPY">JPY - Japanese Yen (¥)</option>
                  <option value="CAD">CAD - Canadian Dollar (CA$)</option>
                  <option value="AUD">AUD - Australian Dollar (A$)</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Display Settings */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <Sun className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-semibold">Display Settings</h2>
            </div>

            <div>
              <label className="block text-sm font-medium mb-3">Theme</label>
              <div className="grid grid-cols-3 gap-4">
                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  className={`p-4 border-2 rounded-lg transition-colors ${
                    theme === 'light'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  data-testid="theme-light"
                >
                  <Sun className="w-6 h-6 mx-auto mb-2" />
                  <div className="text-sm font-medium">Light</div>
                </button>

                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  className={`p-4 border-2 rounded-lg transition-colors ${
                    theme === 'dark'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  data-testid="theme-dark"
                >
                  <Moon className="w-6 h-6 mx-auto mb-2" />
                  <div className="text-sm font-medium">Dark</div>
                </button>

                <button
                  type="button"
                  onClick={() => setTheme('auto')}
                  className={`p-4 border-2 rounded-lg transition-colors ${
                    theme === 'auto'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  data-testid="theme-auto"
                >
                  <div className="relative w-6 h-6 mx-auto mb-2">
                    <Sun className="w-4 h-4 absolute top-0 left-0" />
                    <Moon className="w-4 h-4 absolute bottom-0 right-0" />
                  </div>
                  <div className="text-sm font-medium">Auto</div>
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Auto mode will match your system preferences
              </p>
            </div>
          </Card>

          {/* Communication */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <MessageSquare className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-semibold">Communication Preferences</h2>
            </div>

            <div className="space-y-3">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-medium text-blue-900 mb-1">Email Preferences</h3>
                    <p className="text-sm text-blue-700">
                      You're currently subscribed to {marketingEmails ? 'marketing emails and ' : ''}
                      order updates. You can unsubscribe from specific types above.
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-sm text-gray-600">
                <p>
                  Note: You'll always receive important transactional emails like order confirmations
                  and password resets, even if you opt out of marketing communications.
                </p>
              </div>
            </div>
          </Card>

          {/* Save Button */}
          <div className="flex gap-4 sticky bottom-4 bg-white p-4 rounded-lg shadow-lg border">
            <Button type="submit" className="flex-1" data-testid="save-preferences">
              {saved ? 'Saved!' : 'Save Preferences'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => window.history.back()}
            >
              Cancel
            </Button>
          </div>

          {saved && (
            <div className="fixed bottom-20 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg">
              Preferences saved successfully!
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
