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
     */
    Flux<T> findAllByTenant();

    /**
     * Find all entities for the current tenant with pagination.
     */
    Flux<T> findAllByTenant(Pageable pageable);

    /**
     * Find entity by ID for the current tenant.
     * Ensures tenant isolation - users can only access their tenant's data.
     */
    Mono<T> findByIdAndTenant(ID id);

    /**
     * Save entity with automatic tenantId injection.
     */
    <S extends T> Mono<S> saveWithTenant(S entity);

    /**
     * Delete entity by ID ensuring tenant isolation.
     */
    Mono<Void> deleteByIdAndTenant(ID id);

    /**
     * Count all entities for the current tenant.
     */
    Mono<Long> countByTenant();

    /**
     * Check if entity exists for the current tenant.
     */
    Mono<Boolean> existsByIdAndTenant(ID id);
}
