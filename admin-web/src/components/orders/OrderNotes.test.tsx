import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import OrderNotes from './OrderNotes';

describe('OrderNotes', () => {
  it('renders order notes component', () => {
    render(<OrderNotes orderId="12345" />);

    expect(screen.getByTestId('order-notes')).toBeInTheDocument();
    expect(screen.getByText('Order Notes & Comments')).toBeInTheDocument();
  });

  it('displays initial notes', () => {
    render(<OrderNotes orderId="12345" />);

    expect(screen.getByText('Order created and payment confirmed.')).toBeInTheDocument();
    expect(screen.getByText('Customer requested expedited shipping. Updated shipping method.')).toBeInTheDocument();
  });

  it('allows adding a new note', async () => {
    const user = userEvent.setup();
    const onAddNote = vi.fn();

    render(
      <OrderNotes
        orderId="12345"
        onAddNote={onAddNote}
      />
    );

    const input = screen.getByTestId('new-note-input');
    await user.type(input, 'This is a test note');
    await user.click(screen.getByTestId('add-note-btn'));

    expect(screen.getByText('This is a test note')).toBeInTheDocument();
    expect(onAddNote).toHaveBeenCalled();
  });

  it('disables add button when note is empty', () => {
    render(<OrderNotes orderId="12345" />);

    const addButton = screen.getByTestId('add-note-btn');
    expect(addButton).toBeDisabled();
  });

  it('allows marking note as internal', async () => {
    const user = userEvent.setup();
    render(<OrderNotes orderId="12345" />);

    const internalCheckbox = screen.getByTestId('internal-note-checkbox') as HTMLInputElement;
    expect(internalCheckbox.checked).toBe(true);

    await user.click(internalCheckbox);
    expect(internalCheckbox.checked).toBe(false);
  });

  it('filters internal notes only', async () => {
    const user = userEvent.setup();
    render(<OrderNotes orderId="12345" />);

    const filterCheckbox = screen.getByTestId('filter-internal') as HTMLInputElement;
    await user.click(filterCheckbox);

    // Should only show internal notes
    expect(screen.getByText('Customer requested expedited shipping. Updated shipping method.')).toBeInTheDocument();
    expect(screen.queryByText('Order created and payment confirmed.')).not.toBeInTheDocument();
  });

  it('allows editing a note', async () => {
    const user = userEvent.setup();
    const onEditNote = vi.fn();

    render(
      <OrderNotes
        orderId="12345"
        onEditNote={onEditNote}
      />
    );

    const editButtons = screen.getAllByTestId(/edit-note-/);
    await user.click(editButtons[0]);

    const editInput = screen.getByTestId('edit-note-input');
    await user.clear(editInput);
    await user.type(editInput, 'Updated note content');
    await user.click(screen.getByTestId('save-edit-btn'));

    expect(screen.getByText('Updated note content')).toBeInTheDocument();
    expect(onEditNote).toHaveBeenCalled();
  });

  it('allows canceling edit', async () => {
    const user = userEvent.setup();
    render(<OrderNotes orderId="12345" />);

    const editButtons = screen.getAllByTestId(/edit-note-/);
    const originalText = 'Customer requested expedited shipping. Updated shipping method.';

    await user.click(editButtons[0]);
    expect(screen.getByTestId('edit-note-input')).toBeInTheDocument();

    await user.click(screen.getByText('Cancel'));
    expect(screen.queryByTestId('edit-note-input')).not.toBeInTheDocument();
    expect(screen.getByText(originalText)).toBeInTheDocument();
  });

  it('allows deleting a note with confirmation', async () => {
    const user = userEvent.setup();
    const onDeleteNote = vi.fn();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(
      <OrderNotes
        orderId="12345"
        onDeleteNote={onDeleteNote}
      />
    );

    const deleteButtons = screen.getAllByTestId(/delete-note-/);
    await user.click(deleteButtons[0]);

    expect(confirmSpy).toHaveBeenCalledWith('Are you sure you want to delete this note?');
    expect(onDeleteNote).toHaveBeenCalled();

    confirmSpy.mockRestore();
  });

  it('does not delete note if confirmation is cancelled', async () => {
    const user = userEvent.setup();
    const onDeleteNote = vi.fn();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

    render(
      <OrderNotes
        orderId="12345"
        onDeleteNote={onDeleteNote}
        initialNotes={[
          {
            id: '1',
            author: 'Test User',
            authorRole: 'admin',
            content: 'Test note',
            timestamp: new Date(),
            isInternal: false,
          },
        ]}
      />
    );

    const deleteButton = screen.getByTestId('delete-note-1');
    await user.click(deleteButton);

    expect(confirmSpy).toHaveBeenCalled();
    expect(onDeleteNote).not.toHaveBeenCalled();
    expect(screen.getByText('Test note')).toBeInTheDocument();

    confirmSpy.mockRestore();
  });

  it('displays note count summary', () => {
    render(<OrderNotes orderId="12345" />);

    expect(screen.getByText(/Total: 3 notes/)).toBeInTheDocument();
    expect(screen.getByText(/Internal: 1/)).toBeInTheDocument();
    expect(screen.getByText(/Public: 2/)).toBeInTheDocument();
  });

  it('displays empty state when no notes match filter', async () => {
    const user = userEvent.setup();
    render(
      <OrderNotes
        orderId="12345"
        initialNotes={[
          {
            id: '1',
            author: 'Test',
            authorRole: 'admin',
            content: 'Public note',
            timestamp: new Date(),
            isInternal: false,
          },
        ]}
      />
    );

    await user.click(screen.getByTestId('filter-internal'));

    expect(screen.getByText('No internal notes yet')).toBeInTheDocument();
  });

  it('shows edited badge for edited notes', async () => {
    const user = userEvent.setup();
    render(<OrderNotes orderId="12345" />);

    const editButtons = screen.getAllByTestId(/edit-note-/);
    await user.click(editButtons[0]);

    const editInput = screen.getByTestId('edit-note-input');
    await user.clear(editInput);
    await user.type(editInput, 'Edited content');
    await user.click(screen.getByTestId('save-edit-btn'));

    expect(screen.getByText('edited')).toBeInTheDocument();
  });

  it('displays system notes differently', () => {
    render(<OrderNotes orderId="12345" />);

    const systemNotes = screen.getAllByText(/System/);
    expect(systemNotes.length).toBeGreaterThan(0);
  });

  it('shows internal badge for internal notes', () => {
    render(<OrderNotes orderId="12345" />);

    expect(screen.getByText('Internal')).toBeInTheDocument();
  });

  it('disables save button when edit content is empty', async () => {
    const user = userEvent.setup();
    render(<OrderNotes orderId="12345" />);

    const editButtons = screen.getAllByTestId(/edit-note-/);
    await user.click(editButtons[0]);

    const editInput = screen.getByTestId('edit-note-input');
    await user.clear(editInput);

    const saveButton = screen.getByTestId('save-edit-btn');
    expect(saveButton).toBeDisabled();
  });
});
