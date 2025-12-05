package com.retail;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.method.configuration.EnableReactiveMethodSecurity;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.SecurityWebFiltersOrder;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.web.server.SecurityWebFilterChain;
import org.springframework.security.web.server.authentication.HttpStatusServerEntryPoint;

import com.retail.security.JwtAuthenticationFilter;

/**
 * Test security configuration that disables CSRF for easier testing.
 * This maintains all other security features (JWT auth, RBAC) while simplifying test setup.
 */
@TestConfiguration
@EnableWebFluxSecurity
@EnableReactiveMethodSecurity
@Profile("test")
public class TestSecurityConfiguration {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public TestSecurityConfiguration(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    @Primary
    public SecurityWebFilterChain testSecurityWebFilterChain(ServerHttpSecurity http) {
        return http
            // Disable CSRF for testing
            .csrf(ServerHttpSecurity.CsrfSpec::disable)

            // Authorization rules (same as production)
            .authorizeExchange(exchanges -> exchanges
                // Public endpoints - no authentication required
                .pathMatchers("/api/v1/auth/**").permitAll()
                .pathMatchers("/api/v1/health/**").permitAll()
                .pathMatchers("/actuator/health").permitAll()
                .pathMatchers("/v3/api-docs/**").permitAll()
                .pathMatchers("/swagger-ui/**").permitAll()
                .pathMatchers("/swagger-ui.html").permitAll()
                .pathMatchers("/webjars/**").permitAll()

                // Public read-only product endpoints for consumers
                .pathMatchers(HttpMethod.GET, "/api/v1/products/**").permitAll()
                .pathMatchers(HttpMethod.GET, "/api/v1/search/**").permitAll()

                // Admin-only endpoints - require ADMIN role
                .pathMatchers("/api/v1/admin/**").hasRole("ADMIN")
                .pathMatchers(HttpMethod.POST, "/api/v1/products/**").hasAnyRole("ADMIN", "STORE_OWNER")
                .pathMatchers(HttpMethod.PUT, "/api/v1/products/**").hasAnyRole("ADMIN", "STORE_OWNER")
                .pathMatchers(HttpMethod.DELETE, "/api/v1/products/**").hasAnyRole("ADMIN", "STORE_OWNER")
                .pathMatchers("/api/v1/orders/*/fulfill").hasAnyRole("ADMIN", "STORE_OWNER")
                .pathMatchers("/api/v1/inventory/**").hasAnyRole("ADMIN", "STORE_OWNER")

                // User endpoints - require authenticated user (CUSTOMER, USER, or ADMIN)
                .pathMatchers("/api/v1/users/me/**").hasAnyRole("USER", "CUSTOMER", "ADMIN", "STORE_OWNER")
                .pathMatchers("/api/v1/cart/**").hasAnyRole("USER", "CUSTOMER", "ADMIN", "STORE_OWNER")
                .pathMatchers("/api/v1/orders/**").hasAnyRole("USER", "CUSTOMER", "ADMIN", "STORE_OWNER")

                // All other endpoints require authentication
                .anyExchange().authenticated()
            )

            // Exception handling
            .exceptionHandling(exceptionHandling -> exceptionHandling
                .authenticationEntryPoint(new HttpStatusServerEntryPoint(HttpStatus.UNAUTHORIZED))
                .accessDeniedHandler((exchange, denied) -> {
                    exchange.getResponse().setStatusCode(HttpStatus.FORBIDDEN);
                    return exchange.getResponse().setComplete();
                })
            )

            // Disable default login page
            .formLogin(ServerHttpSecurity.FormLoginSpec::disable)
            .httpBasic(ServerHttpSecurity.HttpBasicSpec::disable)
            .logout(ServerHttpSecurity.LogoutSpec::disable)

            // Add JWT authentication filter
            .addFilterAt(jwtAuthenticationFilter, SecurityWebFiltersOrder.AUTHENTICATION)

            .build();
    }
}
