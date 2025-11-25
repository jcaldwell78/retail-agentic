import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Eye } from 'lucide-react';

// Mock data - will be replaced with API calls
const mockOrders = [
  {
    id: 'ORD-001',
    customer: 'John Doe',
    date: '2025-01-15',
    total: 299.97,
    status: 'pending',
    items: 3,
  },
  {
    id: 'ORD-002',
    customer: 'Jane Smith',
    date: '2025-01-14',
    total: 149.99,
    status: 'shipped',
    items: 2,
  },
  {
    id: 'ORD-003',
    customer: 'Bob Johnson',
    date: '2025-01-13',
    total: 79.99,
    status: 'delivered',
    items: 1,
  },
  {
    id: 'ORD-004',
    customer: 'Alice Williams',
    date: '2025-01-12',
    total: 449.96,
    status: 'processing',
    items: 4,
  },
];

const statusVariant: Record<string, 'default' | 'secondary' | 'success' | 'warning'> = {
  pending: 'warning',
  processing: 'default',
  shipped: 'secondary',
  delivered: 'success',
};

export default function OrdersPage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="container mx-auto max-w-7xl">
        <header className="mb-8">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
            ← Back to Dashboard
          </Link>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-foreground">
            Orders
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            View and manage customer orders
          </p>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Order List</CardTitle>
            <CardDescription>
              View all orders and their status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.id}</TableCell>
                    <TableCell>{order.customer}</TableCell>
                    <TableCell>{new Date(order.date).toLocaleDateString()}</TableCell>
                    <TableCell>{order.items}</TableCell>
                    <TableCell>${order.total.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[order.status]}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
