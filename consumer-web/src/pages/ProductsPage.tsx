import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ProductQuickView } from '@/components/ProductQuickView';
import { Eye } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewCount: number;
  category: string[];
  imageUrl?: string;
  description: string;
  images: string[];
  inStock: boolean;
  stockCount: number;
  colors?: string[];
  sizes?: string[];
}

export default function ProductsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('featured');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);

  // Mock product data
  const [products] = useState<Product[]>([
    {
      id: '1',
      name: 'Wireless Headphones',
      price: 99.99,
      originalPrice: 129.99,
      rating: 4.5,
      reviewCount: 128,
      category: ['Electronics', 'Audio'],
      description: 'Premium wireless headphones with noise cancellation',
      images: ['🎧', '📦', '🔊', '🎵'],
      inStock: true,
      stockCount: 45,
      colors: ['Black', 'Silver', 'Blue'],
      sizes: ['Standard'],
    },
    {
      id: '2',
      name: 'Smart Watch',
      price: 249.99,
      rating: 4.8,
      reviewCount: 234,
      category: ['Electronics', 'Wearables'],
      description: 'Fitness tracking and notifications on your wrist',
      images: ['⌚', '📱', '💪', '🏃'],
      inStock: true,
      stockCount: 32,
      colors: ['Black', 'Silver', 'Rose Gold'],
      sizes: ['40mm', '44mm'],
    },
    {
      id: '3',
      name: 'Cotton T-Shirt',
      price: 29.99,
      rating: 4.2,
      reviewCount: 89,
      category: ['Fashion', 'Apparel'],
      description: 'Comfortable 100% cotton t-shirt',
      images: ['👕', '🎨', '✨', '🌟'],
      inStock: true,
      stockCount: 156,
      colors: ['White', 'Black', 'Gray', 'Navy'],
      sizes: ['S', 'M', 'L', 'XL'],
    },
    {
      id: '4',
      name: 'Running Shoes',
      price: 89.99,
      originalPrice: 119.99,
      rating: 4.6,
      reviewCount: 167,
      category: ['Sports', 'Footwear'],
      description: 'Lightweight running shoes for athletes',
      images: ['👟', '🏃', '⚡', '🎯'],
      inStock: true,
      stockCount: 78,
      colors: ['Black', 'White', 'Red', 'Blue'],
      sizes: ['8', '9', '10', '11', '12'],
    },
    {
      id: '5',
      name: 'Laptop Stand',
      price: 49.99,
      rating: 4.4,
      reviewCount: 92,
      category: ['Electronics', 'Accessories'],
      description: 'Ergonomic aluminum laptop stand',
      images: ['💻', '📐', '⚙️', '🖥️'],
      inStock: true,
      stockCount: 64,
      colors: ['Silver', 'Space Gray'],
      sizes: ['Standard'],
    },
    {
      id: '6',
      name: 'Water Bottle',
      price: 19.99,
      rating: 4.7,
      reviewCount: 203,
      category: ['Sports', 'Accessories'],
      description: 'Insulated stainless steel water bottle',
      images: ['🧴', '💧', '♻️', '🌊'],
      inStock: true,
      stockCount: 124,
      colors: ['Silver', 'Black', 'Blue', 'Pink'],
      sizes: ['500ml', '750ml', '1L'],
    },
  ]);

  const categories = ['all', 'Electronics', 'Fashion', 'Sports', 'Home'];

  const handleQuickView = (product: Product, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setQuickViewProduct(product);
    setIsQuickViewOpen(true);
  };

  const handleCloseQuickView = () => {
    setIsQuickViewOpen(false);
    setQuickViewProduct(null);
  };

  // Filter and sort products
  const filteredProducts = products
    .filter((product) => {
      const matchesSearch = product.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === 'all' ||
        product.category.includes(selectedCategory);
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === 'price-low') return a.price - b.price;
      if (sortBy === 'price-high') return b.price - a.price;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return 0; // featured
    });

  return (
    <div className="min-h-screen bg-gray-50" data-testid="products-page">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            to="/"
            className="text-sm text-gray-600 hover:text-gray-900 inline-flex items-center"
          >
            ← Back to Home
          </Link>
          <h1 className="mt-4 text-3xl font-bold text-gray-900">All Products</h1>
          <p className="mt-2 text-gray-600">
            {filteredProducts.length} products found
          </p>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar - Filters */}
          <aside className="lg:col-span-1">
            <Card className="p-4 sticky top-4">
              <h2 className="font-semibold text-lg mb-4">Filters</h2>

              {/* Search */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Search</label>
                <Input
                  type="search"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  data-testid="product-search-input"
                />
              </div>

              {/* Categories */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Category</label>
                <div className="space-y-2">
                  {categories.map((category) => (
                    <label key={category} className="flex items-center">
                      <input
                        type="radio"
                        name="category"
                        value={category}
                        checked={selectedCategory === category}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="mr-2"
                        data-testid={`category-${category}`}
                      />
                      <span className="text-sm capitalize">{category}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Price Range</label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    <span className="text-sm">Under $50</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    <span className="text-sm">$50 - $100</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    <span className="text-sm">$100 - $200</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    <span className="text-sm">Over $200</span>
                  </label>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
              >
                Clear Filters
              </Button>
            </Card>
          </aside>

          {/* Main Content - Product Grid */}
          <div className="lg:col-span-3">
            {/* Toolbar */}
            <div className="bg-white rounded-lg p-4 mb-6 flex justify-between items-center flex-wrap gap-4">
              <div className="flex gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  data-testid="grid-view-button"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  data-testid="list-view-button"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </Button>
              </div>

              <select
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                data-testid="sort-select"
              >
                <option value="featured">Featured</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="name">Name: A to Z</option>
              </select>
            </div>

            {/* Products */}
            {filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                  />
                </svg>
                <h3 className="mt-4 text-lg font-medium text-gray-900">
                  No products found
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  Try adjusting your search or filter criteria
                </p>
              </div>
            ) : (
              <div
                className={
                  viewMode === 'grid'
                    ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-6'
                    : 'space-y-4'
                }
                data-testid="products-grid"
              >
                {filteredProducts.map((product) => (
                  <div key={product.id} className="relative group">
                    <Link to={`/products/${product.id}`}>
                      <Card
                        className={`overflow-hidden hover:shadow-lg transition-shadow ${
                          viewMode === 'list' ? 'flex' : ''
                        }`}
                      >
                        <div
                          className={`bg-gray-200 flex items-center justify-center relative ${
                            viewMode === 'list'
                              ? 'w-32 h-32 flex-shrink-0'
                              : 'aspect-square'
                          }`}
                        >
                          <span className="text-4xl">{product.images[0]}</span>
                          {/* Quick View Button - shows on hover */}
                          <button
                            onClick={(e) => handleQuickView(product, e)}
                            className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            data-testid={`quick-view-${product.id}`}
                          >
                            <Eye className="w-6 h-6 text-white mr-2" />
                            <span className="text-white font-medium">Quick View</span>
                          </button>
                        </div>
                        <CardContent
                          className={`p-4 ${viewMode === 'list' ? 'flex-1' : ''}`}
                        >
                          <h3 className="font-semibold mb-2 line-clamp-1">
                            {product.name}
                          </h3>
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                            {product.description}
                          </p>
                          <div className="flex justify-between items-center">
                            <div>
                              <span className="text-xl font-bold">
                                ${product.price.toFixed(2)}
                              </span>
                              {product.originalPrice && (
                                <span className="text-sm text-gray-500 line-through ml-2">
                                  ${product.originalPrice.toFixed(2)}
                                </span>
                              )}
                            </div>
                            <Button size="sm">Add to Cart</Button>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {filteredProducts.length > 0 && (
              <div className="mt-8 flex justify-center gap-2">
                <Button variant="outline" disabled>
                  Previous
                </Button>
                <Button variant="outline">1</Button>
                <Button variant="outline" disabled>
                  Next
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Product Quick View Modal */}
      <ProductQuickView
        product={quickViewProduct}
        isOpen={isQuickViewOpen}
        onClose={handleCloseQuickView}
      />
    </div>
  );
}
