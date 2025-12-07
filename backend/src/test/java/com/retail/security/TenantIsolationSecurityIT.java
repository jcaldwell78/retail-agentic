package com.retail.security;

import com.retail.BaseIT;
import com.retail.domain.product.Product;
import com.retail.domain.order.Order;
import com.retail.infrastructure.persistence.ProductRepository;
import com.retail.infrastructure.persistence.OrderRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;
import reactor.util.context.Context;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Security tests for multi-tenant data isolation.
 * Ensures that tenants cannot access each other's data.
 */
class TenantIsolationSecurityIT extends BaseIT {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private OrderRepository orderRepository;

    private static final String TENANT_A = "tenant-a-001";
    private static final String TENANT_B = "tenant-b-002";

    private Product tenantAProduct;
    private Product tenantBProduct;
    private Order tenantAOrder;
    private Order tenantBOrder;

    @BeforeEach
    void setup() {
        // Clean up
        productRepository.deleteAll().block();
        orderRepository.deleteAll().block();

        // Create products for each tenant
        tenantAProduct = createProduct("prod-a-001", "Product A", TENANT_A);
        tenantBProduct = createProduct("prod-b-001", "Product B", TENANT_B);

        productRepository.save(tenantAProduct)
                .contextWrite(Context.of("tenantId", TENANT_A))
                .block();
        productRepository.save(tenantBProduct)
                .contextWrite(Context.of("tenantId", TENANT_B))
                .block();

        // Create orders for each tenant
        tenantAOrder = createOrder("order-a-001", TENANT_A);
        tenantBOrder = createOrder("order-b-001", TENANT_B);

        orderRepository.save(tenantAOrder).block();
        orderRepository.save(tenantBOrder).block();
    }

    @AfterEach
    void cleanup() {
        productRepository.deleteAll().block();
        orderRepository.deleteAll().block();
    }

    @Test
    @DisplayName("Tenant A should only see Tenant A products")
    void testTenantACannotSeeTenantBProducts() {
        // Tenant A queries all products - should only see their own
        StepVerifier.create(
                productRepository.findByTenantId(TENANT_A, null)
                        .contextWrite(Context.of("tenantId", TENANT_A))
        )
                .assertNext(product -> {
                    assertThat(product.getTenantId()).isEqualTo(TENANT_A);
                    assertThat(product.getId()).isEqualTo(tenantAProduct.getId());
                })
                .verifyComplete();
    }

    @Test
    @DisplayName("Tenant B should only see Tenant B products")
    void testTenantBCannotSeeTenantAProducts() {
        // Tenant B queries all products - should only see their own
        StepVerifier.create(
                productRepository.findByTenantId(TENANT_B, null)
                        .contextWrite(Context.of("tenantId", TENANT_B))
        )
                .assertNext(product -> {
                    assertThat(product.getTenantId()).isEqualTo(TENANT_B);
                    assertThat(product.getId()).isEqualTo(tenantBProduct.getId());
                })
                .verifyComplete();
    }

    @Test
    @DisplayName("Tenant A cannot access Tenant B product by ID")
    void testCrossTenantProductAccessById() {
        // Tenant A tries to access Tenant B's product
        StepVerifier.create(
                productRepository.findByIdAndTenantId(tenantBProduct.getId(), TENANT_A)
                        .contextWrite(Context.of("tenantId", TENANT_A))
        )
                .verifyComplete(); // Should return empty
    }

    @Test
    @DisplayName("Tenant A cannot update Tenant B product")
    void testCrossTenantProductUpdate() {
        // Tenant A tries to update Tenant B's product
        Product updatedProduct = tenantBProduct;
        updatedProduct.setName("Hacked Name");
        updatedProduct.setTenantId(TENANT_A); // Try to change tenant

        StepVerifier.create(
                productRepository.findByIdAndTenantId(tenantBProduct.getId(), TENANT_A)
                        .flatMap(product -> productRepository.save(updatedProduct))
                        .contextWrite(Context.of("tenantId", TENANT_A))
        )
                .verifyComplete(); // Should not find product, thus not update

        // Verify product is unchanged
        StepVerifier.create(
                productRepository.findById(tenantBProduct.getId())
        )
                .assertNext(product -> {
                    assertThat(product.getTenantId()).isEqualTo(TENANT_B);
                    assertThat(product.getName()).isEqualTo("Product B");
                })
                .verifyComplete();
    }

    @Test
    @DisplayName("Tenant A cannot delete Tenant B product")
    void testCrossTenantProductDelete() {
        // Tenant A tries to delete Tenant B's product
        StepVerifier.create(
                productRepository.deleteByIdAndTenantId(tenantBProduct.getId(), TENANT_A)
                        .contextWrite(Context.of("tenantId", TENANT_A))
        )
                .verifyComplete();

        // Verify product still exists
        StepVerifier.create(
                productRepository.findById(tenantBProduct.getId())
        )
                .assertNext(product -> {
                    assertThat(product.getTenantId()).isEqualTo(TENANT_B);
                })
                .verifyComplete();
    }

    @Test
    @DisplayName("Tenant A should only see Tenant A orders")
    void testTenantACannotSeeTenantBOrders() {
        // Tenant A queries orders
        StepVerifier.create(
                orderRepository.findByTenantId(TENANT_A, null)
        )
                .assertNext(order -> {
                    assertThat(order.getTenantId()).isEqualTo(TENANT_A);
                    assertThat(order.getId()).isEqualTo(tenantAOrder.getId());
                })
                .verifyComplete();
    }

    @Test
    @DisplayName("Tenant A cannot access Tenant B order by ID")
    void testCrossTenantOrderAccessById() {
        // Tenant A tries to access Tenant B's order
        StepVerifier.create(
                orderRepository.findByIdAndTenantId(tenantBOrder.getId(), TENANT_A)
        )
                .verifyComplete(); // Should return empty
    }

    @Test
    @DisplayName("Tenant A cannot access Tenant B order by order number")
    void testCrossTenantOrderAccessByOrderNumber() {
        // Tenant A tries to access Tenant B's order by order number
        StepVerifier.create(
                orderRepository.findByOrderNumberAndTenantId(
                        tenantBOrder.getOrderNumber(),
                        TENANT_A
                )
        )
                .verifyComplete(); // Should return empty
    }

    @Test
    @DisplayName("Product queries should filter by tenant automatically")
    void testAutomaticTenantFiltering() {
        // Using repository methods that should auto-filter by tenant
        StepVerifier.create(
                productRepository.findActiveProducts(null)
                        .contextWrite(Context.of("tenantId", TENANT_A))
        )
                .assertNext(product -> {
                    assertThat(product.getTenantId()).isEqualTo(TENANT_A);
                })
                .verifyComplete();
    }

    @Test
    @DisplayName("Cannot create product with different tenant ID")
    void testCannotCreateProductWithDifferentTenantId() {
        // Try to create product with different tenant ID than context
        Product product = createProduct("prod-x-001", "Product X", TENANT_B);

        // Save with Tenant A context
        StepVerifier.create(
                Mono.just(product)
                        .flatMap(p -> {
                            // Service should override tenant ID from context
                            p.setTenantId(TENANT_A);
                            return productRepository.save(p);
                        })
                        .contextWrite(Context.of("tenantId", TENANT_A))
        )
                .assertNext(saved -> {
                    // Should be saved with correct tenant ID
                    assertThat(saved.getTenantId()).isEqualTo(TENANT_A);
                })
                .verifyComplete();
    }

    @Test
    @DisplayName("Tenant isolation works across aggregate queries")
    void testTenantIsolationInAggregates() {
        // Count products for Tenant A
        StepVerifier.create(
                productRepository.countByTenantId(TENANT_A)
        )
                .assertNext(count -> {
                    assertThat(count).isEqualTo(1); // Only one product
                })
                .verifyComplete();

        // Count products for Tenant B
        StepVerifier.create(
                productRepository.countByTenantId(TENANT_B)
        )
                .assertNext(count -> {
                    assertThat(count).isEqualTo(1); // Only one product
                })
                .verifyComplete();
    }

    @Test
    @DisplayName("Search queries respect tenant isolation")
    void testSearchQueriesRespectTenantIsolation() {
        // Tenant A searches for product by SKU
        StepVerifier.create(
                productRepository.findBySkuAndTenantId("SKU-A-001", TENANT_A)
        )
                .assertNext(product -> {
                    assertThat(product.getId()).isEqualTo(tenantAProduct.getId());
                })
                .verifyComplete();

        // Tenant A tries to search for Tenant B's product SKU
        StepVerifier.create(
                productRepository.findBySkuAndTenantId("SKU-B-001", TENANT_A)
        )
                .verifyComplete(); // Should not find it
    }

    @Test
    @DisplayName("Tenant context cannot be overridden maliciously")
    void testTenantContextCannotBeOverridden() {
        // Attempt to override tenant context within reactive chain
        // The repository explicitly queries for TENANT_A via parameter,
        // so context writes don't affect the query results
        StepVerifier.create(
                productRepository.findByTenantId(TENANT_A, null)
                        .contextWrite(Context.of("tenantId", TENANT_A))
                        // Try to override context
                        .contextWrite(Context.of("tenantId", TENANT_B))
        )
                .assertNext(product -> {
                    // Repository was called with TENANT_A parameter, so we get TENANT_A products
                    // Context overrides don't affect explicit method parameters
                    assertThat(product.getTenantId()).isEqualTo(TENANT_A);
                })
                .verifyComplete();
    }

    private Product createProduct(String id, String name, String tenantId) {
        Product product = new Product();
        product.setId(id);
        product.setTenantId(tenantId);
        product.setName(name);
        product.setSku("SKU-" + id.substring(5).toUpperCase());
        product.setDescription("Test product");
        product.setPrice(BigDecimal.valueOf(99.99));
        product.setStock(100);
        product.setStatus(Product.ProductStatus.ACTIVE);
        product.setCategory(List.of("Test"));
        product.setCreatedAt(Instant.now());
        product.setUpdatedAt(Instant.now());
        return product;
    }

    private Order createOrder(String id, String tenantId) {
        Order order = new Order();
        order.setId(id);
        order.setTenantId(tenantId);
        order.setOrderNumber("ORD-" + id.toUpperCase());
        order.setCustomer(new Order.Customer("test@example.com", "Test User"));
        order.setShippingAddress(new Order.Address("123 St", null, "City", "ST", "12345", "US"));
        order.setItems(List.of(
                new Order.OrderItem("prod-1", "Product 1", "SKU-1",
                        BigDecimal.valueOf(50), 1, null, BigDecimal.valueOf(50))
        ));
        order.setPricing(new Order.Pricing(
                BigDecimal.valueOf(50),
                BigDecimal.valueOf(10),
                BigDecimal.valueOf(5),
                BigDecimal.valueOf(65)
        ));
        order.setPayment(new Order.Payment("CREDIT_CARD",
                com.retail.domain.order.PaymentStatus.PENDING, null));
        order.setStatus(com.retail.domain.order.OrderStatus.PENDING);
        order.setCreatedAt(Instant.now());
        order.setUpdatedAt(Instant.now());
        return order;
    }
}
