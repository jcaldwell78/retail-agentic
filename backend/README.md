# Retail Platform Backend

Multi-tenant retail platform backend service built with Spring Boot, Project Reactor, and reactive data access.

## Tech Stack

- **Java**: 21 (LTS)
- **Framework**: Spring Boot 3.2.1 with WebFlux
- **Reactive**: Project Reactor (Mono/Flux)
- **Build Tool**: Maven 3.9+
- **Databases**:
  - MongoDB 7 (primary data store)
  - Redis 7 (caching)
  - Elasticsearch 8 (search)
  - PostgreSQL 15 (financial transactions with R2DBC)

## Prerequisites

- Java 21 or later
- Maven 3.9 or later

## Quick Start

### Build the Project

```bash
# From the backend directory
mvn clean install
```

### Run Tests

```bash
# Run all tests
mvn test

# Run tests with coverage report
mvn test jacoco:report

# View coverage report
open target/site/jacoco/index.html
```

### Run the Application

```bash
# Run with default profile
mvn spring-boot:run

# Run with specific profile
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

The application will start on `http://localhost:8080`.

### Verify the Application

```bash
# Check health endpoint
curl http://localhost:8080/api/v1/health

# View API documentation
open http://localhost:8080/swagger-ui.html

# View OpenAPI specification
curl http://localhost:8080/v3/api-docs
```

## Running in Isolation

The backend can run in isolation without external databases for testing purposes.

### Standalone Mode (No External Dependencies)

The application will fail to start if databases are not available. For isolation testing:

1. **Mock External Services**: Use the test profile which disables autoconfiguration
2. **Embedded Databases**: Use in-memory alternatives (future enhancement)
3. **Docker Compose**: Use the provided docker-compose for local dependencies

### Using Docker Compose (Recommended)

```bash
# Start all dependencies
docker-compose up -d

# Run the application
mvn spring-boot:run

# Stop dependencies
docker-compose down
```

### Test Profile

The test profile (`application-test.yml`) disables external database connections:

```bash
# Run tests (uses test profile automatically)
mvn test
```

## Configuration

### Application Profiles

- **default**: Development settings with verbose logging
- **dev**: Development profile with debug logging
- **test**: Testing profile with disabled external dependencies
- **prod**: Production profile with minimal logging

### Environment Variables

Override configuration using environment variables:

```bash
# MongoDB
export SPRING_DATA_MONGODB_URI=mongodb://localhost:27017/retaildb

# Redis
export SPRING_DATA_REDIS_HOST=localhost
export SPRING_DATA_REDIS_PORT=6379
export SPRING_DATA_REDIS_PASSWORD=your_password

# PostgreSQL (R2DBC)
export SPRING_R2DBC_URL=r2dbc:postgresql://localhost:5432/payments
export SPRING_R2DBC_USERNAME=postgres
export SPRING_R2DBC_PASSWORD=postgres

# Elasticsearch
export SPRING_ELASTICSEARCH_URIS=http://localhost:9200
```

## API Documentation

### Interactive Documentation

Once the application is running, access the Swagger UI:
```
http://localhost:8080/swagger-ui.html
```

### OpenAPI Specification

- **JSON**: `http://localhost:8080/v3/api-docs`
- **YAML**: `http://localhost:8080/v3/api-docs.yaml`

## Available Endpoints

### Health Check
```bash
GET /api/v1/health
```

### Actuator Endpoints
```bash
GET /actuator/health      # Health status
GET /actuator/info        # Application info
GET /actuator/metrics     # Application metrics
GET /actuator/prometheus  # Prometheus metrics
```

## Building for Production

### Create Executable JAR

```bash
mvn clean package -DskipTests

# Run the JAR
java -jar target/retail-backend-1.0.0-SNAPSHOT.jar
```

### Build Docker Image

```bash
# Build the image
docker build -t retail-backend:latest .

# Run the container
docker run -p 8080:8080 \
  -e SPRING_DATA_MONGODB_URI=mongodb://host.docker.internal:27017/retaildb \
  retail-backend:latest
```

## Development Workflow

### 1. Make Changes

Edit Java files in `src/main/java/com/retail/`

### 2. Run Tests

```bash
# Quick feedback loop
mvn test -Dtest=YourTestClass

# Run specific test method
mvn test -Dtest=YourTestClass#testMethod
```

### 3. Verify Locally

```bash
# Start the application
mvn spring-boot:run

# In another terminal, test your changes
curl http://localhost:8080/api/v1/your-endpoint
```

### 4. Check Code Coverage

```bash
mvn test jacoco:report
open target/site/jacoco/index.html
```

Target coverage: **80%** (enforced by JaCoCo)

## Project Structure

```
backend/
├── src/
│   ├── main/
│   │   ├── java/com/retail/
│   │   │   ├── RetailApplication.java          # Main application class
│   │   │   ├── config/                         # Configuration classes
│   │   │   │   └── OpenApiConfig.java          # OpenAPI configuration
│   │   │   ├── controller/                     # REST controllers
│   │   │   │   └── HealthController.java       # Health check endpoint
│   │   │   ├── service/                        # Business logic
│   │   │   ├── repository/                     # Data access
│   │   │   ├── model/                          # Domain entities
│   │   │   ├── dto/                            # Data transfer objects
│   │   │   ├── mapper/                         # Entity <-> DTO mappers
│   │   │   ├── filter/                         # WebFilters (e.g., TenantContextFilter)
│   │   │   ├── exception/                      # Custom exceptions
│   │   │   └── util/                           # Utility classes
│   │   └── resources/
│   │       ├── application.yml                 # Main configuration
│   │       ├── application-dev.yml             # Dev configuration
│   │       ├── application-test.yml            # Test configuration
│   │       └── application-prod.yml            # Prod configuration
│   └── test/
│       ├── java/com/retail/
│       │   ├── RetailApplicationTest.java      # Application smoke tests
│       │   └── controller/
│       │       └── HealthControllerTest.java   # Controller tests
│       └── resources/
│           └── application-test.yml            # Test configuration
├── pom.xml                                     # Maven configuration
├── Dockerfile                                  # Docker build instructions
└── README.md                                   # This file
```

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 8080
lsof -i :8080

# Kill the process
kill -9 <PID>

# Or run on a different port
mvn spring-boot:run -Dspring-boot.run.arguments=--server.port=8081
```

### Database Connection Issues

```bash
# Check if MongoDB is running
docker ps | grep mongo

# Check if Redis is running
docker ps | grep redis

# View application logs
mvn spring-boot:run | grep ERROR
```

### Out of Memory

```bash
# Increase heap size
export MAVEN_OPTS="-Xmx2048m"
mvn spring-boot:run
```

### Tests Failing

```bash
# Clean and rebuild
mvn clean install

# Skip tests temporarily
mvn clean install -DskipTests

# Run tests with debug output
mvn test -X
```

## Code Quality

### Run Linter/Formatter

```bash
# Format code (if using spotless or similar)
mvn spotless:apply

# Check code style
mvn checkstyle:check
```

### Static Analysis

```bash
# Run all quality checks
mvn verify
```

## CI/CD

This project uses GitHub Actions for continuous integration. See `.github/workflows/ci.yml` for details.

### Local CI Verification

```bash
# Run the same commands as CI
mvn clean install
mvn test
mvn jacoco:report
```

## Additional Resources

- [Development Guide](../docs/development/backend/README.md)
- [API-First Development](../docs/development/backend/API_FIRST.md)
- [Architecture Documentation](../docs/architecture/README.md)
- [Spring Boot Documentation](https://docs.spring.io/spring-boot/docs/current/reference/htmlsingle/)
- [Project Reactor Documentation](https://projectreactor.io/docs/core/release/reference/)

## Support

For issues or questions:
1. Check existing documentation in `docs/`
2. Review the [Architecture Guide](../docs/architecture/README.md)
3. Check GitHub Issues
4. Contact the development team

## License

Proprietary - All rights reserved
