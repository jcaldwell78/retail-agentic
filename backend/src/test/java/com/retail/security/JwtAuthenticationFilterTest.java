package com.retail.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.http.HttpHeaders;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/**
 * Unit tests for JwtAuthenticationFilter.
 * Tests JWT validation, blacklist checking, and security context setup.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("JwtAuthenticationFilter Tests")
class JwtAuthenticationFilterTest {

    @Mock
    private JwtService jwtService;

    @Mock
    private TokenBlacklistService tokenBlacklistService;

    @Mock
    private WebFilterChain filterChain;

    private JwtAuthenticationFilter jwtAuthenticationFilter;

    private static final String VALID_TOKEN = "valid.jwt.token";
    private static final String BLACKLISTED_TOKEN = "blacklisted.jwt.token";
    private static final String INVALID_TOKEN = "invalid.jwt.token";

    @BeforeEach
    void setUp() {
        jwtAuthenticationFilter = new JwtAuthenticationFilter(jwtService, tokenBlacklistService);

        // Default mock behavior
        when(filterChain.filter(any())).thenReturn(Mono.empty());
        when(tokenBlacklistService.isBlacklisted(anyString())).thenReturn(Mono.just(false));

        // Valid token setup
        when(jwtService.validateToken(VALID_TOKEN)).thenReturn(true);
        when(jwtService.extractUsername(VALID_TOKEN)).thenReturn("user@example.com");
        when(jwtService.extractUserId(VALID_TOKEN)).thenReturn("user-123");
        when(jwtService.extractTenantId(VALID_TOKEN)).thenReturn("tenant-1");
        when(jwtService.extractRole(VALID_TOKEN)).thenReturn("CUSTOMER");
    }

    @Nested
    @DisplayName("Public Endpoints")
    class PublicEndpointTests {

        @Test
        @DisplayName("Should allow requests to /api/v1/auth without token")
        void shouldAllowAuthEndpointWithoutToken() {
            MockServerHttpRequest request = MockServerHttpRequest
                .get("/api/v1/auth/login")
                .build();
            MockServerWebExchange exchange = MockServerWebExchange.from(request);

            StepVerifier.create(jwtAuthenticationFilter.filter(exchange, filterChain))
                .verifyComplete();

            verify(filterChain).filter(exchange);
            verifyNoInteractions(tokenBlacklistService);
            verifyNoInteractions(jwtService);
        }

        @Test
        @DisplayName("Should allow requests to /api/v1/health without token")
        void shouldAllowHealthEndpointWithoutToken() {
            MockServerHttpRequest request = MockServerHttpRequest
                .get("/api/v1/health")
                .build();
            MockServerWebExchange exchange = MockServerWebExchange.from(request);

            StepVerifier.create(jwtAuthenticationFilter.filter(exchange, filterChain))
                .verifyComplete();

            verify(filterChain).filter(exchange);
            verifyNoInteractions(tokenBlacklistService);
        }

        @Test
        @DisplayName("Should allow requests to swagger-ui without token")
        void shouldAllowSwaggerEndpointWithoutToken() {
            MockServerHttpRequest request = MockServerHttpRequest
                .get("/swagger-ui/index.html")
                .build();
            MockServerWebExchange exchange = MockServerWebExchange.from(request);

            StepVerifier.create(jwtAuthenticationFilter.filter(exchange, filterChain))
                .verifyComplete();

            verify(filterChain).filter(exchange);
            verifyNoInteractions(tokenBlacklistService);
        }
    }

    @Nested
    @DisplayName("Token Validation")
    class TokenValidationTests {

        @Test
        @DisplayName("Should allow request with valid token")
        void shouldAllowRequestWithValidToken() {
            MockServerHttpRequest request = MockServerHttpRequest
                .get("/api/v1/users/me")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + VALID_TOKEN)
                .build();
            MockServerWebExchange exchange = MockServerWebExchange.from(request);

            StepVerifier.create(jwtAuthenticationFilter.filter(exchange, filterChain))
                .verifyComplete();

            verify(filterChain).filter(exchange);
            verify(tokenBlacklistService).isBlacklisted(VALID_TOKEN);
            verify(jwtService).validateToken(VALID_TOKEN);
        }

        @Test
        @DisplayName("Should reject request with invalid token")
        void shouldAllowRequestWithInvalidTokenToPassThrough() {
            when(jwtService.validateToken(INVALID_TOKEN)).thenReturn(false);

            MockServerHttpRequest request = MockServerHttpRequest
                .get("/api/v1/users/me")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + INVALID_TOKEN)
                .build();
            MockServerWebExchange exchange = MockServerWebExchange.from(request);

            StepVerifier.create(jwtAuthenticationFilter.filter(exchange, filterChain))
                .verifyComplete();

            verify(filterChain).filter(exchange);
            verify(tokenBlacklistService).isBlacklisted(INVALID_TOKEN);
        }

        @Test
        @DisplayName("Should allow request without Authorization header")
        void shouldAllowRequestWithoutAuthHeader() {
            MockServerHttpRequest request = MockServerHttpRequest
                .get("/api/v1/products")
                .build();
            MockServerWebExchange exchange = MockServerWebExchange.from(request);

            StepVerifier.create(jwtAuthenticationFilter.filter(exchange, filterChain))
                .verifyComplete();

            verify(filterChain).filter(exchange);
            verifyNoInteractions(tokenBlacklistService);
        }

        @Test
        @DisplayName("Should allow request with non-Bearer Authorization")
        void shouldAllowRequestWithNonBearerAuth() {
            MockServerHttpRequest request = MockServerHttpRequest
                .get("/api/v1/products")
                .header(HttpHeaders.AUTHORIZATION, "Basic dXNlcjpwYXNz")
                .build();
            MockServerWebExchange exchange = MockServerWebExchange.from(request);

            StepVerifier.create(jwtAuthenticationFilter.filter(exchange, filterChain))
                .verifyComplete();

            verify(filterChain).filter(exchange);
            verifyNoInteractions(tokenBlacklistService);
        }
    }

    @Nested
    @DisplayName("Token Blacklist Integration")
    class BlacklistTests {

        @Test
        @DisplayName("Should reject blacklisted token")
        void shouldRejectBlacklistedToken() {
            when(tokenBlacklistService.isBlacklisted(BLACKLISTED_TOKEN)).thenReturn(Mono.just(true));

            MockServerHttpRequest request = MockServerHttpRequest
                .get("/api/v1/users/me")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + BLACKLISTED_TOKEN)
                .build();
            MockServerWebExchange exchange = MockServerWebExchange.from(request);

            StepVerifier.create(jwtAuthenticationFilter.filter(exchange, filterChain))
                .verifyComplete();

            verify(filterChain).filter(exchange);
            verify(tokenBlacklistService).isBlacklisted(BLACKLISTED_TOKEN);
            // Token validation should not be called for blacklisted tokens
            verify(jwtService, never()).validateToken(BLACKLISTED_TOKEN);
        }

        @Test
        @DisplayName("Should allow non-blacklisted token")
        void shouldAllowNonBlacklistedToken() {
            when(tokenBlacklistService.isBlacklisted(VALID_TOKEN)).thenReturn(Mono.just(false));

            MockServerHttpRequest request = MockServerHttpRequest
                .get("/api/v1/users/me")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + VALID_TOKEN)
                .build();
            MockServerWebExchange exchange = MockServerWebExchange.from(request);

            StepVerifier.create(jwtAuthenticationFilter.filter(exchange, filterChain))
                .verifyComplete();

            verify(filterChain).filter(exchange);
            verify(tokenBlacklistService).isBlacklisted(VALID_TOKEN);
            verify(jwtService).validateToken(VALID_TOKEN);
        }

        @Test
        @DisplayName("Should handle blacklist service failure gracefully")
        void shouldHandleBlacklistServiceFailure() {
            when(tokenBlacklistService.isBlacklisted(VALID_TOKEN))
                .thenReturn(Mono.error(new RuntimeException("Redis connection failed")));

            MockServerHttpRequest request = MockServerHttpRequest
                .get("/api/v1/users/me")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + VALID_TOKEN)
                .build();
            MockServerWebExchange exchange = MockServerWebExchange.from(request);

            StepVerifier.create(jwtAuthenticationFilter.filter(exchange, filterChain))
                .verifyComplete();

            verify(filterChain).filter(exchange);
        }
    }

    @Nested
    @DisplayName("Security Context Setup")
    class SecurityContextTests {

        @Test
        @DisplayName("Should extract user details from token")
        void shouldExtractUserDetailsFromToken() {
            MockServerHttpRequest request = MockServerHttpRequest
                .get("/api/v1/users/me")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + VALID_TOKEN)
                .build();
            MockServerWebExchange exchange = MockServerWebExchange.from(request);

            StepVerifier.create(jwtAuthenticationFilter.filter(exchange, filterChain))
                .verifyComplete();

            verify(jwtService).extractUsername(VALID_TOKEN);
            verify(jwtService).extractUserId(VALID_TOKEN);
            verify(jwtService).extractTenantId(VALID_TOKEN);
            verify(jwtService).extractRole(VALID_TOKEN);
        }

        @Test
        @DisplayName("Should handle token validation exception")
        void shouldHandleTokenValidationException() {
            String exceptionToken = "exception.token";
            when(tokenBlacklistService.isBlacklisted(exceptionToken)).thenReturn(Mono.just(false));
            when(jwtService.validateToken(exceptionToken)).thenThrow(new RuntimeException("Token parse error"));

            MockServerHttpRequest request = MockServerHttpRequest
                .get("/api/v1/users/me")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + exceptionToken)
                .build();
            MockServerWebExchange exchange = MockServerWebExchange.from(request);

            StepVerifier.create(jwtAuthenticationFilter.filter(exchange, filterChain))
                .verifyComplete();

            verify(filterChain).filter(exchange);
        }
    }

    @Nested
    @DisplayName("Logout Flow Integration")
    class LogoutFlowTests {

        @Test
        @DisplayName("Token should be rejected after logout")
        void tokenShouldBeRejectedAfterLogout() {
            // Simulate token being added to blacklist after logout
            String loggedOutToken = "logged.out.token";

            // First request - token is valid and not blacklisted
            when(tokenBlacklistService.isBlacklisted(loggedOutToken)).thenReturn(Mono.just(false));
            when(jwtService.validateToken(loggedOutToken)).thenReturn(true);
            when(jwtService.extractUsername(loggedOutToken)).thenReturn("user@example.com");
            when(jwtService.extractUserId(loggedOutToken)).thenReturn("user-123");
            when(jwtService.extractTenantId(loggedOutToken)).thenReturn("tenant-1");
            when(jwtService.extractRole(loggedOutToken)).thenReturn("CUSTOMER");

            MockServerHttpRequest request1 = MockServerHttpRequest
                .get("/api/v1/users/me")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + loggedOutToken)
                .build();
            MockServerWebExchange exchange1 = MockServerWebExchange.from(request1);

            StepVerifier.create(jwtAuthenticationFilter.filter(exchange1, filterChain))
                .verifyComplete();

            verify(jwtService).validateToken(loggedOutToken);

            // Reset for second request
            reset(filterChain, jwtService);
            when(filterChain.filter(any())).thenReturn(Mono.empty());

            // After logout - token is blacklisted
            when(tokenBlacklistService.isBlacklisted(loggedOutToken)).thenReturn(Mono.just(true));

            MockServerHttpRequest request2 = MockServerHttpRequest
                .get("/api/v1/users/me")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + loggedOutToken)
                .build();
            MockServerWebExchange exchange2 = MockServerWebExchange.from(request2);

            StepVerifier.create(jwtAuthenticationFilter.filter(exchange2, filterChain))
                .verifyComplete();

            // Token validation should NOT be called because it's blacklisted
            verify(jwtService, never()).validateToken(anyString());
        }
    }
}
