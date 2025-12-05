import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BulkProductOperations, {
  Product,
} from './BulkProductOperations';

const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Product 1',
    sku: 'SKU-001',
    category: 'Electronics',
    price: 99.99,
    stock: 50,
    status: 'active',
  },
  {
    id: '2',
    name: 'Product 2',
    sku: 'SKU-002',
    category: 'Electronics',
    price: 149.99,
    stock: 30,
    status: 'draft',
  },
  {
    id: '3',
    name: 'Product 3',
    sku: 'SKU-003',
    category: 'Clothing',
    price: 29.99,
    stock: 100,
    status: 'active',
  },
  {
    id: '4',
    name: 'Product 4',
    sku: 'SKU-004',
    category: 'Clothing',
    price: 49.99,
    stock: 0,
    status: 'archived',
  },
];

describe('BulkProductOperations', () => {
  let onBulkEdit: ReturnType<typeof vi.fn>;
  let onBulkDelete: ReturnType<typeof vi.fn>;
  let onExport: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onBulkEdit = vi.fn();
    onBulkDelete = vi.fn();
    onExport = vi.fn();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.spyOn(window, 'alert').mockImplementation(() => {});
  });

  describe('Rendering', () => {
    it('should render the component with title', () => {
      render(<BulkProductOperations products={mockProducts} />);
      expect(screen.getByText('Bulk Product Operations')).toBeInTheDocument();
    });

    it('should render all tabs', () => {
      render(<BulkProductOperations products={mockProducts} />);
      expect(screen.getByRole('tab', { name: /bulk actions/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /price adjustment/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /export\/import/i })).toBeInTheDocument();
    });

    it('should display all products in the table', () => {
      render(<BulkProductOperations products={mockProducts} />);
      mockProducts.forEach((product) => {
        expect(screen.getByText(product.name)).toBeInTheDocument();
        expect(screen.getByText(product.sku)).toBeInTheDocument();
      });
    });

    it('should display selection count', () => {
      render(<BulkProductOperations products={mockProducts} />);
      expect(screen.getByText(/0 of 4 products selected/i)).toBeInTheDocument();
    });
  });

  describe('Product Selection', () => {
    it('should select individual products', async () => {
      const user = userEvent.setup();
      render(<BulkProductOperations products={mockProducts} />);

      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[1]); // First product checkbox (index 0 is "select all")

      expect(screen.getByText(/1 of 4 products selected/i)).toBeInTheDocument();
    });

    it('should deselect products', async () => {
      const user = userEvent.setup();
      render(<BulkProductOperations products={mockProducts} />);

      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[1]);
      expect(screen.getByText(/1 of 4 products selected/i)).toBeInTheDocument();

      await user.click(checkboxes[1]);
      expect(screen.getByText(/0 of 4 products selected/i)).toBeInTheDocument();
    });

    it('should select all products with select all checkbox', async () => {
      const user = userEvent.setup();
      render(<BulkProductOperations products={mockProducts} />);

      const selectAllCheckbox = screen.getAllByRole('checkbox')[0];
      await user.click(selectAllCheckbox);

      expect(screen.getByText(/4 of 4 products selected/i)).toBeInTheDocument();
    });

    it('should deselect all products when clicking select all twice', async () => {
      const user = userEvent.setup();
      render(<BulkProductOperations products={mockProducts} />);

      const selectAllCheckbox = screen.getAllByRole('checkbox')[0];
      await user.click(selectAllCheckbox);
      await user.click(selectAllCheckbox);

      expect(screen.getByText(/0 of 4 products selected/i)).toBeInTheDocument();
    });
  });

  describe('Bulk Actions Tab', () => {
    it('should enable action button when products selected and action chosen', async () => {
      const user = userEvent.setup();
      render(<BulkProductOperations products={mockProducts} onBulkDelete={onBulkDelete} />);

      const checkbox = screen.getAllByRole('checkbox')[1];
      await user.click(checkbox);

      const actionSelect = screen.getByRole('combobox', { name: /action/i });
      await user.click(actionSelect);
      await user.click(screen.getByRole('option', { name: /delete products/i }));

      const applyButton = screen.getByRole('button', { name: /apply to 1 product/i });
      expect(applyButton).toBeEnabled();
    });

    it('should call onBulkDelete when delete action is applied', async () => {
      const user = userEvent.setup();
      render(<BulkProductOperations products={mockProducts} onBulkDelete={onBulkDelete} />);

      const checkbox = screen.getAllByRole('checkbox')[1];
      await user.click(checkbox);

      const actionSelect = screen.getByRole('combobox', { name: /action/i });
      await user.click(actionSelect);
      await user.click(screen.getByRole('option', { name: /delete products/i }));

      const applyButton = screen.getByRole('button', { name: /apply to 1 product/i });
      await user.click(applyButton);

      expect(window.confirm).toHaveBeenCalled();
      expect(onBulkDelete).toHaveBeenCalledWith(['1']);
    });

    it('should not call onBulkDelete if user cancels confirmation', async () => {
      const user = userEvent.setup();
      vi.spyOn(window, 'confirm').mockReturnValue(false);

      render(<BulkProductOperations products={mockProducts} onBulkDelete={onBulkDelete} />);

      const checkbox = screen.getAllByRole('checkbox')[1];
      await user.click(checkbox);

      const actionSelect = screen.getByRole('combobox', { name: /action/i });
      await user.click(actionSelect);
      await user.click(screen.getByRole('option', { name: /delete products/i }));

      const applyButton = screen.getByRole('button', { name: /apply to 1 product/i });
      await user.click(applyButton);

      expect(onBulkDelete).not.toHaveBeenCalled();
    });

    it('should show edit fields when edit action is selected', async () => {
      const user = userEvent.setup();
      render(<BulkProductOperations products={mockProducts} />);

      const actionSelect = screen.getByRole('combobox', { name: /action/i });
      await user.click(actionSelect);
      await user.click(screen.getByRole('option', { name: /edit products/i }));

      expect(screen.getByRole('combobox', { name: /field to update/i })).toBeInTheDocument();
    });

    it('should call onBulkEdit when edit action is applied', async () => {
      const user = userEvent.setup();
      render(<BulkProductOperations products={mockProducts} onBulkEdit={onBulkEdit} />);

      // Select product
      const checkbox = screen.getAllByRole('checkbox')[1];
      await user.click(checkbox);

      // Choose edit action
      const actionSelect = screen.getByRole('combobox', { name: /action/i });
      await user.click(actionSelect);
      await user.click(screen.getByRole('option', { name: /edit products/i }));

      // Choose field
      const fieldSelect = screen.getByRole('combobox', { name: /field to update/i });
      await user.click(fieldSelect);
      await user.click(screen.getByRole('option', { name: /^status$/i }));

      // Choose value
      const valueSelect = screen.getByRole('combobox', { name: /new value/i });
      await user.click(valueSelect);
      await user.click(screen.getByRole('option', { name: /^active$/i }));

      // Apply
      const applyButton = screen.getByRole('button', { name: /apply to 1 product/i });
      await user.click(applyButton);

      expect(onBulkEdit).toHaveBeenCalledWith(['1'], { status: 'active' });
    });

    it('should call onExport when export action is applied', async () => {
      const user = userEvent.setup();
      render(<BulkProductOperations products={mockProducts} onExport={onExport} />);

      const checkbox = screen.getAllByRole('checkbox')[1];
      await user.click(checkbox);

      const actionSelect = screen.getByRole('combobox', { name: /action/i });
      await user.click(actionSelect);
      await user.click(screen.getByRole('option', { name: /export selected/i }));

      const applyButton = screen.getByRole('button', { name: /apply to 1 product/i });
      await user.click(applyButton);

      expect(onExport).toHaveBeenCalledWith(['1']);
    });
  });

  describe('Price Adjustment Tab', () => {
    it('should render price adjustment form', async () => {
      const user = userEvent.setup();
      render(<BulkProductOperations products={mockProducts} />);

      const priceTab = screen.getByRole('tab', { name: /price adjustment/i });
      await user.click(priceTab);

      expect(screen.getByRole('combobox', { name: /adjustment type/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/new price|amount/i)).toBeInTheDocument();
    });

    it('should call onBulkEdit with set price', async () => {
      const user = userEvent.setup();
      render(<BulkProductOperations products={mockProducts} onBulkEdit={onBulkEdit} />);

      const checkbox = screen.getAllByRole('checkbox')[1];
      await user.click(checkbox);

      const priceTab = screen.getByRole('tab', { name: /price adjustment/i });
      await user.click(priceTab);

      const priceInput = screen.getByLabelText(/new price/i);
      await user.type(priceInput, '199.99');

      const applyButton = screen.getByRole('button', { name: /apply price change/i });
      await user.click(applyButton);

      expect(onBulkEdit).toHaveBeenCalledWith(['1'], { price: 199.99 });
    });

    it('should show alert for invalid price input', async () => {
      const user = userEvent.setup();
      render(<BulkProductOperations products={mockProducts} onBulkEdit={onBulkEdit} />);

      const checkbox = screen.getAllByRole('checkbox')[1];
      await user.click(checkbox);

      const priceTab = screen.getByRole('tab', { name: /price adjustment/i });
      await user.click(priceTab);

      const priceInput = screen.getByLabelText(/new price/i) as HTMLInputElement;

      // Type a valid number to enable the button
      await user.type(priceInput, '100');

      // Mock parseFloat to return NaN to simulate invalid input
      const originalParseFloat = global.parseFloat;
      global.parseFloat = vi.fn(() => NaN) as unknown as typeof parseFloat;

      const applyButton = screen.getByRole('button', { name: /apply price change/i });
      await user.click(applyButton);

      expect(window.alert).toHaveBeenCalledWith(
        'Please enter a valid number for price adjustment'
      );
      expect(onBulkEdit).not.toHaveBeenCalled();

      // Restore original parseFloat
      global.parseFloat = originalParseFloat;
    });

    it('should disable apply button when no price entered', async () => {
      const user = userEvent.setup();
      render(<BulkProductOperations products={mockProducts} />);

      const checkbox = screen.getAllByRole('checkbox')[1];
      await user.click(checkbox);

      const priceTab = screen.getByRole('tab', { name: /price adjustment/i });
      await user.click(priceTab);

      const applyButton = screen.getByRole('button', { name: /apply price change/i });
      expect(applyButton).toBeDisabled();
    });
  });

  describe('Export/Import Tab', () => {
    it('should render export and import sections', async () => {
      const user = userEvent.setup();
      render(<BulkProductOperations products={mockProducts} />);

      const exportTab = screen.getByRole('tab', { name: /export\/import/i });
      await user.click(exportTab);

      expect(screen.getByText('Export Products')).toBeInTheDocument();
      expect(screen.getByText('Import Products')).toBeInTheDocument();
    });

    it('should call onExport from export tab', async () => {
      const user = userEvent.setup();
      render(<BulkProductOperations products={mockProducts} onExport={onExport} />);

      const checkbox = screen.getAllByRole('checkbox')[1];
      await user.click(checkbox);

      const exportTab = screen.getByRole('tab', { name: /export\/import/i });
      await user.click(exportTab);

      const exportButton = screen.getByRole('button', { name: /export 1 product/i });
      await user.click(exportButton);

      expect(onExport).toHaveBeenCalledWith(['1']);
    });

    it('should disable export button when no products selected', async () => {
      const user = userEvent.setup();
      render(<BulkProductOperations products={mockProducts} />);

      const exportTab = screen.getByRole('tab', { name: /export\/import/i });
      await user.click(exportTab);

      const exportButton = screen.getByRole('button', { name: /export 0 product/i });
      expect(exportButton).toBeDisabled();
    });
  });

  describe('Filtering', () => {
    it('should filter products by category', async () => {
      const user = userEvent.setup();
      render(<BulkProductOperations products={mockProducts} />);

      // Find the category filter by its aria-label
      const categoryTrigger = screen.getByRole('combobox', { name: /filter by category/i });
      await user.click(categoryTrigger);

      // Click the Electronics option
      const electronicsOption = screen.getByRole('option', { name: /^electronics$/i });
      await user.click(electronicsOption);

      // Should only show 2 electronics products
      await waitFor(() => {
        expect(screen.getByText(/0 of 2 products selected/i)).toBeInTheDocument();
      });
    });

    it('should filter products by status', async () => {
      const user = userEvent.setup();
      render(<BulkProductOperations products={mockProducts} />);

      // Find the status filter by its aria-label
      const statusTrigger = screen.getByRole('combobox', { name: /filter by status/i });
      await user.click(statusTrigger);

      // Click the Active option
      const activeOption = screen.getByRole('option', { name: /^active$/i });
      await user.click(activeOption);

      // Should only show 2 active products
      await waitFor(() => {
        expect(screen.getByText(/0 of 2 products selected/i)).toBeInTheDocument();
      });
    });

    it('should apply both category and status filters', async () => {
      const user = userEvent.setup();
      render(<BulkProductOperations products={mockProducts} />);

      // Apply category filter first
      const categoryTrigger = screen.getByRole('combobox', { name: /filter by category/i });
      await user.click(categoryTrigger);
      const electronicsOption = screen.getByRole('option', { name: /^electronics$/i });
      await user.click(electronicsOption);

      await waitFor(() => {
        expect(screen.getByText(/0 of 2 products selected/i)).toBeInTheDocument();
      });

      // Then apply status filter
      const statusTrigger = screen.getByRole('combobox', { name: /filter by status/i });
      await user.click(statusTrigger);
      const activeOption = screen.getByRole('option', { name: /^active$/i });
      await user.click(activeOption);

      // Should only show 1 active electronics product (Product 1)
      await waitFor(() => {
        expect(screen.getByText(/0 of 1 products? selected/i)).toBeInTheDocument();
      });
    });

    it('should show "No products found" when filters match nothing', async () => {
      const user = userEvent.setup();
      render(<BulkProductOperations products={mockProducts} />);

      // Apply category filter first
      const categoryTrigger = screen.getByRole('combobox', { name: /filter by category/i });
      await user.click(categoryTrigger);
      const electronicsOption = screen.getByRole('option', { name: /^electronics$/i });
      await user.click(electronicsOption);

      await waitFor(() => {
        expect(screen.getByText(/0 of 2 products selected/i)).toBeInTheDocument();
      });

      // Apply status filter that doesn't match any electronics products
      const statusTrigger = screen.getByRole('combobox', { name: /filter by status/i });
      await user.click(statusTrigger);
      const archivedOption = screen.getByRole('option', { name: /^archived$/i });
      await user.click(archivedOption);

      // No electronics products are archived, so should show "No products found"
      await waitFor(() => {
        expect(screen.getByText('No products found')).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty products array', () => {
      render(<BulkProductOperations products={[]} />);
      expect(screen.getByText('No products found')).toBeInTheDocument();
    });

    it('should display correctly when no products prop provided', () => {
      render(<BulkProductOperations />);
      expect(screen.getByText('No products found')).toBeInTheDocument();
    });

    it('should handle missing callbacks gracefully', async () => {
      const user = userEvent.setup();
      render(<BulkProductOperations products={mockProducts} />);

      const checkbox = screen.getAllByRole('checkbox')[1];
      await user.click(checkbox);

      const actionSelect = screen.getByRole('combobox', { name: /action/i });
      await user.click(actionSelect);
      await user.click(screen.getByRole('option', { name: /delete products/i }));

      const applyButton = screen.getByRole('button', { name: /apply to 1 product/i });

      // Should not throw error even without callbacks
      await expect(user.click(applyButton)).resolves.not.toThrow();
    });
  });
});
