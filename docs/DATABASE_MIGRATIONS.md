# Database Migration Strategy

## Overview

This document describes the database migration strategy for the Retail Agentic platform.

## Technology

- **MongoDB**: Primary database (document store)
- **Migration Approach**: Custom lightweight migration framework
- **Migration Tracking**: `migration_history` collection

## Migration Principles

### 1. Idempotency
All migrations must be idempotent - safe to run multiple times without side effects.

### 2. Forward-Only
Migrations are forward-only. No rollbacks. If a migration needs to be undone, create a new migration that reverses the changes.

### 3. Sequential Versioning
Migrations use sequential integer versions (1, 2, 3, ...). Versions must be unique.

### 4. Non-Blocking
Failed migrations log errors but don't block application startup. This allows the application to remain available even if a migration fails.

## Migration Structure

### Migration Interface

```java
public interface Migration {
    int getVersion();              // Unique sequential number
    String getDescription();        // Human-readable description
    Mono<Void> execute(ReactiveMongoTemplate mongoTemplate);
    Mono<Boolean> shouldExecute(ReactiveMongoTemplate mongoTemplate);
}
```

### Migration History

Tracked in `migration_history` collection:

```javascript
{
  "_id": ObjectId(...),
  "version": 1,
  "description": "Create indexes for products",
  "executedAt": ISODate(...),
  "executionTimeMs": 1234,
  "success": true,
  "errorMessage": null
}
```

## Creating a Migration

### Step 1: Create Migration Class

```java
package com.retail.infrastructure.migration.migrations;

import com.retail.infrastructure.migration.Migration;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.index.Index;
import reactor.core.publisher.Mono;

public class V001_CreateProductIndexes implements Migration {

    @Override
    public int getVersion() {
        return 1;
    }

    @Override
    public String getDescription() {
        return "Create indexes for products collection";
    }

    @Override
    public Mono<Void> execute(ReactiveMongoTemplate mongoTemplate) {
        return mongoTemplate.indexOps("products")
            .ensureIndex(new Index().on("tenantId", Sort.Direction.ASC))
            .then(mongoTemplate.indexOps("products")
                .ensureIndex(new Index()
                    .on("tenantId", Sort.Direction.ASC)
                    .on("sku", Sort.Direction.ASC)
                    .unique()
                )
            )
            .then();
    }
}
```

### Step 2: Register Migration

Add to `DatabaseMigrationConfig.getMigrations()`:

```java
private List<Migration> getMigrations() {
    return List.of(
        new V001_CreateProductIndexes(),
        new V002_AddDefaultBranding(),
        new V003_YourNewMigration()  // Add here
    );
}
```

### Step 3: Run Migration

Migrations run automatically on application startup (when enabled).

## Migration Patterns

### Creating Indexes

```java
@Override
public Mono<Void> execute(ReactiveMongoTemplate mongoTemplate) {
    return mongoTemplate.indexOps("collection_name")
        .ensureIndex(new Index().on("field", Sort.Direction.ASC))
        .then();
}
```

### Adding Fields to Documents

```java
@Override
public Mono<Void> execute(ReactiveMongoTemplate mongoTemplate) {
    Query query = new Query(Criteria.where("newField").exists(false));
    Update update = new Update().set("newField", "default_value");

    return mongoTemplate.updateMulti(query, update, "collection_name")
        .then();
}
```

### Data Transformation

```java
@Override
public Mono<Void> execute(ReactiveMongoTemplate mongoTemplate) {
    return mongoTemplate.findAll(OldSchema.class, "collection_name")
        .flatMap(oldDoc -> {
            NewSchema newDoc = transform(oldDoc);
            return mongoTemplate.save(newDoc);
        })
        .then();
}
```

### Conditional Execution

```java
@Override
public Mono<Boolean> shouldExecute(ReactiveMongoTemplate mongoTemplate) {
    // Only run if index doesn't exist
    return mongoTemplate.indexOps("products")
        .getIndexInfo()
        .filter(index -> index.getName().equals("tenant_sku_idx"))
        .hasElements()
        .map(exists -> !exists);
}
```

## Testing Migrations

### Unit Testing

```java
@Test
void testMigration() {
    V001_CreateProductIndexes migration = new V001_CreateProductIndexes();

    StepVerifier.create(migration.execute(mongoTemplate))
        .verifyComplete();

    // Verify indexes were created
    StepVerifier.create(
        mongoTemplate.indexOps("products").getIndexInfo()
    )
    .assertNext(indexes -> {
        assertThat(indexes).isNotEmpty();
    })
    .verifyComplete();
}
```

### Integration Testing

Test migrations against real MongoDB (test containers):

```java
@SpringBootTest
@Testcontainers
class MigrationIntegrationTest {

    @Container
    static MongoDBContainer mongodb = new MongoDBContainer("mongo:7.0");

    @Test
    void testAllMigrations() {
        // Run all migrations
        // Verify database state
    }
}
```

## Best Practices

### DO:
- ✅ Make migrations idempotent
- ✅ Test migrations on test data before production
- ✅ Use descriptive names and descriptions
- ✅ Keep migrations small and focused
- ✅ Document complex migrations
- ✅ Check migration history before creating new version

### DON'T:
- ❌ Delete data without backup
- ❌ Make migrations depend on application code
- ❌ Assume migration order (use version numbers)
- ❌ Modify existing migrations (create new ones instead)
- ❌ Block application startup on migration failure

## Production Deployment

### Pre-Deployment Checklist

1. **Backup Database**
   ```bash
   mongodump --uri="mongodb://..." --out=backup_$(date +%Y%m%d)
   ```

2. **Test Migrations**
   - Run on staging environment
   - Verify data integrity
   - Check performance impact

3. **Review Migration Code**
   - Code review by team
   - Verify idempotency
   - Check error handling

### Deployment Steps

1. Deploy new application version (migrations run on startup)
2. Monitor migration execution logs
3. Verify migration completion in `migration_history`
4. Test application functionality

### Rollback Plan

If migration fails:
1. Stop application
2. Restore database from backup
3. Fix migration code
4. Redeploy

## Monitoring

### Check Migration Status

```javascript
db.migration_history.find().sort({version: -1})
```

### Find Failed Migrations

```javascript
db.migration_history.find({success: false})
```

### Migration Performance

```javascript
db.migration_history.aggregate([
  {
    $group: {
      _id: null,
      avgExecutionTime: { $avg: "$executionTimeMs" },
      maxExecutionTime: { $max: "$executionTimeMs" }
    }
  }
])
```

## Future Enhancements

### Potential Improvements

1. **Mongock Integration**: Replace custom framework with Mongock
2. **Rollback Support**: Add reverse migrations
3. **Parallel Execution**: Run independent migrations in parallel
4. **Migration Locking**: Prevent concurrent migration execution
5. **Migration Validation**: Dry-run mode for testing

## References

- [Mongock Documentation](https://www.mongock.io/)
- [MongoDB Schema Design Best Practices](https://www.mongodb.com/docs/manual/core/data-model-design/)
- [Reactive MongoDB Operations](https://docs.spring.io/spring-data/mongodb/docs/current/reference/html/#mongo.reactive)
