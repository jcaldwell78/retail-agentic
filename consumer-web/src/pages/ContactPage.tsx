import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Clock, Send, CheckCircle } from 'lucide-react';

interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
}

export default function ContactPage() {
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setIsSubmitting(false);
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background py-12 px-4" data-testid="contact-page">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="py-12 px-6 text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2" data-testid="success-title">
                Message Sent!
              </h1>
              <p className="text-gray-700 mb-6">
                Thank you for contacting us. We'll get back to you within 1-2 business days.
              </p>
              <div className="flex justify-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsSubmitted(false);
                    setFormData({ name: '', email: '', subject: '', message: '' });
                  }}
                  data-testid="send-another-btn"
                >
                  Send Another Message
                </Button>
                <Link to="/">
                  <Button data-testid="back-home-btn">Back to Home</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4" data-testid="contact-page">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2 text-center" data-testid="page-title">
          Contact Us
        </h1>
        <p className="text-muted-foreground text-center mb-8">
          We'd love to hear from you. Send us a message and we'll respond as soon as possible.
        </p>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Contact Information */}
          <div className="md:col-span-1 space-y-6" data-testid="contact-info">
            <Card>
              <CardContent className="py-6">
                <h2 className="text-lg font-semibold mb-4">Get in Touch</h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Email</p>
                      <a
                        href="mailto:support@example.com"
                        className="text-sm text-gray-600 hover:text-primary"
                        data-testid="email-link"
                      >
                        support@example.com
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Phone</p>
                      <a
                        href="tel:1-800-123-4567"
                        className="text-sm text-gray-600 hover:text-primary"
                        data-testid="phone-link"
                      >
                        1-800-123-4567
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Address</p>
                      <p className="text-sm text-gray-600">
                        123 Commerce Street
                        <br />
                        Suite 100
                        <br />
                        New York, NY 10001
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Business Hours</p>
                      <p className="text-sm text-gray-600">
                        Mon - Fri: 9:00 AM - 6:00 PM EST
                        <br />
                        Sat - Sun: Closed
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="py-6">
                <h2 className="text-lg font-semibold mb-4">Quick Links</h2>
                <ul className="space-y-2 text-sm">
                  <li>
                    <Link to="/faq" className="text-primary hover:underline" data-testid="faq-link">
                      Frequently Asked Questions
                    </Link>
                  </li>
                  <li>
                    <Link to="/shipping-policy" className="text-primary hover:underline">
                      Shipping Policy
                    </Link>
                  </li>
                  <li>
                    <Link to="/refund-policy" className="text-primary hover:underline">
                      Refund Policy
                    </Link>
                  </li>
                  <li>
                    <Link to="/orders" className="text-primary hover:underline">
                      Track Your Order
                    </Link>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form */}
          <div className="md:col-span-2">
            <Card>
              <CardContent className="py-6">
                <h2 className="text-lg font-semibold mb-4">Send us a Message</h2>
                <form onSubmit={handleSubmit} data-testid="contact-form" noValidate>
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium mb-1">
                        Name <span className="text-red-500">*</span>
                      </label>
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Your name"
                        className={errors.name ? 'border-red-500' : ''}
                        data-testid="name-input"
                      />
                      {errors.name && (
                        <p className="text-red-500 text-sm mt-1" data-testid="name-error">
                          {errors.name}
                        </p>
                      )}
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium mb-1">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="your@email.com"
                        className={errors.email ? 'border-red-500' : ''}
                        data-testid="email-input"
                      />
                      {errors.email && (
                        <p className="text-red-500 text-sm mt-1" data-testid="email-error">
                          {errors.email}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="mb-4">
                    <label htmlFor="subject" className="block text-sm font-medium mb-1">
                      Subject <span className="text-red-500">*</span>
                    </label>
                    <Input
                      id="subject"
                      name="subject"
                      type="text"
                      value={formData.subject}
                      onChange={handleChange}
                      placeholder="How can we help?"
                      className={errors.subject ? 'border-red-500' : ''}
                      data-testid="subject-input"
                    />
                    {errors.subject && (
                      <p className="text-red-500 text-sm mt-1" data-testid="subject-error">
                        {errors.subject}
                      </p>
                    )}
                  </div>
                  <div className="mb-6">
                    <label htmlFor="message" className="block text-sm font-medium mb-1">
                      Message <span className="text-red-500">*</span>
                    </label>
                    <Textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Tell us more about your inquiry..."
                      rows={6}
                      className={errors.message ? 'border-red-500' : ''}
                      data-testid="message-input"
                    />
                    {errors.message && (
                      <p className="text-red-500 text-sm mt-1" data-testid="message-error">
                        {errors.message}
                      </p>
                    )}
                  </div>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full md:w-auto"
                    data-testid="submit-btn"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent mr-2" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link
            to="/"
            className="text-primary hover:underline"
            data-testid="back-home-link"
          >
            &larr; Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
