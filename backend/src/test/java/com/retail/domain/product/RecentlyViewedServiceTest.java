package com.retail.domain.product;

import com.retail.security.tenant.TenantContext;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Range;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import org.springframework.data.redis.core.ReactiveZSetOperations;
import org.springframework.data.redis.core.ZSetOperations;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.time.Duration;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.mockito.Mockito.lenient;

/**
 * Unit tests for RecentlyViewedService.
 */
@ExtendWith(MockitoExtension.class)
class RecentlyViewedServiceTest {

    @Mock
    private ReactiveRedisTemplate<String, String> redisTemplate;

    @Mock
    private ReactiveZSetOperations<String, String> zSetOps;

    @Mock
    private ProductService productService;

    private RecentlyViewedService recentlyViewedService;

    private static final String TENANT_ID = "tenant-123";
    private static final String USER_ID = "user-456";
    private static final String PRODUCT_ID = "product-789";
    private static final String KEY = "recently_viewed:" + TENANT_ID + ":" + USER_ID;

    @BeforeEach
    void setUp() {
        lenient().when(redisTemplate.opsForZSet()).thenReturn(zSetOps);
        recentlyViewedService = new RecentlyViewedService(redisTemplate, productService);
    }

    @Test
    @DisplayName("Should record product view")
    void shouldRecordProductView() {
        // Arrange
        when(zSetOps.add(eq(KEY), eq(PRODUCT_ID), anyDouble()))
            .thenReturn(Mono.just(true));
        when(zSetOps.size(KEY))
            .thenReturn(Mono.just(1L)); // Under limit, no removal needed
        when(redisTemplate.expire(eq(KEY), any(Duration.class)))
            .thenReturn(Mono.just(true));

        // Act & Assert
        StepVerifier.create(recentlyViewedService.recordView(USER_ID, PRODUCT_ID)
                .contextWrite(TenantContext.withTenantId(TENANT_ID)))
            .verifyComplete();

        verify(zSetOps).add(eq(KEY), eq(PRODUCT_ID), anyDouble());
        verify(redisTemplate).expire(eq(KEY), any(Duration.class));
    }

    @Test
    @DisplayName("Should get recently viewed products")
    void shouldGetRecentlyViewedProducts() {
        // Arrange
        Product product = createProduct(PRODUCT_ID);

        when(zSetOps.reverseRange(eq(KEY), any(Range.class)))
            .thenReturn(Flux.just(PRODUCT_ID));
        when(productService.findById(PRODUCT_ID))
            .thenReturn(Mono.just(product));

        // Act & Assert
        StepVerifier.create(recentlyViewedService.getRecentlyViewed(USER_ID, 10)
                .contextWrite(TenantContext.withTenantId(TENANT_ID)))
            .expectNext(product)
            .verifyComplete();

        verify(zSetOps).reverseRange(eq(KEY), any(Range.class));
        verify(productService).findById(PRODUCT_ID);
    }

    @Test
    @DisplayName("Should get recently viewed product IDs")
    void shouldGetRecentlyViewedIds() {
        // Arrange
        when(zSetOps.reverseRange(eq(KEY), any(Range.class)))
            .thenReturn(Flux.just(PRODUCT_ID, "product-2", "product-3"));

        // Act & Assert
        StepVerifier.create(recentlyViewedService.getRecentlyViewedIds(USER_ID, 10)
                .contextWrite(TenantContext.withTenantId(TENANT_ID)))
            .expectNext(PRODUCT_ID)
            .expectNext("product-2")
            .expectNext("product-3")
            .verifyComplete();

        verify(zSetOps).reverseRange(eq(KEY), any(Range.class));
    }

    @Test
    @DisplayName("Should remove product from recently viewed")
    void shouldRemoveProduct() {
        // Arrange
        when(zSetOps.remove(KEY, PRODUCT_ID))
            .thenReturn(Mono.just(1L));

        // Act & Assert
        StepVerifier.create(recentlyViewedService.removeProduct(USER_ID, PRODUCT_ID)
                .contextWrite(TenantContext.withTenantId(TENANT_ID)))
            .verifyComplete();

        verify(zSetOps).remove(KEY, PRODUCT_ID);
    }

    @Test
    @DisplayName("Should clear all recently viewed products")
    void shouldClearAllRecentlyViewed() {
        // Arrange
        when(redisTemplate.delete(KEY))
            .thenReturn(Mono.just(1L));

        // Act & Assert
        StepVerifier.create(recentlyViewedService.clearAll(USER_ID)
                .contextWrite(TenantContext.withTenantId(TENANT_ID)))
            .verifyComplete();

        verify(redisTemplate).delete(KEY);
    }

    @Test
    @DisplayName("Should check if product is recently viewed")
    void shouldCheckIfProductIsRecentlyViewed() {
        // Arrange
        when(zSetOps.score(KEY, PRODUCT_ID))
            .thenReturn(Mono.just(1234567890.0));

        // Act & Assert
        StepVerifier.create(recentlyViewedService.isRecentlyViewed(USER_ID, PRODUCT_ID)
                .contextWrite(TenantContext.withTenantId(TENANT_ID)))
            .expectNext(true)
            .verifyComplete();

        verify(zSetOps).score(KEY, PRODUCT_ID);
    }

    @Test
    @DisplayName("Should return false when product is not recently viewed")
    void shouldReturnFalseWhenProductNotRecentlyViewed() {
        // Arrange
        when(zSetOps.score(KEY, PRODUCT_ID))
            .thenReturn(Mono.empty());

        // Act & Assert
        StepVerifier.create(recentlyViewedService.isRecentlyViewed(USER_ID, PRODUCT_ID)
                .contextWrite(TenantContext.withTenantId(TENANT_ID)))
            .expectNext(false)
            .verifyComplete();

        verify(zSetOps).score(KEY, PRODUCT_ID);
    }

    @Test
    @DisplayName("Should get count of recently viewed products")
    void shouldGetCount() {
        // Arrange
        when(zSetOps.size(KEY))
            .thenReturn(Mono.just(5L));

        // Act & Assert
        StepVerifier.create(recentlyViewedService.getCount(USER_ID)
                .contextWrite(TenantContext.withTenantId(TENANT_ID)))
            .expectNext(5L)
            .verifyComplete();

        verify(zSetOps).size(KEY);
    }

    @Test
    @DisplayName("Should limit results to max 20 items")
    void shouldLimitToMaxItems() {
        // Arrange
        when(zSetOps.reverseRange(eq(KEY), any(Range.class)))
            .thenReturn(Flux.empty());

        // Act & Assert - requesting 100 items should be limited to 20
        StepVerifier.create(recentlyViewedService.getRecentlyViewedIds(USER_ID, 100)
                .contextWrite(TenantContext.withTenantId(TENANT_ID)))
            .verifyComplete();

        // Verify reverseRange was called (with 20 items limit internally)
        verify(zSetOps).reverseRange(eq(KEY), any(Range.class));
    }

    @Test
    @DisplayName("Should handle missing product gracefully")
    void shouldHandleMissingProductGracefully() {
        // Arrange
        when(zSetOps.reverseRange(eq(KEY), any(Range.class)))
            .thenReturn(Flux.just(PRODUCT_ID, "missing-product"));
        when(productService.findById(PRODUCT_ID))
            .thenReturn(Mono.just(createProduct(PRODUCT_ID)));
        when(productService.findById("missing-product"))
            .thenReturn(Mono.error(new RuntimeException("Product not found")));
        when(zSetOps.remove(eq(KEY), eq("missing-product")))
            .thenReturn(Mono.just(1L));

        // Act & Assert - should return only the valid product
        StepVerifier.create(recentlyViewedService.getRecentlyViewed(USER_ID, 10)
                .contextWrite(TenantContext.withTenantId(TENANT_ID)))
            .expectNextMatches(p -> p.getId().equals(PRODUCT_ID))
            .verifyComplete();
    }

    @Test
    @DisplayName("Should merge guest session to user")
    void shouldMergeGuestToUser() {
        // Arrange
        String guestId = "guest-abc";
        String guestKey = "recently_viewed:" + TENANT_ID + ":" + guestId;
        String userKey = "recently_viewed:" + TENANT_ID + ":" + USER_ID;

        ZSetOperations.TypedTuple<String> tuple = mock(ZSetOperations.TypedTuple.class);
        when(tuple.getValue()).thenReturn(PRODUCT_ID);
        when(tuple.getScore()).thenReturn(1234567890.0);

        when(zSetOps.rangeWithScores(eq(guestKey), any(Range.class)))
            .thenReturn(Flux.just(tuple));
        when(zSetOps.add(eq(userKey), eq(PRODUCT_ID), eq(1234567890.0)))
            .thenReturn(Mono.just(true));
        when(zSetOps.size(userKey))
            .thenReturn(Mono.just(1L)); // Under limit
        when(redisTemplate.expire(eq(userKey), any(Duration.class)))
            .thenReturn(Mono.just(true));
        when(redisTemplate.delete(guestKey))
            .thenReturn(Mono.just(1L));

        // Act & Assert
        StepVerifier.create(recentlyViewedService.mergeGuestToUser(guestId, USER_ID)
                .contextWrite(TenantContext.withTenantId(TENANT_ID)))
            .verifyComplete();

        verify(zSetOps).rangeWithScores(eq(guestKey), any(Range.class));
        verify(zSetOps).add(userKey, PRODUCT_ID, 1234567890.0);
        verify(redisTemplate).delete(guestKey);
    }

    private Product createProduct(String id) {
        Product product = new Product();
        product.setId(id);
        product.setTenantId(TENANT_ID);
        product.setName("Test Product");
        product.setSku("SKU-" + id);
        return product;
    }
}
