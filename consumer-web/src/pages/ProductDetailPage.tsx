import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState('Black');
  const [selectedSize, setSelectedSize] = useState('Medium');

  // Mock product data
  const product = {
    id,
    name: 'Wireless Headphones',
    price: 99.99,
    originalPrice: 129.99,
    rating: 4.5,
    reviewCount: 128,
    description:
      'Premium wireless headphones with active noise cancellation. Enjoy crystal-clear audio with deep bass and crisp highs. Features 30-hour battery life, quick charge capability, and comfortable over-ear design perfect for long listening sessions.',
    features: [
      'Active Noise Cancellation (ANC)',
      '30-hour battery life',
      'Quick charge - 5 min for 2 hours playback',
      'Bluetooth 5.0',
      'Foldable design with carrying case',
      'Built-in microphone for calls',
    ],
    specifications: {
      Brand: 'Premium Audio',
      Model: 'WH-1000XM5',
      Color: 'Black',
      Weight: '250g',
      Connectivity: 'Bluetooth 5.0, 3.5mm jack',
      Warranty: '1 year',
    },
    images: ['📦', '🎧', '📸', '🔊'],
    inStock: true,
    stockCount: 45,
    category: ['Electronics', 'Audio', 'Headphones'],
    colors: ['Black', 'Silver', 'Blue', 'Red'],
    sizes: ['Small', 'Medium', 'Large'],
  };

  const handleAddToCart = () => {
    console.log(`Adding ${quantity} items to cart`);
    // TODO: Add to cart functionality
    alert('Product added to cart!');
  };

  const handleBuyNow = () => {
    console.log('Buy now');
    // TODO: Navigate to checkout
    navigate('/checkout');
  };

  return (
    <div className="min-h-screen bg-gray-50" data-testid="product-detail-page">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm">
          <Link to="/" className="text-gray-600 hover:text-gray-900">
            Home
          </Link>
          <span className="mx-2 text-gray-400">/</span>
          <Link to="/products" className="text-gray-600 hover:text-gray-900">
            Products
          </Link>
          <span className="mx-2 text-gray-400">/</span>
          <span className="text-gray-900">{product.name}</span>
        </nav>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Image Gallery */}
          <div>
            <Card className="overflow-hidden mb-4">
              <div className="aspect-square bg-gray-200 flex items-center justify-center">
                <span className="text-9xl">{product.images[selectedImage]}</span>
              </div>
            </Card>

            {/* Thumbnail Gallery */}
            <div className="grid grid-cols-4 gap-4">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`aspect-square bg-gray-200 rounded-lg border-2 transition-colors ${
                    selectedImage === index
                      ? 'border-blue-600'
                      : 'border-transparent hover:border-gray-300'
                  }`}
                  data-testid={`thumbnail-${index}`}
                >
                  <span className="text-4xl">{image}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div>
            <h1 className="text-3xl font-bold mb-2" data-testid="product-name">
              {product.name}
            </h1>

            {/* Rating */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex text-yellow-400">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className={`w-5 h-5 ${
                      i < Math.floor(product.rating) ? 'fill-current' : 'fill-gray-300'
                    }`}
                    viewBox="0 0 20 20"
                  >
                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                  </svg>
                ))}
              </div>
              <span className="text-sm text-gray-600">
                {product.rating} ({product.reviewCount} reviews)
              </span>
            </div>

            {/* Price */}
            <div className="mb-6">
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-bold text-gray-900" data-testid="product-price">
                  ${product.price.toFixed(2)}
                </span>
                {product.originalPrice && (
                  <span className="text-xl text-gray-500 line-through">
                    ${product.originalPrice.toFixed(2)}
                  </span>
                )}
                {product.originalPrice && (
                  <span className="text-sm bg-red-100 text-red-800 px-2 py-1 rounded">
                    Save ${(product.originalPrice - product.price).toFixed(2)}
                  </span>
                )}
              </div>
            </div>

            {/* Stock Status */}
            <div className="mb-6">
              {product.inStock ? (
                <div className="flex items-center text-green-600">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="font-medium">In Stock ({product.stockCount} available)</span>
                </div>
              ) : (
                <div className="flex items-center text-red-600">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="font-medium">Out of Stock</span>
                </div>
              )}
            </div>

            {/* Color Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Color</label>
              <div className="flex gap-2" data-testid="color-selector">
                {product.colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`px-4 py-2 border-2 rounded-md transition-colors ${
                      selectedColor === color
                        ? 'border-blue-600 bg-blue-50 text-blue-600'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    data-testid={`color-${color.toLowerCase()}`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>

            {/* Size Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Size</label>
              <div className="flex gap-2" data-testid="size-selector">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`px-4 py-2 border-2 rounded-md transition-colors ${
                      selectedSize === size
                        ? 'border-blue-600 bg-blue-50 text-blue-600'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    data-testid={`size-${size.toLowerCase()}`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Quantity</label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 border border-gray-300 rounded-md hover:bg-gray-100"
                  data-testid="decrease-quantity"
                >
                  −
                </button>
                <span className="w-16 text-center text-lg font-medium" data-testid="quantity-display">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(Math.min(product.stockCount, quantity + 1))}
                  className="w-10 h-10 border border-gray-300 rounded-md hover:bg-gray-100"
                  data-testid="increase-quantity"
                >
                  +
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 mb-8">
              <Button
                size="lg"
                className="flex-1"
                onClick={handleAddToCart}
                disabled={!product.inStock}
                data-testid="add-to-cart-button"
              >
                Add to Cart
              </Button>
              <Button
                size="lg"
                variant="secondary"
                className="flex-1"
                onClick={handleBuyNow}
                disabled={!product.inStock}
                data-testid="buy-now-button"
              >
                Buy Now
              </Button>
            </div>

            {/* Description */}
            <Card className="p-6 mb-6">
              <h2 className="text-lg font-semibold mb-3">Description</h2>
              <p className="text-gray-700 leading-relaxed">{product.description}</p>
            </Card>

            {/* Features */}
            <Card className="p-6 mb-6">
              <h2 className="text-lg font-semibold mb-3">Key Features</h2>
              <ul className="space-y-2">
                {product.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <svg
                      className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
            </Card>

            {/* Specifications */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-3">Specifications</h2>
              <dl className="space-y-2">
                {Object.entries(product.specifications).map(([key, value]) => (
                  <div key={key} className="flex border-b border-gray-200 pb-2">
                    <dt className="w-1/3 text-sm font-medium text-gray-600">{key}</dt>
                    <dd className="w-2/3 text-sm text-gray-900">{value}</dd>
                  </div>
                ))}
              </dl>
            </Card>
          </div>
        </div>

        {/* Related Products */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold mb-6">You May Also Like</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((item) => (
              <Card key={item} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-square bg-gray-200 flex items-center justify-center">
                  <span className="text-4xl">📦</span>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold mb-2">Related Product {item}</h3>
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold">$79.99</span>
                    <Button size="sm" variant="outline">
                      View
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
