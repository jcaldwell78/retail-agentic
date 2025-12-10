# API Code Examples

This document provides practical code examples for common API operations in the Retail Agentic platform.

## Table of Contents

- [Authentication](#authentication)
- [Products](#products)
- [Shopping Cart](#shopping-cart)
- [Orders](#orders)
- [Wishlist](#wishlist)
- [Reviews](#reviews)
- [Product Q&A](#product-qa)
- [GDPR Operations](#gdpr-operations)

## Prerequisites

All examples assume:
- Base URL: `https://api.example.com`
- API version: `v1`
- Content-Type: `application/json`
- Tenant ID is provided via header: `X-Tenant-ID`

---

## Authentication

### Register a New User

**cURL**
```bash
curl -X POST https://api.example.com/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: store-123" \
  -d '{
    "email": "user@example.com",
    "password": "SecureP@ss123",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

**JavaScript (fetch)**
```javascript
const response = await fetch('https://api.example.com/api/v1/auth/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Tenant-ID': 'store-123'
  },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'SecureP@ss123',
    firstName: 'John',
    lastName: 'Doe'
  })
});

const data = await response.json();
// data.token contains the JWT token
```

**Python (requests)**
```python
import requests

response = requests.post(
    'https://api.example.com/api/v1/auth/register',
    headers={
        'Content-Type': 'application/json',
        'X-Tenant-ID': 'store-123'
    },
    json={
        'email': 'user@example.com',
        'password': 'SecureP@ss123',
        'firstName': 'John',
        'lastName': 'Doe'
    }
)

data = response.json()
token = data['token']
```

**Response**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-uuid-123",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "CUSTOMER"
  }
}
```

### Login

**cURL**
```bash
curl -X POST https://api.example.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: store-123" \
  -d '{
    "email": "user@example.com",
    "password": "SecureP@ss123"
  }'
```

**JavaScript (fetch)**
```javascript
const response = await fetch('https://api.example.com/api/v1/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Tenant-ID': 'store-123'
  },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'SecureP@ss123'
  })
});

const { token, user } = await response.json();
// Store token for subsequent requests
localStorage.setItem('authToken', token);
```

### OAuth2 Login (Google/Facebook)

**JavaScript (fetch)**
```javascript
// Exchange OAuth code for JWT token
const response = await fetch('https://api.example.com/api/v1/auth/oauth2/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Tenant-ID': 'store-123'
  },
  body: JSON.stringify({
    provider: 'google', // or 'facebook'
    code: 'oauth-authorization-code',
    redirectUri: 'https://yourstore.com/oauth/callback'
  })
});

const { token, user } = await response.json();
```

### Logout

**cURL**
```bash
curl -X POST https://api.example.com/api/v1/auth/logout \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "X-Tenant-ID: store-123"
```

**JavaScript (fetch)**
```javascript
await fetch('https://api.example.com/api/v1/auth/logout', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'X-Tenant-ID': 'store-123'
  }
});

// Clear local token
localStorage.removeItem('authToken');
```

---

## Products

### List Products (Paginated)

**cURL**
```bash
curl -X GET "https://api.example.com/api/v1/products?page=0&size=20&sort=createdAt,desc" \
  -H "X-Tenant-ID: store-123"
```

**JavaScript (fetch)**
```javascript
const params = new URLSearchParams({
  page: 0,
  size: 20,
  sort: 'createdAt,desc',
  category: 'electronics',    // Optional: filter by category
  minPrice: 10,               // Optional: minimum price
  maxPrice: 500               // Optional: maximum price
});

const response = await fetch(`https://api.example.com/api/v1/products?${params}`, {
  headers: {
    'X-Tenant-ID': 'store-123'
  }
});

const { content, page, size, totalElements, totalPages } = await response.json();
```

**Response**
```json
{
  "content": [
    {
      "id": "prod-123",
      "name": "Wireless Headphones",
      "description": "Premium noise-canceling headphones",
      "price": 199.99,
      "compareAtPrice": 249.99,
      "category": "electronics",
      "images": [
        "https://cdn.example.com/products/headphones-1.jpg"
      ],
      "variants": [
        { "id": "var-1", "name": "Black", "sku": "WH-BLK-001" },
        { "id": "var-2", "name": "White", "sku": "WH-WHT-001" }
      ],
      "status": "ACTIVE",
      "inventory": {
        "quantity": 45,
        "lowStockThreshold": 10
      },
      "createdAt": "2025-01-15T10:30:00Z"
    }
  ],
  "page": 0,
  "size": 20,
  "totalElements": 150,
  "totalPages": 8
}
```

### Search Products

**cURL**
```bash
curl -X GET "https://api.example.com/api/v1/products/search?q=wireless+headphones&page=0&size=20" \
  -H "X-Tenant-ID: store-123"
```

**JavaScript (fetch)**
```javascript
const params = new URLSearchParams({
  q: 'wireless headphones',
  page: 0,
  size: 20,
  category: 'electronics',    // Optional filter
  inStock: true               // Optional: only in-stock items
});

const response = await fetch(`https://api.example.com/api/v1/products/search?${params}`, {
  headers: {
    'X-Tenant-ID': 'store-123'
  }
});

const results = await response.json();
```

### Get Product Details

**cURL**
```bash
curl -X GET https://api.example.com/api/v1/products/prod-123 \
  -H "X-Tenant-ID: store-123"
```

**JavaScript (fetch)**
```javascript
const response = await fetch('https://api.example.com/api/v1/products/prod-123', {
  headers: {
    'X-Tenant-ID': 'store-123'
  }
});

const product = await response.json();
```

---

## Shopping Cart

### Get Current Cart

**cURL**
```bash
curl -X GET https://api.example.com/api/v1/carts/mine \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "X-Tenant-ID: store-123"
```

**JavaScript (fetch)**
```javascript
const response = await fetch('https://api.example.com/api/v1/carts/mine', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'X-Tenant-ID': 'store-123'
  }
});

const cart = await response.json();
```

**Response**
```json
{
  "id": "cart-456",
  "userId": "user-123",
  "items": [
    {
      "id": "item-1",
      "productId": "prod-123",
      "productName": "Wireless Headphones",
      "variantId": "var-1",
      "variantName": "Black",
      "quantity": 2,
      "unitPrice": 199.99,
      "totalPrice": 399.98,
      "imageUrl": "https://cdn.example.com/products/headphones-1.jpg"
    }
  ],
  "subtotal": 399.98,
  "tax": 32.00,
  "shipping": 0,
  "discount": 0,
  "total": 431.98,
  "promoCode": null,
  "itemCount": 2
}
```

### Add Item to Cart

**cURL**
```bash
curl -X POST https://api.example.com/api/v1/carts/mine/items \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: store-123" \
  -d '{
    "productId": "prod-123",
    "variantId": "var-1",
    "quantity": 1
  }'
```

**JavaScript (fetch)**
```javascript
const response = await fetch('https://api.example.com/api/v1/carts/mine/items', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'X-Tenant-ID': 'store-123'
  },
  body: JSON.stringify({
    productId: 'prod-123',
    variantId: 'var-1',
    quantity: 1
  })
});

const updatedCart = await response.json();
```

### Update Cart Item Quantity

**cURL**
```bash
curl -X PUT https://api.example.com/api/v1/carts/mine/items/item-1 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: store-123" \
  -d '{
    "quantity": 3
  }'
```

**JavaScript (fetch)**
```javascript
const response = await fetch('https://api.example.com/api/v1/carts/mine/items/item-1', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'X-Tenant-ID': 'store-123'
  },
  body: JSON.stringify({
    quantity: 3
  })
});

const updatedCart = await response.json();
```

### Remove Item from Cart

**cURL**
```bash
curl -X DELETE https://api.example.com/api/v1/carts/mine/items/item-1 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "X-Tenant-ID: store-123"
```

**JavaScript (fetch)**
```javascript
await fetch('https://api.example.com/api/v1/carts/mine/items/item-1', {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${token}`,
    'X-Tenant-ID': 'store-123'
  }
});
```

### Apply Promo Code

**cURL**
```bash
curl -X POST https://api.example.com/api/v1/carts/mine/promo \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: store-123" \
  -d '{
    "code": "SAVE20"
  }'
```

---

## Orders

### Create Order (Checkout)

**cURL**
```bash
curl -X POST https://api.example.com/api/v1/orders \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: store-123" \
  -d '{
    "shippingAddress": {
      "firstName": "John",
      "lastName": "Doe",
      "street": "123 Main St",
      "city": "New York",
      "state": "NY",
      "zipCode": "10001",
      "country": "US",
      "phone": "+1-555-123-4567"
    },
    "billingAddress": {
      "sameAsShipping": true
    },
    "paymentMethod": {
      "type": "card",
      "paymentMethodId": "pm_card_visa_123"
    },
    "shippingMethod": "standard"
  }'
```

**JavaScript (fetch)**
```javascript
const response = await fetch('https://api.example.com/api/v1/orders', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'X-Tenant-ID': 'store-123'
  },
  body: JSON.stringify({
    shippingAddress: {
      firstName: 'John',
      lastName: 'Doe',
      street: '123 Main St',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'US',
      phone: '+1-555-123-4567'
    },
    billingAddress: {
      sameAsShipping: true
    },
    paymentMethod: {
      type: 'card',
      paymentMethodId: 'pm_card_visa_123'
    },
    shippingMethod: 'standard'
  })
});

const order = await response.json();
```

**Response**
```json
{
  "id": "order-789",
  "orderNumber": "ORD-2025-001234",
  "status": "CONFIRMED",
  "items": [...],
  "subtotal": 399.98,
  "tax": 32.00,
  "shipping": 9.99,
  "discount": 0,
  "total": 441.97,
  "shippingAddress": {...},
  "paymentStatus": "PAID",
  "createdAt": "2025-01-15T10:30:00Z",
  "estimatedDelivery": "2025-01-22"
}
```

### Get Order Details

**cURL**
```bash
curl -X GET https://api.example.com/api/v1/orders/order-789 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "X-Tenant-ID: store-123"
```

### List User's Orders

**cURL**
```bash
curl -X GET "https://api.example.com/api/v1/orders?page=0&size=10" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "X-Tenant-ID: store-123"
```

**JavaScript (fetch)**
```javascript
const params = new URLSearchParams({
  page: 0,
  size: 10,
  status: 'SHIPPED'  // Optional: filter by status
});

const response = await fetch(`https://api.example.com/api/v1/orders?${params}`, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'X-Tenant-ID': 'store-123'
  }
});

const { content: orders, totalElements } = await response.json();
```

### Get Order Tracking

**cURL**
```bash
curl -X GET https://api.example.com/api/v1/orders/order-789/tracking \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "X-Tenant-ID: store-123"
```

**Response**
```json
{
  "orderId": "order-789",
  "orderNumber": "ORD-2025-001234",
  "carrier": "UPS",
  "trackingNumber": "1Z999AA10123456784",
  "trackingUrl": "https://www.ups.com/track?tracknum=1Z999AA10123456784",
  "status": "IN_TRANSIT",
  "estimatedDelivery": "2025-01-22",
  "statusHistory": [
    {
      "status": "CONFIRMED",
      "timestamp": "2025-01-15T10:30:00Z",
      "description": "Order confirmed"
    },
    {
      "status": "PROCESSING",
      "timestamp": "2025-01-15T14:00:00Z",
      "description": "Order being prepared"
    },
    {
      "status": "SHIPPED",
      "timestamp": "2025-01-16T09:00:00Z",
      "description": "Package shipped via UPS"
    },
    {
      "status": "IN_TRANSIT",
      "timestamp": "2025-01-17T08:00:00Z",
      "description": "Package in transit"
    }
  ]
}
```

---

## Wishlist

### Get Wishlist

**cURL**
```bash
curl -X GET https://api.example.com/api/v1/wishlist \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "X-Tenant-ID: store-123"
```

**JavaScript (fetch)**
```javascript
const response = await fetch('https://api.example.com/api/v1/wishlist', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'X-Tenant-ID': 'store-123'
  }
});

const wishlist = await response.json();
```

**Response**
```json
{
  "id": "wishlist-123",
  "userId": "user-123",
  "items": [
    {
      "id": "item-1",
      "productId": "prod-123",
      "productName": "Wireless Headphones",
      "price": 199.99,
      "originalPrice": 249.99,
      "priceDropped": true,
      "priceDropAmount": 50.00,
      "imageUrl": "https://cdn.example.com/products/headphones-1.jpg",
      "inStock": true,
      "addedAt": "2025-01-10T15:00:00Z"
    }
  ],
  "itemCount": 1
}
```

### Add to Wishlist

**cURL**
```bash
curl -X POST https://api.example.com/api/v1/wishlist/items \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: store-123" \
  -d '{
    "productId": "prod-456"
  }'
```

**JavaScript (fetch)**
```javascript
const response = await fetch('https://api.example.com/api/v1/wishlist/items', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'X-Tenant-ID': 'store-123'
  },
  body: JSON.stringify({
    productId: 'prod-456'
  })
});
```

### Remove from Wishlist

**cURL**
```bash
curl -X DELETE https://api.example.com/api/v1/wishlist/items/item-1 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "X-Tenant-ID: store-123"
```

### Check if Product is in Wishlist

**cURL**
```bash
curl -X GET https://api.example.com/api/v1/wishlist/check/prod-123 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "X-Tenant-ID: store-123"
```

**Response**
```json
{
  "productId": "prod-123",
  "inWishlist": true,
  "wishlistItemId": "item-1"
}
```

---

## Reviews

### Get Product Reviews

**cURL**
```bash
curl -X GET "https://api.example.com/api/v1/products/prod-123/reviews?page=0&size=10&sort=createdAt,desc" \
  -H "X-Tenant-ID: store-123"
```

**JavaScript (fetch)**
```javascript
const params = new URLSearchParams({
  page: 0,
  size: 10,
  sort: 'createdAt,desc',
  rating: 5,              // Optional: filter by rating
  verified: true          // Optional: only verified purchases
});

const response = await fetch(`https://api.example.com/api/v1/products/prod-123/reviews?${params}`, {
  headers: {
    'X-Tenant-ID': 'store-123'
  }
});

const { content: reviews, statistics } = await response.json();
```

**Response**
```json
{
  "content": [
    {
      "id": "review-123",
      "productId": "prod-123",
      "userId": "user-456",
      "userName": "John D.",
      "rating": 5,
      "title": "Excellent headphones!",
      "comment": "Amazing sound quality and comfort. Battery life is great too.",
      "verified": true,
      "helpfulCount": 12,
      "notHelpfulCount": 1,
      "images": [
        "https://cdn.example.com/reviews/review-123-1.jpg"
      ],
      "createdAt": "2025-01-14T10:00:00Z"
    }
  ],
  "statistics": {
    "averageRating": 4.5,
    "totalReviews": 47,
    "ratingDistribution": {
      "5": 28,
      "4": 12,
      "3": 4,
      "2": 2,
      "1": 1
    }
  },
  "page": 0,
  "size": 10,
  "totalElements": 47,
  "totalPages": 5
}
```

### Submit a Review

**cURL**
```bash
curl -X POST https://api.example.com/api/v1/products/prod-123/reviews \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: store-123" \
  -d '{
    "rating": 5,
    "title": "Excellent headphones!",
    "comment": "Amazing sound quality and comfort. Battery life is great too.",
    "images": []
  }'
```

**JavaScript (fetch)**
```javascript
const response = await fetch('https://api.example.com/api/v1/products/prod-123/reviews', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'X-Tenant-ID': 'store-123'
  },
  body: JSON.stringify({
    rating: 5,
    title: 'Excellent headphones!',
    comment: 'Amazing sound quality and comfort. Battery life is great too.',
    images: []
  })
});

const review = await response.json();
// Note: Review will have status "PENDING" until approved by admin
```

### Vote on Review Helpfulness

**cURL**
```bash
curl -X POST https://api.example.com/api/v1/reviews/review-123/helpful \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: store-123" \
  -d '{
    "helpful": true
  }'
```

---

## Product Q&A

### Get Product Questions

**cURL**
```bash
curl -X GET "https://api.example.com/api/v1/products/prod-123/questions?page=0&size=10" \
  -H "X-Tenant-ID: store-123"
```

**Response**
```json
{
  "content": [
    {
      "id": "question-123",
      "productId": "prod-123",
      "userId": "user-456",
      "userName": "John D.",
      "question": "Does this work with iPhone 15?",
      "upvotes": 5,
      "status": "ANSWERED",
      "answers": [
        {
          "id": "answer-1",
          "questionId": "question-123",
          "userId": "seller-1",
          "userName": "RetailStore Support",
          "isSeller": true,
          "answer": "Yes, these headphones are fully compatible with iPhone 15 and all iOS devices.",
          "helpfulCount": 8,
          "createdAt": "2025-01-13T11:00:00Z"
        }
      ],
      "createdAt": "2025-01-12T14:00:00Z"
    }
  ],
  "page": 0,
  "size": 10,
  "totalElements": 15,
  "totalPages": 2
}
```

### Ask a Question

**cURL**
```bash
curl -X POST https://api.example.com/api/v1/products/prod-123/questions \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: store-123" \
  -d '{
    "question": "What is the battery life in hours?"
  }'
```

### Answer a Question

**cURL**
```bash
curl -X POST https://api.example.com/api/v1/questions/question-123/answers \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: store-123" \
  -d '{
    "answer": "The battery life is approximately 30 hours with ANC on."
  }'
```

### Upvote a Question

**cURL**
```bash
curl -X POST https://api.example.com/api/v1/questions/question-123/upvote \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "X-Tenant-ID: store-123"
```

---

## GDPR Operations

### Export User Data

**cURL**
```bash
curl -X GET https://api.example.com/api/v1/gdpr/export/user-123 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "X-Tenant-ID: store-123"
```

**JavaScript (fetch)**
```javascript
const response = await fetch('https://api.example.com/api/v1/gdpr/export/user-123', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'X-Tenant-ID': 'store-123'
  }
});

const userData = await response.json();
```

**Response**
```json
{
  "exportDate": "2025-01-15T10:30:00Z",
  "user": {
    "id": "user-123",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "createdAt": "2024-06-15T08:00:00Z"
  },
  "orders": [...],
  "reviews": [...],
  "wishlist": [...],
  "addresses": [...],
  "activityLog": [...]
}
```

### Download Data as File

**cURL**
```bash
curl -X GET https://api.example.com/api/v1/gdpr/export/user-123/download \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "X-Tenant-ID: store-123" \
  -o user-data-export.json
```

### Check Deletion Eligibility

**cURL**
```bash
curl -X GET https://api.example.com/api/v1/gdpr/deletion/eligibility/user-123 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "X-Tenant-ID: store-123"
```

**Response**
```json
{
  "eligible": true,
  "blockers": [],
  "warnings": [
    "You have 2 orders within the last 7 years that will be anonymized (not deleted) for tax compliance."
  ]
}
```

### Request Data Deletion

**cURL**
```bash
curl -X DELETE https://api.example.com/api/v1/gdpr/delete/user-123 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "X-Tenant-ID: store-123"
```

**Response**
```json
{
  "status": "COMPLETED",
  "deletedData": [
    "user_profile",
    "wishlist",
    "cart",
    "activity_logs"
  ],
  "anonymizedData": [
    "orders (2 items - required for tax compliance)"
  ],
  "retainedData": []
}
```

---

## Error Handling

### Common Error Response

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
    },
    {
      "field": "price",
      "message": "Price must be greater than 0"
    }
  ]
}
```

### JavaScript Error Handling Example

```javascript
async function apiCall(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-ID': 'store-123',
      'Authorization': `Bearer ${getToken()}`,
      ...options.headers
    }
  });

  if (!response.ok) {
    const error = await response.json();

    switch (response.status) {
      case 400:
        throw new ValidationError(error.message, error.fieldErrors);
      case 401:
        // Token expired - redirect to login
        redirectToLogin();
        throw new AuthError('Session expired');
      case 403:
        throw new ForbiddenError('Access denied');
      case 404:
        throw new NotFoundError(error.message);
      case 429:
        // Rate limited - wait and retry
        const retryAfter = response.headers.get('Retry-After') || 60;
        throw new RateLimitError(`Rate limited. Retry after ${retryAfter}s`);
      default:
        throw new ApiError(error.message || 'Unknown error');
    }
  }

  return response.json();
}
```

### Python Error Handling Example

```python
import requests
from requests.exceptions import HTTPError

def api_call(url, method='GET', data=None, token=None):
    headers = {
        'Content-Type': 'application/json',
        'X-Tenant-ID': 'store-123'
    }
    if token:
        headers['Authorization'] = f'Bearer {token}'

    response = requests.request(method, url, headers=headers, json=data)

    try:
        response.raise_for_status()
        return response.json()
    except HTTPError as e:
        error_data = response.json()

        if response.status_code == 400:
            raise ValidationError(error_data['message'], error_data.get('fieldErrors', []))
        elif response.status_code == 401:
            raise AuthError('Authentication required')
        elif response.status_code == 403:
            raise ForbiddenError('Access denied')
        elif response.status_code == 404:
            raise NotFoundError(error_data['message'])
        elif response.status_code == 429:
            retry_after = response.headers.get('Retry-After', 60)
            raise RateLimitError(f'Rate limited. Retry after {retry_after}s')
        else:
            raise ApiError(error_data.get('message', 'Unknown error'))
```

---

## Rate Limiting

### Handling Rate Limits

When rate limited (HTTP 429), the response includes:

```http
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1705319400
Retry-After: 45
```

### JavaScript Retry Logic

```javascript
async function fetchWithRetry(url, options, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);

      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get('Retry-After') || '60');
        console.log(`Rate limited. Retrying in ${retryAfter}s (attempt ${attempt}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        continue;
      }

      return response;
    } catch (error) {
      if (attempt === maxRetries) throw error;

      // Exponential backoff for network errors
      const backoff = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, backoff));
    }
  }
}
```

---

## Webhooks

### Webhook Payload Example (Order Status Update)

```json
{
  "event": "order.status_updated",
  "timestamp": "2025-01-15T10:30:00Z",
  "data": {
    "orderId": "order-789",
    "orderNumber": "ORD-2025-001234",
    "previousStatus": "PROCESSING",
    "newStatus": "SHIPPED",
    "trackingNumber": "1Z999AA10123456784",
    "carrier": "UPS"
  },
  "tenantId": "store-123"
}
```

### Webhook Signature Verification

```javascript
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// Usage in Express
app.post('/webhooks/orders', (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  const payload = JSON.stringify(req.body);

  if (!verifyWebhookSignature(payload, signature, process.env.WEBHOOK_SECRET)) {
    return res.status(401).send('Invalid signature');
  }

  // Process webhook
  const { event, data } = req.body;

  switch (event) {
    case 'order.status_updated':
      handleOrderStatusUpdate(data);
      break;
    case 'payment.completed':
      handlePaymentCompleted(data);
      break;
    // ... handle other events
  }

  res.status(200).send('OK');
});
```

---

## Best Practices

1. **Always include tenant ID** - Every request must include `X-Tenant-ID` header
2. **Handle rate limits gracefully** - Implement exponential backoff
3. **Store tokens securely** - Use httpOnly cookies or secure storage
4. **Validate responses** - Check status codes and handle errors appropriately
5. **Use pagination** - For list endpoints, always use pagination parameters
6. **Cache appropriately** - Cache product listings, but not cart or user data
7. **Log request IDs** - Include `X-Request-ID` for debugging support requests

For more information, see:
- [API Versioning Guide](./API_VERSIONING_GUIDE.md)
- [OpenAPI Documentation](/swagger-ui/index.html)
