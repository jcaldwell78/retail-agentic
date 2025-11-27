import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import CartPage from './CartPage';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('CartPage - Save for Later', () => {
  it('should render the cart page', () => {
    renderWithRouter(<CartPage />);
    expect(screen.getByTestId('cart-page')).toBeInTheDocument();
  });

  it('should display cart items', () => {
    renderWithRouter(<CartPage />);
    expect(screen.getByTestId('cart-items')).toBeInTheDocument();
    expect(screen.getByText('Wireless Headphones')).toBeInTheDocument();
    expect(screen.getByText('Smart Watch')).toBeInTheDocument();
    expect(screen.getByText('Laptop Stand')).toBeInTheDocument();
  });

  it('should display item count in header', () => {
    renderWithRouter(<CartPage />);
    expect(screen.getByText('3 items in your cart')).toBeInTheDocument();
  });

  it('should move item to saved for later when button is clicked', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CartPage />);

    const saveButton = screen.getByTestId('save-for-later-1');
    await user.click(saveButton);

    // Item should be removed from cart
    expect(screen.getByText('2 items in your cart')).toBeInTheDocument();

    // Saved for later section should appear
    expect(screen.getByTestId('saved-for-later-section')).toBeInTheDocument();
    expect(screen.getByText('Saved for Later (1)')).toBeInTheDocument();

    // Item should appear in saved section
    const savedSection = screen.getByTestId('saved-for-later-section');
    expect(within(savedSection).getByText('Wireless Headphones')).toBeInTheDocument();
  });

  it('should not display saved for later section when no items saved', () => {
    renderWithRouter(<CartPage />);
    expect(screen.queryByTestId('saved-for-later-section')).not.toBeInTheDocument();
  });

  it('should move item back to cart from saved for later', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CartPage />);

    // First save an item
    const saveButton = screen.getByTestId('save-for-later-1');
    await user.click(saveButton);

    // Then move it back
    const moveToCartButton = screen.getByTestId('move-to-cart-1');
    await user.click(moveToCartButton);

    // Item should be back in cart
    expect(screen.getByText('3 items in your cart')).toBeInTheDocument();

    // Saved for later section should disappear
    expect(screen.queryByTestId('saved-for-later-section')).not.toBeInTheDocument();
  });

  it('should remove saved item permanently', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CartPage />);

    // Save an item
    const saveButton = screen.getByTestId('save-for-later-1');
    await user.click(saveButton);

    expect(screen.getByTestId('saved-for-later-section')).toBeInTheDocument();

    // Remove the saved item
    const removeButton = screen.getByTestId('remove-saved-1');
    await user.click(removeButton);

    // Saved section should disappear
    expect(screen.queryByTestId('saved-for-later-section')).not.toBeInTheDocument();
  });

  it('should increase item quantity', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CartPage />);

    const increaseButton = screen.getByTestId('increase-quantity-1');
    const quantityDisplay = screen.getByTestId('quantity-1');

    expect(quantityDisplay).toHaveTextContent('1');

    await user.click(increaseButton);

    expect(quantityDisplay).toHaveTextContent('2');
  });

  it('should decrease item quantity', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CartPage />);

    const decreaseButton = screen.getByTestId('decrease-quantity-2');
    const quantityDisplay = screen.getByTestId('quantity-2');

    expect(quantityDisplay).toHaveTextContent('2');

    await user.click(decreaseButton);

    expect(quantityDisplay).toHaveTextContent('1');
  });

  it('should not decrease quantity below 1', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CartPage />);

    const decreaseButton = screen.getByTestId('decrease-quantity-1');
    const quantityDisplay = screen.getByTestId('quantity-1');

    expect(quantityDisplay).toHaveTextContent('1');

    await user.click(decreaseButton);

    expect(quantityDisplay).toHaveTextContent('1');
  });

  it('should remove item from cart', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CartPage />);

    const removeButton = screen.getByTestId('remove-item-1');
    await user.click(removeButton);

    expect(screen.getByText('2 items in your cart')).toBeInTheDocument();
    expect(screen.queryByText('Wireless Headphones')).not.toBeInTheDocument();
  });

  it('should display empty cart state when all items removed', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CartPage />);

    // Remove all items
    await user.click(screen.getByTestId('remove-item-1'));
    await user.click(screen.getByTestId('remove-item-2'));
    await user.click(screen.getByTestId('remove-item-3'));

    expect(screen.getByText('Your cart is empty')).toBeInTheDocument();
    expect(screen.getByText('Start adding some products to your cart!')).toBeInTheDocument();
  });

  it('should calculate subtotal correctly', () => {
    renderWithRouter(<CartPage />);
    // 99.99 * 1 + 249.99 * 2 + 49.99 * 1 = 649.96
    expect(screen.getByTestId('subtotal')).toHaveTextContent('$649.96');
  });

  it('should show free shipping when subtotal over 100', () => {
    renderWithRouter(<CartPage />);
    expect(screen.getByTestId('shipping')).toHaveTextContent('FREE');
    expect(screen.getByText('You qualify for free shipping!')).toBeInTheDocument();
  });

  it('should calculate tax correctly', () => {
    renderWithRouter(<CartPage />);
    // tax = 649.96 * 0.08 = 51.9968 ≈ 52.00
    expect(screen.getByTestId('tax')).toHaveTextContent('$52.00');
  });

  it('should calculate total correctly', () => {
    renderWithRouter(<CartPage />);
    // 649.96 (subtotal) + 0 (shipping) + 52.00 (tax) = 701.96
    expect(screen.getByTestId('total')).toHaveTextContent('$701.96');
  });

  it('should apply promo code', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CartPage />);

    const promoInput = screen.getByTestId('promo-code-input');
    const applyButton = screen.getByTestId('apply-promo-button');

    await user.type(promoInput, 'SAVE10');
    await user.click(applyButton);

    expect(screen.getByText('10% discount applied!')).toBeInTheDocument();
    expect(screen.getByTestId('discount')).toBeInTheDocument();
  });

  it('should recalculate total with discount', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CartPage />);

    const promoInput = screen.getByTestId('promo-code-input');
    const applyButton = screen.getByTestId('apply-promo-button');

    await user.type(promoInput, 'SAVE10');
    await user.click(applyButton);

    // discount = 649.96 * 0.1 = 64.996
    expect(screen.getByTestId('discount')).toHaveTextContent('-$65.00');

    // tax = (649.96 - 64.996) * 0.08 = 46.797
    expect(screen.getByTestId('tax')).toHaveTextContent('$46.80');

    // total = 649.96 + 0 - 64.996 + 46.797 = 631.761 ≈ 631.76
    expect(screen.getByTestId('total')).toHaveTextContent('$631.76');
  });

  it('should disable promo code input and button after applying', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CartPage />);

    const promoInput = screen.getByTestId('promo-code-input');
    const applyButton = screen.getByTestId('apply-promo-button');

    await user.type(promoInput, 'SAVE10');
    await user.click(applyButton);

    expect(promoInput).toBeDisabled();
    expect(applyButton).toBeDisabled();
    expect(applyButton).toHaveTextContent('Applied');
  });

  it('should show out of stock warning', () => {
    renderWithRouter(<CartPage />);
    expect(screen.getByText('Some items are out of stock')).toBeInTheDocument();
    expect(
      screen.getByText('Please remove out-of-stock items to proceed with checkout.')
    ).toBeInTheDocument();
  });

  it('should mark out of stock items', () => {
    renderWithRouter(<CartPage />);
    const cartItems = screen.getByTestId('cart-items');
    expect(within(cartItems).getAllByText('Out of Stock')).toHaveLength(1);
  });

  it('should disable checkout button when items out of stock', () => {
    renderWithRouter(<CartPage />);
    const checkoutButton = screen.getByTestId('checkout-button');
    expect(checkoutButton).toBeDisabled();
  });

  it('should disable move to cart button for out of stock saved items', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CartPage />);

    // Save the out-of-stock item
    const saveButton = screen.getByTestId('save-for-later-3');
    await user.click(saveButton);

    // Move to cart button should be disabled
    const moveButton = screen.getByTestId('move-to-cart-3');
    expect(moveButton).toBeDisabled();
  });

  it('should navigate to checkout when button is clicked', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CartPage />);

    // Remove out of stock item first
    const removeButton = screen.getByTestId('remove-item-3');
    await user.click(removeButton);

    const checkoutButton = screen.getByTestId('checkout-button');
    await user.click(checkoutButton);

    expect(mockNavigate).toHaveBeenCalledWith('/checkout');
  });

  it('should navigate to products when browse button clicked in empty cart', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CartPage />);

    // Remove all items
    await user.click(screen.getByTestId('remove-item-1'));
    await user.click(screen.getByTestId('remove-item-2'));
    await user.click(screen.getByTestId('remove-item-3'));

    const browseButton = screen.getByRole('button', { name: 'Browse Products' });
    await user.click(browseButton);

    expect(mockNavigate).toHaveBeenCalledWith('/products');
  });

  it('should disable quantity controls for out of stock items', () => {
    renderWithRouter(<CartPage />);
    expect(screen.getByTestId('increase-quantity-3')).toBeDisabled();
    expect(screen.getByTestId('decrease-quantity-3')).toBeDisabled();
  });

  it('should update item total when quantity changes', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CartPage />);

    const increaseButton = screen.getByTestId('increase-quantity-1');
    await user.click(increaseButton);

    // Item total should be updated (99.99 * 2 = 199.98)
    const cartItems = screen.getByTestId('cart-items');
    expect(within(cartItems).getByText('$199.98')).toBeInTheDocument();
  });

  it('should have accessible structure', () => {
    renderWithRouter(<CartPage />);

    expect(screen.getByRole('heading', { name: 'Shopping Cart' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Order Summary' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Proceed to Checkout' })).toBeInTheDocument();
  });

  it('should display multiple saved items', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CartPage />);

    // Save two items
    await user.click(screen.getByTestId('save-for-later-1'));
    await user.click(screen.getByTestId('save-for-later-2'));

    expect(screen.getByText('Saved for Later (2)')).toBeInTheDocument();

    const savedSection = screen.getByTestId('saved-for-later-section');
    expect(within(savedSection).getByText('Wireless Headphones')).toBeInTheDocument();
    expect(within(savedSection).getByText('Smart Watch')).toBeInTheDocument();
  });
});
