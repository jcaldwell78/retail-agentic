package com.retail.domain.user;

import com.retail.infrastructure.persistence.UserRepository;
import com.retail.security.JwtService;
import com.retail.security.tenant.TenantContext;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Instant;

/**
 * Service for User operations with automatic tenant isolation.
 * Includes user registration, authentication, and profile management.
 */
@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    /**
     * Register a new user for current tenant
     */
    public Mono<User> register(User user, String rawPassword) {
        // Validate password strength
        PasswordValidator.ValidationResult validation = PasswordValidator.validate(rawPassword);
        if (!validation.isValid()) {
            return Mono.error(new IllegalArgumentException(
                "Password does not meet requirements: " + validation.getErrorMessage()
            ));
        }

        return TenantContext.getTenantId()
            .flatMap(tenantId -> {
                // Check if email already exists
                return userRepository.existsByEmailAndTenantId(user.getEmail(), tenantId)
                    .flatMap(exists -> {
                        if (exists) {
                            return Mono.error(new IllegalArgumentException(
                                "User with email " + user.getEmail() + " already exists"
                            ));
                        }

                        // Set up new user
                        user.setTenantId(tenantId);
                        user.setPasswordHash(passwordEncoder.encode(rawPassword));
                        user.setStatus(UserStatus.ACTIVE);
                        user.setCreatedAt(Instant.now());
                        user.setUpdatedAt(Instant.now());

                        return userRepository.save(user);
                    });
            });
    }

    /**
     * Authenticate user by email and password
     */
    public Mono<User> authenticate(String email, String rawPassword) {
        return TenantContext.getTenantId()
            .flatMap(tenantId ->
                userRepository.findByEmailAndTenantId(email, tenantId)
                    .filter(user -> passwordEncoder.matches(rawPassword, user.getPasswordHash()))
                    .filter(User::isActive)
                    .doOnNext(user -> {
                        user.recordLogin();
                        userRepository.save(user).subscribe();
                    })
                    .switchIfEmpty(Mono.error(
                        new IllegalArgumentException("Invalid email or password")
                    ))
            );
    }

    /**
     * Find user by ID for current tenant
     */
    public Mono<User> findById(String id) {
        return TenantContext.getTenantId()
            .flatMap(tenantId -> userRepository.findByIdAndTenantId(id, tenantId));
    }

    /**
     * Find user by email for current tenant
     */
    public Mono<User> findByEmail(String email) {
        return TenantContext.getTenantId()
            .flatMap(tenantId -> userRepository.findByEmailAndTenantId(email, tenantId));
    }

    /**
     * Find all users for current tenant
     */
    public Flux<User> findAll(Pageable pageable) {
        return TenantContext.getTenantId()
            .flatMapMany(tenantId -> userRepository.findByTenantId(tenantId, pageable));
    }

    /**
     * Find users by role for current tenant
     */
    public Flux<User> findByRole(UserRole role, Pageable pageable) {
        return TenantContext.getTenantId()
            .flatMapMany(tenantId -> userRepository.findByTenantIdAndRole(tenantId, role, pageable));
    }

    /**
     * Update user role for current tenant.
     * Prevents privilege escalation by ensuring the current user has higher privileges.
     *
     * @param userId User ID to update
     * @param newRole New role to assign
     * @param currentUserRole Role of the user making the change
     * @return Updated user
     */
    public Mono<User> updateUserRole(String userId, UserRole newRole, UserRole currentUserRole) {
        // Prevent privilege escalation - only higher roles can assign roles
        if (!canAssignRole(currentUserRole, newRole)) {
            return Mono.error(new SecurityException(
                "Insufficient privileges to assign role: " + newRole
            ));
        }

        return TenantContext.getTenantId()
            .flatMap(tenantId ->
                userRepository.findByIdAndTenantId(userId, tenantId)
                    .flatMap(user -> {
                        // Prevent downgrading or modifying users with higher privileges
                        if (!canAssignRole(currentUserRole, user.getRole())) {
                            return Mono.error(new SecurityException(
                                "Cannot modify user with role: " + user.getRole()
                            ));
                        }

                        user.setRole(newRole);
                        user.setUpdatedAt(Instant.now());
                        return userRepository.save(user);
                    })
                    .switchIfEmpty(Mono.error(
                        new IllegalArgumentException("User not found: " + userId)
                    ))
            );
    }

    /**
     * Check if a user role can assign another role.
     * STORE_OWNER can assign any role.
     * ADMIN can assign STAFF and CUSTOMER.
     * Others cannot assign roles.
     */
    private boolean canAssignRole(UserRole assignerRole, UserRole targetRole) {
        if (assignerRole == UserRole.STORE_OWNER) {
            return true; // Store owner can assign any role
        }
        if (assignerRole == UserRole.ADMIN) {
            return targetRole == UserRole.CUSTOMER || targetRole == UserRole.STAFF;
        }
        return false; // STAFF and CUSTOMER cannot assign roles
    }

    /**
     * Find users by status for current tenant
     */
    public Flux<User> findByStatus(UserStatus status, Pageable pageable) {
        return TenantContext.getTenantId()
            .flatMapMany(tenantId -> userRepository.findByTenantIdAndStatus(tenantId, status, pageable));
    }

    /**
     * Find active users for current tenant
     */
    public Flux<User> findActiveUsers(Pageable pageable) {
        return TenantContext.getTenantId()
            .flatMapMany(tenantId -> userRepository.findActiveUsers(tenantId, pageable));
    }

    /**
     * Update user profile for current tenant
     */
    public Mono<User> updateProfile(String id, User user) {
        return TenantContext.getTenantId()
            .flatMap(tenantId ->
                userRepository.findByIdAndTenantId(id, tenantId)
                    .flatMap(existing -> {
                        // Preserve critical fields
                        user.setId(existing.getId());
                        user.setTenantId(tenantId);
                        user.setPasswordHash(existing.getPasswordHash());
                        user.setCreatedAt(existing.getCreatedAt());
                        user.setUpdatedAt(Instant.now());
                        user.setLastLoginAt(existing.getLastLoginAt());

                        return userRepository.save(user);
                    })
            );
    }

    /**
     * Change user password
     */
    public Mono<User> changePassword(String id, String oldPassword, String newPassword) {
        return TenantContext.getTenantId()
            .flatMap(tenantId ->
                userRepository.findByIdAndTenantId(id, tenantId)
                    .flatMap(user -> {
                        // Verify old password
                        if (!passwordEncoder.matches(oldPassword, user.getPasswordHash())) {
                            return Mono.error(new IllegalArgumentException("Invalid current password"));
                        }

                        // Set new password
                        user.setPasswordHash(passwordEncoder.encode(newPassword));
                        user.setUpdatedAt(Instant.now());

                        return userRepository.save(user);
                    })
            );
    }

    /**
     * Add address to user
     */
    public Mono<User> addAddress(String userId, Address address) {
        return TenantContext.getTenantId()
            .flatMap(tenantId ->
                userRepository.findByIdAndTenantId(userId, tenantId)
                    .flatMap(user -> {
                        user.addAddress(address);
                        return userRepository.save(user);
                    })
            );
    }

    /**
     * Update user status (admin operation)
     */
    public Mono<User> updateStatus(String id, UserStatus status) {
        return TenantContext.getTenantId()
            .flatMap(tenantId ->
                userRepository.findByIdAndTenantId(id, tenantId)
                    .flatMap(user -> {
                        user.setStatus(status);
                        user.setUpdatedAt(Instant.now());
                        return userRepository.save(user);
                    })
            );
    }

    /**
     * Update user role (admin operation)
     */
    public Mono<User> updateRole(String id, UserRole role) {
        return TenantContext.getTenantId()
            .flatMap(tenantId ->
                userRepository.findByIdAndTenantId(id, tenantId)
                    .flatMap(user -> {
                        user.setRole(role);
                        user.setUpdatedAt(Instant.now());
                        return userRepository.save(user);
                    })
            );
    }

    /**
     * Delete user for current tenant
     */
    public Mono<Void> delete(String id) {
        return TenantContext.getTenantId()
            .flatMap(tenantId -> userRepository.deleteByIdAndTenantId(id, tenantId));
    }

    /**
     * Count users for current tenant
     */
    public Mono<Long> count() {
        return TenantContext.getTenantId()
            .flatMap(userRepository::countByTenantId);
    }

    /**
     * Count active users for current tenant
     */
    public Mono<Long> countActive() {
        return TenantContext.getTenantId()
            .flatMap(userRepository::countActiveUsers);
    }

    /**
     * Count users by role for current tenant
     */
    public Mono<Long> countByRole(UserRole role) {
        return TenantContext.getTenantId()
            .flatMap(tenantId -> userRepository.countByTenantIdAndRole(tenantId, role));
    }

    /**
     * Check if email exists for current tenant
     */
    public Mono<Boolean> emailExists(String email) {
        return TenantContext.getTenantId()
            .flatMap(tenantId -> userRepository.existsByEmailAndTenantId(email, tenantId));
    }
}
