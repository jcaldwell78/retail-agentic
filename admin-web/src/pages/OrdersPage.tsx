import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';

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
            <p className="text-sm text-muted-foreground">
              Order management coming soon...
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
