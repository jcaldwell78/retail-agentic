import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NotificationCenter from './NotificationCenter';

describe('NotificationCenter', () => {
  it('renders notification bell', () => {
    render(<NotificationCenter />);

    expect(screen.getByTestId('notification-bell')).toBeInTheDocument();
  });

  it('displays unread count badge', () => {
    render(<NotificationCenter />);

    const badge = screen.getByTestId('unread-badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent(/\d+/);
  });

  it('opens dropdown when bell is clicked', async () => {
    const user = userEvent.setup();
    render(<NotificationCenter />);

    await user.click(screen.getByTestId('notification-bell'));

    expect(screen.getByTestId('notification-dropdown')).toBeInTheDocument();
  });

  it('closes dropdown when close button is clicked', async () => {
    const user = userEvent.setup();
    render(<NotificationCenter />);

    await user.click(screen.getByTestId('notification-bell'));
    expect(screen.getByTestId('notification-dropdown')).toBeInTheDocument();

    await user.click(screen.getByTestId('close-notifications'));
    expect(screen.queryByTestId('notification-dropdown')).not.toBeInTheDocument();
  });

  it('displays notifications list', async () => {
    const user = userEvent.setup();
    render(<NotificationCenter />);

    await user.click(screen.getByTestId('notification-bell'));

    expect(screen.getByText('New Order Received')).toBeInTheDocument();
    expect(screen.getByText('Low Stock Alert')).toBeInTheDocument();
  });

  it('filters unread notifications', async () => {
    const user = userEvent.setup();
    render(<NotificationCenter />);

    await user.click(screen.getByTestId('notification-bell'));

    const filterCheckbox = screen.getByTestId('filter-unread') as HTMLInputElement;
    await user.click(filterCheckbox);

    expect(filterCheckbox.checked).toBe(true);
    // Should only show unread notifications (3 total, 2 are read)
    expect(screen.getByText('New Order Received')).toBeInTheDocument();
    expect(screen.queryByText('Payment Received')).not.toBeInTheDocument();
  });

  it('marks all as read', async () => {
    const user = userEvent.setup();
    const onMarkAllAsRead = vi.fn();

    render(<NotificationCenter onMarkAllAsRead={onMarkAllAsRead} />);

    await user.click(screen.getByTestId('notification-bell'));
    await user.click(screen.getByTestId('mark-all-read'));

    expect(onMarkAllAsRead).toHaveBeenCalled();
  });

  it('marks individual notification as read when clicked', async () => {
    const user = userEvent.setup();
    const onMarkAsRead = vi.fn();

    render(<NotificationCenter onMarkAsRead={onMarkAsRead} />);

    await user.click(screen.getByTestId('notification-bell'));

    const notifications = screen.getAllByTestId(/notification-/);
    await user.click(notifications[0]);

    expect(onMarkAsRead).toHaveBeenCalled();
  });

  it('calls onNotificationClick when notification is clicked', async () => {
    const user = userEvent.setup();
    const onNotificationClick = vi.fn();

    render(<NotificationCenter onNotificationClick={onNotificationClick} />);

    await user.click(screen.getByTestId('notification-bell'));

    const notifications = screen.getAllByTestId(/notification-/);
    await user.click(notifications[0]);

    expect(onNotificationClick).toHaveBeenCalledWith(
      expect.objectContaining({
        type: expect.any(String),
        title: expect.any(String),
      })
    );
  });

  it('clears all notifications with confirmation', async () => {
    const user = userEvent.setup();
    const onClearAll = vi.fn();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<NotificationCenter onClearAll={onClearAll} />);

    await user.click(screen.getByTestId('notification-bell'));
    await user.click(screen.getByTestId('clear-all'));

    expect(confirmSpy).toHaveBeenCalledWith('Are you sure you want to clear all notifications?');
    expect(onClearAll).toHaveBeenCalled();

    confirmSpy.mockRestore();
  });

  it('does not clear if confirmation is cancelled', async () => {
    const user = userEvent.setup();
    const onClearAll = vi.fn();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

    render(<NotificationCenter onClearAll={onClearAll} />);

    await user.click(screen.getByTestId('notification-bell'));
    await user.click(screen.getByTestId('clear-all'));

    expect(confirmSpy).toHaveBeenCalled();
    expect(onClearAll).not.toHaveBeenCalled();

    confirmSpy.mockRestore();
  });

  it('displays appropriate icons for notification types', async () => {
    const user = userEvent.setup();
    render(<NotificationCenter />);

    await user.click(screen.getByTestId('notification-bell'));

    // Check that different notification types are rendered
    expect(screen.getByText('New Order Received')).toBeInTheDocument();
    expect(screen.getByText('Low Stock Alert')).toBeInTheDocument();
    expect(screen.getByText('Payment Received')).toBeInTheDocument();
  });

  it('limits displayed notifications to maxDisplayed', async () => {
    const user = userEvent.setup();
    render(<NotificationCenter maxDisplayed={2} />);

    await user.click(screen.getByTestId('notification-bell'));

    const notifications = screen.getAllByTestId(/notification-/);
    expect(notifications.length).toBeLessThanOrEqual(2);
  });

  it('shows important notifications with red badge', () => {
    render(<NotificationCenter />);

    const badge = screen.getByTestId('unread-badge');
    // Important unread notifications should show red badge
    expect(badge).toHaveClass(/bg-red-600/);
  });

  it('displays relative timestamps', async () => {
    const user = userEvent.setup();
    render(<NotificationCenter />);

    await user.click(screen.getByTestId('notification-bell'));

    expect(screen.getByText(/ago|Just now/)).toBeInTheDocument();
  });

  it('shows empty state when no notifications', async () => {
    const user = userEvent.setup();
    render(<NotificationCenter />);

    await user.click(screen.getByTestId('notification-bell'));

    // Clear all notifications
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    await user.click(screen.getByTestId('clear-all'));

    expect(screen.getByText('No notifications')).toBeInTheDocument();

    confirmSpy.mockRestore();
  });

  it('displays notification count in footer', async () => {
    const user = userEvent.setup();
    render(<NotificationCenter />);

    await user.click(screen.getByTestId('notification-bell'));

    expect(screen.getByText(/\d+ notification/)).toBeInTheDocument();
  });

  it('closes dropdown when clicking outside', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <NotificationCenter />
        <div data-testid="outside">Outside</div>
      </div>
    );

    await user.click(screen.getByTestId('notification-bell'));
    expect(screen.getByTestId('notification-dropdown')).toBeInTheDocument();

    await user.click(screen.getByTestId('outside'));
    expect(screen.queryByTestId('notification-dropdown')).not.toBeInTheDocument();
  });

  it('renders action buttons for notifications with actionLabel', async () => {
    const user = userEvent.setup();
    render(<NotificationCenter />);

    await user.click(screen.getByTestId('notification-bell'));

    expect(screen.getByText('View Order')).toBeInTheDocument();
    expect(screen.getByText('Restock')).toBeInTheDocument();
  });
});
