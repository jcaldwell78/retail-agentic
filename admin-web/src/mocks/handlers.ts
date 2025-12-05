/**
 * Mock API handlers for Admin Dashboard
 * Simulates backend API for testing
 */
import { http, HttpResponse } from 'msw';

const API_BASE = 'http://localhost:8080/api/v1';

// Mock admin user
const mockAdmin = {
  id: 'admin-1',
  email: 'admin@example.com',
  name: 'Admin User',
  role: 'ADMIN',
  status: 'ACTIVE',
};

// Mock dashboard data
const mockDashboardData = {
  today: {
    revenue: 12450.50,
    orders: 45,
    averageOrderValue: 276.68,
  },
  last30Days: {
    revenue: 325600.00,
    orders: 1250,
    averageOrderValue: 260.48,
  },
  last7Days: {
    revenue: 89200.00,
    orders: 342,
    averageOrderValue: 260.82,
  },
  totalProducts: 156,
  totalUsers: 2340,
  activeProducts: 142,
  topProducts: [
    { id: '1', name: 'Premium Wireless Headphones', revenue: 14999.50, unitsSold: 50 },
    { id: '2', name: 'Ergonomic Office Chair', revenue: 11999.60, unitsSold: 30 },
    { id: '3', name: 'Smart Watch Pro', revenue: 9599.75, unitsSold: 35 },
  ],
  orderStatusBreakdown: [
    { status: 'PENDING', count: 15 },
    { status: 'PROCESSING', count: 20 },
    { status: 'SHIPPED', count: 30 },
    { status: 'DELIVERED', count: 280 },
  ],
  last7DaysSales: [
    { date: '2024-01-20', sales: 12500.00 },
    { date: '2024-01-21', sales: 13200.00 },
    { date: '2024-01-22', sales: 11800.00 },
    { date: '2024-01-23', sales: 14500.00 },
    { date: '2024-01-24', sales: 12900.00 },
    { date: '2024-01-25', sales: 13400.00 },
    { date: '2024-01-26', sales: 10900.00 },
  ],
};

// Mock products for admin
const mockProducts = Array.from({ length: 50 }, (_, i) => ({
  id: `product-${i + 1}`,
  name: `Product ${i + 1}`,
  sku: `SKU-${String(i + 1).padStart(4, '0')}`,
  description: `Description for product ${i + 1}`,
  price: Math.floor(Math.random() * 500) + 50,
  stock: Math.floor(Math.random() * 100),
  status: Math.random() > 0.2 ? 'ACTIVE' : 'INACTIVE',
  category: ['Electronics', 'Furniture', 'Clothing'][Math.floor(Math.random() * 3)],
  createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
}));

// Mock orders for admin
const mockOrders = Array.from({ length: 100 }, (_, i) => ({
  id: `order-${i + 1}`,
  orderNumber: `ORD-${String(i + 1).padStart(6, '0')}`,
  customer: {
    email: `customer${i + 1}@example.com`,
    name: `Customer ${i + 1}`,
  },
  pricing: {
    subtotal: Math.floor(Math.random() * 500) + 50,
    tax: Math.floor(Math.random() * 50) + 5,
    shipping: Math.random() > 0.5 ? 0 : 5,
    total: Math.floor(Math.random() * 600) + 60,
  },
  status: ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'][
    Math.floor(Math.random() * 5)
  ],
  createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
}));

export const handlers = [
  // Admin authentication
  http.post(`${API_BASE}/auth/login`, async ({ request }) => {
    const body = await request.json();
    const { email, password } = body as { email: string; password: string };

    if (email === 'admin@example.com' && password === 'admin123') {
      return HttpResponse.json({
        token: 'mock-admin-jwt-token',
        user: mockAdmin,
      });
    }

    return new HttpResponse(null, { status: 401 });
  }),

  // Dashboard overview
  http.get(`${API_BASE}/admin/dashboard`, () => {
    return HttpResponse.json(mockDashboardData);
  }),

  // Products management
  http.get(`${API_BASE}/admin/products`, ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const status = url.searchParams.get('status');

    let filtered = [...mockProducts];
    if (status) {
      filtered = filtered.filter((p) => p.status === status);
    }

    const start = (page - 1) * limit;
    const end = start + limit;

    return HttpResponse.json({
      data: filtered.slice(start, end),
      total: filtered.length,
      page,
      limit,
    });
  }),

  http.get(`${API_BASE}/admin/products/:id`, ({ params }) => {
    const product = mockProducts.find((p) => p.id === params.id);
    if (!product) {
      return new HttpResponse(null, { status: 404 });
    }
    return HttpResponse.json(product);
  }),

  http.post(`${API_BASE}/admin/products`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    const newProduct = {
      id: `product-${mockProducts.length + 1}`,
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockProducts.push(newProduct as any);
    return HttpResponse.json(newProduct, { status: 201 });
  }),

  http.put(`${API_BASE}/admin/products/:id`, async ({ request, params }) => {
    const body = await request.json() as Record<string, unknown>;
    const index = mockProducts.findIndex((p) => p.id === params.id);

    if (index === -1) {
      return new HttpResponse(null, { status: 404 });
    }

    mockProducts[index] = {
      ...mockProducts[index],
      ...body,
      updatedAt: new Date().toISOString(),
    } as typeof mockProducts[0];

    return HttpResponse.json(mockProducts[index]);
  }),

  http.delete(`${API_BASE}/admin/products/:id`, ({ params }) => {
    const index = mockProducts.findIndex((p) => p.id === params.id);

    if (index === -1) {
      return new HttpResponse(null, { status: 404 });
    }

    mockProducts.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),

  // Orders management
  http.get(`${API_BASE}/admin/orders`, ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const status = url.searchParams.get('status');

    let filtered = [...mockOrders];
    if (status) {
      filtered = filtered.filter((o) => o.status === status);
    }

    const start = (page - 1) * limit;
    const end = start + limit;

    return HttpResponse.json({
      data: filtered.slice(start, end),
      total: filtered.length,
      page,
      limit,
    });
  }),

  http.get(`${API_BASE}/admin/orders/:id`, ({ params }) => {
    const order = mockOrders.find((o) => o.id === params.id);
    if (!order) {
      return new HttpResponse(null, { status: 404 });
    }
    return HttpResponse.json(order);
  }),

  http.put(`${API_BASE}/admin/orders/:id/status`, async ({ request, params }) => {
    const body = await request.json();
    const { status } = body as { status: string };
    const order = mockOrders.find((o) => o.id === params.id);

    if (!order) {
      return new HttpResponse(null, { status: 404 });
    }

    order.status = status;
    return HttpResponse.json(order);
  }),

  // Analytics
  http.get(`${API_BASE}/admin/analytics/sales`, () => {
    return HttpResponse.json(mockDashboardData.last7DaysSales);
  }),

  http.get(`${API_BASE}/admin/analytics/top-products`, () => {
    return HttpResponse.json(mockDashboardData.topProducts);
  }),
];
