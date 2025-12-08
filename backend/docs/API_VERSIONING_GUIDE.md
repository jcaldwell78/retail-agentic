# API Versioning Guide

This document describes the API versioning strategy used in the Retail Agentic platform.

## Versioning Strategy

We use **URI Path Versioning** as our primary versioning approach. All API endpoints include the version number in the URL path.

### Current Version

The current API version is **v1**.

```
https://api.example.com/api/v1/...
```

### Base URL Pattern

```
/api/{version}/{resource}
```

Examples:
- `/api/v1/products` - Product catalog
- `/api/v1/users` - User management
- `/api/v1/orders` - Order management
- `/api/v1/carts` - Shopping carts

## Version Lifecycle

### Supported Versions

| Version | Status | Support End Date |
|---------|--------|------------------|
| v1 | Current | N/A |

### Version Deprecation Policy

1. **Announcement**: New versions are announced at least 6 months before the previous version is deprecated
2. **Deprecation Period**: Deprecated versions continue to work for 12 months after deprecation announcement
3. **Sunset**: After the deprecation period, deprecated versions return 410 Gone responses

### Deprecation Headers

When a version is deprecated but still functional, responses include:

```http
Deprecation: true
Sunset: Sat, 01 Jan 2026 00:00:00 GMT
Link: </api/v2/products>; rel="successor-version"
```

## Breaking vs Non-Breaking Changes

### Non-Breaking Changes (No Version Bump)

These changes are backward-compatible and don't require a new version:

- Adding new optional fields to request/response
- Adding new endpoints
- Adding new optional query parameters
- Adding new enum values (when clients handle unknown values)
- Performance improvements
- Bug fixes that don't change expected behavior

### Breaking Changes (Require Version Bump)

These changes require a new API version:

- Removing or renaming endpoints
- Removing or renaming fields
- Changing field types
- Changing authentication/authorization requirements
- Changing error response formats
- Changing required fields
- Changing default values that affect behavior

## API Endpoints Reference

### v1 Endpoints

#### Authentication
```
POST   /api/v1/auth/login         - Traditional login
POST   /api/v1/auth/register      - User registration
POST   /api/v1/auth/oauth2/login  - OAuth2 login (Google, Facebook)
POST   /api/v1/auth/logout        - Logout (blacklists JWT)
```

#### Users
```
GET    /api/v1/users/{id}         - Get user by ID
PUT    /api/v1/users/{id}         - Update user profile
PUT    /api/v1/users/{id}/password - Change password
POST   /api/v1/users/{id}/addresses - Add address
```

#### Products
```
GET    /api/v1/products           - List products (paginated)
GET    /api/v1/products/{id}      - Get product details
GET    /api/v1/products/search    - Search products
```

#### Shopping Cart
```
GET    /api/v1/carts/mine         - Get current user's cart
POST   /api/v1/carts/mine/items   - Add item to cart
PUT    /api/v1/carts/mine/items/{id} - Update cart item
DELETE /api/v1/carts/mine/items/{id} - Remove from cart
```

#### Orders
```
GET    /api/v1/orders             - List user's orders
GET    /api/v1/orders/{id}        - Get order details
POST   /api/v1/orders             - Create order
GET    /api/v1/orders/{id}/tracking - Get tracking info
```

#### Wishlist
```
GET    /api/v1/wishlist           - Get user's wishlist
POST   /api/v1/wishlist/items     - Add to wishlist
DELETE /api/v1/wishlist/items/{id} - Remove from wishlist
```

#### Reviews
```
GET    /api/v1/products/{id}/reviews - Get product reviews
POST   /api/v1/products/{id}/reviews - Add review
PUT    /api/v1/reviews/{id}       - Update review
DELETE /api/v1/reviews/{id}       - Delete review
```

#### Product Q&A
```
GET    /api/v1/products/{id}/questions - Get product questions
POST   /api/v1/products/{id}/questions - Ask question
POST   /api/v1/questions/{id}/answers  - Answer question
```

#### GDPR
```
GET    /api/v1/gdpr/export/{userId}      - Export user data
GET    /api/v1/gdpr/export/{userId}/download - Download as file
DELETE /api/v1/gdpr/delete/{userId}      - Delete user data
GET    /api/v1/gdpr/deletion/eligibility/{userId} - Check eligibility
GET    /api/v1/gdpr/info                 - GDPR information
```

## Request/Response Conventions

### Request Headers

```http
Content-Type: application/json
Authorization: Bearer <jwt-token>
X-Tenant-ID: <tenant-id>
X-Request-ID: <unique-request-id>
```

### Response Format

Successful responses:
```json
{
  "id": "123",
  "name": "Product Name",
  "price": 29.99,
  "createdAt": "2025-01-15T10:30:00Z"
}
```

Paginated responses:
```json
{
  "content": [...],
  "page": 0,
  "size": 20,
  "totalElements": 150,
  "totalPages": 8
}
```

Error responses:
```json
{
  "error": "BAD_REQUEST",
  "message": "Validation failed",
  "statusCode": 400,
  "timestamp": "2025-01-15T10:30:00Z",
  "path": "/api/v1/products",
  "fieldErrors": [
    {
      "field": "name",
      "message": "Name is required"
    }
  ]
}
```

### HTTP Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful GET, PUT, PATCH |
| 201 | Created | Successful POST creating resource |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Validation errors |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Resource already exists |
| 410 | Gone | Deprecated version no longer available |
| 422 | Unprocessable Entity | Business logic validation failed |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |

## Multi-Tenant Support

All API requests must include tenant identification:

### Via Header (Recommended)
```http
X-Tenant-ID: store-123
```

### Via Subdomain
```
https://store-123.api.example.com/api/v1/products
```

### Via Path (Legacy)
```
/api/v1/tenants/store-123/products
```

## Rate Limiting

| Endpoint Type | Rate Limit |
|--------------|------------|
| Authentication | 10 req/min |
| General API | 100 req/min |
| Search | 30 req/min |
| Checkout | 5 req/min |

Rate limit headers:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1705319400
```

## OpenAPI Documentation

Interactive API documentation is available at:
- Swagger UI: `/swagger-ui/index.html`
- OpenAPI Spec: `/v3/api-docs`

## Client SDK Guidelines

When building client libraries:

1. **Always specify version** - Don't rely on defaults
2. **Handle deprecation headers** - Log warnings for deprecated versions
3. **Graceful degradation** - Handle new unknown fields gracefully
4. **Retry logic** - Implement exponential backoff for 5xx errors
5. **Request IDs** - Generate unique request IDs for debugging

## Migration Guide

### Migrating to a New Version

1. Review the changelog for breaking changes
2. Update client SDK to support new version
3. Test with new version in staging
4. Gradually migrate traffic (canary release)
5. Monitor for errors
6. Complete migration before sunset date

## Support

For API support:
- Documentation: `/docs`
- Status: `/api/v1/health`
- Contact: api-support@example.com
