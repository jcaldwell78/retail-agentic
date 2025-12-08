import { api } from './client';

/**
 * Order Status enum matching backend
 */
export type OrderStatus = 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

/**
 * Status history entry
 */
export interface StatusHistoryEntry {
  status: OrderStatus;
  timestamp: string;
  note: string | null;
}

/**
 * Order tracking information
 */
export interface OrderTrackingInfo {
  orderNumber: string;
  status: OrderStatus;
  carrier: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  estimatedDeliveryDate: string | null;
  actualDeliveryDate: string | null;
  statusHistory: StatusHistoryEntry[];
  orderCreatedAt: string;
  lastUpdatedAt: string;
}

const BASE_URL = '/api/v1/orders';

/**
 * Get tracking information for an order by ID
 */
export async function getTrackingInfo(orderId: string): Promise<OrderTrackingInfo> {
  return api.get<OrderTrackingInfo>(`${BASE_URL}/${orderId}/tracking`);
}

/**
 * Track order by order number (public endpoint)
 */
export async function trackOrderByNumber(
  orderNumber: string,
  email: string
): Promise<OrderTrackingInfo> {
  return api.get<OrderTrackingInfo>(`${BASE_URL}/track`, {
    params: { orderNumber, email },
  });
}

export const orderTrackingApi = {
  getTrackingInfo,
  trackOrderByNumber,
};
