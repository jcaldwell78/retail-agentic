import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';

export default function RefundPolicyPage() {
  const effectiveDate = 'December 1, 2024';
  const lastUpdated = 'December 8, 2025';

  return (
    <div className="min-h-screen bg-background py-12 px-4" data-testid="refund-policy-page">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent className="py-8 px-6 md:px-12">
            <h1 className="text-3xl font-bold mb-2" data-testid="page-title">Refund & Return Policy</h1>
            <p className="text-muted-foreground mb-8">
              Effective Date: {effectiveDate} | Last Updated: {lastUpdated}
            </p>

            <div className="prose prose-gray max-w-none">
              <section className="mb-8" data-testid="section-overview">
                <h2 className="text-xl font-semibold mb-4">Overview</h2>
                <p className="text-gray-700 mb-4">
                  We want you to be completely satisfied with your purchase. If you're not happy
                  with your order, we offer a hassle-free return and refund policy. Please read
                  this policy carefully to understand your rights and our procedures.
                </p>
              </section>

              <section className="mb-8" data-testid="section-eligibility">
                <h2 className="text-xl font-semibold mb-4">Return Eligibility</h2>
                <p className="text-gray-700 mb-4">
                  To be eligible for a return, the following conditions must be met:
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                  <li>Items must be returned within <strong>30 days</strong> of delivery</li>
                  <li>Products must be unused, unworn, and in original condition</li>
                  <li>All original tags and packaging must be intact</li>
                  <li>Proof of purchase (order confirmation or receipt) is required</li>
                </ul>
              </section>

              <section className="mb-8" data-testid="section-non-returnable">
                <h2 className="text-xl font-semibold mb-4">Non-Returnable Items</h2>
                <p className="text-gray-700 mb-4">
                  The following items cannot be returned or refunded:
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                  <li>Personalized or custom-made items</li>
                  <li>Intimate apparel and swimwear (for hygiene reasons)</li>
                  <li>Gift cards and vouchers</li>
                  <li>Items marked as "Final Sale" or "Non-Returnable"</li>
                  <li>Items damaged due to customer misuse</li>
                  <li>Products with broken seals (cosmetics, electronics)</li>
                </ul>
              </section>

              <section className="mb-8" data-testid="section-how-to-return">
                <h2 className="text-xl font-semibold mb-4">How to Return an Item</h2>
                <ol className="list-decimal pl-6 mb-4 text-gray-700 space-y-2">
                  <li>
                    <strong>Initiate Return:</strong> Log in to your account and go to
                    "Order History." Select the order and click "Return Item."
                  </li>
                  <li>
                    <strong>Select Reason:</strong> Choose the reason for your return and
                    provide any additional details.
                  </li>
                  <li>
                    <strong>Print Label:</strong> Download and print the prepaid return
                    shipping label (if applicable in your region).
                  </li>
                  <li>
                    <strong>Pack Items:</strong> Securely pack the item(s) in the original
                    packaging or a suitable alternative.
                  </li>
                  <li>
                    <strong>Ship:</strong> Drop off the package at the designated carrier
                    location.
                  </li>
                </ol>
              </section>

              <section className="mb-8" data-testid="section-refund-process">
                <h2 className="text-xl font-semibold mb-4">Refund Process</h2>
                <p className="text-gray-700 mb-4">
                  Once we receive and inspect your return:
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                  <li>We will email you to confirm receipt of the returned item</li>
                  <li>Inspection typically takes 2-3 business days</li>
                  <li>If approved, refunds are processed within 5-7 business days</li>
                  <li>Refunds are credited to the original payment method</li>
                </ul>
                <p className="text-gray-700">
                  <strong>Note:</strong> It may take an additional 5-10 business days for your
                  bank or credit card company to process the refund.
                </p>
              </section>

              <section className="mb-8" data-testid="section-refund-types">
                <h2 className="text-xl font-semibold mb-4">Types of Refunds</h2>
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900">Full Refund</h3>
                    <p className="text-gray-700 text-sm mt-1">
                      Issued when items are returned in original condition within the return window.
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900">Partial Refund</h3>
                    <p className="text-gray-700 text-sm mt-1">
                      May be issued if items show signs of use or are missing original packaging.
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900">Store Credit</h3>
                    <p className="text-gray-700 text-sm mt-1">
                      Available as an alternative to refund, often with a bonus credit amount.
                    </p>
                  </div>
                </div>
              </section>

              <section className="mb-8" data-testid="section-shipping-costs">
                <h2 className="text-xl font-semibold mb-4">Return Shipping Costs</h2>
                <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                  <li>
                    <strong>Defective/Wrong Items:</strong> We cover return shipping costs
                  </li>
                  <li>
                    <strong>Change of Mind:</strong> Customer pays return shipping unless you
                    have a premium membership
                  </li>
                  <li>
                    <strong>Free Returns:</strong> Available for orders over $50 in select regions
                  </li>
                </ul>
              </section>

              <section className="mb-8" data-testid="section-exchanges">
                <h2 className="text-xl font-semibold mb-4">Exchanges</h2>
                <p className="text-gray-700 mb-4">
                  We currently do not offer direct exchanges. To get a different item or size:
                </p>
                <ol className="list-decimal pl-6 mb-4 text-gray-700 space-y-2">
                  <li>Return the original item following our return process</li>
                  <li>Place a new order for the desired item</li>
                </ol>
              </section>

              <section className="mb-8" data-testid="section-damaged-defective">
                <h2 className="text-xl font-semibold mb-4">Damaged or Defective Items</h2>
                <p className="text-gray-700 mb-4">
                  If you receive a damaged or defective item:
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                  <li>Contact us within 48 hours of delivery</li>
                  <li>Provide photos of the damage</li>
                  <li>We will arrange for a free replacement or full refund</li>
                  <li>You may be asked to return the defective item or dispose of it</li>
                </ul>
              </section>

              <section className="mb-8" data-testid="section-contact">
                <h2 className="text-xl font-semibold mb-4">Contact Us</h2>
                <p className="text-gray-700 mb-4">
                  For any questions about returns and refunds, please contact our customer service:
                </p>
                <div className="bg-gray-50 rounded-lg p-4 text-gray-700">
                  <p className="font-medium">Customer Service</p>
                  <p>Email: returns@example.com</p>
                  <p>Phone: 1-800-123-4567 (Mon-Fri, 9am-6pm EST)</p>
                  <p>
                    <Link to="/contact" className="text-primary hover:underline">
                      Contact Form
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
