package com.retail.api.ratelimit;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.data.redis.core.ReactiveStringRedisTemplate;
import org.springframework.data.redis.core.ReactiveValueOperations;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.net.InetSocketAddress;
import java.time.Duration;
import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for RateLimitFilter.
 * Tests rate limit headers, admin bypass, and request counting.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class RateLimitFilterTest {

    @Mock
    private ReactiveStringRedisTemplate redisTemplate;

    @Mock
    private ReactiveValueOperations<String, String> valueOps;

    @Mock
    private WebFilterChain filterChain;

    private RateLimitConfig config;
    private RateLimitFilter rateLimitFilter;

    @BeforeEach
    void setUp() {
        config = new RateLimitConfig();
        config.setEnabled(true);
        config.setDefaultLimit(100);

        when(redisTemplate.opsForValue()).thenReturn(valueOps);
        when(filterChain.filter(any(ServerWebExchange.class))).thenReturn(Mono.empty());

        rateLimitFilter = new RateLimitFilter(redisTemplate, config);
    }

    @Test
    void filter_whenRateLimitingDisabled_shouldBypass() {
        // Given
        config.setEnabled(false);
        ServerWebExchange exchange = createExchange("192.168.1.1");

        // When
        Mono<Void> result = rateLimitFilter.filter(exchange, filterChain);

        // Then
        StepVerifier.create(result)
                .verifyComplete();

        verify(filterChain).filter(exchange);
        verify(redisTemplate, never()).opsForValue();
    }

    @Test
    void filter_whenAdminUser_shouldBypassRateLimit() {
        // Given
        ServerWebExchange exchange = createExchangeWithAdmin("192.168.1.1");

        // When
        Mono<Void> result = rateLimitFilter.filter(exchange, filterChain);

        // Then
        StepVerifier.create(result)
                .verifyComplete();

        verify(filterChain).filter(exchange);
        verify(redisTemplate, never()).opsForValue();
    }

    @Test
    void filter_whenFirstRequest_shouldAddRateLimitHeaders() {
        // Given
        ServerWebExchange exchange = createExchange("192.168.1.1");
        when(valueOps.increment(anyString())).thenReturn(Mono.just(1L));
        when(valueOps.get(anyString())).thenReturn(Mono.just("1"));
        when(redisTemplate.expire(anyString(), any(Duration.class))).thenReturn(Mono.just(true));

        // When
        Mono<Void> result = rateLimitFilter.filter(exchange, filterChain);

        // Then
        StepVerifier.create(result)
                .verifyComplete();

        assertThat(exchange.getResponse().getHeaders().getFirst("X-RateLimit-Limit"))
                .isEqualTo("100");
        assertThat(exchange.getResponse().getHeaders().getFirst("X-RateLimit-Remaining"))
                .isEqualTo("99");
        assertThat(exchange.getResponse().getHeaders().getFirst("X-RateLimit-Reset"))
                .isNotNull();

        verify(filterChain).filter(exchange);
    }

    @Test
    void filter_whenWithinLimit_shouldAllowRequest() {
        // Given
        ServerWebExchange exchange = createExchange("192.168.1.1");
        when(valueOps.increment(anyString())).thenReturn(Mono.just(50L));
        when(valueOps.get(anyString())).thenReturn(Mono.just("50"));

        // When
        Mono<Void> result = rateLimitFilter.filter(exchange, filterChain);

        // Then
        StepVerifier.create(result)
                .verifyComplete();

        assertThat(exchange.getResponse().getHeaders().getFirst("X-RateLimit-Limit"))
                .isEqualTo("100");
        assertThat(exchange.getResponse().getHeaders().getFirst("X-RateLimit-Remaining"))
                .isEqualTo("50");
        assertThat(exchange.getResponse().getStatusCode()).isNull();

        verify(filterChain).filter(exchange);
    }

    @Test
    void filter_whenExceedsLimit_shouldReturnTooManyRequests() {
        // Given
        ServerWebExchange exchange = createExchange("192.168.1.1");
        when(valueOps.increment(anyString())).thenReturn(Mono.just(101L));
        when(valueOps.get(anyString())).thenReturn(Mono.just("101"));

        // When
        Mono<Void> result = rateLimitFilter.filter(exchange, filterChain);

        // Then
        StepVerifier.create(result)
                .verifyComplete();

        assertThat(exchange.getResponse().getStatusCode())
                .isEqualTo(HttpStatus.TOO_MANY_REQUESTS);
        assertThat(exchange.getResponse().getHeaders().getFirst("X-RateLimit-Limit"))
                .isEqualTo("100");
        assertThat(exchange.getResponse().getHeaders().getFirst("X-RateLimit-Remaining"))
                .isEqualTo("0");
        assertThat(exchange.getResponse().getHeaders().getFirst("X-RateLimit-Reset"))
                .isNotNull();
        assertThat(exchange.getResponse().getHeaders().getFirst("Retry-After"))
                .isEqualTo("60");

        verify(filterChain, never()).filter(exchange);
    }

    @Test
    void filter_whenAtExactLimit_shouldAllowRequest() {
        // Given
        ServerWebExchange exchange = createExchange("192.168.1.1");
        when(valueOps.increment(anyString())).thenReturn(Mono.just(100L));
        when(valueOps.get(anyString())).thenReturn(Mono.just("100"));

        // When
        Mono<Void> result = rateLimitFilter.filter(exchange, filterChain);

        // Then
        StepVerifier.create(result)
                .verifyComplete();

        assertThat(exchange.getResponse().getHeaders().getFirst("X-RateLimit-Limit"))
                .isEqualTo("100");
        assertThat(exchange.getResponse().getHeaders().getFirst("X-RateLimit-Remaining"))
                .isEqualTo("0");
        assertThat(exchange.getResponse().getStatusCode()).isNull();

        verify(filterChain).filter(exchange);
    }

    @Test
    void filter_whenRedisError_shouldAllowRequest() {
        // Given
        ServerWebExchange exchange = createExchange("192.168.1.1");
        when(valueOps.increment(anyString())).thenReturn(Mono.error(new RuntimeException("Redis error")));
        when(valueOps.get(anyString())).thenReturn(Mono.error(new RuntimeException("Redis error")));

        // When
        Mono<Void> result = rateLimitFilter.filter(exchange, filterChain);

        // Then
        StepVerifier.create(result)
                .verifyComplete();

        verify(filterChain).filter(exchange);
    }

    @Test
    void filter_withXForwardedFor_shouldUseForwardedIp() {
        // Given
        MockServerHttpRequest request = MockServerHttpRequest
                .get("/api/v1/products")
                .remoteAddress(new InetSocketAddress("10.0.0.1", 8080))
                .header("X-Forwarded-For", "203.0.113.1, 198.51.100.1")
                .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);

        when(valueOps.increment(contains("203.0.113.1"))).thenReturn(Mono.just(1L));
        when(valueOps.get(contains("203.0.113.1"))).thenReturn(Mono.just("1"));
        when(redisTemplate.expire(anyString(), any(Duration.class))).thenReturn(Mono.just(true));

        // When
        Mono<Void> result = rateLimitFilter.filter(exchange, filterChain);

        // Then
        StepVerifier.create(result)
                .verifyComplete();

        verify(valueOps).increment(contains("203.0.113.1"));
    }

    @Test
    void filter_withPathSpecificLimit_shouldUseCustomLimit() {
        // Given
        ServerWebExchange exchange = createExchangeWithPath("192.168.1.1", "/api/v1/auth/login");
        when(valueOps.increment(anyString())).thenReturn(Mono.just(1L));
        when(valueOps.get(anyString())).thenReturn(Mono.just("1"));
        when(redisTemplate.expire(anyString(), any(Duration.class))).thenReturn(Mono.just(true));

        // When
        Mono<Void> result = rateLimitFilter.filter(exchange, filterChain);

        // Then
        StepVerifier.create(result)
                .verifyComplete();

        // Login endpoint has limit of 10
        assertThat(exchange.getResponse().getHeaders().getFirst("X-RateLimit-Limit"))
                .isEqualTo("10");
        assertThat(exchange.getResponse().getHeaders().getFirst("X-RateLimit-Remaining"))
                .isEqualTo("9");
    }

    @Test
    void filter_whenExceedsCustomLimit_shouldReturn429() {
        // Given
        ServerWebExchange exchange = createExchangeWithPath("192.168.1.1", "/api/v1/auth/register");
        when(valueOps.increment(anyString())).thenReturn(Mono.just(6L));
        when(valueOps.get(anyString())).thenReturn(Mono.just("6"));

        // When
        Mono<Void> result = rateLimitFilter.filter(exchange, filterChain);

        // Then
        StepVerifier.create(result)
                .verifyComplete();

        assertThat(exchange.getResponse().getStatusCode())
                .isEqualTo(HttpStatus.TOO_MANY_REQUESTS);
        // Register endpoint has limit of 5
        assertThat(exchange.getResponse().getHeaders().getFirst("X-RateLimit-Limit"))
                .isEqualTo("5");
    }

    @Test
    void filter_resetTimestamp_shouldBeInFuture() {
        // Given
        ServerWebExchange exchange = createExchange("192.168.1.1");
        when(valueOps.increment(anyString())).thenReturn(Mono.just(1L));
        when(valueOps.get(anyString())).thenReturn(Mono.just("1"));
        when(redisTemplate.expire(anyString(), any(Duration.class))).thenReturn(Mono.just(true));

        long beforeRequest = System.currentTimeMillis() / 1000;

        // When
        Mono<Void> result = rateLimitFilter.filter(exchange, filterChain);

        // Then
        StepVerifier.create(result)
                .verifyComplete();

        String resetHeader = exchange.getResponse().getHeaders().getFirst("X-RateLimit-Reset");
        assertThat(resetHeader).isNotNull();

        long resetTimestamp = Long.parseLong(resetHeader);
        long afterRequest = System.currentTimeMillis() / 1000;

        // Reset should be approximately 60 seconds in the future (within 2 second margin)
        assertThat(resetTimestamp).isBetween(beforeRequest + 58, afterRequest + 62);
    }

    // Helper methods

    private ServerWebExchange createExchange(String ipAddress) {
        return createExchangeWithPath(ipAddress, "/api/v1/products");
    }

    private ServerWebExchange createExchangeWithPath(String ipAddress, String path) {
        MockServerHttpRequest request = MockServerHttpRequest
                .get(path)
                .remoteAddress(new InetSocketAddress(ipAddress, 8080))
                .build();
        return MockServerWebExchange.from(request);
    }

    private ServerWebExchange createExchangeWithAdmin(String ipAddress) {
        MockServerHttpRequest request = MockServerHttpRequest
                .get("/api/v1/products")
                .remoteAddress(new InetSocketAddress(ipAddress, 8080))
                .build();

        // Create admin authentication
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                "admin",
                null,
                List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))
        );

        return MockServerWebExchange.from(request)
                .mutate()
                .principal(Mono.just(auth))
                .build();
    }
}
