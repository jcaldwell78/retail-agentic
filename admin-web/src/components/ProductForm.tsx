import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';

interface ProductFormData {
  name: string;
  sku: string;
  description: string;
  price: string;
  currency: string;
  stock: string;
  category: string[];
  status: 'ACTIVE' | 'INACTIVE' | 'DISCONTINUED';
}

interface ProductFormProps {
  initialData?: Partial<ProductFormData>;
  onSubmit: (data: ProductFormData) => void;
  onCancel: () => void;
  isEditing?: boolean;
}

export function ProductForm({ initialData, onSubmit, onCancel, isEditing = false }: ProductFormProps) {
  const [formData, setFormData] = useState<ProductFormData>({
    name: initialData?.name || '',
    sku: initialData?.sku || '',
    description: initialData?.description || '',
    price: initialData?.price || '',
    currency: initialData?.currency || 'USD',
    stock: initialData?.stock || '0',
    category: initialData?.category || [],
    status: initialData?.status || 'ACTIVE',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof ProductFormData, string>>>({});

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof ProductFormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    }

    if (!formData.sku.trim()) {
      newErrors.sku = 'SKU is required';
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      newErrors.price = 'Price must be greater than 0';
    }

    if (!formData.stock || parseInt(formData.stock) < 0) {
      newErrors.stock = 'Stock must be 0 or greater';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} data-testid="product-form">
      <Card className="p-6">
        <div className="space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter product name"
                  data-testid="product-name-input"
                />
                {errors.name && (
                  <p className="text-sm text-red-500 mt-1">{errors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  SKU <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  placeholder="e.g., PROD-001"
                  data-testid="product-sku-input"
                />
                {errors.sku && (
                  <p className="text-sm text-red-500 mt-1">{errors.sku}</p>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter product description"
              data-testid="product-description-input"
            />
          </div>

          {/* Pricing & Inventory */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Pricing & Inventory</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Price <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0.00"
                  data-testid="product-price-input"
                />
                {errors.price && (
                  <p className="text-sm text-red-500 mt-1">{errors.price}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Currency</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  data-testid="product-currency-select"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Stock <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  placeholder="0"
                  data-testid="product-stock-input"
                />
                {errors.stock && (
                  <p className="text-sm text-red-500 mt-1">{errors.stock}</p>
                )}
              </div>
            </div>
          </div>

          {/* Category & Status */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Category & Status</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium mb-2">Category</label>
                <Input
                  value={formData.category.join(', ')}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      category: e.target.value.split(',').map((c) => c.trim()).filter(Boolean),
                    })
                  }
                  placeholder="Electronics, Gadgets"
                  data-testid="product-category-input"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Separate multiple categories with commas
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Status</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      status: e.target.value as 'ACTIVE' | 'INACTIVE' | 'DISCONTINUED',
                    })
                  }
                  data-testid="product-status-select"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="DISCONTINUED">Discontinued</option>
                </select>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button type="submit" data-testid="submit-product-button">
              {isEditing ? 'Update Product' : 'Create Product'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} data-testid="cancel-product-button">
              Cancel
            </Button>
          </div>
        </div>
      </Card>
    </form>
  );
}
