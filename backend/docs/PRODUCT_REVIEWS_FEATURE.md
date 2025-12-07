# Product Reviews Feature Documentation

## Overview

The product review system allows users to submit ratings and reviews for products they've purchased. Reviews include moderation workflow, helpfulness voting, and statistical aggregation.

## Domain Model

### ProductReview Entity

Located in `com.retail.domain.review.ProductReview`

```java
@Document(collection = "product_reviews")
public class ProductReview {
    private String id;
    private String tenantId;           // Multi-tenant isolation
    private String productId;
    private String userId;
    private String userName;           // Cached for display
    private Integer rating;            // 1-5 stars
    private String title;
    private String comment;
    private List<String> images;       // Review images URLs
    private Boolean verifiedPurchase;  // User purchased product
    private Integer helpfulCount;
    private Integer notHelpfulCount;
    private ReviewStatus status;       // PENDING, APPROVED, REJECTED, FLAGGED
    private Instant createdAt;
    private Instant updatedAt;
    private Instant verifiedAt;        // Approval timestamp
}
```

### ReviewStatus Enum

```java
public enum ReviewStatus {
    PENDING,    // Awaiting moderation
    APPROVED,   // Published
    REJECTED,   // Rejected by moderator
    FLAGGED     // Flagged for review
}
```

### ReviewStatistics

```java
public class ReviewStatistics {
    private Double averageRating;
    private Integer totalReviews;
    private int[] ratingDistribution;  // [1-star, 2-star, 3-star, 4-star, 5-star] counts
}
```

## API Endpoints

Base path: `/api/v1/reviews`

### Submit a Review

```http
POST /api/v1/reviews/products/{productId}?userId={userId}
```

**Request Body**:
```json
{
  "rating": 5,
  "title": "Excellent product!",
  "comment": "This product exceeded my expectations. Highly recommend!",
  "images": [
    "https://cdn.example.com/review-image-1.jpg",
    "https://cdn.example.com/review-image-2.jpg"
  ]
}
```

**Validation Rules**:
- `rating`: Required, must be between 1-5
- `title`: Required, max 200 characters
- `comment`: Required, max 2000 characters
- `images`: Optional, list of image URLs

**Response**: `201 Created`
```json
{
  "id": "review-123",
  "productId": "product-456",
  "userId": "user-789",
  "userName": "John D.",
  "rating": 5,
  "title": "Excellent product!",
  "comment": "This product exceeded my expectations...",
  "images": ["https://cdn.example.com/review-image-1.jpg"],
  "verifiedPurchase": true,
  "helpfulCount": 0,
  "notHelpfulCount": 0,
  "status": "PENDING",
  "createdAt": "2025-12-06T10:30:00Z",
  "updatedAt": "2025-12-06T10:30:00Z"
}
```

**Error Responses**:
- `409 Conflict` - User already reviewed this product
- `400 Bad Request` - Validation errors

### Get Product Reviews

```http
GET /api/v1/reviews/products/{productId}
```

Returns all **approved** reviews for a product (sorted by most recent).

**Response**: `200 OK`
```json
[
  {
    "id": "review-123",
    "productId": "product-456",
    "userName": "John D.",
    "rating": 5,
    "title": "Excellent product!",
    "comment": "This product exceeded my expectations...",
    "verifiedPurchase": true,
    "helpfulCount": 42,
    "notHelpfulCount": 3,
    "createdAt": "2025-12-06T10:30:00Z"
  }
]
```

### Get Product Review Statistics

```http
GET /api/v1/reviews/products/{productId}/statistics
```

**Response**: `200 OK`
```json
{
  "averageRating": 4.6,
  "totalReviews": 156,
  "ratingDistribution": [2, 5, 12, 35, 102]
}
```

**Helper Methods on ReviewStatistics**:
- `getFiveStarCount()` → `102`
- `getFourStarCount()` → `35`
- `getRatingPercentage(5)` → `65.4` (percentage of 5-star reviews)

### Get User's Reviews

```http
GET /api/v1/reviews/users/{userId}
```

Returns all reviews submitted by a specific user.

**Response**: `200 OK`
```json
[
  {
    "id": "review-123",
    "productId": "product-456",
    "rating": 5,
    "title": "Excellent product!",
    "status": "APPROVED",
    "createdAt": "2025-12-06T10:30:00Z"
  }
]
```

### Mark Review as Helpful

```http
POST /api/v1/reviews/{reviewId}/helpful
```

**Response**: `200 OK`
Returns updated review with incremented `helpfulCount`.

### Mark Review as Not Helpful

```http
POST /api/v1/reviews/{reviewId}/not-helpful
```

**Response**: `200 OK`
Returns updated review with incremented `notHelpfulCount`.

### Delete a Review

```http
DELETE /api/v1/reviews/{reviewId}?userId={userId}
```

Users can only delete their own reviews. Admins can delete any review.

**Response**: `204 No Content`

**Error Responses**:
- `403 Forbidden` - User doesn't own the review

## Admin Endpoints

### Get Pending Reviews for Moderation

```http
GET /api/v1/reviews/admin/pending
```

Returns all reviews with `PENDING` status for moderation.

**Response**: `200 OK`
```json
[
  {
    "id": "review-789",
    "productId": "product-456",
    "userId": "user-123",
    "userName": "Jane S.",
    "rating": 4,
    "title": "Good quality",
    "comment": "The product works well but shipping was slow.",
    "status": "PENDING",
    "createdAt": "2025-12-06T15:00:00Z"
  }
]
```

### Approve a Review

```http
POST /api/v1/reviews/admin/{reviewId}/approve
```

Changes status to `APPROVED` and sets `verifiedAt` timestamp.

**Response**: `200 OK`
Returns updated review.

### Reject a Review

```http
POST /api/v1/reviews/admin/{reviewId}/reject?reason={reason}
```

Changes status to `REJECTED`.

**Query Parameters**:
- `reason`: Reason for rejection (e.g., "Inappropriate content", "Spam")

**Response**: `200 OK`
Returns updated review.

## Business Logic

### Verified Purchase Badge

Reviews are automatically marked with `verifiedPurchase: true` if the user has purchased the product.

**Implementation**:
- Checks `OrderService.hasUserPurchasedProduct(userId, productId)`
- Currently returns `false` (placeholder) until Order-User integration is complete
- Future: Will query order history to verify purchase

### Review Moderation Workflow

```
User submits review
    ↓
Status: PENDING
    ↓
Admin reviews
    ↓
Approve → Status: APPROVED (visible to public)
    OR
Reject → Status: REJECTED (not visible)
```

### Duplicate Review Prevention

Users can only submit one review per product. Attempting to submit a second review returns `409 Conflict`.

**Implementation**:
```java
reviewRepository.findByTenantIdAndProductIdAndUserId(tenantId, productId, userId)
    .hasElements()
    .flatMap(exists -> {
        if (exists) {
            return Mono.error(new IllegalStateException("You have already reviewed this product"));
        }
        // ... save review
    })
```

### Rating Statistics Calculation

The `ReviewStatistics` aggregation:

1. Fetches all approved reviews for a product
2. Calculates average rating
3. Counts reviews for each star rating (1-5)
4. Returns distribution array: `[1-star count, 2-star count, ..., 5-star count]`

**Example**:
- Total Reviews: 100
- 5-star: 60, 4-star: 25, 3-star: 10, 2-star: 3, 1-star: 2
- Average: 4.38
- Distribution: `[2, 3, 10, 25, 60]`

## Multi-Tenant Architecture

All review operations are tenant-aware:

1. **TenantId Injection**: Automatically injected from reactive context
2. **Data Isolation**: All queries filter by tenantId
3. **Repository**: Extends `TenantAwareRepository<ProductReview, String>`

### Tenant Context Flow

```java
TenantContext.getTenantId()
    .flatMapMany(tenantId ->
        reviewRepository.findApprovedByProduct(tenantId, productId)
    )
```

## Service Layer

### ProductReviewService

Located in `com.retail.domain.review.ProductReviewService`

**Key Methods**:

- `submitReview(userId, productId, review)` - Submit new review
- `getProductReviews(productId)` - Get approved reviews
- `getProductStatistics(productId)` - Calculate rating statistics
- `getUserReviews(userId)` - Get user's reviews
- `markHelpful(reviewId)` - Increment helpful count
- `markNotHelpful(reviewId)` - Increment not-helpful count
- `approveReview(reviewId)` - Admin approval
- `rejectReview(reviewId, reason)` - Admin rejection
- `getPendingReviews()` - Get reviews awaiting moderation
- `deleteReview(reviewId, userId, isAdmin)` - Delete review

**Dependencies**:
- `ProductReviewRepository` - Data access
- `UserService` - Fetch user details for display name
- `OrderService` - Verify purchase for verified badge
- `TenantContext` - Multi-tenant isolation

## Repository Layer

### ProductReviewRepository

Located in `com.retail.infrastructure.persistence.ProductReviewRepository`

Extends `TenantAwareRepository<ProductReview, String>` for automatic tenant filtering.

**Custom Queries**:

```java
@Query("{ 'tenantId': ?0, 'productId': ?1, 'status': 'APPROVED' }")
Flux<ProductReview> findApprovedByProduct(String tenantId, String productId);

Flux<ProductReview> findByTenantIdAndUserId(String tenantId, String userId);

Flux<ProductReview> findByTenantIdAndProductIdAndUserId(String tenantId, String productId, String userId);

Flux<ProductReview> findByTenantIdAndStatus(String tenantId, ReviewStatus status);

@Query(value = "{ 'tenantId': ?0, 'productId': ?1, 'status': 'APPROVED' }",
       fields = "{ 'rating': 1 }")
Flux<ProductReview> findRatingsByProduct(String tenantId, String productId);
```

## Database Indexes

MongoDB indexes for performance:

```java
@CompoundIndex(name = "tenant_product", def = "{'tenantId': 1, 'productId': 1}")
@CompoundIndex(name = "product_rating", def = "{'productId': 1, 'rating': -1}")
```

**Indexed Fields**:
- `tenantId` - Tenant isolation
- `productId` - Product queries
- `userId` - User queries
- `status` - Moderation filtering
- `createdAt` - Sorting by date

## Testing

### Unit Tests

**ProductReviewServiceTest**: Tests service logic with mocked dependencies
- Submit review (success, duplicate detection)
- Get product reviews (approved only)
- Mark helpful/not-helpful
- Approve/reject reviews
- Calculate statistics
- Delete review (owner vs admin)

**ProductReviewControllerTest**: WebFlux controller tests
- API endpoint validation
- Request/response mapping
- Validation error handling
- HTTP status codes
- Admin endpoints

### Test Coverage

- 10 tests in `ProductReviewServiceTest`
- 13 tests in `ProductReviewControllerTest`
- Covers all major user flows and edge cases

## Integration with Product Catalog

Reviews integrate with the product catalog to show:

1. **Average Rating**: Display on product cards and detail pages
2. **Review Count**: "156 reviews" badge
3. **Rating Distribution**: Star rating breakdown histogram
4. **Recent Reviews**: Show latest approved reviews

### Product Model Integration

The `Product` entity may cache review statistics for performance:

```java
// Future enhancement
private ReviewStatistics cachedReviewStats;
private Instant reviewStatsUpdatedAt;
```

## Security Considerations

1. **User Isolation**: Users can only delete their own reviews
2. **Tenant Isolation**: All operations enforce tenant boundaries
3. **Input Validation**: Rating (1-5), text length limits
4. **Moderation**: Reviews pending until admin approval
5. **Authorization**: Admin-only endpoints protected

## Performance Optimization

### Caching Strategy (Future)

```java
@Cacheable(value = "review-statistics", key = "#productId")
public Mono<ReviewStatistics> getProductStatistics(String productId)
```

### Query Optimization

- Compound indexes on `tenantId + productId`
- Projection queries for statistics (only fetch `rating` field)
- Pagination for large review lists

## Error Handling

All endpoints return appropriate HTTP status codes:

- `200 OK` - Successful operation
- `201 Created` - Review submitted
- `204 No Content` - Review deleted
- `400 BAD REQUEST` - Validation errors
- `403 FORBIDDEN` - User cannot delete review
- `404 NOT FOUND` - Review not found
- `409 CONFLICT` - Duplicate review
- `500 INTERNAL SERVER ERROR` - Server errors

## Future Enhancements

Potential improvements:

1. **Review Replies**: Allow sellers to respond to reviews
2. **Review Voting**: Track which users voted (prevent duplicate votes)
3. **Image Upload**: Direct image upload instead of URL only
4. **Review Questions**: Q&A section on reviews
5. **Review Incentives**: Reward points for verified reviews
6. **Sentiment Analysis**: Auto-flag negative reviews for priority moderation
7. **Review Templates**: Category-specific review questions (e.g., "Fit" for clothing)
8. **Trending Reviews**: Sort by helpfulness, not just date
9. **Video Reviews**: Support video content
10. **Review Search**: Full-text search within reviews

## Related Documentation

- [Wishlist Feature](./WISHLIST_FEATURE.md)
- [Product API Documentation](./PRODUCT_API.md)
- [Multi-Tenant Architecture](../CLAUDE.md#multi-tenancy-architecture)
- [User Management](./USER_MANAGEMENT.md)
