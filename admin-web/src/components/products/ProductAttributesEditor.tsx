import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, X, Edit, Check, Settings } from 'lucide-react';

export interface AttributeOption {
  value: string;
  label: string;
}

export interface ProductAttribute {
  id: string;
  name: string;
  type: 'text' | 'number' | 'select' | 'multiselect' | 'boolean' | 'color';
  required: boolean;
  options?: AttributeOption[];
  value?: string | string[] | number | boolean;
}

interface ProductAttributesEditorProps {
  productType?: string;
  initialAttributes?: ProductAttribute[];
  onAttributesChange?: (attributes: ProductAttribute[]) => void;
  readonly?: boolean;
}

export default function ProductAttributesEditor({
  productType = 'General',
  initialAttributes = [],
  onAttributesChange,
  readonly = false,
}: ProductAttributesEditorProps) {
  const [attributes, setAttributes] = useState<ProductAttribute[]>(
    initialAttributes.length > 0
      ? initialAttributes
      : [
          {
            id: '1',
            name: 'Color',
            type: 'select',
            required: false,
            options: [
              { value: 'red', label: 'Red' },
              { value: 'blue', label: 'Blue' },
              { value: 'black', label: 'Black' },
            ],
          },
          {
            id: '2',
            name: 'Size',
            type: 'select',
            required: true,
            options: [
              { value: 'small', label: 'Small' },
              { value: 'medium', label: 'Medium' },
              { value: 'large', label: 'Large' },
            ],
          },
          {
            id: '3',
            name: 'Material',
            type: 'text',
            required: false,
          },
        ]
  );

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newAttribute, setNewAttribute] = useState({
    name: '',
    type: 'text' as ProductAttribute['type'],
    required: false,
  });

  const handleAddAttribute = () => {
    if (!newAttribute.name.trim()) return;

    const attribute: ProductAttribute = {
      id: `attr-${Date.now()}`,
      name: newAttribute.name.trim(),
      type: newAttribute.type,
      required: newAttribute.required,
      options:
        newAttribute.type === 'select' || newAttribute.type === 'multiselect'
          ? [{ value: 'option1', label: 'Option 1' }]
          : undefined,
    };

    const updated = [...attributes, attribute];
    setAttributes(updated);
    onAttributesChange?.(updated);
    setNewAttribute({ name: '', type: 'text', required: false });
    setShowAddDialog(false);
  };

  const handleRemoveAttribute = (id: string) => {
    if (!confirm('Are you sure you want to remove this attribute?')) return;

    const updated = attributes.filter((attr) => attr.id !== id);
    setAttributes(updated);
    onAttributesChange?.(updated);
  };

  const handleStartEdit = (attr: ProductAttribute) => {
    setEditingId(attr.id);
    setEditName(attr.name);
  };

  const handleSaveEdit = (id: string) => {
    if (!editName.trim()) return;

    const updated = attributes.map((attr) =>
      attr.id === id ? { ...attr, name: editName.trim() } : attr
    );
    setAttributes(updated);
    onAttributesChange?.(updated);
    setEditingId(null);
    setEditName('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName('');
  };

  const handleToggleRequired = (id: string) => {
    const updated = attributes.map((attr) =>
      attr.id === id ? { ...attr, required: !attr.required } : attr
    );
    setAttributes(updated);
    onAttributesChange?.(updated);
  };

  const handleAddOption = (attrId: string) => {
    const updated = attributes.map((attr) => {
      if (attr.id === attrId && (attr.type === 'select' || attr.type === 'multiselect')) {
        const currentOptions = attr.options || [];
        const newOptionNum = currentOptions.length + 1;
        return {
          ...attr,
          options: [
            ...currentOptions,
            { value: `option${newOptionNum}`, label: `Option ${newOptionNum}` },
          ],
        };
      }
      return attr;
    });
    setAttributes(updated);
    onAttributesChange?.(updated);
  };

  const handleRemoveOption = (attrId: string, optionValue: string) => {
    const updated = attributes.map((attr) => {
      if (attr.id === attrId && attr.options) {
        return {
          ...attr,
          options: attr.options.filter((opt) => opt.value !== optionValue),
        };
      }
      return attr;
    });
    setAttributes(updated);
    onAttributesChange?.(updated);
  };

  const handleUpdateOption = (attrId: string, optionValue: string, newLabel: string) => {
    const updated = attributes.map((attr) => {
      if (attr.id === attrId && attr.options) {
        return {
          ...attr,
          options: attr.options.map((opt) =>
            opt.value === optionValue ? { ...opt, label: newLabel } : opt
          ),
        };
      }
      return attr;
    });
    setAttributes(updated);
    onAttributesChange?.(updated);
  };

  const getTypeLabel = (type: ProductAttribute['type']): string => {
    const labels: Record<ProductAttribute['type'], string> = {
      text: 'Text',
      number: 'Number',
      select: 'Dropdown',
      multiselect: 'Multi-Select',
      boolean: 'Yes/No',
      color: 'Color',
    };
    return labels[type];
  };

  const getTypeColor = (type: ProductAttribute['type']): string => {
    const colors: Record<ProductAttribute['type'], string> = {
      text: 'bg-blue-100 text-blue-700',
      number: 'bg-green-100 text-green-700',
      select: 'bg-purple-100 text-purple-700',
      multiselect: 'bg-pink-100 text-pink-700',
      boolean: 'bg-yellow-100 text-yellow-700',
      color: 'bg-orange-100 text-orange-700',
    };
    return colors[type];
  };

  return (
    <div className="space-y-4" data-testid="product-attributes-editor">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-semibold">Product Attributes</h2>
          <span className="text-sm text-gray-600">({productType})</span>
        </div>
        {!readonly && (
          <Button
            onClick={() => setShowAddDialog(true)}
            size="sm"
            data-testid="add-attribute-btn"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Attribute
          </Button>
        )}
      </div>

      {/* Attributes List */}
      <div className="space-y-3">
        {attributes.length === 0 ? (
          <Card className="p-8 text-center">
            <Settings className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No attributes defined</p>
            <p className="text-sm text-gray-500 mt-1">
              Add custom attributes to capture product-specific details
            </p>
          </Card>
        ) : (
          attributes.map((attr) => (
            <Card key={attr.id} className="p-4" data-testid={`attribute-${attr.id}`}>
              <div className="space-y-3">
                {/* Attribute Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {editingId === attr.id ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="max-w-xs"
                          data-testid={`edit-name-${attr.id}`}
                        />
                        <Button
                          size="sm"
                          onClick={() => handleSaveEdit(attr.id)}
                          disabled={!editName.trim()}
                          data-testid={`save-name-${attr.id}`}
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCancelEdit}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{attr.name}</h3>
                        {attr.required && (
                          <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">
                            Required
                          </span>
                        )}
                        <span
                          className={`text-xs px-2 py-0.5 rounded ${getTypeColor(
                            attr.type
                          )}`}
                        >
                          {getTypeLabel(attr.type)}
                        </span>
                      </div>
                    )}
                  </div>

                  {!readonly && editingId !== attr.id && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleStartEdit(attr)}
                        className="p-1 hover:bg-gray-100 rounded"
                        title="Edit attribute name"
                        data-testid={`edit-btn-${attr.id}`}
                      >
                        <Edit className="w-4 h-4 text-gray-600" />
                      </button>
                      <button
                        onClick={() => handleRemoveAttribute(attr.id)}
                        className="p-1 hover:bg-red-50 rounded"
                        title="Remove attribute"
                        data-testid={`remove-btn-${attr.id}`}
                      >
                        <X className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Options for select/multiselect */}
                {(attr.type === 'select' || attr.type === 'multiselect') && attr.options && (
                  <div className="pl-4 space-y-2">
                    <label className="text-sm font-medium text-gray-700">Options:</label>
                    <div className="space-y-2">
                      {attr.options.map((option) => (
                        <div
                          key={option.value}
                          className="flex items-center gap-2"
                          data-testid={`option-${attr.id}-${option.value}`}
                        >
                          <Input
                            value={option.label}
                            onChange={(e) =>
                              handleUpdateOption(attr.id, option.value, e.target.value)
                            }
                            className="flex-1"
                            disabled={readonly}
                            data-testid={`option-input-${attr.id}-${option.value}`}
                          />
                          {!readonly && attr.options && attr.options.length > 1 && (
                            <button
                              onClick={() => handleRemoveOption(attr.id, option.value)}
                              className="p-1 hover:bg-red-50 rounded"
                              data-testid={`remove-option-${attr.id}-${option.value}`}
                            >
                              <X className="w-4 h-4 text-red-600" />
                            </button>
                          )}
                        </div>
                      ))}
                      {!readonly && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAddOption(attr.id)}
                          data-testid={`add-option-${attr.id}`}
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Add Option
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {/* Required toggle */}
                {!readonly && editingId !== attr.id && (
                  <div className="flex items-center gap-2 pt-2 border-t">
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={attr.required}
                        onChange={() => handleToggleRequired(attr.id)}
                        className="rounded"
                        data-testid={`required-${attr.id}`}
                      />
                      <span>Required field</span>
                    </label>
                  </div>
                )}
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Add Attribute Dialog */}
      {showAddDialog && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          data-testid="add-attribute-dialog"
        >
          <Card className="w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">Add New Attribute</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Attribute Name *</label>
                <Input
                  value={newAttribute.name}
                  onChange={(e) =>
                    setNewAttribute({ ...newAttribute, name: e.target.value })
                  }
                  placeholder="e.g., Size, Material, Capacity"
                  data-testid="new-attr-name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Attribute Type *</label>
                <select
                  value={newAttribute.type}
                  onChange={(e) =>
                    setNewAttribute({
                      ...newAttribute,
                      type: e.target.value as ProductAttribute['type'],
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  data-testid="new-attr-type"
                >
                  <option value="text">Text</option>
                  <option value="number">Number</option>
                  <option value="select">Dropdown (Single Select)</option>
                  <option value="multiselect">Multi-Select</option>
                  <option value="boolean">Yes/No</option>
                  <option value="color">Color</option>
                </select>
              </div>

              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={newAttribute.required}
                  onChange={(e) =>
                    setNewAttribute({ ...newAttribute, required: e.target.checked })
                  }
                  className="rounded"
                  data-testid="new-attr-required"
                />
                <span>Required field</span>
              </label>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleAddAttribute}
                  disabled={!newAttribute.name.trim()}
                  className="flex-1"
                  data-testid="save-new-attr"
                >
                  Add Attribute
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddDialog(false);
                    setNewAttribute({ name: '', type: 'text', required: false });
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
