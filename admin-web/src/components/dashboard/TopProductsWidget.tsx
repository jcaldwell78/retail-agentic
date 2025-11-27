import { Card } from '@/components/ui/card';
import { TrendingUp, Package } from 'lucide-react';

interface ProductPerformance {
  id: string;
  name: string;
  category: string;
  unitsSold: number;
  revenue: number;
  growth: number;
  imageUrl?: string;
}

interface TopProductsWidgetProps {
  products?: ProductPerformance[];
  limit?: number;
}

export default function TopProductsWidget({ products, limit = 5 }: TopProductsWidgetProps) {
  // Mock data for demonstration
  const topProducts = products || [
    {
      id: '1',
      name: 'Wireless Headphones Pro',
      category: 'Electronics',
      unitsSold: 342,
      revenue: 34200,
      growth: 23.5,
    },
    {
      id: '2',
      name: 'Smart Watch Series 5',
      category: 'Wearables',
      unitsSold: 287,
      revenue: 71750,
      growth: 18.2,
    },
    {
      id: '3',
      name: 'Laptop Stand Adjustable',
      category: 'Accessories',
      unitsSold: 256,
      revenue: 12800,
      growth: 12.8,
    },
    {
      id: '4',
      name: 'USB-C Hub 7-in-1',
      category: 'Accessories',
      unitsSold: 198,
      revenue: 9900,
      growth: -5.3,
    },
    {
      id: '5',
      name: 'Mechanical Keyboard RGB',
      category: 'Peripherals',
      unitsSold: 176,
      revenue: 17600,
      growth: 8.9,
    },
  ];

  const displayProducts = topProducts.slice(0, limit);
  const maxRevenue = Math.max(...displayProducts.map(p => p.revenue));

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Card className="p-6" data-testid="top-products-widget">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Top Products</h3>
        </div>
        <span className="text-sm text-gray-500">Last 30 days</span>
      </div>

      <div className="space-y-4">
        {displayProducts.map((product, index) => (
          <div
            key={product.id}
            className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
            data-testid={`product-${index}`}
          >
            {/* Rank */}
            <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
              <span className={`text-lg font-bold ${
                index === 0 ? 'text-yellow-600' :
                index === 1 ? 'text-gray-400' :
                index === 2 ? 'text-amber-700' :
                'text-gray-600'
              }`}>
                {index < 3 ? '★' : index + 1}
              </span>
            </div>

            {/* Product Icon */}
            <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
              {product.imageUrl ? (
                <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover rounded-lg" />
              ) : (
                <Package className="w-6 h-6 text-gray-400" />
              )}
            </div>

            {/* Product Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm text-gray-900 truncate">
                    {product.name}
                  </h4>
                  <p className="text-xs text-gray-500">{product.category}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-sm text-gray-900">
                    {formatCurrency(product.revenue)}
                  </p>
                  <p className="text-xs text-gray-500">{product.unitsSold} sold</p>
                </div>
              </div>

              {/* Revenue Bar */}
              <div className="mt-2">
                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all"
                    style={{ width: `${(product.revenue / maxRevenue) * 100}%` }}
                  />
                </div>
              </div>

              {/* Growth Indicator */}
              <div className="mt-1 flex items-center justify-between">
                <span className={`text-xs font-medium ${
                  product.growth >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {product.growth >= 0 ? '↑' : '↓'} {Math.abs(product.growth).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* View All Link */}
      <div className="mt-6 pt-4 border-t">
        <button className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium">
          View All Products →
        </button>
      </div>
    </Card>
  );
}
