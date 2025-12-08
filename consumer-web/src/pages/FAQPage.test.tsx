import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import FAQPage from './FAQPage';

const renderPage = () => {
  return render(
    <MemoryRouter>
      <FAQPage />
    </MemoryRouter>
  );
};

describe('FAQPage', () => {
  it('should render the page', () => {
    renderPage();
    expect(screen.getByTestId('faq-page')).toBeInTheDocument();
  });

  it('should display the page title', () => {
    renderPage();
    expect(screen.getByTestId('page-title')).toHaveTextContent('Frequently Asked Questions');
  });

  it('should display the search section', () => {
    renderPage();
    expect(screen.getByTestId('search-section')).toBeInTheDocument();
    expect(screen.getByTestId('search-input')).toBeInTheDocument();
  });

  it('should display all FAQ categories', () => {
    renderPage();
    expect(screen.getByTestId('section-orders')).toBeInTheDocument();
    expect(screen.getByTestId('section-returns')).toBeInTheDocument();
    expect(screen.getByTestId('section-payment')).toBeInTheDocument();
    expect(screen.getByTestId('section-account')).toBeInTheDocument();
    expect(screen.getByTestId('section-products')).toBeInTheDocument();
    expect(screen.getByTestId('section-support')).toBeInTheDocument();
  });

  it('should display category titles', () => {
    renderPage();
    expect(screen.getByText('Orders & Shipping')).toBeInTheDocument();
    expect(screen.getByText('Returns & Refunds')).toBeInTheDocument();
    expect(screen.getByText('Payment & Pricing')).toBeInTheDocument();
    expect(screen.getByText('Account & Security')).toBeInTheDocument();
    expect(screen.getByText('Products & Inventory')).toBeInTheDocument();
    expect(screen.getByText('Customer Support')).toBeInTheDocument();
  });

  it('should display FAQ items with questions', () => {
    renderPage();
    const faqItems = screen.getAllByTestId('faq-item');
    expect(faqItems.length).toBeGreaterThan(0);
    expect(screen.getByText('How can I track my order?')).toBeInTheDocument();
    expect(screen.getByText('What is your return policy?')).toBeInTheDocument();
  });

  it('should expand FAQ item when clicked', () => {
    renderPage();
    const firstQuestion = screen.getByText('How can I track my order?');
    const questionButton = firstQuestion.closest('button');

    expect(screen.queryByText(/tracking number/)).not.toBeInTheDocument();

    fireEvent.click(questionButton!);

    expect(screen.getByText(/tracking number/)).toBeInTheDocument();
  });

  it('should collapse FAQ item when clicked again', () => {
    renderPage();
    const firstQuestion = screen.getByText('How can I track my order?');
    const questionButton = firstQuestion.closest('button');

    fireEvent.click(questionButton!);
    expect(screen.getByText(/tracking number/)).toBeInTheDocument();

    fireEvent.click(questionButton!);
    expect(screen.queryByText(/tracking number/)).not.toBeInTheDocument();
  });

  it('should allow multiple FAQ items to be open simultaneously', () => {
    renderPage();
    const firstQuestion = screen.getByText('How can I track my order?');
    const secondQuestion = screen.getByText('How long does shipping take?');

    fireEvent.click(firstQuestion.closest('button')!);
    fireEvent.click(secondQuestion.closest('button')!);

    expect(screen.getByText(/tracking number/)).toBeInTheDocument();
    expect(screen.getByText(/business days/)).toBeInTheDocument();
  });

  it('should filter FAQ items based on search query', () => {
    renderPage();
    const searchInput = screen.getByTestId('search-input');

    fireEvent.change(searchInput, { target: { value: 'password' } });

    expect(screen.getByText('I forgot my password. How do I reset it?')).toBeInTheDocument();
    expect(screen.queryByText('How can I track my order?')).not.toBeInTheDocument();
  });

  it('should display results count when searching', () => {
    renderPage();
    const searchInput = screen.getByTestId('search-input');

    fireEvent.change(searchInput, { target: { value: 'shipping' } });

    expect(screen.getByTestId('search-results-count')).toBeInTheDocument();
  });

  it('should display no results message when search has no matches', () => {
    renderPage();
    const searchInput = screen.getByTestId('search-input');

    fireEvent.change(searchInput, { target: { value: 'xyznonexistent123' } });

    expect(screen.getByTestId('no-results')).toBeInTheDocument();
    expect(screen.getByText(/No results found/)).toBeInTheDocument();
  });

  it('should search in both questions and answers', () => {
    renderPage();
    const searchInput = screen.getByTestId('search-input');

    fireEvent.change(searchInput, { target: { value: 'Klarna' } });

    expect(screen.getByText('What payment methods do you accept?')).toBeInTheDocument();
  });

  it('should be case insensitive when searching', () => {
    renderPage();
    const searchInput = screen.getByTestId('search-input');

    fireEvent.change(searchInput, { target: { value: 'PASSWORD' } });

    expect(screen.getByText('I forgot my password. How do I reset it?')).toBeInTheDocument();
  });

  it('should clear search and show all items', () => {
    renderPage();
    const searchInput = screen.getByTestId('search-input');

    fireEvent.change(searchInput, { target: { value: 'password' } });
    expect(screen.queryByText('How can I track my order?')).not.toBeInTheDocument();

    fireEvent.change(searchInput, { target: { value: '' } });
    expect(screen.getByText('How can I track my order?')).toBeInTheDocument();
  });

  it('should display contact section', () => {
    renderPage();
    expect(screen.getByTestId('contact-section')).toBeInTheDocument();
    expect(screen.getByText('Still have questions?')).toBeInTheDocument();
  });

  it('should display contact support link', () => {
    renderPage();
    const contactLink = screen.getByTestId('contact-link');
    expect(contactLink).toBeInTheDocument();
    expect(contactLink).toHaveAttribute('href', '/contact');
  });

  it('should display email link', () => {
    renderPage();
    const emailLink = screen.getByTestId('email-link');
    expect(emailLink).toBeInTheDocument();
    expect(emailLink).toHaveAttribute('href', 'mailto:support@example.com');
  });

  it('should display back to home link', () => {
    renderPage();
    const link = screen.getByTestId('back-home-link');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/');
  });

  it('should have accessible accordion buttons', () => {
    renderPage();
    const questionButtons = screen.getAllByTestId('faq-question-button');
    expect(questionButtons.length).toBeGreaterThan(0);
    expect(questionButtons[0]).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(questionButtons[0]);
    expect(questionButtons[0]).toHaveAttribute('aria-expanded', 'true');
  });

  it('should display FAQ answer content when expanded', () => {
    renderPage();
    const firstQuestion = screen.getByText('How can I track my order?');
    const questionButton = firstQuestion.closest('button');

    fireEvent.click(questionButton!);

    const answer = screen.getByTestId('faq-answer');
    expect(answer).toBeInTheDocument();
    expect(answer).toHaveTextContent(/tracking number/);
  });
});
