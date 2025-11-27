import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalOrders: number;
  totalSpent: number;
  createdAt: string;
  status: 'active' | 'inactive';
  addresses: Address[];
}

interface Address {
  id: string;
  type: 'shipping' | 'billing';
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  isDefault: boolean;
}

interface Order {
  id: string;
  orderNumber: string;
  date: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  total: number;
  itemCount: number;
}

export default function CustomerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Mock data - in production this would come from API
  const [customer] = useState<Customer>({
    id: id || '1',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1 (555) 123-4567',
    totalOrders: 15,
    totalSpent: 1234.56,
    createdAt: '2024-01-15',
    status: 'active',
    addresses: [
      {
        id: '1',
        type: 'shipping',
        street: '123 Main St',
        city: 'San Francisco',
        state: 'CA',
        zip: '94102',
        country: 'USA',
        isDefault: true,
      },
      {
        id: '2',
        type: 'billing',
        street: '456 Oak Ave',
        city: 'San Francisco',
        state: 'CA',
        zip: '94103',
        country: 'USA',
        isDefault: false,
      },
    ],
  });

  const orders: Order[] = [
    {
      id: '1',
      orderNumber: 'ORD-2024-328',
      date: '2024-01-20',
      status: 'delivered',
      total: 249.99,
      itemCount: 3,
    },
    {
      id: '2',
      orderNumber: 'ORD-2024-295',
      date: '2024-01-15',
      status: 'shipped',
      total: 189.50,
      itemCount: 2,
    },
    {
      id: '3',
      orderNumber: 'ORD-2024-263',
      date: '2024-01-10',
      status: 'delivered',
      total: 425.75,
      itemCount: 5,
    },
  ];

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-gray-100 text-gray-800',
      processing: 'bg-blue-100 text-blue-800',
      shipped: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return (
      <Badge className={`${styles[status as keyof typeof styles]} hover:${styles[status as keyof typeof styles]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-background p-8" data-testid="customer-detail-page">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Button
              variant="ghost"
              onClick={() => navigate('/customers')}
              className="mb-4"
            >
              ← Back to Customers
            </Button>
            <h1 className="text-4xl font-bold tracking-tight text-foreground">
              {customer.name}
            </h1>
            <p className="mt-2 text-lg text-muted-foreground">
              Customer since {new Date(customer.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">Edit Customer</Button>
            <Button variant="outline" className="text-red-600 hover:text-red-700">
              Delete
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-6 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Status</CardDescription>
              <CardTitle className="text-2xl">
                <Badge className={customer.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                  {customer.status.charAt(0).toUpperCase() + customer.status.slice(1)}
                </Badge>
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Orders</CardDescription>
              <CardTitle className="text-3xl font-bold">
                {customer.totalOrders}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Spent</CardDescription>
              <CardTitle className="text-3xl font-bold">
                ${customer.totalSpent.toFixed(2)}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Average Order Value</CardDescription>
              <CardTitle className="text-3xl font-bold">
                ${(customer.totalSpent / customer.totalOrders).toFixed(2)}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="addresses">Addresses</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Email</div>
                    <div className="mt-1">{customer.email}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Phone</div>
                    <div className="mt-1">{customer.phone}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Customer ID</div>
                    <div className="mt-1 font-mono text-sm">{customer.id}</div>
                  </div>
                </CardContent>
              </Card>

              {/* Activity Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Activity Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Last Order</div>
                    <div className="mt-1">
                      {orders.length > 0 ? new Date(orders[0].date).toLocaleDateString() : 'No orders'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Account Created</div>
                    <div className="mt-1">{new Date(customer.createdAt).toLocaleDateString()}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Total Addresses</div>
                    <div className="mt-1">{customer.addresses.length}</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Orders */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Recent Orders</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => navigate('#')}>
                  View All
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {orders.slice(0, 3).map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0"
                    >
                      <div>
                        <p className="font-medium text-sm">{order.orderNumber}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(order.date).toLocaleDateString()} • {order.itemCount} items
                        </p>
                      </div>
                      <div className="text-right flex items-center gap-3">
                        <p className="font-semibold text-sm">${order.total.toFixed(2)}</p>
                        {getStatusBadge(order.status)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>Order History</CardTitle>
                <CardDescription>{orders.length} total orders</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full" data-testid="customer-orders-table">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium">Order Number</th>
                        <th className="text-left py-3 px-4 font-medium">Date</th>
                        <th className="text-left py-3 px-4 font-medium">Items</th>
                        <th className="text-left py-3 px-4 font-medium">Status</th>
                        <th className="text-right py-3 px-4 font-medium">Total</th>
                        <th className="text-right py-3 px-4 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => (
                        <tr key={order.id} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-4 font-medium">{order.orderNumber}</td>
                          <td className="py-3 px-4 text-muted-foreground">
                            {new Date(order.date).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4">{order.itemCount}</td>
                          <td className="py-3 px-4">{getStatusBadge(order.status)}</td>
                          <td className="py-3 px-4 text-right font-semibold">
                            ${order.total.toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/orders/${order.id}`)}
                            >
                              View
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Addresses Tab */}
          <TabsContent value="addresses">
            <div className="grid gap-6 md:grid-cols-2">
              {customer.addresses.map((address) => (
                <Card key={address.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg capitalize">
                        {address.type} Address
                      </CardTitle>
                      {address.isDefault && (
                        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                          Default
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1 text-sm">
                      <div>{address.street}</div>
                      <div>
                        {address.city}, {address.state} {address.zip}
                      </div>
                      <div>{address.country}</div>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                      {!address.isDefault && (
                        <Button variant="ghost" size="sm">
                          Set as Default
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              <Card className="border-dashed flex items-center justify-center min-h-[200px]">
                <Button variant="ghost" className="flex-col h-auto py-8">
                  <svg
                    className="w-8 h-8 mb-2 text-muted-foreground"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  <span className="text-muted-foreground">Add New Address</span>
                </Button>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
