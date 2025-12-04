import { ReactNode } from 'react';

interface SkipLinkProps {
  href: string;
  children: ReactNode;
}

/**
 * Skip Link component for keyboard navigation accessibility
 * Allows keyboard users to skip to main content
 * WCAG 2.1 Level A requirement
 */
export function SkipLink({ href, children }: SkipLinkProps) {
  return (
    <a
      href={href}
      className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-4 focus:left-4 focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
    >
      {children}
    </a>
  );
}

/**
 * Skip Links container - renders multiple skip links at the top of the page
 */
interface SkipLinksProps {
  links: Array<{ href: string; label: string }>;
}

export function SkipLinks({ links }: SkipLinksProps) {
  return (
    <nav aria-label="Skip navigation links" className="skip-links">
      {links.map((link) => (
        <SkipLink key={link.href} href={link.href}>
          {link.label}
        </SkipLink>
      ))}
    </nav>
  );
}
