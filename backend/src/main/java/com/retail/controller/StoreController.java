package com.retail.controller;

import com.retail.domain.tenant.Tenant;
import com.retail.domain.tenant.TenantService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

/**
 * REST controller for Store/Tenant configuration.
 * Manages store branding, settings, and configuration.
 */
@RestController
@RequestMapping("/api/v1/store")
@Tag(name = "Store", description = "Store configuration and branding")
public class StoreController {

    private final TenantService tenantService;

    public StoreController(TenantService tenantService) {
        this.tenantService = tenantService;
    }

    @Operation(
        summary = "Get store configuration",
        description = "Get current tenant's configuration and branding",
        responses = {
            @ApiResponse(responseCode = "200", description = "Success"),
            @ApiResponse(responseCode = "404", description = "Tenant not found")
        }
    )
    @GetMapping(value = "/config", produces = MediaType.APPLICATION_JSON_VALUE)
    public Mono<Tenant> getStoreConfig() {
        return tenantService.getCurrentTenant();
    }

    @Operation(
        summary = "Update store configuration",
        description = "Update tenant's configuration (admin only)",
        responses = {
            @ApiResponse(responseCode = "200", description = "Configuration updated"),
            @ApiResponse(responseCode = "400", description = "Invalid data")
        }
    )
    @PutMapping(value = "/config", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public Mono<Tenant> updateStoreConfig(
        @Valid @RequestBody Tenant tenant
    ) {
        return tenantService.updateTenant(tenant);
    }

    @Operation(
        summary = "Update store branding",
        description = "Update tenant's branding (logo, colors, fonts)",
        responses = {
            @ApiResponse(responseCode = "200", description = "Branding updated"),
            @ApiResponse(responseCode = "400", description = "Invalid branding data")
        }
    )
    @PutMapping(value = "/branding", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public Mono<Tenant> updateBranding(
        @Valid @RequestBody Tenant.Branding branding
    ) {
        return tenantService.updateBranding(branding);
    }

    @Operation(
        summary = "Update store settings",
        description = "Update tenant's settings (currency, tax rate, etc.)",
        responses = {
            @ApiResponse(responseCode = "200", description = "Settings updated"),
            @ApiResponse(responseCode = "400", description = "Invalid settings data")
        }
    )
    @PutMapping(value = "/settings", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public Mono<Tenant> updateSettings(
        @Valid @RequestBody Tenant.TenantSettings settings
    ) {
        return tenantService.updateSettings(settings);
    }
}
