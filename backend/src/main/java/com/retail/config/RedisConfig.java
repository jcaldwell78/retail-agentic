package com.retail.config;

import com.retail.domain.cart.Cart;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.ReactiveRedisConnectionFactory;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import org.springframework.data.redis.core.ReactiveStringRedisTemplate;
import org.springframework.data.redis.serializer.*;

/**
 * Redis configuration for reactive Redis operations.
 */
@Configuration
public class RedisConfig {

    /**
     * ReactiveRedisTemplate for String keys and String values.
     * Used for general caching, JWT blacklisting, etc.
     */
    @Bean
    public ReactiveStringRedisTemplate reactiveStringRedisTemplate(
            ReactiveRedisConnectionFactory connectionFactory) {
        return new ReactiveStringRedisTemplate(connectionFactory);
    }

    /**
     * ReactiveRedisTemplate for String keys and Integer values.
     * Used specifically for inventory quantity caching.
     */
    @Bean
    public ReactiveRedisTemplate<String, Integer> reactiveRedisTemplateInteger(
            ReactiveRedisConnectionFactory connectionFactory) {

        RedisSerializer<String> keySerializer = new StringRedisSerializer();
        Jackson2JsonRedisSerializer<Integer> valueSerializer =
            new Jackson2JsonRedisSerializer<>(Integer.class);

        RedisSerializationContext<String, Integer> context =
            RedisSerializationContext.<String, Integer>newSerializationContext()
                .key(keySerializer)
                .value(valueSerializer)
                .hashKey(keySerializer)
                .hashValue(valueSerializer)
                .build();

        return new ReactiveRedisTemplate<>(connectionFactory, context);
    }

    /**
     * ReactiveRedisTemplate for String keys and Object values.
     * Used for complex object caching.
     */
    @Bean
    public ReactiveRedisTemplate<String, Object> reactiveRedisTemplateObject(
            ReactiveRedisConnectionFactory connectionFactory) {

        RedisSerializer<String> keySerializer = new StringRedisSerializer();
        GenericJackson2JsonRedisSerializer valueSerializer =
            new GenericJackson2JsonRedisSerializer();

        RedisSerializationContext<String, Object> context =
            RedisSerializationContext.<String, Object>newSerializationContext()
                .key(keySerializer)
                .value(valueSerializer)
                .hashKey(keySerializer)
                .hashValue(valueSerializer)
                .build();

        return new ReactiveRedisTemplate<>(connectionFactory, context);
    }

    /**
     * ReactiveRedisTemplate for String keys and Cart values.
     * Used specifically for shopping cart storage.
     */
    @Bean
    public ReactiveRedisTemplate<String, Cart> reactiveRedisTemplateCart(
            ReactiveRedisConnectionFactory connectionFactory) {

        RedisSerializer<String> keySerializer = new StringRedisSerializer();
        Jackson2JsonRedisSerializer<Cart> valueSerializer =
            new Jackson2JsonRedisSerializer<>(Cart.class);

        RedisSerializationContext<String, Cart> context =
            RedisSerializationContext.<String, Cart>newSerializationContext()
                .key(keySerializer)
                .value(valueSerializer)
                .hashKey(keySerializer)
                .hashValue(valueSerializer)
                .build();

        return new ReactiveRedisTemplate<>(connectionFactory, context);
    }
}