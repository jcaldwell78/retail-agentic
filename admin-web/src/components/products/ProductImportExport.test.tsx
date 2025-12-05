import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProductImportExport, {
  ImportResult,
} from './ProductImportExport';
import type { Product } from './ProductImportExport';

describe('ProductImportExport', () => {
  let onExport: ReturnType<typeof vi.fn>;
  let onImport: Mock<[products: Product[]], Promise<ImportResult>>;

  beforeEach(() => {
    onExport = vi.fn();
    onImport = vi.fn();
  });

  describe('Rendering', () => {
    it('should render the component with title', () => {
      render(<ProductImportExport />);
      expect(screen.getByText('Product Import/Export')).toBeInTheDocument();
    });

    it('should render import and export tabs', () => {
      render(<ProductImportExport />);
      expect(screen.getByRole('tab', { name: /import products/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /export products/i })).toBeInTheDocument();
    });

    it('should show import tab by default', () => {
      render(<ProductImportExport />);
      expect(screen.getByText('CSV Import')).toBeInTheDocument();
    });
  });

  describe('Import Tab', () => {
    it('should show file input and template download button', () => {
      render(<ProductImportExport />);
      expect(screen.getByLabelText(/choose csv file/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /download template/i })).toBeInTheDocument();
    });

    it('should show import guidelines', () => {
      render(<ProductImportExport />);
      expect(screen.getByText(/import guidelines/i)).toBeInTheDocument();
      expect(screen.getByText(/CSV file must include headers/i)).toBeInTheDocument();
    });

    it('should download template when button clicked', async () => {
      const user = userEvent.setup();
      render(<ProductImportExport />);

      // Mock URL.createObjectURL and link click
      const createObjectURLMock = vi.fn(() => 'blob:mock-url');
      const revokeObjectURLMock = vi.fn();
      global.URL.createObjectURL = createObjectURLMock;
      global.URL.revokeObjectURL = revokeObjectURLMock;

      const clickMock = vi.fn();
      // Store original createElement to avoid infinite recursion
      const originalCreateElement = document.createElement.bind(document);
      const createElementSpy = vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
        if (tagName === 'a') {
          const link = originalCreateElement('a') as HTMLAnchorElement;
          link.click = clickMock;
          return link;
        }
        return originalCreateElement(tagName);
      });

      const downloadButton = screen.getByRole('button', { name: /download template/i });
      await user.click(downloadButton);

      expect(createObjectURLMock).toHaveBeenCalled();
      expect(clickMock).toHaveBeenCalled();
      expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:mock-url');

      createElementSpy.mockRestore();
    });

    it('should show file name and size when file selected', async () => {
      const user = userEvent.setup();
      render(<ProductImportExport onImport={onImport} />);

      const csvContent = 'name,sku,category,price,stock,status\nProduct 1,SKU-001,Electronics,99.99,100,active';
      const file = new File([csvContent], 'products.csv', { type: 'text/csv' });

      const fileInput = screen.getByLabelText(/choose csv file/i) as HTMLInputElement;
      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(screen.getByText(/selected: products.csv/i)).toBeInTheDocument();
      });
    });

    it('should parse and preview CSV file', async () => {
      const user = userEvent.setup();
      render(<ProductImportExport onImport={onImport} />);

      const csvContent = `name,sku,category,price,stock,status
Product 1,SKU-001,Electronics,99.99,100,active
Product 2,SKU-002,Clothing,29.99,50,draft`;

      const file = new File([csvContent], 'products.csv', { type: 'text/csv' });

      const fileInput = screen.getByLabelText(/choose csv file/i) as HTMLInputElement;
      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(screen.getByText(/preview \(2 products\)/i)).toBeInTheDocument();
        expect(screen.getByText('Product 1')).toBeInTheDocument();
        expect(screen.getByText('Product 2')).toBeInTheDocument();
        expect(screen.getByText('SKU-001')).toBeInTheDocument();
      });
    });

    it('should show import button after preview', async () => {
      const user = userEvent.setup();
      render(<ProductImportExport onImport={onImport} />);

      const csvContent = 'name,sku,category,price,stock,status\nProduct 1,SKU-001,Electronics,99.99,100,active';
      const file = new File([csvContent], 'products.csv', { type: 'text/csv' });

      const fileInput = screen.getByLabelText(/choose csv file/i) as HTMLInputElement;
      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(screen.getByTestId('import-button')).toBeInTheDocument();
        expect(screen.getByText(/import 1 products/i)).toBeInTheDocument();
      });
    });

    it('should call onImport when import button clicked', async () => {
      const user = userEvent.setup();
      const mockResult: ImportResult = {
        success: true,
        total: 1,
        imported: 1,
        failed: 0,
        errors: [],
      };
      onImport.mockResolvedValue(mockResult);

      render(<ProductImportExport onImport={onImport} />);

      const csvContent = 'name,sku,category,price,stock,status\nProduct 1,SKU-001,Electronics,99.99,100,active';
      const file = new File([csvContent], 'products.csv', { type: 'text/csv' });

      const fileInput = screen.getByLabelText(/choose csv file/i) as HTMLInputElement;
      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(screen.getByTestId('import-button')).toBeInTheDocument();
      });

      const importButton = screen.getByTestId('import-button');
      await user.click(importButton);

      await waitFor(() => {
        expect(onImport).toHaveBeenCalledWith([
          {
            name: 'Product 1',
            sku: 'SKU-001',
            category: 'Electronics',
            price: 99.99,
            stock: 100,
            status: 'active',
          },
        ]);
      });
    });

    it('should show success message after successful import', async () => {
      const user = userEvent.setup();
      const mockResult: ImportResult = {
        success: true,
        total: 2,
        imported: 2,
        failed: 0,
        errors: [],
      };
      onImport.mockResolvedValue(mockResult);

      render(<ProductImportExport onImport={onImport} />);

      const csvContent = `name,sku,category,price,stock,status
Product 1,SKU-001,Electronics,99.99,100,active
Product 2,SKU-002,Clothing,29.99,50,draft`;
      const file = new File([csvContent], 'products.csv', { type: 'text/csv' });

      const fileInput = screen.getByLabelText(/choose csv file/i) as HTMLInputElement;
      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(screen.getByTestId('import-button')).toBeInTheDocument();
      });

      const importButton = screen.getByTestId('import-button');
      await user.click(importButton);

      await waitFor(() => {
        expect(screen.getByText('Import Successful')).toBeInTheDocument();
        expect(screen.getByText(/2 of 2 products imported successfully/i)).toBeInTheDocument();
      });
    });

    it('should show error message after failed import', async () => {
      const user = userEvent.setup();
      const mockResult: ImportResult = {
        success: false,
        total: 2,
        imported: 1,
        failed: 1,
        errors: [
          {
            row: 2,
            field: 'sku',
            message: 'SKU already exists',
          },
        ],
      };
      onImport.mockResolvedValue(mockResult);

      render(<ProductImportExport onImport={onImport} />);

      const csvContent = `name,sku,category,price,stock,status
Product 1,SKU-001,Electronics,99.99,100,active
Product 2,SKU-001,Clothing,29.99,50,draft`;
      const file = new File([csvContent], 'products.csv', { type: 'text/csv' });

      const fileInput = screen.getByLabelText(/choose csv file/i) as HTMLInputElement;
      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(screen.getByTestId('import-button')).toBeInTheDocument();
      });

      const importButton = screen.getByTestId('import-button');
      await user.click(importButton);

      await waitFor(() => {
        expect(screen.getByText('Import Failed')).toBeInTheDocument();
        expect(screen.getByText(/1 of 2 products imported successfully, 1 failed/i)).toBeInTheDocument();
        expect(screen.getByText(/row 2 \(sku\): sku already exists/i)).toBeInTheDocument();
      });
    });

    it('should handle import exception gracefully', async () => {
      const user = userEvent.setup();
      onImport.mockRejectedValue(new Error('Network error'));

      render(<ProductImportExport onImport={onImport} />);

      const csvContent = 'name,sku,category,price,stock,status\nProduct 1,SKU-001,Electronics,99.99,100,active';
      const file = new File([csvContent], 'products.csv', { type: 'text/csv' });

      const fileInput = screen.getByLabelText(/choose csv file/i) as HTMLInputElement;
      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(screen.getByTestId('import-button')).toBeInTheDocument();
      });

      const importButton = screen.getByTestId('import-button');
      await user.click(importButton);

      await waitFor(() => {
        expect(screen.getByText('Import Failed')).toBeInTheDocument();
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });
    });

    it('should show limited preview for large files', async () => {
      const user = userEvent.setup();
      render(<ProductImportExport onImport={onImport} />);

      // Create CSV with 15 products
      let csvContent = 'name,sku,category,price,stock,status\n';
      for (let i = 1; i <= 15; i++) {
        csvContent += `Product ${i},SKU-00${i},Electronics,99.99,100,active\n`;
      }

      const file = new File([csvContent], 'products.csv', { type: 'text/csv' });

      const fileInput = screen.getByLabelText(/choose csv file/i) as HTMLInputElement;
      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(screen.getByText(/preview \(15 products\)/i)).toBeInTheDocument();
        expect(screen.getByText(/\.\.\. and 5 more products/i)).toBeInTheDocument();
      });
    });

    it('should parse numeric fields correctly', async () => {
      const user = userEvent.setup();
      render(<ProductImportExport onImport={onImport} />);

      const csvContent = 'name,sku,category,price,stock,status\nProduct 1,SKU-001,Electronics,199.50,250,active';
      const file = new File([csvContent], 'products.csv', { type: 'text/csv' });

      const fileInput = screen.getByLabelText(/choose csv file/i) as HTMLInputElement;
      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(screen.getByText('$199.50')).toBeInTheDocument();
        expect(screen.getByText('250')).toBeInTheDocument();
      });
    });
  });

  describe('Export Tab', () => {
    it('should show export options', async () => {
      const user = userEvent.setup();
      render(<ProductImportExport onExport={onExport} />);

      const exportTab = screen.getByRole('tab', { name: /export products/i });
      await user.click(exportTab);

      expect(screen.getByText('Export as CSV')).toBeInTheDocument();
      expect(screen.getByText('Export as Excel')).toBeInTheDocument();
    });

    it('should call onExport with csv format', async () => {
      const user = userEvent.setup();
      render(<ProductImportExport onExport={onExport} />);

      const exportTab = screen.getByRole('tab', { name: /export products/i });
      await user.click(exportTab);

      const csvButton = screen.getByTestId('export-csv-button');
      await user.click(csvButton);

      expect(onExport).toHaveBeenCalledWith('csv');
    });

    it('should call onExport with xlsx format', async () => {
      const user = userEvent.setup();
      render(<ProductImportExport onExport={onExport} />);

      const exportTab = screen.getByRole('tab', { name: /export products/i });
      await user.click(exportTab);

      const xlsxButton = screen.getByTestId('export-xlsx-button');
      await user.click(xlsxButton);

      expect(onExport).toHaveBeenCalledWith('xlsx');
    });

    it('should show export details', async () => {
      const user = userEvent.setup();
      render(<ProductImportExport />);

      const exportTab = screen.getByRole('tab', { name: /export products/i });
      await user.click(exportTab);

      expect(screen.getByText(/exported files include all product fields/i)).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty CSV file', async () => {
      const user = userEvent.setup();
      render(<ProductImportExport onImport={onImport} />);

      const file = new File([''], 'empty.csv', { type: 'text/csv' });

      const fileInput = screen.getByLabelText(/choose csv file/i) as HTMLInputElement;
      await user.upload(fileInput, file);

      // Should not crash
      await waitFor(() => {
        expect(fileInput.files?.[0]).toBe(file);
      });
    });

    it('should handle missing callbacks gracefully', async () => {
      const user = userEvent.setup();
      render(<ProductImportExport />);

      const exportTab = screen.getByRole('tab', { name: /export products/i });
      await user.click(exportTab);

      const csvButton = screen.getByTestId('export-csv-button');

      // Should not throw error even without callback
      await expect(user.click(csvButton)).resolves.not.toThrow();
    });

    it('should handle malformed CSV gracefully', async () => {
      const user = userEvent.setup();
      render(<ProductImportExport onImport={onImport} />);

      const csvContent = 'name,sku\nProduct 1'; // Missing columns
      const file = new File([csvContent], 'malformed.csv', { type: 'text/csv' });

      const fileInput = screen.getByLabelText(/choose csv file/i) as HTMLInputElement;

      // Should not crash
      await expect(user.upload(fileInput, file)).resolves.not.toThrow();
    });

    it('should show multiple errors when present', async () => {
      const user = userEvent.setup();
      const mockResult: ImportResult = {
        success: false,
        total: 10,
        imported: 3,
        failed: 7,
        errors: [
          { row: 2, field: 'sku', message: 'SKU already exists' },
          { row: 3, field: 'price', message: 'Invalid price' },
          { row: 5, field: 'sku', message: 'SKU required' },
          { row: 7, message: 'Invalid data' },
          { row: 8, field: 'stock', message: 'Stock must be positive' },
          { row: 9, field: 'category', message: 'Unknown category' },
          { row: 10, field: 'status', message: 'Invalid status' },
        ],
      };
      onImport.mockResolvedValue(mockResult);

      render(<ProductImportExport onImport={onImport} />);

      const csvContent = 'name,sku,category,price,stock,status\nProduct 1,SKU-001,Electronics,99.99,100,active';
      const file = new File([csvContent], 'products.csv', { type: 'text/csv' });

      const fileInput = screen.getByLabelText(/choose csv file/i) as HTMLInputElement;
      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(screen.getByTestId('import-button')).toBeInTheDocument();
      });

      const importButton = screen.getByTestId('import-button');
      await user.click(importButton);

      await waitFor(() => {
        expect(screen.getByText('Import Failed')).toBeInTheDocument();
        expect(screen.getByText(/\.\.\. and 2 more errors/i)).toBeInTheDocument();
      });
    });
  });
});
