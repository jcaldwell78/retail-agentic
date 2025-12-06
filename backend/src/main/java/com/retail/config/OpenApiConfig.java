package com.retail.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

/**
 * OpenAPI 3.0 configuration for API-first development.
 * Exposes interactive API documentation at /swagger-ui.html
 * and OpenAPI spec at /v3/api-docs
 */
@Configuration
public class OpenApiConfig {

    @Value("${spring.application.name:retail-backend}")
    private String applicationName;

    @Bean
    public OpenAPI customOpenAPI() {
        final String securitySchemeName = "bearerAuth";

        return new OpenAPI()
                .info(new Info()
                        .title("Retail Platform API")
                        .version("1.0.0")
                        .description("""
                                Multi-tenant retail platform API with support for:
                                - Dynamic product attributes
                                - Subdomain/path-based tenant routing
                                - Whitelabel branding
                                - Reactive/non-blocking operations

                                ## Authentication

                                This API uses **JWT Bearer tokens** for authentication.

                                ### Getting Started

                                1. **Register a new account** (POST /api/v1/auth/register)
                                   ```json
                                   {
                                     "email": "user@example.com",
                                     "password": "SecurePassword123!",
                                     "firstName": "John",
                                     "lastName": "Doe"
                                   }
                                   ```

                                2. **Login** (POST /api/v1/auth/login) to receive your JWT token
                                   ```json
                                   {
                                     "email": "user@example.com",
                                     "password": "SecurePassword123!"
                                   }
                                   ```

                                   Response:
                                   ```json
                                   {
                                     "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                                     "user": { ... }
                                   }
                                   ```

                                3. **Use the token** in subsequent requests by adding it to the Authorization header:
                                   ```
                                   Authorization: Bearer <your-jwt-token>
                                   ```

                                ### Password Requirements

                                - Minimum 8 characters
                                - At least one uppercase letter
                                - At least one lowercase letter
                                - At least one digit
                                - At least one special character (!@#$%^&*()_+-=[]{};\\'\\"|,.<>/?)

                                ### OAuth2 Authentication

                                Alternative authentication via OAuth2 providers (Google, Facebook):

                                POST /api/v1/auth/oauth2/login
                                ```json
                                {
                                  "provider": "GOOGLE",
                                  "accessToken": "oauth2-access-token-from-provider"
                                }
                                ```

                                ### Logout

                                To invalidate your token (logout):

                                POST /api/v1/auth/logout
                                ```
                                Authorization: Bearer <your-jwt-token>
                                ```

                                After logout, the token is blacklisted and cannot be used for subsequent requests.

                                ### Token Expiration

                                JWT tokens expire after 1 hour. You'll receive a 401 Unauthorized response if your token has expired.
                                Request a new token by logging in again.

                                ## Multi-Tenancy

                                Tenants are identified via subdomain (tenant.retail.com) or path (retail.com/tenant).
                                All endpoints automatically filter data by the active tenant.
                                Your JWT token is tenant-specific and can only access data within that tenant.

                                ## Rate Limiting

                                API requests are rate limited to prevent abuse and ensure fair usage.

                                ### Default Limits

                                **100 requests per minute** for most endpoints (per IP address)

                                ### Endpoint-Specific Limits

                                Some endpoints have stricter limits:

                                | Endpoint | Limit | Reason |
                                |----------|-------|--------|
                                | POST /api/v1/auth/login | 10/min | Prevent brute force attacks |
                                | POST /api/v1/auth/register | 5/min | Prevent spam registrations |
                                | GET /api/v1/products/search | 50/min | Protect search performance |
                                | POST /api/v1/orders | 20/min | Prevent order spam |

                                ### Rate Limit Headers

                                Each response includes rate limit headers:

                                ```
                                X-RateLimit-Limit: 100
                                X-RateLimit-Remaining: 95
                                X-RateLimit-Reset: 1640000000
                                ```

                                - `X-RateLimit-Limit`: Maximum requests allowed in the current window
                                - `X-RateLimit-Remaining`: Remaining requests in the current window
                                - `X-RateLimit-Reset`: Unix timestamp when the rate limit resets

                                ### Rate Limit Exceeded (429)

                                When you exceed the rate limit, you'll receive:

                                ```json
                                {
                                  "error": "Rate limit exceeded",
                                  "message": "Too many requests. Please try again later.",
                                  "retryAfter": 30
                                }
                                ```

                                HTTP Status: **429 Too Many Requests**

                                Wait for the time specified in `retryAfter` (seconds) before making new requests.

                                ### Best Practices

                                - Implement exponential backoff when receiving 429 responses
                                - Cache responses when appropriate to reduce API calls
                                - Use pagination for large data sets
                                - Monitor rate limit headers to avoid hitting limits
                                """)
                        .contact(new Contact()
                                .name("Retail Platform Team")
                                .email("support@retail.com"))
                        .license(new License()
                                .name("Proprietary")
                                .url("https://retail.com/license")))
                .servers(List.of(
                        new Server()
                                .url("http://localhost:8080")
                                .description("Local development"),
                        new Server()
                                .url("https://api.retail.com")
                                .description("Production")))
                .addSecurityItem(new SecurityRequirement().addList(securitySchemeName))
                .components(new Components()
                        .addSecuritySchemes(securitySchemeName,
                                new SecurityScheme()
                                        .name(securitySchemeName)
                                        .type(SecurityScheme.Type.HTTP)
                                        .scheme("bearer")
                                        .bearerFormat("JWT")
                                        .description("""
                                                JWT Bearer token authentication.

                                                Obtain a token by:
                                                1. Registering: POST /api/v1/auth/register
                                                2. Logging in: POST /api/v1/auth/login
                                                3. Or using OAuth2: POST /api/v1/auth/oauth2/login

                                                Then include the token in the Authorization header:
                                                `Authorization: Bearer <token>`

                                                Tokens expire after 1 hour.
                                                Logout to invalidate a token: POST /api/v1/auth/logout
                                                """)));
    }
}
