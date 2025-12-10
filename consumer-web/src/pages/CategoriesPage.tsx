import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronRight, Package, Shirt, Home, Laptop, Heart, Gamepad2, Book, Music, Dumbbell } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  productCount: number;
  icon: React.ReactNode;
}

// Mock categories data - in production, this would come from the API
const mockCategories: Category[] = [
  {
    id: '1',
    name: 'Electronics',
    slug: 'electronics',
    description: 'Latest gadgets, computers, phones, and accessories',
    imageUrl: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800',
    productCount: 1250,
    icon: <Laptop className="w-6 h-6" />
  },
  {
    id: '2',
    name: 'Clothing & Fashion',
    slug: 'clothing',
    description: 'Trendy apparel for men, women, and children',
    imageUrl: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=800',
    productCount: 3420,
    icon: <Shirt className="w-6 h-6" />
  },
  {
    id: '3',
    name: 'Home & Garden',
    slug: 'home-garden',
    description: 'Everything for your home, furniture, and garden',
    imageUrl: 'https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=800',
    productCount: 890,
    icon: <Home className="w-6 h-6" />
  },
  {
    id: '4',
    name: 'Health & Beauty',
    slug: 'health-beauty',
    description: 'Skincare, makeup, wellness, and personal care',
    imageUrl: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800',
    productCount: 2100,
    icon: <Heart className="w-6 h-6" />
  },
  {
    id: '5',
    name: 'Sports & Outdoors',
    slug: 'sports',
    description: 'Sports equipment, outdoor gear, and fitness',
    imageUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800',
    productCount: 1560,
    icon: <Dumbbell className="w-6 h-6" />
  },
  {
    id: '6',
    name: 'Toys & Games',
    slug: 'toys',
    description: 'Toys, games, and hobbies for all ages',
    imageUrl: 'https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=800',
    productCount: 980,
    icon: <Gamepad2 className="w-6 h-6" />
  },
  {
    id: '7',
    name: 'Books & Media',
    slug: 'books',
    description: 'Books, e-books, audiobooks, and digital media',
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800',
    productCount: 4500,
    icon: <Book className="w-6 h-6" />
  },
  {
    id: '8',
    name: 'Music & Instruments',
    slug: 'music',
    description: 'Musical instruments, audio equipment, and accessories',
    imageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800',
    productCount: 720,
    icon: <Music className="w-6 h-6" />
  }
];

function CategoryCard({ category }: { category: Category }) {
  return (
    <Link
      to={`/products?category=${category.slug}`}
      className="group block"
      aria-label={`View ${category.name} category with ${category.productCount.toLocaleString()} products`}
    >
      <Card className="h-full transition-all duration-200 hover:shadow-lg hover:scale-[1.02] focus-within:ring-2 focus-within:ring-primary">
        <div className="aspect-[16/9] relative overflow-hidden bg-gray-100">
          <img
            src={category.imageUrl}
            alt={`${category.name} category`}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            loading="lazy"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = `https://via.placeholder.com/800x450.png?text=${encodeURIComponent(category.name)}`;
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              {category.icon}
              <span>{category.name}</span>
            </span>
            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-2">{category.description}</p>
          <p className="text-sm font-medium text-primary">
            {category.productCount.toLocaleString()} products
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}

function CategorySkeleton() {
  return (
    <Card className="h-full">
      <div className="aspect-[16/9] relative overflow-hidden">
        <Skeleton className="w-full h-full" />
      </div>
      <CardHeader className="pb-3">
        <Skeleton className="h-6 w-3/4" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-1/3" />
      </CardContent>
    </Card>
  );
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Simulate API call
    const fetchCategories = async () => {
      try {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));

        // In production, this would be:
        // const response = await fetch('/api/v1/categories');
        // const data = await response.json();
        // setCategories(data);

        setCategories(mockCategories);
      } catch (err) {
        setError('Failed to load categories. Please try again later.');
        console.error('Error fetching categories:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold mb-2">Unable to Load Categories</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Shop by Category</h1>
        <p className="text-muted-foreground">
          Browse our wide selection of products organized by category
        </p>
      </div>

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="flex items-center space-x-2 text-sm text-muted-foreground">
          <li>
            <Link to="/" className="hover:text-primary transition-colors">
              Home
            </Link>
          </li>
          <li>/</li>
          <li className="text-foreground font-medium" aria-current="page">
            Categories
          </li>
        </ol>
      </nav>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {loading ? (
          // Loading skeletons
          Array.from({ length: 8 }).map((_, index) => (
            <CategorySkeleton key={index} />
          ))
        ) : (
          // Category cards
          categories.map(category => (
            <CategoryCard key={category.id} category={category} />
          ))
        )}
      </div>

      {/* Quick Links Section */}
      <div className="mt-12 p-6 bg-muted/50 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Popular Searches</h2>
        <div className="flex flex-wrap gap-2">
          {['New Arrivals', 'Best Sellers', 'Sale Items', 'Gift Ideas', 'Clearance'].map(term => (
            <Link
              key={term}
              to={`/products?search=${encodeURIComponent(term.toLowerCase())}`}
              className="px-4 py-2 bg-background border rounded-full text-sm hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              {term}
            </Link>
          ))}
        </div>
      </div>

      {/* Help Section */}
      <div className="mt-8 text-center text-sm text-muted-foreground">
        <p>Can't find what you're looking for?</p>
        <div className="mt-2">
          <Link to="/contact" className="text-primary hover:underline">
            Contact us for help
          </Link>
          {' or '}
          <Link to="/products" className="text-primary hover:underline">
            browse all products
          </Link>
        </div>
      </div>
    </div>
  );
}