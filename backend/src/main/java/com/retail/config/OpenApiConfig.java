package com.retail.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

/**
 * OpenAPI 3.0 configuration for API-first development.
 * Exposes interactive API documentation at /swagger-ui.html
 * and OpenAPI spec at /v3/api-docs
 */
@Configuration
public class OpenApiConfig {

    @Value("${spring.application.name:retail-backend}")
    private String applicationName;

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Retail Platform API")
                        .version("1.0.0")
                        .description("""
                                Multi-tenant retail platform API with support for:
                                - Dynamic product attributes
                                - Subdomain/path-based tenant routing
                                - Whitelabel branding
                                - Reactive/non-blocking operations

                                ## Authentication
                                Authentication details will be added as features are implemented.

                                ## Multi-Tenancy
                                Tenants are identified via subdomain (tenant.retail.com) or path (retail.com/tenant).
                                All endpoints automatically filter data by the active tenant.
                                """)
                        .contact(new Contact()
                                .name("Retail Platform Team")
                                .email("support@retail.com"))
                        .license(new License()
                                .name("Proprietary")
                                .url("https://retail.com/license")))
                .servers(List.of(
                        new Server()
                                .url("http://localhost:8080")
                                .description("Local development"),
                        new Server()
                                .url("https://api.retail.com")
                                .description("Production")));
    }
}
