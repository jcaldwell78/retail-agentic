package com.retail.controller;

import com.retail.domain.auth.OAuth2LoginRequest;
import com.retail.domain.auth.OAuth2Service;
import com.retail.domain.user.User;
import com.retail.domain.user.UserService;
import com.retail.security.JwtService;
import com.retail.security.TokenBlacklistService;
import com.retail.security.tenant.TenantContext;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.util.Map;

/**
 * Authentication controller for user login and registration.
 */
@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

    private final UserService userService;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final OAuth2Service oauth2Service;
    private final TokenBlacklistService tokenBlacklistService;

    public AuthController(
        UserService userService,
        JwtService jwtService,
        PasswordEncoder passwordEncoder,
        OAuth2Service oauth2Service,
        TokenBlacklistService tokenBlacklistService
    ) {
        this.userService = userService;
        this.jwtService = jwtService;
        this.passwordEncoder = passwordEncoder;
        this.oauth2Service = oauth2Service;
        this.tokenBlacklistService = tokenBlacklistService;
    }

    /**
     * Traditional email/password login.
     */
    @PostMapping("/login")
    public Mono<ResponseEntity<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        return TenantContext.getTenantId()
            .flatMap(tenantId -> {
                logger.info("Login attempt for email: {} tenant: {}", request.getEmail(), tenantId);

                return userService.findByEmail(request.getEmail())
                    .filter(user -> user.getTenantId().equals(tenantId))
                    .filter(user -> !user.isOAuth2User()) // OAuth2 users can't use password login
                    .filter(user -> passwordEncoder.matches(request.getPassword(), user.getPasswordHash()))
                    .flatMap(user -> {
                        user.recordLogin();
                        return userService.updateProfile(user.getId(), user)
                            .map(updatedUser -> {
                                String token = jwtService.generateToken(
                                    updatedUser.getId(),
                                    updatedUser.getEmail(),
                                    updatedUser.getRole().toString(),
                                    updatedUser.getTenantId()
                                );
                                return ResponseEntity.ok(new AuthResponse(token, updatedUser));
                            });
                    })
                    .switchIfEmpty(Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(new AuthResponse("Invalid credentials", null))))
                    .doOnSuccess(response -> {
                        if (response.getStatusCode().is2xxSuccessful()) {
                            logger.info("Login successful for: {}", request.getEmail());
                        } else {
                            logger.warn("Login failed for: {}", request.getEmail());
                        }
                    })
                    .onErrorResume(error -> {
                        logger.error("Login error for: {}", request.getEmail(), error);
                        return Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                            .body(new AuthResponse("Login failed", null)));
                    });
            });
    }

    /**
     * OAuth2 login (Google, Facebook).
     */
    @PostMapping("/oauth2/login")
    public Mono<ResponseEntity<Map<String, String>>> oauth2Login(@Valid @RequestBody OAuth2LoginRequest request) {
        return TenantContext.getTenantId()
            .flatMap(tenantId -> {
                logger.info("OAuth2 login for provider: {} tenant: {}", request.getProvider(), tenantId);

                return oauth2Service.authenticateWithOAuth2(request)
                    .map(token -> ResponseEntity.ok(Map.of("token", token)))
                    .onErrorResume(error -> {
                        logger.error("OAuth2 login failed", error);
                        return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                            .body(Map.of("error", "OAuth2 authentication failed: " + error.getMessage())));
                    });
            });
    }

    /**
     * User logout.
     * Extracts JWT token from Authorization header and adds it to the blacklist.
     * Blacklisted tokens will be rejected by the authentication filter.
     */
    @PostMapping("/logout")
    public Mono<ResponseEntity<Map<String, String>>> logout(ServerHttpRequest request) {
        String authHeader = request.getHeaders().getFirst("Authorization");

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);

            return tokenBlacklistService.blacklistToken(token)
                .map(success -> {
                    if (success) {
                        logger.info("Token successfully blacklisted on logout");
                        return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
                    } else {
                        logger.warn("Failed to blacklist token on logout");
                        return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
                    }
                })
                .onErrorResume(e -> {
                    logger.error("Error blacklisting token on logout", e);
                    return Mono.just(ResponseEntity.ok(Map.of("message", "Logged out successfully")));
                });
        }

        // No token provided, just return success
        return Mono.just(ResponseEntity.ok(Map.of("message", "Logged out successfully")));
    }

    /**
     * User registration.
     */
    @PostMapping("/register")
    public Mono<ResponseEntity<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        return TenantContext.getTenantId()
            .flatMap(tenantId -> {
                logger.info("Registration attempt for email: {} tenant: {}", request.getEmail(), tenantId);

                // Check if user already exists
                return userService.findByEmail(request.getEmail())
                    .flatMap(existingUser -> {
                        if (existingUser.getTenantId().equals(tenantId)) {
                            return Mono.just(ResponseEntity.status(HttpStatus.CONFLICT)
                                .body(new AuthResponse("Email already registered", null)));
                        }
                        // Different tenant, create new user
                        return createNewUser(request, tenantId);
                    })
                    .switchIfEmpty(Mono.defer(() -> createNewUser(request, tenantId)))
                    .onErrorResume(error -> {
                        logger.error("Registration error for: {}", request.getEmail(), error);
                        return Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                            .body(new AuthResponse("Registration failed", null)));
                    });
            });
    }

    private Mono<ResponseEntity<AuthResponse>> createNewUser(RegisterRequest request, String tenantId) {
        User newUser = new User();
        newUser.setTenantId(tenantId);
        newUser.setEmail(request.getEmail());
        newUser.setFirstName(request.getFirstName());
        newUser.setLastName(request.getLastName());
        newUser.setPhone(request.getPhone());

        return userService.register(newUser, request.getPassword())
            .map(user -> {
                String token = jwtService.generateToken(
                    user.getId(),
                    user.getEmail(),
                    user.getRole().toString(),
                    user.getTenantId()
                );
                logger.info("Registration successful for: {}", request.getEmail());
                return ResponseEntity.status(HttpStatus.CREATED)
                    .body(new AuthResponse(token, user));
            });
    }

    // DTOs

    public static class LoginRequest {
        @NotBlank(message = "Email is required")
        @Email(message = "Valid email is required")
        private String email;

        @NotBlank(message = "Password is required")
        private String password;

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }

        public String getPassword() {
            return password;
        }

        public void setPassword(String password) {
            this.password = password;
        }
    }

    public static class RegisterRequest {
        @NotBlank(message = "Email is required")
        @Email(message = "Valid email is required")
        private String email;

        @NotBlank(message = "Password is required")
        private String password;

        @NotBlank(message = "First name is required")
        private String firstName;

        @NotBlank(message = "Last name is required")
        private String lastName;

        private String phone;

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }

        public String getPassword() {
            return password;
        }

        public void setPassword(String password) {
            this.password = password;
        }

        public String getFirstName() {
            return firstName;
        }

        public void setFirstName(String firstName) {
            this.firstName = firstName;
        }

        public String getLastName() {
            return lastName;
        }

        public void setLastName(String lastName) {
            this.lastName = lastName;
        }

        public String getPhone() {
            return phone;
        }

        public void setPhone(String phone) {
            this.phone = phone;
        }
    }

    public static class AuthResponse {
        private String token;
        private String error;
        private UserInfo user;

        public AuthResponse(String token, User user) {
            if (user != null) {
                this.token = token;
                this.user = new UserInfo(user);
            } else {
                this.error = token; // token parameter used as error message when user is null
            }
        }

        public String getToken() {
            return token;
        }

        public void setToken(String token) {
            this.token = token;
        }

        public String getError() {
            return error;
        }

        public void setError(String error) {
            this.error = error;
        }

        public UserInfo getUser() {
            return user;
        }

        public void setUser(UserInfo user) {
            this.user = user;
        }
    }

    public static class UserInfo {
        private String id;
        private String email;
        private String firstName;
        private String lastName;
        private String role;

        public UserInfo(User user) {
            this.id = user.getId();
            this.email = user.getEmail();
            this.firstName = user.getFirstName();
            this.lastName = user.getLastName();
            this.role = user.getRole().toString();
        }

        public String getId() {
            return id;
        }

        public void setId(String id) {
            this.id = id;
        }

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }

        public String getFirstName() {
            return firstName;
        }

        public void setFirstName(String firstName) {
            this.firstName = firstName;
        }

        public String getLastName() {
            return lastName;
        }

        public void setLastName(String lastName) {
            this.lastName = lastName;
        }

        public String getRole() {
            return role;
        }

        public void setRole(String role) {
            this.role = role;
        }
    }
}
