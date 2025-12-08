import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';

export default function AccessibilityPage() {
  const lastUpdated = 'December 8, 2025';

  return (
    <div className="min-h-screen bg-background py-12 px-4" data-testid="accessibility-page">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent className="py-8 px-6 md:px-12">
            <h1 className="text-3xl font-bold mb-2" data-testid="page-title">
              Accessibility Statement
            </h1>
            <p className="text-muted-foreground mb-8">Last Updated: {lastUpdated}</p>

            <div className="prose prose-gray max-w-none">
              <section className="mb-8" data-testid="section-commitment">
                <h2 className="text-xl font-semibold mb-4">Our Commitment</h2>
                <p className="text-gray-700 mb-4">
                  We are committed to ensuring digital accessibility for people of all abilities.
                  We are continually improving the user experience for everyone and applying the
                  relevant accessibility standards to ensure we provide equal access to all users.
                </p>
              </section>

              <section className="mb-8" data-testid="section-standards">
                <h2 className="text-xl font-semibold mb-4">Conformance Standards</h2>
                <p className="text-gray-700 mb-4">
                  We strive to conform to the{' '}
                  <strong>Web Content Accessibility Guidelines (WCAG) 2.1 Level AA</strong>. These
                  guidelines explain how to make web content more accessible for people with
                  disabilities.
                </p>
                <p className="text-gray-700">
                  Conforming to these guidelines helps make the web more user-friendly for all
                  people.
                </p>
              </section>

              <section className="mb-8" data-testid="section-features">
                <h2 className="text-xl font-semibold mb-4">Accessibility Features</h2>
                <p className="text-gray-700 mb-4">
                  We have implemented the following features to support accessibility:
                </p>

                <h3 className="text-lg font-medium mt-4 mb-2">Navigation</h3>
                <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                  <li>Clear and consistent navigation structure</li>
                  <li>Skip navigation links to main content</li>
                  <li>Keyboard navigable menus and interactive elements</li>
                  <li>Logical tab order throughout all pages</li>
                  <li>Focus indicators visible on all interactive elements</li>
                </ul>

                <h3 className="text-lg font-medium mt-4 mb-2">Visual Design</h3>
                <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                  <li>Sufficient color contrast ratios (4.5:1 minimum for text)</li>
                  <li>Text can be resized up to 200% without loss of functionality</li>
                  <li>Information not conveyed by color alone</li>
                  <li>Responsive design that adapts to different screen sizes</li>
                  <li>Clear visual hierarchy with proper heading structure</li>
                </ul>

                <h3 className="text-lg font-medium mt-4 mb-2">Content</h3>
                <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                  <li>Alternative text for all meaningful images</li>
                  <li>Descriptive link text that makes sense out of context</li>
                  <li>Form fields with associated labels</li>
                  <li>Clear error messages and validation feedback</li>
                  <li>Captions and transcripts for video content</li>
                </ul>

                <h3 className="text-lg font-medium mt-4 mb-2">Technical Implementation</h3>
                <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                  <li>Semantic HTML markup</li>
                  <li>ARIA attributes where appropriate</li>
                  <li>Compatible with screen readers (NVDA, JAWS, VoiceOver)</li>
                  <li>Works with browser zoom and text-only zoom</li>
                </ul>
              </section>

              <section className="mb-8" data-testid="section-assistive">
                <h2 className="text-xl font-semibold mb-4">
                  Assistive Technology Compatibility
                </h2>
                <p className="text-gray-700 mb-4">
                  Our website is designed to be compatible with the following assistive
                  technologies:
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                  <li>Screen readers (NVDA, JAWS, VoiceOver, TalkBack)</li>
                  <li>Screen magnification software</li>
                  <li>Speech recognition software</li>
                  <li>Keyboard-only navigation</li>
                  <li>Switch access devices</li>
                </ul>
              </section>

              <section className="mb-8" data-testid="section-known-issues">
                <h2 className="text-xl font-semibold mb-4">Known Limitations</h2>
                <p className="text-gray-700 mb-4">
                  While we strive for full accessibility, we acknowledge some limitations:
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                  <li>
                    Some third-party content or embedded services may not be fully accessible
                  </li>
                  <li>Older PDF documents may not be fully accessible</li>
                  <li>
                    User-generated content (reviews, questions) may not always include
                    alternative text for images
                  </li>
                </ul>
                <p className="text-gray-700">
                  We are actively working to address these limitations and improve accessibility
                  across all areas of our website.
                </p>
              </section>

              <section className="mb-8" data-testid="section-testing">
                <h2 className="text-xl font-semibold mb-4">Testing & Evaluation</h2>
                <p className="text-gray-700 mb-4">
                  We regularly test our website for accessibility using:
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                  <li>Automated testing tools (axe, WAVE, Lighthouse)</li>
                  <li>Manual keyboard testing</li>
                  <li>Screen reader testing</li>
                  <li>User testing with people who have disabilities</li>
                  <li>Regular accessibility audits</li>
                </ul>
              </section>

              <section className="mb-8" data-testid="section-browser-support">
                <h2 className="text-xl font-semibold mb-4">Browser Support</h2>
                <p className="text-gray-700 mb-4">
                  Our website is designed to work with the latest versions of major browsers:
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                  <li>Google Chrome</li>
                  <li>Mozilla Firefox</li>
                  <li>Safari</li>
                  <li>Microsoft Edge</li>
                </ul>
              </section>

              <section className="mb-8" data-testid="section-feedback">
                <h2 className="text-xl font-semibold mb-4">Feedback</h2>
                <p className="text-gray-700 mb-4">
                  We welcome your feedback on the accessibility of our website. If you encounter
                  any accessibility barriers or have suggestions for improvement, please let us
                  know:
                </p>
                <div className="bg-gray-50 rounded-lg p-4 text-gray-700 mb-4">
                  <p className="font-medium">Accessibility Team</p>
                  <p>Email: accessibility@example.com</p>
                  <p>Phone: 1-800-123-4567 (Mon-Fri, 9am-6pm EST)</p>
                  <p>
                    <Link to="/contact" className="text-primary hover:underline">
                      Contact Form
                    </Link>
                  </p>
                </div>
                <p className="text-gray-700">
                  We try to respond to accessibility feedback within 2 business days and aim to
                  resolve issues as quickly as possible.
                </p>
              </section>

              <section className="mb-8" data-testid="section-alternatives">
                <h2 className="text-xl font-semibold mb-4">Alternative Access</h2>
                <p className="text-gray-700">
                  If you are unable to access any content or use any feature on this website due
                  to a disability, please contact us. We will work with you to provide the
                  information you need through an alternative means that is accessible to you.
                </p>
              </section>

              <section className="mb-8" data-testid="section-resources">
                <h2 className="text-xl font-semibold mb-4">Additional Resources</h2>
                <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                  <li>
                    <a
                      href="https://www.w3.org/WAI/standards-guidelines/wcag/"
                      className="text-primary hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Web Content Accessibility Guidelines (WCAG)
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://www.w3.org/WAI/"
                      className="text-primary hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      W3C Web Accessibility Initiative
                    </a>
                  </li>
                </ul>
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
