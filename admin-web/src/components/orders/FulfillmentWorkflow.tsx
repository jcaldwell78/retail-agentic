import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Package, Truck, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';

export interface FulfillmentStep {
  id: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  label: string;
  timestamp?: Date;
  notes?: string;
}

export interface ShippingInfo {
  carrier: string;
  trackingNumber: string;
  estimatedDelivery?: Date;
  shippedAt?: Date;
}

interface FulfillmentWorkflowProps {
  orderId: string;
  currentStatus: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  onStatusUpdate?: (status: string, data?: any) => void;
}

export default function FulfillmentWorkflow({
  orderId,
  currentStatus,
  onStatusUpdate,
}: FulfillmentWorkflowProps) {
  const [steps, setSteps] = useState<FulfillmentStep[]>([
    {
      id: 'payment_verified',
      status: currentStatus === 'pending' ? 'pending' : 'completed',
      label: 'Payment Verified',
      timestamp: currentStatus !== 'pending' ? new Date(Date.now() - 86400000) : undefined,
    },
    {
      id: 'items_picked',
      status: currentStatus === 'pending' ? 'pending' : currentStatus === 'processing' ? 'in_progress' : 'completed',
      label: 'Items Picked from Warehouse',
      timestamp: currentStatus !== 'pending' && currentStatus !== 'processing' ? new Date(Date.now() - 43200000) : undefined,
    },
    {
      id: 'items_packed',
      status: currentStatus === 'shipped' || currentStatus === 'delivered' ? 'completed' : currentStatus === 'processing' ? 'in_progress' : 'pending',
      label: 'Items Packed',
      timestamp: currentStatus === 'shipped' || currentStatus === 'delivered' ? new Date(Date.now() - 21600000) : undefined,
    },
    {
      id: 'label_created',
      status: currentStatus === 'shipped' || currentStatus === 'delivered' ? 'completed' : 'pending',
      label: 'Shipping Label Created',
      timestamp: currentStatus === 'shipped' || currentStatus === 'delivered' ? new Date(Date.now() - 10800000) : undefined,
    },
    {
      id: 'shipped',
      status: currentStatus === 'shipped' || currentStatus === 'delivered' ? 'completed' : 'pending',
      label: 'Package Shipped',
      timestamp: currentStatus === 'shipped' || currentStatus === 'delivered' ? new Date(Date.now() - 7200000) : undefined,
    },
    {
      id: 'delivered',
      status: currentStatus === 'delivered' ? 'completed' : 'pending',
      label: 'Delivered to Customer',
      timestamp: currentStatus === 'delivered' ? new Date() : undefined,
    },
  ]);

  const [shippingInfo, setShippingInfo] = useState<ShippingInfo>({
    carrier: 'FedEx',
    trackingNumber: '',
    estimatedDelivery: new Date(Date.now() + 259200000), // 3 days from now
  });

  const [showShippingForm, setShowShippingForm] = useState(false);
  const [notes, setNotes] = useState('');

  const getStatusIcon = (status: FulfillmentStep['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'in_progress':
        return <Clock className="w-5 h-5 text-blue-600 animate-pulse" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <div className="w-5 h-5 rounded-full border-2 border-gray-300" />;
    }
  };

  const handleCompleteStep = (stepId: string) => {
    setSteps(steps.map(step => {
      if (step.id === stepId) {
        return { ...step, status: 'completed', timestamp: new Date() };
      }
      return step;
    }));
  };

  const handleMarkAsShipped = () => {
    if (!shippingInfo.trackingNumber) {
      alert('Please enter a tracking number');
      return;
    }

    const updatedInfo = {
      ...shippingInfo,
      shippedAt: new Date(),
    };
    setShippingInfo(updatedInfo);

    setSteps(steps.map(step => {
      if (step.id === 'shipped') {
        return { ...step, status: 'completed', timestamp: new Date() };
      }
      return step;
    }));

    onStatusUpdate?.('shipped', { shippingInfo: updatedInfo, notes });
    setShowShippingForm(false);
  };

  const handleMarkAsDelivered = () => {
    setSteps(steps.map(step => {
      if (step.id === 'delivered') {
        return { ...step, status: 'completed', timestamp: new Date() };
      }
      return step;
    }));
    onStatusUpdate?.('delivered', { notes });
  };

  const formatTimestamp = (date?: Date) => {
    if (!date) return null;
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6" data-testid="fulfillment-workflow">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Fulfillment Workflow</h2>
          <p className="text-sm text-gray-600">Order #{orderId}</p>
        </div>
        <div className="flex gap-2">
          {currentStatus === 'processing' && (
            <Button
              size="sm"
              onClick={() => setShowShippingForm(!showShippingForm)}
              data-testid="mark-shipped-btn"
            >
              <Truck className="w-4 h-4 mr-2" />
              Mark as Shipped
            </Button>
          )}
          {currentStatus === 'shipped' && (
            <Button
              size="sm"
              onClick={handleMarkAsDelivered}
              data-testid="mark-delivered-btn"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Mark as Delivered
            </Button>
          )}
        </div>
      </div>

      {/* Shipping Form */}
      {showShippingForm && (
        <Card className="p-4 bg-blue-50 border-blue-200" data-testid="shipping-form">
          <h3 className="font-semibold mb-3">Shipping Information</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Carrier</label>
              <select
                value={shippingInfo.carrier}
                onChange={(e) => setShippingInfo({ ...shippingInfo, carrier: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                data-testid="carrier-select"
              >
                <option value="FedEx">FedEx</option>
                <option value="UPS">UPS</option>
                <option value="USPS">USPS</option>
                <option value="DHL">DHL</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Tracking Number *</label>
              <Input
                value={shippingInfo.trackingNumber}
                onChange={(e) => setShippingInfo({ ...shippingInfo, trackingNumber: e.target.value })}
                placeholder="Enter tracking number"
                data-testid="tracking-number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Estimated Delivery</label>
              <input
                type="date"
                value={shippingInfo.estimatedDelivery?.toISOString().split('T')[0]}
                onChange={(e) => setShippingInfo({ ...shippingInfo, estimatedDelivery: new Date(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                data-testid="estimated-delivery"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Notes (Optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes about the shipment..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows={3}
                data-testid="shipping-notes"
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleMarkAsShipped}
                disabled={!shippingInfo.trackingNumber}
                className="flex-1"
                data-testid="confirm-shipped"
              >
                Confirm Shipment
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowShippingForm(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Fulfillment Steps */}
      <Card className="p-6">
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div key={step.id} className="relative" data-testid={`step-${step.id}`}>
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div
                  className={`absolute left-2.5 top-8 w-0.5 h-12 ${
                    step.status === 'completed' ? 'bg-green-600' : 'bg-gray-300'
                  }`}
                />
              )}

              {/* Step Content */}
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-1">
                  {getStatusIcon(step.status)}
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3
                      className={`font-medium ${
                        step.status === 'completed'
                          ? 'text-gray-900'
                          : step.status === 'in_progress'
                          ? 'text-blue-600'
                          : 'text-gray-500'
                      }`}
                    >
                      {step.label}
                    </h3>
                    {step.timestamp && (
                      <span className="text-sm text-gray-600">
                        {formatTimestamp(step.timestamp)}
                      </span>
                    )}
                  </div>

                  {step.notes && (
                    <p className="text-sm text-gray-600 mt-1">{step.notes}</p>
                  )}

                  {step.status === 'in_progress' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCompleteStep(step.id)}
                      className="mt-2"
                      data-testid={`complete-${step.id}`}
                    >
                      Mark as Complete
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Shipping Details (if shipped) */}
      {(currentStatus === 'shipped' || currentStatus === 'delivered') && shippingInfo.trackingNumber && (
        <Card className="p-4">
          <div className="flex items-start gap-3">
            <Package className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold mb-2">Shipping Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Carrier:</span>
                  <span className="ml-2 font-medium">{shippingInfo.carrier}</span>
                </div>
                <div>
                  <span className="text-gray-600">Tracking Number:</span>
                  <span className="ml-2 font-medium">{shippingInfo.trackingNumber}</span>
                </div>
                {shippingInfo.shippedAt && (
                  <div>
                    <span className="text-gray-600">Shipped At:</span>
                    <span className="ml-2 font-medium">{formatTimestamp(shippingInfo.shippedAt)}</span>
                  </div>
                )}
                {shippingInfo.estimatedDelivery && (
                  <div>
                    <span className="text-gray-600">Est. Delivery:</span>
                    <span className="ml-2 font-medium">
                      {shippingInfo.estimatedDelivery.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Alert for Attention */}
      {currentStatus === 'processing' && (
        <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-yellow-900 mb-1">Action Required</h3>
            <p className="text-sm text-yellow-700">
              This order is ready to be shipped. Please complete the picking and packing process,
              then mark the order as shipped with tracking information.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
