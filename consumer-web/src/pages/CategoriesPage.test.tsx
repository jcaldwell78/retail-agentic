import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CategoriesPage from './CategoriesPage';

// Mock the Link component to avoid router issues in tests
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    Link: ({ children, to, ...props }: any) => (
      <a href={to} {...props}>
        {children}
      </a>
    ),
  };
});

describe('CategoriesPage', () => {
  it('should render the page title', () => {
    render(
      <MemoryRouter>
        <CategoriesPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Shop by Category')).toBeInTheDocument();
  });

  it('should show loading skeletons initially', () => {
    render(
      <MemoryRouter>
        <CategoriesPage />
      </MemoryRouter>
    );

    // Check for skeleton elements (they use animate-pulse class from shadcn/ui)
    const skeletons = document.querySelectorAll('[class*="animate-pulse"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should display categories after loading', async () => {
    render(
      <MemoryRouter>
        <CategoriesPage />
      </MemoryRouter>
    );

    // Wait for categories to load
    await waitFor(() => {
      expect(screen.getByText('Electronics')).toBeInTheDocument();
    }, { timeout: 1000 });

    // Check for multiple categories
    expect(screen.getByText('Clothing & Fashion')).toBeInTheDocument();
    expect(screen.getByText('Home & Garden')).toBeInTheDocument();
    expect(screen.getByText('Health & Beauty')).toBeInTheDocument();
  });

  it('should display product counts for categories', async () => {
    render(
      <MemoryRouter>
        <CategoriesPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/1,250 products/)).toBeInTheDocument(); // Electronics
    });

    expect(screen.getByText(/3,420 products/)).toBeInTheDocument(); // Clothing
  });

  it('should have correct links to product pages with category filters', async () => {
    render(
      <MemoryRouter>
        <CategoriesPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Electronics')).toBeInTheDocument();
    });

    // Find the link for Electronics category
    const electronicsLinks = screen.getAllByRole('link', { name: /Electronics/i });
    const categoryLink = electronicsLinks.find(link =>
      link.getAttribute('href')?.includes('/products?category=electronics')
    );
    expect(categoryLink).toBeInTheDocument();
  });

  it('should display breadcrumb navigation', () => {
    render(
      <MemoryRouter>
        <CategoriesPage />
      </MemoryRouter>
    );

    expect(screen.getByRole('navigation', { name: /breadcrumb/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /home/i })).toBeInTheDocument();
    expect(screen.getByText('Categories')).toBeInTheDocument();
  });

  it('should display popular searches section', async () => {
    render(
      <MemoryRouter>
        <CategoriesPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Popular Searches')).toBeInTheDocument();
    });

    expect(screen.getByRole('link', { name: /New Arrivals/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Best Sellers/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Sale Items/i })).toBeInTheDocument();
  });

  it('should display help section with contact link', async () => {
    render(
      <MemoryRouter>
        <CategoriesPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Can't find what you're looking for?")).toBeInTheDocument();
    });

    expect(screen.getByRole('link', { name: /contact us for help/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /browse all products/i })).toBeInTheDocument();
  });

  it('should have accessible aria labels for category links', async () => {
    render(
      <MemoryRouter>
        <CategoriesPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Electronics')).toBeInTheDocument();
    });

    const electronicsLink = screen.getByRole('link', {
      name: /View Electronics category with 1,250 products/i
    });
    expect(electronicsLink).toBeInTheDocument();
  });

  it('should display category descriptions', async () => {
    render(
      <MemoryRouter>
        <CategoriesPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Latest gadgets, computers, phones, and accessories')).toBeInTheDocument();
    });

    expect(screen.getByText('Trendy apparel for men, women, and children')).toBeInTheDocument();
    expect(screen.getByText('Everything for your home, furniture, and garden')).toBeInTheDocument();
  });
});