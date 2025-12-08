import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronUp, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQCategory {
  id: string;
  title: string;
  items: FAQItem[];
}

const faqData: FAQCategory[] = [
  {
    id: 'orders',
    title: 'Orders & Shipping',
    items: [
      {
        question: 'How can I track my order?',
        answer:
          'Once your order ships, you will receive an email with a tracking number. You can also track your order by logging into your account and viewing your order history. Click on the specific order to see real-time tracking information.',
      },
      {
        question: 'How long does shipping take?',
        answer:
          'Standard shipping typically takes 5-7 business days. Express shipping takes 2-3 business days. Next-day delivery is available for orders placed before 2 PM EST. Shipping times may vary during peak seasons and holidays.',
      },
      {
        question: 'Do you ship internationally?',
        answer:
          'Yes, we ship to over 50 countries worldwide. International shipping times vary by destination, typically 7-21 business days. Additional customs duties and taxes may apply depending on your country.',
      },
      {
        question: 'Can I change or cancel my order?',
        answer:
          'You can modify or cancel your order within 1 hour of placing it. After that, the order enters processing and cannot be changed. Please contact our customer support immediately if you need to make changes.',
      },
      {
        question: 'What if my package is lost or damaged?',
        answer:
          'If your package is lost or arrives damaged, please contact us within 48 hours of the expected delivery date. We will work with the carrier to locate your package or send a replacement at no additional cost.',
      },
    ],
  },
  {
    id: 'returns',
    title: 'Returns & Refunds',
    items: [
      {
        question: 'What is your return policy?',
        answer:
          'We offer a 30-day return policy for most items. Products must be unused, in original packaging, and with all tags attached. Some items like personalized products, underwear, and swimwear are final sale.',
      },
      {
        question: 'How do I return an item?',
        answer:
          'To initiate a return, log into your account, go to your order history, select the item you want to return, and click "Start Return." You will receive a prepaid shipping label via email. Drop off the package at any authorized shipping location.',
      },
      {
        question: 'How long does it take to receive my refund?',
        answer:
          'Once we receive your return, we process it within 3-5 business days. Refunds are issued to your original payment method and may take an additional 5-10 business days to appear on your statement, depending on your bank.',
      },
      {
        question: 'Can I exchange an item instead of returning it?',
        answer:
          'Yes, you can exchange items for a different size or color. When initiating your return, select "Exchange" instead of "Refund" and choose your preferred replacement. If there is a price difference, you will be charged or refunded accordingly.',
      },
      {
        question: 'Do I have to pay for return shipping?',
        answer:
          'Returns within the US are free with our prepaid shipping labels. For international returns, customers are responsible for return shipping costs unless the item arrived damaged or defective.',
      },
    ],
  },
  {
    id: 'payment',
    title: 'Payment & Pricing',
    items: [
      {
        question: 'What payment methods do you accept?',
        answer:
          'We accept all major credit cards (Visa, MasterCard, American Express, Discover), PayPal, Apple Pay, Google Pay, and Shop Pay. We also offer buy-now-pay-later options through Klarna and Afterpay.',
      },
      {
        question: 'Is my payment information secure?',
        answer:
          'Yes, we use industry-standard SSL encryption and are PCI DSS compliant. Your payment information is never stored on our servers. We use trusted payment processors like Stripe to handle all transactions securely.',
      },
      {
        question: 'Why was my payment declined?',
        answer:
          'Payments can be declined for various reasons including insufficient funds, incorrect card details, or security holds. Please verify your information and try again. If the problem persists, contact your bank or try a different payment method.',
      },
      {
        question: 'Do you offer price matching?',
        answer:
          'We offer price matching within 14 days of purchase if you find the same item at a lower price from an authorized retailer. Contact customer support with proof of the lower price to request an adjustment.',
      },
      {
        question: 'Are there any hidden fees?',
        answer:
          'No, we believe in transparent pricing. The price you see is the price you pay, plus applicable taxes and shipping. Any additional costs are clearly displayed before checkout.',
      },
    ],
  },
  {
    id: 'account',
    title: 'Account & Security',
    items: [
      {
        question: 'How do I create an account?',
        answer:
          'Click "Sign Up" in the top right corner of our website. You can register using your email address or sign in with Google or Facebook for faster access. Creating an account lets you track orders, save favorites, and checkout faster.',
      },
      {
        question: 'I forgot my password. How do I reset it?',
        answer:
          'Click "Sign In" and then "Forgot Password." Enter your email address and we will send you a link to reset your password. The link expires after 24 hours for security. Check your spam folder if you do not see the email.',
      },
      {
        question: 'How do I update my account information?',
        answer:
          'Log into your account and click on "Account Settings." From there, you can update your name, email, password, shipping addresses, and payment methods. Changes are saved automatically.',
      },
      {
        question: 'How do I delete my account?',
        answer:
          'To delete your account, go to Account Settings and click "Delete Account" at the bottom of the page. This action is permanent and will remove all your order history and saved information. You can also contact support to request deletion.',
      },
      {
        question: 'Is my personal information safe?',
        answer:
          'We take data privacy seriously. Your information is encrypted and stored securely. We never sell your data to third parties. Please review our Privacy Policy for complete details on how we protect your information.',
      },
    ],
  },
  {
    id: 'products',
    title: 'Products & Inventory',
    items: [
      {
        question: 'How do I know if an item is in stock?',
        answer:
          'Product availability is shown on each product page. If an item is out of stock, you can sign up for restock notifications by clicking "Notify Me When Available." We will email you as soon as the item is back.',
      },
      {
        question: 'Are your product images accurate?',
        answer:
          'We strive to display products as accurately as possible. However, colors may vary slightly due to monitor settings. Product descriptions include detailed specifications and measurements to help you make informed decisions.',
      },
      {
        question: 'Do you offer gift wrapping?',
        answer:
          'Yes, we offer gift wrapping for a small additional fee. During checkout, select the gift wrap option and add a personalized message. The item will arrive beautifully wrapped with no price information included.',
      },
      {
        question: 'How do I find my size?',
        answer:
          'Each product page includes a size guide with detailed measurements. We recommend measuring yourself and comparing to our charts. If you are between sizes, we generally recommend sizing up for comfort.',
      },
      {
        question: 'Can I request a product that is not on your website?',
        answer:
          'We welcome product suggestions! Contact our customer support team with your request. While we cannot guarantee availability, we regularly review customer requests when planning new inventory.',
      },
    ],
  },
  {
    id: 'support',
    title: 'Customer Support',
    items: [
      {
        question: 'How can I contact customer support?',
        answer:
          'You can reach us via email at support@example.com, by phone at 1-800-123-4567 (Mon-Fri, 9 AM - 6 PM EST), or through live chat on our website. We typically respond to emails within 24 hours.',
      },
      {
        question: 'What are your customer service hours?',
        answer:
          'Our customer service team is available Monday through Friday, 9 AM to 6 PM EST. During holidays, hours may vary. For urgent issues outside business hours, please email us and we will respond as soon as possible.',
      },
      {
        question: 'Do you have a loyalty program?',
        answer:
          'Yes! Our rewards program lets you earn points on every purchase. Points can be redeemed for discounts on future orders. Sign up for free in your account settings to start earning rewards.',
      },
      {
        question: 'How do I unsubscribe from marketing emails?',
        answer:
          'You can unsubscribe by clicking the "Unsubscribe" link at the bottom of any marketing email. You can also manage your email preferences in your account settings. Note that you will still receive transactional emails about your orders.',
      },
      {
        question: 'Do you have a physical store?',
        answer:
          'We are primarily an online retailer, but we do have select pop-up locations throughout the year. Follow us on social media or subscribe to our newsletter to stay informed about upcoming events and locations.',
      },
    ],
  },
];

function FAQAccordionItem({
  item,
  isOpen,
  onToggle,
}: {
  item: FAQItem;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b border-gray-200 last:border-b-0" data-testid="faq-item">
      <button
        className="w-full flex items-center justify-between py-4 text-left hover:bg-gray-50 transition-colors"
        onClick={onToggle}
        aria-expanded={isOpen}
        data-testid="faq-question-button"
      >
        <span className="font-medium text-gray-900 pr-4">{item.question}</span>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 text-gray-500 flex-shrink-0" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-500 flex-shrink-0" />
        )}
      </button>
      {isOpen && (
        <div className="pb-4 text-gray-700" data-testid="faq-answer">
          {item.answer}
        </div>
      )}
    </div>
  );
}

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  const toggleItem = (key: string) => {
    setOpenItems((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const filteredData = searchQuery.trim()
    ? faqData
        .map((category) => ({
          ...category,
          items: category.items.filter(
            (item) =>
              item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
              item.answer.toLowerCase().includes(searchQuery.toLowerCase())
          ),
        }))
        .filter((category) => category.items.length > 0)
    : faqData;

  const totalResults = filteredData.reduce((sum, cat) => sum + cat.items.length, 0);

  return (
    <div className="min-h-screen bg-background py-12 px-4" data-testid="faq-page">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent className="py-8 px-6 md:px-12">
            <h1 className="text-3xl font-bold mb-2" data-testid="page-title">
              Frequently Asked Questions
            </h1>
            <p className="text-muted-foreground mb-8">
              Find answers to common questions about orders, shipping, returns, and more.
            </p>

            <div className="relative mb-8" data-testid="search-section">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search for answers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="search-input"
              />
              {searchQuery && (
                <p className="mt-2 text-sm text-gray-500" data-testid="search-results-count">
                  {totalResults} result{totalResults !== 1 ? 's' : ''} found
                </p>
              )}
            </div>

            {filteredData.length === 0 ? (
              <div className="text-center py-12" data-testid="no-results">
                <p className="text-gray-500 mb-4">No results found for "{searchQuery}"</p>
                <p className="text-sm text-gray-400">
                  Try different keywords or{' '}
                  <Link to="/contact" className="text-primary hover:underline">
                    contact support
                  </Link>{' '}
                  for help.
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                {filteredData.map((category) => (
                  <section key={category.id} data-testid={`section-${category.id}`}>
                    <h2 className="text-xl font-semibold mb-4">{category.title}</h2>
                    <div className="bg-gray-50 rounded-lg px-4">
                      {category.items.map((item, index) => (
                        <FAQAccordionItem
                          key={`${category.id}-${index}`}
                          item={item}
                          isOpen={openItems.has(`${category.id}-${index}`)}
                          onToggle={() => toggleItem(`${category.id}-${index}`)}
                        />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            )}

            <div className="mt-12 pt-8 border-t" data-testid="contact-section">
              <h2 className="text-xl font-semibold mb-4">Still have questions?</h2>
              <p className="text-gray-700 mb-4">
                Can't find what you're looking for? Our support team is here to help.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  to="/contact"
                  className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                  data-testid="contact-link"
                >
                  Contact Support
                </Link>
                <a
                  href="mailto:support@example.com"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  data-testid="email-link"
                >
                  Email Us
                </a>
              </div>
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
