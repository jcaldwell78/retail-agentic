import { Card } from '@/components/ui/card';
import { useMemo } from 'react';

interface RevenueData {
  date: string;
  revenue: number;
  orders: number;
}

interface RevenueChartProps {
  data?: RevenueData[];
  period?: 'day' | 'week' | 'month' | 'year';
}

export default function RevenueChart({ data, period = 'week' }: RevenueChartProps) {
  // Mock data for demonstration
  const chartData = data || [
    { date: '2024-01-01', revenue: 12450, orders: 45 },
    { date: '2024-01-02', revenue: 15600, orders: 52 },
    { date: '2024-01-03', revenue: 18900, orders: 67 },
    { date: '2024-01-04', revenue: 14200, orders: 48 },
    { date: '2024-01-05', revenue: 21300, orders: 73 },
    { date: '2024-01-06', revenue: 19800, orders: 69 },
    { date: '2024-01-07', revenue: 23500, orders: 81 },
  ];

  const maxRevenue = useMemo(() => Math.max(...chartData.map(d => d.revenue)), [chartData]);
  const totalRevenue = useMemo(() => chartData.reduce((sum, d) => sum + d.revenue, 0), [chartData]);
  const avgRevenue = useMemo(() => totalRevenue / chartData.length, [totalRevenue, chartData.length]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (period === 'day') {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Calculate growth percentage
  const growth = chartData.length >= 2
    ? ((chartData[chartData.length - 1].revenue - chartData[0].revenue) / chartData[0].revenue) * 100
    : 0;

  return (
    <Card className="p-6" data-testid="revenue-chart">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold">Revenue Overview</h3>
          <div className="flex gap-2">
            <span className="text-sm px-3 py-1 bg-blue-50 text-blue-700 rounded-full">
              {period.charAt(0).toUpperCase() + period.slice(1)}ly
            </span>
          </div>
        </div>
        <div className="flex items-baseline gap-4">
          <p className="text-3xl font-bold">{formatCurrency(totalRevenue)}</p>
          <span className={`text-sm font-medium ${growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {growth >= 0 ? '↑' : '↓'} {Math.abs(growth).toFixed(1)}%
          </span>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          Avg: {formatCurrency(avgRevenue)} per {period}
        </p>
      </div>

      {/* Chart */}
      <div className="relative h-64" data-testid="chart-area">
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-6 flex flex-col justify-between text-xs text-gray-500 w-16 text-right pr-2">
          <span>{formatCurrency(maxRevenue)}</span>
          <span>{formatCurrency(maxRevenue * 0.75)}</span>
          <span>{formatCurrency(maxRevenue * 0.5)}</span>
          <span>{formatCurrency(maxRevenue * 0.25)}</span>
          <span>$0</span>
        </div>

        {/* Chart bars */}
        <div className="absolute left-16 right-0 top-0 bottom-6 flex items-end gap-1">
          {chartData.map((item, index) => {
            const heightPercent = (item.revenue / maxRevenue) * 100;
            return (
              <div key={index} className="flex-1 flex flex-col items-center group">
                {/* Tooltip on hover */}
                <div className="invisible group-hover:visible absolute -top-20 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap z-10">
                  <div className="font-semibold">{formatDate(item.date)}</div>
                  <div>{formatCurrency(item.revenue)}</div>
                  <div className="text-gray-300">{item.orders} orders</div>
                </div>

                {/* Bar */}
                <div
                  className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-sm hover:from-blue-700 hover:to-blue-500 transition-all cursor-pointer"
                  style={{ height: `${heightPercent}%` }}
                  data-testid={`bar-${index}`}
                />
              </div>
            );
          })}
        </div>

        {/* X-axis labels */}
        <div className="absolute left-16 right-0 bottom-0 flex gap-1 text-xs text-gray-500">
          {chartData.map((item, index) => (
            <div key={index} className="flex-1 text-center">
              {formatDate(item.date)}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t flex items-center justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-600 rounded-sm" />
          <span className="text-gray-600">Revenue</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-gray-300 rounded-full" />
          <span className="text-gray-600">Orders</span>
        </div>
      </div>
    </Card>
  );
}
