package com.retail.infrastructure.persistence;

import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.repository.query.MongoEntityInformation;
import org.springframework.data.mongodb.repository.support.ReactiveMongoRepositoryFactory;
import org.springframework.data.mongodb.repository.support.ReactiveMongoRepositoryFactoryBean;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.core.RepositoryInformation;
import org.springframework.data.repository.core.RepositoryMetadata;

import java.io.Serializable;

/**
 * Factory bean for creating tenant-aware repository instances.
 * This enables automatic tenantId injection for all repositories
 * extending TenantAwareRepository.
 */
public class TenantAwareRepositoryFactoryBean<T extends Repository<S, ID>, S, ID extends Serializable>
        extends ReactiveMongoRepositoryFactoryBean<T, S, ID> {

    public TenantAwareRepositoryFactoryBean(Class<? extends T> repositoryInterface) {
        super(repositoryInterface);
    }

    @Override
    protected ReactiveMongoRepositoryFactory getFactoryInstance(ReactiveMongoOperations operations) {
        return new TenantAwareRepositoryFactory(operations);
    }

    private static class TenantAwareRepositoryFactory extends ReactiveMongoRepositoryFactory {

        private final ReactiveMongoOperations mongoOperations;

        public TenantAwareRepositoryFactory(ReactiveMongoOperations mongoOperations) {
            super(mongoOperations);
            this.mongoOperations = mongoOperations;
        }

        @Override
        protected Object getTargetRepository(RepositoryInformation information) {
            MongoEntityInformation<?, Serializable> entityInformation =
                    getEntityInformation(information.getDomainType());

            // Return tenant-aware implementation for TenantAwareRepository interfaces
            if (TenantAwareRepository.class.isAssignableFrom(information.getRepositoryInterface())) {
                return new TenantAwareRepositoryImpl<>(entityInformation, mongoOperations);
            }

            // Return default implementation for other repositories
            return super.getTargetRepository(information);
        }

        @Override
        protected Class<?> getRepositoryBaseClass(RepositoryMetadata metadata) {
            // Use tenant-aware implementation for TenantAwareRepository
            if (TenantAwareRepository.class.isAssignableFrom(metadata.getRepositoryInterface())) {
                return TenantAwareRepositoryImpl.class;
            }
            return super.getRepositoryBaseClass(metadata);
        }
    }
}
