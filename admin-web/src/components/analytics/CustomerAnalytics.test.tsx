import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CustomerAnalytics from './CustomerAnalytics';

describe('CustomerAnalytics', () => {
  it('renders customer analytics component', () => {
    render(<CustomerAnalytics />);

    expect(screen.getByTestId('customer-analytics')).toBeInTheDocument();
    expect(screen.getByText('Customer Analytics')).toBeInTheDocument();
  });

  it('displays all key metrics', () => {
    render(<CustomerAnalytics />);

    const totalCustomers = screen.getAllByText('Total Customers');
    expect(totalCustomers.length).toBeGreaterThan(0);

    expect(screen.getByText('Customer Lifetime Value')).toBeInTheDocument();
    expect(screen.getByText('Average Order Value')).toBeInTheDocument();

    const retentionRate = screen.getAllByText('Retention Rate');
    expect(retentionRate.length).toBeGreaterThan(0);
  });

  it('displays metric values correctly', () => {
    render(<CustomerAnalytics />);

    expect(screen.getByTestId('metric-value-0')).toHaveTextContent('12,456');
    expect(screen.getByTestId('metric-value-1')).toHaveTextContent('$485.67');
    expect(screen.getByTestId('metric-value-2')).toHaveTextContent('$127.45');
    expect(screen.getByTestId('metric-value-3')).toHaveTextContent('76.5%');
  });

  it('displays metric changes with trend indicators', () => {
    render(<CustomerAnalytics />);

    expect(screen.getByTestId('metric-change-0')).toHaveTextContent('+8.5%');
    expect(screen.getByTestId('metric-change-1')).toHaveTextContent('+12.3%');
    expect(screen.getByTestId('metric-change-2')).toHaveTextContent('+3.2%');
    expect(screen.getByTestId('metric-change-3')).toHaveTextContent('-2.1%');
  });

  it('displays correct trend colors', () => {
    render(<CustomerAnalytics />);

    expect(screen.getByTestId('metric-change-0')).toHaveClass('text-green-600'); // up
    expect(screen.getByTestId('metric-change-1')).toHaveClass('text-green-600'); // up
    expect(screen.getByTestId('metric-change-2')).toHaveClass('text-green-600'); // up
    expect(screen.getByTestId('metric-change-3')).toHaveClass('text-red-600'); // down
  });

  it('displays customer segmentation table', () => {
    render(<CustomerAnalytics />);

    expect(screen.getByTestId('segments-table')).toBeInTheDocument();
    expect(screen.getByText('Customer Segmentation')).toBeInTheDocument();
  });

  it('displays all customer segments', () => {
    render(<CustomerAnalytics />);

    expect(screen.getByTestId('segment-row-0')).toBeInTheDocument();
    expect(screen.getByTestId('segment-row-1')).toBeInTheDocument();
    expect(screen.getByTestId('segment-row-2')).toBeInTheDocument();
    expect(screen.getByTestId('segment-row-3')).toBeInTheDocument();
  });

  it('displays segment names', () => {
    render(<CustomerAnalytics />);

    // Check segment names in table rows
    expect(screen.getByTestId('segment-row-0')).toHaveTextContent('VIP');
    expect(screen.getByTestId('segment-row-1')).toHaveTextContent('Frequent');
    expect(screen.getByTestId('segment-row-2')).toHaveTextContent('Occasional');
    expect(screen.getByTestId('segment-row-3')).toHaveTextContent('One-Time');
  });

  it('displays segment customer counts', () => {
    render(<CustomerAnalytics />);

    expect(screen.getByTestId('segment-customers-0')).toHaveTextContent('234');
    expect(screen.getByTestId('segment-customers-1')).toHaveTextContent('1,567');
    expect(screen.getByTestId('segment-customers-2')).toHaveTextContent('4,823');
  });

  it('displays segment revenue', () => {
    render(<CustomerAnalytics />);

    expect(screen.getByTestId('segment-revenue-0')).toHaveTextContent('$125,600.00');
    expect(screen.getByTestId('segment-revenue-1')).toHaveTextContent('$342,800.00');
  });

  it('displays segment average order value', () => {
    render(<CustomerAnalytics />);

    expect(screen.getByTestId('segment-aov-0')).toHaveTextContent('$425.50');
    expect(screen.getByTestId('segment-aov-1')).toHaveTextContent('$185.30');
  });

  it('displays segment order frequency', () => {
    render(<CustomerAnalytics />);

    expect(screen.getByTestId('segment-frequency-0')).toHaveTextContent('8.5');
    expect(screen.getByTestId('segment-frequency-1')).toHaveTextContent('5.2');
  });

  it('displays segment percentage of total', () => {
    render(<CustomerAnalytics />);

    expect(screen.getByTestId('segment-percentage-0')).toHaveTextContent('18.5%');
    expect(screen.getByTestId('segment-percentage-1')).toHaveTextContent('32.4%');
  });

  it('calculates total customers correctly', () => {
    render(<CustomerAnalytics />);

    // 234 + 1567 + 4823 + 5832 = 12456
    expect(screen.getByTestId('total-customers')).toHaveTextContent('12,456');
  });

  it('calculates total revenue correctly', () => {
    render(<CustomerAnalytics />);

    // 125600 + 342800 + 298500 + 221200 = 988100
    expect(screen.getByTestId('total-revenue')).toHaveTextContent('$988,100.00');
  });

  it('calculates average order value correctly', () => {
    render(<CustomerAnalytics />);

    // (425.50 + 185.30 + 98.20 + 67.45) / 4 = 194.11
    expect(screen.getByTestId('avg-order-value')).toHaveTextContent('$194.11');
  });

  it('calculates average frequency correctly', () => {
    render(<CustomerAnalytics />);

    // (8.5 + 5.2 + 2.1 + 1.0) / 4 = 4.2
    expect(screen.getByTestId('avg-frequency')).toHaveTextContent('4.2');
  });

  it('displays total percentage as 100%', () => {
    render(<CustomerAnalytics />);

    expect(screen.getByTestId('total-percentage')).toHaveTextContent('100.0%');
  });

  it('displays customer cohort analysis table', () => {
    render(<CustomerAnalytics />);

    expect(screen.getByTestId('cohorts-table')).toBeInTheDocument();
    expect(screen.getByText('Customer Cohort Analysis')).toBeInTheDocument();
  });

  it('displays all cohort rows', () => {
    render(<CustomerAnalytics />);

    expect(screen.getByTestId('cohort-row-0')).toBeInTheDocument();
    expect(screen.getByTestId('cohort-row-1')).toBeInTheDocument();
    expect(screen.getByTestId('cohort-row-2')).toBeInTheDocument();
    expect(screen.getByTestId('cohort-row-3')).toBeInTheDocument();
    expect(screen.getByTestId('cohort-row-4')).toBeInTheDocument();
  });

  it('displays cohort months', () => {
    render(<CustomerAnalytics />);

    // Check month names in cohort rows
    expect(screen.getByTestId('cohort-row-0')).toHaveTextContent('Jan 2024');
    expect(screen.getByTestId('cohort-row-1')).toHaveTextContent('Feb 2024');
    expect(screen.getByTestId('cohort-row-2')).toHaveTextContent('Mar 2024');
  });

  it('displays cohort new customers', () => {
    render(<CustomerAnalytics />);

    expect(screen.getByTestId('cohort-new-0')).toHaveTextContent('342');
    expect(screen.getByTestId('cohort-new-1')).toHaveTextContent('398');
    expect(screen.getByTestId('cohort-new-2')).toHaveTextContent('456');
  });

  it('displays cohort active customers', () => {
    render(<CustomerAnalytics />);

    expect(screen.getByTestId('cohort-active-0')).toHaveTextContent('312');
    expect(screen.getByTestId('cohort-active-1')).toHaveTextContent('356');
  });

  it('displays cohort retention rates', () => {
    render(<CustomerAnalytics />);

    expect(screen.getByTestId('cohort-retention-0')).toHaveTextContent('91.2%');
    expect(screen.getByTestId('cohort-retention-1')).toHaveTextContent('89.4%');
  });

  it('highlights high retention rates', () => {
    render(<CustomerAnalytics />);

    const retention0 = screen.getByTestId('cohort-retention-0').querySelector('span');
    expect(retention0).toHaveClass('text-green-600');
  });

  it('displays cohort churn rates', () => {
    render(<CustomerAnalytics />);

    expect(screen.getByTestId('cohort-churn-0')).toHaveTextContent('8.8%');
    expect(screen.getByTestId('cohort-churn-1')).toHaveTextContent('10.6%');
  });

  it('highlights high churn rates', () => {
    render(<CustomerAnalytics />);

    const churn1 = screen.getByTestId('cohort-churn-1').querySelector('span');
    expect(churn1).toHaveClass('text-red-600');
  });

  it('calculates average new customers correctly', () => {
    render(<CustomerAnalytics />);

    // (342 + 398 + 456 + 512 + 589) / 5 = 459.4 → 459
    expect(screen.getByTestId('avg-new-customers')).toHaveTextContent('459');
  });

  it('calculates average active customers correctly', () => {
    render(<CustomerAnalytics />);

    // (312 + 356 + 401 + 467 + 534) / 5 = 414
    expect(screen.getByTestId('avg-active-customers')).toHaveTextContent('414');
  });

  it('calculates average retention rate correctly', () => {
    render(<CustomerAnalytics />);

    // (91.2 + 89.4 + 87.9 + 91.2 + 90.7) / 5 = 90.08
    expect(screen.getByTestId('avg-retention-rate')).toHaveTextContent('90.1%');
  });

  it('calculates average churn rate correctly', () => {
    render(<CustomerAnalytics />);

    // (8.8 + 10.6 + 12.1 + 8.8 + 9.3) / 5 = 9.92
    expect(screen.getByTestId('avg-churn-rate')).toHaveTextContent('9.9%');
  });

  it('allows selecting export format', async () => {
    const user = userEvent.setup();
    render(<CustomerAnalytics />);

    const select = screen.getByTestId('export-format-select') as HTMLSelectElement;
    expect(select.value).toBe('csv');

    await user.selectOptions(select, 'pdf');
    expect(select.value).toBe('pdf');
  });

  it('calls onExport when export button is clicked', async () => {
    const user = userEvent.setup();
    const onExport = vi.fn();

    render(<CustomerAnalytics onExport={onExport} />);

    await user.click(screen.getByTestId('export-btn'));

    expect(onExport).toHaveBeenCalledWith('csv');
  });

  it('exports with selected format', async () => {
    const user = userEvent.setup();
    const onExport = vi.fn();

    render(<CustomerAnalytics onExport={onExport} />);

    await user.selectOptions(screen.getByTestId('export-format-select'), 'pdf');
    await user.click(screen.getByTestId('export-btn'));

    expect(onExport).toHaveBeenCalledWith('pdf');
  });

  it('displays date range when provided', () => {
    const dateRange = {
      from: new Date('2024-01-01'),
      to: new Date('2024-01-31'),
    };

    render(<CustomerAnalytics dateRange={dateRange} />);

    const dateRangeElements = screen.getAllByText(/2024/);
    expect(dateRangeElements.length).toBeGreaterThan(0);
  });

  it('displays key insights', () => {
    render(<CustomerAnalytics />);

    expect(screen.getByTestId('top-segment-insight')).toBeInTheDocument();
    expect(screen.getByTestId('retention-insight')).toBeInTheDocument();
    expect(screen.getByTestId('growth-insight')).toBeInTheDocument();
  });

  it('shows correct top segment insight', () => {
    render(<CustomerAnalytics />);

    const insight = screen.getByTestId('top-segment-insight');
    expect(insight.textContent).toContain('VIP');
    expect(insight.textContent).toContain('$425.50');
  });

  it('shows correct retention insight', () => {
    render(<CustomerAnalytics />);

    const insight = screen.getByTestId('retention-insight');
    expect(insight.textContent).toContain('90.1%');
  });

  it('shows correct growth insight', () => {
    render(<CustomerAnalytics />);

    const insight = screen.getByTestId('growth-insight');
    expect(insight.textContent).toContain('589');
  });

  it('accepts custom metrics', () => {
    const customMetrics = [
      {
        label: 'Custom Metric',
        value: 999,
        change: 5.5,
        trend: 'up' as const,
        format: 'number' as const,
      },
    ];

    render(<CustomerAnalytics initialMetrics={customMetrics} />);

    expect(screen.getByText('Custom Metric')).toBeInTheDocument();
    expect(screen.getByTestId('metric-value-0')).toHaveTextContent('999');
  });

  it('accepts custom segments', () => {
    const customSegments = [
      {
        segment: 'Custom Segment',
        customerCount: 100,
        revenue: 10000,
        averageOrderValue: 100,
        orderFrequency: 2.5,
        percentageOfTotal: 50,
      },
    ];

    render(<CustomerAnalytics initialSegments={customSegments} />);

    expect(screen.getByTestId('segment-row-0')).toHaveTextContent('Custom Segment');
    expect(screen.getByTestId('segment-customers-0')).toHaveTextContent('100');
  });

  it('accepts custom cohorts', () => {
    const customCohorts = [
      {
        month: 'Custom Month',
        newCustomers: 100,
        activeCustomers: 90,
        retentionRate: 90.0,
        churnRate: 10.0,
      },
    ];

    render(<CustomerAnalytics initialCohorts={customCohorts} />);

    expect(screen.getByText('Custom Month')).toBeInTheDocument();
    expect(screen.getByTestId('cohort-new-0')).toHaveTextContent('100');
  });
});
