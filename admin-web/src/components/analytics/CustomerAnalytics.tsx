import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Users,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingBag,
  Calendar,
  Download,
  UserPlus,
  Repeat,
} from 'lucide-react';

export interface CustomerMetric {
  label: string;
  value: number;
  change: number;
  trend: 'up' | 'down' | 'neutral';
  format: 'currency' | 'number' | 'percentage';
}

export interface CustomerSegmentData {
  segment: string;
  customerCount: number;
  revenue: number;
  averageOrderValue: number;
  orderFrequency: number;
  percentageOfTotal: number;
}

export interface CustomerCohortData {
  month: string;
  newCustomers: number;
  activeCustomers: number;
  retentionRate: number;
  churnRate: number;
}

interface CustomerAnalyticsProps {
  initialMetrics?: CustomerMetric[];
  initialSegments?: CustomerSegmentData[];
  initialCohorts?: CustomerCohortData[];
  dateRange?: { from: Date; to: Date };
  onExport?: (format: 'csv' | 'pdf') => void;
}

export default function CustomerAnalytics({
  initialMetrics = [],
  initialSegments = [],
  initialCohorts = [],
  dateRange,
  onExport,
}: CustomerAnalyticsProps) {
  const defaultMetrics: CustomerMetric[] = initialMetrics.length > 0 ? initialMetrics : [
    {
      label: 'Total Customers',
      value: 12456,
      change: 8.5,
      trend: 'up',
      format: 'number',
    },
    {
      label: 'Customer Lifetime Value',
      value: 485.67,
      change: 12.3,
      trend: 'up',
      format: 'currency',
    },
    {
      label: 'Average Order Value',
      value: 127.45,
      change: 3.2,
      trend: 'up',
      format: 'currency',
    },
    {
      label: 'Retention Rate',
      value: 76.5,
      change: -2.1,
      trend: 'down',
      format: 'percentage',
    },
  ];

  const defaultSegments: CustomerSegmentData[] = initialSegments.length > 0 ? initialSegments : [
    {
      segment: 'VIP',
      customerCount: 234,
      revenue: 125600,
      averageOrderValue: 425.50,
      orderFrequency: 8.5,
      percentageOfTotal: 18.5,
    },
    {
      segment: 'Frequent',
      customerCount: 1567,
      revenue: 342800,
      averageOrderValue: 185.30,
      orderFrequency: 5.2,
      percentageOfTotal: 32.4,
    },
    {
      segment: 'Occasional',
      customerCount: 4823,
      revenue: 298500,
      averageOrderValue: 98.20,
      orderFrequency: 2.1,
      percentageOfTotal: 28.2,
    },
    {
      segment: 'One-Time',
      customerCount: 5832,
      revenue: 221200,
      averageOrderValue: 67.45,
      orderFrequency: 1.0,
      percentageOfTotal: 20.9,
    },
  ];

  const defaultCohorts: CustomerCohortData[] = initialCohorts.length > 0 ? initialCohorts : [
    {
      month: 'Jan 2024',
      newCustomers: 342,
      activeCustomers: 312,
      retentionRate: 91.2,
      churnRate: 8.8,
    },
    {
      month: 'Feb 2024',
      newCustomers: 398,
      activeCustomers: 356,
      retentionRate: 89.4,
      churnRate: 10.6,
    },
    {
      month: 'Mar 2024',
      newCustomers: 456,
      activeCustomers: 401,
      retentionRate: 87.9,
      churnRate: 12.1,
    },
    {
      month: 'Apr 2024',
      newCustomers: 512,
      activeCustomers: 467,
      retentionRate: 91.2,
      churnRate: 8.8,
    },
    {
      month: 'May 2024',
      newCustomers: 589,
      activeCustomers: 534,
      retentionRate: 90.7,
      churnRate: 9.3,
    },
  ];

  const [metrics] = useState<CustomerMetric[]>(defaultMetrics);
  const [segments] = useState<CustomerSegmentData[]>(defaultSegments);
  const [cohorts] = useState<CustomerCohortData[]>(defaultCohorts);
  const [exportFormat, setExportFormat] = useState<'csv' | 'pdf'>('csv');

  const formatValue = (value: number, format: CustomerMetric['format']): string => {
    switch (format) {
      case 'currency':
        return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'number':
        return value.toLocaleString('en-US');
      default:
        return value.toString();
    }
  };

  const formatChange = (change: number): string => {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(1)}%`;
  };

  const handleExport = () => {
    onExport?.(exportFormat);
  };

  return (
    <div className="space-y-6" data-testid="customer-analytics">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Customer Analytics</h2>
          <p className="text-sm text-gray-600 mt-1">
            Deep dive into customer behavior and segmentation
            {dateRange && (
              <span className="ml-2">
                ({dateRange.from.toLocaleDateString()} - {dateRange.to.toLocaleDateString()})
              </span>
            )}
          </p>
        </div>

        {/* Export Controls */}
        <div className="flex gap-2 items-center">
          <select
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value as 'csv' | 'pdf')}
            className="px-3 py-2 border rounded-md text-sm"
            data-testid="export-format-select"
          >
            <option value="csv">CSV</option>
            <option value="pdf">PDF</option>
          </select>
          <Button onClick={handleExport} data-testid="export-btn">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {metrics.map((metric, index) => (
          <Card key={index} className="p-4" data-testid={`metric-${index}`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-1">{metric.label}</p>
                <div className="text-2xl font-bold" data-testid={`metric-value-${index}`}>
                  {formatValue(metric.value, metric.format)}
                </div>
                <div
                  className={`flex items-center gap-1 text-sm font-medium mt-1 ${
                    metric.trend === 'up' ? 'text-green-600' :
                    metric.trend === 'down' ? 'text-red-600' :
                    'text-gray-600'
                  }`}
                  data-testid={`metric-change-${index}`}
                >
                  {metric.trend === 'up' ? <TrendingUp className="w-4 h-4" /> :
                   metric.trend === 'down' ? <TrendingDown className="w-4 h-4" /> : null}
                  <span>{formatChange(metric.change)}</span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Customer Segments */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Users className="w-5 h-5" />
          Customer Segmentation
        </h3>

        <div className="overflow-x-auto" data-testid="segments-table">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3 font-semibold">Segment</th>
                <th className="text-right p-3 font-semibold">Customers</th>
                <th className="text-right p-3 font-semibold">Revenue</th>
                <th className="text-right p-3 font-semibold">Avg Order Value</th>
                <th className="text-right p-3 font-semibold">Order Frequency</th>
                <th className="text-right p-3 font-semibold">% of Total</th>
              </tr>
            </thead>
            <tbody>
              {segments.map((segment, index) => (
                <tr
                  key={index}
                  className="border-b hover:bg-gray-50"
                  data-testid={`segment-row-${index}`}
                >
                  <td className="p-3">
                    <div className="font-medium">{segment.segment}</div>
                  </td>
                  <td className="p-3 text-right" data-testid={`segment-customers-${index}`}>
                    <div className="flex items-center justify-end gap-1">
                      <Users className="w-4 h-4 text-gray-400" />
                      {segment.customerCount.toLocaleString()}
                    </div>
                  </td>
                  <td className="p-3 text-right font-medium" data-testid={`segment-revenue-${index}`}>
                    <div className="flex items-center justify-end gap-1">
                      <DollarSign className="w-4 h-4 text-gray-400" />
                      {formatValue(segment.revenue, 'currency')}
                    </div>
                  </td>
                  <td className="p-3 text-right" data-testid={`segment-aov-${index}`}>
                    {formatValue(segment.averageOrderValue, 'currency')}
                  </td>
                  <td className="p-3 text-right" data-testid={`segment-frequency-${index}`}>
                    <div className="flex items-center justify-end gap-1">
                      <Repeat className="w-4 h-4 text-gray-400" />
                      {segment.orderFrequency.toFixed(1)}
                    </div>
                  </td>
                  <td className="p-3 text-right" data-testid={`segment-percentage-${index}`}>
                    <div className="inline-flex items-center px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-sm">
                      {segment.percentageOfTotal.toFixed(1)}%
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 font-bold">
                <td className="p-3">Total</td>
                <td className="p-3 text-right" data-testid="total-customers">
                  {segments.reduce((sum, s) => sum + s.customerCount, 0).toLocaleString()}
                </td>
                <td className="p-3 text-right" data-testid="total-revenue">
                  {formatValue(segments.reduce((sum, s) => sum + s.revenue, 0), 'currency')}
                </td>
                <td className="p-3 text-right" data-testid="avg-order-value">
                  {formatValue(
                    segments.reduce((sum, s) => sum + s.averageOrderValue, 0) / segments.length,
                    'currency'
                  )}
                </td>
                <td className="p-3 text-right" data-testid="avg-frequency">
                  {(segments.reduce((sum, s) => sum + s.orderFrequency, 0) / segments.length).toFixed(1)}
                </td>
                <td className="p-3 text-right" data-testid="total-percentage">
                  100.0%
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      {/* Customer Cohorts */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Customer Cohort Analysis
        </h3>

        <div className="overflow-x-auto" data-testid="cohorts-table">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3 font-semibold">Month</th>
                <th className="text-right p-3 font-semibold">New Customers</th>
                <th className="text-right p-3 font-semibold">Active Customers</th>
                <th className="text-right p-3 font-semibold">Retention Rate</th>
                <th className="text-right p-3 font-semibold">Churn Rate</th>
              </tr>
            </thead>
            <tbody>
              {cohorts.map((cohort, index) => (
                <tr
                  key={index}
                  className="border-b hover:bg-gray-50"
                  data-testid={`cohort-row-${index}`}
                >
                  <td className="p-3 font-medium">{cohort.month}</td>
                  <td className="p-3 text-right" data-testid={`cohort-new-${index}`}>
                    <div className="flex items-center justify-end gap-1">
                      <UserPlus className="w-4 h-4 text-gray-400" />
                      {cohort.newCustomers.toLocaleString()}
                    </div>
                  </td>
                  <td className="p-3 text-right" data-testid={`cohort-active-${index}`}>
                    <div className="flex items-center justify-end gap-1">
                      <ShoppingBag className="w-4 h-4 text-gray-400" />
                      {cohort.activeCustomers.toLocaleString()}
                    </div>
                  </td>
                  <td className="p-3 text-right" data-testid={`cohort-retention-${index}`}>
                    <span className={cohort.retentionRate >= 90 ? 'text-green-600 font-medium' : ''}>
                      {cohort.retentionRate.toFixed(1)}%
                    </span>
                  </td>
                  <td className="p-3 text-right" data-testid={`cohort-churn-${index}`}>
                    <span className={cohort.churnRate > 10 ? 'text-red-600 font-medium' : ''}>
                      {cohort.churnRate.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 font-bold">
                <td className="p-3">Average</td>
                <td className="p-3 text-right" data-testid="avg-new-customers">
                  {Math.round(cohorts.reduce((sum, c) => sum + c.newCustomers, 0) / cohorts.length).toLocaleString()}
                </td>
                <td className="p-3 text-right" data-testid="avg-active-customers">
                  {Math.round(cohorts.reduce((sum, c) => sum + c.activeCustomers, 0) / cohorts.length).toLocaleString()}
                </td>
                <td className="p-3 text-right" data-testid="avg-retention-rate">
                  {(cohorts.reduce((sum, c) => sum + c.retentionRate, 0) / cohorts.length).toFixed(1)}%
                </td>
                <td className="p-3 text-right" data-testid="avg-churn-rate">
                  {(cohorts.reduce((sum, c) => sum + c.churnRate, 0) / cohorts.length).toFixed(1)}%
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      {/* Insights */}
      <Card className="p-6 bg-purple-50">
        <h3 className="font-semibold mb-3">Key Insights</h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-start gap-2" data-testid="top-segment-insight">
            <TrendingUp className="w-4 h-4 text-green-600 mt-0.5" />
            <p>
              <span className="font-medium">{segments[0]?.segment}</span> segment generates the highest
              revenue per customer with an average order value of
              <span className="font-medium ml-1">{formatValue(segments[0]?.averageOrderValue || 0, 'currency')}</span>
            </p>
          </div>
          <div className="flex items-start gap-2" data-testid="retention-insight">
            <Users className="w-4 h-4 text-blue-600 mt-0.5" />
            <p>
              Overall customer retention rate is
              <span className="font-medium ml-1">
                {(cohorts.reduce((sum, c) => sum + c.retentionRate, 0) / cohorts.length).toFixed(1)}%
              </span>, with consistent performance across cohorts
            </p>
          </div>
          <div className="flex items-start gap-2" data-testid="growth-insight">
            <UserPlus className="w-4 h-4 text-purple-600 mt-0.5" />
            <p>
              New customer acquisition is trending upward, with
              <span className="font-medium ml-1">
                {cohorts[cohorts.length - 1]?.newCustomers.toLocaleString()}
              </span> new customers in the most recent month
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
