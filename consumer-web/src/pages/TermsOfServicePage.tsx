import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';

export default function TermsOfServicePage() {
  const effectiveDate = 'December 1, 2024';
  const lastUpdated = 'December 7, 2025';

  return (
    <div className="min-h-screen bg-background py-12 px-4" data-testid="terms-of-service-page">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent className="py-8 px-6 md:px-12">
            <h1 className="text-3xl font-bold mb-2" data-testid="page-title">Terms of Service</h1>
            <p className="text-muted-foreground mb-8">
              Effective Date: {effectiveDate} | Last Updated: {lastUpdated}
            </p>

            <div className="prose prose-gray max-w-none">
              <section className="mb-8" data-testid="section-intro">
                <h2 className="text-xl font-semibold mb-4">Introduction</h2>
                <p className="text-gray-700 mb-4">
                  Welcome to our online store. These Terms of Service ("Terms") govern your use of
                  our website and services. By accessing or using our website, you agree to be bound
                  by these Terms. If you do not agree to these Terms, please do not use our services.
                </p>
                <p className="text-gray-700">
                  Please read these Terms carefully before using our platform. We reserve the right
                  to modify these Terms at any time, and your continued use of the website after
                  such modifications constitutes acceptance of the updated Terms.
                </p>
              </section>

              <section className="mb-8" data-testid="section-definitions">
                <h2 className="text-xl font-semibold mb-4">Definitions</h2>
                <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                  <li>
                    <strong>"We", "Us", "Our"</strong> refers to the company operating this website.
                  </li>
                  <li>
                    <strong>"You", "User", "Customer"</strong> refers to you, the person using our
                    website and services.
                  </li>
                  <li>
                    <strong>"Website"</strong> refers to our e-commerce platform and all related
                    services.
                  </li>
                  <li>
                    <strong>"Products"</strong> refers to any goods or services offered for sale on
                    our website.
                  </li>
                  <li>
                    <strong>"Content"</strong> refers to all text, images, data, information, and
                    other materials on the website.
                  </li>
                </ul>
              </section>

              <section className="mb-8" data-testid="section-eligibility">
                <h2 className="text-xl font-semibold mb-4">Eligibility</h2>
                <p className="text-gray-700 mb-4">
                  By using our website, you represent and warrant that:
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                  <li>You are at least 18 years of age or the legal age of majority in your jurisdiction</li>
                  <li>You have the legal capacity to enter into a binding agreement</li>
                  <li>You will use the website only for lawful purposes</li>
                  <li>All information you provide is accurate, current, and complete</li>
                  <li>You are authorized to use the payment method you provide</li>
                </ul>
              </section>

              <section className="mb-8" data-testid="section-account">
                <h2 className="text-xl font-semibold mb-4">Account Registration</h2>
                <p className="text-gray-700 mb-4">
                  To access certain features, you may need to create an account. When creating an
                  account, you agree to:
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                  <li>Provide accurate and complete registration information</li>
                  <li>Maintain the security and confidentiality of your login credentials</li>
                  <li>Notify us immediately of any unauthorized use of your account</li>
                  <li>Accept responsibility for all activities that occur under your account</li>
                  <li>Not share your account with others or transfer your account</li>
                </ul>
                <p className="text-gray-700">
                  We reserve the right to suspend or terminate accounts that violate these Terms
                  or for any other reason at our sole discretion.
                </p>
              </section>

              <section className="mb-8" data-testid="section-orders">
                <h2 className="text-xl font-semibold mb-4">Orders and Purchases</h2>
                <h3 className="text-lg font-medium mt-4 mb-2">Order Acceptance</h3>
                <p className="text-gray-700 mb-4">
                  All orders are subject to acceptance and availability. We reserve the right to
                  refuse or cancel any order for any reason, including but not limited to product
                  availability, errors in pricing or product information, or suspected fraud.
                </p>

                <h3 className="text-lg font-medium mt-4 mb-2">Pricing</h3>
                <p className="text-gray-700 mb-4">
                  All prices are displayed in the applicable currency and are subject to change
                  without notice. Prices exclude taxes and shipping costs unless otherwise stated.
                  In the event of a pricing error, we reserve the right to cancel orders placed at
                  the incorrect price.
                </p>

                <h3 className="text-lg font-medium mt-4 mb-2">Payment</h3>
                <p className="text-gray-700 mb-4">
                  Payment is due at the time of order. We accept major credit cards and other
                  payment methods as displayed at checkout. By providing payment information, you
                  represent that you are authorized to use the payment method.
                </p>
              </section>

              <section className="mb-8" data-testid="section-shipping">
                <h2 className="text-xl font-semibold mb-4">Shipping and Delivery</h2>
                <p className="text-gray-700 mb-4">
                  Shipping times and costs vary depending on your location and selected shipping
                  method. Estimated delivery times are not guaranteed. Risk of loss and title for
                  products pass to you upon delivery to the carrier.
                </p>
                <p className="text-gray-700">
                  We are not responsible for delays caused by shipping carriers, customs, weather,
                  or other factors outside our control. Please ensure your shipping address is
                  accurate; we are not responsible for orders shipped to incorrect addresses
                  provided by you.
                </p>
              </section>

              <section className="mb-8" data-testid="section-returns">
                <h2 className="text-xl font-semibold mb-4">Returns and Refunds</h2>
                <p className="text-gray-700 mb-4">
                  We offer returns within 30 days of delivery for most products. To be eligible
                  for a return:
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                  <li>The item must be unused and in its original packaging</li>
                  <li>You must have the receipt or proof of purchase</li>
                  <li>The item must not be a final sale or non-returnable item</li>
                </ul>
                <p className="text-gray-700 mb-4">
                  Refunds will be processed within 5-10 business days after we receive and inspect
                  the returned item. Refunds will be issued to the original payment method.
                </p>
                <p className="text-gray-700">
                  For detailed return instructions, please visit our{' '}
                  <Link to="/returns" className="text-primary hover:underline">
                    Returns Policy
                  </Link>{' '}
                  page.
                </p>
              </section>

              <section className="mb-8" data-testid="section-intellectual-property">
                <h2 className="text-xl font-semibold mb-4">Intellectual Property</h2>
                <p className="text-gray-700 mb-4">
                  All content on this website, including but not limited to text, graphics, logos,
                  images, product descriptions, and software, is our property or the property of
                  our licensors and is protected by copyright, trademark, and other intellectual
                  property laws.
                </p>
                <p className="text-gray-700">
                  You may not reproduce, distribute, modify, create derivative works, publicly
                  display, or otherwise use any content from our website without our prior written
                  consent. Limited license is granted for personal, non-commercial use only.
                </p>
              </section>

              <section className="mb-8" data-testid="section-user-content">
                <h2 className="text-xl font-semibold mb-4">User Content</h2>
                <p className="text-gray-700 mb-4">
                  When you submit content to our website, such as reviews, questions, or comments,
                  you grant us a non-exclusive, royalty-free, perpetual, and worldwide license to
                  use, reproduce, modify, and display such content.
                </p>
                <p className="text-gray-700 mb-4">You represent that:</p>
                <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                  <li>You own or have the right to submit the content</li>
                  <li>The content does not violate any third-party rights</li>
                  <li>The content is accurate and not misleading</li>
                  <li>The content is not illegal, obscene, defamatory, or harmful</li>
                </ul>
                <p className="text-gray-700">
                  We reserve the right to remove any user content that violates these Terms or for
                  any other reason at our sole discretion.
                </p>
              </section>

              <section className="mb-8" data-testid="section-prohibited">
                <h2 className="text-xl font-semibold mb-4">Prohibited Conduct</h2>
                <p className="text-gray-700 mb-4">You agree not to:</p>
                <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                  <li>Use the website for any unlawful purpose</li>
                  <li>Violate any applicable laws or regulations</li>
                  <li>Infringe on our intellectual property or that of others</li>
                  <li>Submit false, misleading, or fraudulent information</li>
                  <li>Interfere with the website's operation or security</li>
                  <li>Use bots, scrapers, or automated tools without permission</li>
                  <li>Attempt to gain unauthorized access to systems or accounts</li>
                  <li>Harass, abuse, or harm others</li>
                  <li>Engage in any activity that disrupts other users' experience</li>
                </ul>
              </section>

              <section className="mb-8" data-testid="section-disclaimer">
                <h2 className="text-xl font-semibold mb-4">Disclaimer of Warranties</h2>
                <p className="text-gray-700 mb-4">
                  THE WEBSITE AND ALL PRODUCTS AND SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE"
                  WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. TO THE FULLEST EXTENT
                  PERMITTED BY LAW, WE DISCLAIM ALL WARRANTIES, INCLUDING BUT NOT LIMITED TO:
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                  <li>Merchantability and fitness for a particular purpose</li>
                  <li>Non-infringement of third-party rights</li>
                  <li>Accuracy, reliability, or completeness of content</li>
                  <li>Uninterrupted, secure, or error-free operation</li>
                </ul>
              </section>

              <section className="mb-8" data-testid="section-liability">
                <h2 className="text-xl font-semibold mb-4">Limitation of Liability</h2>
                <p className="text-gray-700 mb-4">
                  TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR ANY INDIRECT,
                  INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT
                  LIMITED TO LOSS OF PROFITS, DATA, OR GOODWILL, ARISING FROM YOUR USE OF OR
                  INABILITY TO USE THE WEBSITE OR SERVICES.
                </p>
                <p className="text-gray-700">
                  Our total liability for any claims arising from these Terms or your use of the
                  website shall not exceed the amount you paid to us in the 12 months preceding
                  the claim.
                </p>
              </section>

              <section className="mb-8" data-testid="section-indemnification">
                <h2 className="text-xl font-semibold mb-4">Indemnification</h2>
                <p className="text-gray-700">
                  You agree to indemnify and hold us harmless from any claims, damages, losses,
                  liabilities, and expenses (including legal fees) arising from your violation of
                  these Terms, your use of the website, your content submissions, or your
                  infringement of any third-party rights.
                </p>
              </section>

              <section className="mb-8" data-testid="section-dispute">
                <h2 className="text-xl font-semibold mb-4">Dispute Resolution</h2>
                <p className="text-gray-700 mb-4">
                  Any disputes arising from these Terms or your use of the website shall be
                  resolved as follows:
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                  <li>
                    <strong>Informal Resolution:</strong> We encourage you to contact us first to
                    attempt to resolve any disputes informally.
                  </li>
                  <li>
                    <strong>Binding Arbitration:</strong> If informal resolution fails, disputes
                    shall be resolved through binding arbitration in accordance with applicable
                    arbitration rules.
                  </li>
                  <li>
                    <strong>Class Action Waiver:</strong> You agree to resolve disputes on an
                    individual basis and waive any right to participate in class actions.
                  </li>
                </ul>
              </section>

              <section className="mb-8" data-testid="section-governing-law">
                <h2 className="text-xl font-semibold mb-4">Governing Law</h2>
                <p className="text-gray-700">
                  These Terms shall be governed by and construed in accordance with the laws of
                  the jurisdiction in which we are incorporated, without regard to its conflict of
                  law provisions. Any legal proceedings shall be brought in the courts of that
                  jurisdiction.
                </p>
              </section>

              <section className="mb-8" data-testid="section-termination">
                <h2 className="text-xl font-semibold mb-4">Termination</h2>
                <p className="text-gray-700 mb-4">
                  We may terminate or suspend your access to the website at any time, without
                  prior notice or liability, for any reason, including if you breach these Terms.
                  Upon termination:
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                  <li>Your right to access the website will immediately cease</li>
                  <li>Any pending orders may be cancelled</li>
                  <li>Provisions that should survive termination will remain in effect</li>
                </ul>
              </section>

              <section className="mb-8" data-testid="section-changes">
                <h2 className="text-xl font-semibold mb-4">Changes to Terms</h2>
                <p className="text-gray-700">
                  We reserve the right to modify these Terms at any time. Changes will be
                  effective immediately upon posting to the website. Your continued use of the
                  website after changes are posted constitutes acceptance of the modified Terms.
                  We encourage you to review these Terms periodically.
                </p>
              </section>

              <section className="mb-8" data-testid="section-severability">
                <h2 className="text-xl font-semibold mb-4">Severability</h2>
                <p className="text-gray-700">
                  If any provision of these Terms is found to be invalid, illegal, or
                  unenforceable, the remaining provisions shall continue in full force and effect.
                  The invalid provision shall be modified to the minimum extent necessary to make
                  it valid and enforceable.
                </p>
              </section>

              <section className="mb-8" data-testid="section-entire-agreement">
                <h2 className="text-xl font-semibold mb-4">Entire Agreement</h2>
                <p className="text-gray-700">
                  These Terms, together with our{' '}
                  <Link to="/privacy-policy" className="text-primary hover:underline">
                    Privacy Policy
                  </Link>{' '}
                  and any other policies referenced herein, constitute the entire agreement
                  between you and us regarding your use of the website and supersede all prior
                  agreements and understandings.
                </p>
              </section>

              <section className="mb-8" data-testid="section-contact">
                <h2 className="text-xl font-semibold mb-4">Contact Us</h2>
                <p className="text-gray-700 mb-4">
                  If you have any questions about these Terms of Service, please contact us:
                </p>
                <div className="bg-gray-50 rounded-lg p-4 text-gray-700">
                  <p className="font-medium">Legal Department</p>
                  <p>Email: legal@example.com</p>
                  <p>Address: 123 Commerce Street, City, Country</p>
                </div>
              </section>
            </div>

            <div className="mt-8 pt-8 border-t flex gap-4">
              <Link
                to="/"
                className="text-primary hover:underline"
                data-testid="back-home-link"
              >
                &larr; Back to Home
              </Link>
              <span className="text-gray-300">|</span>
              <Link
                to="/privacy-policy"
                className="text-primary hover:underline"
                data-testid="privacy-policy-link"
              >
                Privacy Policy
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
