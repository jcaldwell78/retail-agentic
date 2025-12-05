import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DollarSign, AlertCircle, CheckCircle, RefreshCw, CreditCard } from 'lucide-react';

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  total: number;
}

export interface RefundRequest {
  orderId: string;
  items: RefundItem[];
  reason: RefundReason;
  notes?: string;
  refundAmount: number;
  refundShipping: boolean;
  method: 'original' | 'store_credit';
}

export interface RefundItem {
  itemId: string;
  quantity: number;
  amount: number;
}

export type RefundReason =
  | 'defective'
  | 'wrong_item'
  | 'not_as_described'
  | 'customer_request'
  | 'damaged'
  | 'other';

interface RefundInterfaceProps {
  orderId: string;
  orderTotal: number;
  shippingCost: number;
  items: OrderItem[];
  onRefundSubmit?: (refund: RefundRequest) => void;
  onCancel?: () => void;
}

export default function RefundInterface({
  orderId,
  orderTotal,
  shippingCost,
  items,
  onRefundSubmit,
  onCancel,
}: RefundInterfaceProps) {
  const [selectedItems, setSelectedItems] = useState<Map<string, number>>(new Map());
  const [reason, setReason] = useState<RefundReason>('customer_request');
  const [notes, setNotes] = useState('');
  const [refundShipping, setRefundShipping] = useState(false);
  const [refundMethod, setRefundMethod] = useState<'original' | 'store_credit'>('original');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const handleQuantityChange = (itemId: string, quantity: number) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    const newSelected = new Map(selectedItems);
    if (quantity > 0 && quantity <= item.quantity) {
      newSelected.set(itemId, quantity);
    } else {
      newSelected.delete(itemId);
    }
    setSelectedItems(newSelected);
  };

  const calculateRefundAmount = (): number => {
    let total = 0;
    selectedItems.forEach((quantity, itemId) => {
      const item = items.find(i => i.id === itemId);
      if (item) {
        total += (item.price * quantity);
      }
    });
    if (refundShipping) {
      total += shippingCost;
    }
    return total;
  };

  const refundAmount = calculateRefundAmount();

  const handleSubmit = async () => {
    if (refundAmount === 0) {
      alert('Please select items to refund');
      return;
    }

    setIsProcessing(true);

    const refundItems: RefundItem[] = Array.from(selectedItems.entries()).map(([itemId, quantity]) => {
      const item = items.find(i => i.id === itemId)!;
      return {
        itemId,
        quantity,
        amount: item.price * quantity,
      };
    });

    const refundRequest: RefundRequest = {
      orderId,
      items: refundItems,
      reason,
      notes: notes.trim() || undefined,
      refundAmount,
      refundShipping,
      method: refundMethod,
    };

    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 1500));

    onRefundSubmit?.(refundRequest);
    setIsProcessing(false);
    setIsComplete(true);
  };

  const getReasonLabel = (reason: RefundReason): string => {
    const labels: Record<RefundReason, string> = {
      defective: 'Defective Product',
      wrong_item: 'Wrong Item Sent',
      not_as_described: 'Not as Described',
      customer_request: 'Customer Request',
      damaged: 'Damaged in Shipping',
      other: 'Other',
    };
    return labels[reason];
  };

  if (isComplete) {
    return (
      <Card className="p-8 text-center max-w-md mx-auto" data-testid="refund-complete">
        <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Refund Processed</h2>
        <p className="text-gray-600 mb-4">
          Refund of ${refundAmount.toFixed(2)} has been initiated
        </p>
        <p className="text-sm text-gray-600">
          {refundMethod === 'original'
            ? 'Funds will be returned to the original payment method within 3-5 business days'
            : 'Store credit has been issued to the customer account'}
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6" data-testid="refund-interface">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Process Refund</h2>
          <p className="text-gray-600">Order #{orderId}</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-600">Order Total</div>
          <div className="text-2xl font-bold">${orderTotal.toFixed(2)}</div>
        </div>
      </div>

      {/* Items Selection */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Select Items to Refund</h3>
        <div className="space-y-3">
          {items.map((item) => {
            const selectedQty = selectedItems.get(item.id) || 0;
            return (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 border rounded-lg"
                data-testid={`item-${item.id}`}
              >
                <div className="flex-1">
                  <h4 className="font-medium">{item.productName}</h4>
                  <p className="text-sm text-gray-600">
                    ${item.price.toFixed(2)} × {item.quantity} = ${item.total.toFixed(2)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600">Qty to refund:</label>
                    <Input
                      type="number"
                      min="0"
                      max={item.quantity}
                      value={selectedQty}
                      onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 0)}
                      className="w-20"
                      data-testid={`qty-${item.id}`}
                    />
                  </div>
                  {selectedQty > 0 && (
                    <div className="text-right min-w-[80px]">
                      <span className="text-sm text-gray-600">Refund: </span>
                      <span className="font-semibold">
                        ${(item.price * selectedQty).toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Shipping Refund */}
        <div className="mt-4 pt-4 border-t">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={refundShipping}
              onChange={(e) => setRefundShipping(e.target.checked)}
              className="rounded"
              data-testid="refund-shipping"
            />
            <span className="flex-1">Refund shipping cost</span>
            <span className="font-semibold">${shippingCost.toFixed(2)}</span>
          </label>
        </div>
      </Card>

      {/* Refund Details */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Refund Details</h3>

        <div className="space-y-4">
          {/* Reason */}
          <div>
            <label className="block text-sm font-medium mb-2">Reason for Refund *</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as RefundReason)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              data-testid="refund-reason"
            >
              <option value="customer_request">{getReasonLabel('customer_request')}</option>
              <option value="defective">{getReasonLabel('defective')}</option>
              <option value="wrong_item">{getReasonLabel('wrong_item')}</option>
              <option value="not_as_described">{getReasonLabel('not_as_described')}</option>
              <option value="damaged">{getReasonLabel('damaged')}</option>
              <option value="other">{getReasonLabel('other')}</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium mb-2">Notes (Optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional details about this refund..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md resize-none"
              rows={3}
              data-testid="refund-notes"
            />
          </div>

          {/* Refund Method */}
          <div>
            <label className="block text-sm font-medium mb-2">Refund Method</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRefundMethod('original')}
                className={`p-4 border-2 rounded-lg transition-colors ${
                  refundMethod === 'original'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                data-testid="method-original"
              >
                <CreditCard className="w-6 h-6 mx-auto mb-2" />
                <div className="text-sm font-medium">Original Payment</div>
                <div className="text-xs text-gray-600">3-5 business days</div>
              </button>
              <button
                type="button"
                onClick={() => setRefundMethod('store_credit')}
                className={`p-4 border-2 rounded-lg transition-colors ${
                  refundMethod === 'store_credit'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                data-testid="method-credit"
              >
                <DollarSign className="w-6 h-6 mx-auto mb-2" />
                <div className="text-sm font-medium">Store Credit</div>
                <div className="text-xs text-gray-600">Instant</div>
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Refund Summary */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3 mb-4">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900 mb-2">Refund Summary</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Items:</span>
                <span className="font-medium">{selectedItems.size} item(s)</span>
              </div>
              <div className="flex justify-between">
                <span>Total Refund Amount:</span>
                <span className="font-bold text-lg">${refundAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>Method:</span>
                <span>{refundMethod === 'original' ? 'Original Payment' : 'Store Credit'}</span>
              </div>
            </div>
          </div>
        </div>

        {refundAmount === 0 && (
          <p className="text-sm text-blue-700">
            Please select items to refund
          </p>
        )}
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          onClick={handleSubmit}
          disabled={refundAmount === 0 || isProcessing}
          className="flex-1"
          data-testid="submit-refund"
        >
          {isProcessing ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Processing Refund...
            </>
          ) : (
            <>
              <DollarSign className="w-4 h-4 mr-2" />
              Process Refund ${refundAmount.toFixed(2)}
            </>
          )}
        </Button>
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={isProcessing}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
