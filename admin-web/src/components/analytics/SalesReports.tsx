import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, TrendingUp, TrendingDown, DollarSign, ShoppingCart, Package, Users } from 'lucide-react';

export interface SalesMetric {
  label: string;
  value: number;
  change: number;
  trend: 'up' | 'down' | 'neutral';
  format: 'currency' | 'number' | 'percentage';
}

export interface SalesDataPoint {
  date: string;
  sales: number;
  orders: number;
  customers: number;
}

export interface ProductSales {
  productId: string;
  productName: string;
  unitsSold: number;
  revenue: number;
  averagePrice: number;
}

interface SalesReportsProps {
  dateRange?: { from: Date; to: Date };
  initialMetrics?: SalesMetric[];
  initialSalesData?: SalesDataPoint[];
  initialTopProducts?: ProductSales[];
  onExport?: (format: 'csv' | 'pdf') => void;
}

export default function SalesReports({
  dateRange,
  initialMetrics = [],
  initialSalesData = [],
  initialTopProducts = [],
  onExport,
}: SalesReportsProps) {
  const [exportFormat, setExportFormat] = useState<'csv' | 'pdf'>('csv');

  const defaultMetrics: SalesMetric[] = initialMetrics.length > 0 ? initialMetrics : [
    {
      label: 'Total Revenue',
      value: 125840.50,
      change: 12.5,
      trend: 'up',
      format: 'currency',
    },
    {
      label: 'Total Orders',
      value: 1248,
      change: 8.3,
      trend: 'up',
      format: 'number',
    },
    {
      label: 'Average Order Value',
      value: 100.83,
      change: 3.2,
      trend: 'up',
      format: 'currency',
    },
    {
      label: 'Total Customers',
      value: 892,
      change: -2.1,
      trend: 'down',
      format: 'number',
    },
  ];

  const defaultSalesData: SalesDataPoint[] = initialSalesData.length > 0 ? initialSalesData : [
    { date: '2024-01-01', sales: 12500, orders: 125, customers: 89 },
    { date: '2024-01-02', sales: 15200, orders: 142, customers: 102 },
    { date: '2024-01-03', sales: 13800, orders: 131, customers: 95 },
    { date: '2024-01-04', sales: 16400, orders: 156, customers: 112 },
    { date: '2024-01-05', sales: 14900, orders: 138, customers: 98 },
    { date: '2024-01-06', sales: 18200, orders: 167, customers: 124 },
    { date: '2024-01-07', sales: 19600, orders: 178, customers: 131 },
  ];

  const defaultTopProducts: ProductSales[] = initialTopProducts.length > 0 ? initialTopProducts : [
    {
      productId: 'p1',
      productName: 'Wireless Headphones Pro',
      unitsSold: 234,
      revenue: 23400.00,
      averagePrice: 100.00,
    },
    {
      productId: 'p2',
      productName: 'Smart Watch Series 5',
      unitsSold: 189,
      revenue: 56700.00,
      averagePrice: 300.00,
    },
    {
      productId: 'p3',
      productName: 'USB-C Cable Pack',
      unitsSold: 567,
      revenue: 5670.00,
      averagePrice: 10.00,
    },
    {
      productId: 'p4',
      productName: 'Laptop Stand Aluminum',
      unitsSold: 145,
      revenue: 7250.00,
      averagePrice: 50.00,
    },
    {
      productId: 'p5',
      productName: 'Mechanical Keyboard RGB',
      unitsSold: 98,
      revenue: 14700.00,
      averagePrice: 150.00,
    },
  ];

  const [metrics] = useState<SalesMetric[]>(defaultMetrics);
  const [salesData] = useState<SalesDataPoint[]>(defaultSalesData);
  const [topProducts] = useState<ProductSales[]>(defaultTopProducts);

  const formatValue = (value: number, format: SalesMetric['format']): string => {
    switch (format) {
      case 'currency':
        return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'number':
        return value.toLocaleString('en-US');
      default:
        return value.toString();
    }
  };

  const formatChange = (change: number): string => {
    const sign = change > 0 ? '+' : '';
    return `${sign}${change.toFixed(1)}%`;
  };

  const getMetricIcon = (label: string) => {
    if (label.includes('Revenue') || label.includes('Value')) {
      return <DollarSign className="w-5 h-5" />;
    }
    if (label.includes('Orders')) {
      return <ShoppingCart className="w-5 h-5" />;
    }
    if (label.includes('Products')) {
      return <Package className="w-5 h-5" />;
    }
    if (label.includes('Customers')) {
      return <Users className="w-5 h-5" />;
    }
    return <TrendingUp className="w-5 h-5" />;
  };

  const handleExport = () => {
    console.log(`Exporting report as ${exportFormat}`);
    onExport?.(exportFormat);
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-6" data-testid="sales-reports">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Sales Reports</h2>
          {dateRange && (
            <p className="text-sm text-gray-600 mt-1">
              {dateRange.from.toLocaleDateString()} - {dateRange.to.toLocaleDateString()}
            </p>
          )}
        </div>

        {/* Export */}
        <div className="flex items-center gap-2">
          <select
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value as 'csv' | 'pdf')}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            data-testid="export-format-select"
          >
            <option value="csv">CSV</option>
            <option value="pdf">PDF</option>
          </select>
          <Button onClick={handleExport} size="sm" data-testid="export-btn">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => (
          <Card key={index} className="p-4" data-testid={`metric-${index}`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  {getMetricIcon(metric.label)}
                  <span className="text-sm font-medium">{metric.label}</span>
                </div>
                <div className="text-2xl font-bold" data-testid={`metric-value-${index}`}>
                  {formatValue(metric.value, metric.format)}
                </div>
                <div className="flex items-center gap-1 mt-1">
                  {metric.trend === 'up' ? (
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  ) : metric.trend === 'down' ? (
                    <TrendingDown className="w-4 h-4 text-red-600" />
                  ) : null}
                  <span
                    className={`text-sm font-medium ${
                      metric.trend === 'up'
                        ? 'text-green-600'
                        : metric.trend === 'down'
                        ? 'text-red-600'
                        : 'text-gray-600'
                    }`}
                    data-testid={`metric-change-${index}`}
                  >
                    {formatChange(metric.change)}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Sales Trend Chart (Simple Table View) */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Sales Trend</h3>
        <div className="overflow-x-auto">
          <table className="w-full" data-testid="sales-trend-table">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-3 text-sm font-medium text-gray-600">Date</th>
                <th className="text-right py-2 px-3 text-sm font-medium text-gray-600">Sales</th>
                <th className="text-right py-2 px-3 text-sm font-medium text-gray-600">Orders</th>
                <th className="text-right py-2 px-3 text-sm font-medium text-gray-600">Customers</th>
              </tr>
            </thead>
            <tbody>
              {salesData.map((data, index) => (
                <tr key={index} className="border-b hover:bg-gray-50" data-testid={`sales-row-${index}`}>
                  <td className="py-3 px-3 text-sm">{formatDate(data.date)}</td>
                  <td className="py-3 px-3 text-sm text-right font-medium">
                    {formatValue(data.sales, 'currency')}
                  </td>
                  <td className="py-3 px-3 text-sm text-right">{data.orders}</td>
                  <td className="py-3 px-3 text-sm text-right">{data.customers}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 font-semibold">
                <td className="py-3 px-3 text-sm">Total</td>
                <td className="py-3 px-3 text-sm text-right" data-testid="total-sales">
                  {formatValue(
                    salesData.reduce((sum, d) => sum + d.sales, 0),
                    'currency'
                  )}
                </td>
                <td className="py-3 px-3 text-sm text-right" data-testid="total-orders">
                  {salesData.reduce((sum, d) => sum + d.orders, 0)}
                </td>
                <td className="py-3 px-3 text-sm text-right" data-testid="total-customers">
                  {salesData.reduce((sum, d) => sum + d.customers, 0)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      {/* Top Products */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Top Products by Revenue</h3>
        <div className="overflow-x-auto">
          <table className="w-full" data-testid="top-products-table">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-3 text-sm font-medium text-gray-600">Rank</th>
                <th className="text-left py-2 px-3 text-sm font-medium text-gray-600">Product</th>
                <th className="text-right py-2 px-3 text-sm font-medium text-gray-600">Units Sold</th>
                <th className="text-right py-2 px-3 text-sm font-medium text-gray-600">Revenue</th>
                <th className="text-right py-2 px-3 text-sm font-medium text-gray-600">Avg Price</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.map((product, index) => (
                <tr
                  key={product.productId}
                  className="border-b hover:bg-gray-50"
                  data-testid={`product-row-${index}`}
                >
                  <td className="py-3 px-3 text-sm">
                    <div className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-700 rounded-full font-semibold text-xs">
                      {index + 1}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-sm font-medium">{product.productName}</td>
                  <td className="py-3 px-3 text-sm text-right">{product.unitsSold.toLocaleString()}</td>
                  <td className="py-3 px-3 text-sm text-right font-medium">
                    {formatValue(product.revenue, 'currency')}
                  </td>
                  <td className="py-3 px-3 text-sm text-right text-gray-600">
                    {formatValue(product.averagePrice, 'currency')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
