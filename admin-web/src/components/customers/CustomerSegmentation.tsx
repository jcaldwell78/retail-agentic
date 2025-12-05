import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, Filter, Download, TrendingUp, DollarSign, ShoppingBag } from 'lucide-react';

export interface SegmentCriteria {
  totalSpent?: { min?: number; max?: number };
  orderCount?: { min?: number; max?: number };
  lastOrderDays?: number;
  registeredDays?: number;
  hasOrdered?: boolean;
}

export interface CustomerSegment {
  id: string;
  name: string;
  description: string;
  criteria: SegmentCriteria;
  customerCount: number;
  totalRevenue: number;
  averageOrderValue: number;
  color: string;
}

interface CustomerSegmentationProps {
  initialSegments?: CustomerSegment[];
  onCreateSegment?: (segment: Omit<CustomerSegment, 'id' | 'customerCount' | 'totalRevenue' | 'averageOrderValue'>) => void;
  onExportSegment?: (segmentId: string) => void;
}

export default function CustomerSegmentation({
  initialSegments = [],
  onCreateSegment,
  onExportSegment,
}: CustomerSegmentationProps) {
  const defaultSegments: CustomerSegment[] = initialSegments.length > 0 ? initialSegments : [
    {
      id: 'vip',
      name: 'VIP Customers',
      description: 'High-value customers with $1000+ total spend',
      criteria: { totalSpent: { min: 1000 } },
      customerCount: 127,
      totalRevenue: 234500,
      averageOrderValue: 425,
      color: 'bg-purple-100 text-purple-700 border-purple-300',
    },
    {
      id: 'frequent',
      name: 'Frequent Buyers',
      description: 'Customers with 5+ orders',
      criteria: { orderCount: { min: 5 } },
      customerCount: 342,
      totalRevenue: 156800,
      averageOrderValue: 185,
      color: 'bg-blue-100 text-blue-700 border-blue-300',
    },
    {
      id: 'recent',
      name: 'Recent Customers',
      description: 'Ordered in last 30 days',
      criteria: { lastOrderDays: 30 },
      customerCount: 589,
      totalRevenue: 98700,
      averageOrderValue: 145,
      color: 'bg-green-100 text-green-700 border-green-300',
    },
    {
      id: 'inactive',
      name: 'Inactive Customers',
      description: 'No orders in 90+ days',
      criteria: { lastOrderDays: 90 },
      customerCount: 234,
      totalRevenue: 0,
      averageOrderValue: 0,
      color: 'bg-gray-100 text-gray-700 border-gray-300',
    },
  ];

  const [segments] = useState<CustomerSegment[]>(defaultSegments);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newSegment, setNewSegment] = useState({
    name: '',
    description: '',
    minSpent: '',
    maxSpent: '',
    minOrders: '',
    maxOrders: '',
  });

  const handleCreateSegment = () => {
    if (!newSegment.name.trim()) return;

    const criteria: SegmentCriteria = {};

    if (newSegment.minSpent || newSegment.maxSpent) {
      criteria.totalSpent = {
        min: newSegment.minSpent ? parseFloat(newSegment.minSpent) : undefined,
        max: newSegment.maxSpent ? parseFloat(newSegment.maxSpent) : undefined,
      };
    }

    if (newSegment.minOrders || newSegment.maxOrders) {
      criteria.orderCount = {
        min: newSegment.minOrders ? parseInt(newSegment.minOrders) : undefined,
        max: newSegment.maxOrders ? parseInt(newSegment.maxOrders) : undefined,
      };
    }

    onCreateSegment?.({
      name: newSegment.name,
      description: newSegment.description,
      criteria,
      color: 'bg-indigo-100 text-indigo-700 border-indigo-300',
    });

    setNewSegment({
      name: '',
      description: '',
      minSpent: '',
      maxSpent: '',
      minOrders: '',
      maxOrders: '',
    });
    setShowCreateDialog(false);
  };

  const handleExport = (segmentId: string) => {
    console.log(`Exporting segment: ${segmentId}`);
    onExportSegment?.(segmentId);
  };

  const formatCurrency = (value: number): string => {
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 0 })}`;
  };

  const getCriteriaDescription = (criteria: SegmentCriteria): string => {
    const parts: string[] = [];

    if (criteria.totalSpent) {
      if (criteria.totalSpent.min && criteria.totalSpent.max) {
        parts.push(`Spent ${formatCurrency(criteria.totalSpent.min)} - ${formatCurrency(criteria.totalSpent.max)}`);
      } else if (criteria.totalSpent.min) {
        parts.push(`Spent ${formatCurrency(criteria.totalSpent.min)}+`);
      } else if (criteria.totalSpent.max) {
        parts.push(`Spent up to ${formatCurrency(criteria.totalSpent.max)}`);
      }
    }

    if (criteria.orderCount) {
      if (criteria.orderCount.min && criteria.orderCount.max) {
        parts.push(`${criteria.orderCount.min}-${criteria.orderCount.max} orders`);
      } else if (criteria.orderCount.min) {
        parts.push(`${criteria.orderCount.min}+ orders`);
      } else if (criteria.orderCount.max) {
        parts.push(`Up to ${criteria.orderCount.max} orders`);
      }
    }

    if (criteria.lastOrderDays) {
      parts.push(`Last order within ${criteria.lastOrderDays} days`);
    }

    return parts.length > 0 ? parts.join(', ') : 'Custom criteria';
  };

  return (
    <div className="space-y-6" data-testid="customer-segmentation">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="w-8 h-8 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold">Customer Segmentation</h2>
            <p className="text-sm text-gray-600">
              Organize customers into targeted groups
            </p>
          </div>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} data-testid="create-segment-btn">
          <Filter className="w-4 h-4 mr-2" />
          Create Segment
        </Button>
      </div>

      {/* Segments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {segments.map((segment) => (
          <Card
            key={segment.id}
            className={`p-5 border-2 ${segment.color}`}
            data-testid={`segment-${segment.id}`}
          >
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{segment.name}</h3>
                  <p className="text-sm mt-1">{segment.description}</p>
                  <p className="text-xs mt-2 opacity-75">
                    {getCriteriaDescription(segment.criteria)}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleExport(segment.id)}
                  data-testid={`export-${segment.id}`}
                >
                  <Download className="w-4 h-4" />
                </Button>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-3 gap-3 pt-3 border-t border-current opacity-20">
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <Users className="w-3 h-3" />
                    <span className="text-xs font-medium">Customers</span>
                  </div>
                  <div className="text-xl font-bold" data-testid={`customers-${segment.id}`}>
                    {segment.customerCount.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <DollarSign className="w-3 h-3" />
                    <span className="text-xs font-medium">Revenue</span>
                  </div>
                  <div className="text-xl font-bold" data-testid={`revenue-${segment.id}`}>
                    {formatCurrency(segment.totalRevenue)}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <ShoppingBag className="w-3 h-3" />
                    <span className="text-xs font-medium">AOV</span>
                  </div>
                  <div className="text-xl font-bold" data-testid={`aov-${segment.id}`}>
                    {formatCurrency(segment.averageOrderValue)}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Summary Stats */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center gap-4">
          <TrendingUp className="w-8 h-8 text-blue-600" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2">Segmentation Overview</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-gray-600">Total Segments</div>
                <div className="text-2xl font-bold" data-testid="total-segments">
                  {segments.length}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Total Customers</div>
                <div className="text-2xl font-bold" data-testid="total-customers">
                  {segments.reduce((sum, s) => sum + s.customerCount, 0).toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Total Revenue</div>
                <div className="text-2xl font-bold" data-testid="total-revenue">
                  {formatCurrency(segments.reduce((sum, s) => sum + s.totalRevenue, 0))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Create Segment Dialog */}
      {showCreateDialog && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          data-testid="create-segment-dialog"
        >
          <Card className="w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">Create Customer Segment</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Segment Name *</label>
                <Input
                  value={newSegment.name}
                  onChange={(e) => setNewSegment({ ...newSegment, name: e.target.value })}
                  placeholder="e.g., Big Spenders"
                  data-testid="segment-name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <Input
                  value={newSegment.description}
                  onChange={(e) => setNewSegment({ ...newSegment, description: e.target.value })}
                  placeholder="Brief description of this segment"
                  data-testid="segment-description"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-2">Min Total Spent ($)</label>
                  <Input
                    type="number"
                    value={newSegment.minSpent}
                    onChange={(e) => setNewSegment({ ...newSegment, minSpent: e.target.value })}
                    placeholder="0"
                    data-testid="min-spent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Max Total Spent ($)</label>
                  <Input
                    type="number"
                    value={newSegment.maxSpent}
                    onChange={(e) => setNewSegment({ ...newSegment, maxSpent: e.target.value })}
                    placeholder="No limit"
                    data-testid="max-spent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-2">Min Orders</label>
                  <Input
                    type="number"
                    value={newSegment.minOrders}
                    onChange={(e) => setNewSegment({ ...newSegment, minOrders: e.target.value })}
                    placeholder="0"
                    data-testid="min-orders"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Max Orders</label>
                  <Input
                    type="number"
                    value={newSegment.maxOrders}
                    onChange={(e) => setNewSegment({ ...newSegment, maxOrders: e.target.value })}
                    placeholder="No limit"
                    data-testid="max-orders"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleCreateSegment}
                  disabled={!newSegment.name.trim()}
                  className="flex-1"
                  data-testid="save-segment"
                >
                  Create Segment
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateDialog(false);
                    setNewSegment({
                      name: '',
                      description: '',
                      minSpent: '',
                      maxSpent: '',
                      minOrders: '',
                      maxOrders: '',
                    });
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
