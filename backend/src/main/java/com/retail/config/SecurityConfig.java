package com.retail.config;

import com.retail.security.JwtAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.method.configuration.EnableReactiveMethodSecurity;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.SecurityWebFiltersOrder;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.server.SecurityWebFilterChain;
import org.springframework.security.web.server.authentication.HttpStatusServerEntryPoint;
import org.springframework.security.web.server.csrf.CookieServerCsrfTokenRepository;
import org.springframework.security.web.server.csrf.ServerCsrfTokenRequestAttributeHandler;
import reactor.core.publisher.Mono;

/**
 * Security configuration for reactive Spring WebFlux.
 *
 * Features:
 * - JWT-based authentication
 * - Role-based access control (RBAC)
 * - CSRF protection for state-changing operations
 * - Public endpoints for health checks and API docs
 * - Method-level security annotations support
 */
@Configuration
@EnableWebFluxSecurity
@EnableReactiveMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    /**
     * BCrypt password encoder for secure password hashing
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /**
     * Security filter chain configuration
     */
    @Bean
    public SecurityWebFilterChain securityWebFilterChain(ServerHttpSecurity http) {
        return http
            // CSRF Protection
            .csrf(csrf -> csrf
                .csrfTokenRepository(CookieServerCsrfTokenRepository.withHttpOnlyFalse())
                .csrfTokenRequestHandler(new ServerCsrfTokenRequestAttributeHandler())
            )

            // Authorization rules
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
                .pathMatchers(HttpMethod.POST, "/api/v1/products/**").hasRole("ADMIN")
                .pathMatchers(HttpMethod.PUT, "/api/v1/products/**").hasRole("ADMIN")
                .pathMatchers(HttpMethod.DELETE, "/api/v1/products/**").hasRole("ADMIN")
                .pathMatchers("/api/v1/orders/*/fulfill").hasRole("ADMIN")
                .pathMatchers("/api/v1/inventory/**").hasRole("ADMIN")

                // User endpoints - require authenticated user
                .pathMatchers("/api/v1/users/me/**").hasAnyRole("USER", "ADMIN")
                .pathMatchers("/api/v1/cart/**").hasAnyRole("USER", "ADMIN")
                .pathMatchers("/api/v1/orders/**").hasAnyRole("USER", "ADMIN")

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
