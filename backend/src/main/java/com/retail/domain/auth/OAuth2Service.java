package com.retail.domain.auth;

import com.retail.domain.user.User;
import com.retail.domain.user.UserRole;
import com.retail.domain.user.UserService;
import com.retail.domain.user.UserStatus;
import com.retail.security.JwtService;
import com.retail.security.tenant.TenantContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.Map;

/**
 * Service for OAuth2 authentication.
 * Handles Google and Facebook login flows.
 */
@Service
public class OAuth2Service {

    private static final Logger logger = LoggerFactory.getLogger(OAuth2Service.class);

    private static final String GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";
    private static final String FACEBOOK_USERINFO_URL = "https://graph.facebook.com/v18.0/me?fields=id,name,email,picture";

    private final UserService userService;
    private final JwtService jwtService;
    private final WebClient webClient;

    public OAuth2Service(UserService userService, JwtService jwtService, WebClient.Builder webClientBuilder) {
        this.userService = userService;
        this.jwtService = jwtService;
        this.webClient = webClientBuilder.build();
    }

    /**
     * Authenticate user with OAuth2 provider.
     *
     * @param request OAuth2 login request with provider and access token
     * @return JWT token for authenticated user
     */
    public Mono<String> authenticateWithOAuth2(OAuth2LoginRequest request) {
        return Mono.defer(() -> {
            try {
                OAuth2Provider provider = OAuth2Provider.fromString(request.getProvider());
                return TenantContext.getTenantId()
                    .flatMap(tenantId -> {
                        logger.info("OAuth2 authentication for provider: {} tenant: {}", provider, tenantId);

                        return fetchUserInfo(provider, request.getAccessToken())
                            .flatMap(userInfo -> findOrCreateUser(tenantId, provider, userInfo))
                            .flatMap(user -> {
                                user.recordLogin();
                                return userService.updateProfile(user.getId(), user)
                                    .map(updatedUser -> jwtService.generateToken(
                                        updatedUser.getId(),
                                        updatedUser.getEmail(),
                                        updatedUser.getRole().toString(),
                                        updatedUser.getTenantId()
                                    ));
                            })
                            .doOnSuccess(token -> logger.info("OAuth2 authentication successful for tenant: {}", tenantId))
                            .doOnError(error -> logger.error("OAuth2 authentication failed", error));
                    });
            } catch (IllegalArgumentException e) {
                return Mono.error(e);
            }
        });
    }

    /**
     * Fetch user information from OAuth2 provider.
     */
    private Mono<OAuth2UserInfo> fetchUserInfo(OAuth2Provider provider, String accessToken) {
        String url = switch (provider) {
            case GOOGLE -> GOOGLE_USERINFO_URL;
            case FACEBOOK -> FACEBOOK_USERINFO_URL;
        };

        return webClient.get()
            .uri(url)
            .header("Authorization", "Bearer " + accessToken)
            .retrieve()
            .bodyToMono(Map.class)
            .map(attributes -> parseUserInfo(provider, attributes))
            .doOnError(error ->
                logger.error("Failed to fetch user info from {}: {}", provider, error.getMessage())
            )
            .onErrorMap(error ->
                new OAuth2Exception("Failed to fetch user info from " + provider + ": " + error.getMessage())
            );
    }

    /**
     * Parse user info based on provider.
     */
    @SuppressWarnings("unchecked")
    private OAuth2UserInfo parseUserInfo(OAuth2Provider provider, Map<String, Object> attributes) {
        return switch (provider) {
            case GOOGLE -> OAuth2UserInfo.fromGoogle(attributes);
            case FACEBOOK -> OAuth2UserInfo.fromFacebook(attributes);
        };
    }

    /**
     * Find existing user or create new one.
     */
    private Mono<User> findOrCreateUser(String tenantId, OAuth2Provider provider, OAuth2UserInfo userInfo) {
        if (userInfo.getEmail() == null || userInfo.getEmail().isEmpty()) {
            return Mono.error(new OAuth2Exception("Email not provided by OAuth2 provider"));
        }

        return userService.findByEmail(userInfo.getEmail())
            .flatMap(existingUser -> {
                // User exists - update OAuth2 info if needed
                if (existingUser.getOauth2Provider() == null) {
                    existingUser.setOauth2Provider(provider.toString());
                    existingUser.setOauth2ProviderId(userInfo.getId());
                    return userService.updateProfile(existingUser.getId(), existingUser);
                }
                return Mono.just(existingUser);
            })
            .switchIfEmpty(Mono.defer(() -> createNewOAuth2User(tenantId, provider, userInfo)));
    }

    /**
     * Create new user from OAuth2 info.
     */
    private Mono<User> createNewOAuth2User(String tenantId, OAuth2Provider provider, OAuth2UserInfo userInfo) {
        User newUser = new User();
        newUser.setTenantId(tenantId);
        newUser.setEmail(userInfo.getEmail());
        newUser.setFirstName(userInfo.getFirstName() != null ? userInfo.getFirstName() : "");
        newUser.setLastName(userInfo.getLastName() != null ? userInfo.getLastName() : "");
        newUser.setOauth2Provider(provider.toString());
        newUser.setOauth2ProviderId(userInfo.getId());
        newUser.setRole(UserRole.CUSTOMER);
        newUser.setStatus(UserStatus.ACTIVE);
        // No password hash for OAuth2 users - use empty string as placeholder

        logger.info("Creating new OAuth2 user: {} provider: {}", userInfo.getEmail(), provider);

        return userService.register(newUser, ""); // Empty password for OAuth2 users
    }

    /**
     * Verify OAuth2 access token is valid.
     */
    public Mono<Boolean> verifyToken(OAuth2Provider provider, String accessToken) {
        return fetchUserInfo(provider, accessToken)
            .map(userInfo -> true)
            .onErrorReturn(false);
    }
}
