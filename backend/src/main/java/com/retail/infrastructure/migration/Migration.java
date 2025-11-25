package com.retail.infrastructure.migration;

import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import reactor.core.publisher.Mono;

/**
 * Base interface for database migrations.
 * All migrations must implement this interface.
 */
public interface Migration {

    /**
     * Get migration version number.
     * Must be unique and sequential (e.g., 1, 2, 3...).
     *
     * @return Version number
     */
    int getVersion();

    /**
     * Get migration description.
     *
     * @return Human-readable description
     */
    String getDescription();

    /**
     * Execute the migration.
     * Must be idempotent - safe to run multiple times.
     *
     * @param mongoTemplate MongoDB template for operations
     * @return Mono<Void> Completes when migration is done
     */
    Mono<Void> execute(ReactiveMongoTemplate mongoTemplate);

    /**
     * Check if migration should be executed.
     * Default: always execute if not in migration history.
     *
     * @param mongoTemplate MongoDB template
     * @return Mono<Boolean> True if should execute
     */
    default Mono<Boolean> shouldExecute(ReactiveMongoTemplate mongoTemplate) {
        return Mono.just(true);
    }
}
