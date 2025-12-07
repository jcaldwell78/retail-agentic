# Security Testing Guide

This document outlines the security testing approach for the Retail Agentic backend application.

## Overview

Security testing is critical for a multi-tenant e-commerce platform. Our comprehensive test suite covers:

1. **Authentication Security** - JWT tokens, password security, injection attacks
2. **Authorization Security** - Role-Based Access Control (RBAC)
3. **Tenant Isolation** - Multi-tenant data segregation

## Test Organization

All security tests are located in:
```
backend/src/test/java/com/retail/security/
├── AuthenticationSecurityTest.java
├── AuthorizationSecurityTest.java
└── TenantIsolationSecurityTest.java
```

## 1. Authentication Security Tests

**File**: `AuthenticationSecurityTest.java`

### Test Coverage

#### JWT Token Security
- **testRejectUnauthenticatedRequests**: Verifies protected endpoints require authentication
- **testRejectInvalidJwtToken**: Ensures malformed or invalid tokens are rejected
- **testRejectExpiredJwtToken**: Validates token expiration enforcement
- **testTokenInvalidationOnLogout**: Confirms tokens are invalidated after logout

#### Password Security
- **testRejectWeakPasswords**: Enforces password strength requirements
- **testPasswordHashing**: Verifies BCrypt hashing before database storage
- **testPasswordNotInErrorMessages**: Prevents password leakage in error responses

#### Injection Attack Prevention
- **testSqlInjectionPrevention**: Guards against SQL injection attacks
- **testNoSqlInjectionPrevention**: Protects against NoSQL injection patterns including:
  - `{"$gt": ""}` - Greater than operator injection
  - `{"$ne": null}` - Not equal operator injection
  - `{"": {"$ne": 1}}` - Empty key injection
  - `admin' || '1'=='1` - String concatenation injection

#### Brute Force Protection
- **testLoginRateLimiting**: Validates rate limiting on login attempts

#### User Enumeration Prevention
- **testUserEnumerationPrevention**: Ensures identical error messages for:
  - Non-existent users
  - Incorrect passwords
  - This prevents attackers from discovering valid usernames

#### Transport Security
- **testHttpsRequirement**: Verifies Strict-Transport-Security header
- **testSecureCookieFlags**: Ensures cookies have:
  - HttpOnly flag (prevents XSS access)
  - Secure flag (HTTPS only)
  - SameSite=Strict (CSRF protection)

### Running Authentication Tests

```bash
# Run all authentication tests
mvn test -Dtest=AuthenticationSecurityTest

# Run specific test
mvn test -Dtest=AuthenticationSecurityTest#testPasswordHashing
```

## 2. Authorization Security Tests (RBAC)

**File**: `AuthorizationSecurityTest.java`

### User Roles

The system supports three roles with distinct permissions:

1. **CUSTOMER**
   - Can view products
   - Can access own orders only
   - Cannot create/modify/delete products
   - Cannot access admin endpoints

2. **STORE_OWNER**
   - Can create and manage products
   - Can manage own store's orders
   - Cannot access other tenants' data
   - Cannot access admin-only endpoints

3. **ADMIN**
   - Full access to all endpoints
   - Can manage products
   - Can view all orders
   - Can manage user roles
   - Can access admin endpoints

### Test Coverage

#### Customer Role Tests
- **testCustomerCanAccessProducts**: Verifies product catalog access
- **testCustomerCannotAccessAdminEndpoints**: Blocks `/api/v1/admin/*` endpoints
- **testCustomerCannotCreateProducts**: Prevents product creation
- **testCustomerCannotDeleteProducts**: Prevents product deletion
- **testCustomerCanAccessOwnOrders**: Allows access to own orders
- **testCustomerCannotAccessOtherCustomerOrders**: Blocks other users' orders

#### Admin Role Tests
- **testAdminCanAccessAllEndpoints**: Verifies unrestricted access
- **testAdminCanCreateProducts**: Confirms product creation rights
- **testAdminCanDeleteProducts**: Confirms product deletion rights
- **testAdminCanManageUserRoles**: Validates role management capabilities

#### Store Owner Role Tests
- **testStoreOwnerCanCreateProducts**: Confirms product creation rights
- **testStoreOwnerCanManageOwnStoreOrders**: Allows order management
- **testStoreOwnerCannotAccessOtherTenantData**: Enforces tenant boundaries

#### Security Enforcement Tests
- **testMethodLevelSecurity**: Validates Spring Security method annotations
- **testPreventPrivilegeEscalation**: Prevents users from self-promoting roles
- **testRoleChangeAuthorization**: Ensures only ADMIN can change user roles

### Running Authorization Tests

```bash
# Run all authorization tests
mvn test -Dtest=AuthorizationSecurityTest

# Run specific test
mvn test -Dtest=AuthorizationSecurityTest#testPreventPrivilegeEscalation
```

## 3. Tenant Isolation Security Tests

**File**: `TenantIsolationSecurityTest.java`

Multi-tenant isolation is **critical** for this platform. Each tenant's data must be completely isolated.

### Test Coverage

#### Product Isolation
- **testTenantACannotSeeTenantBProducts**: Verifies query filtering
- **testTenantBCannotSeeTenantAProducts**: Bidirectional isolation
- **testCrossTenantProductAccessById**: Blocks direct ID access across tenants
- **testCrossTenantProductUpdate**: Prevents cross-tenant modifications
- **testCrossTenantProductDelete**: Prevents cross-tenant deletions

#### Order Isolation
- **testTenantACannotSeeTenantBOrders**: Order query isolation
- **testCrossTenantOrderAccessById**: Blocks order access by ID
- **testCrossTenantOrderAccessByOrderNumber**: Blocks order access by order number

#### Repository-Level Isolation
- **testAutomaticTenantFiltering**: Verifies automatic tenant filtering in repositories
- **testCannotCreateProductWithDifferentTenantId**: Enforces tenant context on creation
- **testTenantIsolationInAggregates**: Validates aggregate queries respect tenants
- **testSearchQueriesRespectTenantIsolation**: SKU and search queries are tenant-scoped

#### Context Security
- **testTenantContextCannotBeOverridden**: Prevents malicious context manipulation

### Tenant Context Propagation

Tenant isolation uses Spring Reactor's `Context` to propagate tenant ID:

```java
productRepository.findByTenantId(TENANT_A, null)
    .contextWrite(Context.of("tenantId", TENANT_A))
```

All repository methods must:
1. Accept `tenantId` parameter
2. Filter results by `tenantId`
3. Respect reactive context

### Running Tenant Isolation Tests

```bash
# Run all tenant isolation tests
mvn test -Dtest=TenantIsolationSecurityTest

# Run specific test
mvn test -Dtest=TenantIsolationSecurityTest#testCrossTenantProductAccessById
```

## Testing Tools and Technologies

### Spring Boot Test
```java
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureWebTestClient
```
- Starts full application context
- Uses random port to avoid conflicts
- Provides WebTestClient for HTTP testing

### WebTestClient
```java
webTestClient.get()
    .uri("/api/v1/products")
    .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
    .exchange()
    .expectStatus().isOk();
```
- Non-blocking HTTP client for reactive tests
- Fluent API for request/response assertions

### StepVerifier
```java
StepVerifier.create(
    productRepository.findByTenantId(TENANT_A, null)
        .contextWrite(Context.of("tenantId", TENANT_A))
)
    .assertNext(product -> {
        assertThat(product.getTenantId()).isEqualTo(TENANT_A);
    })
    .verifyComplete();
```
- Tests reactive streams (Mono/Flux)
- Validates emissions and completion signals
- Supports context propagation testing

### AssertJ
```java
assertThat(product.getTenantId()).isEqualTo(TENANT_A);
```
- Fluent assertion library
- Clear, readable test assertions

## Running All Security Tests

```bash
# Run all security tests
mvn test -Dtest="com.retail.security.*"

# Run with coverage report
mvn clean test jacoco:report -Dtest="com.retail.security.*"

# View coverage report
open target/site/jacoco/index.html
```

## Security Test Best Practices

### 1. Test Real HTTP Requests
Use `WebTestClient` instead of mocking controllers to test the full security chain including:
- Spring Security filters
- JWT validation
- CORS headers
- Error handling

### 2. Test Negative Cases
Always test what **should not** work:
- Invalid tokens
- Insufficient permissions
- Cross-tenant access attempts
- Privilege escalation

### 3. Use Real Authentication Flow
Create tokens through the login endpoint, don't mock them:
```java
private String loginAndGetToken(String email) {
    return webTestClient.post()
        .uri("/api/v1/auth/login")
        .contentType(MediaType.APPLICATION_JSON)
        .bodyValue(loginRequest)
        .exchange()
        .expectStatus().isOk()
        .expectBody()
        .jsonPath("$.token").value(String.class, token -> token);
}
```

### 4. Test Context Propagation
Verify tenant context flows through reactive chains:
```java
.contextWrite(Context.of("tenantId", TENANT_A))
```

### 5. Clean Test Data
Always clean up in `@BeforeEach` and `@AfterEach`:
```java
@AfterEach
void cleanup() {
    userRepository.deleteAll().block();
}
```

## Continuous Integration

Security tests run automatically on:
- Every pull request
- Every commit to main branch
- Nightly builds

All security tests **must pass** before merging.

## Security Test Coverage Goals

| Test Category | Target Coverage |
|---------------|----------------|
| Authentication | 100% |
| Authorization | 100% |
| Tenant Isolation | 100% |

## Common Issues and Troubleshooting

### Issue: Tests fail with "Unauthorized"
**Cause**: JWT token generation or validation issue
**Fix**: Check JWT secret configuration in `application-test.yml`

### Issue: Tenant isolation tests fail randomly
**Cause**: Test data not cleaned between tests
**Fix**: Ensure `@BeforeEach` clears all test data

### Issue: Rate limiting tests fail
**Cause**: Rate limiter not reset between tests
**Fix**: Clear rate limiter state in `@BeforeEach`

### Issue: Context not propagating
**Cause**: Missing `.contextWrite()` in reactive chain
**Fix**: Add context to all reactive operations:
```java
.contextWrite(Context.of("tenantId", TENANT_A))
```

## Security Testing Checklist

Before deploying to production, verify:

- [ ] All authentication tests pass
- [ ] All authorization tests pass
- [ ] All tenant isolation tests pass
- [ ] Password hashing uses BCrypt
- [ ] JWT tokens expire appropriately
- [ ] Rate limiting is configured
- [ ] HTTPS is enforced in production
- [ ] Secure cookie flags are set
- [ ] SQL/NoSQL injection tests pass
- [ ] User enumeration is prevented
- [ ] Cross-tenant access is blocked
- [ ] Privilege escalation is prevented
- [ ] Security headers are configured

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Spring Security Documentation](https://docs.spring.io/spring-security/reference/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [Project Reactor Testing](https://projectreactor.io/docs/core/release/reference/#testing)

## Contributing

When adding new features:

1. Write security tests first (TDD approach)
2. Cover both positive and negative test cases
3. Test with all user roles
4. Verify tenant isolation
5. Update this documentation
