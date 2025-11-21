package com.retail.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.Map;

/**
 * Health check controller for basic application status.
 */
@RestController
@RequestMapping("/api/v1")
@Tag(name = "Health", description = "Application health and status endpoints")
public class HealthController {

    @GetMapping(value = "/health", produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(
            summary = "Check application health",
            description = "Returns the current health status of the application including service name, version, and timestamp",
            responses = {
                    @ApiResponse(
                            responseCode = "200",
                            description = "Application is healthy",
                            content = @Content(
                                    mediaType = "application/json",
                                    schema = @Schema(implementation = Map.class),
                                    examples = @ExampleObject(
                                            value = """
                                                    {
                                                      "status": "UP",
                                                      "timestamp": "2025-01-15T10:30:00Z",
                                                      "service": "retail-backend",
                                                      "version": "1.0.0"
                                                    }
                                                    """
                                    )
                            )
                    )
            }
    )
    public Mono<Map<String, Object>> health() {
        return Mono.just(Map.of(
            "status", "UP",
            "timestamp", Instant.now().toString(),
            "service", "retail-backend",
            "version", "1.0.0"
        ));
    }
}
