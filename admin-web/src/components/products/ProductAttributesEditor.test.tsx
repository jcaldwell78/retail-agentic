import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProductAttributesEditor from './ProductAttributesEditor';

describe('ProductAttributesEditor', () => {
  it('renders product attributes editor', () => {
    render(<ProductAttributesEditor />);

    expect(screen.getByTestId('product-attributes-editor')).toBeInTheDocument();
    expect(screen.getByText('Product Attributes')).toBeInTheDocument();
  });

  it('displays default attributes', () => {
    render(<ProductAttributesEditor />);

    expect(screen.getByText('Color')).toBeInTheDocument();
    expect(screen.getByText('Size')).toBeInTheDocument();
    expect(screen.getByText('Material')).toBeInTheDocument();
  });

  it('shows attribute types', () => {
    render(<ProductAttributesEditor />);

    expect(screen.getAllByText('Dropdown').length).toBeGreaterThan(0);
    expect(screen.getByText('Text')).toBeInTheDocument();
  });

  it('shows required badge for required attributes', () => {
    render(<ProductAttributesEditor />);

    expect(screen.getByText('Required')).toBeInTheDocument();
  });

  it('opens add attribute dialog', async () => {
    const user = userEvent.setup();
    render(<ProductAttributesEditor />);

    await user.click(screen.getByTestId('add-attribute-btn'));

    expect(screen.getByTestId('add-attribute-dialog')).toBeInTheDocument();
    expect(screen.getByText('Add New Attribute')).toBeInTheDocument();
  });

  it('allows creating a new attribute', async () => {
    const user = userEvent.setup();
    const onAttributesChange = vi.fn();

    render(<ProductAttributesEditor onAttributesChange={onAttributesChange} />);

    await user.click(screen.getByTestId('add-attribute-btn'));
    await user.type(screen.getByTestId('new-attr-name'), 'Brand');
    await user.click(screen.getByTestId('save-new-attr'));

    expect(screen.getByText('Brand')).toBeInTheDocument();
    expect(onAttributesChange).toHaveBeenCalled();
  });

  it('allows selecting attribute type', async () => {
    const user = userEvent.setup();
    render(<ProductAttributesEditor />);

    await user.click(screen.getByTestId('add-attribute-btn'));

    const typeSelect = screen.getByTestId('new-attr-type') as HTMLSelectElement;
    await user.selectOptions(typeSelect, 'number');

    expect(typeSelect.value).toBe('number');
  });

  it('allows marking new attribute as required', async () => {
    const user = userEvent.setup();
    render(<ProductAttributesEditor />);

    await user.click(screen.getByTestId('add-attribute-btn'));

    const requiredCheckbox = screen.getByTestId('new-attr-required') as HTMLInputElement;
    expect(requiredCheckbox.checked).toBe(false);

    await user.click(requiredCheckbox);
    expect(requiredCheckbox.checked).toBe(true);
  });

  it('disables save when attribute name is empty', async () => {
    const user = userEvent.setup();
    render(<ProductAttributesEditor />);

    await user.click(screen.getByTestId('add-attribute-btn'));

    const saveButton = screen.getByTestId('save-new-attr');
    expect(saveButton).toBeDisabled();
  });

  it('allows editing attribute name', async () => {
    const user = userEvent.setup();
    render(<ProductAttributesEditor />);

    const editButton = screen.getByTestId('edit-btn-1');
    await user.click(editButton);

    const editInput = screen.getByTestId('edit-name-1') as HTMLInputElement;
    await user.clear(editInput);
    await user.type(editInput, 'Primary Color');

    await user.click(screen.getByTestId('save-name-1'));

    expect(screen.getByText('Primary Color')).toBeInTheDocument();
  });

  it('allows canceling attribute name edit', async () => {
    const user = userEvent.setup();
    render(<ProductAttributesEditor />);

    const editButton = screen.getByTestId('edit-btn-1');
    await user.click(editButton);

    const editInput = screen.getByTestId('edit-name-1');
    expect(editInput).toBeInTheDocument();

    // Find cancel button (X icon button)
    const buttons = screen.getAllByRole('button');
    const cancelButton = buttons.find(
      (btn) => btn.querySelector('svg') && btn.textContent === ''
    );
    if (cancelButton) {
      await user.click(cancelButton);
    }

    expect(screen.getByText('Color')).toBeInTheDocument();
  });

  it('allows removing an attribute', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<ProductAttributesEditor />);

    await user.click(screen.getByTestId('remove-btn-3'));

    expect(confirmSpy).toHaveBeenCalled();
    expect(screen.queryByText('Material')).not.toBeInTheDocument();

    confirmSpy.mockRestore();
  });

  it('does not remove attribute if confirmation is cancelled', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

    render(<ProductAttributesEditor />);

    await user.click(screen.getByTestId('remove-btn-3'));

    expect(confirmSpy).toHaveBeenCalled();
    expect(screen.getByText('Material')).toBeInTheDocument();

    confirmSpy.mockRestore();
  });

  it('allows toggling required status', async () => {
    const user = userEvent.setup();
    render(<ProductAttributesEditor />);

    // Size is required by default
    const requiredCheckbox = screen.getByTestId('required-2') as HTMLInputElement;
    expect(requiredCheckbox.checked).toBe(true);

    await user.click(requiredCheckbox);
    expect(requiredCheckbox.checked).toBe(false);
  });

  it('displays attribute options for select type', () => {
    render(<ProductAttributesEditor />);

    expect(screen.getAllByText('Options:').length).toBeGreaterThan(0);
    // Options are in input fields, check by test ID
    expect(screen.getByTestId('option-input-1-red')).toHaveValue('Red');
    expect(screen.getByTestId('option-input-1-blue')).toHaveValue('Blue');
    expect(screen.getByTestId('option-input-1-black')).toHaveValue('Black');
  });

  it('allows adding option to select attribute', async () => {
    const user = userEvent.setup();
    render(<ProductAttributesEditor />);

    await user.click(screen.getByTestId('add-option-1'));

    // Should have 4 options now (Red, Blue, Black, Option 4)
    const options = screen.getAllByTestId(/option-1-/);
    expect(options.length).toBeGreaterThan(3);
  });

  it('allows editing option label', async () => {
    const user = userEvent.setup();
    render(<ProductAttributesEditor />);

    const optionInput = screen.getByTestId('option-input-1-red') as HTMLInputElement;
    await user.clear(optionInput);
    await user.type(optionInput, 'Crimson Red');

    expect(optionInput).toHaveValue('Crimson Red');
  });

  it('allows removing option from select attribute', async () => {
    const user = userEvent.setup();
    render(<ProductAttributesEditor />);

    // Color has 3 options: Red, Blue, Black
    await user.click(screen.getByTestId('remove-option-1-black'));

    expect(screen.queryByTestId('option-1-black')).not.toBeInTheDocument();
  });

  it('displays product type', () => {
    render(<ProductAttributesEditor productType="Electronics" />);

    expect(screen.getByText('(Electronics)')).toBeInTheDocument();
  });

  it('respects custom initialAttributes', () => {
    render(
      <ProductAttributesEditor
        initialAttributes={[
          { id: 'custom-1', name: 'Custom Attr', type: 'text', required: false },
        ]}
      />
    );

    expect(screen.getByText('Custom Attr')).toBeInTheDocument();
  });

  it('hides controls in readonly mode', () => {
    render(<ProductAttributesEditor readonly />);

    expect(screen.queryByTestId('add-attribute-btn')).not.toBeInTheDocument();
    expect(screen.queryByTestId('edit-btn-1')).not.toBeInTheDocument();
    expect(screen.queryByTestId('remove-btn-1')).not.toBeInTheDocument();
  });

  it('disables option editing in readonly mode', () => {
    render(<ProductAttributesEditor readonly />);

    const optionInput = screen.getByTestId('option-input-1-red') as HTMLInputElement;
    expect(optionInput).toBeDisabled();
  });

  it('calls onAttributesChange when attributes are modified', async () => {
    const user = userEvent.setup();
    const onAttributesChange = vi.fn();

    render(<ProductAttributesEditor onAttributesChange={onAttributesChange} />);

    // Toggle required status
    await user.click(screen.getByTestId('required-1'));

    expect(onAttributesChange).toHaveBeenCalled();
  });

  it('closes add dialog on cancel', async () => {
    const user = userEvent.setup();
    render(<ProductAttributesEditor />);

    await user.click(screen.getByTestId('add-attribute-btn'));
    expect(screen.getByTestId('add-attribute-dialog')).toBeInTheDocument();

    await user.click(screen.getByText('Cancel'));
    expect(screen.queryByTestId('add-attribute-dialog')).not.toBeInTheDocument();
  });

  it('displays all attribute type labels correctly', () => {
    render(
      <ProductAttributesEditor
        initialAttributes={[
          { id: '1', name: 'Text Field', type: 'text', required: false },
          { id: '2', name: 'Number Field', type: 'number', required: false },
          { id: '3', name: 'Select Field', type: 'select', required: false, options: [] },
          {
            id: '4',
            name: 'Multi Field',
            type: 'multiselect',
            required: false,
            options: [],
          },
          { id: '5', name: 'Boolean Field', type: 'boolean', required: false },
          { id: '6', name: 'Color Field', type: 'color', required: false },
        ]}
      />
    );

    expect(screen.getByText('Text')).toBeInTheDocument();
    expect(screen.getByText('Number')).toBeInTheDocument();
    expect(screen.getAllByText('Dropdown').length).toBeGreaterThan(0);
    expect(screen.getByText('Multi-Select')).toBeInTheDocument();
    expect(screen.getByText('Yes/No')).toBeInTheDocument();
    expect(screen.getByText('Color')).toBeInTheDocument();
  });

  it('prevents removing last option from select attribute', () => {
    render(
      <ProductAttributesEditor
        initialAttributes={[
          {
            id: '1',
            name: 'Single Option',
            type: 'select',
            required: false,
            options: [{ value: 'only', label: 'Only Option' }],
          },
        ]}
      />
    );

    // Should not show remove button when there's only one option
    expect(screen.queryByTestId('remove-option-1-only')).not.toBeInTheDocument();
  });
});
