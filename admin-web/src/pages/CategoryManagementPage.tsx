import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FolderTree, Plus, Edit, Trash2, ChevronRight, ChevronDown } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parent?: string;
  productCount: number;
  isActive: boolean;
  children?: Category[];
}

export default function CategoryManagementPage() {
  const [categories, setCategories] = useState<Category[]>([
    {
      id: '1',
      name: 'Electronics',
      slug: 'electronics',
      description: 'Electronic devices and accessories',
      productCount: 234,
      isActive: true,
      children: [
        {
          id: '1-1',
          name: 'Computers',
          slug: 'computers',
          parent: '1',
          productCount: 89,
          isActive: true,
        },
        {
          id: '1-2',
          name: 'Audio',
          slug: 'audio',
          parent: '1',
          productCount: 76,
          isActive: true,
        },
        {
          id: '1-3',
          name: 'Cameras',
          slug: 'cameras',
          parent: '1',
          productCount: 45,
          isActive: true,
        },
      ],
    },
    {
      id: '2',
      name: 'Clothing',
      slug: 'clothing',
      description: 'Apparel and fashion items',
      productCount: 456,
      isActive: true,
      children: [
        {
          id: '2-1',
          name: "Men's Clothing",
          slug: 'mens-clothing',
          parent: '2',
          productCount: 198,
          isActive: true,
        },
        {
          id: '2-2',
          name: "Women's Clothing",
          slug: 'womens-clothing',
          parent: '2',
          productCount: 258,
          isActive: true,
        },
      ],
    },
    {
      id: '3',
      name: 'Home & Garden',
      slug: 'home-garden',
      description: 'Home improvement and garden supplies',
      productCount: 178,
      isActive: true,
    },
  ]);

  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['1', '2']));
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [_editingCategory, _setEditingCategory] = useState<Category | null>(null);
  const [newCategory, setNewCategory] = useState({
    name: '',
    slug: '',
    description: '',
    parent: '',
  });

  const toggleExpand = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const handleAddCategory = () => {
    const newCat: Category = {
      id: `new-${Date.now()}`,
      name: newCategory.name,
      slug: newCategory.slug || newCategory.name.toLowerCase().replace(/\s+/g, '-'),
      description: newCategory.description,
      parent: newCategory.parent || undefined,
      productCount: 0,
      isActive: true,
    };

    if (newCategory.parent) {
      // Add as child
      setCategories(categories.map(cat => {
        if (cat.id === newCategory.parent) {
          return {
            ...cat,
            children: [...(cat.children || []), newCat],
          };
        }
        return cat;
      }));
    } else {
      // Add as top-level
      setCategories([...categories, newCat]);
    }

    setNewCategory({ name: '', slug: '', description: '', parent: '' });
    setShowAddDialog(false);
  };

  const handleDeleteCategory = (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;

    setCategories(categories.filter(cat => {
      if (cat.id === categoryId) return false;
      if (cat.children) {
        cat.children = cat.children.filter(child => child.id !== categoryId);
      }
      return true;
    }));
  };

  const CategoryRow = ({ category, level = 0 }: { category: Category; level?: number }) => {
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expandedCategories.has(category.id);

    return (
      <>
        <div
          className={`flex items-center gap-2 p-4 hover:bg-gray-50 border-b ${
            level > 0 ? 'bg-gray-50' : ''
          }`}
          style={{ paddingLeft: `${1 + level * 2}rem` }}
          data-testid={`category-${category.slug}`}
        >
          {/* Expand/Collapse */}
          <button
            onClick={() => toggleExpand(category.id)}
            className={`w-5 h-5 flex items-center justify-center ${
              !hasChildren ? 'invisible' : ''
            }`}
            data-testid={`toggle-${category.slug}`}
          >
            {hasChildren && (isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />)}
          </button>

          {/* Category Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-medium">{category.name}</h3>
              {!category.isActive && (
                <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">
                  Inactive
                </span>
              )}
            </div>
            {category.description && (
              <p className="text-sm text-gray-600 truncate">{category.description}</p>
            )}
          </div>

          {/* Product Count */}
          <div className="text-sm text-gray-600 w-20 text-right">
            {category.productCount} items
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => _setEditingCategory(category)}
              data-testid={`edit-${category.slug}`}
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleDeleteCategory(category.id)}
              data-testid={`delete-${category.slug}`}
            >
              <Trash2 className="w-4 h-4 text-red-600" />
            </Button>
          </div>
        </div>

        {/* Children */}
        {hasChildren && isExpanded && category.children?.map(child => (
          <CategoryRow key={child.id} category={child} level={level + 1} />
        ))}
      </>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50" data-testid="category-management-page">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <FolderTree className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold">Category Management</h1>
              <p className="text-gray-600">Organize and manage product categories</p>
            </div>
          </div>
          <Button onClick={() => setShowAddDialog(true)} data-testid="add-category">
            <Plus className="w-4 h-4 mr-2" />
            Add Category
          </Button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="p-4">
            <div className="text-sm text-gray-600">Total Categories</div>
            <div className="text-2xl font-bold">{categories.length}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-gray-600">Total Products</div>
            <div className="text-2xl font-bold">
              {categories.reduce((sum, cat) => sum + cat.productCount + (cat.children?.reduce((s, c) => s + c.productCount, 0) || 0), 0)}
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-gray-600">Active Categories</div>
            <div className="text-2xl font-bold">
              {categories.filter(c => c.isActive).length}
            </div>
          </Card>
        </div>

        {/* Category List */}
        <Card>
          <div className="p-4 border-b bg-gray-50">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Search categories..."
                className="max-w-xs"
                data-testid="search-categories"
              />
            </div>
          </div>

          <div>
            {categories.map(category => (
              <CategoryRow key={category.id} category={category} />
            ))}
          </div>
        </Card>

        {/* Add Category Dialog */}
        {showAddDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" data-testid="add-category-dialog">
            <Card className="w-full max-w-md p-6">
              <h2 className="text-xl font-bold mb-4">Add New Category</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Category Name *</label>
                  <Input
                    value={newCategory.name}
                    onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                    placeholder="e.g., Electronics"
                    data-testid="category-name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Slug</label>
                  <Input
                    value={newCategory.slug}
                    onChange={(e) => setNewCategory({ ...newCategory, slug: e.target.value })}
                    placeholder="e.g., electronics (auto-generated if empty)"
                    data-testid="category-slug"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    value={newCategory.description}
                    onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                    placeholder="Category description"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows={3}
                    data-testid="category-description"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Parent Category</label>
                  <select
                    value={newCategory.parent}
                    onChange={(e) => setNewCategory({ ...newCategory, parent: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    data-testid="category-parent"
                  >
                    <option value="">None (Top Level)</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={handleAddCategory}
                    disabled={!newCategory.name}
                    className="flex-1"
                    data-testid="save-category"
                  >
                    Add Category
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowAddDialog(false);
                      setNewCategory({ name: '', slug: '', description: '', parent: '' });
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
    </div>
  );
}
