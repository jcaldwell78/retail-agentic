import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';

export default function ProductsPage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="container mx-auto max-w-7xl">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
              ← Back to Dashboard
            </Link>
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-foreground">
              Products
            </h1>
            <p className="mt-2 text-lg text-muted-foreground">
              Manage your product catalog
            </p>
          </div>
          <Button>Add Product</Button>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Product List</CardTitle>
            <CardDescription>
              View and manage all products
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Product management coming soon...
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
