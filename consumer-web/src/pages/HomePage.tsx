import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { RecentlyViewedProducts } from '@/components/RecentlyViewedProducts';

export default function HomePage() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section
        className="relative bg-gradient-to-r from-blue-600 to-purple-600 text-white"
        data-testid="hero-section"
      >
        <div className="container mx-auto px-4 py-24 md:py-32">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-6xl font-bold mb-6" data-testid="hero-title">
              Discover Amazing Products
            </h1>
            <p className="text-lg md:text-xl mb-8 text-blue-50" data-testid="hero-description">
              Shop the latest trends and find everything you need in one place.
              Quality products, competitive prices, and fast shipping.
            </p>
            <div className="flex flex-wrap gap-4" data-testid="hero-cta">
              <Link to="/products">
                <Button size="lg" variant="secondary" data-testid="shop-now-button">
                  Shop Now
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                Learn More
              </Button>
            </div>
          </div>
        </div>

        {/* Decorative bottom wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg
            viewBox="0 0 1440 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-auto"
          >
            <path
              d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
              fill="white"
            />
          </svg>
        </div>
      </section>

      {/* Promotional Banners */}
      <section className="py-8 bg-gray-50" data-testid="promotional-banners">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Banner 1 - Summer Sale */}
            <Link to="/products?category=sale" className="group">
              <Card className="overflow-hidden hover:shadow-xl transition-all duration-300">
                <div className="relative bg-gradient-to-r from-orange-400 to-red-500 p-8 md:p-12 text-white">
                  <div className="relative z-10">
                    <span className="inline-block bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium mb-4">
                      Limited Time Offer
                    </span>
                    <h2 className="text-3xl md:text-4xl font-bold mb-3">
                      Summer Sale
                    </h2>
                    <p className="text-lg mb-6 text-orange-50">
                      Up to 50% off on selected items
                    </p>
                    <span className="inline-flex items-center gap-2 font-semibold group-hover:gap-3 transition-all">
                      Shop Now
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </span>
                  </div>
                  <div className="absolute right-0 bottom-0 opacity-20 text-8xl" aria-hidden="true">
                    🎉
                  </div>
                </div>
              </Card>
            </Link>

            {/* Banner 2 - New Arrivals */}
            <Link to="/products?filter=new" className="group">
              <Card className="overflow-hidden hover:shadow-xl transition-all duration-300">
                <div className="relative bg-gradient-to-r from-blue-500 to-purple-600 p-8 md:p-12 text-white">
                  <div className="relative z-10">
                    <span className="inline-block bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium mb-4">
                      Just Arrived
                    </span>
                    <h2 className="text-3xl md:text-4xl font-bold mb-3">
                      New Collection
                    </h2>
                    <p className="text-lg mb-6 text-blue-50">
                      Discover the latest trends
                    </p>
                    <span className="inline-flex items-center gap-2 font-semibold group-hover:gap-3 transition-all">
                      Explore Now
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </span>
                  </div>
                  <div className="absolute right-0 bottom-0 opacity-20 text-8xl" aria-hidden="true">
                    ✨
                  </div>
                </div>
              </Card>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Categories */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Shop by Category</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { name: 'Electronics', icon: '💻', color: 'bg-blue-100' },
              { name: 'Fashion', icon: '👔', color: 'bg-pink-100' },
              { name: 'Home & Garden', icon: '🏡', color: 'bg-green-100' },
              { name: 'Sports', icon: '⚽', color: 'bg-orange-100' },
            ].map((category) => (
              <Link key={category.name} to="/products">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-6 text-center">
                    <div className={`${category.color} w-16 h-16 rounded-full flex items-center justify-center text-3xl mx-auto mb-4`}>
                      {category.icon}
                    </div>
                    <p className="font-semibold">{category.name}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 bg-gray-50" data-testid="featured-products">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-3xl font-bold">Featured Products</h2>
            <Link to="/products">
              <Button variant="outline">View All</Button>
            </Link>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((item) => (
              <Card key={item} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-square bg-gray-200 flex items-center justify-center">
                  <span className="text-4xl" aria-hidden="true">📦</span>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-2">Product Name {item}</h3>
                  <p className="text-sm text-gray-600 mb-4">Short product description goes here</p>
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold">$99.99</span>
                    <Button size="sm">Add to Cart</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Recently Viewed Products */}
      <RecentlyViewedProducts
        limit={6}
        title="Continue Shopping"
        className="bg-gray-50"
      />

      {/* Benefits Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-3xl mx-auto mb-4" aria-hidden="true">
                🚚
              </div>
              <h2 className="font-semibold text-lg mb-2">Free Shipping</h2>
              <p className="text-gray-600">On orders over $50</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-3xl mx-auto mb-4" aria-hidden="true">
                🔒
              </div>
              <h2 className="font-semibold text-lg mb-2">Secure Payment</h2>
              <p className="text-gray-600">100% secure transactions</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-3xl mx-auto mb-4" aria-hidden="true">
                🔄
              </div>
              <h2 className="font-semibold text-lg mb-2">Easy Returns</h2>
              <p className="text-gray-600">30-day return policy</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
