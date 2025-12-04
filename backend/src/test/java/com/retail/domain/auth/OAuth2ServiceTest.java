package com.retail.domain.auth;

import com.retail.domain.user.User;
import com.retail.domain.user.UserRole;
import com.retail.domain.user.UserService;
import com.retail.security.JwtService;
import com.retail.security.tenant.TenantContext;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.HashMap;
import java.util.Map;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class OAuth2ServiceTest {

    @Mock
    private UserService userService;

    @Mock
    private JwtService jwtService;

    @Mock
    private WebClient webClient;

    @Mock
    private WebClient.RequestHeadersUriSpec requestHeadersUriSpec;

    @Mock
    private WebClient.RequestHeadersSpec requestHeadersSpec;

    @Mock
    private WebClient.ResponseSpec responseSpec;

    private OAuth2Service oauth2Service;

    @BeforeEach
    void setUp() {
        // Mock the WebClient chain
        when(webClient.get()).thenReturn(requestHeadersUriSpec);
        when(requestHeadersUriSpec.uri(anyString())).thenReturn(requestHeadersSpec);
        when(requestHeadersSpec.header(anyString(), anyString())).thenReturn(requestHeadersSpec);
        when(requestHeadersSpec.retrieve()).thenReturn(responseSpec);

        // Create a WebClient.Builder that returns our mocked WebClient
        WebClient.Builder webClientBuilder = mock(WebClient.Builder.class);
        when(webClientBuilder.build()).thenReturn(webClient);

        oauth2Service = new OAuth2Service(userService, jwtService, webClientBuilder);
    }

    @Test
    void authenticateWithGoogle_newUser_shouldCreateUserAndReturnToken() {
        // Mock Google userinfo response
        Map<String, Object> googleResponse = new HashMap<>();
        googleResponse.put("sub", "google-123");
        googleResponse.put("email", "test@example.com");
        googleResponse.put("given_name", "John");
        googleResponse.put("family_name", "Doe");
        googleResponse.put("name", "John Doe");
        googleResponse.put("picture", "https://example.com/photo.jpg");

        when(responseSpec.bodyToMono(Map.class))
            .thenReturn(Mono.just(googleResponse));

        User createdUser = createMockUser("test@example.com", "John", "Doe");
        createdUser.setOauth2Provider("GOOGLE");
        createdUser.setOauth2ProviderId("google-123");

        when(userService.findByEmail("test@example.com"))
            .thenReturn(Mono.empty());

        when(userService.register(any(User.class), eq("")))
            .thenReturn(Mono.just(createdUser));

        when(userService.updateProfile(anyString(), any(User.class)))
            .thenReturn(Mono.just(createdUser));

        when(jwtService.generateToken(anyString(), anyString(), anyString(), anyString()))
            .thenReturn("mock-jwt-token");

        OAuth2LoginRequest request = new OAuth2LoginRequest("GOOGLE", "mock-access-token");

        StepVerifier.create(
            oauth2Service.authenticateWithOAuth2(request)
                .contextWrite(TenantContext.withTenantId("test-tenant"))
        )
            .expectNext("mock-jwt-token")
            .verifyComplete();

        verify(userService).findByEmail("test@example.com");
        verify(userService).register(argThat(user ->
            user.getEmail().equals("test@example.com") &&
            user.getFirstName().equals("John") &&
            user.getLastName().equals("Doe") &&
            user.getOauth2Provider().equals("GOOGLE") &&
            user.getOauth2ProviderId().equals("google-123")
        ), eq(""));
    }

    @Test
    void authenticateWithGoogle_existingUser_shouldUpdateAndReturnToken() {
        Map<String, Object> googleResponse = new HashMap<>();
        googleResponse.put("sub", "google-123");
        googleResponse.put("email", "existing@example.com");
        googleResponse.put("given_name", "Jane");
        googleResponse.put("family_name", "Smith");
        googleResponse.put("name", "Jane Smith");

        when(responseSpec.bodyToMono(Map.class))
            .thenReturn(Mono.just(googleResponse));

        User existingUser = createMockUser("existing@example.com", "Jane", "Smith");

        when(userService.findByEmail("existing@example.com"))
            .thenReturn(Mono.just(existingUser));

        when(userService.updateProfile(anyString(), any(User.class)))
            .thenReturn(Mono.just(existingUser));

        when(jwtService.generateToken(anyString(), anyString(), anyString(), anyString()))
            .thenReturn("mock-jwt-token");

        OAuth2LoginRequest request = new OAuth2LoginRequest("GOOGLE", "mock-access-token");

        StepVerifier.create(
            oauth2Service.authenticateWithOAuth2(request)
                .contextWrite(TenantContext.withTenantId("test-tenant"))
        )
            .expectNext("mock-jwt-token")
            .verifyComplete();

        verify(userService).findByEmail("existing@example.com");
        verify(userService, times(2)).updateProfile(anyString(), any(User.class));
    }

    @Test
    void authenticateWithFacebook_newUser_shouldCreateUserAndReturnToken() {
        Map<String, Object> pictureData = new HashMap<>();
        pictureData.put("url", "https://example.com/pic.jpg");

        Map<String, Object> picture = new HashMap<>();
        picture.put("data", pictureData);

        Map<String, Object> facebookResponse = new HashMap<>();
        facebookResponse.put("id", "facebook-456");
        facebookResponse.put("email", "fbuser@example.com");
        facebookResponse.put("name", "Bob Johnson");
        facebookResponse.put("picture", picture);

        when(responseSpec.bodyToMono(Map.class))
            .thenReturn(Mono.just(facebookResponse));

        User createdUser = createMockUser("fbuser@example.com", "Bob", "Johnson");
        createdUser.setOauth2Provider("FACEBOOK");
        createdUser.setOauth2ProviderId("facebook-456");

        when(userService.findByEmail("fbuser@example.com"))
            .thenReturn(Mono.empty());

        when(userService.register(any(User.class), eq("")))
            .thenReturn(Mono.just(createdUser));

        when(userService.updateProfile(anyString(), any(User.class)))
            .thenReturn(Mono.just(createdUser));

        when(jwtService.generateToken(anyString(), anyString(), anyString(), anyString()))
            .thenReturn("mock-jwt-token");

        OAuth2LoginRequest request = new OAuth2LoginRequest("FACEBOOK", "mock-access-token");

        StepVerifier.create(
            oauth2Service.authenticateWithOAuth2(request)
                .contextWrite(TenantContext.withTenantId("test-tenant"))
        )
            .expectNext("mock-jwt-token")
            .verifyComplete();

        verify(userService).register(argThat(user ->
            user.getEmail().equals("fbuser@example.com") &&
            user.getFirstName().equals("Bob") &&
            user.getLastName().equals("Johnson") &&
            user.getOauth2Provider().equals("FACEBOOK") &&
            user.getOauth2ProviderId().equals("facebook-456")
        ), eq(""));
    }

    @Test
    void authenticateWithOAuth2_invalidProvider_shouldFail() {
        OAuth2LoginRequest request = new OAuth2LoginRequest("INVALID_PROVIDER", "mock-token");

        StepVerifier.create(
            oauth2Service.authenticateWithOAuth2(request)
                .contextWrite(TenantContext.withTenantId("test-tenant"))
        )
            .expectErrorMatches(error ->
                error instanceof IllegalArgumentException &&
                error.getMessage().contains("Unsupported OAuth2 provider")
            )
            .verify();
    }

    @Test
    void authenticateWithOAuth2_providerReturnsError_shouldFail() {
        when(responseSpec.bodyToMono(Map.class))
            .thenReturn(Mono.error(new RuntimeException("401 Unauthorized")));

        OAuth2LoginRequest request = new OAuth2LoginRequest("GOOGLE", "invalid-token");

        StepVerifier.create(
            oauth2Service.authenticateWithOAuth2(request)
                .contextWrite(TenantContext.withTenantId("test-tenant"))
        )
            .expectError(OAuth2Exception.class)
            .verify();
    }

    @Test
    void authenticateWithOAuth2_noEmailProvided_shouldFail() {
        Map<String, Object> googleResponse = new HashMap<>();
        googleResponse.put("sub", "google-123");
        googleResponse.put("given_name", "John");
        googleResponse.put("family_name", "Doe");

        when(responseSpec.bodyToMono(Map.class))
            .thenReturn(Mono.just(googleResponse));

        OAuth2LoginRequest request = new OAuth2LoginRequest("GOOGLE", "mock-token");

        StepVerifier.create(
            oauth2Service.authenticateWithOAuth2(request)
                .contextWrite(TenantContext.withTenantId("test-tenant"))
        )
            .expectErrorMatches(error ->
                error instanceof OAuth2Exception &&
                error.getMessage().contains("Email not provided")
            )
            .verify();
    }

    @Test
    void verifyToken_validToken_shouldReturnTrue() {
        Map<String, Object> googleResponse = new HashMap<>();
        googleResponse.put("sub", "google-123");
        googleResponse.put("email", "test@example.com");

        when(responseSpec.bodyToMono(Map.class))
            .thenReturn(Mono.just(googleResponse));

        StepVerifier.create(oauth2Service.verifyToken(OAuth2Provider.GOOGLE, "valid-token"))
            .expectNext(true)
            .verifyComplete();
    }

    @Test
    void verifyToken_invalidToken_shouldReturnFalse() {
        when(responseSpec.bodyToMono(Map.class))
            .thenReturn(Mono.error(new RuntimeException("401 Unauthorized")));

        StepVerifier.create(oauth2Service.verifyToken(OAuth2Provider.GOOGLE, "invalid-token"))
            .expectNext(false)
            .verifyComplete();
    }

    private User createMockUser(String email, String firstName, String lastName) {
        User user = new User();
        user.setId("user-123");
        user.setTenantId("test-tenant");
        user.setEmail(email);
        user.setFirstName(firstName);
        user.setLastName(lastName);
        user.setRole(UserRole.CUSTOMER);
        return user;
    }
}
