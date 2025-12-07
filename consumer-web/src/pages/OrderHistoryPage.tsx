import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { OrderTrackingTimeline } from '@/components/OrderTrackingTimeline';

interface OrderItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

interface Order {
  id: string;
  orderNumber: string;
  date: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  items: OrderItem[];
  total: number;
  shippingAddress: {
    name: string;
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  trackingNumber?: string;
}

export default function OrderHistoryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  // Mock order data
  const [orders] = useState<Order[]>([
    {
      id: '1',
      orderNumber: 'ORD-2024-001',
      date: '2024-01-15',
      status: 'delivered',
      items: [
        {
          id: '1',
          productId: '1',
          name: 'Wireless Headphones',
          price: 99.99,
          quantity: 1,
        },
        {
          id: '2',
          productId: '2',
          name: 'Smart Watch',
          price: 249.99,
          quantity: 1,
        },
      ],
      total: 349.98,
      shippingAddress: {
        name: 'John Doe',
        street: '123 Main St',
        city: 'San Francisco',
        state: 'CA',
        zip: '94102',
      },
      trackingNumber: 'TRK1234567890',
    },
    {
      id: '2',
      orderNumber: 'ORD-2024-002',
      date: '2024-01-20',
      status: 'shipped',
      items: [
        {
          id: '3',
          productId: '5',
          name: 'Laptop Stand',
          price: 49.99,
          quantity: 2,
        },
      ],
      total: 99.98,
      shippingAddress: {
        name: 'John Doe',
        street: '123 Main St',
        city: 'San Francisco',
        state: 'CA',
        zip: '94102',
      },
      trackingNumber: 'TRK0987654321',
    },
    {
      id: '3',
      orderNumber: 'ORD-2024-003',
      date: '2024-01-25',
      status: 'processing',
      items: [
        {
          id: '4',
          productId: '3',
          name: 'Cotton T-Shirt',
          price: 29.99,
          quantity: 3,
        },
      ],
      total: 89.97,
      shippingAddress: {
        name: 'John Doe',
        street: '123 Main St',
        city: 'San Francisco',
        state: 'CA',
        zip: '94102',
      },
    },
  ]);

  const statusOptions = ['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'];

  const getStatusColor = (status: Order['status']) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      shipped: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status];
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.items.some((item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-gray-50" data-testid="order-history-page">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Order History</h1>
          <p className="mt-2 text-gray-600">
            View and track all your orders
          </p>
        </div>

        {/* Filters */}
        <Card className="p-4 mb-6">
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Search orders or products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="order-search-input"
              />
            </div>
            <select
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              data-testid="status-filter"
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status === 'all' ? 'All Orders' : status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </Card>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <Card className="p-12">
            <div className="text-center">
              <svg
                className="mx-auto h-16 w-16 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900">No orders found</h3>
              <p className="mt-2 text-sm text-gray-500">
                {searchQuery || statusFilter !== 'all'
                  ? 'Try adjusting your search or filter criteria'
                  : "You haven't placed any orders yet"}
              </p>
              {!searchQuery && statusFilter === 'all' && (
                <div className="mt-6">
                  <Button onClick={() => window.location.href = '/products'}>
                    Start Shopping
                  </Button>
                </div>
              )}
            </div>
          </Card>
        ) : (
          <div className="space-y-6" data-testid="orders-list">
            {filteredOrders.map((order) => (
              <Card key={order.id} className="overflow-hidden">
                {/* Order Header */}
                <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-start flex-wrap gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-lg" data-testid={`order-number-${order.id}`}>
                        {order.orderNumber}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Placed on {new Date(order.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                    {order.trackingNumber && (
                      <p className="text-sm text-gray-600">
                        Tracking: <span className="font-medium">{order.trackingNumber}</span>
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Total</p>
                    <p className="text-2xl font-bold" data-testid={`order-total-${order.id}`}>
                      ${order.total.toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Order Items */}
                <div className="p-6">
                  <div className="space-y-4">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex gap-4">
                        <Link
                          to={`/products/${item.productId}`}
                          className="flex-shrink-0"
                        >
                          <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                            <span className="text-2xl">📦</span>
                          </div>
                        </Link>
                        <div className="flex-1 min-w-0">
                          <Link
                            to={`/products/${item.productId}`}
                            className="block"
                          >
                            <h4 className="font-medium text-gray-900 hover:text-blue-600">
                              {item.name}
                            </h4>
                          </Link>
                          <p className="text-sm text-gray-600 mt-1">
                            Quantity: {item.quantity}
                          </p>
                          <p className="text-sm font-medium text-gray-900 mt-1">
                            ${item.price.toFixed(2)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">
                            ${(item.price * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Shipping Address */}
                  <div className="mt-6 pt-6 border-t">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">
                      Shipping Address
                    </h4>
                    <p className="text-sm text-gray-600">
                      {order.shippingAddress.name}
                      <br />
                      {order.shippingAddress.street}
                      <br />
                      {order.shippingAddress.city}, {order.shippingAddress.state}{' '}
                      {order.shippingAddress.zip}
                    </p>
                  </div>

                  {/* Order Actions */}
                  <div className="mt-6 pt-6 border-t flex gap-3 flex-wrap">
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                    {order.trackingNumber && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setExpandedOrderId(
                            expandedOrderId === order.id ? null : order.id
                          )
                        }
                        data-testid={`track-package-button-${order.id}`}
                      >
                        {expandedOrderId === order.id
                          ? 'Hide Tracking'
                          : 'Track Package'}
                      </Button>
                    )}
                    {order.status === 'delivered' && (
                      <>
                        <Button variant="outline" size="sm">
                          Buy Again
                        </Button>
                        <Button variant="outline" size="sm">
                          Leave Review
                        </Button>
                      </>
                    )}
                    {order.status === 'pending' && (
                      <Button variant="outline" size="sm">
                        Cancel Order
                      </Button>
                    )}
                    <Button variant="outline" size="sm">
                      Download Invoice
                    </Button>
                  </div>

                  {/* Order Tracking Timeline - Expanded */}
                  {expandedOrderId === order.id && (
                    <div className="mt-6 pt-6 border-t" data-testid={`tracking-timeline-${order.id}`}>
                      <OrderTrackingTimeline orderId={order.id} />
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {filteredOrders.length > 0 && (
          <div className="mt-8 flex justify-center gap-2">
            <Button variant="outline" disabled>
              Previous
            </Button>
            <Button variant="outline">1</Button>
            <Button variant="outline" disabled>
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
