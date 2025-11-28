import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  TrendingUp,
  TrendingDown,
  Package,
  DollarSign,
  ShoppingCart,
  Eye,
  Download
} from 'lucide-react';

export interface ProductPerformanceData {
  productId: string;
  productName: string;
  sku: string;
  category: string;
  unitsSold: number;
  revenue: number;
  views: number;
  conversionRate: number;
  averageRating: number;
  reviewCount: number;
  stockLevel: number;
  profitMargin: number;
}

export interface PerformanceMetric {
  label: string;
  value: number;
  change: number;
  trend: 'up' | 'down' | 'neutral';
  format: 'currency' | 'number' | 'percentage';
}

interface ProductPerformanceReportsProps {
  initialProducts?: ProductPerformanceData[];
  initialMetrics?: PerformanceMetric[];
  dateRange?: { from: Date; to: Date };
  onExport?: (format: 'csv' | 'pdf') => void;
}

export default function ProductPerformanceReports({
  initialProducts = [],
  initialMetrics = [],
  dateRange,
  onExport,
}: ProductPerformanceReportsProps) {
  const defaultMetrics: PerformanceMetric[] = initialMetrics.length > 0 ? initialMetrics : [
    {
      label: 'Total Products Sold',
      value: 3456,
      change: 15.3,
      trend: 'up',
      format: 'number',
    },
    {
      label: 'Total Revenue',
      value: 234567.89,
      change: 12.8,
      trend: 'up',
      format: 'currency',
    },
    {
      label: 'Average Conversion Rate',
      value: 3.45,
      change: -0.5,
      trend: 'down',
      format: 'percentage',
    },
    {
      label: 'Average Product Rating',
      value: 4.3,
      change: 0.2,
      trend: 'up',
      format: 'number',
    },
  ];

  const defaultProducts: ProductPerformanceData[] = initialProducts.length > 0 ? initialProducts : [
    {
      productId: 'p1',
      productName: 'Wireless Headphones Pro',
      sku: 'WHP-001',
      category: 'Electronics',
      unitsSold: 456,
      revenue: 45600.00,
      views: 12340,
      conversionRate: 3.7,
      averageRating: 4.5,
      reviewCount: 234,
      stockLevel: 45,
      profitMargin: 35.5,
    },
    {
      productId: 'p2',
      productName: 'Smart Watch Series 5',
      sku: 'SWS-005',
      category: 'Electronics',
      unitsSold: 342,
      revenue: 85500.00,
      views: 23450,
      conversionRate: 1.46,
      averageRating: 4.8,
      reviewCount: 456,
      stockLevel: 12,
      profitMargin: 42.3,
    },
    {
      productId: 'p3',
      productName: 'USB-C Cable Pack',
      sku: 'USB-101',
      category: 'Accessories',
      unitsSold: 1234,
      revenue: 12340.00,
      views: 34560,
      conversionRate: 3.57,
      averageRating: 4.2,
      reviewCount: 123,
      stockLevel: 156,
      profitMargin: 55.8,
    },
    {
      productId: 'p4',
      productName: 'Laptop Stand Aluminum',
      sku: 'LPS-202',
      category: 'Accessories',
      unitsSold: 234,
      revenue: 11700.00,
      views: 8900,
      conversionRate: 2.63,
      averageRating: 4.6,
      reviewCount: 89,
      stockLevel: 67,
      profitMargin: 48.2,
    },
    {
      productId: 'p5',
      productName: 'Mechanical Keyboard RGB',
      sku: 'MKB-303',
      category: 'Electronics',
      unitsSold: 189,
      revenue: 28350.00,
      views: 15600,
      conversionRate: 1.21,
      averageRating: 4.7,
      reviewCount: 167,
      stockLevel: 23,
      profitMargin: 38.9,
    },
  ];

  const [metrics] = useState<PerformanceMetric[]>(defaultMetrics);
  const [products] = useState<ProductPerformanceData[]>(defaultProducts);
  const [exportFormat, setExportFormat] = useState<'csv' | 'pdf'>('csv');
  const [sortBy, setSortBy] = useState<keyof ProductPerformanceData>('revenue');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const formatValue = (value: number, format: PerformanceMetric['format']): string => {
    switch (format) {
      case 'currency':
        return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      case 'percentage':
        return `${value.toFixed(2)}%`;
      case 'number':
        return value.toLocaleString('en-US');
      default:
        return value.toString();
    }
  };

  const formatChange = (change: number): string => {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(1)}%`;
  };

  const handleSort = (field: keyof ProductPerformanceData) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const sortedProducts = [...products].sort((a, b) => {
    const aValue = a[sortBy];
    const bValue = b[sortBy];

    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    }

    const aStr = String(aValue);
    const bStr = String(bValue);
    return sortOrder === 'asc'
      ? aStr.localeCompare(bStr)
      : bStr.localeCompare(aStr);
  });

  const handleExport = () => {
    onExport?.(exportFormat);
  };

  return (
    <div className="space-y-6" data-testid="product-performance-reports">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Product Performance Reports</h2>
          <p className="text-sm text-gray-600 mt-1">
            Analyze product performance and identify top performers
            {dateRange && (
              <span className="ml-2">
                ({dateRange.from.toLocaleDateString()} - {dateRange.to.toLocaleDateString()})
              </span>
            )}
          </p>
        </div>

        {/* Export Controls */}
        <div className="flex gap-2 items-center">
          <select
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value as 'csv' | 'pdf')}
            className="px-3 py-2 border rounded-md text-sm"
            data-testid="export-format-select"
          >
            <option value="csv">CSV</option>
            <option value="pdf">PDF</option>
          </select>
          <Button onClick={handleExport} data-testid="export-btn">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {metrics.map((metric, index) => (
          <Card key={index} className="p-4" data-testid={`metric-${index}`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-1">{metric.label}</p>
                <div className="text-2xl font-bold" data-testid={`metric-value-${index}`}>
                  {formatValue(metric.value, metric.format)}
                </div>
                <div
                  className={`flex items-center gap-1 text-sm font-medium mt-1 ${
                    metric.trend === 'up' ? 'text-green-600' :
                    metric.trend === 'down' ? 'text-red-600' :
                    'text-gray-600'
                  }`}
                  data-testid={`metric-change-${index}`}
                >
                  {metric.trend === 'up' ? <TrendingUp className="w-4 h-4" /> :
                   metric.trend === 'down' ? <TrendingDown className="w-4 h-4" /> : null}
                  <span>{formatChange(metric.change)}</span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Product Performance Table */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Product Performance Details</h3>

        <div className="overflow-x-auto" data-testid="product-performance-table">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3">
                  <button
                    onClick={() => handleSort('productName')}
                    className="font-semibold hover:text-blue-600"
                    data-testid="sort-product-name"
                  >
                    Product
                  </button>
                </th>
                <th className="text-left p-3">
                  <button
                    onClick={() => handleSort('category')}
                    className="font-semibold hover:text-blue-600"
                    data-testid="sort-category"
                  >
                    Category
                  </button>
                </th>
                <th className="text-right p-3">
                  <button
                    onClick={() => handleSort('unitsSold')}
                    className="font-semibold hover:text-blue-600"
                    data-testid="sort-units-sold"
                  >
                    Units Sold
                  </button>
                </th>
                <th className="text-right p-3">
                  <button
                    onClick={() => handleSort('revenue')}
                    className="font-semibold hover:text-blue-600"
                    data-testid="sort-revenue"
                  >
                    Revenue
                  </button>
                </th>
                <th className="text-right p-3">
                  <button
                    onClick={() => handleSort('views')}
                    className="font-semibold hover:text-blue-600"
                    data-testid="sort-views"
                  >
                    Views
                  </button>
                </th>
                <th className="text-right p-3">
                  <button
                    onClick={() => handleSort('conversionRate')}
                    className="font-semibold hover:text-blue-600"
                    data-testid="sort-conversion"
                  >
                    Conv. Rate
                  </button>
                </th>
                <th className="text-right p-3">
                  <button
                    onClick={() => handleSort('averageRating')}
                    className="font-semibold hover:text-blue-600"
                    data-testid="sort-rating"
                  >
                    Rating
                  </button>
                </th>
                <th className="text-right p-3">
                  <button
                    onClick={() => handleSort('profitMargin')}
                    className="font-semibold hover:text-blue-600"
                    data-testid="sort-margin"
                  >
                    Margin
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedProducts.map((product) => (
                <tr
                  key={product.productId}
                  className="border-b hover:bg-gray-50"
                  data-testid={`product-row-${product.productId}`}
                >
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-gray-400" />
                      <div>
                        <div className="font-medium">{product.productName}</div>
                        <div className="text-xs text-gray-500">{product.sku}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-sm">{product.category}</td>
                  <td className="p-3 text-right" data-testid={`units-sold-${product.productId}`}>
                    <div className="flex items-center justify-end gap-1">
                      <ShoppingCart className="w-4 h-4 text-gray-400" />
                      {product.unitsSold.toLocaleString()}
                    </div>
                  </td>
                  <td className="p-3 text-right font-medium" data-testid={`revenue-${product.productId}`}>
                    <div className="flex items-center justify-end gap-1">
                      <DollarSign className="w-4 h-4 text-gray-400" />
                      {formatValue(product.revenue, 'currency')}
                    </div>
                  </td>
                  <td className="p-3 text-right" data-testid={`views-${product.productId}`}>
                    <div className="flex items-center justify-end gap-1">
                      <Eye className="w-4 h-4 text-gray-400" />
                      {product.views.toLocaleString()}
                    </div>
                  </td>
                  <td className="p-3 text-right" data-testid={`conversion-${product.productId}`}>
                    <span className={product.conversionRate >= 3 ? 'text-green-600 font-medium' : ''}>
                      {product.conversionRate.toFixed(2)}%
                    </span>
                  </td>
                  <td className="p-3 text-right" data-testid={`rating-${product.productId}`}>
                    <div>
                      <div className="font-medium">{product.averageRating.toFixed(1)}</div>
                      <div className="text-xs text-gray-500">({product.reviewCount})</div>
                    </div>
                  </td>
                  <td className="p-3 text-right" data-testid={`margin-${product.productId}`}>
                    <span className={product.profitMargin >= 40 ? 'text-green-600 font-medium' : ''}>
                      {product.profitMargin.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 font-bold">
                <td className="p-3" colSpan={2}>Totals</td>
                <td className="p-3 text-right" data-testid="total-units">
                  {products.reduce((sum, p) => sum + p.unitsSold, 0).toLocaleString()}
                </td>
                <td className="p-3 text-right" data-testid="total-revenue">
                  {formatValue(products.reduce((sum, p) => sum + p.revenue, 0), 'currency')}
                </td>
                <td className="p-3 text-right" data-testid="total-views">
                  {products.reduce((sum, p) => sum + p.views, 0).toLocaleString()}
                </td>
                <td className="p-3 text-right" data-testid="avg-conversion">
                  {(products.reduce((sum, p) => sum + p.conversionRate, 0) / products.length).toFixed(2)}%
                </td>
                <td className="p-3 text-right" data-testid="avg-rating">
                  {(products.reduce((sum, p) => sum + p.averageRating, 0) / products.length).toFixed(1)}
                </td>
                <td className="p-3 text-right" data-testid="avg-margin">
                  {(products.reduce((sum, p) => sum + p.profitMargin, 0) / products.length).toFixed(1)}%
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      {/* Performance Insights */}
      <Card className="p-6 bg-blue-50">
        <h3 className="font-semibold mb-3">Performance Insights</h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-start gap-2" data-testid="top-performer-insight">
            <TrendingUp className="w-4 h-4 text-green-600 mt-0.5" />
            <p>
              <span className="font-medium">{sortedProducts[0]?.productName}</span> is your top performer
              with <span className="font-medium">{formatValue(sortedProducts[0]?.revenue || 0, 'currency')}</span> in revenue
            </p>
          </div>
          <div className="flex items-start gap-2" data-testid="conversion-insight">
            <ShoppingCart className="w-4 h-4 text-blue-600 mt-0.5" />
            <p>
              Products with conversion rate above 3% generate
              <span className="font-medium ml-1">
                {products.filter(p => p.conversionRate >= 3).length}
              </span> of {products.length} total products
            </p>
          </div>
          <div className="flex items-start gap-2" data-testid="stock-insight">
            <Package className="w-4 h-4 text-orange-600 mt-0.5" />
            <p>
              <span className="font-medium">
                {products.filter(p => p.stockLevel < 30).length}
              </span> product(s) have low stock levels and may need reordering
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
