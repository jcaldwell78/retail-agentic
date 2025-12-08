import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function CookiePolicyPage() {
  const effectiveDate = 'December 1, 2024';
  const lastUpdated = 'December 8, 2025';

  const openCookieSettings = () => {
    window.dispatchEvent(new CustomEvent('openCookieSettings'));
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4" data-testid="cookie-policy-page">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent className="py-8 px-6 md:px-12">
            <h1 className="text-3xl font-bold mb-2" data-testid="page-title">Cookie Policy</h1>
            <p className="text-muted-foreground mb-8">
              Effective Date: {effectiveDate} | Last Updated: {lastUpdated}
            </p>

            <div className="prose prose-gray max-w-none">
              <section className="mb-8" data-testid="section-intro">
                <h2 className="text-xl font-semibold mb-4">What Are Cookies?</h2>
                <p className="text-gray-700 mb-4">
                  Cookies are small text files that are placed on your device when you visit our
                  website. They help us provide you with a better experience, remember your
                  preferences, and understand how you use our site.
                </p>
                <p className="text-gray-700">
                  This Cookie Policy explains what cookies are, how we use them, and your choices
                  regarding cookies.
                </p>
              </section>

              <section className="mb-8" data-testid="section-manage-cookies">
                <h2 className="text-xl font-semibold mb-4">Manage Your Cookie Preferences</h2>
                <p className="text-gray-700 mb-4">
                  You can customize which cookies you allow at any time:
                </p>
                <Button
                  onClick={openCookieSettings}
                  variant="outline"
                  className="mb-4"
                  data-testid="cookie-settings-btn"
                >
                  Open Cookie Settings
                </Button>
              </section>

              <section className="mb-8" data-testid="section-types">
                <h2 className="text-xl font-semibold mb-4">Types of Cookies We Use</h2>

                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 flex items-center justify-between">
                      <span>Strictly Necessary Cookies</span>
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                        Always Active
                      </span>
                    </h3>
                    <p className="text-gray-700 text-sm mt-2">
                      These cookies are essential for the website to function properly. They enable
                      core functionality such as security, network management, and account access.
                      You cannot disable these cookies.
                    </p>
                    <ul className="list-disc pl-4 mt-2 text-sm text-gray-600 space-y-1">
                      <li>Session management</li>
                      <li>Shopping cart functionality</li>
                      <li>Secure login authentication</li>
                      <li>Load balancing</li>
                    </ul>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900">Functional Cookies</h3>
                    <p className="text-gray-700 text-sm mt-2">
                      These cookies enable personalized features and remember your preferences
                      to enhance your browsing experience.
                    </p>
                    <ul className="list-disc pl-4 mt-2 text-sm text-gray-600 space-y-1">
                      <li>Language preferences</li>
                      <li>Currency settings</li>
                      <li>Recently viewed products</li>
                      <li>Wishlist functionality</li>
                    </ul>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900">Analytics Cookies</h3>
                    <p className="text-gray-700 text-sm mt-2">
                      These cookies help us understand how visitors interact with our website
                      by collecting anonymous information about page visits and user behavior.
                    </p>
                    <ul className="list-disc pl-4 mt-2 text-sm text-gray-600 space-y-1">
                      <li>Page view statistics</li>
                      <li>Traffic sources</li>
                      <li>Site performance metrics</li>
                      <li>User journey analysis</li>
                    </ul>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900">Marketing Cookies</h3>
                    <p className="text-gray-700 text-sm mt-2">
                      These cookies are used to deliver relevant advertisements and track
                      marketing campaign effectiveness across different platforms.
                    </p>
                    <ul className="list-disc pl-4 mt-2 text-sm text-gray-600 space-y-1">
                      <li>Targeted advertising</li>
                      <li>Retargeting campaigns</li>
                      <li>Social media sharing</li>
                      <li>Campaign attribution</li>
                    </ul>
                  </div>
                </div>
              </section>

              <section className="mb-8" data-testid="section-third-party">
                <h2 className="text-xl font-semibold mb-4">Third-Party Cookies</h2>
                <p className="text-gray-700 mb-4">
                  Some cookies are placed by third-party services that appear on our pages.
                  We use the following third-party services:
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-200 mb-4">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-200 px-4 py-2 text-left">Provider</th>
                        <th className="border border-gray-200 px-4 py-2 text-left">Purpose</th>
                        <th className="border border-gray-200 px-4 py-2 text-left">More Info</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-gray-200 px-4 py-2">Google Analytics</td>
                        <td className="border border-gray-200 px-4 py-2">Site analytics</td>
                        <td className="border border-gray-200 px-4 py-2">
                          <a href="https://policies.google.com/privacy" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                            Privacy Policy
                          </a>
                        </td>
                      </tr>
                      <tr className="bg-gray-50">
                        <td className="border border-gray-200 px-4 py-2">Stripe</td>
                        <td className="border border-gray-200 px-4 py-2">Payment processing</td>
                        <td className="border border-gray-200 px-4 py-2">
                          <a href="https://stripe.com/privacy" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                            Privacy Policy
                          </a>
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-gray-200 px-4 py-2">Facebook Pixel</td>
                        <td className="border border-gray-200 px-4 py-2">Marketing</td>
                        <td className="border border-gray-200 px-4 py-2">
                          <a href="https://www.facebook.com/policy.php" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                            Privacy Policy
                          </a>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="mb-8" data-testid="section-control">
                <h2 className="text-xl font-semibold mb-4">How to Control Cookies</h2>
                <p className="text-gray-700 mb-4">
                  You can control and manage cookies in several ways:
                </p>

                <h3 className="text-lg font-medium mt-4 mb-2">Browser Settings</h3>
                <p className="text-gray-700 mb-4">
                  Most browsers allow you to manage cookie settings. Here are links to common
                  browser settings:
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                  <li>
                    <a href="https://support.google.com/chrome/answer/95647" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                      Google Chrome
                    </a>
                  </li>
                  <li>
                    <a href="https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                      Mozilla Firefox
                    </a>
                  </li>
                  <li>
                    <a href="https://support.apple.com/guide/safari/manage-cookies-and-website-data-sfri11471/mac" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                      Safari
                    </a>
                  </li>
                  <li>
                    <a href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                      Microsoft Edge
                    </a>
                  </li>
                </ul>

                <h3 className="text-lg font-medium mt-4 mb-2">Opt-Out Tools</h3>
                <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                  <li>
                    <a href="https://tools.google.com/dlpage/gaoptout" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                      Google Analytics Opt-Out
                    </a>
                  </li>
                  <li>
                    <a href="https://www.youronlinechoices.com/" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                      Your Online Choices (EU)
                    </a>
                  </li>
                  <li>
                    <a href="https://optout.aboutads.info/" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                      Digital Advertising Alliance
                    </a>
                  </li>
                </ul>
              </section>

              <section className="mb-8" data-testid="section-impact">
                <h2 className="text-xl font-semibold mb-4">Impact of Disabling Cookies</h2>
                <p className="text-gray-700 mb-4">
                  If you disable certain cookies, some features of our website may not function
                  properly:
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                  <li>You may not be able to log in or maintain your session</li>
                  <li>Shopping cart may not save your items</li>
                  <li>Preferences may not be remembered between visits</li>
                  <li>Personalized recommendations may not work</li>
                </ul>
              </section>

              <section className="mb-8" data-testid="section-updates">
                <h2 className="text-xl font-semibold mb-4">Updates to This Policy</h2>
                <p className="text-gray-700">
                  We may update this Cookie Policy from time to time. The "Last Updated" date
                  at the top of this page indicates when the policy was last revised. We encourage
                  you to review this policy periodically.
                </p>
              </section>

              <section className="mb-8" data-testid="section-contact">
                <h2 className="text-xl font-semibold mb-4">Contact Us</h2>
                <p className="text-gray-700 mb-4">
                  If you have questions about our use of cookies, please contact us:
                </p>
                <div className="bg-gray-50 rounded-lg p-4 text-gray-700">
                  <p className="font-medium">Privacy Team</p>
                  <p>Email: privacy@example.com</p>
                  <p>
                    See also our{' '}
                    <Link to="/privacy" className="text-primary hover:underline">
                      Privacy Policy
                    </Link>
                  </p>
                </div>
              </section>
            </div>

            <div className="mt-8 pt-8 border-t">
              <Link
                to="/"
                className="text-primary hover:underline"
                data-testid="back-home-link"
              >
                &larr; Back to Home
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
