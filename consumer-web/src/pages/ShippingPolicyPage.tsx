import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';

export default function ShippingPolicyPage() {
  const effectiveDate = 'December 1, 2024';
  const lastUpdated = 'December 8, 2025';

  return (
    <div className="min-h-screen bg-background py-12 px-4" data-testid="shipping-policy-page">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent className="py-8 px-6 md:px-12">
            <h1 className="text-3xl font-bold mb-2" data-testid="page-title">Shipping Policy</h1>
            <p className="text-muted-foreground mb-8">
              Effective Date: {effectiveDate} | Last Updated: {lastUpdated}
            </p>

            <div className="prose prose-gray max-w-none">
              <section className="mb-8" data-testid="section-overview">
                <h2 className="text-xl font-semibold mb-4">Overview</h2>
                <p className="text-gray-700 mb-4">
                  We strive to deliver your orders as quickly and efficiently as possible. This
                  shipping policy outlines our shipping methods, delivery times, and related
                  information.
                </p>
              </section>

              <section className="mb-8" data-testid="section-processing">
                <h2 className="text-xl font-semibold mb-4">Order Processing</h2>
                <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                  <li>Orders are typically processed within <strong>1-2 business days</strong></li>
                  <li>Orders placed after 2 PM EST may be processed the next business day</li>
                  <li>Orders placed on weekends/holidays are processed the next business day</li>
                  <li>
                    You will receive a confirmation email with tracking information once your
                    order ships
                  </li>
                </ul>
              </section>

              <section className="mb-8" data-testid="section-shipping-methods">
                <h2 className="text-xl font-semibold mb-4">Shipping Methods & Delivery Times</h2>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-200 mb-4">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-200 px-4 py-2 text-left">Method</th>
                        <th className="border border-gray-200 px-4 py-2 text-left">Delivery Time</th>
                        <th className="border border-gray-200 px-4 py-2 text-left">Cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-gray-200 px-4 py-2">Standard Shipping</td>
                        <td className="border border-gray-200 px-4 py-2">5-7 business days</td>
                        <td className="border border-gray-200 px-4 py-2">$5.99 (Free over $50)</td>
                      </tr>
                      <tr className="bg-gray-50">
                        <td className="border border-gray-200 px-4 py-2">Expedited Shipping</td>
                        <td className="border border-gray-200 px-4 py-2">3-4 business days</td>
                        <td className="border border-gray-200 px-4 py-2">$12.99</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-200 px-4 py-2">Express Shipping</td>
                        <td className="border border-gray-200 px-4 py-2">1-2 business days</td>
                        <td className="border border-gray-200 px-4 py-2">$24.99</td>
                      </tr>
                      <tr className="bg-gray-50">
                        <td className="border border-gray-200 px-4 py-2">Same Day Delivery*</td>
                        <td className="border border-gray-200 px-4 py-2">Same day</td>
                        <td className="border border-gray-200 px-4 py-2">$39.99</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-sm text-gray-500">
                  *Same Day Delivery available in select metro areas for orders placed before 10 AM
                </p>
              </section>

              <section className="mb-8" data-testid="section-free-shipping">
                <h2 className="text-xl font-semibold mb-4">Free Shipping</h2>
                <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                  <li>Free standard shipping on all orders over $50</li>
                  <li>Premium members enjoy free standard shipping on all orders</li>
                  <li>Free shipping applies to the 48 contiguous US states</li>
                  <li>
                    Hawaii, Alaska, and international orders may have additional shipping costs
                  </li>
                </ul>
              </section>

              <section className="mb-8" data-testid="section-international">
                <h2 className="text-xl font-semibold mb-4">International Shipping</h2>
                <p className="text-gray-700 mb-4">
                  We ship to select international destinations. International shipping includes:
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                  <li>Delivery times typically range from 7-21 business days</li>
                  <li>Shipping costs are calculated at checkout based on destination</li>
                  <li>
                    Customers are responsible for any customs duties, taxes, or import fees
                  </li>
                  <li>Some items may not be eligible for international shipping</li>
                </ul>
                <p className="text-gray-700">
                  <strong>Supported Countries:</strong> Canada, UK, EU member states, Australia,
                  Japan, and more. Full list available at checkout.
                </p>
              </section>

              <section className="mb-8" data-testid="section-tracking">
                <h2 className="text-xl font-semibold mb-4">Order Tracking</h2>
                <p className="text-gray-700 mb-4">
                  Once your order ships, you will receive a tracking number via email. You can
                  track your package through:
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                  <li>
                    Your{' '}
                    <Link to="/account/orders" className="text-primary hover:underline">
                      Order History
                    </Link>{' '}
                    in your account
                  </li>
                  <li>The link provided in your shipping confirmation email</li>
                  <li>The carrier's website using your tracking number</li>
                </ul>
              </section>

              <section className="mb-8" data-testid="section-delivery-issues">
                <h2 className="text-xl font-semibold mb-4">Delivery Issues</h2>
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900">Lost Package</h3>
                    <p className="text-gray-700 text-sm mt-1">
                      If your package shows as delivered but you haven't received it, please
                      wait 24-48 hours as carriers sometimes mark packages delivered early.
                      If still not received, contact us.
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900">Damaged Package</h3>
                    <p className="text-gray-700 text-sm mt-1">
                      If your package arrives damaged, please take photos and contact us
                      within 48 hours. We'll arrange for a replacement or refund.
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900">Wrong Items</h3>
                    <p className="text-gray-700 text-sm mt-1">
                      If you received the wrong item, please contact us immediately. We'll
                      send the correct item and provide a prepaid return label.
                    </p>
                  </div>
                </div>
              </section>

              <section className="mb-8" data-testid="section-po-boxes">
                <h2 className="text-xl font-semibold mb-4">P.O. Boxes & APO/FPO</h2>
                <p className="text-gray-700 mb-4">
                  We ship to P.O. Boxes and military addresses (APO/FPO/DPO):
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                  <li>P.O. Box deliveries use USPS and may take longer</li>
                  <li>Express and same-day shipping not available for P.O. Boxes</li>
                  <li>Military addresses may have extended delivery times (2-4 weeks)</li>
                </ul>
              </section>

              <section className="mb-8" data-testid="section-signature">
                <h2 className="text-xl font-semibold mb-4">Signature Requirements</h2>
                <p className="text-gray-700 mb-4">
                  A signature may be required for:
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                  <li>Orders over $200 in value</li>
                  <li>Items marked as high-value or fragile</li>
                  <li>Addresses flagged for previous delivery issues</li>
                </ul>
              </section>

              <section className="mb-8" data-testid="section-contact">
                <h2 className="text-xl font-semibold mb-4">Contact Us</h2>
                <p className="text-gray-700 mb-4">
                  For shipping-related questions, please contact us:
                </p>
                <div className="bg-gray-50 rounded-lg p-4 text-gray-700">
                  <p className="font-medium">Shipping Support</p>
                  <p>Email: shipping@example.com</p>
                  <p>Phone: 1-800-123-4567 (Mon-Fri, 9am-6pm EST)</p>
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
