import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from 'lucide-react';

export interface DateRange {
  from: Date;
  to: Date;
  label: string;
}

interface DateRangeFilterProps {
  onDateRangeChange?: (range: DateRange) => void;
  defaultRange?: 'today' | 'week' | 'month' | 'year' | 'custom';
}

export default function DateRangeFilter({
  onDateRangeChange,
  defaultRange = 'week',
}: DateRangeFilterProps) {
  const [selectedRange, setSelectedRange] = useState(defaultRange);
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [showCustom, setShowCustom] = useState(false);

  const getDateRange = (range: string): DateRange => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (range) {
      case 'today':
        return {
          from: today,
          to: now,
          label: 'Today',
        };
      case 'week': {
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return {
          from: weekAgo,
          to: now,
          label: 'Last 7 Days',
        };
      }
      case 'month': {
        const monthAgo = new Date(today);
        monthAgo.setDate(monthAgo.getDate() - 30);
        return {
          from: monthAgo,
          to: now,
          label: 'Last 30 Days',
        };
      }
      case 'year': {
        const yearAgo = new Date(today);
        yearAgo.setFullYear(yearAgo.getFullYear() - 1);
        return {
          from: yearAgo,
          to: now,
          label: 'Last Year',
        };
      }
      case 'custom':
        return {
          from: customFrom ? new Date(customFrom) : today,
          to: customTo ? new Date(customTo) : now,
          label: 'Custom Range',
        };
      default:
        return getDateRange('week');
    }
  };

  const handleRangeSelect = (range: 'today' | 'week' | 'month' | 'year' | 'custom') => {
    setSelectedRange(range);
    if (range === 'custom') {
      setShowCustom(true);
    } else {
      setShowCustom(false);
      const dateRange = getDateRange(range);
      onDateRangeChange?.(dateRange);
    }
  };

  const handleCustomApply = () => {
    if (customFrom && customTo) {
      const dateRange = getDateRange('custom');
      onDateRangeChange?.(dateRange);
      setShowCustom(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const currentRange = getDateRange(selectedRange);

  return (
    <div className="relative" data-testid="date-range-filter">
      <div className="flex items-center gap-2">
        <Calendar className="w-5 h-5 text-gray-500" />
        <div className="flex gap-2">
          <Button
            variant={selectedRange === 'today' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleRangeSelect('today')}
            data-testid="range-today"
          >
            Today
          </Button>
          <Button
            variant={selectedRange === 'week' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleRangeSelect('week')}
            data-testid="range-week"
          >
            7 Days
          </Button>
          <Button
            variant={selectedRange === 'month' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleRangeSelect('month')}
            data-testid="range-month"
          >
            30 Days
          </Button>
          <Button
            variant={selectedRange === 'year' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleRangeSelect('year')}
            data-testid="range-year"
          >
            Year
          </Button>
          <Button
            variant={selectedRange === 'custom' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleRangeSelect('custom')}
            data-testid="range-custom"
          >
            Custom
          </Button>
        </div>
      </div>

      {/* Current Range Display */}
      <div className="mt-2 text-sm text-gray-600">
        {formatDate(currentRange.from)} - {formatDate(currentRange.to)}
      </div>

      {/* Custom Date Range Dialog */}
      {showCustom && (
        <div className="absolute top-full left-0 mt-2 bg-white border rounded-lg shadow-lg p-4 z-10 min-w-[300px]" data-testid="custom-date-dialog">
          <h3 className="font-semibold mb-3">Custom Date Range</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">From</label>
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                data-testid="custom-from"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">To</label>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                data-testid="custom-to"
              />
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleCustomApply}
                disabled={!customFrom || !customTo}
                className="flex-1"
                data-testid="apply-custom"
              >
                Apply
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowCustom(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
