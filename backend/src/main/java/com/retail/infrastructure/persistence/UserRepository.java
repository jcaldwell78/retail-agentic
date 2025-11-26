package com.retail.infrastructure.persistence;

import com.retail.domain.user.User;
import com.retail.domain.user.UserRole;
import com.retail.domain.user.UserStatus;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.data.mongodb.repository.ReactiveMongoRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * Repository for User entities with tenant filtering.
 * All queries automatically filter by tenantId for multi-tenant isolation.
 */
@Repository
public interface UserRepository extends ReactiveMongoRepository<User, String> {

    /**
     * Find user by email and tenant (for login)
     */
    Mono<User> findByEmailAndTenantId(String email, String tenantId);

    /**
     * Find user by ID and tenant
     */
    Mono<User> findByIdAndTenantId(String id, String tenantId);

    /**
     * Find all users for tenant with pagination
     */
    Flux<User> findByTenantId(String tenantId, Pageable pageable);

    /**
     * Find users by role and tenant
     */
    Flux<User> findByTenantIdAndRole(String tenantId, UserRole role, Pageable pageable);

    /**
     * Find users by status and tenant
     */
    Flux<User> findByTenantIdAndStatus(String tenantId, UserStatus status, Pageable pageable);

    /**
     * Find active users for tenant
     */
    @Query("{ 'tenantId': ?0, 'status': 'ACTIVE' }")
    Flux<User> findActiveUsers(String tenantId, Pageable pageable);

    /**
     * Check if email exists for tenant
     */
    Mono<Boolean> existsByEmailAndTenantId(String email, String tenantId);

    /**
     * Count users for tenant
     */
    Mono<Long> countByTenantId(String tenantId);

    /**
     * Count active users for tenant
     */
    @Query(value = "{ 'tenantId': ?0, 'status': 'ACTIVE' }", count = true)
    Mono<Long> countActiveUsers(String tenantId);

    /**
     * Count users by role for tenant
     */
    Mono<Long> countByTenantIdAndRole(String tenantId, UserRole role);

    /**
     * Find users who logged in after a specific date
     */
    @Query("{ 'tenantId': ?0, 'lastLoginAt': { $gte: ?1 } }")
    Flux<User> findRecentlyActiveUsers(String tenantId, java.time.Instant since);

    /**
     * Delete user by ID and tenant (ensures tenant isolation)
     */
    Mono<Void> deleteByIdAndTenantId(String id, String tenantId);

    /**
     * Find users created after a specific date for tenant
     */
    @Query("{ 'tenantId': ?0, 'createdAt': { $gte: ?1 } }")
    Flux<User> findByTenantIdAndCreatedAtAfter(String tenantId, java.time.Instant after);

    /**
     * Count users created after a specific date for tenant
     */
    @Query(value = "{ 'tenantId': ?0, 'createdAt': { $gte: ?1 } }", count = true)
    Mono<Long> countByTenantIdAndCreatedAtAfter(String tenantId, java.time.Instant after);
}
