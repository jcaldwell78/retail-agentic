import { Button } from '@/components/ui/button';
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
import { Link } from 'react-router-dom';
import { Edit, Trash2 } from 'lucide-react';

// Mock data - will be replaced with API calls
const mockProducts = [
  {
    id: '1',
    name: 'Wireless Headphones',
    sku: 'WH-1000',
    category: 'Electronics',
    price: 99.99,
    stock: 45,
    status: 'Active',
  },
  {
    id: '2',
    name: 'Running Shoes',
    sku: 'RS-2000',
    category: 'Footwear',
    price: 79.99,
    stock: 120,
    status: 'Active',
  },
  {
    id: '3',
    name: 'Coffee Maker',
    sku: 'CM-500',
    category: 'Appliances',
    price: 149.99,
    stock: 8,
    status: 'Low Stock',
  },
];

export default function ProductsPage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="container mx-auto max-w-7xl">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground" aria-label="Back to Dashboard">
              ← Back to Dashboard
            </Link>
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-foreground">
              Products
            </h1>
            <p className="mt-2 text-lg text-muted-foreground">
              Manage your product catalog
            </p>
          </div>
          <Button aria-label="Add new product">Add Product</Button>
        </header>

        <Card>
          <CardHeader>
            <CardTitle as="h2">Product List</CardTitle>
            <CardDescription>
              View and manage all products in your catalog
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table aria-label="Products table">
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.sku}</TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell>${product.price.toFixed(2)}</TableCell>
                    <TableCell>{product.stock}</TableCell>
                    <TableCell>
                      <Badge variant={product.status === 'Active' ? 'success' : 'warning'} aria-label={`Product status: ${product.status}`}>
                        {product.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" aria-label={`Edit ${product.name}`}>
                          <Edit className="h-4 w-4" aria-hidden="true" />
                        </Button>
                        <Button variant="ghost" size="icon" aria-label={`Delete ${product.name}`}>
                          <Trash2 className="h-4 w-4 text-destructive" aria-hidden="true" />
                        </Button>
                      </div>
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
