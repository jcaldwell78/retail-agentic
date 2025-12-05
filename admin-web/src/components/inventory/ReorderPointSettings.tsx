import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertTriangle, Package, TrendingUp, Settings, Save } from 'lucide-react';

export interface ProductReorderSettings {
  productId: string;
  productName: string;
  sku: string;
  currentStock: number;
  reorderPoint: number;
  reorderQuantity: number;
  leadTimeDays: number;
  averageDailySales: number;
  supplier?: string;
  autoReorder: boolean;
}

interface ReorderPointSettingsProps {
  initialProducts?: ProductReorderSettings[];
  onSaveSettings?: (productId: string, settings: Partial<ProductReorderSettings>) => void;
  onBulkUpdate?: (updates: Array<{ productId: string; settings: Partial<ProductReorderSettings> }>) => void;
}

export default function ReorderPointSettings({
  initialProducts = [],
  onSaveSettings,
  onBulkUpdate,
}: ReorderPointSettingsProps) {
  const defaultProducts: ProductReorderSettings[] = initialProducts.length > 0 ? initialProducts : [
    {
      productId: 'p1',
      productName: 'Wireless Headphones Pro',
      sku: 'WHP-001',
      currentStock: 45,
      reorderPoint: 20,
      reorderQuantity: 50,
      leadTimeDays: 7,
      averageDailySales: 3.5,
      supplier: 'AudioTech Supplies',
      autoReorder: true,
    },
    {
      productId: 'p2',
      productName: 'Smart Watch Series 5',
      sku: 'SWS-005',
      currentStock: 12,
      reorderPoint: 15,
      reorderQuantity: 30,
      leadTimeDays: 10,
      averageDailySales: 2.1,
      supplier: 'TechGear Ltd',
      autoReorder: false,
    },
    {
      productId: 'p3',
      productName: 'USB-C Cable Pack',
      sku: 'USB-101',
      currentStock: 156,
      reorderPoint: 100,
      reorderQuantity: 200,
      leadTimeDays: 3,
      averageDailySales: 12.5,
      supplier: 'Cable Wholesale',
      autoReorder: true,
    },
  ];

  const [products, setProducts] = useState<ProductReorderSettings[]>(defaultProducts);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  const handleEdit = (productId: string) => {
    setEditingId(productId);
  };

  const handleSave = (productId: string) => {
    const product = products.find((p) => p.productId === productId);
    if (!product) return;

    onSaveSettings?.(productId, {
      reorderPoint: product.reorderPoint,
      reorderQuantity: product.reorderQuantity,
      leadTimeDays: product.leadTimeDays,
      autoReorder: product.autoReorder,
    });

    setEditingId(null);
    setSaved(productId);
    setTimeout(() => setSaved(null), 2000);
  };

  const handleCancel = (productId: string) => {
    // Reset to original values by re-setting the default
    const original = defaultProducts.find((p) => p.productId === productId);
    if (original) {
      setProducts(products.map((p) => (p.productId === productId ? original : p)));
    }
    setEditingId(null);
  };

  const updateProduct = (productId: string, field: keyof ProductReorderSettings, value: string | number | boolean) => {
    // Prevent NaN values for numeric fields
    const sanitizedValue = typeof value === 'number' && isNaN(value) ? 0 : value;
    setProducts(
      products.map((p) =>
        p.productId === productId ? { ...p, [field]: sanitizedValue } : p
      )
    );
  };

  const calculateSafetyStock = (product: ProductReorderSettings): number => {
    return Math.ceil(product.averageDailySales * product.leadTimeDays);
  };

  const calculateSuggestedReorderPoint = (product: ProductReorderSettings): number => {
    const safetyStock = calculateSafetyStock(product);
    return Math.ceil(safetyStock * 1.5); // Add 50% buffer
  };

  const isLowStock = (product: ProductReorderSettings): boolean => {
    return product.currentStock <= product.reorderPoint;
  };

  const handleBulkAutoReorder = (enable: boolean) => {
    const updates = products.map((p) => ({
      productId: p.productId,
      settings: { autoReorder: enable },
    }));
    onBulkUpdate?.(updates);
    setProducts(products.map((p) => ({ ...p, autoReorder: enable })));
  };

  return (
    <div className="space-y-6" data-testid="reorder-point-settings">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Settings className="w-8 h-8 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold">Reorder Point Settings</h2>
            <p className="text-sm text-gray-600">
              Configure automatic reorder thresholds for products
            </p>
          </div>
        </div>

        {/* Bulk Actions */}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleBulkAutoReorder(true)}
            data-testid="bulk-enable-auto"
          >
            Enable All Auto-Reorder
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleBulkAutoReorder(false)}
            data-testid="bulk-disable-auto"
          >
            Disable All Auto-Reorder
          </Button>
        </div>
      </div>

      {/* Products List */}
      <div className="space-y-4">
        {products.map((product) => {
          const isEditing = editingId === product.productId;
          const lowStock = isLowStock(product);
          const suggestedPoint = calculateSuggestedReorderPoint(product);

          return (
            <Card
              key={product.productId}
              className={`p-5 ${lowStock ? 'border-orange-300 bg-orange-50' : ''}`}
              data-testid={`product-${product.productId}`}
            >
              <div className="space-y-4">
                {/* Product Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <Package className="w-6 h-6 text-gray-600 mt-1" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{product.productName}</h3>
                      <div className="flex gap-4 text-sm text-gray-600 mt-1">
                        <span>SKU: {product.sku}</span>
                        {product.supplier && <span>Supplier: {product.supplier}</span>}
                      </div>
                      {lowStock && (
                        <div className="flex items-center gap-2 mt-2 text-orange-700">
                          <AlertTriangle className="w-4 h-4" />
                          <span className="text-sm font-medium">
                            Stock below reorder point - Consider reordering
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    {isEditing ? (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleSave(product.productId)}
                          data-testid={`save-${product.productId}`}
                        >
                          <Save className="w-4 h-4 mr-1" />
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCancel(product.productId)}
                        >
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(product.productId)}
                        data-testid={`edit-${product.productId}`}
                      >
                        Edit
                      </Button>
                    )}
                  </div>
                </div>

                {/* Current Stats */}
                <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <div className="text-xs text-gray-600 mb-1">Current Stock</div>
                    <div
                      className={`text-xl font-bold ${
                        lowStock ? 'text-orange-600' : 'text-gray-900'
                      }`}
                      data-testid={`current-stock-${product.productId}`}
                    >
                      {product.currentStock}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 mb-1">Avg Daily Sales</div>
                    <div className="text-xl font-bold text-gray-900">
                      {product.averageDailySales.toFixed(1)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 mb-1">Safety Stock</div>
                    <div className="text-xl font-bold text-gray-900">
                      {calculateSafetyStock(product)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 mb-1">Lead Time</div>
                    <div className="text-xl font-bold text-gray-900">
                      {product.leadTimeDays} days
                    </div>
                  </div>
                </div>

                {/* Settings Form */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Reorder Point *
                      {!isEditing && suggestedPoint !== product.reorderPoint && (
                        <span className="ml-2 text-xs text-blue-600">
                          (Suggested: {suggestedPoint})
                        </span>
                      )}
                    </label>
                    <Input
                      type="number"
                      value={product.reorderPoint}
                      onChange={(e) =>
                        updateProduct(product.productId, 'reorderPoint', parseInt(e.target.value))
                      }
                      disabled={!isEditing}
                      data-testid={`reorder-point-${product.productId}`}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Reorder Quantity *</label>
                    <Input
                      type="number"
                      value={product.reorderQuantity}
                      onChange={(e) =>
                        updateProduct(product.productId, 'reorderQuantity', parseInt(e.target.value))
                      }
                      disabled={!isEditing}
                      data-testid={`reorder-quantity-${product.productId}`}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Lead Time (days)</label>
                    <Input
                      type="number"
                      value={product.leadTimeDays}
                      onChange={(e) =>
                        updateProduct(product.productId, 'leadTimeDays', parseInt(e.target.value))
                      }
                      disabled={!isEditing}
                      data-testid={`lead-time-${product.productId}`}
                    />
                  </div>
                </div>

                {/* Auto Reorder Toggle */}
                <div className="flex items-center gap-2 pt-2 border-t">
                  <input
                    type="checkbox"
                    checked={product.autoReorder}
                    onChange={(e) =>
                      updateProduct(product.productId, 'autoReorder', e.target.checked)
                    }
                    disabled={!isEditing}
                    className="rounded"
                    data-testid={`auto-reorder-${product.productId}`}
                  />
                  <label className="text-sm font-medium">
                    Automatically create purchase orders when stock reaches reorder point
                  </label>
                </div>

                {/* Saved Indicator */}
                {saved === product.productId && (
                  <div className="flex items-center gap-2 text-green-600 text-sm">
                    <TrendingUp className="w-4 h-4" />
                    Settings saved successfully
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Summary */}
      <Card className="p-6 bg-blue-50">
        <div className="flex items-start gap-4">
          <AlertTriangle className="w-6 h-6 text-blue-600" />
          <div>
            <h3 className="font-semibold mb-1">Low Stock Alerts</h3>
            <p className="text-sm text-gray-700">
              {products.filter(isLowStock).length} product(s) currently below reorder point
            </p>
            <p className="text-xs text-gray-600 mt-1">
              {products.filter((p) => p.autoReorder).length} product(s) have auto-reorder enabled
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
