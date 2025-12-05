package com.retail.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
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

    @GetMapping("/dashboard")
    @Operation(summary = "Get admin dashboard", description = "Retrieve admin dashboard summary")
    public Mono<ResponseEntity<Map<String, Object>>> getDashboard() {
        Map<String, Object> dashboard = new HashMap<>();
        dashboard.put("message", "Admin dashboard");
        dashboard.put("status", "ok");
        return Mono.just(ResponseEntity.ok(dashboard));
    }
}
