package com.retail.infrastructure.persistence;

import com.retail.domain.tenant.Tenant;
import org.springframework.data.mongodb.repository.ReactiveMongoRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Mono;

/**
 * Repository for Tenant entities.
 * No tenant filtering needed as this is the root entity for multi-tenancy.
 */
@Repository
public interface TenantRepository extends ReactiveMongoRepository<Tenant, String> {

    /**
     * Find tenant by subdomain
     *
     * @param subdomain The subdomain identifier
     * @return Mono containing the tenant or empty
     */
    Mono<Tenant> findBySubdomain(String subdomain);

    /**
     * Find tenant by custom domain
     *
     * @param customDomain The custom domain
     * @return Mono containing the tenant or empty
     */
    Mono<Tenant> findByCustomDomain(String customDomain);

    /**
     * Check if subdomain exists
     *
     * @param subdomain The subdomain to check
     * @return Mono containing true if exists, false otherwise
     */
    Mono<Boolean> existsBySubdomain(String subdomain);
}
