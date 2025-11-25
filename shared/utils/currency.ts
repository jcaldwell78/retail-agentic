/**
 * Currency formatting utilities
 */

export function formatCurrency(
  amount: number,
  currency: string = 'USD',
  locale: string = 'en-US'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
}

export function parseCurrency(value: string): number {
  const cleaned = value.replace(/[^0-9.-]+/g, '');
  return parseFloat(cleaned) || 0;
}

export function calculateDiscount(
  price: number,
  compareAtPrice: number
): number {
  if (!compareAtPrice || compareAtPrice <= price) {
    return 0;
  }
  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
}

export function calculateTotal(
  subtotal: number,
  tax: number = 0,
  shipping: number = 0,
  discount: number = 0
): number {
  return Math.max(0, subtotal + tax + shipping - discount);
}
