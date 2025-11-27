/**
 * Mock API handlers using MSW (Mock Service Worker)
 * These handlers simulate the backend API for testing
 */
import { http, HttpResponse } from 'msw';

const API_BASE = 'http://localhost:8080/api/v1';

// Type definitions for mock data
interface CartItem {
  id: string;
  productId: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  attributes: Record<string, any>;
  imageUrl?: string;
  subtotal: number;
}

// Mock data
const mockProducts = [
  {
    id: '1',
    name: 'Premium Wireless Headphones',
    sku: 'WH-1000XM4',
    description: 'Industry-leading noise canceling with Dual Noise Sensor technology',
    price: 299.99,
    currency: 'USD',
    category: ['Electronics', 'Audio'],
    images: [
      {
        url: 'https://via.placeholder.com/400x400?text=Headphones',
        alt: 'Premium Wireless Headphones',
        order: 1,
      },
    ],
    attributes: {
      color: 'Black',
      wireless: true,
      batteryLife: '30 hours',
    },
    stock: 50,
    status: 'ACTIVE',
  },
  {
    id: '2',
    name: 'Ergonomic Office Chair',
    sku: 'CHAIR-ERG-001',
    description: 'Comfortable ergonomic chair with lumbar support',
    price: 399.99,
    currency: 'USD',
    category: ['Furniture', 'Office'],
    images: [
      {
        url: 'https://via.placeholder.com/400x400?text=Chair',
        alt: 'Ergonomic Office Chair',
        order: 1,
      },
    ],
    attributes: {
      color: 'Gray',
      adjustable: true,
      maxWeight: '300 lbs',
    },
    stock: 25,
    status: 'ACTIVE',
  },
];

const mockCart: {
  id: string;
  sessionId: string;
  tenantId: string;
  items: CartItem[];
  itemCount: number;
  summary: {
    subtotal: number;
    tax: number;
    shipping: number;
    total: number;
  };
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
} = {
  id: 'cart-123',
  sessionId: 'session-456',
  tenantId: 'tenant-1',
  items: [],
  itemCount: 0,
  summary: {
    subtotal: 0,
    tax: 0,
    shipping: 0,
    total: 0,
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
};

export const handlers = [
  // Get all products
  http.get(`${API_BASE}/products`, () => {
    return HttpResponse.json(mockProducts);
  }),

  // Get single product
  http.get(`${API_BASE}/products/:id`, ({ params }) => {
    const { id } = params;
    const product = mockProducts.find((p) => p.id === id);

    if (!product) {
      return new HttpResponse(null, { status: 404 });
    }

    return HttpResponse.json(product);
  }),

  // Search products
  http.get(`${API_BASE}/products/search`, ({ request }) => {
    const url = new URL(request.url);
    const query = url.searchParams.get('q')?.toLowerCase() || '';

    const filtered = mockProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query)
    );

    return HttpResponse.json(filtered);
  }),

  // Get cart
  http.get(`${API_BASE}/cart/:sessionId`, () => {
    return HttpResponse.json(mockCart);
  }),

  // Add to cart
  http.post(`${API_BASE}/cart/:sessionId/items`, async ({ request }) => {
    const body = await request.json();
    const { productId, quantity } = body as { productId: string; quantity: number };

    const product = mockProducts.find((p) => p.id === productId);
    if (!product) {
      return new HttpResponse(null, { status: 404 });
    }

    const existingItemIndex = mockCart.items.findIndex(
      (item: any) => item.productId === productId
    );

    if (existingItemIndex >= 0) {
      mockCart.items[existingItemIndex].quantity += quantity;
      mockCart.items[existingItemIndex].subtotal =
        mockCart.items[existingItemIndex].quantity * product.price;
    } else {
      mockCart.items.push({
        id: `item-${Date.now()}`,
        productId,
        name: product.name,
        sku: product.sku,
        price: product.price,
        quantity,
        attributes: product.attributes,
        imageUrl: product.images[0]?.url,
        subtotal: product.price * quantity,
      });
    }

    // Recalculate totals
    mockCart.itemCount = mockCart.items.reduce(
      (sum: number, item: any) => sum + item.quantity,
      0
    );
    mockCart.summary.subtotal = mockCart.items.reduce(
      (sum: number, item: any) => sum + item.subtotal,
      0
    );
    mockCart.summary.tax = mockCart.summary.subtotal * 0.1;
    mockCart.summary.shipping = mockCart.summary.subtotal >= 50 ? 0 : 5;
    mockCart.summary.total =
      mockCart.summary.subtotal + mockCart.summary.tax + mockCart.summary.shipping;

    mockCart.updatedAt = new Date().toISOString();

    return HttpResponse.json(mockCart);
  }),

  // Update cart item quantity
  http.put(`${API_BASE}/cart/:sessionId/items/:itemId`, async ({ request, params }) => {
    const body = await request.json();
    const { quantity } = body as { quantity: number };
    const { itemId } = params;

    const itemIndex = mockCart.items.findIndex((item: any) => item.id === itemId);

    if (itemIndex === -1) {
      return new HttpResponse(null, { status: 404 });
    }

    if (quantity === 0) {
      mockCart.items.splice(itemIndex, 1);
    } else {
      mockCart.items[itemIndex].quantity = quantity;
      mockCart.items[itemIndex].subtotal =
        mockCart.items[itemIndex].price * quantity;
    }

    // Recalculate totals
    mockCart.itemCount = mockCart.items.reduce(
      (sum: number, item: any) => sum + item.quantity,
      0
    );
    mockCart.summary.subtotal = mockCart.items.reduce(
      (sum: number, item: any) => sum + item.subtotal,
      0
    );
    mockCart.summary.tax = mockCart.summary.subtotal * 0.1;
    mockCart.summary.shipping = mockCart.summary.subtotal >= 50 ? 0 : 5;
    mockCart.summary.total =
      mockCart.summary.subtotal + mockCart.summary.tax + mockCart.summary.shipping;

    mockCart.updatedAt = new Date().toISOString();

    return HttpResponse.json(mockCart);
  }),

  // Remove from cart
  http.delete(`${API_BASE}/cart/:sessionId/items/:itemId`, ({ params }) => {
    const { itemId } = params;

    const itemIndex = mockCart.items.findIndex((item: any) => item.id === itemId);

    if (itemIndex === -1) {
      return new HttpResponse(null, { status: 404 });
    }

    mockCart.items.splice(itemIndex, 1);

    // Recalculate totals
    mockCart.itemCount = mockCart.items.reduce(
      (sum: number, item: any) => sum + item.quantity,
      0
    );
    mockCart.summary.subtotal = mockCart.items.reduce(
      (sum: number, item: any) => sum + item.subtotal,
      0
    );
    mockCart.summary.tax = mockCart.summary.subtotal * 0.1;
    mockCart.summary.shipping = mockCart.summary.subtotal >= 50 ? 0 : 5;
    mockCart.summary.total =
      mockCart.summary.subtotal + mockCart.summary.tax + mockCart.summary.shipping;

    mockCart.updatedAt = new Date().toISOString();

    return HttpResponse.json(mockCart);
  }),

  // Create order
  http.post(`${API_BASE}/orders`, async ({ request }) => {
    const body = (await request.json()) as Record<string, any>;

    return HttpResponse.json({
      id: `order-${Date.now()}`,
      orderNumber: `ORD-${Date.now()}`,
      ...body,
      status: 'PENDING',
      payment: {
        ...(body.payment || {}),
        status: 'PENDING',
      },
      statusHistory: [
        {
          status: 'PENDING',
          timestamp: new Date().toISOString(),
          note: 'Order created',
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }),

  // User registration
  http.post(`${API_BASE}/auth/register`, async ({ request }) => {
    const body = (await request.json()) as { email?: string; name?: string };

    return HttpResponse.json({
      id: `user-${Date.now()}`,
      email: body.email || '',
      name: body.name || '',
      role: 'CUSTOMER',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    });
  }),

  // User login
  http.post(`${API_BASE}/auth/login`, async ({ request }) => {
    const body = (await request.json()) as { email?: string };

    return HttpResponse.json({
      token: 'mock-jwt-token',
      user: {
        id: 'user-1',
        email: body.email || '',
        name: 'Test User',
        role: 'CUSTOMER',
        status: 'ACTIVE',
      },
    });
  }),
];
