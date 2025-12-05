import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Upload, Download, FileText, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

export interface Product {
  id?: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  stock: number;
  status: 'active' | 'draft' | 'archived';
  description?: string;
}

export interface ImportResult {
  success: boolean;
  total: number;
  imported: number;
  failed: number;
  errors: ImportError[];
}

export interface ImportError {
  row: number;
  field?: string;
  message: string;
}

export interface ProductImportExportProps {
  onExport?: (format: 'csv' | 'xlsx') => void;
  onImport?: (products: Product[]) => Promise<ImportResult>;
}

export default function ProductImportExport({
  onExport,
  onImport,
}: ProductImportExportProps) {
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [previewProducts, setPreviewProducts] = useState<Product[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImportFile(file);
      setImportResult(null);
      setShowPreview(false);
      // Auto-preview when file is selected
      handlePreview(file);
    }
  };

  const handlePreview = async (file: File) => {
    try {
      const text = await file.text();
      const products = parseCSV(text);
      setPreviewProducts(products);
      setShowPreview(true);
    } catch (error) {
      console.error('Preview failed:', error);
    }
  };

  const parseCSV = (text: string): Product[] => {
    const lines = text.split('\n').filter((line) => line.trim());
    if (lines.length === 0) return [];

    // Parse header
    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());

    // Parse data rows
    const products: Product[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map((v) => v.trim());
      const product: any = {};

      headers.forEach((header, index) => {
        const value = values[index];
        if (header === 'price' || header === 'stock') {
          product[header] = parseFloat(value) || 0;
        } else {
          product[header] = value;
        }
      });

      products.push(product);
    }

    return products;
  };

  const handleImport = async () => {
    if (!importFile || !onImport) return;

    setIsImporting(true);
    try {
      const result = await onImport(previewProducts);
      setImportResult(result);
    } catch (error) {
      setImportResult({
        success: false,
        total: previewProducts.length,
        imported: 0,
        failed: previewProducts.length,
        errors: [
          {
            row: 0,
            message: error instanceof Error ? error.message : 'Import failed',
          },
        ],
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleExport = (format: 'csv' | 'xlsx') => {
    onExport?.(format);
  };

  const downloadTemplate = () => {
    const template = `name,sku,category,price,stock,status,description
Sample Product,SKU-001,Electronics,99.99,100,active,This is a sample product
Another Product,SKU-002,Clothing,29.99,50,active,Another sample product`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'product-import-template.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Product Import/Export</CardTitle>
          <CardDescription>
            Import products from CSV files or export your product catalog
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="import" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="import">Import Products</TabsTrigger>
              <TabsTrigger value="export">Export Products</TabsTrigger>
            </TabsList>

            <TabsContent value="import" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">CSV Import</CardTitle>
                  <CardDescription>
                    Upload a CSV file to import products in bulk
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="csv-file">Choose CSV File</Label>
                    <div className="flex gap-2">
                      <input
                        id="csv-file"
                        type="file"
                        accept=".csv"
                        onChange={handleFileChange}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      />
                      <Button
                        variant="outline"
                        onClick={downloadTemplate}
                        className="flex-shrink-0"
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        Download Template
                      </Button>
                    </div>
                    {importFile && (
                      <p className="text-sm text-muted-foreground">
                        Selected: {importFile.name} ({(importFile.size / 1024).toFixed(2)} KB)
                      </p>
                    )}
                  </div>

                  {showPreview && previewProducts.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Preview ({previewProducts.length} products)</Label>
                        <Button
                          onClick={handleImport}
                          disabled={isImporting}
                          data-testid="import-button"
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          {isImporting ? 'Importing...' : `Import ${previewProducts.length} Products`}
                        </Button>
                      </div>
                      <div className="max-h-64 overflow-auto rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Name</TableHead>
                              <TableHead>SKU</TableHead>
                              <TableHead>Category</TableHead>
                              <TableHead>Price</TableHead>
                              <TableHead>Stock</TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {previewProducts.slice(0, 10).map((product, index) => (
                              <TableRow key={index}>
                                <TableCell>{product.name}</TableCell>
                                <TableCell>{product.sku}</TableCell>
                                <TableCell>{product.category}</TableCell>
                                <TableCell>${product.price?.toFixed(2) ?? '0.00'}</TableCell>
                                <TableCell>{product.stock ?? 0}</TableCell>
                                <TableCell>
                                  <Badge variant={product.status === 'active' ? 'default' : 'secondary'}>
                                    {product.status}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                            {previewProducts.length > 10 && (
                              <TableRow>
                                <TableCell colSpan={6} className="text-center text-muted-foreground">
                                  ... and {previewProducts.length - 10} more products
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}

                  {importResult && (
                    <div
                      className={`rounded-md border p-4 ${
                        importResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                      }`}
                      data-testid="import-result"
                    >
                      <div className="flex items-start gap-3">
                        {importResult.success ? (
                          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <h4 className={`font-semibold ${importResult.success ? 'text-green-900' : 'text-red-900'}`}>
                            {importResult.success ? 'Import Successful' : 'Import Failed'}
                          </h4>
                          <p className={`text-sm ${importResult.success ? 'text-green-700' : 'text-red-700'}`}>
                            {importResult.imported} of {importResult.total} products imported successfully
                            {importResult.failed > 0 && `, ${importResult.failed} failed`}
                          </p>

                          {importResult.errors.length > 0 && (
                            <div className="mt-3 space-y-1">
                              <p className="text-sm font-medium text-red-900">Errors:</p>
                              <ul className="list-disc list-inside space-y-1">
                                {importResult.errors.slice(0, 5).map((error, index) => (
                                  <li key={index} className="text-sm text-red-700">
                                    Row {error.row}
                                    {error.field && ` (${error.field})`}: {error.message}
                                  </li>
                                ))}
                                {importResult.errors.length > 5 && (
                                  <li className="text-sm text-red-600">
                                    ... and {importResult.errors.length - 5} more errors
                                  </li>
                                )}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    Import Guidelines
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• CSV file must include headers: name, sku, category, price, stock, status</li>
                    <li>• SKU must be unique for each product</li>
                    <li>• Price and stock must be valid numbers</li>
                    <li>• Status must be one of: active, draft, archived</li>
                    <li>• Maximum file size: 5MB</li>
                    <li>• Recommended maximum: 1000 products per import</li>
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="export" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Export as CSV</CardTitle>
                    <CardDescription>
                      Download all products in CSV format
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      onClick={() => handleExport('csv')}
                      className="w-full"
                      data-testid="export-csv-button"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Export CSV
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Export as Excel</CardTitle>
                    <CardDescription>
                      Download all products in Excel format
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      onClick={() => handleExport('xlsx')}
                      variant="outline"
                      className="w-full"
                      data-testid="export-xlsx-button"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Export Excel
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Export Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Exported files include all product fields</li>
                    <li>• CSV format is compatible with Excel and Google Sheets</li>
                    <li>• Excel format preserves formatting and data types</li>
                    <li>• Large catalogs may take a moment to generate</li>
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
