# API-First Development with OpenAPI

## Overview

This project follows an API-first development approach using OpenAPI 3.0 specifications. This ensures:
- Clear API contracts before implementation
- Automatic API documentation
- Client SDK generation from specifications
- Consistent API design across the platform

## Accessing API Documentation

### Interactive Swagger UI
When the backend is running, access the interactive API documentation at:
```
http://localhost:8080/swagger-ui.html
```

### OpenAPI Specification
The raw OpenAPI 3.0 specification (JSON format) is available at:
```
http://localhost:8080/v3/api-docs
```

For YAML format:
```
http://localhost:8080/v3/api-docs.yaml
```

## Development Workflow

### 1. Design API Contract
Use OpenAPI annotations on controllers and DTOs:

```java
@RestController
@RequestMapping("/api/v1/products")
@Tag(name = "Products", description = "Product management endpoints")
public class ProductController {

    @PostMapping
    @Operation(
        summary = "Create a new product",
        description = "Creates a new product in the tenant's catalog"
    )
    @ApiResponse(
        responseCode = "201",
        description = "Product created successfully"
    )
    public Mono<ProductDto> createProduct(
        @RequestBody @Valid ProductCreateRequest request
    ) {
        // Implementation
    }
}
```

### 2. Document DTOs
Use Schema annotations on data transfer objects:

```java
@Schema(description = "Product creation request")
public record ProductCreateRequest(
    @Schema(description = "Product name", example = "Wireless Mouse")
    @NotBlank String name,

    @Schema(description = "Product price in cents", example = "2999")
    @Positive Integer priceInCents,

    @Schema(description = "Dynamic product attributes")
    Map<String, Object> attributes
) {}
```

### 3. Generate Client SDKs

#### TypeScript Client Generation
Use OpenAPI Generator to create type-safe TypeScript clients:

```bash
# Install OpenAPI Generator
npm install -g @openapitools/openapi-generator-cli

# Generate TypeScript client
openapi-generator-cli generate \
  -i http://localhost:8080/v3/api-docs \
  -g typescript-fetch \
  -o consumer-web/src/generated/api

# Or for React Query
openapi-generator-cli generate \
  -i http://localhost:8080/v3/api-docs \
  -g typescript-fetch \
  --additional-properties=supportsES6=true,withInterfaces=true,useSingleRequestParameter=true \
  -o consumer-web/src/generated/api
```

#### Using Generated Clients
```typescript
import { DefaultApi, Configuration } from '@/generated/api'

const api = new DefaultApi(new Configuration({
  basePath: '/api/v1'
}))

// Type-safe API calls
const health = await api.health()
const products = await api.getProducts({ tenantId: 'store1' })
```

## Best Practices

### 1. Version Your APIs
- Use `/api/v1/`, `/api/v2/` prefixes
- Maintain backward compatibility within major versions
- Document breaking changes clearly

### 2. Use Proper HTTP Status Codes
```java
@ApiResponse(responseCode = "200", description = "Success")
@ApiResponse(responseCode = "201", description = "Created")
@ApiResponse(responseCode = "400", description = "Invalid input")
@ApiResponse(responseCode = "404", description = "Not found")
@ApiResponse(responseCode = "409", description = "Conflict")
@ApiResponse(responseCode = "500", description = "Server error")
```

### 3. Document Error Responses
```java
@Schema(description = "Error response")
public record ErrorResponse(
    @Schema(description = "Error code", example = "PRODUCT_NOT_FOUND")
    String code,

    @Schema(description = "Human-readable error message")
    String message,

    @Schema(description = "ISO 8601 timestamp")
    String timestamp
) {}
```

### 4. Multi-Tenancy in OpenAPI
Document tenant context requirements:

```java
@Operation(
    summary = "Get products",
    description = """
        Returns products for the active tenant.
        Tenant is determined from:
        - Subdomain: store1.retail.com
        - Path prefix: retail.com/store1
        """
)
@Parameter(
    name = "X-Tenant-ID",
    description = "Override tenant ID (for testing)",
    in = ParameterIn.HEADER,
    required = false
)
```

## CI/CD Integration

### Export OpenAPI Spec in CI
Add to GitHub Actions workflow:

```yaml
- name: Export OpenAPI Spec
  run: |
    cd backend
    mvn spring-boot:run &
    sleep 30
    curl http://localhost:8080/v3/api-docs > openapi.json
    curl http://localhost:8080/v3/api-docs.yaml > openapi.yaml

- name: Validate OpenAPI Spec
  uses: openapi-cli/validate-action@v1
  with:
    file: backend/openapi.yaml

- name: Generate TypeScript Clients
  run: |
    npm install -g @openapitools/openapi-generator-cli
    openapi-generator-cli generate -i backend/openapi.json -g typescript-fetch -o consumer-web/src/generated
```

## Configuration

### application.yml
```yaml
springdoc:
  api-docs:
    path: /v3/api-docs
    enabled: true
  swagger-ui:
    path: /swagger-ui.html
    enabled: true
    tags-sorter: alpha
    operations-sorter: alpha
  show-actuator: true
```

### Maven Dependency
```xml
<dependency>
    <groupId>org.springdoc</groupId>
    <artifactId>springdoc-openapi-starter-webflux-ui</artifactId>
    <version>2.3.0</version>
</dependency>
```

## Additional Resources

- [OpenAPI Specification](https://spec.openapis.org/oas/v3.1.0)
- [Springdoc OpenAPI Documentation](https://springdoc.org/)
- [OpenAPI Generator](https://openapi-generator.tech/)
- [Swagger UI](https://swagger.io/tools/swagger-ui/)
