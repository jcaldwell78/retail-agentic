import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Package, Upload, Download, AlertCircle, CheckCircle2 } from 'lucide-react';

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  currentStock: number;
  warehouseLocation?: string;
}

export interface BulkUpdateItem {
  sku: string;
  quantity: number;
  operation: 'set' | 'add' | 'subtract';
  reason?: string;
}

export interface BulkUpdateResult {
  success: boolean;
  sku: string;
  message: string;
  previousStock?: number;
  newStock?: number;
}

interface BulkInventoryUpdateProps {
  items?: InventoryItem[];
  onBulkUpdate?: (updates: BulkUpdateItem[]) => Promise<BulkUpdateResult[]>;
  onExportTemplate?: () => void;
}

export default function BulkInventoryUpdate({
  items = [],
  onBulkUpdate,
  onExportTemplate,
}: BulkInventoryUpdateProps) {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [operation, setOperation] = useState<'set' | 'add' | 'subtract'>('set');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [updateResults, setUpdateResults] = useState<BulkUpdateResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const filteredItems = items.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(new Set(filteredItems.map((item) => item.id)));
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleSelectItem = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedItems);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedItems(newSelected);
  };

  const handleManualUpdate = async () => {
    if (selectedItems.size === 0 || !quantity) return;

    setIsProcessing(true);

    const updates: BulkUpdateItem[] = Array.from(selectedItems).map((id) => {
      const item = items.find((i) => i.id === id);
      return {
        sku: item?.sku || '',
        quantity: parseInt(quantity),
        operation,
        reason: reason || undefined,
      };
    });

    try {
      const results = await onBulkUpdate?.(updates);
      setUpdateResults(results || []);
      setShowResults(true);
      setSelectedItems(new Set());
      setQuantity('');
      setReason('');
    } catch (error) {
      console.error('Bulk update failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);
    setIsProcessing(true);

    // Parse CSV file
    const text = await file.text();
    const lines = text.split('\n').filter((line) => line.trim());
    const headers = lines[0].toLowerCase().split(',');

    const skuIndex = headers.indexOf('sku');
    const quantityIndex = headers.indexOf('quantity');
    const operationIndex = headers.indexOf('operation');
    const reasonIndex = headers.indexOf('reason');

    if (skuIndex === -1 || quantityIndex === -1) {
      alert('CSV must contain "SKU" and "Quantity" columns');
      setIsProcessing(false);
      setUploadedFile(null);
      return;
    }

    const updates: BulkUpdateItem[] = lines.slice(1).map((line) => {
      const values = line.split(',').map((v) => v.trim());
      return {
        sku: values[skuIndex],
        quantity: parseInt(values[quantityIndex]),
        operation: (values[operationIndex] || 'set') as 'set' | 'add' | 'subtract',
        reason: values[reasonIndex] || undefined,
      };
    });

    try {
      const results = await onBulkUpdate?.(updates);
      setUpdateResults(results || []);
      setShowResults(true);
      setUploadedFile(null);
    } catch (error) {
      console.error('Bulk update failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportTemplate = () => {
    if (onExportTemplate) {
      onExportTemplate();
    } else {
      // Default CSV template
      const csv = 'SKU,Quantity,Operation,Reason\nEXAMPLE-001,100,set,Initial stock\n';
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'inventory-update-template.csv';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const successCount = updateResults.filter((r) => r.success).length;
  const failureCount = updateResults.filter((r) => !r.success).length;

  return (
    <div className="space-y-6" data-testid="bulk-inventory-update">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Package className="w-8 h-8 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold">Bulk Inventory Update</h2>
            <p className="text-sm text-gray-600">
              Update multiple products at once manually or via CSV
            </p>
          </div>
        </div>
      </div>

      {/* Upload Section */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Upload CSV File</h3>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label
              htmlFor="csv-upload"
              className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50"
              data-testid="csv-upload-label"
            >
              <Upload className="w-5 h-5 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">
                {uploadedFile ? uploadedFile.name : 'Choose CSV file or drag and drop'}
              </span>
              <input
                id="csv-upload"
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
                data-testid="csv-upload-input"
              />
            </label>
          </div>
          <Button
            variant="outline"
            onClick={handleExportTemplate}
            data-testid="export-template-btn"
          >
            <Download className="w-4 h-4 mr-2" />
            Download Template
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          CSV format: SKU, Quantity, Operation (set/add/subtract), Reason
        </p>
      </Card>

      {/* Manual Update Section */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Manual Bulk Update</h3>

        {/* Search */}
        <div className="mb-4">
          <Input
            placeholder="Search products by name or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="search-input"
          />
        </div>

        {/* Product List */}
        <div className="border rounded-lg overflow-hidden mb-4">
          <table className="w-full" data-testid="product-table">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedItems.size === filteredItems.length && filteredItems.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    data-testid="select-all-checkbox"
                  />
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium">SKU</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Product Name</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Current Stock</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Location</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedItems.has(item.id)}
                      onChange={(e) => handleSelectItem(item.id, e.target.checked)}
                      data-testid={`checkbox-${item.id}`}
                    />
                  </td>
                  <td className="px-4 py-3 text-sm font-mono">{item.sku}</td>
                  <td className="px-4 py-3 text-sm">{item.name}</td>
                  <td className="px-4 py-3 text-sm font-semibold">{item.currentStock}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{item.warehouseLocation || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredItems.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p>No products found</p>
            </div>
          )}
        </div>

        {/* Update Controls */}
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-2">Operation</label>
            <select
              value={operation}
              onChange={(e) => setOperation(e.target.value as 'set' | 'add' | 'subtract')}
              className="w-full px-3 py-2 border rounded-md"
              data-testid="operation-select"
            >
              <option value="set">Set to</option>
              <option value="add">Add</option>
              <option value="subtract">Subtract</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Quantity</label>
            <Input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="0"
              data-testid="quantity-input"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium mb-2">Reason (optional)</label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Stock correction, Warehouse transfer"
              data-testid="reason-input"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {selectedItems.size} product(s) selected
          </div>
          <Button
            onClick={handleManualUpdate}
            disabled={selectedItems.size === 0 || !quantity || isProcessing}
            data-testid="apply-update-btn"
          >
            {isProcessing ? 'Processing...' : `Apply to ${selectedItems.size} product(s)`}
          </Button>
        </div>
      </Card>

      {/* Results */}
      {showResults && (
        <Card className="p-6" data-testid="update-results">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Update Results</h3>
            <Button variant="outline" size="sm" onClick={() => setShowResults(false)}>
              Close
            </Button>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-green-700">{successCount}</div>
                <div className="text-sm text-green-600">Successful</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg">
              <AlertCircle className="w-6 h-6 text-red-600" />
              <div>
                <div className="text-2xl font-bold text-red-700">{failureCount}</div>
                <div className="text-sm text-red-600">Failed</div>
              </div>
            </div>
          </div>

          {/* Detailed Results */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {updateResults.map((result, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border ${
                  result.success
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}
                data-testid={`result-${index}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {result.success ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-600" />
                    )}
                    <span className="font-mono text-sm">{result.sku}</span>
                  </div>
                  {result.previousStock !== undefined && result.newStock !== undefined && (
                    <span className="text-sm text-gray-600">
                      {result.previousStock} → {result.newStock}
                    </span>
                  )}
                </div>
                <p className={`text-sm mt-1 ${result.success ? 'text-green-700' : 'text-red-700'}`}>
                  {result.message}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
