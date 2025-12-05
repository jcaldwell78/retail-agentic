import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Upload, Download, Edit, Trash2, Tag } from 'lucide-react';

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  stock: number;
  status: 'active' | 'draft' | 'archived';
}

export interface BulkProductOperationsProps {
  products?: Product[];
  onBulkEdit?: (productIds: string[], updates: Partial<Product>) => void;
  onBulkDelete?: (productIds: string[]) => void;
  onExport?: (productIds: string[]) => void;
}

export default function BulkProductOperations({
  products = [],
  onBulkEdit,
  onBulkDelete,
  onExport,
}: BulkProductOperationsProps) {
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<string>('');
  const [bulkUpdateField, setBulkUpdateField] = useState<string>('');
  const [bulkUpdateValue, setBulkUpdateValue] = useState<string>('');
  const [priceAdjustmentType, setPriceAdjustmentType] = useState<'set' | 'increase' | 'decrease'>('set');
  const [priceAdjustmentValue, setPriceAdjustmentValue] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const toggleProduct = (productId: string) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
  };

  const toggleAll = () => {
    if (selectedProducts.size === filteredProducts.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(filteredProducts.map((p) => p.id)));
    }
  };

  const filteredProducts = products.filter((product) => {
    if (filterCategory && filterCategory !== 'all' && product.category !== filterCategory) return false;
    if (filterStatus && filterStatus !== 'all' && product.status !== filterStatus) return false;
    return true;
  });

  const categories = Array.from(new Set(products.map((p) => p.category)));

  const handleBulkAction = () => {
    const productIds = Array.from(selectedProducts);

    if (bulkAction === 'delete') {
      if (confirm(`Delete ${productIds.length} products? This action cannot be undone.`)) {
        onBulkDelete?.(productIds);
        setSelectedProducts(new Set());
      }
    } else if (bulkAction === 'export') {
      onExport?.(productIds);
    } else if (bulkAction === 'edit' && bulkUpdateField && bulkUpdateValue) {
      const updates: Partial<Product> = {
        [bulkUpdateField]: bulkUpdateValue,
      };
      onBulkEdit?.(productIds, updates);
      setSelectedProducts(new Set());
      setBulkUpdateField('');
      setBulkUpdateValue('');
    }
  };

  const handlePriceAdjustment = () => {
    const productIds = Array.from(selectedProducts);
    const value = parseFloat(priceAdjustmentValue);

    if (isNaN(value)) {
      alert('Please enter a valid number for price adjustment');
      return;
    }

    const updates: Partial<Product> = {};

    if (priceAdjustmentType === 'set') {
      updates.price = value;
    } else {
      // For increase/decrease, we'd need the current price
      // This is just a placeholder - in reality, backend would handle this
      updates.price = value;
    }

    onBulkEdit?.(productIds, updates);
    setSelectedProducts(new Set());
    setPriceAdjustmentValue('');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Bulk Product Operations</CardTitle>
          <CardDescription>
            Select multiple products and perform bulk actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="actions" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="actions">Bulk Actions</TabsTrigger>
              <TabsTrigger value="pricing">Price Adjustment</TabsTrigger>
              <TabsTrigger value="export">Export/Import</TabsTrigger>
            </TabsList>

            <TabsContent value="actions" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="bulk-action">Action</Label>
                  <Select value={bulkAction} onValueChange={setBulkAction}>
                    <SelectTrigger id="bulk-action">
                      <SelectValue placeholder="Select action" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="edit">Edit Products</SelectItem>
                      <SelectItem value="delete">Delete Products</SelectItem>
                      <SelectItem value="export">Export Selected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {bulkAction === 'edit' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="update-field">Field to Update</Label>
                      <Select value={bulkUpdateField} onValueChange={setBulkUpdateField}>
                        <SelectTrigger id="update-field">
                          <SelectValue placeholder="Select field" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="status">Status</SelectItem>
                          <SelectItem value="category">Category</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="update-value">New Value</Label>
                      {bulkUpdateField === 'status' ? (
                        <Select value={bulkUpdateValue} onValueChange={setBulkUpdateValue}>
                          <SelectTrigger id="update-value">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="archived">Archived</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          id="update-value"
                          value={bulkUpdateValue}
                          onChange={(e) => setBulkUpdateValue(e.target.value)}
                          placeholder="Enter value"
                        />
                      )}
                    </div>
                  </>
                )}
              </div>

              <Button
                onClick={handleBulkAction}
                disabled={selectedProducts.size === 0 || !bulkAction}
                className="w-full"
              >
                {bulkAction === 'delete' && <Trash2 className="mr-2 h-4 w-4" />}
                {bulkAction === 'edit' && <Edit className="mr-2 h-4 w-4" />}
                {bulkAction === 'export' && <Download className="mr-2 h-4 w-4" />}
                Apply to {selectedProducts.size} Product(s)
              </Button>
            </TabsContent>

            <TabsContent value="pricing" className="space-y-4">
              <div className="rounded-md border p-4 text-sm text-muted-foreground">
                Adjust prices for selected products. Choose to set a fixed price, or
                increase/decrease by percentage or amount.
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="price-type">Adjustment Type</Label>
                  <Select
                    value={priceAdjustmentType}
                    onValueChange={(value: any) => setPriceAdjustmentType(value)}
                  >
                    <SelectTrigger id="price-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="set">Set Price</SelectItem>
                      <SelectItem value="increase">Increase By</SelectItem>
                      <SelectItem value="decrease">Decrease By</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price-value">
                    {priceAdjustmentType === 'set' ? 'New Price' : 'Amount'}
                  </Label>
                  <Input
                    id="price-value"
                    type="number"
                    step="0.01"
                    value={priceAdjustmentValue}
                    onChange={(e) => setPriceAdjustmentValue(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <Button
                onClick={handlePriceAdjustment}
                disabled={selectedProducts.size === 0 || !priceAdjustmentValue}
                className="w-full"
              >
                <Tag className="mr-2 h-4 w-4" />
                Apply Price Change to {selectedProducts.size} Product(s)
              </Button>
            </TabsContent>

            <TabsContent value="export" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Export Products</CardTitle>
                    <CardDescription>
                      Download selected products as CSV
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      onClick={() => onExport?.(Array.from(selectedProducts))}
                      disabled={selectedProducts.size === 0}
                      className="w-full"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Export {selectedProducts.size} Product(s)
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Import Products</CardTitle>
                    <CardDescription>Upload CSV file to import products</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" className="w-full">
                      <Upload className="mr-2 h-4 w-4" />
                      Upload CSV File
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Product List</CardTitle>
              <CardDescription>
                {selectedProducts.size} of {filteredProducts.length} products selected
              </CardDescription>
            </div>

            <div className="flex gap-2">
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-[150px]" aria-label="Filter by category">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[120px]" aria-label="Filter by status">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={
                      filteredProducts.length > 0 &&
                      selectedProducts.size === filteredProducts.length
                    }
                    onCheckedChange={toggleAll}
                  />
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No products found
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedProducts.has(product.id)}
                        onCheckedChange={() => toggleProduct(product.id)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.sku}</TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell>${product.price.toFixed(2)}</TableCell>
                    <TableCell>{product.stock}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          product.status === 'active'
                            ? 'default'
                            : product.status === 'draft'
                            ? 'secondary'
                            : 'outline'
                        }
                      >
                        {product.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
