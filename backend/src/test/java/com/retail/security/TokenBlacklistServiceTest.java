package com.retail.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import org.springframework.data.redis.core.ReactiveValueOperations;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.time.Duration;
import java.util.Date;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

/**
 * Unit tests for TokenBlacklistService.
 * Tests token blacklisting functionality with Redis.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class TokenBlacklistServiceTest {

    @Mock
    private ReactiveRedisTemplate<String, String> redisTemplate;

    @Mock
    private ReactiveValueOperations<String, String> valueOperations;

    @Mock
    private JwtService jwtService;

    private TokenBlacklistService tokenBlacklistService;

    @BeforeEach
    void setUp() {
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(redisTemplate.hasKey(anyString())).thenReturn(Mono.just(false));
        tokenBlacklistService = new TokenBlacklistService(redisTemplate, jwtService);
    }

    @Test
    void blacklistToken_validToken_shouldStoreInRedis() {
        // Arrange
        String token = "valid.jwt.token";
        Date futureExpiration = new Date(System.currentTimeMillis() + 3600000); // 1 hour from now

        when(jwtService.extractExpiration(token)).thenReturn(futureExpiration);
        when(valueOperations.set(anyString(), eq("blacklisted"), any(Duration.class)))
            .thenReturn(Mono.just(true));

        // Act & Assert
        StepVerifier.create(tokenBlacklistService.blacklistToken(token))
            .expectNext(true)
            .verifyComplete();
    }

    @Test
    void blacklistToken_expiredToken_shouldReturnTrueWithoutStoring() {
        // Arrange
        String token = "expired.jwt.token";
        Date pastExpiration = new Date(System.currentTimeMillis() - 3600000); // 1 hour ago

        when(jwtService.extractExpiration(token)).thenReturn(pastExpiration);

        // Act & Assert
        StepVerifier.create(tokenBlacklistService.blacklistToken(token))
            .expectNext(true)
            .verifyComplete();
    }

    @Test
    void blacklistToken_invalidToken_shouldReturnTrue() {
        // Arrange
        String token = "invalid.token";

        when(jwtService.extractExpiration(token)).thenThrow(new RuntimeException("Invalid token"));

        // Act & Assert
        StepVerifier.create(tokenBlacklistService.blacklistToken(token))
            .expectNext(true)
            .verifyComplete();
    }

    @Test
    void blacklistToken_redisFailure_shouldReturnFalse() {
        // Arrange
        String token = "valid.jwt.token";
        Date futureExpiration = new Date(System.currentTimeMillis() + 3600000);

        when(jwtService.extractExpiration(token)).thenReturn(futureExpiration);
        when(valueOperations.set(anyString(), eq("blacklisted"), any(Duration.class)))
            .thenReturn(Mono.just(false));

        // Act & Assert
        StepVerifier.create(tokenBlacklistService.blacklistToken(token))
            .expectNext(false)
            .verifyComplete();
    }

    @Test
    void blacklistToken_redisError_shouldReturnFalse() {
        // Arrange
        String token = "valid.jwt.token";
        Date futureExpiration = new Date(System.currentTimeMillis() + 3600000);

        when(jwtService.extractExpiration(token)).thenReturn(futureExpiration);
        when(valueOperations.set(anyString(), eq("blacklisted"), any(Duration.class)))
            .thenReturn(Mono.empty());

        // Act & Assert
        StepVerifier.create(tokenBlacklistService.blacklistToken(token))
            .expectNext(false)
            .verifyComplete();
    }

    @Test
    void isBlacklisted_blacklistedToken_shouldReturnTrue() {
        // Arrange
        String token = "blacklisted.jwt.token";
        String key = "blacklist:token:" + token;

        when(redisTemplate.hasKey(key)).thenReturn(Mono.just(true));

        // Act & Assert
        StepVerifier.create(tokenBlacklistService.isBlacklisted(token))
            .expectNext(true)
            .verifyComplete();
    }

    @Test
    void isBlacklisted_nonBlacklistedToken_shouldReturnFalse() {
        // Arrange
        String token = "valid.jwt.token";
        String key = "blacklist:token:" + token;

        when(redisTemplate.hasKey(key)).thenReturn(Mono.just(false));

        // Act & Assert
        StepVerifier.create(tokenBlacklistService.isBlacklisted(token))
            .expectNext(false)
            .verifyComplete();
    }

    @Test
    void isBlacklisted_redisError_shouldReturnFalse() {
        // Arrange
        String token = "valid.jwt.token";
        String key = "blacklist:token:" + token;

        when(redisTemplate.hasKey(key)).thenReturn(Mono.empty());

        // Act & Assert
        StepVerifier.create(tokenBlacklistService.isBlacklisted(token))
            .expectNext(false)
            .verifyComplete();
    }

    @Test
    void blacklistToken_tokenExpiringInOneHour_shouldSetCorrectTTL() {
        // Arrange
        String token = "valid.jwt.token";
        long oneHourInMillis = 3600000;
        Date futureExpiration = new Date(System.currentTimeMillis() + oneHourInMillis);

        when(jwtService.extractExpiration(token)).thenReturn(futureExpiration);
        when(valueOperations.set(eq("blacklist:token:" + token), eq("blacklisted"), argThat(duration -> {
            // TTL should be approximately 1 hour (3600 seconds), allow 5 second tolerance
            long seconds = duration.getSeconds();
            return seconds >= 3595 && seconds <= 3600;
        }))).thenReturn(Mono.just(true));

        // Act & Assert
        StepVerifier.create(tokenBlacklistService.blacklistToken(token))
            .expectNext(true)
            .verifyComplete();
    }

    @Test
    void blacklistToken_tokenExpiringInOneMinute_shouldSetCorrectTTL() {
        // Arrange
        String token = "valid.jwt.token";
        long oneMinuteInMillis = 60000;
        Date futureExpiration = new Date(System.currentTimeMillis() + oneMinuteInMillis);

        when(jwtService.extractExpiration(token)).thenReturn(futureExpiration);
        when(valueOperations.set(eq("blacklist:token:" + token), eq("blacklisted"), argThat(duration -> {
            // TTL should be approximately 1 minute (60 seconds), allow 2 second tolerance
            long seconds = duration.getSeconds();
            return seconds >= 58 && seconds <= 60;
        }))).thenReturn(Mono.just(true));

        // Act & Assert
        StepVerifier.create(tokenBlacklistService.blacklistToken(token))
            .expectNext(true)
            .verifyComplete();
    }
}
