import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';

export default function PrivacyPolicyPage() {
  const effectiveDate = 'December 1, 2024';
  const lastUpdated = 'December 7, 2025';

  return (
    <div className="min-h-screen bg-background py-12 px-4" data-testid="privacy-policy-page">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent className="py-8 px-6 md:px-12">
            <h1 className="text-3xl font-bold mb-2" data-testid="page-title">Privacy Policy</h1>
            <p className="text-muted-foreground mb-8">
              Effective Date: {effectiveDate} | Last Updated: {lastUpdated}
            </p>

            <div className="prose prose-gray max-w-none">
              <section className="mb-8" data-testid="section-intro">
                <h2 className="text-xl font-semibold mb-4">Introduction</h2>
                <p className="text-gray-700 mb-4">
                  Welcome to our Privacy Policy. We respect your privacy and are committed to protecting
                  your personal data. This privacy policy explains how we collect, use, and safeguard
                  your information when you visit our website and use our services.
                </p>
                <p className="text-gray-700">
                  We comply with the General Data Protection Regulation (GDPR) and other applicable
                  data protection laws. Please read this policy carefully to understand our practices
                  regarding your personal data.
                </p>
              </section>

              <section className="mb-8" data-testid="section-data-collection">
                <h2 className="text-xl font-semibold mb-4">Information We Collect</h2>
                <p className="text-gray-700 mb-4">We may collect the following types of information:</p>

                <h3 className="text-lg font-medium mt-4 mb-2">Personal Information</h3>
                <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                  <li>Name and contact information (email address, phone number, postal address)</li>
                  <li>Account credentials (username, password - securely hashed)</li>
                  <li>Payment information (processed securely through our payment providers)</li>
                  <li>Order history and transaction details</li>
                  <li>Communication preferences</li>
                </ul>

                <h3 className="text-lg font-medium mt-4 mb-2">Automatically Collected Information</h3>
                <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                  <li>Device information (browser type, operating system, device identifiers)</li>
                  <li>IP address and approximate location</li>
                  <li>Usage data (pages visited, time spent, click patterns)</li>
                  <li>Cookies and similar tracking technologies</li>
                </ul>
              </section>

              <section className="mb-8" data-testid="section-data-use">
                <h2 className="text-xl font-semibold mb-4">How We Use Your Information</h2>
                <p className="text-gray-700 mb-4">We use your information for the following purposes:</p>
                <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                  <li>Processing and fulfilling your orders</li>
                  <li>Managing your account and providing customer support</li>
                  <li>Sending order confirmations, shipping updates, and receipts</li>
                  <li>Personalizing your shopping experience</li>
                  <li>Improving our website and services</li>
                  <li>Detecting and preventing fraud</li>
                  <li>Complying with legal obligations</li>
                  <li>Marketing communications (with your consent)</li>
                </ul>
              </section>

              <section className="mb-8" data-testid="section-legal-basis">
                <h2 className="text-xl font-semibold mb-4">Legal Basis for Processing (GDPR)</h2>
                <p className="text-gray-700 mb-4">
                  We process your personal data based on the following legal grounds:
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                  <li>
                    <strong>Contract Performance:</strong> Processing necessary to fulfill orders
                    and provide requested services
                  </li>
                  <li>
                    <strong>Consent:</strong> Marketing communications and non-essential cookies
                  </li>
                  <li>
                    <strong>Legitimate Interests:</strong> Fraud prevention, website improvement,
                    and analytics
                  </li>
                  <li>
                    <strong>Legal Obligation:</strong> Tax records, regulatory requirements
                  </li>
                </ul>
              </section>

              <section className="mb-8" data-testid="section-cookies">
                <h2 className="text-xl font-semibold mb-4">Cookies and Tracking</h2>
                <p className="text-gray-700 mb-4">
                  We use cookies and similar technologies to enhance your experience. You can manage
                  your cookie preferences at any time through our{' '}
                  <button
                    className="text-primary hover:underline"
                    onClick={() => {
                      // Trigger cookie settings - this would open the cookie consent modal
                      window.dispatchEvent(new CustomEvent('openCookieSettings'));
                    }}
                    data-testid="cookie-settings-link"
                  >
                    Cookie Settings
                  </button>
                  .
                </p>
                <p className="text-gray-700 mb-4">We use the following types of cookies:</p>
                <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                  <li>
                    <strong>Strictly Necessary:</strong> Required for basic site functionality
                  </li>
                  <li>
                    <strong>Functional:</strong> Remember preferences and settings
                  </li>
                  <li>
                    <strong>Analytics:</strong> Help us understand site usage
                  </li>
                  <li>
                    <strong>Marketing:</strong> Deliver relevant advertisements
                  </li>
                </ul>
              </section>

              <section className="mb-8" data-testid="section-data-sharing">
                <h2 className="text-xl font-semibold mb-4">Data Sharing and Third Parties</h2>
                <p className="text-gray-700 mb-4">
                  We may share your information with the following third parties:
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                  <li>Payment processors (for secure payment handling)</li>
                  <li>Shipping carriers (for order delivery)</li>
                  <li>Analytics providers (for website improvement)</li>
                  <li>Marketing platforms (with your consent)</li>
                  <li>Legal authorities (when required by law)</li>
                </ul>
                <p className="text-gray-700">
                  We do not sell your personal information to third parties.
                </p>
              </section>

              <section className="mb-8" data-testid="section-data-retention">
                <h2 className="text-xl font-semibold mb-4">Data Retention</h2>
                <p className="text-gray-700 mb-4">
                  We retain your personal data only for as long as necessary to fulfill the purposes
                  outlined in this policy:
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                  <li>Account data: Until account deletion or 3 years of inactivity</li>
                  <li>Order history: 7 years (for tax and legal requirements)</li>
                  <li>Marketing preferences: Until consent is withdrawn</li>
                  <li>Analytics data: 26 months</li>
                </ul>
              </section>

              <section className="mb-8" data-testid="section-your-rights">
                <h2 className="text-xl font-semibold mb-4">Your Rights</h2>
                <p className="text-gray-700 mb-4">
                  Under GDPR and applicable data protection laws, you have the following rights:
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                  <li>
                    <strong>Right to Access:</strong> Request a copy of your personal data
                  </li>
                  <li>
                    <strong>Right to Rectification:</strong> Correct inaccurate data
                  </li>
                  <li>
                    <strong>Right to Erasure:</strong> Request deletion of your data
                  </li>
                  <li>
                    <strong>Right to Restrict Processing:</strong> Limit how we use your data
                  </li>
                  <li>
                    <strong>Right to Data Portability:</strong> Receive your data in a portable format
                  </li>
                  <li>
                    <strong>Right to Object:</strong> Object to certain processing activities
                  </li>
                  <li>
                    <strong>Right to Withdraw Consent:</strong> Withdraw consent at any time
                  </li>
                </ul>
                <p className="text-gray-700">
                  To exercise these rights, please contact us at{' '}
                  <a href="mailto:privacy@example.com" className="text-primary hover:underline">
                    privacy@example.com
                  </a>{' '}
                  or visit your{' '}
                  <Link to="/account/preferences" className="text-primary hover:underline">
                    Account Preferences
                  </Link>
                  .
                </p>
              </section>

              <section className="mb-8" data-testid="section-data-security">
                <h2 className="text-xl font-semibold mb-4">Data Security</h2>
                <p className="text-gray-700 mb-4">
                  We implement appropriate technical and organizational measures to protect your
                  personal data, including:
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                  <li>Encryption of data in transit and at rest</li>
                  <li>Secure password hashing</li>
                  <li>Regular security assessments</li>
                  <li>Access controls and employee training</li>
                  <li>Incident response procedures</li>
                </ul>
              </section>

              <section className="mb-8" data-testid="section-international">
                <h2 className="text-xl font-semibold mb-4">International Data Transfers</h2>
                <p className="text-gray-700">
                  Your data may be transferred to and processed in countries outside the European
                  Economic Area (EEA). When we do so, we ensure appropriate safeguards are in place,
                  such as Standard Contractual Clauses approved by the European Commission.
                </p>
              </section>

              <section className="mb-8" data-testid="section-children">
                <h2 className="text-xl font-semibold mb-4">Children's Privacy</h2>
                <p className="text-gray-700">
                  Our services are not intended for children under 16 years of age. We do not
                  knowingly collect personal information from children. If you believe we have
                  collected data from a child, please contact us immediately.
                </p>
              </section>

              <section className="mb-8" data-testid="section-changes">
                <h2 className="text-xl font-semibold mb-4">Changes to This Policy</h2>
                <p className="text-gray-700">
                  We may update this privacy policy from time to time. We will notify you of any
                  material changes by posting the new policy on this page and updating the
                  "Last Updated" date. We encourage you to review this policy periodically.
                </p>
              </section>

              <section className="mb-8" data-testid="section-contact">
                <h2 className="text-xl font-semibold mb-4">Contact Us</h2>
                <p className="text-gray-700 mb-4">
                  If you have any questions about this privacy policy or our data practices,
                  please contact our Data Protection Officer:
                </p>
                <div className="bg-gray-50 rounded-lg p-4 text-gray-700">
                  <p className="font-medium">Data Protection Officer</p>
                  <p>Email: privacy@example.com</p>
                  <p>Address: 123 Privacy Street, City, Country</p>
                </div>
                <p className="text-gray-700 mt-4">
                  You also have the right to lodge a complaint with your local data protection
                  authority if you believe your rights have been violated.
                </p>
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
