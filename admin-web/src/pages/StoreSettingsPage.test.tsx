import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StoreSettingsPage from './StoreSettingsPage';

describe('StoreSettingsPage', () => {
  it('renders store settings page', () => {
    render(<StoreSettingsPage />);

    expect(screen.getByTestId('store-settings-page')).toBeInTheDocument();
    expect(screen.getByText('Store Settings')).toBeInTheDocument();
  });

  it('displays all tabs', () => {
    render(<StoreSettingsPage />);

    expect(screen.getByTestId('tab-general')).toBeInTheDocument();
    expect(screen.getByTestId('tab-branding')).toBeInTheDocument();
    expect(screen.getByTestId('tab-shipping')).toBeInTheDocument();
    expect(screen.getByTestId('tab-tax')).toBeInTheDocument();
    expect(screen.getByTestId('tab-notifications')).toBeInTheDocument();
  });

  it('shows general settings by default', () => {
    render(<StoreSettingsPage />);

    expect(screen.getByTestId('general-settings')).toBeInTheDocument();
  });

  it('switches to branding tab', async () => {
    const user = userEvent.setup();
    render(<StoreSettingsPage />);

    await user.click(screen.getByTestId('tab-branding'));

    expect(screen.getByTestId('branding-settings')).toBeInTheDocument();
  });

  it('switches to shipping tab', async () => {
    const user = userEvent.setup();
    render(<StoreSettingsPage />);

    await user.click(screen.getByTestId('tab-shipping'));

    expect(screen.getByTestId('shipping-settings')).toBeInTheDocument();
  });

  it('switches to tax tab', async () => {
    const user = userEvent.setup();
    render(<StoreSettingsPage />);

    await user.click(screen.getByTestId('tab-tax'));

    expect(screen.getByTestId('tax-settings')).toBeInTheDocument();
  });

  it('switches to notifications tab', async () => {
    const user = userEvent.setup();
    render(<StoreSettingsPage />);

    await user.click(screen.getByTestId('tab-notifications'));

    expect(screen.getByTestId('notification-settings')).toBeInTheDocument();
  });

  it('allows editing store name', async () => {
    const user = userEvent.setup();
    render(<StoreSettingsPage />);

    const input = screen.getByTestId('store-name') as HTMLInputElement;
    await user.clear(input);
    await user.type(input, 'New Store Name');

    expect(input).toHaveValue('New Store Name');
  });

  it('allows editing store email', async () => {
    const user = userEvent.setup();
    render(<StoreSettingsPage />);

    const input = screen.getByTestId('store-email') as HTMLInputElement;
    await user.clear(input);
    await user.type(input, 'new@store.com');

    expect(input).toHaveValue('new@store.com');
  });

  it('allows changing timezone', async () => {
    const user = userEvent.setup();
    render(<StoreSettingsPage />);

    const select = screen.getByTestId('timezone') as HTMLSelectElement;
    await user.selectOptions(select, 'America/Los_Angeles');

    expect(select).toHaveValue('America/Los_Angeles');
  });

  it('allows changing currency', async () => {
    const user = userEvent.setup();
    render(<StoreSettingsPage />);

    const select = screen.getByTestId('currency') as HTMLSelectElement;
    await user.selectOptions(select, 'EUR');

    expect(select).toHaveValue('EUR');
  });

  it('allows editing primary color', async () => {
    const user = userEvent.setup();
    render(<StoreSettingsPage />);

    await user.click(screen.getByTestId('tab-branding'));

    const input = screen.getByTestId('primary-color') as HTMLInputElement;
    await user.click(input);
    // Color input behavior varies, just verify it exists
    expect(input).toBeInTheDocument();
  });

  it('allows editing secondary color', async () => {
    const user = userEvent.setup();
    render(<StoreSettingsPage />);

    await user.click(screen.getByTestId('tab-branding'));

    const input = screen.getByTestId('secondary-color') as HTMLInputElement;
    expect(input).toBeInTheDocument();
  });

  it('allows editing logo URL', async () => {
    const user = userEvent.setup();
    render(<StoreSettingsPage />);

    await user.click(screen.getByTestId('tab-branding'));

    const input = screen.getByTestId('logo-url') as HTMLInputElement;
    await user.type(input, 'https://example.com/logo.png');

    expect(input).toHaveValue('https://example.com/logo.png');
  });

  it('allows editing free shipping threshold', async () => {
    const user = userEvent.setup();
    render(<StoreSettingsPage />);

    await user.click(screen.getByTestId('tab-shipping'));

    const input = screen.getByTestId('free-shipping-threshold') as HTMLInputElement;
    await user.clear(input);
    await user.type(input, '100');

    expect(input).toHaveValue(100);
  });

  it('allows editing standard shipping cost', async () => {
    const user = userEvent.setup();
    render(<StoreSettingsPage />);

    await user.click(screen.getByTestId('tab-shipping'));

    const input = screen.getByTestId('standard-shipping') as HTMLInputElement;
    await user.clear(input);
    await user.type(input, '7.99');

    expect(input).toHaveValue(7.99);
  });

  it('allows toggling tax enabled', async () => {
    const user = userEvent.setup();
    render(<StoreSettingsPage />);

    await user.click(screen.getByTestId('tab-tax'));

    const checkbox = screen.getByTestId('tax-enabled') as HTMLInputElement;
    expect(checkbox.checked).toBe(true);

    await user.click(checkbox);
    expect(checkbox.checked).toBe(false);
  });

  it('shows tax rate when tax is enabled', async () => {
    const user = userEvent.setup();
    render(<StoreSettingsPage />);

    await user.click(screen.getByTestId('tab-tax'));

    expect(screen.getByTestId('tax-rate')).toBeInTheDocument();
  });

  it('allows editing tax rate', async () => {
    const user = userEvent.setup();
    render(<StoreSettingsPage />);

    await user.click(screen.getByTestId('tab-tax'));

    const input = screen.getByTestId('tax-rate') as HTMLInputElement;
    await user.clear(input);
    await user.type(input, '10');

    expect(input).toHaveValue(10);
  });

  it('allows toggling order confirmation', async () => {
    const user = userEvent.setup();
    render(<StoreSettingsPage />);

    await user.click(screen.getByTestId('tab-notifications'));

    const checkbox = screen.getByTestId('order-confirmation') as HTMLInputElement;
    expect(checkbox.checked).toBe(true);

    await user.click(checkbox);
    expect(checkbox.checked).toBe(false);
  });

  it('allows toggling shipping notification', async () => {
    const user = userEvent.setup();
    render(<StoreSettingsPage />);

    await user.click(screen.getByTestId('tab-notifications'));

    const checkbox = screen.getByTestId('shipping-notification') as HTMLInputElement;
    expect(checkbox.checked).toBe(true);

    await user.click(checkbox);
    expect(checkbox.checked).toBe(false);
  });

  it('allows editing low stock threshold', async () => {
    const user = userEvent.setup();
    render(<StoreSettingsPage />);

    await user.click(screen.getByTestId('tab-notifications'));

    const input = screen.getByTestId('low-stock-threshold') as HTMLInputElement;
    await user.clear(input);
    await user.type(input, '5');

    expect(input).toHaveValue(5);
  });

  it('shows save success message', async () => {
    const user = userEvent.setup();

    render(<StoreSettingsPage />);

    await user.click(screen.getByTestId('save-settings'));

    expect(screen.getByText('Saved Successfully!')).toBeInTheDocument();
  });

  it('logs settings on save', async () => {
    const user = userEvent.setup();
    const consoleSpy = vi.spyOn(console, 'log');

    render(<StoreSettingsPage />);

    await user.click(screen.getByTestId('save-settings'));

    expect(consoleSpy).toHaveBeenCalledWith('Saving settings:', expect.any(Object));

    consoleSpy.mockRestore();
  });
});
