import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  CheckSquare,
  Square,
  Download,
  Trash2,
  Tag,
  Truck,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  date: Date;
}

export type BulkAction =
  | 'export'
  | 'update_status'
  | 'add_tag'
  | 'delete'
  | 'mark_shipped';

interface BulkOrderOperationsProps {
  orders: Order[];
  selectedOrders: Set<string>;
  onSelectionChange: (selected: Set<string>) => void;
  onBulkAction?: (action: BulkAction, orderIds: string[], data?: unknown) => Promise<void>;
}

export default function BulkOrderOperations({
  orders,
  selectedOrders,
  onSelectionChange,
  onBulkAction,
}: BulkOrderOperationsProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [showTagDialog, setShowTagDialog] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<Order['status']>('processing');
  const [tagInput, setTagInput] = useState('');

  const allSelected = orders.length > 0 && selectedOrders.size === orders.length;
  const someSelected = selectedOrders.size > 0 && !allSelected;

  const handleSelectAll = () => {
    if (allSelected) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(orders.map(o => o.id)));
    }
  };

  const handleSelectOrder = (orderId: string) => {
    const newSelected = new Set(selectedOrders);
    if (newSelected.has(orderId)) {
      newSelected.delete(orderId);
    } else {
      newSelected.add(orderId);
    }
    onSelectionChange(newSelected);
  };

  const executeBulkAction = async (action: BulkAction, data?: unknown) => {
    if (selectedOrders.size === 0) {
      alert('Please select orders first');
      return;
    }

    if (action === 'delete') {
      if (!confirm(`Are you sure you want to delete ${selectedOrders.size} order(s)?`)) {
        return;
      }
    }

    setIsProcessing(true);
    try {
      await onBulkAction?.(action, Array.from(selectedOrders), data);
      onSelectionChange(new Set()); // Clear selection after action
    } catch (error) {
      console.error('Bulk action failed:', error);
      alert('Operation failed. Please try again.');
    } finally {
      setIsProcessing(false);
      setShowStatusDialog(false);
      setShowTagDialog(false);
    }
  };

  const handleExport = async () => {
    await executeBulkAction('export');
  };

  const handleUpdateStatus = async () => {
    await executeBulkAction('update_status', { status: selectedStatus });
  };

  const handleAddTag = async () => {
    if (!tagInput.trim()) {
      alert('Please enter a tag');
      return;
    }
    await executeBulkAction('add_tag', { tag: tagInput.trim() });
    setTagInput('');
  };

  const handleMarkShipped = async () => {
    if (!confirm(`Mark ${selectedOrders.size} order(s) as shipped?`)) {
      return;
    }
    await executeBulkAction('mark_shipped');
  };

  const handleDelete = async () => {
    await executeBulkAction('delete');
  };

  return (
    <div className="space-y-4" data-testid="bulk-order-operations">
      {/* Selection Header */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={handleSelectAll}
              className="p-1 hover:bg-gray-100 rounded"
              data-testid="select-all"
            >
              {allSelected ? (
                <CheckSquare className="w-5 h-5 text-blue-600" />
              ) : someSelected ? (
                <CheckSquare className="w-5 h-5 text-blue-400" />
              ) : (
                <Square className="w-5 h-5 text-gray-400" />
              )}
            </button>
            <span className="text-sm font-medium">
              {selectedOrders.size > 0 ? (
                <span className="text-blue-600">
                  {selectedOrders.size} order(s) selected
                </span>
              ) : (
                <span className="text-gray-600">Select orders for bulk actions</span>
              )}
            </span>
          </div>

          {selectedOrders.size > 0 && (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleExport}
                disabled={isProcessing}
                data-testid="export-btn"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowStatusDialog(true)}
                disabled={isProcessing}
                data-testid="status-btn"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Update Status
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowTagDialog(true)}
                disabled={isProcessing}
                data-testid="tag-btn"
              >
                <Tag className="w-4 h-4 mr-2" />
                Add Tag
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleMarkShipped}
                disabled={isProcessing}
                data-testid="ship-btn"
              >
                <Truck className="w-4 h-4 mr-2" />
                Mark Shipped
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleDelete}
                disabled={isProcessing}
                className="text-red-600 hover:text-red-700"
                data-testid="delete-btn"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Order List */}
      <Card>
        {orders.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p>No orders to display</p>
          </div>
        ) : (
          <div className="divide-y">
            {orders.map((order) => (
              <div
                key={order.id}
                className={`p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors ${
                  selectedOrders.has(order.id) ? 'bg-blue-50' : ''
                }`}
                data-testid={`order-${order.id}`}
              >
                <button
                  onClick={() => handleSelectOrder(order.id)}
                  className="p-1 hover:bg-gray-100 rounded"
                  data-testid={`select-${order.id}`}
                >
                  {selectedOrders.has(order.id) ? (
                    <CheckSquare className="w-5 h-5 text-blue-600" />
                  ) : (
                    <Square className="w-5 h-5 text-gray-400" />
                  )}
                </button>

                <div className="flex-1 grid grid-cols-4 gap-4">
                  <div>
                    <div className="font-medium">{order.orderNumber}</div>
                    <div className="text-sm text-gray-600">{order.customerName}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Total</div>
                    <div className="font-medium">${order.total.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Status</div>
                    <span
                      className={`inline-block px-2 py-0.5 text-xs font-semibold rounded ${
                        order.status === 'delivered'
                          ? 'bg-green-100 text-green-800'
                          : order.status === 'shipped'
                          ? 'bg-blue-100 text-blue-800'
                          : order.status === 'processing'
                          ? 'bg-yellow-100 text-yellow-800'
                          : order.status === 'cancelled'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Date</div>
                    <div className="text-sm">
                      {order.date.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Update Status Dialog */}
      {showStatusDialog && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          data-testid="status-dialog"
        >
          <Card className="w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">Update Order Status</h2>
            <p className="text-sm text-gray-600 mb-4">
              Update status for {selectedOrders.size} selected order(s)
            </p>

            <div className="space-y-3 mb-6">
              <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="status"
                  value="pending"
                  checked={selectedStatus === 'pending'}
                  onChange={(e) => setSelectedStatus(e.target.value as Order['status'])}
                />
                <span>Pending</span>
              </label>
              <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="status"
                  value="processing"
                  checked={selectedStatus === 'processing'}
                  onChange={(e) => setSelectedStatus(e.target.value as Order['status'])}
                />
                <span>Processing</span>
              </label>
              <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="status"
                  value="shipped"
                  checked={selectedStatus === 'shipped'}
                  onChange={(e) => setSelectedStatus(e.target.value as Order['status'])}
                />
                <span>Shipped</span>
              </label>
              <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="status"
                  value="delivered"
                  checked={selectedStatus === 'delivered'}
                  onChange={(e) => setSelectedStatus(e.target.value as Order['status'])}
                />
                <span>Delivered</span>
              </label>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleUpdateStatus}
                disabled={isProcessing}
                className="flex-1"
                data-testid="confirm-status"
              >
                {isProcessing ? 'Updating...' : 'Update Status'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowStatusDialog(false)}
                disabled={isProcessing}
              >
                Cancel
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Add Tag Dialog */}
      {showTagDialog && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          data-testid="tag-dialog"
        >
          <Card className="w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">Add Tag</h2>
            <p className="text-sm text-gray-600 mb-4">
              Add a tag to {selectedOrders.size} selected order(s)
            </p>

            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="Enter tag name..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4"
              data-testid="tag-input"
            />

            <div className="flex gap-2">
              <Button
                onClick={handleAddTag}
                disabled={isProcessing || !tagInput.trim()}
                className="flex-1"
                data-testid="confirm-tag"
              >
                {isProcessing ? 'Adding...' : 'Add Tag'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowTagDialog(false);
                  setTagInput('');
                }}
                disabled={isProcessing}
              >
                Cancel
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
