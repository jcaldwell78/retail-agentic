import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';

export default function DataProcessingAgreementPage() {
  const effectiveDate = 'December 1, 2024';
  const lastUpdated = 'December 8, 2025';

  return (
    <div className="min-h-screen bg-background py-12 px-4" data-testid="dpa-page">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent className="py-8 px-6 md:px-12">
            <h1 className="text-3xl font-bold mb-2" data-testid="page-title">
              Data Processing Agreement
            </h1>
            <p className="text-muted-foreground mb-8">
              Effective Date: {effectiveDate} | Last Updated: {lastUpdated}
            </p>

            <div className="prose prose-gray max-w-none">
              <section className="mb-8" data-testid="section-intro">
                <h2 className="text-xl font-semibold mb-4">Introduction</h2>
                <p className="text-gray-700 mb-4">
                  This Data Processing Agreement ("DPA") forms part of the Terms of Service between
                  you and our company ("we", "us", or "our") for the use of our services. This DPA
                  reflects our commitment to protecting personal data in accordance with applicable
                  data protection laws, including the General Data Protection Regulation (GDPR) and
                  the California Consumer Privacy Act (CCPA).
                </p>
                <p className="text-gray-700">
                  This agreement applies to all processing of personal data carried out by us on
                  behalf of our customers and users.
                </p>
              </section>

              <section className="mb-8" data-testid="section-definitions">
                <h2 className="text-xl font-semibold mb-4">Definitions</h2>
                <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                  <li>
                    <strong>"Personal Data"</strong> means any information relating to an identified
                    or identifiable natural person.
                  </li>
                  <li>
                    <strong>"Data Controller"</strong> means the entity that determines the purposes
                    and means of processing personal data.
                  </li>
                  <li>
                    <strong>"Data Processor"</strong> means the entity that processes personal data
                    on behalf of the Data Controller.
                  </li>
                  <li>
                    <strong>"Data Subject"</strong> means the individual whose personal data is
                    processed.
                  </li>
                  <li>
                    <strong>"Processing"</strong> means any operation performed on personal data,
                    including collection, storage, use, and deletion.
                  </li>
                  <li>
                    <strong>"Sub-processor"</strong> means any third party engaged by us to process
                    personal data on your behalf.
                  </li>
                </ul>
              </section>

              <section className="mb-8" data-testid="section-scope">
                <h2 className="text-xl font-semibold mb-4">Scope of Processing</h2>
                <p className="text-gray-700 mb-4">
                  We process personal data as necessary to provide our e-commerce services,
                  including:
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                  <li>Order processing and fulfillment</li>
                  <li>Payment processing and fraud prevention</li>
                  <li>Customer account management</li>
                  <li>Customer support and communication</li>
                  <li>Analytics and service improvement</li>
                  <li>Marketing (with consent where required)</li>
                </ul>
              </section>

              <section className="mb-8" data-testid="section-data-categories">
                <h2 className="text-xl font-semibold mb-4">Categories of Data</h2>
                <p className="text-gray-700 mb-4">
                  The following categories of personal data may be processed:
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-200 mb-4">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-200 px-4 py-2 text-left">Category</th>
                        <th className="border border-gray-200 px-4 py-2 text-left">Examples</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-gray-200 px-4 py-2">Identity Data</td>
                        <td className="border border-gray-200 px-4 py-2">
                          Name, username, date of birth
                        </td>
                      </tr>
                      <tr className="bg-gray-50">
                        <td className="border border-gray-200 px-4 py-2">Contact Data</td>
                        <td className="border border-gray-200 px-4 py-2">
                          Email, phone number, address
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-gray-200 px-4 py-2">Financial Data</td>
                        <td className="border border-gray-200 px-4 py-2">
                          Payment card details (tokenized), billing address
                        </td>
                      </tr>
                      <tr className="bg-gray-50">
                        <td className="border border-gray-200 px-4 py-2">Transaction Data</td>
                        <td className="border border-gray-200 px-4 py-2">
                          Order history, payment records
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-gray-200 px-4 py-2">Technical Data</td>
                        <td className="border border-gray-200 px-4 py-2">
                          IP address, browser type, device information
                        </td>
                      </tr>
                      <tr className="bg-gray-50">
                        <td className="border border-gray-200 px-4 py-2">Usage Data</td>
                        <td className="border border-gray-200 px-4 py-2">
                          Browsing history, preferences, interactions
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="mb-8" data-testid="section-obligations">
                <h2 className="text-xl font-semibold mb-4">Our Obligations</h2>
                <p className="text-gray-700 mb-4">As a Data Processor, we commit to:</p>
                <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                  <li>Process personal data only on documented instructions</li>
                  <li>Ensure confidentiality of processing personnel</li>
                  <li>Implement appropriate technical and organizational security measures</li>
                  <li>Engage sub-processors only with prior authorization</li>
                  <li>Assist with data subject rights requests</li>
                  <li>Support compliance with security and breach notification obligations</li>
                  <li>Delete or return personal data at the end of services</li>
                  <li>Make available information necessary to demonstrate compliance</li>
                </ul>
              </section>

              <section className="mb-8" data-testid="section-security">
                <h2 className="text-xl font-semibold mb-4">Security Measures</h2>
                <p className="text-gray-700 mb-4">
                  We implement and maintain appropriate technical and organizational measures to
                  protect personal data, including:
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                  <li>Encryption of data in transit and at rest (AES-256, TLS 1.3)</li>
                  <li>Access controls and authentication mechanisms</li>
                  <li>Regular security assessments and penetration testing</li>
                  <li>Employee security training and confidentiality agreements</li>
                  <li>Incident response and disaster recovery procedures</li>
                  <li>Physical security of data centers</li>
                  <li>Regular backups with encryption</li>
                </ul>
              </section>

              <section className="mb-8" data-testid="section-subprocessors">
                <h2 className="text-xl font-semibold mb-4">Sub-processors</h2>
                <p className="text-gray-700 mb-4">
                  We engage the following categories of sub-processors to assist in providing our
                  services:
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-200 mb-4">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-200 px-4 py-2 text-left">Category</th>
                        <th className="border border-gray-200 px-4 py-2 text-left">Purpose</th>
                        <th className="border border-gray-200 px-4 py-2 text-left">Location</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-gray-200 px-4 py-2">Cloud Infrastructure</td>
                        <td className="border border-gray-200 px-4 py-2">
                          Hosting and storage services
                        </td>
                        <td className="border border-gray-200 px-4 py-2">US, EU</td>
                      </tr>
                      <tr className="bg-gray-50">
                        <td className="border border-gray-200 px-4 py-2">Payment Processors</td>
                        <td className="border border-gray-200 px-4 py-2">Payment processing</td>
                        <td className="border border-gray-200 px-4 py-2">US, EU</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-200 px-4 py-2">Email Services</td>
                        <td className="border border-gray-200 px-4 py-2">
                          Transactional and marketing emails
                        </td>
                        <td className="border border-gray-200 px-4 py-2">US</td>
                      </tr>
                      <tr className="bg-gray-50">
                        <td className="border border-gray-200 px-4 py-2">Analytics</td>
                        <td className="border border-gray-200 px-4 py-2">
                          Usage analytics and reporting
                        </td>
                        <td className="border border-gray-200 px-4 py-2">US, EU</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-200 px-4 py-2">Support Tools</td>
                        <td className="border border-gray-200 px-4 py-2">
                          Customer support ticketing
                        </td>
                        <td className="border border-gray-200 px-4 py-2">US</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-gray-700">
                  A complete list of sub-processors is available upon request. We will notify you of
                  any changes to sub-processors.
                </p>
              </section>

              <section className="mb-8" data-testid="section-transfers">
                <h2 className="text-xl font-semibold mb-4">International Data Transfers</h2>
                <p className="text-gray-700 mb-4">
                  When we transfer personal data outside the European Economic Area (EEA), we ensure
                  appropriate safeguards are in place:
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                  <li>Standard Contractual Clauses (SCCs) approved by the European Commission</li>
                  <li>EU-US Data Privacy Framework certification (where applicable)</li>
                  <li>Binding Corporate Rules (BCRs) where relevant</li>
                  <li>Adequacy decisions by the European Commission</li>
                </ul>
              </section>

              <section className="mb-8" data-testid="section-rights">
                <h2 className="text-xl font-semibold mb-4">Data Subject Rights</h2>
                <p className="text-gray-700 mb-4">
                  We assist in fulfilling data subject rights requests, including:
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                  <li>Right of access to personal data</li>
                  <li>Right to rectification of inaccurate data</li>
                  <li>Right to erasure ("right to be forgotten")</li>
                  <li>Right to restriction of processing</li>
                  <li>Right to data portability</li>
                  <li>Right to object to processing</li>
                  <li>Rights related to automated decision-making</li>
                </ul>
                <p className="text-gray-700">
                  Requests should be submitted through our{' '}
                  <Link to="/contact" className="text-primary hover:underline">
                    contact form
                  </Link>{' '}
                  or by emailing privacy@example.com.
                </p>
              </section>

              <section className="mb-8" data-testid="section-breach">
                <h2 className="text-xl font-semibold mb-4">Data Breach Notification</h2>
                <p className="text-gray-700 mb-4">
                  In the event of a personal data breach, we will:
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                  <li>Notify you without undue delay (within 72 hours where feasible)</li>
                  <li>Provide details of the nature and scope of the breach</li>
                  <li>Describe likely consequences and mitigation measures</li>
                  <li>Assist with notifications to supervisory authorities and data subjects</li>
                  <li>Document the breach and remediation actions taken</li>
                </ul>
              </section>

              <section className="mb-8" data-testid="section-retention">
                <h2 className="text-xl font-semibold mb-4">Data Retention</h2>
                <p className="text-gray-700 mb-4">
                  We retain personal data only as long as necessary for the purposes of processing
                  or as required by law:
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                  <li>Account data: Retained while account is active, deleted 30 days after closure</li>
                  <li>Transaction data: Retained for 7 years for legal/tax compliance</li>
                  <li>Marketing data: Retained until consent is withdrawn</li>
                  <li>Analytics data: Anonymized after 26 months</li>
                  <li>Support tickets: Retained for 3 years after resolution</li>
                </ul>
              </section>

              <section className="mb-8" data-testid="section-audit">
                <h2 className="text-xl font-semibold mb-4">Audit Rights</h2>
                <p className="text-gray-700 mb-4">
                  You have the right to verify our compliance with this DPA. We will:
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                  <li>Make available relevant compliance documentation upon request</li>
                  <li>Allow for and contribute to audits and inspections</li>
                  <li>Provide evidence of third-party security certifications (SOC 2, ISO 27001)</li>
                </ul>
              </section>

              <section className="mb-8" data-testid="section-termination">
                <h2 className="text-xl font-semibold mb-4">Termination</h2>
                <p className="text-gray-700">
                  Upon termination of services, we will, at your choice, delete or return all
                  personal data and delete existing copies unless retention is required by law. You
                  may request data export in a commonly used format before account closure.
                </p>
              </section>

              <section className="mb-8" data-testid="section-amendments">
                <h2 className="text-xl font-semibold mb-4">Amendments</h2>
                <p className="text-gray-700">
                  We may update this DPA to reflect changes in our practices or legal requirements.
                  Material changes will be notified via email or through our website. Continued use
                  of our services constitutes acceptance of the updated terms.
                </p>
              </section>

              <section className="mb-8" data-testid="section-contact">
                <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
                <p className="text-gray-700 mb-4">
                  For questions about this DPA or our data processing practices:
                </p>
                <div className="bg-gray-50 rounded-lg p-4 text-gray-700">
                  <p className="font-medium">Data Protection Officer</p>
                  <p>Email: dpo@example.com</p>
                  <p>Phone: 1-800-123-4567</p>
                  <p className="mt-2">
                    <Link to="/privacy" className="text-primary hover:underline">
                      Privacy Policy
                    </Link>
                    {' | '}
                    <Link to="/terms" className="text-primary hover:underline">
                      Terms of Service
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
