package com.retail;

import com.retail.infrastructure.search.ProductSearchDocument;
import com.retail.infrastructure.search.ProductSearchRepository;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.data.domain.Pageable;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * Test configuration that provides mock Elasticsearch beans for testing.
 * This allows tests to run without requiring a real Elasticsearch instance.
 */
@TestConfiguration
public class TestElasticsearchConfiguration {

    /**
     * Provides a mock ProductSearchRepository.
     * Returns empty results for all search operations.
     */
    @Bean
    @Primary
    public ProductSearchRepository productSearchRepository() {
        ProductSearchRepository repository = mock(ProductSearchRepository.class);

        // Mock all query methods to return empty results
        when(repository.findByTenantIdAndStatus(anyString(), anyString(), any(Pageable.class)))
            .thenReturn(Flux.empty());

        when(repository.findByTenantIdAndCategoryContaining(anyString(), anyString(), any(Pageable.class)))
            .thenReturn(Flux.empty());

        when(repository.findByTenantIdAndNameContainingOrDescriptionContaining(
                anyString(), anyString(), anyString(), any(Pageable.class)))
            .thenReturn(Flux.empty());

        when(repository.findByTenantIdAndPriceBetween(
                anyString(), anyDouble(), anyDouble(), any(Pageable.class)))
            .thenReturn(Flux.empty());

        when(repository.countByTenantId(anyString()))
            .thenReturn(Mono.just(0L));

        when(repository.countByTenantIdAndStatus(anyString(), anyString()))
            .thenReturn(Mono.just(0L));

        // Mock save operations
        when(repository.save(any(ProductSearchDocument.class)))
            .thenAnswer(invocation -> Mono.just(invocation.getArgument(0)));

        when(repository.saveAll(anyIterable()))
            .thenReturn(Flux.empty());

        // Mock delete operations
        when(repository.delete(any(ProductSearchDocument.class)))
            .thenReturn(Mono.empty());

        when(repository.deleteById(anyString()))
            .thenReturn(Mono.empty());

        when(repository.deleteAll())
            .thenReturn(Mono.empty());

        // Mock findById
        when(repository.findById(anyString()))
            .thenReturn(Mono.empty());

        // Mock existsById
        when(repository.existsById(anyString()))
            .thenReturn(Mono.just(false));

        // Mock findAll
        when(repository.findAll())
            .thenReturn(Flux.empty());

        when(repository.count())
            .thenReturn(Mono.just(0L));

        return repository;
    }
}
