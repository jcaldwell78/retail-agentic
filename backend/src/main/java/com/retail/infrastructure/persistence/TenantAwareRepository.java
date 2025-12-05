package com.retail.infrastructure.persistence;

import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.ReactiveMongoRepository;
import org.springframework.data.repository.NoRepositoryBean;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * Base repository interface that provides tenant-aware CRUD operations.
 * All methods automatically inject tenantId from the reactive context.
 *
 * @param <T> The entity type
 * @param <ID> The ID type
 */
@NoRepositoryBean
public interface TenantAwareRepository<T, ID> extends ReactiveMongoRepository<T, ID> {

    /**
     * Find all entities for the current tenant.
     * TenantId is automatically injected from reactive context.
     *
     * @return Flux of all tenant entities
     */
    Flux<T> findAllByTenant();

    /**
     * Find all entities for the current tenant with pagination.
     *
     * @param pageable Pagination information
     * @return Flux of tenant entities
     */
    Flux<T> findAllByTenant(Pageable pageable);

    /**
     * Find entity by ID for the current tenant.
     * Ensures tenant isolation - users can only access their tenant's data.
     *
     * @param id The entity ID
     * @return Mono with entity or empty
     */
    Mono<T> findByIdAndTenant(ID id);

    /**
     * Save entity with automatic tenantId injection.
     * If entity doesn't have tenantId, it will be set from context.
     *
     * @param entity The entity to save
     * @param <S> The entity subtype
     * @return Mono with saved entity
     */
    <S extends T> Mono<S> saveWithTenant(S entity);

    /**
     * Delete entity by ID ensuring tenant isolation.
     * Only deletes if the entity belongs to the current tenant.
     *
     * @param id The entity ID
     * @return Mono<Void> when complete
     */
    Mono<Void> deleteByIdAndTenant(ID id);

    /**
     * Count all entities for the current tenant.
     *
     * @return Mono with count
     */
    Mono<Long> countByTenant();

    /**
     * Check if entity exists for the current tenant.
     *
     * @param id The entity ID
     * @return Mono<Boolean> true if exists
     */
    Mono<Boolean> existsByIdAndTenant(ID id);
}
