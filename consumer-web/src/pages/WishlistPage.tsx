import { useWishlistStore } from '@/store/wishlistStore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, ShoppingCart, X } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function WishlistPage() {
  const { items, removeItem } = useWishlistStore();

  const handleAddToCart = (productId: string) => {
    console.log('Add to cart:', productId);
    // TODO: Implement add to cart functionality
    alert('Product added to cart!');
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50" data-testid="wishlist-page">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-8">My Wishlist</h1>

          <Card className="p-12 text-center">
            <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Your wishlist is empty</h2>
            <p className="text-gray-600 mb-6">
              Save items you love to your wishlist for easy access later
            </p>
            <Link to="/products">
              <Button>Browse Products</Button>
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" data-testid="wishlist-page">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">My Wishlist</h1>
          <span className="text-gray-600">{items.length} {items.length === 1 ? 'item' : 'items'}</span>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.map((item) => (
            <Card key={item.productId} className="overflow-hidden hover:shadow-lg transition-shadow" data-testid={`wishlist-item-${item.productId}`}>
              {/* Product Image */}
              <Link to={`/products/${item.productId}`} className="block">
                <div className="aspect-square bg-gray-200 flex items-center justify-center relative group">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-6xl">📦</span>
                  )}

                  {/* Remove Button */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      removeItem(item.productId);
                    }}
                    className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                    data-testid={`remove-${item.productId}`}
                  >
                    <X className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              </Link>

              {/* Product Info */}
              <div className="p-4">
                <Link to={`/products/${item.productId}`}>
                  <h3 className="font-semibold mb-2 hover:text-blue-600 transition-colors line-clamp-2">
                    {item.name}
                  </h3>
                </Link>

                <div className="flex items-center justify-between mb-4">
                  <span className="text-xl font-bold">${item.price.toFixed(2)}</span>
                  {!item.inStock && (
                    <span className="text-sm text-red-600 font-medium">Out of Stock</span>
                  )}
                </div>

                <Button
                  className="w-full"
                  onClick={() => handleAddToCart(item.productId)}
                  disabled={!item.inStock}
                  data-testid={`add-to-cart-${item.productId}`}
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  {item.inStock ? 'Add to Cart' : 'Notify When Available'}
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 flex gap-4 justify-center">
          <Button variant="outline" asChild>
            <Link to="/products">Continue Shopping</Link>
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              if (confirm('Are you sure you want to clear your entire wishlist?')) {
                useWishlistStore.getState().clearWishlist();
              }
            }}
            data-testid="clear-wishlist"
          >
            Clear Wishlist
          </Button>
        </div>
      </div>
    </div>
  );
}
