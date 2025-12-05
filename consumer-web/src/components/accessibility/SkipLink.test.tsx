import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SkipLink, SkipLinks } from './SkipLink';

describe('SkipLink', () => {
  it('should render skip link with correct href', () => {
    render(<SkipLink href="#main-content">Skip to main content</SkipLink>);

    const link = screen.getByRole('link', { name: /skip to main content/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '#main-content');
  });

  it('should have sr-only class by default (visually hidden)', () => {
    render(<SkipLink href="#main">Skip to main</SkipLink>);

    const link = screen.getByRole('link', { name: /skip to main/i });
    expect(link).toHaveClass('sr-only');
  });

  it('should have focus styles in className', () => {
    render(<SkipLink href="#main">Skip to main</SkipLink>);

    const link = screen.getByRole('link', { name: /skip to main/i });
    expect(link.className).toContain('focus:not-sr-only');
    expect(link.className).toContain('focus:absolute');
    expect(link.className).toContain('focus:bg-primary');
  });
});

describe('SkipLinks', () => {
  it('should render multiple skip links', () => {
    const links = [
      { href: '#main-content', label: 'Skip to main content' },
      { href: '#navigation', label: 'Skip to navigation' },
      { href: '#footer', label: 'Skip to footer' },
    ];

    render(<SkipLinks links={links} />);

    expect(screen.getByRole('link', { name: /skip to main content/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /skip to navigation/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /skip to footer/i })).toBeInTheDocument();
  });

  it('should render navigation with aria-label', () => {
    const links = [{ href: '#main', label: 'Skip to main' }];

    render(<SkipLinks links={links} />);

    const nav = screen.getByRole('navigation', { name: /skip navigation links/i });
    expect(nav).toBeInTheDocument();
  });

  it('should render empty when no links provided', () => {
    const { container } = render(<SkipLinks links={[]} />);

    const nav = container.querySelector('nav');
    expect(nav).toBeInTheDocument();
    expect(nav?.children).toHaveLength(0);
  });

  it('should render links with unique keys', () => {
    const links = [
      { href: '#main', label: 'Main' },
      { href: '#nav', label: 'Nav' },
    ];

    const { container } = render(<SkipLinks links={links} />);
    const linkElements = container.querySelectorAll('a');

    expect(linkElements).toHaveLength(2);
  });
});
