package com.retail.infrastructure.persistence;

import com.retail.security.tenant.TenantContext;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.repository.query.MongoEntityInformation;
import org.springframework.data.mongodb.repository.support.SimpleReactiveMongoRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.lang.reflect.Field;

/**
 * Implementation of TenantAwareRepository that automatically injects tenantId
 * from the reactive context into all queries and save operations.
 *
 * @param <T> The entity type
 * @param <ID> The ID type
 */
public class TenantAwareRepositoryImpl<T, ID> extends SimpleReactiveMongoRepository<T, ID>
        implements TenantAwareRepository<T, ID> {

    private static final String TENANT_ID_FIELD = "tenantId";
    private final ReactiveMongoOperations mongoOperations;
    private final MongoEntityInformation<T, ID> entityInformation;

    public TenantAwareRepositoryImpl(MongoEntityInformation<T, ID> metadata,
                                      ReactiveMongoOperations mongoOperations) {
        super(metadata, mongoOperations);
        this.mongoOperations = mongoOperations;
        this.entityInformation = metadata;
    }

    @Override
    public Flux<T> findAllByTenant() {
        return TenantContext.getTenantId()
                .flatMapMany(tenantId -> {
                    Query query = new Query(Criteria.where(TENANT_ID_FIELD).is(tenantId));
                    return mongoOperations.find(query, entityInformation.getJavaType());
                });
    }

    @Override
    public Flux<T> findAllByTenant(Pageable pageable) {
        return TenantContext.getTenantId()
                .flatMapMany(tenantId -> {
                    Query query = new Query(Criteria.where(TENANT_ID_FIELD).is(tenantId));
                    query.with(pageable);
                    return mongoOperations.find(query, entityInformation.getJavaType());
                });
    }

    @Override
    public Mono<T> findByIdAndTenant(ID id) {
        return TenantContext.getTenantId()
                .flatMap(tenantId -> {
                    Query query = new Query(Criteria.where("_id").is(id)
                            .and(TENANT_ID_FIELD).is(tenantId));
                    return mongoOperations.findOne(query, entityInformation.getJavaType());
                });
    }

    @Override
    public <S extends T> Mono<S> saveWithTenant(S entity) {
        return TenantContext.getTenantId()
                .flatMap(tenantId -> {
                    // Inject tenantId if not already set
                    injectTenantId(entity, tenantId);
                    return mongoOperations.save(entity);
                });
    }

    @Override
    public Mono<Void> deleteByIdAndTenant(ID id) {
        return TenantContext.getTenantId()
                .flatMap(tenantId -> {
                    Query query = new Query(Criteria.where("_id").is(id)
                            .and(TENANT_ID_FIELD).is(tenantId));
                    return mongoOperations.remove(query, entityInformation.getJavaType());
                })
                .then();
    }

    @Override
    public Mono<Long> countByTenant() {
        return TenantContext.getTenantId()
                .flatMap(tenantId -> {
                    Query query = new Query(Criteria.where(TENANT_ID_FIELD).is(tenantId));
                    return mongoOperations.count(query, entityInformation.getJavaType());
                });
    }

    @Override
    public Mono<Boolean> existsByIdAndTenant(ID id) {
        return TenantContext.getTenantId()
                .flatMap(tenantId -> {
                    Query query = new Query(Criteria.where("_id").is(id)
                            .and(TENANT_ID_FIELD).is(tenantId));
                    return mongoOperations.exists(query, entityInformation.getJavaType());
                });
    }

    /**
     * Inject tenantId into entity using reflection if not already set.
     */
    private void injectTenantId(Object entity, String tenantId) {
        try {
            Field field = findTenantIdField(entity.getClass());
            if (field != null) {
                field.setAccessible(true);
                Object currentValue = field.get(entity);
                if (currentValue == null) {
                    field.set(entity, tenantId);
                }
            }
        } catch (IllegalAccessException e) {
            throw new RuntimeException("Failed to inject tenantId", e);
        }
    }

    /**
     * Find the tenantId field in the entity class hierarchy.
     */
    private Field findTenantIdField(Class<?> clazz) {
        while (clazz != null) {
            try {
                return clazz.getDeclaredField(TENANT_ID_FIELD);
            } catch (NoSuchFieldException e) {
                clazz = clazz.getSuperclass();
            }
        }
        return null;
    }
}
