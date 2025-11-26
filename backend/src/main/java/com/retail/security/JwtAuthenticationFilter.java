package com.retail.security;

import com.retail.security.tenant.TenantContext;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextImpl;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

import java.util.Collections;
import java.util.List;
import java.util.Map;

/**
 * JWT Authentication filter for reactive Spring WebFlux.
 * Extracts JWT token from Authorization header, validates it,
 * and sets up Security Context with user details and tenant context.
 */
@Component
public class JwtAuthenticationFilter implements WebFilter {

    private final JwtService jwtService;

    public JwtAuthenticationFilter(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    @NonNull
    public Mono<Void> filter(@NonNull ServerWebExchange exchange, @NonNull WebFilterChain chain) {
        String path = exchange.getRequest().getPath().value();

        // Skip authentication for public endpoints
        if (isPublicEndpoint(path)) {
            return chain.filter(exchange);
        }

        // Extract JWT token from Authorization header
        String authHeader = exchange.getRequest().getHeaders().getFirst("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return chain.filter(exchange);
        }

        String token = authHeader.substring(7);

        try {
            // Validate token
            if (!jwtService.validateToken(token)) {
                return chain.filter(exchange);
            }

            // Extract claims
            String username = jwtService.extractUsername(token);
            String userId = jwtService.extractUserId(token);
            String tenantId = jwtService.extractTenantId(token);
            String role = jwtService.extractRole(token);

            // Create authentication with role
            List<SimpleGrantedAuthority> authorities = Collections.singletonList(
                new SimpleGrantedAuthority("ROLE_" + role)
            );

            UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(username, null, authorities);
            authentication.setDetails(Map.of(
                "userId", userId,
                "tenantId", tenantId,
                "role", role
            ));

            // Set security context and tenant context
            SecurityContext securityContext = new SecurityContextImpl(authentication);

            return chain.filter(exchange)
                .contextWrite(ReactiveSecurityContextHolder.withSecurityContext(Mono.just(securityContext)))
                .contextWrite(TenantContext.withTenantId(tenantId));

        } catch (Exception e) {
            // Invalid token - continue without authentication
            return chain.filter(exchange);
        }
    }

    private boolean isPublicEndpoint(String path) {
        return path.startsWith("/api/v1/auth/") ||
               path.startsWith("/api/v1/health") ||
               path.startsWith("/v3/api-docs") ||
               path.startsWith("/swagger-ui") ||
               path.startsWith("/webjars/");
    }
}
