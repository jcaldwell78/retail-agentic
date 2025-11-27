import { Card } from '@/components/ui/card';
import { Users, TrendingUp, ShoppingBag, DollarSign } from 'lucide-react';

interface CustomerMetrics {
  totalCustomers: number;
  newCustomers: number;
  returningCustomers: number;
  averageOrderValue: number;
  customerLifetimeValue: number;
  repeatPurchaseRate: number;
  churnRate: number;
  growth: {
    totalCustomers: number;
    newCustomers: number;
    averageOrderValue: number;
  };
}

interface CustomerInsightsWidgetProps {
  metrics?: CustomerMetrics;
}

export default function CustomerInsightsWidget({ metrics }: CustomerInsightsWidgetProps) {
  // Mock data for demonstration
  const data = metrics || {
    totalCustomers: 12487,
    newCustomers: 1243,
    returningCustomers: 11244,
    averageOrderValue: 127.50,
    customerLifetimeValue: 892.30,
    repeatPurchaseRate: 68.5,
    churnRate: 12.3,
    growth: {
      totalCustomers: 15.2,
      newCustomers: 23.8,
      averageOrderValue: 8.5,
    },
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatPercent = (num: number) => {
    return `${num.toFixed(1)}%`;
  };

  const MetricCard = ({
    icon: Icon,
    label,
    value,
    growth,
    suffix = '',
  }: {
    icon: typeof Users;
    label: string;
    value: string;
    growth?: number;
    suffix?: string;
  }) => (
    <div className="p-4 bg-gray-50 rounded-lg">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <Icon className="w-4 h-4 text-blue-600" />
          </div>
          <span className="text-sm font-medium text-gray-700">{label}</span>
        </div>
        {growth !== undefined && (
          <span className={`text-xs font-medium ${growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {growth >= 0 ? '↑' : '↓'} {Math.abs(growth).toFixed(1)}%
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-gray-900">
        {value}{suffix}
      </div>
    </div>
  );

  return (
    <Card className="p-6" data-testid="customer-insights-widget">
      <div className="flex items-center gap-2 mb-6">
        <Users className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold">Customer Insights</h3>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <MetricCard
          icon={Users}
          label="Total Customers"
          value={formatNumber(data.totalCustomers)}
          growth={data.growth.totalCustomers}
        />
        <MetricCard
          icon={TrendingUp}
          label="New Customers"
          value={formatNumber(data.newCustomers)}
          growth={data.growth.newCustomers}
        />
        <MetricCard
          icon={ShoppingBag}
          label="Avg Order Value"
          value={formatCurrency(data.averageOrderValue)}
          growth={data.growth.averageOrderValue}
        />
        <MetricCard
          icon={DollarSign}
          label="Customer LTV"
          value={formatCurrency(data.customerLifetimeValue)}
        />
      </div>

      {/* Customer Segments */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold mb-3 text-gray-700">Customer Distribution</h4>
        <div className="space-y-3">
          {/* New Customers */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-600">New Customers</span>
              <span className="text-sm font-medium">
                {formatNumber(data.newCustomers)} ({formatPercent((data.newCustomers / data.totalCustomers) * 100)})
              </span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full"
                style={{ width: `${(data.newCustomers / data.totalCustomers) * 100}%` }}
              />
            </div>
          </div>

          {/* Returning Customers */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-600">Returning Customers</span>
              <span className="text-sm font-medium">
                {formatNumber(data.returningCustomers)} ({formatPercent((data.returningCustomers / data.totalCustomers) * 100)})
              </span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full"
                style={{ width: `${(data.returningCustomers / data.totalCustomers) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="pt-6 border-t space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Repeat Purchase Rate</span>
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-24 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full"
                style={{ width: `${data.repeatPurchaseRate}%` }}
              />
            </div>
            <span className="text-sm font-semibold text-gray-900 w-12 text-right">
              {formatPercent(data.repeatPurchaseRate)}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Churn Rate</span>
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-24 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-red-500 rounded-full"
                style={{ width: `${data.churnRate}%` }}
              />
            </div>
            <span className="text-sm font-semibold text-gray-900 w-12 text-right">
              {formatPercent(data.churnRate)}
            </span>
          </div>
        </div>
      </div>

      {/* View Details Link */}
      <div className="mt-6 pt-4 border-t">
        <button className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium">
          View Customer Analytics →
        </button>
      </div>
    </Card>
  );
}
