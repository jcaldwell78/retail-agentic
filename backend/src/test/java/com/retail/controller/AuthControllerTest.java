package com.retail.controller;

import com.retail.domain.auth.OAuth2LoginRequest;
import com.retail.domain.auth.OAuth2Service;
import com.retail.domain.user.User;
import com.retail.domain.user.UserRole;
import com.retail.domain.user.UserService;
import com.retail.domain.user.UserStatus;
import com.retail.security.JwtService;
import com.retail.security.TokenBlacklistService;
import com.retail.security.tenant.TenantContext;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.security.crypto.password.PasswordEncoder;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    @Mock
    private UserService userService;

    @Mock
    private JwtService jwtService;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private OAuth2Service oauth2Service;

    @Mock
    private TokenBlacklistService tokenBlacklistService;

    private AuthController authController;

    @BeforeEach
    void setUp() {
        authController = new AuthController(userService, jwtService, passwordEncoder, oauth2Service, tokenBlacklistService);
        // Tenant context will be set via .contextWrite() in tests
    }

    @Test
    void login_validCredentials_shouldReturnToken() {
        // Arrange
        AuthController.LoginRequest request = new AuthController.LoginRequest();
        request.setEmail("test@example.com");
        request.setPassword("password123");

        User user = createMockUser("test@example.com", "John", "Doe");
        user.setPasswordHash("hashed-password");

        when(userService.findByEmail("test@example.com"))
            .thenReturn(Mono.just(user));

        when(passwordEncoder.matches("password123", "hashed-password"))
            .thenReturn(true);

        when(userService.updateProfile(anyString(), any(User.class)))
            .thenReturn(Mono.just(user));

        when(jwtService.generateToken(anyString(), anyString(), anyString(), anyString()))
            .thenReturn("mock-jwt-token");

        // Act & Assert
        StepVerifier.create(authController.login(request)
                .contextWrite(TenantContext.withTenantId("test-tenant")))
            .expectNextMatches(response ->
                response.getStatusCode() == HttpStatus.OK &&
                response.getBody() != null &&
                response.getBody().getToken().equals("mock-jwt-token") &&
                response.getBody().getUser() != null &&
                response.getBody().getUser().getEmail().equals("test@example.com")
            )
            .verifyComplete();

        verify(userService).findByEmail("test@example.com");
        verify(passwordEncoder).matches("password123", "hashed-password");
        verify(userService).updateProfile(anyString(), any(User.class));
    }

    @Test
    void login_invalidCredentials_shouldReturnUnauthorized() {
        // Arrange
        AuthController.LoginRequest request = new AuthController.LoginRequest();
        request.setEmail("test@example.com");
        request.setPassword("wrong-password");

        User user = createMockUser("test@example.com", "John", "Doe");
        user.setPasswordHash("hashed-password");

        when(userService.findByEmail("test@example.com"))
            .thenReturn(Mono.just(user));

        when(passwordEncoder.matches("wrong-password", "hashed-password"))
            .thenReturn(false);

        // Act & Assert
        StepVerifier.create(authController.login(request)
                .contextWrite(TenantContext.withTenantId("test-tenant")))
            .expectNextMatches(response ->
                response.getStatusCode() == HttpStatus.UNAUTHORIZED &&
                response.getBody() != null &&
                response.getBody().getError() != null
            )
            .verifyComplete();

        verify(userService).findByEmail("test@example.com");
        verify(passwordEncoder).matches("wrong-password", "hashed-password");
        verify(userService, never()).updateProfile(anyString(), any(User.class));
    }

    @Test
    void login_userNotFound_shouldReturnUnauthorized() {
        // Arrange
        AuthController.LoginRequest request = new AuthController.LoginRequest();
        request.setEmail("nonexistent@example.com");
        request.setPassword("password123");

        when(userService.findByEmail("nonexistent@example.com"))
            .thenReturn(Mono.empty());

        // Act & Assert
        StepVerifier.create(authController.login(request)
                .contextWrite(TenantContext.withTenantId("test-tenant")))
            .expectNextMatches(response ->
                response.getStatusCode() == HttpStatus.UNAUTHORIZED
            )
            .verifyComplete();

        verify(userService).findByEmail("nonexistent@example.com");
        verify(userService, never()).updateProfile(anyString(), any(User.class));
    }

    @Test
    void login_oauth2User_shouldReturnUnauthorized() {
        // Arrange
        AuthController.LoginRequest request = new AuthController.LoginRequest();
        request.setEmail("oauth@example.com");
        request.setPassword("password123");

        User user = createMockUser("oauth@example.com", "Jane", "Smith");
        user.setOauth2Provider("GOOGLE");
        user.setOauth2ProviderId("google-123");

        when(userService.findByEmail("oauth@example.com"))
            .thenReturn(Mono.just(user));

        // Act & Assert
        StepVerifier.create(authController.login(request)
                .contextWrite(TenantContext.withTenantId("test-tenant")))
            .expectNextMatches(response ->
                response.getStatusCode() == HttpStatus.UNAUTHORIZED
            )
            .verifyComplete();

        verify(userService).findByEmail("oauth@example.com");
        verify(passwordEncoder, never()).matches(anyString(), anyString());
    }

    @Test
    void oauth2Login_validToken_shouldReturnJwt() {
        // Arrange
        OAuth2LoginRequest request = new OAuth2LoginRequest("GOOGLE", "valid-access-token");

        when(oauth2Service.authenticateWithOAuth2(request))
            .thenReturn(Mono.just("mock-jwt-token"));

        // Act & Assert
        StepVerifier.create(authController.oauth2Login(request)
                .contextWrite(TenantContext.withTenantId("test-tenant")))
            .expectNextMatches(response ->
                response.getStatusCode() == HttpStatus.OK &&
                response.getBody() != null &&
                response.getBody().get("token").equals("mock-jwt-token")
            )
            .verifyComplete();

        verify(oauth2Service).authenticateWithOAuth2(request);
    }

    @Test
    void oauth2Login_invalidToken_shouldReturnUnauthorized() {
        // Arrange
        OAuth2LoginRequest request = new OAuth2LoginRequest("GOOGLE", "invalid-token");

        when(oauth2Service.authenticateWithOAuth2(request))
            .thenReturn(Mono.error(new RuntimeException("Invalid token")));

        // Act & Assert
        StepVerifier.create(authController.oauth2Login(request)
                .contextWrite(TenantContext.withTenantId("test-tenant")))
            .expectNextMatches(response ->
                response.getStatusCode() == HttpStatus.UNAUTHORIZED &&
                response.getBody() != null &&
                response.getBody().containsKey("error")
            )
            .verifyComplete();

        verify(oauth2Service).authenticateWithOAuth2(request);
    }

    @Test
    void register_newUser_shouldCreateAndReturnToken() {
        // Arrange
        AuthController.RegisterRequest request = new AuthController.RegisterRequest();
        request.setEmail("newuser@example.com");
        request.setPassword("password123");
        request.setFirstName("Alice");
        request.setLastName("Wonder");
        request.setPhone("555-1234");

        when(userService.findByEmail("newuser@example.com"))
            .thenReturn(Mono.empty());

        User createdUser = createMockUser("newuser@example.com", "Alice", "Wonder");

        when(userService.register(any(User.class), eq("password123")))
            .thenReturn(Mono.just(createdUser));

        when(jwtService.generateToken(anyString(), anyString(), anyString(), anyString()))
            .thenReturn("mock-jwt-token");

        // Act & Assert
        StepVerifier.create(authController.register(request)
                .contextWrite(TenantContext.withTenantId("test-tenant")))
            .expectNextMatches(response ->
                response.getStatusCode() == HttpStatus.CREATED &&
                response.getBody() != null &&
                response.getBody().getToken().equals("mock-jwt-token") &&
                response.getBody().getUser().getEmail().equals("newuser@example.com")
            )
            .verifyComplete();

        verify(userService).findByEmail("newuser@example.com");
        verify(userService).register(argThat(user ->
            user.getEmail().equals("newuser@example.com") &&
            user.getFirstName().equals("Alice") &&
            user.getLastName().equals("Wonder") &&
            user.getPhone().equals("555-1234")
        ), eq("password123"));
    }

    @Test
    void register_existingUser_shouldReturnConflict() {
        // Arrange
        AuthController.RegisterRequest request = new AuthController.RegisterRequest();
        request.setEmail("existing@example.com");
        request.setPassword("password123");
        request.setFirstName("Bob");
        request.setLastName("Builder");

        User existingUser = createMockUser("existing@example.com", "Bob", "Builder");

        when(userService.findByEmail("existing@example.com"))
            .thenReturn(Mono.just(existingUser));

        // Act & Assert
        StepVerifier.create(authController.register(request)
                .contextWrite(TenantContext.withTenantId("test-tenant")))
            .expectNextMatches(response ->
                response.getStatusCode() == HttpStatus.CONFLICT &&
                response.getBody() != null &&
                response.getBody().getError() != null
            )
            .verifyComplete();

        verify(userService).findByEmail("existing@example.com");
        verify(userService, never()).register(any(User.class), anyString());
    }

    @Test
    void register_existingUserDifferentTenant_shouldCreateNewUser() {
        // Arrange
        AuthController.RegisterRequest request = new AuthController.RegisterRequest();
        request.setEmail("shared@example.com");
        request.setPassword("password123");
        request.setFirstName("Charlie");
        request.setLastName("Cross");

        User existingUser = createMockUser("shared@example.com", "Charlie", "Cross");
        existingUser.setTenantId("other-tenant"); // Different tenant

        when(userService.findByEmail("shared@example.com"))
            .thenReturn(Mono.just(existingUser));

        User newUser = createMockUser("shared@example.com", "Charlie", "Cross");

        when(userService.register(any(User.class), eq("password123")))
            .thenReturn(Mono.just(newUser));

        when(jwtService.generateToken(anyString(), anyString(), anyString(), anyString()))
            .thenReturn("mock-jwt-token");

        // Act & Assert
        StepVerifier.create(authController.register(request)
                .contextWrite(TenantContext.withTenantId("test-tenant")))
            .expectNextMatches(response ->
                response.getStatusCode() == HttpStatus.CREATED &&
                response.getBody() != null &&
                response.getBody().getToken().equals("mock-jwt-token")
            )
            .verifyComplete();

        verify(userService).findByEmail("shared@example.com");
        verify(userService).register(any(User.class), eq("password123"));
    }

    @Test
    void logout_withValidToken_shouldBlacklistToken() {
        // Arrange
        String token = "valid.jwt.token";
        ServerHttpRequest request = mock(ServerHttpRequest.class);
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + token);

        when(request.getHeaders()).thenReturn(headers);
        when(tokenBlacklistService.blacklistToken(token)).thenReturn(Mono.just(true));

        // Act & Assert
        StepVerifier.create(authController.logout(request))
            .expectNextMatches(response ->
                response.getStatusCode() == HttpStatus.OK &&
                response.getBody() != null &&
                response.getBody().get("message").equals("Logged out successfully")
            )
            .verifyComplete();

        verify(tokenBlacklistService).blacklistToken(token);
    }

    @Test
    void logout_withoutToken_shouldReturnSuccess() {
        // Arrange
        ServerHttpRequest request = mock(ServerHttpRequest.class);
        HttpHeaders headers = new HttpHeaders();

        when(request.getHeaders()).thenReturn(headers);

        // Act & Assert
        StepVerifier.create(authController.logout(request))
            .expectNextMatches(response ->
                response.getStatusCode() == HttpStatus.OK &&
                response.getBody() != null &&
                response.getBody().get("message").equals("Logged out successfully")
            )
            .verifyComplete();

        verify(tokenBlacklistService, never()).blacklistToken(anyString());
    }

    @Test
    void logout_blacklistFailure_shouldStillReturnSuccess() {
        // Arrange
        String token = "valid.jwt.token";
        ServerHttpRequest request = mock(ServerHttpRequest.class);
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + token);

        when(request.getHeaders()).thenReturn(headers);
        when(tokenBlacklistService.blacklistToken(token)).thenReturn(Mono.just(false));

        // Act & Assert
        StepVerifier.create(authController.logout(request))
            .expectNextMatches(response ->
                response.getStatusCode() == HttpStatus.OK &&
                response.getBody() != null &&
                response.getBody().get("message").equals("Logged out successfully")
            )
            .verifyComplete();

        verify(tokenBlacklistService).blacklistToken(token);
    }

    @Test
    void logout_blacklistError_shouldStillReturnSuccess() {
        // Arrange
        String token = "valid.jwt.token";
        ServerHttpRequest request = mock(ServerHttpRequest.class);
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + token);

        when(request.getHeaders()).thenReturn(headers);
        when(tokenBlacklistService.blacklistToken(token)).thenReturn(Mono.error(new RuntimeException("Redis error")));

        // Act & Assert
        StepVerifier.create(authController.logout(request))
            .expectNextMatches(response ->
                response.getStatusCode() == HttpStatus.OK &&
                response.getBody() != null &&
                response.getBody().get("message").equals("Logged out successfully")
            )
            .verifyComplete();

        verify(tokenBlacklistService).blacklistToken(token);
    }

    private User createMockUser(String email, String firstName, String lastName) {
        User user = new User();
        user.setId("user-123");
        user.setTenantId("test-tenant");
        user.setEmail(email);
        user.setFirstName(firstName);
        user.setLastName(lastName);
        user.setRole(UserRole.CUSTOMER);
        user.setStatus(UserStatus.ACTIVE);
        return user;
    }
}
