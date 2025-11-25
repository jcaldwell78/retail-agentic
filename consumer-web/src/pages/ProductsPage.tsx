import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';

export default function ProductsPage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="container mx-auto max-w-6xl">
        <header className="mb-8">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
            ← Back to Home
          </Link>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-foreground">
            Products
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Browse our product catalog
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardHeader>
                <CardTitle>Product {i}</CardTitle>
                <CardDescription>Sample product description</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="aspect-square rounded-lg bg-muted mb-4" />
                <p className="text-2xl font-bold">$99.99</p>
              </CardContent>
              <CardFooter>
                <Button className="w-full">Add to Cart</Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
