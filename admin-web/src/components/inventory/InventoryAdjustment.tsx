import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Package, Plus, Minus, RefreshCw, AlertTriangle, CheckCircle, History } from 'lucide-react';

export interface InventoryItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  currentStock: number;
  minStock: number;
  maxStock?: number;
  location?: string;
}

export interface AdjustmentRecord {
  id: string;
  productId: string;
  previousStock: number;
  newStock: number;
  delta: number;
  reason: string;
  adjustedBy: string;
  timestamp: Date;
  notes?: string;
}

export type AdjustmentReason =
  | 'damage'
  | 'loss'
  | 'found'
  | 'recount'
  | 'return'
  | 'correction'
  | 'other';

interface InventoryAdjustmentProps {
  item: InventoryItem;
  onAdjust?: (adjustment: Omit<AdjustmentRecord, 'id' | 'timestamp'>) => void;
  onClose?: () => void;
  adjustmentHistory?: AdjustmentRecord[];
}

export default function InventoryAdjustment({
  item,
  onAdjust,
  onClose,
  adjustmentHistory = [],
}: InventoryAdjustmentProps) {
  const [adjustmentType, setAdjustmentType] = useState<'set' | 'add' | 'subtract'>('set');
  const [adjustmentValue, setAdjustmentValue] = useState<string>('');
  const [reason, setReason] = useState<AdjustmentReason>('correction');
  const [notes, setNotes] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const calculateNewStock = (): number => {
    const value = parseInt(adjustmentValue) || 0;
    switch (adjustmentType) {
      case 'set':
        return value;
      case 'add':
        return item.currentStock + value;
      case 'subtract':
        return Math.max(0, item.currentStock - value);
      default:
        return item.currentStock;
    }
  };

  const newStock = calculateNewStock();
  const delta = newStock - item.currentStock;

  const handleSubmit = () => {
    if (!adjustmentValue || parseInt(adjustmentValue) < 0) {
      alert('Please enter a valid adjustment value');
      return;
    }

    const adjustment: Omit<AdjustmentRecord, 'id' | 'timestamp'> = {
      productId: item.productId,
      previousStock: item.currentStock,
      newStock,
      delta,
      reason,
      adjustedBy: 'Current User', // In real app, get from auth context
      notes: notes.trim() || undefined,
    };

    onAdjust?.(adjustment);
    setShowConfirmation(true);

    // Auto-close after confirmation
    setTimeout(() => {
      setShowConfirmation(false);
      onClose?.();
    }, 2000);
  };

  const isStockLow = newStock <= item.minStock;
  const isStockHigh = item.maxStock && newStock >= item.maxStock;

  const getReasonLabel = (reason: AdjustmentReason): string => {
    const labels: Record<AdjustmentReason, string> = {
      damage: 'Damaged/Defective',
      loss: 'Lost/Stolen',
      found: 'Found/Recovered',
      recount: 'Physical Recount',
      return: 'Customer Return',
      correction: 'Data Correction',
      other: 'Other',
    };
    return labels[reason];
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (showConfirmation) {
    return (
      <Card className="p-6 max-w-md mx-auto text-center" data-testid="adjustment-confirmation">
        <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Inventory Adjusted</h2>
        <p className="text-gray-600">
          Stock level updated from {item.currentStock} to {newStock}
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6" data-testid="inventory-adjustment">
      {/* Product Info Header */}
      <Card className="p-4">
        <div className="flex items-start gap-3">
          <Package className="w-8 h-8 text-blue-600 mt-1" />
          <div className="flex-1">
            <h2 className="text-xl font-semibold">{item.productName}</h2>
            <div className="flex gap-4 mt-1 text-sm text-gray-600">
              <span>SKU: {item.sku}</span>
              {item.location && <span>Location: {item.location}</span>}
            </div>
            <div className="mt-3 flex items-center gap-4">
              <div>
                <span className="text-sm text-gray-600">Current Stock:</span>
                <span className="ml-2 text-2xl font-bold">{item.currentStock}</span>
              </div>
              <div className="text-sm text-gray-600">
                Min: {item.minStock}
                {item.maxStock && ` | Max: ${item.maxStock}`}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Adjustment Form */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Adjust Inventory</h3>

        {/* Adjustment Type */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Adjustment Type</label>
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant={adjustmentType === 'set' ? 'default' : 'outline'}
              onClick={() => setAdjustmentType('set')}
              className="flex items-center justify-center gap-2"
              data-testid="type-set"
            >
              <RefreshCw className="w-4 h-4" />
              Set To
            </Button>
            <Button
              variant={adjustmentType === 'add' ? 'default' : 'outline'}
              onClick={() => setAdjustmentType('add')}
              className="flex items-center justify-center gap-2"
              data-testid="type-add"
            >
              <Plus className="w-4 h-4" />
              Add
            </Button>
            <Button
              variant={adjustmentType === 'subtract' ? 'default' : 'outline'}
              onClick={() => setAdjustmentType('subtract')}
              className="flex items-center justify-center gap-2"
              data-testid="type-subtract"
            >
              <Minus className="w-4 h-4" />
              Subtract
            </Button>
          </div>
        </div>

        {/* Adjustment Value */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            {adjustmentType === 'set' ? 'New Stock Level' : 'Quantity'}
          </label>
          <Input
            type="number"
            min="0"
            value={adjustmentValue}
            onChange={(e) => setAdjustmentValue(e.target.value)}
            placeholder={adjustmentType === 'set' ? 'Enter new stock level' : 'Enter quantity'}
            data-testid="adjustment-value"
          />
        </div>

        {/* Preview */}
        {adjustmentValue && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm text-gray-600">Current Stock:</span>
                <span className="ml-2 font-semibold">{item.currentStock}</span>
              </div>
              <div>
                <span className="text-sm text-gray-600">New Stock:</span>
                <span className={`ml-2 font-semibold ${
                  delta > 0 ? 'text-green-600' : delta < 0 ? 'text-red-600' : ''
                }`}>
                  {newStock}
                  {delta !== 0 && (
                    <span className="text-sm ml-1">
                      ({delta > 0 ? '+' : ''}{delta})
                    </span>
                  )}
                </span>
              </div>
            </div>

            {/* Stock Warnings */}
            {isStockLow && (
              <div className="flex items-center gap-2 mt-2 text-sm text-orange-600">
                <AlertTriangle className="w-4 h-4" />
                Warning: New stock level is at or below minimum
              </div>
            )}
            {isStockHigh && (
              <div className="flex items-center gap-2 mt-2 text-sm text-blue-600">
                <AlertTriangle className="w-4 h-4" />
                Notice: New stock level is at or above maximum
              </div>
            )}
          </div>
        )}

        {/* Reason */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Reason *</label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value as AdjustmentReason)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            data-testid="reason-select"
          >
            <option value="correction">{getReasonLabel('correction')}</option>
            <option value="recount">{getReasonLabel('recount')}</option>
            <option value="damage">{getReasonLabel('damage')}</option>
            <option value="loss">{getReasonLabel('loss')}</option>
            <option value="found">{getReasonLabel('found')}</option>
            <option value="return">{getReasonLabel('return')}</option>
            <option value="other">{getReasonLabel('other')}</option>
          </select>
        </div>

        {/* Notes */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Notes (Optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any additional details about this adjustment..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md resize-none"
            rows={3}
            data-testid="adjustment-notes"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            onClick={handleSubmit}
            disabled={!adjustmentValue || parseInt(adjustmentValue) < 0}
            className="flex-1"
            data-testid="submit-adjustment"
          >
            Apply Adjustment
          </Button>
          {onClose && (
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          )}
        </div>
      </Card>

      {/* Adjustment History */}
      {adjustmentHistory.length > 0 && (
        <div>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 mb-3"
            data-testid="toggle-history"
          >
            <History className="w-4 h-4" />
            {showHistory ? 'Hide' : 'Show'} Adjustment History ({adjustmentHistory.length})
          </button>

          {showHistory && (
            <Card className="p-4">
              <div className="space-y-3">
                {adjustmentHistory.map((record) => (
                  <div
                    key={record.id}
                    className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                    data-testid={`history-${record.id}`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{getReasonLabel(record.reason as AdjustmentReason)}</span>
                        <span className={`text-sm font-semibold ${
                          record.delta > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {record.delta > 0 ? '+' : ''}{record.delta}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        {record.previousStock} → {record.newStock} units
                      </div>
                      {record.notes && (
                        <div className="text-sm text-gray-700 mt-1">{record.notes}</div>
                      )}
                      <div className="text-xs text-gray-500 mt-1">
                        By {record.adjustedBy} • {formatTimestamp(record.timestamp)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
