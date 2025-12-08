# C4 Architecture Diagrams

This document provides C4 model architecture diagrams for the Retail Agentic platform.

## Level 1: System Context Diagram

Shows the system's interactions with users and external systems.

```mermaid
C4Context
    title System Context Diagram - Retail Agentic Platform

    Person(consumer, "Consumer", "End user who browses products and makes purchases")
    Person(admin, "Store Admin", "Manages products, orders, and store settings")
    Person(owner, "Store Owner", "Owns and operates an online store")

    System(retail, "Retail Agentic Platform", "Multi-tenant e-commerce platform with reactive backend")

    System_Ext(google, "Google OAuth", "Authentication provider")
    System_Ext(facebook, "Facebook OAuth", "Authentication provider")
    System_Ext(stripe, "Stripe", "Payment processing")
    System_Ext(email, "Email Service", "Transactional email delivery")
    System_Ext(sms, "SMS Service", "SMS notifications")
    System_Ext(cdn, "CDN", "Static asset delivery")

    Rel(consumer, retail, "Browses products, makes purchases", "HTTPS")
    Rel(admin, retail, "Manages store", "HTTPS")
    Rel(owner, retail, "Configures store settings", "HTTPS")

    Rel(retail, google, "OAuth authentication", "HTTPS")
    Rel(retail, facebook, "OAuth authentication", "HTTPS")
    Rel(retail, stripe, "Process payments", "HTTPS")
    Rel(retail, email, "Send emails", "SMTP/API")
    Rel(retail, sms, "Send SMS", "HTTPS")
    Rel(retail, cdn, "Serve static assets", "HTTPS")
```

## Level 2: Container Diagram

Shows the high-level technology choices and how containers communicate.

```mermaid
C4Container
    title Container Diagram - Retail Agentic Platform

    Person(consumer, "Consumer", "End user")
    Person(admin, "Store Admin", "Manages store")

    Container_Boundary(platform, "Retail Agentic Platform") {
        Container(consumer_web, "Consumer Web App", "React, TypeScript, Tailwind", "Customer-facing e-commerce SPA")
        Container(admin_web, "Admin Web App", "React, TypeScript, Tailwind", "Store management dashboard")
        Container(api, "Backend API", "Java, Spring WebFlux", "Reactive REST API server")
        ContainerDb(mongodb, "MongoDB", "Document DB", "Products, users, orders, reviews")
        ContainerDb(redis, "Redis", "Cache/Session", "Carts, sessions, token blacklist")
        ContainerDb(elasticsearch, "Elasticsearch", "Search Engine", "Product search and analytics")
    }

    System_Ext(oauth, "OAuth Providers", "Google, Facebook")
    System_Ext(stripe, "Stripe", "Payments")
    System_Ext(email, "Email Service", "SendGrid/SES")

    Rel(consumer, consumer_web, "Uses", "HTTPS")
    Rel(admin, admin_web, "Uses", "HTTPS")
    Rel(consumer_web, api, "API calls", "HTTPS/JSON")
    Rel(admin_web, api, "API calls", "HTTPS/JSON")

    Rel(api, mongodb, "Reads/Writes", "Reactive MongoDB Driver")
    Rel(api, redis, "Reads/Writes", "Reactive Redis")
    Rel(api, elasticsearch, "Search queries", "REST/JSON")

    Rel(api, oauth, "Authenticate", "HTTPS")
    Rel(api, stripe, "Process payments", "HTTPS")
    Rel(api, email, "Send emails", "HTTPS")
```

## Level 3: Component Diagram - Backend API

Shows the internal structure of the Backend API container.

```mermaid
C4Component
    title Component Diagram - Backend API

    Container_Boundary(api, "Backend API") {
        Component(auth_controller, "AuthController", "REST Controller", "Handles authentication, OAuth2 login/logout")
        Component(product_controller, "ProductController", "REST Controller", "Product CRUD operations")
        Component(order_controller, "OrderController", "REST Controller", "Order management")
        Component(cart_controller, "CartController", "REST Controller", "Shopping cart operations")
        Component(user_controller, "UserController", "REST Controller", "User profile management")
        Component(gdpr_controller, "GdprController", "REST Controller", "GDPR data export/deletion")
        Component(review_controller, "ReviewController", "REST Controller", "Product reviews")
        Component(qa_controller, "QAController", "REST Controller", "Product Q&A")
        Component(wishlist_controller, "WishlistController", "REST Controller", "Wishlist management")

        Component(jwt_filter, "JwtAuthenticationFilter", "WebFilter", "JWT validation, blacklist checking")
        Component(tenant_filter, "TenantContextFilter", "WebFilter", "Multi-tenant context setup")

        Component(user_service, "UserService", "Service", "User business logic")
        Component(product_service, "ProductService", "Service", "Product catalog logic")
        Component(order_service, "OrderService", "Service", "Order processing")
        Component(cart_service, "CartService", "Service", "Cart management")
        Component(oauth2_service, "OAuth2Service", "Service", "OAuth2 authentication")
        Component(gdpr_service, "GdprDataDeletionService", "Service", "GDPR compliance")
        Component(notification_service, "NotificationService", "Service", "Email/SMS sending")

        Component(jwt_service, "JwtService", "Security", "JWT token generation/validation")
        Component(blacklist_service, "TokenBlacklistService", "Security", "Token blacklist management")

        Component(user_repo, "UserRepository", "Repository", "User data access")
        Component(product_repo, "ProductRepository", "Repository", "Product data access")
        Component(order_repo, "OrderRepository", "Repository", "Order data access")
    }

    ContainerDb(mongodb, "MongoDB", "Document DB")
    ContainerDb(redis, "Redis", "Cache")
    System_Ext(oauth, "OAuth Providers")

    Rel(auth_controller, oauth2_service, "Uses")
    Rel(auth_controller, jwt_service, "Uses")
    Rel(auth_controller, blacklist_service, "Uses")

    Rel(jwt_filter, jwt_service, "Validates tokens")
    Rel(jwt_filter, blacklist_service, "Checks blacklist")

    Rel(user_service, user_repo, "Uses")
    Rel(product_service, product_repo, "Uses")
    Rel(order_service, order_repo, "Uses")

    Rel(oauth2_service, oauth, "Authenticates")
    Rel(user_repo, mongodb, "Reads/Writes")
    Rel(blacklist_service, redis, "Reads/Writes")
```

## Level 3: Component Diagram - Consumer Web App

```mermaid
C4Component
    title Component Diagram - Consumer Web App

    Container_Boundary(consumer_web, "Consumer Web App") {
        Component(app, "App", "React Component", "Root application component")
        Component(auth_provider, "AuthProvider", "React Context", "Authentication state management")
        Component(router, "Router", "React Router", "Client-side routing")

        Component(home_page, "HomePage", "Page Component", "Landing page with featured products")
        Component(product_page, "ProductPage", "Page Component", "Product details, reviews, Q&A")
        Component(cart_page, "CartPage", "Page Component", "Shopping cart view")
        Component(checkout_page, "CheckoutPage", "Page Component", "Checkout flow")
        Component(account_page, "AccountPage", "Page Component", "User profile and orders")
        Component(privacy_page, "PrivacyPage", "Page Component", "Privacy policy")
        Component(terms_page, "TermsPage", "Page Component", "Terms of service")

        Component(product_qa, "ProductQA", "Component", "Questions and answers")
        Component(reviews, "ProductReviews", "Component", "Product reviews")
        Component(wishlist_btn, "WishlistButton", "Component", "Add to wishlist")
        Component(google_login, "GoogleLoginButton", "Component", "Google OAuth login")
        Component(facebook_login, "FacebookLoginButton", "Component", "Facebook OAuth login")
        Component(cookie_consent, "CookieConsent", "Component", "GDPR cookie consent")

        Component(api_client, "API Client", "Library", "HTTP client with auth")
        Component(stores, "State Stores", "Zustand", "Global state management")
    }

    Container(api, "Backend API", "Spring WebFlux")
    System_Ext(google, "Google OAuth")
    System_Ext(facebook, "Facebook OAuth")

    Rel(app, auth_provider, "Provides auth context")
    Rel(app, router, "Handles routing")

    Rel(google_login, google, "OAuth flow")
    Rel(facebook_login, facebook, "OAuth flow")

    Rel(api_client, api, "HTTP requests")
    Rel(stores, api_client, "Fetches data")
```

## Data Flow Diagrams

### Authentication Flow

```mermaid
sequenceDiagram
    participant User
    participant Web as Consumer Web
    participant Google
    participant API as Backend API
    participant Redis
    participant MongoDB

    User->>Web: Click "Login with Google"
    Web->>Google: Redirect to Google OAuth
    Google-->>Web: Access Token
    Web->>API: POST /api/v1/auth/oauth2/login
    API->>Google: Verify token
    Google-->>API: User info
    API->>MongoDB: Find or create user
    API->>API: Generate JWT
    API-->>Web: JWT Token
    Web->>Web: Store token in localStorage
    Web-->>User: Logged in

    Note over User,MongoDB: Logout Flow
    User->>Web: Click "Logout"
    Web->>API: POST /api/v1/auth/logout
    API->>Redis: Blacklist JWT
    API-->>Web: Success
    Web->>Web: Clear localStorage
    Web-->>User: Logged out
```

### GDPR Data Deletion Flow

```mermaid
sequenceDiagram
    participant User
    participant API as Backend API
    participant MongoDB
    participant Redis

    User->>API: DELETE /api/v1/gdpr/delete/{userId}
    API->>MongoDB: Find user

    par Delete/Anonymize data
        API->>MongoDB: Anonymize user profile
        API->>MongoDB: Delete wishlist
        API->>MongoDB: Delete shopping carts
        API->>MongoDB: Anonymize reviews
        API->>MongoDB: Anonymize orders
        API->>MongoDB: Delete activity logs
    end

    API-->>User: Deletion result with actions taken
```

### Order Processing Flow

```mermaid
sequenceDiagram
    participant User
    participant Web as Consumer Web
    participant API as Backend API
    participant Stripe
    participant MongoDB
    participant Email

    User->>Web: Place order
    Web->>API: POST /api/v1/orders
    API->>MongoDB: Validate cart items
    API->>Stripe: Create payment intent
    Stripe-->>API: Payment intent ID
    API-->>Web: Redirect to payment

    Web->>Stripe: Complete payment
    Stripe-->>API: Webhook: payment_succeeded

    API->>MongoDB: Create order
    API->>MongoDB: Clear cart
    API->>Email: Send confirmation
    API-->>Web: Order created

    Web-->>User: Order confirmation
```

## Infrastructure Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Load Balancer                             │
│                         (HTTPS/SSL)                              │
└─────────────────────────────────────────────────────────────────┘
                              │
         ┌────────────────────┼────────────────────┐
         │                    │                    │
         ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  Consumer Web   │  │   Admin Web     │  │   Backend API   │
│    (CDN)        │  │    (CDN)        │  │   (Container)   │
│                 │  │                 │  │                 │
│  - React SPA    │  │  - React SPA    │  │  - Spring Boot  │
│  - Tailwind     │  │  - Tailwind     │  │  - WebFlux      │
└─────────────────┘  └─────────────────┘  └────────┬────────┘
                                                    │
                    ┌───────────────────────────────┼──────────────┐
                    │                               │              │
                    ▼                               ▼              ▼
           ┌─────────────────┐            ┌──────────────┐  ┌───────────┐
           │    MongoDB      │            │    Redis     │  │Elasticsearch│
           │   (Replica Set) │            │  (Cluster)   │  │ (Cluster) │
           │                 │            │              │  │           │
           │ - Products      │            │ - Sessions   │  │ - Search  │
           │ - Users         │            │ - Carts      │  │ - Analytics│
           │ - Orders        │            │ - Blacklist  │  │           │
           │ - Reviews       │            │ - Cache      │  │           │
           └─────────────────┘            └──────────────┘  └───────────┘
```

## Technology Stack Summary

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | React 18, TypeScript, Tailwind CSS | User interface |
| UI Components | shadcn/ui | Design system |
| State Management | Zustand | Global state |
| API Client | Axios | HTTP requests |
| Backend | Java 21, Spring Boot 3.x | Application server |
| Reactive | Spring WebFlux, Project Reactor | Non-blocking I/O |
| Security | Spring Security, JWT | Authentication |
| Primary DB | MongoDB | Document storage |
| Cache | Redis | Caching, sessions |
| Search | Elasticsearch | Full-text search |
| Payments | Stripe | Payment processing |
| Email | SendGrid/SES | Transactional email |
| OAuth | Google, Facebook | Social login |

## Key Architecture Decisions

1. **Reactive Stack**: Spring WebFlux for non-blocking I/O handling high concurrency
2. **Multi-Tenant**: Shared database with tenant discriminator for cost efficiency
3. **Polyglot Persistence**: MongoDB for flexibility, Redis for speed, Elasticsearch for search
4. **Event-Driven**: Async processing for non-critical operations (emails, analytics)
5. **JWT + Blacklist**: Stateless auth with Redis-backed token invalidation
6. **CDN-First**: Static assets served via CDN for performance
