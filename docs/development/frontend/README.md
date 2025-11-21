# Frontend Development Guide

Documentation for developing the React/TypeScript frontend applications.

## Contents

- [Setup Guide](./setup.md) - Local development environment setup
- [Patterns and Practices](./patterns.md) - Code patterns, best practices, and examples

## Architecture Overview

The platform includes two React applications:
- **Consumer Web** - Customer-facing storefront with multi-tenant whitelabel branding
- **Admin Web** - Administrative dashboard for managing products, orders, and tenants

Built with:
- **React 18+** with hooks and functional components
- **TypeScript 5.3+** with strict mode enabled
- **Vite** for fast development and optimized builds
- **Tailwind CSS + shadcn/ui** for styling
- **React Router 6** for client-side routing

### Project Structure

```
consumer-web/  (or admin-web/)
├── src/
│   ├── components/          # React components
│   │   ├── ui/             # shadcn/ui base components
│   │   ├── layout/         # Layout components (Header, Footer, etc.)
│   │   ├── product/        # Product-related components
│   │   ├── cart/           # Cart components
│   │   └── common/         # Shared components
│   ├── pages/              # Page components
│   │   ├── HomePage.tsx
│   │   ├── ProductPage.tsx
│   │   ├── CartPage.tsx
│   │   └── CheckoutPage.tsx
│   ├── hooks/              # Custom React hooks
│   │   ├── useProduct.ts
│   │   ├── useCart.ts
│   │   └── useTenant.ts
│   ├── contexts/           # React contexts
│   │   ├── TenantContext.tsx
│   │   └── AuthContext.tsx
│   ├── api/                # API client functions
│   │   ├── client.ts
│   │   ├── products.api.ts
│   │   ├── orders.api.ts
│   │   └── tenants.api.ts
│   ├── types/              # TypeScript type definitions
│   │   ├── product.types.ts
│   │   ├── order.types.ts
│   │   └── tenant.types.ts
│   ├── utils/              # Utility functions
│   │   ├── formatting.ts
│   │   └── validation.ts
│   ├── lib/                # Third-party library configs
│   │   └── utils.ts
│   ├── styles/             # Global styles
│   │   └── globals.css
│   ├── App.tsx             # Root component
│   └── main.tsx            # Entry point
├── public/                 # Static assets
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── Dockerfile
```

## Core Concepts

### 1. Component Architecture

**Functional Components with Hooks**

```tsx
import { useState, useEffect } from 'react';
import { Product } from '@/types/product.types';

interface ProductCardProps {
  product: Product;
  onAddToCart: (productId: string) => void;
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToCart = async () => {
    setIsAdding(true);
    try {
      await onAddToCart(product.id);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="rounded-lg border bg-card p-4">
      <img src={product.imageUrl} alt={product.name} className="h-48 w-full object-cover" />
      <h3 className="mt-2 font-semibold">{product.name}</h3>
      <p className="text-muted-foreground">{product.description}</p>
      <div className="mt-4 flex items-center justify-between">
        <span className="text-lg font-bold">${product.price}</span>
        <button
          onClick={handleAddToCart}
          disabled={isAdding || !product.inStock}
          className="btn-primary"
        >
          {isAdding ? 'Adding...' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
}
```

### 2. Multi-Tenancy and Whitelabel Branding

**Tenant Context**

```tsx
// contexts/TenantContext.tsx
import { createContext, useContext, useState, useEffect } from 'react';
import { TenantConfig } from '@/types/tenant.types';
import { getTenantConfig } from '@/api/tenants.api';
import { extractTenantId, applyBranding } from '@/utils/tenant';

interface TenantContextValue {
  tenant: TenantConfig | null;
  isLoading: boolean;
}

const TenantContext = createContext<TenantContextValue | undefined>(undefined);

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const [tenant, setTenant] = useState<TenantConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTenant = async () => {
      const tenantId = extractTenantId(window.location.host, window.location.pathname);
      const config = await getTenantConfig();
      setTenant(config);
      applyBranding(config.branding);
      setIsLoading(false);
    };
    loadTenant();
  }, []);

  return (
    <TenantContext.Provider value={{ tenant, isLoading }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (!context) throw new Error('useTenant must be used within TenantProvider');
  return context;
}
```

**Dynamic Branding**

```tsx
// utils/tenant.ts
export function applyBranding(branding: BrandingConfig) {
  const root = document.documentElement;

  // Apply colors as CSS variables
  root.style.setProperty('--color-primary', branding.primaryColor);
  root.style.setProperty('--color-secondary', branding.secondaryColor);
  root.style.setProperty('--color-accent', branding.accentColor);

  // Apply typography
  root.style.setProperty('--font-family', branding.fontFamily);

  // Update favicon and title
  document.title = branding.storeName;
  const favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (favicon) favicon.href = branding.faviconUrl;
}
```

### 3. API Integration

**API Client**

```tsx
// api/client.ts
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export class ApiClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  async get<T>(path: string): Promise<T> {
    const response = await fetch(`${this.baseURL}${path}`, {
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
    return response.json();
  }

  async post<T>(path: string, body: unknown): Promise<T> {
    const response = await fetch(`${this.baseURL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
    return response.json();
  }
}

export const apiClient = new ApiClient();
```

**Custom Hooks for Data Fetching**

```tsx
// hooks/useProduct.ts
import { useState, useEffect } from 'react';
import { Product } from '@/types/product.types';
import { getProductById } from '@/api/products.api';

export function useProduct(productId: string) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const data = await getProductById(productId);
        setProduct(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [productId]);

  return { product, loading, error };
}
```

### 4. Styling with Tailwind CSS + shadcn/ui

**Using Tailwind Utility Classes**

```tsx
export function ProductCard({ product }: { product: Product }) {
  return (
    <div className="group relative rounded-lg border bg-card p-4 transition-shadow hover:shadow-lg">
      <div className="aspect-square overflow-hidden rounded-md">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="h-full w-full object-cover transition-transform group-hover:scale-105"
        />
      </div>
      <div className="mt-4 space-y-2">
        <h3 className="font-semibold line-clamp-2">{product.name}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {product.description}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold">${product.price.toFixed(2)}</span>
          <Button size="sm">Add to Cart</Button>
        </div>
      </div>
    </div>
  );
}
```

**Using shadcn/ui Components**

```tsx
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function AddProductDialog({ open, onOpenChange }: DialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Product</DialogTitle>
        </DialogHeader>
        <form className="space-y-4">
          <div>
            <Label htmlFor="name">Product Name</Label>
            <Input id="name" placeholder="Enter product name" />
          </div>
          <div>
            <Label htmlFor="price">Price</Label>
            <Input id="price" type="number" placeholder="0.00" />
          </div>
          <Button type="submit">Create Product</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

### 5. Routing

**React Router Setup**

```tsx
// App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { TenantProvider } from '@/contexts/TenantContext';
import HomePage from '@/pages/HomePage';
import ProductPage from '@/pages/ProductPage';
import CartPage from '@/pages/CartPage';
import CheckoutPage from '@/pages/CheckoutPage';

function App() {
  return (
    <BrowserRouter>
      <TenantProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/products/:id" element={<ProductPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
        </Routes>
      </TenantProvider>
    </BrowserRouter>
  );
}
```

### 6. Testing

**Component Tests with React Testing Library**

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductCard } from './ProductCard';

describe('ProductCard', () => {
  const mockProduct = {
    id: '1',
    name: 'Test Product',
    price: 29.99,
    imageUrl: '/test.jpg',
    inStock: true,
  };

  it('renders product information', () => {
    render(<ProductCard product={mockProduct} onAddToCart={jest.fn()} />);

    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('$29.99')).toBeInTheDocument();
  });

  it('calls onAddToCart when button clicked', async () => {
    const onAddToCart = jest.fn();
    render(<ProductCard product={mockProduct} onAddToCart={onAddToCart} />);

    const button = screen.getByRole('button', { name: /add to cart/i });
    await fireEvent.click(button);

    expect(onAddToCart).toHaveBeenCalledWith('1');
  });
});
```

## Key Dependencies

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "tailwindcss": "^3.4.0",
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-dropdown-menu": "^2.0.6",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.0.0",
    "lucide-react": "^0.292.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.2.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0",
    "@testing-library/react": "^14.1.0",
    "@testing-library/user-event": "^14.5.0",
    "vitest": "^1.0.0",
    "eslint": "^8.0.0",
    "prettier": "^3.1.0"
  }
}
```

## Related Documentation

- [Setup Guide](./setup.md) - Environment setup instructions
- [Patterns Guide](./patterns.md) - Detailed code patterns and examples
- [Frontend Developer Agent](../../../.claude/agents/FRONTEND_DEVELOPER.md) - AI agent guidelines
- [Design System](../../design/design-system.md) - UI/UX specifications
