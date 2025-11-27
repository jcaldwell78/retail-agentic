import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import NotFoundPage from './NotFoundPage';

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('NotFoundPage', () => {
  it('should render the not found page', () => {
    renderWithRouter(<NotFoundPage />);
    expect(screen.getByText('404')).toBeInTheDocument();
  });

  it('should display 404 error code', () => {
    renderWithRouter(<NotFoundPage />);
    expect(screen.getByRole('heading', { name: '404' })).toBeInTheDocument();
  });

  it('should display Page not found description', () => {
    renderWithRouter(<NotFoundPage />);
    expect(screen.getByText('Page not found')).toBeInTheDocument();
  });

  it('should display error message', () => {
    renderWithRouter(<NotFoundPage />);
    expect(screen.getByText("The page you're looking for doesn't exist or has been moved.")).toBeInTheDocument();
  });

  it('should display Back to Home button', () => {
    renderWithRouter(<NotFoundPage />);
    const button = screen.getByRole('button', { name: 'Back to Home' });
    expect(button).toBeInTheDocument();
  });

  it('should link Back to Home button to home page', () => {
    renderWithRouter(<NotFoundPage />);
    const link = screen.getByRole('button', { name: 'Back to Home' }).closest('a');
    expect(link).toHaveAttribute('href', '/');
  });

  it('should be accessible with proper heading structure', () => {
    renderWithRouter(<NotFoundPage />);
    expect(screen.getByRole('heading', { name: '404' })).toBeInTheDocument();
  });

  it('should render within a card component', () => {
    const { container } = renderWithRouter(<NotFoundPage />);
    expect(container.querySelector('.max-w-md')).toBeInTheDocument();
  });
});
