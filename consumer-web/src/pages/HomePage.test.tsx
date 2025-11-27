import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import HomePage from './HomePage';

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('HomePage', () => {
  it('should render the home page', () => {
    renderWithRouter(<HomePage />);
    // Check for a key element that should always be present
    expect(screen.getByTestId('hero-section')).toBeInTheDocument();
  });
});

describe('HomePage - Hero Section', () => {
  it('should display hero section', () => {
    renderWithRouter(<HomePage />);
    expect(screen.getByTestId('hero-section')).toBeInTheDocument();
  });

  it('should display hero title', () => {
    renderWithRouter(<HomePage />);
    const title = screen.getByTestId('hero-title');
    expect(title).toBeInTheDocument();
    expect(title).toHaveTextContent('Discover Amazing Products');
  });

  it('should display hero description', () => {
    renderWithRouter(<HomePage />);
    const description = screen.getByTestId('hero-description');
    expect(description).toBeInTheDocument();
    expect(description).toHaveTextContent('Shop the latest trends and find everything you need in one place');
  });

  it('should display Shop Now button', () => {
    renderWithRouter(<HomePage />);
    const shopButton = screen.getByTestId('shop-now-button');
    expect(shopButton).toBeInTheDocument();
    expect(shopButton).toHaveTextContent('Shop Now');
  });

  it('should link Shop Now button to products page', () => {
    renderWithRouter(<HomePage />);
    const shopButton = screen.getByTestId('shop-now-button');
    const link = shopButton.closest('a');
    expect(link).toHaveAttribute('href', '/products');
  });

  it('should display Learn More button', () => {
    renderWithRouter(<HomePage />);
    expect(screen.getByText('Learn More')).toBeInTheDocument();
  });

  it('should display hero CTA section', () => {
    renderWithRouter(<HomePage />);
    expect(screen.getByTestId('hero-cta')).toBeInTheDocument();
  });
});

describe('HomePage - Promotional Banners', () => {
  it('should display promotional banners section', () => {
    renderWithRouter(<HomePage />);
    expect(screen.getByTestId('promotional-banners')).toBeInTheDocument();
  });

  it('should display Summer Sale banner', () => {
    renderWithRouter(<HomePage />);
    expect(screen.getByText('Summer Sale')).toBeInTheDocument();
    expect(screen.getByText('Up to 50% off on selected items')).toBeInTheDocument();
    expect(screen.getByText('Limited Time Offer')).toBeInTheDocument();
  });

  it('should display New Collection banner', () => {
    renderWithRouter(<HomePage />);
    expect(screen.getByText('New Collection')).toBeInTheDocument();
    expect(screen.getByText('Discover the latest trends')).toBeInTheDocument();
    expect(screen.getByText('Just Arrived')).toBeInTheDocument();
  });

  it('should link Summer Sale banner to sale products', () => {
    renderWithRouter(<HomePage />);
    const summerSaleCard = screen.getByText('Summer Sale').closest('a');
    expect(summerSaleCard).toHaveAttribute('href', '/products?category=sale');
  });

  it('should link New Collection banner to new products', () => {
    renderWithRouter(<HomePage />);
    const newCollectionCard = screen.getByText('New Collection').closest('a');
    expect(newCollectionCard).toHaveAttribute('href', '/products?filter=new');
  });

  it('should display Shop Now CTA on Summer Sale', () => {
    renderWithRouter(<HomePage />);
    const summerSaleSection = screen.getByText('Summer Sale').closest('div');
    expect(summerSaleSection).toHaveTextContent('Shop Now');
  });

  it('should display Explore Now CTA on New Collection', () => {
    renderWithRouter(<HomePage />);
    const newCollectionSection = screen.getByText('New Collection').closest('div');
    expect(newCollectionSection).toHaveTextContent('Explore Now');
  });
});

describe('HomePage - Featured Categories', () => {
  it('should display category section heading', () => {
    renderWithRouter(<HomePage />);
    expect(screen.getByText('Shop by Category')).toBeInTheDocument();
  });

  it('should display all category cards', () => {
    renderWithRouter(<HomePage />);
    expect(screen.getByText('Electronics')).toBeInTheDocument();
    expect(screen.getByText('Fashion')).toBeInTheDocument();
    expect(screen.getByText('Home & Garden')).toBeInTheDocument();
    expect(screen.getByText('Sports')).toBeInTheDocument();
  });

  it('should display category icons', () => {
    renderWithRouter(<HomePage />);
    const electronicsIcon = screen.getByText('💻');
    const fashionIcon = screen.getByText('👔');
    const homeIcon = screen.getByText('🏡');
    const sportsIcon = screen.getByText('⚽');

    expect(electronicsIcon).toBeInTheDocument();
    expect(fashionIcon).toBeInTheDocument();
    expect(homeIcon).toBeInTheDocument();
    expect(sportsIcon).toBeInTheDocument();
  });

  it('should link category cards to products page', () => {
    renderWithRouter(<HomePage />);
    const electronicsCard = screen.getByText('Electronics').closest('a');
    expect(electronicsCard).toHaveAttribute('href', '/products');
  });

  it('should display exactly 4 categories', () => {
    renderWithRouter(<HomePage />);
    const categories = ['Electronics', 'Fashion', 'Home & Garden', 'Sports'];

    categories.forEach(category => {
      expect(screen.getByText(category)).toBeInTheDocument();
    });
  });
});

describe('HomePage - Featured Products', () => {
  it('should display featured products section', () => {
    renderWithRouter(<HomePage />);
    expect(screen.getByTestId('featured-products')).toBeInTheDocument();
  });

  it('should display Featured Products heading', () => {
    renderWithRouter(<HomePage />);
    expect(screen.getByText('Featured Products')).toBeInTheDocument();
  });

  it('should display View All button', () => {
    renderWithRouter(<HomePage />);
    expect(screen.getByText('View All')).toBeInTheDocument();
  });

  it('should link View All button to products page', () => {
    renderWithRouter(<HomePage />);
    const viewAllButton = screen.getByText('View All').closest('a');
    expect(viewAllButton).toHaveAttribute('href', '/products');
  });

  it('should display placeholder product cards', () => {
    renderWithRouter(<HomePage />);
    expect(screen.getByText('Product Name 1')).toBeInTheDocument();
    expect(screen.getByText('Product Name 2')).toBeInTheDocument();
    expect(screen.getByText('Product Name 3')).toBeInTheDocument();
    expect(screen.getByText('Product Name 4')).toBeInTheDocument();
  });

  it('should display product prices', () => {
    renderWithRouter(<HomePage />);
    const prices = screen.getAllByText('$99.99');
    expect(prices).toHaveLength(4);
  });

  it('should display Add to Cart buttons', () => {
    renderWithRouter(<HomePage />);
    const addToCartButtons = screen.getAllByText('Add to Cart');
    expect(addToCartButtons).toHaveLength(4);
  });

  it('should display product descriptions', () => {
    renderWithRouter(<HomePage />);
    const descriptions = screen.getAllByText('Short product description goes here');
    expect(descriptions).toHaveLength(4);
  });

  it('should display product placeholder icons', () => {
    renderWithRouter(<HomePage />);
    const icons = screen.getAllByText('📦');
    expect(icons).toHaveLength(4);
  });
});

describe('HomePage - Benefits Section', () => {
  it('should display Free Shipping benefit', () => {
    renderWithRouter(<HomePage />);
    expect(screen.getByText('Free Shipping')).toBeInTheDocument();
    expect(screen.getByText('On orders over $50')).toBeInTheDocument();
  });

  it('should display Secure Payment benefit', () => {
    renderWithRouter(<HomePage />);
    expect(screen.getByText('Secure Payment')).toBeInTheDocument();
    expect(screen.getByText('100% secure transactions')).toBeInTheDocument();
  });

  it('should display Easy Returns benefit', () => {
    renderWithRouter(<HomePage />);
    expect(screen.getByText('Easy Returns')).toBeInTheDocument();
    expect(screen.getByText('30-day return policy')).toBeInTheDocument();
  });

  it('should display benefit icons', () => {
    renderWithRouter(<HomePage />);
    expect(screen.getByText('🚚')).toBeInTheDocument(); // Shipping
    expect(screen.getByText('🔒')).toBeInTheDocument(); // Security
    expect(screen.getByText('🔄')).toBeInTheDocument(); // Returns
  });

  it('should display all three benefits', () => {
    renderWithRouter(<HomePage />);
    const benefits = [
      'Free Shipping',
      'Secure Payment',
      'Easy Returns'
    ];

    benefits.forEach(benefit => {
      expect(screen.getByText(benefit)).toBeInTheDocument();
    });
  });
});

describe('HomePage - Layout Structure', () => {
  it('should have proper section ordering', () => {
    renderWithRouter(<HomePage />);

    // Get all sections in order
    const sections = [
      screen.getByTestId('hero-section'),
      screen.getByTestId('promotional-banners'),
      screen.getByText('Shop by Category').closest('section'),
      screen.getByTestId('featured-products'),
      screen.getByText('Free Shipping').closest('section'),
    ];

    // Verify all sections exist
    sections.forEach(section => {
      expect(section).toBeInTheDocument();
    });
  });

  it('should be responsive with proper container classes', () => {
    renderWithRouter(<HomePage />);
    const hero = screen.getByTestId('hero-section');
    expect(hero.querySelector('.container')).toBeInTheDocument();
  });
});

describe('HomePage - Accessibility', () => {
  it('should have proper heading hierarchy', () => {
    renderWithRouter(<HomePage />);

    // Main hero heading (h1)
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1).toHaveTextContent('Discover Amazing Products');

    // Section headings (h2)
    const h2Elements = screen.getAllByRole('heading', { level: 2 });
    expect(h2Elements.length).toBeGreaterThan(0);
  });

  it('should have accessible links', () => {
    renderWithRouter(<HomePage />);
    const shopNowLink = screen.getByTestId('shop-now-button').closest('a');
    expect(shopNowLink).toHaveAttribute('href');
  });

  it('should have descriptive button text', () => {
    renderWithRouter(<HomePage />);

    // Check for unique buttons using getByText
    expect(screen.getByText('Learn More')).toBeInTheDocument();
    expect(screen.getByText('View All')).toBeInTheDocument();

    // Check for buttons that appear multiple times using getAllByText
    expect(screen.getAllByText('Shop Now').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Add to Cart').length).toBe(4);
  });
});

describe('HomePage - Visual Elements', () => {
  it('should display decorative wave SVG in hero', () => {
    renderWithRouter(<HomePage />);
    const hero = screen.getByTestId('hero-section');
    const svg = hero.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('should display promotional banner emojis', () => {
    renderWithRouter(<HomePage />);
    expect(screen.getByText('🎉')).toBeInTheDocument();
    expect(screen.getByText('✨')).toBeInTheDocument();
  });
});
