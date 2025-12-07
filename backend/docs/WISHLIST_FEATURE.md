# Wishlist Feature Documentation

## Overview

The wishlist feature allows users to save products they're interested in for future reference. Users can add/remove items from their wishlist and receive notifications when items go on sale or come back in stock.

## Domain Model

### Wishlist Entity

Located in `com.retail.domain.wishlist.Wishlist`

```java
@Document(collection = "wishlists")
public class Wishlist {
    private String id;
    private String tenantId;       // Multi-tenant isolation
    private String userId;
    private List<WishlistItem> items;
    private Instant createdAt;
    private Instant updatedAt;
}
```

### WishlistItem Record

```java
public record WishlistItem(
    String productId,
    String name,
    String imageUrl,
    BigDecimal price,
    Instant addedAt,
    String notes
) {}
```

## API Endpoints

Base path: `/api/v1/wishlists`

### Get User's Wishlist

```http
GET /api/v1/wishlists?userId={userId}
```

**Response**: `200 OK`
```json
{
  "id": "wishlist-123",
  "userId": "user-456",
  "items": [
    {
      "productId": "product-789",
      "name": "Premium Headphones",
      "imageUrl": "https://example.com/image.jpg",
      "price": 299.99,
      "addedAt": "2025-12-06T10:30:00Z",
      "notes": "Birthday gift idea"
    }
  ],
  "createdAt": "2025-12-01T10:00:00Z",
  "updatedAt": "2025-12-06T10:30:00Z"
}
```

### Add Item to Wishlist

```http
POST /api/v1/wishlists?userId={userId}&productId={productId}
```

**Request Body** (optional):
```json
{
  "notes": "Birthday gift idea"
}
```

**Response**: `200 OK`
Returns updated wishlist.

### Remove Item from Wishlist

```http
DELETE /api/v1/wishlists/items/{productId}?userId={userId}
```

**Response**: `200 OK`
Returns updated wishlist.

### Clear Wishlist

```http
DELETE /api/v1/wishlists?userId={userId}
```

**Response**: `204 No Content`

### Check if Product is in Wishlist

```http
GET /api/v1/wishlists/contains?userId={userId}&productId={productId}
```

**Response**: `200 OK`
```json
{
  "inWishlist": true
}
```

## Notifications

### Price Drop Notifications

The system monitors wishlist items for price changes and sends notifications when prices drop.

**Service**: `PriceDropDetectionService`
**Schedule**: Every 6 hours (configurable via `@Scheduled`)

#### Detection Logic

1. Fetch all unique products from all wishlists
2. Compare current price with stored price in wishlist
3. If price decreased by 5% or more, trigger notification
4. Send email notification to affected users
5. Update stored price in wishlist

#### Email Template

Template: `backend/src/main/resources/templates/email/price-drop-alert.html`

Features:
- Product image and details
- Old price vs new price comparison
- Savings amount and percentage
- Call-to-action button to view product

### Back-in-Stock Notifications

Monitors wishlist items for stock changes and notifies users when out-of-stock items become available.

**Service**: `WishlistNotificationHandler`

#### Detection Logic

1. Fetch all unique products from wishlists
2. Compare current inventory status with previous status
3. If item was out of stock and now in stock, trigger notification
4. Send email notification to affected users

#### Email Template

Template: `backend/src/main/resources/templates/email/stock-alert.html`

Features:
- Product image and details
- Stock availability message
- Current price
- Call-to-action button to view product

### Bulk Notifications

For users with multiple items affected:

**Price Drop**: `bulk-price-drop-alert.html`
- Lists all items with price reductions
- Shows total savings across all items
- Grouped product cards

**Stock Alert**: `bulk-stock-alert.html`
- Lists all items back in stock
- Clean card-based layout
- Single email for multiple items

## Multi-Tenant Architecture

All wishlist operations are tenant-aware:

1. **TenantId Injection**: Automatically injected from reactive context
2. **Data Isolation**: All queries filter by tenantId
3. **Repository**: Extends `TenantAwareRepository<Wishlist, String>`

### Tenant Context Flow

```java
TenantContext.getTenantId()
    .flatMap(tenantId -> wishlistRepository.findByUserIdAndTenantId(userId, tenantId))
```

The `TenantContext` provides:
- Automatic tenantId extraction from security context
- Thread-safe reactive context propagation
- Query-level tenant isolation

## Service Layer

### WishlistService

Located in `com.retail.domain.wishlist.WishlistService`

**Key Methods**:

- `getWishlistByUserId(String userId)` - Get user's wishlist
- `addItemToWishlist(String userId, String productId, String notes)` - Add item
- `removeItemFromWishlist(String userId, String productId)` - Remove item
- `clearWishlist(String userId)` - Clear all items
- `isProductInWishlist(String userId, String productId)` - Check if product exists

**Dependencies**:
- `WishlistRepository` - Data access
- `ProductService` - Fetch product details
- `TenantContext` - Multi-tenant isolation

### PriceDropDetectionService

Located in `com.retail.domain.wishlist.PriceDropDetectionService`

**Key Methods**:

- `checkForPriceDrops()` - Scheduled method (runs every 6 hours)
- `detectPriceDrops(List<Product> products, List<Wishlist> wishlists)` - Price comparison logic

**Schedule**: Configured via `@Scheduled(cron = "0 0 */6 * * *")`

## Repository Layer

### WishlistRepository

Located in `com.retail.infrastructure.persistence.WishlistRepository`

Extends `TenantAwareRepository<Wishlist, String>` for automatic tenant filtering.

**Custom Queries**:

```java
Mono<Wishlist> findByUserIdAndTenantId(String userId, String tenantId);
Flux<Wishlist> findByTenantIdAndItems_ProductId(String tenantId, String productId);
```

## Testing

### Unit Tests

**WishlistServiceTest**: Tests service logic with mocked dependencies
- Add/remove items
- Clear wishlist
- Product lookup integration
- Tenant isolation

**WishlistControllerTest**: WebFlux controller tests
- API endpoint validation
- Request/response mapping
- Error handling
- HTTP status codes

### Integration Tests

Tests database operations with embedded MongoDB (if configured) or mocked repository.

## Configuration

### Application Properties

```yaml
# Notification Schedule (optional override)
wishlist:
  price-drop:
    check-interval: "0 0 */6 * * *"  # Every 6 hours

# Email Configuration
spring:
  mail:
    host: smtp.example.com
    port: 587
    username: ${SMTP_USERNAME}
    password: ${SMTP_PASSWORD}
```

## Error Handling

All endpoints return appropriate HTTP status codes:

- `200 OK` - Successful operation
- `404 NOT FOUND` - Wishlist or product not found
- `400 BAD REQUEST` - Invalid request parameters
- `500 INTERNAL SERVER ERROR` - Server errors

## Security Considerations

1. **User Isolation**: Users can only access their own wishlists
2. **Tenant Isolation**: All operations enforce tenant boundaries
3. **Input Validation**: Product IDs and user IDs validated
4. **Authorization**: User authentication required for all operations

## Future Enhancements

Potential improvements:

1. **Wishlist Sharing**: Allow users to share wishlists
2. **Multiple Wishlists**: Support multiple named wishlists per user
3. **Advanced Notifications**:
   - Custom notification preferences per item
   - Price target alerts (notify when price drops below X)
   - SMS notifications
4. **Analytics**: Track wishlist conversion rates
5. **Public Wishlists**: Shareable public wishlist URLs
6. **Wishlist Templates**: Pre-configured wishlist categories

## Related Documentation

- [Product API Documentation](./PRODUCT_API.md)
- [Notification System](./NOTIFICATIONS.md)
- [Multi-Tenant Architecture](../CLAUDE.md#multi-tenancy-architecture)
