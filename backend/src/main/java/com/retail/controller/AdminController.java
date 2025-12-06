package com.retail.controller;

import com.retail.domain.user.User;
import com.retail.domain.user.UserRole;
import com.retail.domain.user.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.Map;

/**
 * REST controller for Admin operations.
 * Provides admin dashboard and management endpoints.
 */
@RestController
@RequestMapping("/api/v1/admin")
@Tag(name = "Admin", description = "Admin management endpoints")
public class AdminController {

    private final UserService userService;

    public AdminController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/dashboard")
    @Operation(summary = "Get admin dashboard", description = "Retrieve admin dashboard summary")
    public Mono<ResponseEntity<Map<String, Object>>> getDashboard() {
        Map<String, Object> dashboard = new HashMap<>();
        dashboard.put("message", "Admin dashboard");
        dashboard.put("status", "ok");
        return Mono.just(ResponseEntity.ok(dashboard));
    }

    @PutMapping("/users/{userId}/role")
    @Operation(
        summary = "Update user role",
        description = "Update the role of a user. Only admins can update roles. Prevents privilege escalation.",
        responses = {
            @ApiResponse(responseCode = "200", description = "Role updated successfully"),
            @ApiResponse(responseCode = "403", description = "Insufficient privileges"),
            @ApiResponse(responseCode = "404", description = "User not found"),
            @ApiResponse(responseCode = "400", description = "Invalid role")
        }
    )
    public Mono<ResponseEntity<User>> updateUserRole(
        @Parameter(description = "User ID") @PathVariable String userId,
        @Valid @RequestBody UpdateRoleRequest request,
        Authentication authentication
    ) {
        // Get current user's role from authentication
        User currentUser = (User) authentication.getPrincipal();
        UserRole currentUserRole = currentUser.getRole();

        return userService.updateUserRole(userId, request.getRole(), currentUserRole)
            .map(ResponseEntity::ok)
            .onErrorResume(SecurityException.class, e ->
                Mono.just(ResponseEntity.status(403).build())
            )
            .onErrorResume(IllegalArgumentException.class, e ->
                Mono.just(ResponseEntity.notFound().build())
            );
    }

    /**
     * Request body for updating user role
     */
    public static class UpdateRoleRequest {
        @NotNull(message = "Role is required")
        private UserRole role;

        public UserRole getRole() {
            return role;
        }

        public void setRole(UserRole role) {
            this.role = role;
        }
    }
}
