import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  LowStockBadge,
  StockStatusIndicator,
  LowStockWarning,
  StockProgressBar,
  type StockInfo,
} from './LowStockBadge';

const inStockItem: StockInfo = {
  quantity: 100,
  reservedQuantity: 10,
  lowStockThreshold: 10,
  trackInventory: true,
  allowBackorder: false,
};

const lowStockItem: StockInfo = {
  quantity: 15,
  reservedQuantity: 7,
  lowStockThreshold: 10,
  trackInventory: true,
  allowBackorder: false,
};

const veryLowStockItem: StockInfo = {
  quantity: 5,
  reservedQuantity: 2,
  lowStockThreshold: 10,
  trackInventory: true,
  allowBackorder: false,
};

const outOfStockItem: StockInfo = {
  quantity: 10,
  reservedQuantity: 10,
  lowStockThreshold: 10,
  trackInventory: true,
  allowBackorder: false,
};

const backorderedItem: StockInfo = {
  quantity: 0,
  reservedQuantity: 0,
  lowStockThreshold: 10,
  trackInventory: true,
  allowBackorder: true,
};

const untrackiedItem: StockInfo = {
  quantity: 0,
  reservedQuantity: 0,
  lowStockThreshold: 10,
  trackInventory: false,
  allowBackorder: false,
};

describe('LowStockBadge', () => {
  describe('In Stock items', () => {
    it('should not render for in-stock items', () => {
      render(<LowStockBadge stock={inStockItem} />);
      expect(screen.queryByTestId('low-stock-badge')).not.toBeInTheDocument();
    });

    it('should not render for untracked inventory', () => {
      render(<LowStockBadge stock={untrackiedItem} />);
      expect(screen.queryByTestId('low-stock-badge')).not.toBeInTheDocument();
    });
  });

  describe('Low Stock items', () => {
    it('should render low stock badge with count', () => {
      render(<LowStockBadge stock={lowStockItem} />);
      const badge = screen.getByTestId('low-stock-badge');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveAttribute('data-stock-status', 'low');
      expect(badge).toHaveTextContent('8 left');
    });

    it('should render without count when showCount is false', () => {
      render(<LowStockBadge stock={lowStockItem} showCount={false} />);
      expect(screen.getByTestId('low-stock-badge')).toHaveTextContent('Low Stock');
    });
  });

  describe('Very Low Stock items', () => {
    it('should render very low stock badge', () => {
      render(<LowStockBadge stock={veryLowStockItem} />);
      const badge = screen.getByTestId('low-stock-badge');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveAttribute('data-stock-status', 'very-low');
      expect(badge).toHaveTextContent('Only 3 left!');
    });

    it('should have high urgency', () => {
      render(<LowStockBadge stock={veryLowStockItem} />);
      expect(screen.getByTestId('low-stock-badge')).toHaveAttribute('data-urgency', 'high');
    });
  });

  describe('Out of Stock items', () => {
    it('should render out of stock badge', () => {
      render(<LowStockBadge stock={outOfStockItem} />);
      const badge = screen.getByTestId('low-stock-badge');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveAttribute('data-stock-status', 'out-of-stock');
      expect(badge).toHaveTextContent('Out of Stock');
    });

    it('should render backordered badge when backorder is allowed', () => {
      render(<LowStockBadge stock={backorderedItem} />);
      const badge = screen.getByTestId('low-stock-badge');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent('Backordered');
    });
  });

  describe('Size variations', () => {
    it('should render small size', () => {
      render(<LowStockBadge stock={lowStockItem} size="sm" />);
      expect(screen.getByTestId('low-stock-badge')).toBeInTheDocument();
    });

    it('should render medium size', () => {
      render(<LowStockBadge stock={lowStockItem} size="md" />);
      expect(screen.getByTestId('low-stock-badge')).toBeInTheDocument();
    });

    it('should render large size', () => {
      render(<LowStockBadge stock={lowStockItem} size="lg" />);
      expect(screen.getByTestId('low-stock-badge')).toBeInTheDocument();
    });
  });
});

describe('StockStatusIndicator', () => {
  it('should render for in-stock items', () => {
    render(<StockStatusIndicator stock={inStockItem} />);
    const indicator = screen.getByTestId('stock-status-indicator');
    expect(indicator).toBeInTheDocument();
    expect(indicator).toHaveTextContent('In Stock');
  });

  it('should render for out-of-stock items', () => {
    render(<StockStatusIndicator stock={outOfStockItem} />);
    expect(screen.getByTestId('stock-status-indicator')).toHaveTextContent('Out of Stock');
  });

  it('should render for low-stock items', () => {
    render(<StockStatusIndicator stock={lowStockItem} />);
    expect(screen.getByTestId('stock-status-indicator')).toHaveTextContent('8 left');
  });

  it('should show quantity when showQuantity is true', () => {
    render(<StockStatusIndicator stock={inStockItem} showQuantity />);
    expect(screen.getByTestId('stock-status-indicator')).toHaveTextContent('(90 available)');
  });

  it('should not show quantity for out-of-stock items', () => {
    render(<StockStatusIndicator stock={outOfStockItem} showQuantity />);
    expect(screen.getByTestId('stock-status-indicator')).not.toHaveTextContent('available');
  });
});

describe('LowStockWarning', () => {
  it('should not render for in-stock items', () => {
    render(<LowStockWarning stock={inStockItem} />);
    expect(screen.queryByTestId('low-stock-warning')).not.toBeInTheDocument();
  });

  it('should render warning for low-stock items', () => {
    render(<LowStockWarning stock={lowStockItem} />);
    const warning = screen.getByTestId('low-stock-warning');
    expect(warning).toBeInTheDocument();
    expect(warning).toHaveTextContent('Limited availability');
  });

  it('should render urgent warning for very-low-stock items', () => {
    render(<LowStockWarning stock={veryLowStockItem} />);
    const warning = screen.getByTestId('low-stock-warning');
    expect(warning).toBeInTheDocument();
    expect(warning).toHaveTextContent('Selling fast - order soon!');
  });

  it('should render unavailable warning for out-of-stock items', () => {
    render(<LowStockWarning stock={outOfStockItem} />);
    const warning = screen.getByTestId('low-stock-warning');
    expect(warning).toBeInTheDocument();
    expect(warning).toHaveTextContent('Currently unavailable');
  });
});

describe('StockProgressBar', () => {
  it('should render progress bar for tracked inventory', () => {
    render(<StockProgressBar stock={inStockItem} />);
    const progressBar = screen.getByTestId('stock-progress-bar');
    expect(progressBar).toBeInTheDocument();
    expect(progressBar).toHaveTextContent('Stock Level');
    expect(progressBar).toHaveTextContent('90 units');
  });

  it('should not render for untracked inventory', () => {
    render(<StockProgressBar stock={untrackiedItem} />);
    expect(screen.queryByTestId('stock-progress-bar')).not.toBeInTheDocument();
  });

  it('should have progressbar role', () => {
    render(<StockProgressBar stock={inStockItem} />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should have correct aria attributes', () => {
    render(<StockProgressBar stock={inStockItem} />);
    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toHaveAttribute('aria-valuenow', '90');
    expect(progressbar).toHaveAttribute('aria-valuemin', '0');
    expect(progressbar).toHaveAttribute('aria-valuemax', '100');
  });

  it('should respect custom maxDisplay', () => {
    render(<StockProgressBar stock={inStockItem} maxDisplay={200} />);
    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toHaveAttribute('aria-valuemax', '200');
  });
});

describe('Edge Cases', () => {
  it('should handle missing optional fields', () => {
    const minimalStock: StockInfo = {
      quantity: 5,
    };
    render(<LowStockBadge stock={minimalStock} />);
    const badge = screen.getByTestId('low-stock-badge');
    expect(badge).toBeInTheDocument();
    // With default threshold of 10, 5 available is very low
    expect(badge).toHaveTextContent('Only 5 left!');
  });

  it('should handle zero quantity', () => {
    const zeroStock: StockInfo = {
      quantity: 0,
    };
    render(<LowStockBadge stock={zeroStock} />);
    expect(screen.getByTestId('low-stock-badge')).toHaveTextContent('Out of Stock');
  });

  it('should handle negative available quantity', () => {
    const oversoldStock: StockInfo = {
      quantity: 5,
      reservedQuantity: 10,
    };
    render(<LowStockBadge stock={oversoldStock} />);
    expect(screen.getByTestId('low-stock-badge')).toHaveTextContent('Out of Stock');
  });

  it('should handle custom threshold', () => {
    const customThreshold: StockInfo = {
      quantity: 20,
      lowStockThreshold: 25,
    };
    render(<LowStockBadge stock={customThreshold} />);
    expect(screen.getByTestId('low-stock-badge')).toHaveTextContent('20 left');
  });
});
