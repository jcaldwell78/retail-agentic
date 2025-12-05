import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Share2, Facebook, Twitter, Mail, Link as LinkIcon } from 'lucide-react';

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState('Black');
  const [selectedSize, setSelectedSize] = useState('Medium');
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, title: '', comment: '' });

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
    reviews: [
      {
        id: '1',
        author: 'John D.',
        rating: 5,
        title: 'Excellent sound quality!',
        comment: 'These headphones exceeded my expectations. The noise cancellation is fantastic and the battery life is amazing.',
        date: '2024-01-15',
        verified: true,
      },
      {
        id: '2',
        author: 'Sarah M.',
        rating: 4,
        title: 'Great but a bit pricey',
        comment: 'Really good headphones with excellent build quality. The only downside is the price, but you get what you pay for.',
        date: '2024-01-10',
        verified: true,
      },
      {
        id: '3',
        author: 'Mike R.',
        rating: 5,
        title: 'Best headphones I\'ve owned',
        comment: 'Comfortable for long listening sessions. Sound quality is top-notch and the ANC works wonderfully.',
        date: '2024-01-05',
        verified: false,
      },
    ],
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

  const productUrl = `${window.location.origin}/products/${id}`;
  const shareTitle = product.name;
  const shareText = `Check out ${product.name} - $${product.price}`;

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: productUrl,
        });
      } catch (error) {
        console.log('Share cancelled or failed', error);
      }
    } else {
      setShowShareMenu(!showShareMenu);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(productUrl);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Failed to copy link', error);
    }
  };

  const handleFacebookShare = () => {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productUrl)}`,
      '_blank',
      'width=600,height=400'
    );
  };

  const handleTwitterShare = () => {
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(productUrl)}`,
      '_blank',
      'width=600,height=400'
    );
  };

  const handleEmailShare = () => {
    window.location.href = `mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent(shareText + ' ' + productUrl)}`;
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submitting review:', newReview);
    // TODO: Submit review to backend
    alert('Thank you for your review!');
    setShowReviewForm(false);
    setNewReview({ rating: 5, title: '', comment: '' });
  };

  // Generate structured data for SEO (Schema.org Product markup)
  const structuredData = {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: product.name,
    image: product.images.map((_, i) => `${productUrl}/images/${i}`),
    description: product.description,
    brand: {
      '@type': 'Brand',
      name: product.specifications.Brand,
    },
    sku: product.id,
    mpn: product.specifications.Model,
    offers: {
      '@type': 'Offer',
      url: productUrl,
      priceCurrency: 'USD',
      price: product.price,
      priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      availability: product.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: 'Retail Store',
      },
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: product.rating,
      reviewCount: product.reviewCount,
    },
    review: product.reviews.map(review => ({
      '@type': 'Review',
      author: {
        '@type': 'Person',
        name: review.author,
      },
      datePublished: review.date,
      reviewRating: {
        '@type': 'Rating',
        ratingValue: review.rating,
        bestRating: 5,
      },
      reviewBody: review.comment,
    })),
  };

  // Update document title and meta tags for SEO
  useEffect(() => {
    document.title = `${product.name} - Retail Store`;

    // Update or create meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute('content', product.description);

    // Add structured data script
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(structuredData);
    script.id = 'product-structured-data';
    document.head.appendChild(script);

    // Cleanup function
    return () => {
      const existingScript = document.getElementById('product-structured-data');
      if (existingScript) {
        document.head.removeChild(existingScript);
      }
    };
  }, [product, structuredData]);

  return (
    <main className="min-h-screen bg-gray-50" data-testid="product-detail-page">
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
            <div className="flex gap-4 mb-6">
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

            {/* Share Button */}
            <div className="mb-8 relative">
              <Button
                variant="outline"
                className="w-full"
                onClick={handleNativeShare}
                data-testid="share-button"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share Product
              </Button>

              {/* Share Menu Dropdown */}
              {showShareMenu && (
                <Card className="absolute top-full mt-2 w-full p-4 z-10" data-testid="share-menu">
                  <div className="space-y-2">
                    <button
                      onClick={handleCopyLink}
                      className="w-full flex items-center px-3 py-2 hover:bg-gray-100 rounded-md transition-colors"
                      data-testid="copy-link-button"
                    >
                      <LinkIcon className="w-4 h-4 mr-3" />
                      {copySuccess ? 'Link Copied!' : 'Copy Link'}
                    </button>
                    <button
                      onClick={handleFacebookShare}
                      className="w-full flex items-center px-3 py-2 hover:bg-gray-100 rounded-md transition-colors"
                      data-testid="facebook-share-button"
                    >
                      <Facebook className="w-4 h-4 mr-3" />
                      Share on Facebook
                    </button>
                    <button
                      onClick={handleTwitterShare}
                      className="w-full flex items-center px-3 py-2 hover:bg-gray-100 rounded-md transition-colors"
                      data-testid="twitter-share-button"
                    >
                      <Twitter className="w-4 h-4 mr-3" />
                      Share on Twitter
                    </button>
                    <button
                      onClick={handleEmailShare}
                      className="w-full flex items-center px-3 py-2 hover:bg-gray-100 rounded-md transition-colors"
                      data-testid="email-share-button"
                    >
                      <Mail className="w-4 h-4 mr-3" />
                      Share via Email
                    </button>
                  </div>
                </Card>
              )}
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
            <Card className="p-6 mb-6">
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

            {/* Customer Reviews */}
            <Card className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">
                  Customer Reviews ({product.reviews.length})
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowReviewForm(!showReviewForm)}
                  data-testid="write-review-button"
                >
                  Write a Review
                </Button>
              </div>

              {/* Review Form */}
              {showReviewForm && (
                <form onSubmit={handleSubmitReview} className="mb-6 p-4 bg-gray-50 rounded-lg" data-testid="review-form">
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">Rating</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setNewReview({ ...newReview, rating: star })}
                          className="text-2xl"
                          data-testid={`star-rating-${star}`}
                        >
                          {star <= newReview.rating ? '⭐' : '☆'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">Title</label>
                    <input
                      type="text"
                      value={newReview.title}
                      onChange={(e) => setNewReview({ ...newReview, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Summarize your experience"
                      required
                      data-testid="review-title-input"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">Review</label>
                    <textarea
                      value={newReview.comment}
                      onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={4}
                      placeholder="Share your thoughts about this product"
                      required
                      data-testid="review-comment-input"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" data-testid="submit-review-button">Submit Review</Button>
                    <Button type="button" variant="outline" onClick={() => setShowReviewForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              )}

              {/* Reviews List */}
              <div className="space-y-4" data-testid="reviews-list">
                {product.reviews.map((review) => (
                  <div key={review.id} className="border-b pb-4 last:border-b-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{review.author}</span>
                          {review.verified && (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                              Verified Purchase
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex text-yellow-400">
                            {[...Array(5)].map((_, i) => (
                              <span key={i}>
                                {i < review.rating ? '⭐' : '☆'}
                              </span>
                            ))}
                          </div>
                          <span className="text-sm text-gray-500">
                            {new Date(review.date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <h3 className="font-semibold mb-1">{review.title}</h3>
                    <p className="text-gray-700">{review.comment}</p>
                  </div>
                ))}
              </div>
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
    </main>
  );
}
