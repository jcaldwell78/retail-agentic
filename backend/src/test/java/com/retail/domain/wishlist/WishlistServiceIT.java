package com.retail.domain.wishlist;

import com.retail.BaseTestConfiguration;
import com.retail.domain.tenant.Tenant;
import com.retail.infrastructure.persistence.TenantRepository;
import com.retail.infrastructure.persistence.WishlistRepository;
import com.retail.security.tenant.TenantContext;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Integration test for WishlistService with tenant isolation.
 * Verifies wishlist operations and multi-tenant data isolation.
 */
@SpringBootTest
@ActiveProfiles("test")
@Import(BaseTestConfiguration.class)
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class WishlistServiceIT {

    @Autowired
    private WishlistService wishlistService;

    @Autowired
    private WishlistRepository wishlistRepository;

    @Autowired
    private TenantRepository tenantRepository;

    private static final String TENANT_A_ID = "tenant-a-test";
    private static final String TENANT_B_ID = "tenant-b-test";
    private static final String USER_A_ID = "user-a";
    private static final String USER_B_ID = "user-b";

    @BeforeEach
    void setup() {
        // Clean up any existing test data
        wishlistRepository.deleteAll().block();
        tenantRepository.deleteAll().block();

        // Create test tenants
        Tenant tenantA = createTestTenant(TENANT_A_ID, "tenant-a");
        Tenant tenantB = createTestTenant(TENANT_B_ID, "tenant-b");

        tenantRepository.save(tenantA).block();
        tenantRepository.save(tenantB).block();
    }

    @Test
    @Order(1)
    @DisplayName("Should create wishlist for user in specific tenant")
    void shouldCreateWishlistForUser() {
        // When
        Mono<Wishlist> result = wishlistService.getUserWishlist(USER_A_ID)
                .contextWrite(TenantContext.withTenantId(TENANT_A_ID));

        // Then
        StepVerifier.create(result)
                .assertNext(wishlist -> {
                    Assertions.assertNotNull(wishlist.getId());
                    Assertions.assertEquals(TENANT_A_ID, wishlist.getTenantId());
                    Assertions.assertEquals(USER_A_ID, wishlist.getUserId());
                    Assertions.assertEquals(0, wishlist.getItemCount());
                    Assertions.assertNotNull(wishlist.getCreatedAt());
                })
                .verifyComplete();
    }

    @Test
    @Order(2)
    @DisplayName("Should add item to wishlist")
    void shouldAddItemToWishlist() {
        // Given
        WishlistItem item = createTestItem("product-1", "Test Product", new BigDecimal("29.99"));

        // When
        Mono<Wishlist> result = wishlistService.addItem(USER_A_ID, item)
                .contextWrite(TenantContext.withTenantId(TENANT_A_ID));

        // Then
        StepVerifier.create(result)
                .assertNext(wishlist -> {
                    Assertions.assertEquals(1, wishlist.getItemCount());
                    Assertions.assertTrue(wishlist.findItem(item.getId()).isPresent());
                })
                .verifyComplete();
    }

    @Test
    @Order(3)
    @DisplayName("Should not add duplicate item to wishlist")
    void shouldNotAddDuplicateItem() {
        // Given - Add item first time
        WishlistItem item = createTestItem("product-1", "Test Product", new BigDecimal("29.99"));
        wishlistService.addItem(USER_A_ID, item)
                .contextWrite(TenantContext.withTenantId(TENANT_A_ID))
                .block();

        // When - Try to add same item again
        WishlistItem duplicate = createTestItem("product-1", "Test Product", new BigDecimal("29.99"));
        Mono<Wishlist> result = wishlistService.addItem(USER_A_ID, duplicate)
                .contextWrite(TenantContext.withTenantId(TENANT_A_ID));

        // Then - Should still have only one item
        StepVerifier.create(result)
                .assertNext(wishlist -> {
                    Assertions.assertEquals(1, wishlist.getItemCount());
                })
                .verifyComplete();
    }

    @Test
    @Order(4)
    @DisplayName("Should remove item from wishlist by item ID")
    void shouldRemoveItemById() {
        // Given - Add item to wishlist
        WishlistItem item = createTestItem("product-1", "Test Product", new BigDecimal("29.99"));
        Wishlist wishlist = wishlistService.addItem(USER_A_ID, item)
                .contextWrite(TenantContext.withTenantId(TENANT_A_ID))
                .block();

        String itemId = wishlist.getItems().get(0).getId();

        // When - Remove item
        Mono<Wishlist> result = wishlistService.removeItem(USER_A_ID, itemId)
                .contextWrite(TenantContext.withTenantId(TENANT_A_ID));

        // Then
        StepVerifier.create(result)
                .assertNext(updated -> {
                    Assertions.assertEquals(0, updated.getItemCount());
                })
                .verifyComplete();
    }

    @Test
    @Order(5)
    @DisplayName("Should remove item from wishlist by product ID")
    void shouldRemoveItemByProductId() {
        // Given - Add item to wishlist
        WishlistItem item = createTestItem("product-1", "Test Product", new BigDecimal("29.99"));
        wishlistService.addItem(USER_A_ID, item)
                .contextWrite(TenantContext.withTenantId(TENANT_A_ID))
                .block();

        // When - Remove by product ID
        Mono<Wishlist> result = wishlistService.removeItemByProduct(USER_A_ID, "product-1", null)
                .contextWrite(TenantContext.withTenantId(TENANT_A_ID));

        // Then
        StepVerifier.create(result)
                .assertNext(updated -> {
                    Assertions.assertEquals(0, updated.getItemCount());
                })
                .verifyComplete();
    }

    @Test
    @Order(6)
    @DisplayName("Should update item preferences")
    void shouldUpdateItemPreferences() {
        // Given - Add item to wishlist
        WishlistItem item = createTestItem("product-1", "Test Product", new BigDecimal("29.99"));
        Wishlist wishlist = wishlistService.addItem(USER_A_ID, item)
                .contextWrite(TenantContext.withTenantId(TENANT_A_ID))
                .block();

        String itemId = wishlist.getItems().get(0).getId();

        // When - Update item with price alert enabled
        WishlistItem updates = new WishlistItem();
        updates.setPriceAlertEnabled(true);
        updates.setPriceAlertThreshold(10);
        updates.setNotes("Buy when on sale");

        Mono<Wishlist> result = wishlistService.updateItem(USER_A_ID, itemId, updates)
                .contextWrite(TenantContext.withTenantId(TENANT_A_ID));

        // Then
        StepVerifier.create(result)
                .assertNext(updated -> {
                    WishlistItem updatedItem = updated.findItem(itemId).orElseThrow();
                    Assertions.assertTrue(updatedItem.getPriceAlertEnabled());
                    Assertions.assertEquals(10, updatedItem.getPriceAlertThreshold());
                    Assertions.assertEquals("Buy when on sale", updatedItem.getNotes());
                })
                .verifyComplete();
    }

    @Test
    @Order(7)
    @DisplayName("Should clear all items from wishlist")
    void shouldClearAllItems() {
        // Given - Add multiple items
        WishlistItem item1 = createTestItem("product-1", "Product 1", new BigDecimal("29.99"));
        WishlistItem item2 = createTestItem("product-2", "Product 2", new BigDecimal("39.99"));

        wishlistService.addItem(USER_A_ID, item1)
                .contextWrite(TenantContext.withTenantId(TENANT_A_ID))
                .block();
        wishlistService.addItem(USER_A_ID, item2)
                .contextWrite(TenantContext.withTenantId(TENANT_A_ID))
                .block();

        // When - Clear all items
        Mono<Wishlist> result = wishlistService.clearAllItems(USER_A_ID)
                .contextWrite(TenantContext.withTenantId(TENANT_A_ID));

        // Then
        StepVerifier.create(result)
                .assertNext(updated -> {
                    Assertions.assertEquals(0, updated.getItemCount());
                })
                .verifyComplete();
    }

    @Test
    @Order(8)
    @DisplayName("Should share wishlist and generate token")
    void shouldShareWishlist() {
        // Given - Create wishlist
        wishlistService.getUserWishlist(USER_A_ID)
                .contextWrite(TenantContext.withTenantId(TENANT_A_ID))
                .block();

        // When - Share wishlist
        Mono<String> result = wishlistService.shareWishlist(USER_A_ID, true)
                .contextWrite(TenantContext.withTenantId(TENANT_A_ID));

        // Then
        StepVerifier.create(result)
                .assertNext(shareToken -> {
                    Assertions.assertNotNull(shareToken);
                    Assertions.assertFalse(shareToken.isEmpty());

                    // Verify we can retrieve the shared wishlist
                    Mono<Wishlist> sharedWishlist = wishlistService.getSharedWishlist(shareToken);
                    StepVerifier.create(sharedWishlist)
                            .assertNext(wishlist -> {
                                Assertions.assertEquals(USER_A_ID, wishlist.getUserId());
                                Assertions.assertTrue(wishlist.getIsPublic());
                                Assertions.assertTrue(wishlist.getAllowPurchaseByOthers());
                            })
                            .verifyComplete();
                })
                .verifyComplete();
    }

    @Test
    @Order(9)
    @DisplayName("Should disable wishlist sharing")
    void shouldDisableSharing() {
        // Given - Create and share wishlist
        wishlistService.getUserWishlist(USER_A_ID)
                .contextWrite(TenantContext.withTenantId(TENANT_A_ID))
                .block();
        wishlistService.shareWishlist(USER_A_ID, false)
                .contextWrite(TenantContext.withTenantId(TENANT_A_ID))
                .block();

        // When - Disable sharing
        Mono<Wishlist> result = wishlistService.disableSharing(USER_A_ID)
                .contextWrite(TenantContext.withTenantId(TENANT_A_ID));

        // Then
        StepVerifier.create(result)
                .assertNext(wishlist -> {
                    Assertions.assertFalse(wishlist.getIsPublic());
                })
                .verifyComplete();
    }

    @Test
    @Order(10)
    @DisplayName("Should isolate wishlists by tenant")
    void shouldIsolateWishlistsByTenant() {
        // Given - Create wishlist for Tenant A
        WishlistItem itemA = createTestItem("product-a", "Product A", new BigDecimal("29.99"));
        wishlistService.addItem(USER_A_ID, itemA)
                .contextWrite(TenantContext.withTenantId(TENANT_A_ID))
                .block();

        // Given - Create wishlist for Tenant B
        WishlistItem itemB = createTestItem("product-b", "Product B", new BigDecimal("39.99"));
        wishlistService.addItem(USER_B_ID, itemB)
                .contextWrite(TenantContext.withTenantId(TENANT_B_ID))
                .block();

        // When - Get wishlist for User A in Tenant A context
        Mono<Wishlist> tenantAWishlist = wishlistService.getUserWishlist(USER_A_ID)
                .contextWrite(TenantContext.withTenantId(TENANT_A_ID));

        // Then - Should only see Tenant A's wishlist
        StepVerifier.create(tenantAWishlist)
                .assertNext(wishlist -> {
                    Assertions.assertEquals(TENANT_A_ID, wishlist.getTenantId());
                    Assertions.assertEquals(1, wishlist.getItemCount());
                    Assertions.assertEquals("product-a", wishlist.getItems().get(0).getProductId());
                })
                .verifyComplete();

        // When - Try to get User A's wishlist in Tenant B context
        Mono<Wishlist> crossTenantAttempt = wishlistService.getUserWishlist(USER_A_ID)
                .contextWrite(TenantContext.withTenantId(TENANT_B_ID));

        // Then - Should create new empty wishlist (USER_A doesn't exist in Tenant B)
        StepVerifier.create(crossTenantAttempt)
                .assertNext(wishlist -> {
                    Assertions.assertEquals(TENANT_B_ID, wishlist.getTenantId());
                    Assertions.assertEquals(USER_A_ID, wishlist.getUserId());
                    Assertions.assertEquals(0, wishlist.getItemCount());
                })
                .verifyComplete();
    }

    @Test
    @Order(11)
    @DisplayName("Should delete wishlist")
    void shouldDeleteWishlist() {
        // Given - Create wishlist with items
        WishlistItem item = createTestItem("product-1", "Test Product", new BigDecimal("29.99"));
        wishlistService.addItem(USER_A_ID, item)
                .contextWrite(TenantContext.withTenantId(TENANT_A_ID))
                .block();

        // When - Delete wishlist
        Mono<Void> result = wishlistService.deleteWishlist(USER_A_ID)
                .contextWrite(TenantContext.withTenantId(TENANT_A_ID));

        // Then - Delete should complete
        StepVerifier.create(result)
                .verifyComplete();

        // Verify new wishlist is created when accessed again
        Mono<Wishlist> newWishlist = wishlistService.getUserWishlist(USER_A_ID)
                .contextWrite(TenantContext.withTenantId(TENANT_A_ID));

        StepVerifier.create(newWishlist)
                .assertNext(wishlist -> {
                    Assertions.assertEquals(0, wishlist.getItemCount());
                })
                .verifyComplete();
    }

    @Test
    @Order(12)
    @DisplayName("Should count wishlists for tenant")
    void shouldCountWishlists() {
        // Given - Create wishlists for different users in Tenant A
        wishlistService.getUserWishlist(USER_A_ID)
                .contextWrite(TenantContext.withTenantId(TENANT_A_ID))
                .block();
        wishlistService.getUserWishlist(USER_B_ID)
                .contextWrite(TenantContext.withTenantId(TENANT_A_ID))
                .block();

        // When - Count wishlists
        Mono<Long> result = wishlistService.countWishlists()
                .contextWrite(TenantContext.withTenantId(TENANT_A_ID));

        // Then
        StepVerifier.create(result)
                .assertNext(count -> {
                    Assertions.assertEquals(2L, count);
                })
                .verifyComplete();
    }

    // Helper methods

    private Tenant createTestTenant(String id, String subdomain) {
        Tenant tenant = new Tenant();
        tenant.setId(id);
        tenant.setSubdomain(subdomain);
        tenant.setName("Test Store " + subdomain);
        tenant.setContactEmail("test@" + subdomain + ".com");
        tenant.setCreatedAt(Instant.now());
        tenant.setUpdatedAt(Instant.now());
        tenant.setBranding(new Tenant.Branding(null));
        tenant.setSettings(new Tenant.TenantSettings());
        return tenant;
    }

    private WishlistItem createTestItem(String productId, String name, BigDecimal price) {
        WishlistItem item = new WishlistItem();
        item.setId(UUID.randomUUID().toString());
        item.setProductId(productId);
        item.setName(name);
        item.setCurrentPrice(price);
        item.setPriceWhenAdded(price);
        item.setInStock(true);
        item.setAddedAt(Instant.now());
        return item;
    }
}
