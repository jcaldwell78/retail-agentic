package com.retail.domain.tenant;

import com.retail.infrastructure.persistence.TenantRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.UUID;

/**
 * Service for onboarding new tenants to the platform.
 *
 * Handles the complete tenant registration workflow including:
 * - Tenant validation and creation
 * - Default settings initialization
 * - Subdomain validation and assignment
 * - Initial branding setup
 */
@Service
public class TenantOnboardingService {

    private static final Logger logger = LoggerFactory.getLogger(TenantOnboardingService.class);

    private final TenantRepository tenantRepository;
    private final TenantService tenantService;

    public TenantOnboardingService(
            TenantRepository tenantRepository,
            TenantService tenantService) {
        this.tenantRepository = tenantRepository;
        this.tenantService = tenantService;
    }

    /**
     * Onboard a new tenant with full validation and setup.
     *
     * @param request Onboarding request with tenant details
     * @return Mono<OnboardingResult> Result including tenant ID and setup info
     */
    public Mono<OnboardingResult> onboardTenant(OnboardingRequest request) {
        return validateOnboardingRequest(request)
            .flatMap(this::checkSubdomainAvailability)
            .flatMap(this::createTenant)
            .flatMap(this::initializeDefaults)
            .map(this::createOnboardingResult)
            .doOnSuccess(result -> logger.info(
                "Successfully onboarded tenant: {} (subdomain: {})",
                result.tenantId(), request.subdomain()
            ))
            .doOnError(error -> logger.error(
                "Failed to onboard tenant with subdomain '{}': {}",
                request.subdomain(), error.getMessage()
            ));
    }

    /**
     * Validate onboarding request
     */
    private Mono<OnboardingRequest> validateOnboardingRequest(OnboardingRequest request) {
        return Mono.fromCallable(() -> {
            // Validate subdomain format
            if (!isValidSubdomain(request.subdomain())) {
                throw new IllegalArgumentException(
                    "Invalid subdomain format. Must be 3-63 characters, lowercase alphanumeric with hyphens."
                );
            }

            // Validate email format
            if (!isValidEmail(request.contactEmail())) {
                throw new IllegalArgumentException("Invalid email format");
            }

            // Validate store name
            if (request.storeName() == null || request.storeName().trim().isEmpty()) {
                throw new IllegalArgumentException("Store name is required");
            }

            return request;
        });
    }

    /**
     * Check if subdomain is available
     */
    private Mono<OnboardingRequest> checkSubdomainAvailability(OnboardingRequest request) {
        return tenantRepository.findBySubdomain(request.subdomain())
            .hasElement()
            .flatMap(exists -> {
                if (exists) {
                    return Mono.error(new IllegalArgumentException(
                        "Subdomain '" + request.subdomain() + "' is already taken"
                    ));
                }
                return Mono.just(request);
            });
    }

    /**
     * Create tenant entity
     */
    private Mono<Tenant> createTenant(OnboardingRequest request) {
        return Mono.fromCallable(() -> {
            Tenant tenant = new Tenant();
            tenant.setId(UUID.randomUUID().toString());
            tenant.setSubdomain(request.subdomain().toLowerCase());
            tenant.setName(request.storeName());
            tenant.setDescription(request.description());
            tenant.setContactEmail(request.contactEmail());
            tenant.setPhone(request.phone());

            Instant now = Instant.now();
            tenant.setCreatedAt(now);
            tenant.setUpdatedAt(now);

            return tenant;
        })
        .flatMap(tenantRepository::save);
    }

    /**
     * Initialize default settings and branding
     */
    private Mono<Tenant> initializeDefaults(Tenant tenant) {
        return Mono.fromCallable(() -> {
            // Set default branding
            Tenant.Branding branding = new Tenant.Branding();
            branding.setLogoUrl(null); // No logo initially
            branding.setPrimaryColor("#3B82F6"); // Blue
            branding.setSecondaryColor("#10B981"); // Green
            branding.setFontFamily("Inter, system-ui, sans-serif");
            tenant.setBranding(branding);

            // Set default settings
            Tenant.TenantSettings settings = new Tenant.TenantSettings();
            settings.setCurrency("USD");
            settings.setTimezone("America/New_York");
            settings.setLanguage("en");
            settings.setActive(true);
            settings.setMaxProducts(10000);
            settings.setMaxUsers(50);
            tenant.setSettings(settings);

            tenant.setUpdatedAt(Instant.now());
            return tenant;
        })
        .flatMap(tenantRepository::save);
    }

    /**
     * Create onboarding result
     */
    private OnboardingResult createOnboardingResult(Tenant tenant) {
        return new OnboardingResult(
            tenant.getId(),
            tenant.getSubdomain(),
            tenant.getName(),
            tenant.getContactEmail(),
            getStoreUrl(tenant),
            tenant.getCreatedAt()
        );
    }

    /**
     * Get the full store URL for a tenant
     */
    private String getStoreUrl(Tenant tenant) {
        if (tenant.getCustomDomain() != null) {
            return "https://" + tenant.getCustomDomain();
        }
        return "https://" + tenant.getSubdomain() + ".retail-agentic.com";
    }

    /**
     * Validate subdomain format
     * - 3-63 characters
     * - Lowercase alphanumeric with hyphens
     * - Cannot start or end with hyphen
     */
    private boolean isValidSubdomain(String subdomain) {
        if (subdomain == null || subdomain.length() < 3 || subdomain.length() > 63) {
            return false;
        }

        return subdomain.matches("^[a-z0-9]([a-z0-9-]*[a-z0-9])?$");
    }

    /**
     * Simple email validation
     */
    private boolean isValidEmail(String email) {
        if (email == null) {
            return false;
        }
        return email.matches("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");
    }

    /**
     * Onboarding request record
     */
    public record OnboardingRequest(
        String subdomain,
        String storeName,
        String description,
        String contactEmail,
        String phone
    ) {}

    /**
     * Onboarding result record
     */
    public record OnboardingResult(
        String tenantId,
        String subdomain,
        String storeName,
        String contactEmail,
        String storeUrl,
        Instant createdAt
    ) {}
}
