import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface InventoryItem {
  id: string;
  productName: string;
  sku: string;
  currentStock: number;
  reorderPoint: number;
  reorderQuantity: number;
  lastUpdated: string;
  status: 'in-stock' | 'low-stock' | 'out-of-stock';
}

export default function InventoryPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'in-stock' | 'low-stock' | 'out-of-stock'>('all');

  // Mock data - in production this would come from API
  const inventoryItems: InventoryItem[] = [
    {
      id: '1',
      productName: 'Wireless Headphones',
      sku: 'WH-1000',
      currentStock: 245,
      reorderPoint: 50,
      reorderQuantity: 100,
      lastUpdated: '2024-01-20',
      status: 'in-stock',
    },
    {
      id: '2',
      productName: 'Smart Watch',
      sku: 'SW-2000',
      currentStock: 32,
      reorderPoint: 30,
      reorderQuantity: 75,
      lastUpdated: '2024-01-19',
      status: 'low-stock',
    },
    {
      id: '3',
      productName: 'Laptop Stand',
      sku: 'LS-3000',
      currentStock: 0,
      reorderPoint: 20,
      reorderQuantity: 50,
      lastUpdated: '2024-01-18',
      status: 'out-of-stock',
    },
    {
      id: '4',
      productName: 'USB-C Cable',
      sku: 'UC-4000',
      currentStock: 15,
      reorderPoint: 25,
      reorderQuantity: 100,
      lastUpdated: '2024-01-20',
      status: 'low-stock',
    },
    {
      id: '5',
      productName: 'Mechanical Keyboard',
      sku: 'MK-5000',
      currentStock: 128,
      reorderPoint: 40,
      reorderQuantity: 60,
      lastUpdated: '2024-01-19',
      status: 'in-stock',
    },
  ];

  const filteredItems = inventoryItems.filter((item) => {
    const matchesSearch =
      item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || item.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const metrics = {
    totalProducts: inventoryItems.length,
    inStock: inventoryItems.filter(i => i.status === 'in-stock').length,
    lowStock: inventoryItems.filter(i => i.status === 'low-stock').length,
    outOfStock: inventoryItems.filter(i => i.status === 'out-of-stock').length,
    totalValue: 124580.00,
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in-stock':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">In Stock</Badge>;
      case 'low-stock':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Low Stock</Badge>;
      case 'out-of-stock':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Out of Stock</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background p-8" data-testid="inventory-page">
      <div className="container mx-auto max-w-7xl">
        <header className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            Inventory Management
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Monitor and manage stock levels
          </p>
        </header>

        {/* Inventory Metrics */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Products</CardDescription>
              <CardTitle className="text-3xl font-bold">
                {metrics.totalProducts}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>In Stock</CardDescription>
              <CardTitle className="text-3xl font-bold text-green-600">
                {metrics.inStock}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Low Stock</CardDescription>
              <CardTitle className="text-3xl font-bold text-yellow-600">
                {metrics.lowStock}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Out of Stock</CardDescription>
              <CardTitle className="text-3xl font-bold text-red-600">
                {metrics.outOfStock}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Value</CardDescription>
              <CardTitle className="text-3xl font-bold">
                ${metrics.totalValue.toLocaleString()}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Low Stock Alerts */}
        {metrics.lowStock > 0 || metrics.outOfStock > 0 ? (
          <Card className="mb-8 border-yellow-200 bg-yellow-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-800">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                Stock Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-yellow-800">
                You have <strong>{metrics.lowStock}</strong> low stock items and{' '}
                <strong>{metrics.outOfStock}</strong> out of stock items that need attention.
              </p>
            </CardContent>
          </Card>
        ) : null}

        {/* Filters and Search */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search by product name or SKU..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  data-testid="inventory-search"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={filterStatus === 'all' ? 'default' : 'outline'}
                  onClick={() => setFilterStatus('all')}
                  data-testid="filter-all"
                >
                  All
                </Button>
                <Button
                  variant={filterStatus === 'in-stock' ? 'default' : 'outline'}
                  onClick={() => setFilterStatus('in-stock')}
                  data-testid="filter-in-stock"
                >
                  In Stock
                </Button>
                <Button
                  variant={filterStatus === 'low-stock' ? 'default' : 'outline'}
                  onClick={() => setFilterStatus('low-stock')}
                  data-testid="filter-low-stock"
                >
                  Low Stock
                </Button>
                <Button
                  variant={filterStatus === 'out-of-stock' ? 'default' : 'outline'}
                  onClick={() => setFilterStatus('out-of-stock')}
                  data-testid="filter-out-of-stock"
                >
                  Out of Stock
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Inventory Table */}
        <Card>
          <CardHeader>
            <CardTitle>Inventory Items</CardTitle>
            <CardDescription>
              {filteredItems.length} items found
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full" data-testid="inventory-table">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">Product</th>
                    <th className="text-left py-3 px-4 font-medium">SKU</th>
                    <th className="text-right py-3 px-4 font-medium">Current Stock</th>
                    <th className="text-right py-3 px-4 font-medium">Reorder Point</th>
                    <th className="text-right py-3 px-4 font-medium">Reorder Qty</th>
                    <th className="text-left py-3 px-4 font-medium">Status</th>
                    <th className="text-left py-3 px-4 font-medium">Last Updated</th>
                    <th className="text-right py-3 px-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-muted-foreground">
                        No inventory items found
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item) => (
                      <tr key={item.id} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4 font-medium">{item.productName}</td>
                        <td className="py-3 px-4 text-muted-foreground">{item.sku}</td>
                        <td className="py-3 px-4 text-right font-semibold">
                          {item.currentStock}
                        </td>
                        <td className="py-3 px-4 text-right text-muted-foreground">
                          {item.reorderPoint}
                        </td>
                        <td className="py-3 px-4 text-right text-muted-foreground">
                          {item.reorderQuantity}
                        </td>
                        <td className="py-3 px-4">{getStatusBadge(item.status)}</td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {new Date(item.lastUpdated).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              data-testid={`adjust-stock-${item.id}`}
                            >
                              Adjust
                            </Button>
                            {(item.status === 'low-stock' || item.status === 'out-of-stock') && (
                              <Button
                                size="sm"
                                data-testid={`reorder-${item.id}`}
                              >
                                Reorder
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Bulk Actions */}
        <div className="mt-6 flex justify-end gap-4">
          <Button variant="outline">
            Export Inventory (CSV)
          </Button>
          <Button variant="outline">
            Import Stock Updates
          </Button>
        </div>
      </div>
    </div>
  );
}
