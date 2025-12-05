package com.retail.controller;

import com.retail.domain.user.Address;
import com.retail.domain.user.User;
import com.retail.domain.user.UserRole;
import com.retail.domain.user.UserService;
import com.retail.domain.user.UserStatus;
import com.retail.exception.ResourceNotFoundException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * REST controller for User operations.
 * Includes registration, authentication, and profile management.
 */
@RestController
@RequestMapping("/api/v1/users")
@Tag(name = "Users", description = "User management and authentication endpoints")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Register new user", description = "Create a new user account for current tenant")
    public Mono<User> register(@Valid @RequestBody RegisterRequest request) {
        User user = new User();
        user.setEmail(request.email);
        user.setFirstName(request.firstName);
        user.setLastName(request.lastName);
        user.setPhone(request.phone);
        user.setRole(UserRole.CUSTOMER);

        return userService.register(user, request.password);
    }

    @PostMapping("/authenticate")
    @Operation(summary = "Authenticate user", description = "Login with email and password")
    public Mono<ResponseEntity<AuthResponse>> authenticate(@Valid @RequestBody AuthRequest request) {
        return userService.authenticate(request.email, request.password)
            .map(user -> {
                AuthResponse response = new AuthResponse();
                response.userId = user.getId();
                response.email = user.getEmail();
                response.firstName = user.getFirstName();
                response.lastName = user.getLastName();
                response.role = user.getRole();
                // TODO: Add JWT token generation
                return ResponseEntity.ok(response);
            });
    }

    @GetMapping("/me")
    @Operation(summary = "Get current user", description = "Retrieve currently authenticated user's profile")
    public Mono<ResponseEntity<User>> getCurrentUser() {
        // TODO: Extract user ID from JWT token in SecurityContext
        // For now, return a mock response
        return Mono.just(ResponseEntity.ok().build());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get user by ID", description = "Retrieve user details for current tenant")
    public Mono<ResponseEntity<User>> getUserById(
            @Parameter(description = "User ID") @PathVariable String id
    ) {
        return userService.findById(id)
            .map(ResponseEntity::ok)
            .switchIfEmpty(Mono.error(new ResourceNotFoundException("User", id)));
    }

    @GetMapping("/email/{email}")
    @Operation(summary = "Get user by email", description = "Retrieve user by email for current tenant")
    public Mono<ResponseEntity<User>> getUserByEmail(
            @Parameter(description = "User email") @PathVariable String email
    ) {
        return userService.findByEmail(email)
            .map(ResponseEntity::ok)
            .switchIfEmpty(Mono.error(new ResourceNotFoundException("User with email '" + email + "' not found")));
    }

    @GetMapping
    @Operation(summary = "Get all users", description = "Retrieve paginated list of users for current tenant")
    public Flux<User> getAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return userService.findAll(pageable);
    }

    @GetMapping("/role/{role}")
    @Operation(summary = "Get users by role", description = "Retrieve users with specific role")
    public Flux<User> getUsersByRole(
            @Parameter(description = "User role") @PathVariable UserRole role,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return userService.findByRole(role, pageable);
    }

    @GetMapping("/status/{status}")
    @Operation(summary = "Get users by status", description = "Retrieve users with specific status")
    public Flux<User> getUsersByStatus(
            @Parameter(description = "User status") @PathVariable UserStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return userService.findByStatus(status, pageable);
    }

    @GetMapping("/active")
    @Operation(summary = "Get active users", description = "Retrieve only active users")
    public Flux<User> getActiveUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return userService.findActiveUsers(pageable);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update user profile", description = "Update user information")
    public Mono<ResponseEntity<User>> updateProfile(
            @Parameter(description = "User ID") @PathVariable String id,
            @Valid @RequestBody User user
    ) {
        return userService.updateProfile(id, user)
            .map(ResponseEntity::ok)
            .switchIfEmpty(Mono.error(new ResourceNotFoundException("User", id)));
    }

    @PutMapping("/{id}/password")
    @Operation(summary = "Change password", description = "Change user password")
    public Mono<ResponseEntity<Void>> changePassword(
            @Parameter(description = "User ID") @PathVariable String id,
            @Valid @RequestBody ChangePasswordRequest request
    ) {
        return userService.changePassword(id, request.oldPassword, request.newPassword)
            .map(user -> ResponseEntity.ok().<Void>build())
            .switchIfEmpty(Mono.error(new ResourceNotFoundException("User", id)));
    }

    @PostMapping("/{id}/addresses")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Add address", description = "Add address to user profile")
    public Mono<User> addAddress(
            @Parameter(description = "User ID") @PathVariable String id,
            @Valid @RequestBody Address address
    ) {
        return userService.addAddress(id, address);
    }

    @PutMapping("/{id}/status")
    @Operation(summary = "Update user status", description = "Update user status (admin only)")
    public Mono<ResponseEntity<User>> updateStatus(
            @Parameter(description = "User ID") @PathVariable String id,
            @RequestBody UserStatus status
    ) {
        return userService.updateStatus(id, status)
            .map(ResponseEntity::ok)
            .switchIfEmpty(Mono.error(new ResourceNotFoundException("User", id)));
    }

    @PutMapping("/{id}/role")
    @Operation(summary = "Update user role", description = "Update user role (admin only)")
    public Mono<ResponseEntity<User>> updateRole(
            @Parameter(description = "User ID") @PathVariable String id,
            @RequestBody UserRole role
    ) {
        return userService.updateRole(id, role)
            .map(ResponseEntity::ok)
            .switchIfEmpty(Mono.error(new ResourceNotFoundException("User", id)));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Delete user", description = "Delete user account")
    public Mono<Void> deleteUser(
            @Parameter(description = "User ID") @PathVariable String id
    ) {
        return userService.delete(id);
    }

    @GetMapping("/count")
    @Operation(summary = "Count users", description = "Get total count of users")
    public Mono<Long> countUsers() {
        return userService.count();
    }

    @GetMapping("/count/active")
    @Operation(summary = "Count active users", description = "Get count of active users")
    public Mono<Long> countActiveUsers() {
        return userService.countActive();
    }

    @GetMapping("/count/role/{role}")
    @Operation(summary = "Count users by role", description = "Get count of users with specific role")
    public Mono<Long> countUsersByRole(@PathVariable UserRole role) {
        return userService.countByRole(role);
    }

    @GetMapping("/email/{email}/exists")
    @Operation(summary = "Check email exists", description = "Check if email is already registered")
    public Mono<Boolean> emailExists(@PathVariable String email) {
        return userService.emailExists(email);
    }

    // DTOs
    public static class RegisterRequest {
        public String email;
        public String password;
        public String firstName;
        public String lastName;
        public String phone;
    }

    public static class AuthRequest {
        public String email;
        public String password;
    }

    public static class AuthResponse {
        public String userId;
        public String email;
        public String firstName;
        public String lastName;
        public UserRole role;
        public String token; // JWT token (to be implemented)
    }

    public static class ChangePasswordRequest {
        public String oldPassword;
        public String newPassword;
    }
}
