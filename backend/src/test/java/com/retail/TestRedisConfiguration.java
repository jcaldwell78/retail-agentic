package com.retail;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.data.redis.connection.ReactiveRedisConnectionFactory;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.RedisSerializer;
import reactor.core.publisher.Mono;

import static org.mockito.Mockito.*;

/**
 * Test configuration that provides mock Redis beans for testing.
 * This allows tests to run without requiring a real Redis instance.
 */
@TestConfiguration
public class TestRedisConfiguration {

    /**
     * Provides a mock ReactiveRedisTemplate for String/Integer caching.
     * This is used by InventoryService for caching inventory levels.
     */
    @Bean("reactiveRedisTemplate")
    @Primary
    public ReactiveRedisTemplate<String, Integer> reactiveIntegerRedisTemplate() {
        @SuppressWarnings("unchecked")
        ReactiveRedisTemplate<String, Integer> template = mock(ReactiveRedisTemplate.class);

        // Mock common Redis operations to return empty results
        @SuppressWarnings("unchecked")
        var opsForValue = mock(org.springframework.data.redis.core.ReactiveValueOperations.class);
        when(template.opsForValue()).thenReturn(opsForValue);
        when(template.hasKey(anyString())).thenReturn(Mono.just(Boolean.FALSE));
        when(template.delete(anyString())).thenReturn(Mono.just(0L));

        return template;
    }

    /**
     * Provides a mock ReactiveRedisTemplate for String/String operations.
     * This can be used by other services that need String-based caching.
     */
    @Bean
    @Primary
    public ReactiveRedisTemplate<String, String> reactiveStringRedisTemplate() {
        @SuppressWarnings("unchecked")
        ReactiveRedisTemplate<String, String> template = mock(ReactiveRedisTemplate.class);

        // Mock common Redis operations to return empty results
        @SuppressWarnings("unchecked")
        var opsForValue = mock(org.springframework.data.redis.core.ReactiveValueOperations.class);
        when(template.opsForValue()).thenReturn(opsForValue);
        when(template.hasKey(anyString())).thenReturn(Mono.just(Boolean.FALSE));
        when(template.delete(anyString())).thenReturn(Mono.just(0L));

        return template;
    }

    /**
     * Provides a mock ReactiveRedisTemplate for String/Cart operations.
     * This is used by CartRepository for storing shopping carts.
     */
    @Bean
    public ReactiveRedisTemplate<String, com.retail.domain.cart.Cart> reactiveCartRedisTemplate() {
        @SuppressWarnings("unchecked")
        ReactiveRedisTemplate<String, com.retail.domain.cart.Cart> template = mock(ReactiveRedisTemplate.class);

        // Mock common Redis operations to return empty results
        @SuppressWarnings("unchecked")
        var opsForValue = mock(org.springframework.data.redis.core.ReactiveValueOperations.class);
        when(template.opsForValue()).thenReturn(opsForValue);
        when(template.hasKey(anyString())).thenReturn(Mono.just(Boolean.FALSE));
        when(template.delete(anyString())).thenReturn(Mono.just(0L));

        return template;
    }

    /**
     * Provides a mock ReactiveRedisConnectionFactory.
     * Required by some Spring Data Redis components.
     */
    @Bean
    @Primary
    public ReactiveRedisConnectionFactory reactiveRedisConnectionFactory() {
        return mock(ReactiveRedisConnectionFactory.class);
    }
}
