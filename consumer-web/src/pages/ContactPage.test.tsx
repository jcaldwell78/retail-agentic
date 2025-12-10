import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ContactPage from './ContactPage';

const renderPage = () => {
  return render(
    <MemoryRouter>
      <ContactPage />
    </MemoryRouter>
  );
};

describe('ContactPage', () => {
  it('should render the page', () => {
    renderPage();
    expect(screen.getByTestId('contact-page')).toBeInTheDocument();
  });

  it('should display the page title', () => {
    renderPage();
    expect(screen.getByTestId('page-title')).toHaveTextContent('Contact Us');
  });

  it('should display contact information section', () => {
    renderPage();
    expect(screen.getByTestId('contact-info')).toBeInTheDocument();
    expect(screen.getByText('Get in Touch')).toBeInTheDocument();
  });

  it('should display email link', () => {
    renderPage();
    const emailLink = screen.getByTestId('email-link');
    expect(emailLink).toBeInTheDocument();
    expect(emailLink).toHaveAttribute('href', 'mailto:support@example.com');
  });

  it('should display phone link', () => {
    renderPage();
    const phoneLink = screen.getByTestId('phone-link');
    expect(phoneLink).toBeInTheDocument();
    expect(phoneLink).toHaveAttribute('href', 'tel:1-800-123-4567');
  });

  it('should display business hours', () => {
    renderPage();
    expect(screen.getByText('Business Hours')).toBeInTheDocument();
    expect(screen.getByText(/Mon - Fri: 9:00 AM - 6:00 PM EST/)).toBeInTheDocument();
  });

  it('should display contact form', () => {
    renderPage();
    expect(screen.getByTestId('contact-form')).toBeInTheDocument();
    expect(screen.getByTestId('name-input')).toBeInTheDocument();
    expect(screen.getByTestId('email-input')).toBeInTheDocument();
    expect(screen.getByTestId('subject-input')).toBeInTheDocument();
    expect(screen.getByTestId('message-input')).toBeInTheDocument();
  });

  it('should display submit button', () => {
    renderPage();
    const submitBtn = screen.getByTestId('submit-btn');
    expect(submitBtn).toBeInTheDocument();
    expect(submitBtn).toHaveTextContent('Send Message');
  });

  it('should display quick links', () => {
    renderPage();
    expect(screen.getByText('Quick Links')).toBeInTheDocument();
    expect(screen.getByTestId('faq-link')).toHaveAttribute('href', '/faq');
  });

  it('should display back to home link', () => {
    renderPage();
    const link = screen.getByTestId('back-home-link');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/');
  });

  describe('Form Validation', () => {
    it('should show error when name is empty', async () => {
      renderPage();

      fireEvent.click(screen.getByTestId('submit-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('name-error')).toHaveTextContent('Name is required');
      });
    });

    it('should show error when email is empty', async () => {
      renderPage();

      fireEvent.change(screen.getByTestId('name-input'), { target: { value: 'John' } });
      fireEvent.click(screen.getByTestId('submit-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('email-error')).toHaveTextContent('Email is required');
      });
    });

    it('should show error when email is invalid', async () => {
      renderPage();

      fireEvent.change(screen.getByTestId('name-input'), { target: { value: 'John' } });
      fireEvent.change(screen.getByTestId('email-input'), { target: { value: 'invalid-email' } });
      fireEvent.change(screen.getByTestId('subject-input'), { target: { value: 'Test' } });
      fireEvent.change(screen.getByTestId('message-input'), { target: { value: 'Test message that is long enough' } });
      fireEvent.click(screen.getByTestId('submit-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('email-error')).toHaveTextContent('Please enter a valid email address');
      }, { timeout: 2000 });
    });

    it('should show error when subject is empty', async () => {
      renderPage();

      fireEvent.change(screen.getByTestId('name-input'), { target: { value: 'John' } });
      fireEvent.change(screen.getByTestId('email-input'), { target: { value: 'john@example.com' } });
      fireEvent.click(screen.getByTestId('submit-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('subject-error')).toHaveTextContent('Subject is required');
      });
    });

    it('should show error when message is empty', async () => {
      renderPage();

      fireEvent.change(screen.getByTestId('name-input'), { target: { value: 'John' } });
      fireEvent.change(screen.getByTestId('email-input'), { target: { value: 'john@example.com' } });
      fireEvent.change(screen.getByTestId('subject-input'), { target: { value: 'Help' } });
      fireEvent.click(screen.getByTestId('submit-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('message-error')).toHaveTextContent('Message is required');
      });
    });

    it('should show error when message is too short', async () => {
      renderPage();

      fireEvent.change(screen.getByTestId('name-input'), { target: { value: 'John' } });
      fireEvent.change(screen.getByTestId('email-input'), { target: { value: 'john@example.com' } });
      fireEvent.change(screen.getByTestId('subject-input'), { target: { value: 'Help' } });
      fireEvent.change(screen.getByTestId('message-input'), { target: { value: 'Hi' } });
      fireEvent.click(screen.getByTestId('submit-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('message-error')).toHaveTextContent('Message must be at least 10 characters');
      });
    });

    it('should clear error when field is corrected', async () => {
      renderPage();

      fireEvent.click(screen.getByTestId('submit-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('name-error')).toBeInTheDocument();
      });

      fireEvent.change(screen.getByTestId('name-input'), { target: { value: 'John' } });

      await waitFor(() => {
        expect(screen.queryByTestId('name-error')).not.toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('should submit successfully with valid data', async () => {
      renderPage();

      fireEvent.change(screen.getByTestId('name-input'), { target: { value: 'John Doe' } });
      fireEvent.change(screen.getByTestId('email-input'), { target: { value: 'john@example.com' } });
      fireEvent.change(screen.getByTestId('subject-input'), { target: { value: 'Order Question' } });
      fireEvent.change(screen.getByTestId('message-input'), { target: { value: 'I have a question about my order #12345.' } });

      fireEvent.click(screen.getByTestId('submit-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('success-title')).toHaveTextContent('Message Sent!');
      });
    });

    it('should show loading state during submission', async () => {
      renderPage();

      fireEvent.change(screen.getByTestId('name-input'), { target: { value: 'John Doe' } });
      fireEvent.change(screen.getByTestId('email-input'), { target: { value: 'john@example.com' } });
      fireEvent.change(screen.getByTestId('subject-input'), { target: { value: 'Order Question' } });
      fireEvent.change(screen.getByTestId('message-input'), { target: { value: 'I have a question about my order #12345.' } });

      fireEvent.click(screen.getByTestId('submit-btn'));

      expect(screen.getByTestId('submit-btn')).toHaveTextContent('Sending...');
      expect(screen.getByTestId('submit-btn')).toBeDisabled();
    });

    it('should allow sending another message after success', async () => {
      renderPage();

      fireEvent.change(screen.getByTestId('name-input'), { target: { value: 'John Doe' } });
      fireEvent.change(screen.getByTestId('email-input'), { target: { value: 'john@example.com' } });
      fireEvent.change(screen.getByTestId('subject-input'), { target: { value: 'Order Question' } });
      fireEvent.change(screen.getByTestId('message-input'), { target: { value: 'I have a question about my order #12345.' } });

      fireEvent.click(screen.getByTestId('submit-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('send-another-btn')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('send-another-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('contact-form')).toBeInTheDocument();
        expect(screen.getByTestId('name-input')).toHaveValue('');
      });
    });
  });
});
