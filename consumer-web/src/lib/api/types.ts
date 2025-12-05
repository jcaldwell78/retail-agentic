/**
 * API response types
 */

export interface User {
  id: string;
  tenantId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'CUSTOMER' | 'STORE_OWNER' | 'ADMIN';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  addresses: Address[];
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  id?: string;
  firstName: string;
  lastName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone?: string;
  isDefault?: boolean;
}

export interface Product {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  sku: string;
  price: number;
  compareAtPrice?: number;
  category: string;
  tags: string[];
  images: string[];
  attributes: Record<string, unknown>;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Cart {
  id: string;
  tenantId: string;
  userId?: string;
  sessionId?: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  productId: string;
  productName: string;
  productImage?: string;
  quantity: number;
  price: number;
  subtotal: number;
  attributes?: Record<string, unknown>;
}

export interface Order {
  id: string;
  tenantId: string;
  userId: string;
  orderNumber: string;
  status: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  paymentStatus: 'PENDING' | 'AUTHORIZED' | 'CAPTURED' | 'FAILED' | 'REFUNDED';
  items: OrderLineItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
  shippingAddress: Address;
  billingAddress: Address;
  createdAt: string;
  updatedAt: string;
}

export interface OrderLineItem {
  productId: string;
  productName: string;
  productImage?: string;
  quantity: number;
  price: number;
  subtotal: number;
  attributes?: Record<string, unknown>;
}

/**
 * API request types
 */

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface AuthRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'CUSTOMER' | 'STORE_OWNER' | 'ADMIN';
  token?: string;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
  path?: string;
  timestamp?: string;
  fieldErrors?: Array<{
    field: string;
    message: string;
  }>;
}
