package com.retail.config;

import com.retail.domain.inventory.Inventory;
import com.retail.domain.product.Category;
import com.retail.domain.product.Product;
import com.retail.domain.tenant.Tenant;
import com.retail.domain.user.User;
import com.retail.domain.user.UserRole;
import com.retail.domain.user.UserStatus;
import com.retail.infrastructure.persistence.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;

/**
 * Seeds the database with test data for local development and testing.
 * Only runs in 'local' and 'dev' profiles.
 */
@Configuration
@Profile({"local", "dev"})
public class DataSeeder {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private final TenantRepository tenantRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final InventoryRepository inventoryRepository;
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(TenantRepository tenantRepository,
                      UserRepository userRepository,
                      CategoryRepository categoryRepository,
                      ProductRepository productRepository,
                      InventoryRepository inventoryRepository,
                      PasswordEncoder passwordEncoder) {
        this.tenantRepository = tenantRepository;
        this.userRepository = userRepository;
        this.categoryRepository = categoryRepository;
        this.productRepository = productRepository;
        this.inventoryRepository = inventoryRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Bean
    CommandLineRunner seedDatabase() {
        return args -> {
            log.info("Starting database seeding for local/dev environment...");

            // Check if data already exists
            tenantRepository.findBySubdomain("test-tenant")
                .flatMap(existing -> {
                    log.info("Test data already exists. Skipping seeding.");
                    return Mono.empty();
                })
                .switchIfEmpty(
                    seedTenants()
                        .then(seedUsers())
                        .then(seedCategories())
                        .then(seedProducts())
                        .then(seedInventory())
                        .then(Mono.fromRunnable(() ->
                            log.info("Database seeding completed successfully!")))
                )
                .subscribe(
                    null,
                    error -> log.error("Error during database seeding: ", error)
                );
        };
    }

    private Mono<Void> seedTenants() {
        log.info("Seeding tenants...");

        List<Tenant> tenants = Arrays.asList(
            createTenant("test-tenant", "Test Store", "test-tenant", "admin@test.com"),
            createTenant("demo-store", "Demo Electronics", "demo-store", "admin@demo.com"),
            createTenant("localhost", "Local Development Store", "localhost", "admin@localhost")
        );

        return Flux.fromIterable(tenants)
            .flatMap(tenantRepository::save)
            .doOnNext(tenant -> log.info("Created tenant: {}", tenant.getName()))
            .then();
    }

    private Tenant createTenant(String id, String name, String subdomain, String contactEmail) {
        Tenant tenant = new Tenant();
        tenant.setId(id);
        tenant.setName(name);
        tenant.setSubdomain(subdomain);
        tenant.setContactEmail(contactEmail);
        tenant.setCreatedAt(Instant.now());
        tenant.setUpdatedAt(Instant.now());

        // Set branding using the record constructor
        Tenant.Branding branding = new Tenant.Branding(
            "https://via.placeholder.com/200x50?text=" + name.replace(" ", "+"),
            "#0070f3",
            "#00a8ff",
            "#ff6b6b",
            "Inter"
        );
        tenant.setBranding(branding);

        // Set settings using the record constructor
        Tenant.TenantSettings settings = new Tenant.TenantSettings(
            "USD",
            0.09,
            50.0,
            10
        );
        tenant.setSettings(settings);

        return tenant;
    }

    private Mono<Void> seedUsers() {
        log.info("Seeding users...");

        List<User> users = Arrays.asList(
            createUser("admin@test.com", "Admin", "User", UserRole.ADMIN, "test-tenant"),
            createUser("store@test.com", "Store", "Owner", UserRole.STORE_OWNER, "test-tenant"),
            createUser("staff@test.com", "Staff", "Member", UserRole.STAFF, "test-tenant"),
            createUser("customer@test.com", "John", "Doe", UserRole.CUSTOMER, "test-tenant"),
            createUser("jane@test.com", "Jane", "Smith", UserRole.CUSTOMER, "test-tenant"),
            createUser("demo@localhost", "Demo", "User", UserRole.CUSTOMER, "localhost")
        );

        return Flux.fromIterable(users)
            .flatMap(userRepository::save)
            .doOnNext(user -> log.info("Created user: {} ({})", user.getEmail(), user.getRole()))
            .then();
    }

    private User createUser(String email, String firstName, String lastName, UserRole role, String tenantId) {
        User user = new User();
        user.setId(UUID.randomUUID().toString());
        user.setEmail(email);
        user.setFirstName(firstName);
        user.setLastName(lastName);
        user.setRole(role);
        user.setTenantId(tenantId);
        user.setStatus(UserStatus.ACTIVE);
        user.setPasswordHash(passwordEncoder.encode("Password123!")); // Default password for all test users
        user.setCreatedAt(Instant.now());
        user.setUpdatedAt(Instant.now());

        return user;
    }

    private Mono<Void> seedCategories() {
        log.info("Seeding categories...");

        List<Category> categories = Arrays.asList(
            createCategory("electronics", "Electronics", "Latest gadgets and electronics", "test-tenant"),
            createCategory("clothing", "Clothing & Fashion", "Trendy apparel for all", "test-tenant"),
            createCategory("home-garden", "Home & Garden", "Everything for your home", "test-tenant"),
            createCategory("books", "Books & Media", "Books, music, and digital media", "test-tenant"),
            createCategory("sports", "Sports & Outdoors", "Sports equipment and outdoor gear", "test-tenant")
        );

        return Flux.fromIterable(categories)
            .flatMap(categoryRepository::save)
            .doOnNext(category -> log.info("Created category: {}", category.getName()))
            .then();
    }

    private Category createCategory(String slug, String name, String description, String tenantId) {
        Category category = new Category();
        category.setId(slug);
        category.setSlug(slug);
        category.setName(name);
        category.setDescription(description);
        category.setTenantId(tenantId);
        category.setImageUrl("https://via.placeholder.com/400x300?text=" + name.replace(" ", "+"));
        category.setCreatedAt(Instant.now());
        category.setUpdatedAt(Instant.now());

        return category;
    }

    private Mono<Void> seedProducts() {
        log.info("Seeding products...");

        List<Product> products = new ArrayList<>();

        // Electronics
        products.add(createProduct("LAPTOP001", "High-Performance Laptop", "15-inch display, 16GB RAM, 512GB SSD",
            "electronics", new BigDecimal("999.99"), "test-tenant"));
        products.add(createProduct("PHONE001", "Smartphone Pro", "Latest flagship smartphone with 5G",
            "electronics", new BigDecimal("799.99"), "test-tenant"));
        products.add(createProduct("HEADPHONES001", "Wireless Headphones", "Noise-canceling bluetooth headphones",
            "electronics", new BigDecimal("199.99"), "test-tenant"));

        // Clothing
        products.add(createProduct("SHIRT001", "Cotton T-Shirt", "100% organic cotton t-shirt",
            "clothing", new BigDecimal("29.99"), "test-tenant"));
        products.add(createProduct("JEANS001", "Denim Jeans", "Classic fit denim jeans",
            "clothing", new BigDecimal("79.99"), "test-tenant"));

        // Home & Garden
        products.add(createProduct("CHAIR001", "Office Chair", "Ergonomic office chair with lumbar support",
            "home-garden", new BigDecimal("249.99"), "test-tenant"));
        products.add(createProduct("LAMP001", "Desk Lamp", "LED desk lamp with adjustable brightness",
            "home-garden", new BigDecimal("39.99"), "test-tenant"));

        // Books
        products.add(createProduct("BOOK001", "Programming Guide", "Complete guide to modern programming",
            "books", new BigDecimal("49.99"), "test-tenant"));

        // Sports
        products.add(createProduct("YOGA001", "Yoga Mat", "Non-slip exercise yoga mat",
            "sports", new BigDecimal("29.99"), "test-tenant"));

        return Flux.fromIterable(products)
            .flatMap(productRepository::save)
            .doOnNext(product -> log.info("Created product: {}", product.getName()))
            .then();
    }

    private Product createProduct(String sku, String name, String description, String categoryId,
                                  BigDecimal price, String tenantId) {
        Product product = new Product();
        product.setId(UUID.randomUUID().toString());
        product.setSku(sku);
        product.setName(name);
        product.setDescription(description);
        product.setCategory(Arrays.asList(categoryId));
        product.setPrice(price);
        product.setCurrency("USD");
        product.setTenantId(tenantId);
        product.setStatus(Product.ProductStatus.ACTIVE);
        product.setStock(100); // Default stock

        // Add images using the record constructor
        List<Product.ProductImage> images = new ArrayList<>();
        Product.ProductImage mainImage = new Product.ProductImage(
            "https://via.placeholder.com/600x600?text=" + name.replace(" ", "+"),
            name,
            0
        );
        images.add(mainImage);
        product.setImages(images);

        // Add attributes
        Map<String, Object> attributes = new HashMap<>();
        attributes.put("featured", Math.random() > 0.7);
        attributes.put("tags", Arrays.asList(categoryId, "new-arrival"));
        product.setAttributes(attributes);

        product.setCreatedAt(Instant.now());
        product.setUpdatedAt(Instant.now());

        return product;
    }

    private Mono<Void> seedInventory() {
        log.info("Seeding inventory...");

        return productRepository.findAll()
            .filter(product -> "test-tenant".equals(product.getTenantId()))
            .flatMap(product -> {
                Inventory inventory = new Inventory();
                inventory.setId(UUID.randomUUID().toString());
                inventory.setProductId(product.getId());
                inventory.setTenantId(product.getTenantId());

                // Random inventory levels
                int quantity = (int) (Math.random() * 100) + 10;
                inventory.setQuantity(quantity);
                inventory.setReservedQuantity(0);

                inventory.setLowStockThreshold(10);
                inventory.setAllowBackorder(false);
                inventory.setTrackInventory(true);
                inventory.setCreatedAt(Instant.now());
                inventory.setUpdatedAt(Instant.now());

                return inventoryRepository.save(inventory)
                    .doOnNext(inv -> log.debug("Created inventory for product: {} (qty: {})",
                        product.getName(), inv.getAvailableQuantity()));
            })
            .then();
    }
}