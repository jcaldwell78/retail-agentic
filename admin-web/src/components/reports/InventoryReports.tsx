import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, Download, TrendingDown, AlertTriangle, Archive, BarChart3 } from 'lucide-react';

export interface InventoryReportData {
  totalSKUs: number;
  totalValue: number;
  lowStockItems: number;
  outOfStockItems: number;
  overstockItems: number;
  averageTurnoverRate: number;
}

export interface StockMovement {
  date: string;
  received: number;
  sold: number;
  adjusted: number;
  endingBalance: number;
}

export interface ProductInventoryDetail {
  sku: string;
  name: string;
  currentStock: number;
  reorderPoint: number;
  value: number;
  turnoverRate: number;
  daysOfSupply: number;
  status: 'healthy' | 'low' | 'out' | 'overstock';
}

interface InventoryReportsProps {
  reportData?: InventoryReportData;
  stockMovements?: StockMovement[];
  productDetails?: ProductInventoryDetail[];
  onExportReport?: (format: 'csv' | 'pdf') => void;
  onGenerateReport?: (dateRange: { from: string; to: string }) => void;
}

const defaultReportData: InventoryReportData = {
  totalSKUs: 1247,
  totalValue: 234567.89,
  lowStockItems: 34,
  outOfStockItems: 12,
  overstockItems: 45,
  averageTurnoverRate: 4.5,
};

const defaultStockMovements: StockMovement[] = [
  { date: '2024-01', received: 500, sold: 450, adjusted: -10, endingBalance: 1540 },
  { date: '2024-02', received: 600, sold: 520, adjusted: 5, endingBalance: 1625 },
  { date: '2024-03', received: 550, sold: 480, adjusted: -15, endingBalance: 1680 },
  { date: '2024-04', received: 700, sold: 630, adjusted: 20, endingBalance: 1770 },
  { date: '2024-05', received: 650, sold: 590, adjusted: -5, endingBalance: 1825 },
];

const defaultProductDetails: ProductInventoryDetail[] = [
  {
    sku: 'PROD-001',
    name: 'Wireless Headphones',
    currentStock: 5,
    reorderPoint: 20,
    value: 499.95,
    turnoverRate: 6.2,
    daysOfSupply: 12,
    status: 'low',
  },
  {
    sku: 'PROD-002',
    name: 'Smart Watch',
    currentStock: 0,
    reorderPoint: 15,
    value: 0,
    turnoverRate: 5.8,
    daysOfSupply: 0,
    status: 'out',
  },
  {
    sku: 'PROD-003',
    name: 'USB-C Cable',
    currentStock: 250,
    reorderPoint: 50,
    value: 2499.75,
    turnoverRate: 2.1,
    daysOfSupply: 180,
    status: 'overstock',
  },
  {
    sku: 'PROD-004',
    name: 'Laptop Stand',
    currentStock: 45,
    reorderPoint: 25,
    value: 1349.55,
    turnoverRate: 4.5,
    daysOfSupply: 45,
    status: 'healthy',
  },
];

export default function InventoryReports({
  reportData = defaultReportData,
  stockMovements = defaultStockMovements,
  productDetails = defaultProductDetails,
  onExportReport,
  onGenerateReport,
}: InventoryReportsProps) {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedFormat, setSelectedFormat] = useState<'csv' | 'pdf'>('csv');

  const handleExport = () => {
    onExportReport?.(selectedFormat);
  };

  const handleGenerate = () => {
    if (dateFrom && dateTo) {
      onGenerateReport?.({ from: dateFrom, to: dateTo });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const getStatusColor = (status: ProductInventoryDetail['status']) => {
    const colors = {
      healthy: 'bg-green-100 text-green-700',
      low: 'bg-yellow-100 text-yellow-700',
      out: 'bg-red-100 text-red-700',
      overstock: 'bg-blue-100 text-blue-700',
    };
    return colors[status];
  };

  const getStatusIcon = (status: ProductInventoryDetail['status']) => {
    switch (status) {
      case 'low':
        return <TrendingDown className="w-4 h-4" />;
      case 'out':
        return <AlertTriangle className="w-4 h-4" />;
      case 'overstock':
        return <Archive className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6" data-testid="inventory-reports">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-8 h-8 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold">Inventory Reports</h2>
            <p className="text-sm text-gray-600">
              Analyze inventory levels, movements, and valuation
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedFormat}
            onChange={(e) => setSelectedFormat(e.target.value as 'csv' | 'pdf')}
            className="px-3 py-2 border rounded-md text-sm"
            data-testid="format-select"
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

      {/* Date Range Selector */}
      <Card className="p-4">
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-2">Date From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              data-testid="date-from"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium mb-2">Date To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              data-testid="date-to"
            />
          </div>
          <Button
            onClick={handleGenerate}
            disabled={!dateFrom || !dateTo}
            data-testid="generate-btn"
          >
            Generate Report
          </Button>
        </div>
      </Card>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="p-4">
          <div className="text-sm text-gray-600 mb-1">Total SKUs</div>
          <div className="text-2xl font-bold" data-testid="total-skus">
            {reportData.totalSKUs.toLocaleString()}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600 mb-1">Total Value</div>
          <div className="text-2xl font-bold" data-testid="total-value">
            {formatCurrency(reportData.totalValue)}
          </div>
        </Card>
        <Card className="p-4 bg-yellow-50">
          <div className="text-sm text-gray-600 mb-1">Low Stock</div>
          <div className="text-2xl font-bold text-yellow-700" data-testid="low-stock">
            {reportData.lowStockItems}
          </div>
        </Card>
        <Card className="p-4 bg-red-50">
          <div className="text-sm text-gray-600 mb-1">Out of Stock</div>
          <div className="text-2xl font-bold text-red-700" data-testid="out-of-stock">
            {reportData.outOfStockItems}
          </div>
        </Card>
        <Card className="p-4 bg-blue-50">
          <div className="text-sm text-gray-600 mb-1">Overstock</div>
          <div className="text-2xl font-bold text-blue-700" data-testid="overstock">
            {reportData.overstockItems}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600 mb-1">Avg Turnover</div>
          <div className="text-2xl font-bold" data-testid="avg-turnover">
            {reportData.averageTurnoverRate}x
          </div>
        </Card>
      </div>

      {/* Stock Movement Chart */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Stock Movement Trends</h3>
        <div className="overflow-x-auto">
          <table className="w-full" data-testid="movement-table">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">Month</th>
                <th className="px-4 py-3 text-right text-sm font-medium">Received</th>
                <th className="px-4 py-3 text-right text-sm font-medium">Sold</th>
                <th className="px-4 py-3 text-right text-sm font-medium">Adjusted</th>
                <th className="px-4 py-3 text-right text-sm font-medium">Ending Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {stockMovements.map((movement) => (
                <tr key={movement.date} data-testid={`movement-${movement.date}`}>
                  <td className="px-4 py-3 text-sm">{movement.date}</td>
                  <td className="px-4 py-3 text-sm text-right font-mono text-green-600">
                    +{movement.received}
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-mono text-red-600">
                    -{movement.sold}
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-mono">
                    {movement.adjusted >= 0 ? '+' : ''}
                    {movement.adjusted}
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-mono font-semibold">
                    {movement.endingBalance}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Product Details */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Product Inventory Details</h3>
        <div className="overflow-x-auto">
          <table className="w-full" data-testid="product-table">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">SKU</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Product</th>
                <th className="px-4 py-3 text-right text-sm font-medium">Stock</th>
                <th className="px-4 py-3 text-right text-sm font-medium">Value</th>
                <th className="px-4 py-3 text-right text-sm font-medium">Turnover</th>
                <th className="px-4 py-3 text-right text-sm font-medium">Days Supply</th>
                <th className="px-4 py-3 text-center text-sm font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {productDetails.map((product) => (
                <tr key={product.sku} data-testid={`product-${product.sku}`}>
                  <td className="px-4 py-3 text-sm font-mono">{product.sku}</td>
                  <td className="px-4 py-3 text-sm">{product.name}</td>
                  <td className="px-4 py-3 text-sm text-right font-mono">
                    {product.currentStock}
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-mono">
                    {formatCurrency(product.value)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-mono">
                    {product.turnoverRate}x
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-mono">
                    {product.daysOfSupply} days
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        product.status
                      )}`}
                    >
                      {getStatusIcon(product.status)}
                      {product.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5 border-l-4 border-red-500">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-red-600 mt-1" />
            <div>
              <h4 className="font-semibold text-red-900">Attention Needed</h4>
              <p className="text-sm text-red-700 mt-1">
                {reportData.outOfStockItems} products are out of stock and {reportData.lowStockItems} are running low.
                Review and reorder immediately.
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-5 border-l-4 border-blue-500">
          <div className="flex items-start gap-3">
            <Archive className="w-6 h-6 text-blue-600 mt-1" />
            <div>
              <h4 className="font-semibold text-blue-900">Overstock Alert</h4>
              <p className="text-sm text-blue-700 mt-1">
                {reportData.overstockItems} products have excess inventory.
                Consider promotions to move stock.
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-5 border-l-4 border-green-500">
          <div className="flex items-start gap-3">
            <BarChart3 className="w-6 h-6 text-green-600 mt-1" />
            <div>
              <h4 className="font-semibold text-green-900">Performance</h4>
              <p className="text-sm text-green-700 mt-1">
                Average turnover rate of {reportData.averageTurnoverRate}x indicates {reportData.averageTurnoverRate >= 4 ? 'healthy' : 'slow'} inventory movement.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
