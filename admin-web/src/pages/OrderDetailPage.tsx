import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';

interface OrderItem {
  productId: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  subtotal: number;
}

interface Order {
  id: string;
  orderNumber: string;
  customer: {
    email: string;
    name: string;
  };
  items: OrderItem[];
  status: string;
  pricing: {
    subtotal: number;
    shipping: number;
    tax: number;
    total: number;
  };
  shippingAddress: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  createdAt: string;
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch order from API
    setTimeout(() => {
      setOrder({
        id: id || '',
        orderNumber: 'ORD-20241126-1234',
        customer: {
          email: 'customer@example.com',
          name: 'John Doe',
        },
        items: [
          {
            productId: '1',
            name: 'Product 1',
            sku: 'PROD-001',
            price: 99.99,
            quantity: 2,
            subtotal: 199.98,
          },
          {
            productId: '2',
            name: 'Product 2',
            sku: 'PROD-002',
            price: 49.99,
            quantity: 1,
            subtotal: 49.99,
          },
        ],
        status: 'PROCESSING',
        pricing: {
          subtotal: 249.97,
          shipping: 10.0,
          tax: 25.0,
          total: 284.97,
        },
        shippingAddress: {
          line1: '123 Main St',
          city: 'San Francisco',
          state: 'CA',
          postalCode: '94102',
          country: 'USA',
        },
        createdAt: new Date().toISOString(),
      });
      setLoading(false);
    }, 500);
  }, [id]);

  const handleStatusChange = (newStatus: string) => {
    console.log('Updating order status to:', newStatus);
    // TODO: API call to update status
    if (order) {
      setOrder({ ...order, status: newStatus });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500">Loading order...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Order not found</h2>
          <Button onClick={() => navigate('/orders')}>Back to Orders</Button>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      PROCESSING: 'bg-blue-100 text-blue-800',
      SHIPPED: 'bg-purple-100 text-purple-800',
      DELIVERED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="container mx-auto px-4 py-8" data-testid="order-detail-page">
      {/* Header */}
      <div className="mb-6 flex justify-between items-start">
        <div>
          <Button variant="ghost" onClick={() => navigate('/orders')} className="mb-2">
            ← Back to Orders
          </Button>
          <h1 className="text-3xl font-bold">{order.orderNumber}</h1>
          <p className="text-gray-600 mt-1">
            Placed on {new Date(order.createdAt).toLocaleDateString()}
          </p>
        </div>
        <span className={`px-4 py-2 rounded-full font-semibold ${getStatusColor(order.status)}`}>
          {order.status}
        </span>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Order Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Order Items</h2>
            <div className="space-y-4">
              {order.items.map((item) => (
                <div
                  key={item.productId}
                  className="flex justify-between items-start border-b pb-4 last:border-b-0 last:pb-0"
                >
                  <div className="flex-1">
                    <h3 className="font-medium">{item.name}</h3>
                    <p className="text-sm text-gray-600">SKU: {item.sku}</p>
                    <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">${item.subtotal.toFixed(2)}</p>
                    <p className="text-sm text-gray-600">${item.price.toFixed(2)} each</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Customer Information */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Customer Information</h2>
            <div className="space-y-2">
              <div>
                <p className="text-sm font-medium text-gray-600">Name</p>
                <p className="font-medium">{order.customer.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Email</p>
                <p className="font-medium">{order.customer.email}</p>
              </div>
            </div>
          </Card>

          {/* Shipping Address */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Shipping Address</h2>
            <div className="text-gray-900">
              <p>{order.shippingAddress.line1}</p>
              {order.shippingAddress.line2 && <p>{order.shippingAddress.line2}</p>}
              <p>
                {order.shippingAddress.city}, {order.shippingAddress.state}{' '}
                {order.shippingAddress.postalCode}
              </p>
              <p>{order.shippingAddress.country}</p>
            </div>
          </Card>
        </div>

        {/* Right Column - Order Summary & Actions */}
        <div className="space-y-6">
          {/* Order Summary */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span>${order.pricing.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping</span>
                <span>${order.pricing.shipping.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tax</span>
                <span>${order.pricing.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t font-bold text-lg">
                <span>Total</span>
                <span>${order.pricing.total.toFixed(2)}</span>
              </div>
            </div>
          </Card>

          {/* Order Actions */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Order Actions</h2>
            <div className="space-y-3">
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={order.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                data-testid="order-status-select"
              >
                <option value="PENDING">Pending</option>
                <option value="PROCESSING">Processing</option>
                <option value="SHIPPED">Shipped</option>
                <option value="DELIVERED">Delivered</option>
                <option value="CANCELLED">Cancelled</option>
              </select>

              <Button className="w-full" variant="outline">
                Print Invoice
              </Button>
              <Button className="w-full" variant="outline">
                Send Email to Customer
              </Button>
              <Button className="w-full" variant="destructive">
                Cancel Order
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
