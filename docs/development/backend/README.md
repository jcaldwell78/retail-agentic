# Backend Development Guide

Documentation for developing the Java/Spring Boot/Reactor backend service.

## Contents

- [Setup Guide](./setup.md) - Local development environment setup
- [Patterns and Practices](./patterns.md) - Code patterns, best practices, and examples
- [API-First Development](./API_FIRST.md) - OpenAPI specifications and client generation

## Architecture Overview

The backend is a reactive microservice built with:
- **Spring Boot 3.2+** with WebFlux for non-blocking HTTP
- **Project Reactor** for reactive streams (Mono/Flux)
- **Spring Data Reactive** for MongoDB and PostgreSQL
- **Spring Data Redis Reactive** for caching
- **Spring Data Elasticsearch** for search

### Project Structure

```
backend/
├── src/
│   ├── main/
│   │   ├── java/com/retail/
│   │   │   ├── config/          # Configuration classes
│   │   │   ├── controller/      # REST controllers
│   │   │   ├── service/         # Business logic
│   │   │   ├── repository/      # Data access
│   │   │   ├── model/           # Domain entities
│   │   │   ├── dto/             # Data transfer objects
│   │   │   ├── mapper/          # Entity <-> DTO mappers
│   │   │   ├── filter/          # WebFilters (e.g., TenantContextFilter)
│   │   │   ├── exception/       # Custom exceptions
│   │   │   └── util/            # Utility classes
│   │   └── resources/
│   │       ├── application.yml       # Configuration
│   │       ├── application-dev.yml   # Dev config
│   │       └── application-prod.yml  # Prod config
│   └── test/
│       ├── java/com/retail/
│       │   ├── unit/            # Unit tests
│       │   ├── integration/     # Integration tests
│       │   └── e2e/             # End-to-end tests
│       └── resources/
│           └── application-test.yml
├── pom.xml                      # Maven configuration
└── Dockerfile
```

## Core Concepts

### 1. Reactive Programming

All I/O operations return `Mono<T>` or `Flux<T>`:

```java
// Controller
@GetMapping("/products/{id}")
public Mono<ProductDTO> getProduct(@PathVariable String id) {
    return productService.findById(id);
}

// Service
public Mono<ProductDTO> findById(String id) {
    return productRepository.findById(id)
        .map(productMapper::toDTO);
}

// Repository (extends ReactiveMongoRepository)
public interface ProductRepository extends TenantAwareRepository<Product, String> {
    Flux<Product> findByCategory(String category);
}
```

### 2. Multi-Tenancy

Every request is associated with a tenant via `TenantContextFilter`:

```java
@Component
public class TenantContextFilter implements WebFilter {
    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        String tenantId = extractTenantId(exchange);
        return tenantRepository.findById(tenantId)
            .flatMap(tenant ->
                chain.filter(exchange)
                    .contextWrite(Context.of("tenantId", tenantId, "tenant", tenant))
            );
    }
}
```

All database queries automatically filter by tenant:

```java
public interface TenantAwareRepository<T, ID> extends ReactiveMongoRepository<T, ID> {
    default Mono<T> findById(ID id) {
        return Mono.deferContextual(ctx -> {
            String tenantId = ctx.get("tenantId");
            return findByIdAndTenantId(id, tenantId);
        });
    }
}
```

### 3. Database Strategy

**MongoDB** - Primary data store
- Products, orders, customers, tenants
- Flexible schema for dynamic attributes
- Compound indexes: `{tenantId: 1, ...}`

**Redis** - Caching and real-time data
- Session data
- Cart contents
- Real-time inventory
- Cache with tenant prefix

**Elasticsearch** - Full-text search
- Product search with dynamic attributes
- Faceted search and aggregations
- Multi-tenant index strategy

**PostgreSQL** - Financial transactions
- Payment records (ACID compliance)
- Separate from other data

### 4. API Design

RESTful endpoints with reactive responses:

```java
@RestController
@RequestMapping("/api/v1/products")
public class ProductController {

    @GetMapping
    public Flux<ProductDTO> getAllProducts(
        @RequestParam(required = false) String category,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        return productService.findAll(category, PageRequest.of(page, size));
    }

    @GetMapping("/{id}")
    public Mono<ResponseEntity<ProductDTO>> getProduct(@PathVariable String id) {
        return productService.findById(id)
            .map(ResponseEntity::ok)
            .defaultIfEmpty(ResponseEntity.notFound().build());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<ProductDTO> createProduct(@Valid @RequestBody CreateProductRequest request) {
        return productService.create(request);
    }

    @PutMapping("/{id}")
    public Mono<ProductDTO> updateProduct(
        @PathVariable String id,
        @Valid @RequestBody UpdateProductRequest request
    ) {
        return productService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public Mono<Void> deleteProduct(@PathVariable String id) {
        return productService.delete(id);
    }
}
```

### 5. Error Handling

Global exception handling:

```java
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ProductNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(ProductNotFoundException ex) {
        return ResponseEntity
            .status(HttpStatus.NOT_FOUND)
            .body(new ErrorResponse("NOT_FOUND", ex.getMessage()));
    }

    @ExceptionHandler(ValidationException.class)
    public ResponseEntity<ErrorResponse> handleValidation(ValidationException ex) {
        return ResponseEntity
            .status(HttpStatus.BAD_REQUEST)
            .body(new ErrorResponse("VALIDATION_ERROR", ex.getMessage()));
    }
}
```

### 6. Testing

**Unit Tests** with StepVerifier:

```java
@ExtendWith(MockitoExtension.class)
class ProductServiceTest {

    @Mock
    private ProductRepository repository;

    @InjectMocks
    private ProductService service;

    @Test
    void findById_ShouldReturnProduct() {
        when(repository.findById("123"))
            .thenReturn(Mono.just(product));

        StepVerifier.create(service.findById("123"))
            .expectNext(expectedDTO)
            .verifyComplete();
    }
}
```

**Integration Tests** with WebTestClient:

```java
@SpringBootTest(webEnvironment = RANDOM_PORT)
class ProductControllerIntegrationTest {

    @Autowired
    private WebTestClient webTestClient;

    @Test
    void getProduct_ShouldReturn200() {
        webTestClient.get()
            .uri("/api/v1/products/{id}", productId)
            .exchange()
            .expectStatus().isOk()
            .expectBody(ProductDTO.class)
            .value(dto -> assertThat(dto.getId()).isEqualTo(productId));
    }
}
```

## Key Dependencies

```xml
<dependencies>
    <!-- Spring Boot WebFlux -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-webflux</artifactId>
    </dependency>

    <!-- MongoDB Reactive -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-mongodb-reactive</artifactId>
    </dependency>

    <!-- Redis Reactive -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-redis-reactive</artifactId>
    </dependency>

    <!-- R2DBC PostgreSQL -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-r2dbc</artifactId>
    </dependency>
    <dependency>
        <groupId>org.postgresql</groupId>
        <artifactId>r2dbc-postgresql</artifactId>
    </dependency>

    <!-- Elasticsearch -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-elasticsearch</artifactId>
    </dependency>

    <!-- Validation -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-validation</artifactId>
    </dependency>

    <!-- Testing -->
    <dependency>
        <groupId>io.projectreactor</groupId>
        <artifactId>reactor-test</artifactId>
        <scope>test</scope>
    </dependency>
</dependencies>
```

## Related Documentation

- [Setup Guide](./setup.md) - Environment setup instructions
- [Patterns Guide](./patterns.md) - Detailed code patterns and examples
- [Backend Developer Agent](../../../.claude/agents/BACKEND_DEVELOPER.md) - AI agent guidelines
- [Testing Guide](../testing.md) - Testing strategies
