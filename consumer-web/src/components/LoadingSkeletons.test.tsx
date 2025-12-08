import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  ProductCardSkeleton,
  ProductGridSkeleton,
  ProductDetailSkeleton,
  CartItemSkeleton,
  CartSkeleton,
  OrderSummarySkeleton,
  ReviewCardSkeleton,
  ReviewsListSkeleton,
  UserProfileSkeleton,
  OrderCardSkeleton,
  OrdersListSkeleton,
  AddressCardSkeleton,
  CategoryCardSkeleton,
  CategoriesGridSkeleton,
  BannerSkeleton,
  NotificationItemSkeleton,
  NotificationsListSkeleton,
  SearchResultsSkeleton,
  TableRowSkeleton,
  TableSkeleton,
  TextBlockSkeleton,
  FormFieldSkeleton,
  FormSkeleton,
  CheckoutSkeleton,
  DashboardSkeleton,
} from './LoadingSkeletons';

describe('ProductCardSkeleton', () => {
  it('should render product card skeleton', () => {
    render(<ProductCardSkeleton />);
    expect(screen.getByTestId('product-card-skeleton')).toBeInTheDocument();
  });

  it('should render image skeleton', () => {
    render(<ProductCardSkeleton />);
    expect(screen.getByTestId('product-image-skeleton')).toBeInTheDocument();
  });

  it('should render title skeleton', () => {
    render(<ProductCardSkeleton />);
    expect(screen.getByTestId('product-title-skeleton')).toBeInTheDocument();
  });

  it('should render price skeleton', () => {
    render(<ProductCardSkeleton />);
    expect(screen.getByTestId('product-price-skeleton')).toBeInTheDocument();
  });

  it('should accept custom className', () => {
    render(<ProductCardSkeleton className="custom-class" />);
    expect(screen.getByTestId('product-card-skeleton')).toHaveClass('custom-class');
  });
});

describe('ProductGridSkeleton', () => {
  it('should render product grid skeleton', () => {
    render(<ProductGridSkeleton />);
    expect(screen.getByTestId('product-grid-skeleton')).toBeInTheDocument();
  });

  it('should render default 8 product cards', () => {
    render(<ProductGridSkeleton />);
    expect(screen.getAllByTestId('product-card-skeleton')).toHaveLength(8);
  });

  it('should respect count prop', () => {
    render(<ProductGridSkeleton count={4} />);
    expect(screen.getAllByTestId('product-card-skeleton')).toHaveLength(4);
  });

  it('should accept custom className', () => {
    render(<ProductGridSkeleton className="custom-class" />);
    expect(screen.getByTestId('product-grid-skeleton')).toHaveClass('custom-class');
  });
});

describe('ProductDetailSkeleton', () => {
  it('should render product detail skeleton', () => {
    render(<ProductDetailSkeleton />);
    expect(screen.getByTestId('product-detail-skeleton')).toBeInTheDocument();
  });

  it('should render main image skeleton', () => {
    render(<ProductDetailSkeleton />);
    expect(screen.getByTestId('main-image-skeleton')).toBeInTheDocument();
  });

  it('should render title skeleton', () => {
    render(<ProductDetailSkeleton />);
    expect(screen.getByTestId('detail-title-skeleton')).toBeInTheDocument();
  });

  it('should render price skeleton', () => {
    render(<ProductDetailSkeleton />);
    expect(screen.getByTestId('detail-price-skeleton')).toBeInTheDocument();
  });

  it('should render add to cart button skeleton', () => {
    render(<ProductDetailSkeleton />);
    expect(screen.getByTestId('add-to-cart-skeleton')).toBeInTheDocument();
  });
});

describe('CartItemSkeleton', () => {
  it('should render cart item skeleton', () => {
    render(<CartItemSkeleton />);
    expect(screen.getByTestId('cart-item-skeleton')).toBeInTheDocument();
  });

  it('should accept custom className', () => {
    render(<CartItemSkeleton className="custom-class" />);
    expect(screen.getByTestId('cart-item-skeleton')).toHaveClass('custom-class');
  });
});

describe('CartSkeleton', () => {
  it('should render cart skeleton', () => {
    render(<CartSkeleton />);
    expect(screen.getByTestId('cart-skeleton')).toBeInTheDocument();
  });

  it('should render default 3 cart items', () => {
    render(<CartSkeleton />);
    expect(screen.getAllByTestId('cart-item-skeleton')).toHaveLength(3);
  });

  it('should respect itemCount prop', () => {
    render(<CartSkeleton itemCount={5} />);
    expect(screen.getAllByTestId('cart-item-skeleton')).toHaveLength(5);
  });
});

describe('OrderSummarySkeleton', () => {
  it('should render order summary skeleton', () => {
    render(<OrderSummarySkeleton />);
    expect(screen.getByTestId('order-summary-skeleton')).toBeInTheDocument();
  });

  it('should accept custom className', () => {
    render(<OrderSummarySkeleton className="custom-class" />);
    expect(screen.getByTestId('order-summary-skeleton')).toHaveClass('custom-class');
  });
});

describe('ReviewCardSkeleton', () => {
  it('should render review card skeleton', () => {
    render(<ReviewCardSkeleton />);
    expect(screen.getByTestId('review-card-skeleton')).toBeInTheDocument();
  });

  it('should accept custom className', () => {
    render(<ReviewCardSkeleton className="custom-class" />);
    expect(screen.getByTestId('review-card-skeleton')).toHaveClass('custom-class');
  });
});

describe('ReviewsListSkeleton', () => {
  it('should render reviews list skeleton', () => {
    render(<ReviewsListSkeleton />);
    expect(screen.getByTestId('reviews-list-skeleton')).toBeInTheDocument();
  });

  it('should render default 3 review cards', () => {
    render(<ReviewsListSkeleton />);
    expect(screen.getAllByTestId('review-card-skeleton')).toHaveLength(3);
  });

  it('should respect count prop', () => {
    render(<ReviewsListSkeleton count={5} />);
    expect(screen.getAllByTestId('review-card-skeleton')).toHaveLength(5);
  });
});

describe('UserProfileSkeleton', () => {
  it('should render user profile skeleton', () => {
    render(<UserProfileSkeleton />);
    expect(screen.getByTestId('user-profile-skeleton')).toBeInTheDocument();
  });

  it('should accept custom className', () => {
    render(<UserProfileSkeleton className="custom-class" />);
    expect(screen.getByTestId('user-profile-skeleton')).toHaveClass('custom-class');
  });
});

describe('OrderCardSkeleton', () => {
  it('should render order card skeleton', () => {
    render(<OrderCardSkeleton />);
    expect(screen.getByTestId('order-card-skeleton')).toBeInTheDocument();
  });

  it('should accept custom className', () => {
    render(<OrderCardSkeleton className="custom-class" />);
    expect(screen.getByTestId('order-card-skeleton')).toHaveClass('custom-class');
  });
});

describe('OrdersListSkeleton', () => {
  it('should render orders list skeleton', () => {
    render(<OrdersListSkeleton />);
    expect(screen.getByTestId('orders-list-skeleton')).toBeInTheDocument();
  });

  it('should render default 3 order cards', () => {
    render(<OrdersListSkeleton />);
    expect(screen.getAllByTestId('order-card-skeleton')).toHaveLength(3);
  });

  it('should respect count prop', () => {
    render(<OrdersListSkeleton count={5} />);
    expect(screen.getAllByTestId('order-card-skeleton')).toHaveLength(5);
  });
});

describe('AddressCardSkeleton', () => {
  it('should render address card skeleton', () => {
    render(<AddressCardSkeleton />);
    expect(screen.getByTestId('address-card-skeleton')).toBeInTheDocument();
  });

  it('should accept custom className', () => {
    render(<AddressCardSkeleton className="custom-class" />);
    expect(screen.getByTestId('address-card-skeleton')).toHaveClass('custom-class');
  });
});

describe('CategoryCardSkeleton', () => {
  it('should render category card skeleton', () => {
    render(<CategoryCardSkeleton />);
    expect(screen.getByTestId('category-card-skeleton')).toBeInTheDocument();
  });

  it('should accept custom className', () => {
    render(<CategoryCardSkeleton className="custom-class" />);
    expect(screen.getByTestId('category-card-skeleton')).toHaveClass('custom-class');
  });
});

describe('CategoriesGridSkeleton', () => {
  it('should render categories grid skeleton', () => {
    render(<CategoriesGridSkeleton />);
    expect(screen.getByTestId('categories-grid-skeleton')).toBeInTheDocument();
  });

  it('should render default 6 category cards', () => {
    render(<CategoriesGridSkeleton />);
    expect(screen.getAllByTestId('category-card-skeleton')).toHaveLength(6);
  });

  it('should respect count prop', () => {
    render(<CategoriesGridSkeleton count={4} />);
    expect(screen.getAllByTestId('category-card-skeleton')).toHaveLength(4);
  });
});

describe('BannerSkeleton', () => {
  it('should render banner skeleton', () => {
    render(<BannerSkeleton />);
    expect(screen.getByTestId('banner-skeleton')).toBeInTheDocument();
  });

  it('should accept custom className', () => {
    render(<BannerSkeleton className="custom-class" />);
    expect(screen.getByTestId('banner-skeleton')).toHaveClass('custom-class');
  });
});

describe('NotificationItemSkeleton', () => {
  it('should render notification item skeleton', () => {
    render(<NotificationItemSkeleton />);
    expect(screen.getByTestId('notification-item-skeleton')).toBeInTheDocument();
  });

  it('should accept custom className', () => {
    render(<NotificationItemSkeleton className="custom-class" />);
    expect(screen.getByTestId('notification-item-skeleton')).toHaveClass('custom-class');
  });
});

describe('NotificationsListSkeleton', () => {
  it('should render notifications list skeleton', () => {
    render(<NotificationsListSkeleton />);
    expect(screen.getByTestId('notifications-list-skeleton')).toBeInTheDocument();
  });

  it('should render default 5 notification items', () => {
    render(<NotificationsListSkeleton />);
    expect(screen.getAllByTestId('notification-item-skeleton')).toHaveLength(5);
  });

  it('should respect count prop', () => {
    render(<NotificationsListSkeleton count={3} />);
    expect(screen.getAllByTestId('notification-item-skeleton')).toHaveLength(3);
  });
});

describe('SearchResultsSkeleton', () => {
  it('should render search results skeleton', () => {
    render(<SearchResultsSkeleton />);
    expect(screen.getByTestId('search-results-skeleton')).toBeInTheDocument();
  });

  it('should include product grid skeleton', () => {
    render(<SearchResultsSkeleton />);
    expect(screen.getByTestId('product-grid-skeleton')).toBeInTheDocument();
  });

  it('should respect count prop for products', () => {
    render(<SearchResultsSkeleton count={4} />);
    expect(screen.getAllByTestId('product-card-skeleton')).toHaveLength(4);
  });
});

describe('TableRowSkeleton', () => {
  it('should render table row skeleton', () => {
    render(
      <table>
        <tbody>
          <TableRowSkeleton />
        </tbody>
      </table>
    );
    expect(screen.getByTestId('table-row-skeleton')).toBeInTheDocument();
  });

  it('should render default 4 columns', () => {
    render(
      <table>
        <tbody>
          <TableRowSkeleton />
        </tbody>
      </table>
    );
    const row = screen.getByTestId('table-row-skeleton');
    expect(row.querySelectorAll('td')).toHaveLength(4);
  });

  it('should respect columns prop', () => {
    render(
      <table>
        <tbody>
          <TableRowSkeleton columns={6} />
        </tbody>
      </table>
    );
    const row = screen.getByTestId('table-row-skeleton');
    expect(row.querySelectorAll('td')).toHaveLength(6);
  });
});

describe('TableSkeleton', () => {
  it('should render table skeleton', () => {
    render(<TableSkeleton />);
    expect(screen.getByTestId('table-skeleton')).toBeInTheDocument();
  });

  it('should render default 5 rows', () => {
    render(<TableSkeleton />);
    expect(screen.getAllByTestId('table-row-skeleton')).toHaveLength(5);
  });

  it('should respect rows prop', () => {
    render(<TableSkeleton rows={3} />);
    expect(screen.getAllByTestId('table-row-skeleton')).toHaveLength(3);
  });

  it('should respect columns prop', () => {
    render(<TableSkeleton columns={6} />);
    const rows = screen.getAllByTestId('table-row-skeleton');
    expect(rows[0].querySelectorAll('td')).toHaveLength(6);
  });
});

describe('TextBlockSkeleton', () => {
  it('should render text block skeleton', () => {
    render(<TextBlockSkeleton />);
    expect(screen.getByTestId('text-block-skeleton')).toBeInTheDocument();
  });

  it('should render default 3 lines', () => {
    render(<TextBlockSkeleton />);
    const container = screen.getByTestId('text-block-skeleton');
    expect(container.children).toHaveLength(3);
  });

  it('should respect lines prop', () => {
    render(<TextBlockSkeleton lines={5} />);
    const container = screen.getByTestId('text-block-skeleton');
    expect(container.children).toHaveLength(5);
  });
});

describe('FormFieldSkeleton', () => {
  it('should render form field skeleton', () => {
    render(<FormFieldSkeleton />);
    expect(screen.getByTestId('form-field-skeleton')).toBeInTheDocument();
  });

  it('should accept custom className', () => {
    render(<FormFieldSkeleton className="custom-class" />);
    expect(screen.getByTestId('form-field-skeleton')).toHaveClass('custom-class');
  });
});

describe('FormSkeleton', () => {
  it('should render form skeleton', () => {
    render(<FormSkeleton />);
    expect(screen.getByTestId('form-skeleton')).toBeInTheDocument();
  });

  it('should render default 4 form fields', () => {
    render(<FormSkeleton />);
    expect(screen.getAllByTestId('form-field-skeleton')).toHaveLength(4);
  });

  it('should respect fields prop', () => {
    render(<FormSkeleton fields={6} />);
    expect(screen.getAllByTestId('form-field-skeleton')).toHaveLength(6);
  });
});

describe('CheckoutSkeleton', () => {
  it('should render checkout skeleton', () => {
    render(<CheckoutSkeleton />);
    expect(screen.getByTestId('checkout-skeleton')).toBeInTheDocument();
  });

  it('should include order summary skeleton', () => {
    render(<CheckoutSkeleton />);
    expect(screen.getByTestId('order-summary-skeleton')).toBeInTheDocument();
  });

  it('should include form skeletons', () => {
    render(<CheckoutSkeleton />);
    expect(screen.getAllByTestId('form-skeleton')).toHaveLength(2);
  });
});

describe('DashboardSkeleton', () => {
  it('should render dashboard skeleton', () => {
    render(<DashboardSkeleton />);
    expect(screen.getByTestId('dashboard-skeleton')).toBeInTheDocument();
  });

  it('should include table skeleton', () => {
    render(<DashboardSkeleton />);
    expect(screen.getByTestId('table-skeleton')).toBeInTheDocument();
  });

  it('should accept custom className', () => {
    render(<DashboardSkeleton className="custom-class" />);
    expect(screen.getByTestId('dashboard-skeleton')).toHaveClass('custom-class');
  });
});

describe('Skeleton Animation', () => {
  it('should have animate-pulse class on skeletons', () => {
    render(<ProductCardSkeleton />);
    const imageSkeleton = screen.getByTestId('product-image-skeleton');
    expect(imageSkeleton).toHaveClass('animate-pulse');
  });
});
