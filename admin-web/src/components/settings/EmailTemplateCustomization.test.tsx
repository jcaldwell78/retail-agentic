import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EmailTemplateCustomization from './EmailTemplateCustomization';

// Mock window.confirm
const originalConfirm = window.confirm;

describe('EmailTemplateCustomization', () => {
  beforeEach(() => {
    window.confirm = vi.fn(() => true);
  });

  afterEach(() => {
    window.confirm = originalConfirm;
  });

  it('renders email template customization component', () => {
    render(<EmailTemplateCustomization />);

    expect(screen.getByTestId('email-template-customization')).toBeInTheDocument();
    expect(screen.getByText('Email Template Customization')).toBeInTheDocument();
  });

  it('displays list of templates', () => {
    render(<EmailTemplateCustomization />);

    expect(screen.getByTestId('template-order-confirmation')).toHaveTextContent('Order Confirmation');
    expect(screen.getByTestId('template-order-shipped')).toHaveTextContent('Order Shipped');
    expect(screen.getByTestId('template-welcome-email')).toHaveTextContent('Welcome Email');
    expect(screen.getByTestId('template-password-reset')).toHaveTextContent('Password Reset');
  });

  it('displays template categories', () => {
    render(<EmailTemplateCustomization />);

    expect(screen.getAllByText('order')).toHaveLength(2);
    expect(screen.getAllByText('account')).toHaveLength(2);
  });

  it('selects first template by default', () => {
    render(<EmailTemplateCustomization />);

    const firstTemplate = screen.getByTestId('template-order-confirmation');
    expect(firstTemplate.className).toContain('bg-blue-50');
  });

  it('allows selecting different templates', async () => {
    const user = userEvent.setup();
    render(<EmailTemplateCustomization />);

    await user.click(screen.getByTestId('template-welcome-email'));

    expect(screen.getByTestId('template-welcome-email').className).toContain('bg-blue-50');
    const subjectInput = screen.getByTestId('subject-input') as HTMLInputElement;
    expect(subjectInput.value).toBe('Welcome to {store_name}!');
  });

  it('displays selected template subject', () => {
    render(<EmailTemplateCustomization />);

    const subjectInput = screen.getByTestId('subject-input') as HTMLInputElement;
    expect(subjectInput.value).toBe('Order #{order_number} Confirmed');
  });

  it('displays HTML editor by default', () => {
    render(<EmailTemplateCustomization />);

    expect(screen.getByTestId('html-editor')).toBeInTheDocument();
    expect(screen.queryByTestId('text-editor')).not.toBeInTheDocument();
  });

  it('switches to text editor when text mode is selected', async () => {
    const user = userEvent.setup();
    render(<EmailTemplateCustomization />);

    await user.click(screen.getByTestId('text-mode-btn'));

    expect(screen.getByTestId('text-editor')).toBeInTheDocument();
    expect(screen.queryByTestId('html-editor')).not.toBeInTheDocument();
  });

  it('switches back to HTML editor', async () => {
    const user = userEvent.setup();
    render(<EmailTemplateCustomization />);

    await user.click(screen.getByTestId('text-mode-btn'));
    await user.click(screen.getByTestId('html-mode-btn'));

    expect(screen.getByTestId('html-editor')).toBeInTheDocument();
  });

  it('displays available variables', () => {
    render(<EmailTemplateCustomization />);

    expect(screen.getByTestId('variable-customer_name')).toHaveTextContent('{customer_name}');
    expect(screen.getByTestId('variable-order_number')).toHaveTextContent('{order_number}');
    expect(screen.getByTestId('variable-store_name')).toHaveTextContent('{store_name}');
  });

  it('allows editing subject', async () => {
    const user = userEvent.setup();
    render(<EmailTemplateCustomization />);

    const subjectInput = screen.getByTestId('subject-input') as HTMLInputElement;
    await user.clear(subjectInput);
    await user.type(subjectInput, 'New Subject');

    expect(subjectInput.value).toBe('New Subject');
  });

  it('shows unsaved changes indicator when editing', async () => {
    const user = userEvent.setup();
    render(<EmailTemplateCustomization />);

    const subjectInput = screen.getByTestId('subject-input');
    await user.type(subjectInput, ' Updated');

    expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
  });

  it('enables save button when there are changes', async () => {
    const user = userEvent.setup();
    render(<EmailTemplateCustomization />);

    const saveButton = screen.getByTestId('save-btn');
    expect(saveButton).toBeDisabled();

    await user.type(screen.getByTestId('subject-input'), ' Updated');

    expect(saveButton).not.toBeDisabled();
  });

  it('enables discard button when there are changes', async () => {
    const user = userEvent.setup();
    render(<EmailTemplateCustomization />);

    const discardButton = screen.getByTestId('discard-btn');
    expect(discardButton).toBeDisabled();

    await user.type(screen.getByTestId('subject-input'), ' Updated');

    expect(discardButton).not.toBeDisabled();
  });

  it('calls onSaveTemplate when save is clicked', async () => {
    const user = userEvent.setup();
    const onSaveTemplate = vi.fn();

    render(<EmailTemplateCustomization onSaveTemplate={onSaveTemplate} />);

    await user.type(screen.getByTestId('subject-input'), ' Updated');
    await user.click(screen.getByTestId('save-btn'));

    expect(onSaveTemplate).toHaveBeenCalledWith(
      'order-confirmation',
      expect.objectContaining({
        subject: expect.stringContaining('Updated'),
      })
    );
  });

  it('clears unsaved changes after saving', async () => {
    const user = userEvent.setup();
    render(<EmailTemplateCustomization />);

    await user.type(screen.getByTestId('subject-input'), ' Updated');
    expect(screen.getByText('Unsaved changes')).toBeInTheDocument();

    await user.click(screen.getByTestId('save-btn'));

    expect(screen.queryByText('Unsaved changes')).not.toBeInTheDocument();
  });

  it('discards changes when discard button is clicked', async () => {
    const user = userEvent.setup();
    render(<EmailTemplateCustomization />);

    const subjectInput = screen.getByTestId('subject-input') as HTMLInputElement;
    const originalValue = subjectInput.value;

    await user.clear(subjectInput);
    await user.type(subjectInput, 'New Subject');

    await user.click(screen.getByTestId('discard-btn'));

    expect(subjectInput.value).toBe(originalValue);
  });

  it('allows editing HTML content', async () => {
    const user = userEvent.setup();
    render(<EmailTemplateCustomization />);

    const htmlEditor = screen.getByTestId('html-editor') as HTMLTextAreaElement;
    await user.clear(htmlEditor);
    await user.type(htmlEditor, '<p>Test content</p>');

    expect(htmlEditor.value).toBe('<p>Test content</p>');
  });

  it('allows editing text content', async () => {
    const user = userEvent.setup();
    render(<EmailTemplateCustomization />);

    await user.click(screen.getByTestId('text-mode-btn'));

    const textEditor = screen.getByTestId('text-editor') as HTMLTextAreaElement;
    await user.clear(textEditor);
    await user.type(textEditor, 'Plain text content');

    expect(textEditor.value).toBe('Plain text content');
  });

  it('opens preview modal when preview button is clicked', async () => {
    const user = userEvent.setup();
    render(<EmailTemplateCustomization />);

    await user.click(screen.getByTestId('preview-btn'));

    expect(screen.getByTestId('preview-modal')).toBeInTheDocument();
  });

  it('displays subject in preview modal', async () => {
    const user = userEvent.setup();
    render(<EmailTemplateCustomization />);

    await user.click(screen.getByTestId('preview-btn'));

    const modal = screen.getByTestId('preview-modal');
    expect(modal).toHaveTextContent('Order #{order_number} Confirmed');
  });

  it('closes preview modal when close button is clicked', async () => {
    const user = userEvent.setup();
    render(<EmailTemplateCustomization />);

    await user.click(screen.getByTestId('preview-btn'));
    expect(screen.getByTestId('preview-modal')).toBeInTheDocument();

    await user.click(screen.getByText('Close'));
    expect(screen.queryByTestId('preview-modal')).not.toBeInTheDocument();
  });

  it('calls onPreviewTemplate when preview is opened', async () => {
    const user = userEvent.setup();
    const onPreviewTemplate = vi.fn();

    render(<EmailTemplateCustomization onPreviewTemplate={onPreviewTemplate} />);

    await user.click(screen.getByTestId('preview-btn'));

    expect(onPreviewTemplate).toHaveBeenCalledWith(
      'order-confirmation',
      expect.objectContaining({
        subject: 'Order #{order_number} Confirmed',
      })
    );
  });

  it('shows reset button for modified templates', () => {
    // The reset button appears for templates where isDefault is false
    // This is determined by external state, not by the save action
    // Create a modified template (isDefault: false) to test this display logic
    const modifiedTemplates = [
      {
        id: 'test',
        name: 'Test Template',
        subject: 'Test Subject',
        htmlBody: '<p>Test</p>',
        textBody: 'Test',
        category: 'marketing' as const,
        variables: [],
        isDefault: false, // This makes the reset button appear
        lastModified: '2024-01-01',
      },
    ];

    render(<EmailTemplateCustomization templates={modifiedTemplates} />);

    // Reset button should be visible for non-default templates
    expect(screen.getByTestId('reset-btn')).toBeInTheDocument();
  });

  it('calls onResetTemplate when reset is clicked', async () => {
    const user = userEvent.setup();
    const onResetTemplate = vi.fn();

    // Create a modified template so reset button is visible
    const modifiedTemplates = [
      {
        id: 'test',
        name: 'Test Template',
        subject: 'Test Subject',
        htmlBody: '<p>Test</p>',
        textBody: 'Test',
        category: 'marketing' as const,
        variables: [],
        isDefault: false, // Makes reset button visible
        lastModified: '2024-01-01',
      },
    ];

    render(<EmailTemplateCustomization templates={modifiedTemplates} onResetTemplate={onResetTemplate} />);

    // Reset button should be visible
    const resetBtn = screen.getByTestId('reset-btn');
    expect(resetBtn).toBeInTheDocument();

    await user.click(resetBtn);

    expect(onResetTemplate).toHaveBeenCalledWith('test');
  });

  it('shows confirmation when switching templates with unsaved changes', async () => {
    const user = userEvent.setup();
    window.confirm = vi.fn(() => false);

    render(<EmailTemplateCustomization />);

    await user.type(screen.getByTestId('subject-input'), ' Modified');
    await user.click(screen.getByTestId('template-welcome-email'));

    expect(window.confirm).toHaveBeenCalled();
    // Should still be on first template since we returned false
    expect(screen.getByTestId('template-order-confirmation').className).toContain('bg-blue-50');
  });

  it('switches templates if user confirms discarding changes', async () => {
    const user = userEvent.setup();
    window.confirm = vi.fn(() => true);

    render(<EmailTemplateCustomization />);

    await user.type(screen.getByTestId('subject-input'), ' Modified');
    await user.click(screen.getByTestId('template-welcome-email'));

    expect(window.confirm).toHaveBeenCalled();
    expect(screen.getByTestId('template-welcome-email').className).toContain('bg-blue-50');
  });

  it('displays last modified date', () => {
    render(<EmailTemplateCustomization />);

    expect(screen.getByText(/Last modified:/)).toBeInTheDocument();
  });

  it('preserves changes when switching between HTML and text modes', async () => {
    const user = userEvent.setup();
    render(<EmailTemplateCustomization />);

    const htmlEditor = screen.getByTestId('html-editor') as HTMLTextAreaElement;
    await user.type(htmlEditor, '<p>Modified</p>');

    await user.click(screen.getByTestId('text-mode-btn'));
    await user.click(screen.getByTestId('html-mode-btn'));

    expect(htmlEditor.value).toContain('<p>Modified</p>');
  });

  it('displays template content in monospace font', () => {
    render(<EmailTemplateCustomization />);

    const htmlEditor = screen.getByTestId('html-editor');
    expect(htmlEditor).toHaveClass('font-mono');
  });

  it('shows correct button styles for active view mode', async () => {
    const user = userEvent.setup();
    render(<EmailTemplateCustomization />);

    const htmlBtn = screen.getByTestId('html-mode-btn');
    const textBtn = screen.getByTestId('text-mode-btn');

    // HTML mode should be active by default - check for primary bg color
    expect(htmlBtn.className).toContain('bg-primary');

    await user.click(textBtn);

    // Text mode should now be active
    expect(textBtn.className).toContain('bg-primary');
  });
});
