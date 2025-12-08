package com.retail.domain.gdpr;

import com.retail.domain.cart.Cart;
import com.retail.domain.cart.PersistedCart;
import com.retail.domain.order.Order;
import com.retail.domain.order.OrderStatus;
import com.retail.domain.review.ProductReview;
import com.retail.domain.user.Address;
import com.retail.domain.user.User;
import com.retail.domain.user.UserService;
import com.retail.domain.wishlist.Wishlist;
import com.retail.domain.wishlist.WishlistItem;
import com.retail.infrastructure.persistence.PersistedCartRepository;
import com.retail.infrastructure.persistence.ProductReviewRepository;
import com.retail.infrastructure.persistence.WishlistRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.query.Query;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("GdprDataExportService Tests")
class GdprDataExportServiceTest {

    @Mock
    private UserService userService;

    @Mock
    private ReactiveMongoTemplate mongoTemplate;

    @Mock
    private PersistedCartRepository cartRepository;

    @Mock
    private ProductReviewRepository reviewRepository;

    @Mock
    private WishlistRepository wishlistRepository;

    private GdprDataExportService gdprDataExportService;

    private User testUser;
    private Order testOrder;
    private PersistedCart testCart;
    private ProductReview testReview;
    private Wishlist testWishlist;
    private WishlistItem testWishlistItem;

    @BeforeEach
    void setUp() {
        gdprDataExportService = new GdprDataExportService(
            userService,
            mongoTemplate,
            cartRepository,
            reviewRepository,
            wishlistRepository
        );

        // Set up test user
        testUser = new User("tenant-1", "test@example.com", "John", "Doe");
        testUser.setId("user-123");
        testUser.setPhone("+1234567890");

        Address address = new Address("John", "Doe", "123 Test St", "Test City", "NY", "12345", "US");
        testUser.addAddress(address);

        // Set up test order
        testOrder = new Order();
        testOrder.setId("order-123");
        testOrder.setOrderNumber("ORD-001");
        testOrder.setTenantId("tenant-1");
        testOrder.setStatus(OrderStatus.DELIVERED);
        testOrder.setPricing(new Order.Pricing(
            new BigDecimal("89.99"),
            new BigDecimal("5.00"),
            new BigDecimal("5.00"),
            new BigDecimal("99.99")
        ));
        testOrder.setCreatedAt(Instant.now());

        // Set up test cart
        testCart = new PersistedCart();
        testCart.setId("cart-123");
        testCart.setUserId("user-123");
        testCart.setTenantId("tenant-1");
        Cart cart = new Cart();
        // CartItem record: id, productId, name, sku, price, quantity, attributes, imageUrl, subtotal
        Cart.CartItem cartItem = new Cart.CartItem(
            "item-1", "prod-1", "Test Product", "SKU001",
            new BigDecimal("49.99"), 2, Map.of(),
            "http://example.com/image.jpg", new BigDecimal("99.98")
        );
        cart.setItems(List.of(cartItem));
        testCart.setCart(cart);
        testCart.setCreatedAt(Instant.now());

        // Set up test review
        testReview = new ProductReview();
        testReview.setId("review-123");
        testReview.setTenantId("tenant-1");
        testReview.setUserId("user-123");
        testReview.setProductId("prod-1");
        testReview.setRating(5);
        testReview.setTitle("Great product!");
        testReview.setComment("Really enjoyed this product.");
        testReview.setVerifiedPurchase(true);
        testReview.setCreatedAt(Instant.now());

        // Set up test wishlist item
        testWishlistItem = new WishlistItem(
            "item-1", "prod-2", "Wishlist Product",
            new BigDecimal("29.99"), "http://example.com/img.jpg", true
        );
        testWishlistItem.setAddedAt(Instant.now());

        // Set up test wishlist
        testWishlist = new Wishlist("tenant-1", "user-123");
        testWishlist.setId("wishlist-123");
        testWishlist.addItem(testWishlistItem);
    }

    @Nested
    @DisplayName("Export User Data")
    class ExportUserDataTests {

        @Test
        @DisplayName("Should export complete user data")
        void shouldExportCompleteUserData() {
            // Arrange
            when(userService.findById("user-123")).thenReturn(Mono.just(testUser));
            when(mongoTemplate.find(any(Query.class), eq(Order.class)))
                .thenReturn(Flux.just(testOrder));
            when(mongoTemplate.find(any(Query.class), eq(PersistedCart.class)))
                .thenReturn(Flux.just(testCart));
            when(reviewRepository.findByTenantIdAndUserId("tenant-1", "user-123"))
                .thenReturn(Flux.just(testReview));
            when(wishlistRepository.findByUserIdAndTenantId("user-123", "tenant-1"))
                .thenReturn(Mono.just(testWishlist));
            when(mongoTemplate.find(any(Query.class), eq(Map.class), eq("user_activity")))
                .thenReturn(Flux.empty());

            // Act & Assert
            StepVerifier.create(gdprDataExportService.exportUserData("user-123"))
                .assertNext(export -> {
                    assertThat(export).isNotNull();
                    assertThat(export.getUserId()).isEqualTo("user-123");
                    assertThat(export.getExportedAt()).isNotNull();
                    assertThat(export.getDataFormat()).isEqualTo("JSON");
                    assertThat(export.getGdprArticle()).contains("Article 20");

                    // Verify profile data
                    assertThat(export.getProfile()).isNotNull();
                    assertThat(export.getProfile().getEmail()).isEqualTo("test@example.com");
                    assertThat(export.getProfile().getFirstName()).isEqualTo("John");
                    assertThat(export.getProfile().getLastName()).isEqualTo("Doe");

                    // Verify orders
                    assertThat(export.getOrders()).hasSize(1);
                    assertThat(export.getOrders().get(0).getOrderNumber()).isEqualTo("ORD-001");

                    // Verify carts
                    assertThat(export.getCarts()).hasSize(1);
                    assertThat(export.getCarts().get(0).getCartId()).isEqualTo("cart-123");

                    // Verify reviews
                    assertThat(export.getReviews()).hasSize(1);
                    assertThat(export.getReviews().get(0).getRating()).isEqualTo(5);

                    // Verify wishlist
                    assertThat(export.getWishlist()).hasSize(1);
                    assertThat(export.getWishlist().get(0).getProductName()).isEqualTo("Wishlist Product");
                })
                .verifyComplete();

            verify(userService).findById("user-123");
        }

        @Test
        @DisplayName("Should return error for non-existent user")
        void shouldReturnErrorForNonExistentUser() {
            // Arrange
            when(userService.findById("non-existent")).thenReturn(Mono.empty());

            // Act & Assert
            StepVerifier.create(gdprDataExportService.exportUserData("non-existent"))
                .expectError(IllegalArgumentException.class)
                .verify();
        }

        @Test
        @DisplayName("Should handle user with no orders")
        void shouldHandleUserWithNoOrders() {
            // Arrange
            when(userService.findById("user-123")).thenReturn(Mono.just(testUser));
            when(mongoTemplate.find(any(Query.class), eq(Order.class)))
                .thenReturn(Flux.empty());
            when(mongoTemplate.find(any(Query.class), eq(PersistedCart.class)))
                .thenReturn(Flux.empty());
            when(reviewRepository.findByTenantIdAndUserId("tenant-1", "user-123"))
                .thenReturn(Flux.empty());
            when(wishlistRepository.findByUserIdAndTenantId("user-123", "tenant-1"))
                .thenReturn(Mono.empty());
            when(mongoTemplate.find(any(Query.class), eq(Map.class), eq("user_activity")))
                .thenReturn(Flux.empty());

            // Act & Assert
            StepVerifier.create(gdprDataExportService.exportUserData("user-123"))
                .assertNext(export -> {
                    assertThat(export.getOrders()).isEmpty();
                    assertThat(export.getCarts()).isEmpty();
                    assertThat(export.getReviews()).isEmpty();
                    assertThat(export.getWishlist()).isEmpty();
                })
                .verifyComplete();
        }

        @Test
        @DisplayName("Should handle OAuth2 user")
        void shouldHandleOAuth2User() {
            // Arrange
            testUser.setOauth2Provider("GOOGLE");
            testUser.setOauth2ProviderId("google-id-123");

            when(userService.findById("user-123")).thenReturn(Mono.just(testUser));
            when(mongoTemplate.find(any(Query.class), eq(Order.class))).thenReturn(Flux.empty());
            when(mongoTemplate.find(any(Query.class), eq(PersistedCart.class))).thenReturn(Flux.empty());
            when(reviewRepository.findByTenantIdAndUserId("tenant-1", "user-123")).thenReturn(Flux.empty());
            when(wishlistRepository.findByUserIdAndTenantId("user-123", "tenant-1")).thenReturn(Mono.empty());
            when(mongoTemplate.find(any(Query.class), eq(Map.class), eq("user_activity")))
                .thenReturn(Flux.empty());

            // Act & Assert
            StepVerifier.create(gdprDataExportService.exportUserData("user-123"))
                .assertNext(export -> {
                    assertThat(export.getProfile().getAuthProvider()).isEqualTo("GOOGLE");
                })
                .verifyComplete();
        }

        @Test
        @DisplayName("Should export multiple orders")
        void shouldExportMultipleOrders() {
            // Arrange
            Order order2 = new Order();
            order2.setId("order-456");
            order2.setOrderNumber("ORD-002");
            order2.setTenantId("tenant-1");
            order2.setStatus(OrderStatus.PENDING);

            when(userService.findById("user-123")).thenReturn(Mono.just(testUser));
            when(mongoTemplate.find(any(Query.class), eq(Order.class)))
                .thenReturn(Flux.just(testOrder, order2));
            when(mongoTemplate.find(any(Query.class), eq(PersistedCart.class))).thenReturn(Flux.empty());
            when(reviewRepository.findByTenantIdAndUserId("tenant-1", "user-123")).thenReturn(Flux.empty());
            when(wishlistRepository.findByUserIdAndTenantId("user-123", "tenant-1")).thenReturn(Mono.empty());
            when(mongoTemplate.find(any(Query.class), eq(Map.class), eq("user_activity")))
                .thenReturn(Flux.empty());

            // Act & Assert
            StepVerifier.create(gdprDataExportService.exportUserData("user-123"))
                .assertNext(export -> {
                    assertThat(export.getOrders()).hasSize(2);
                })
                .verifyComplete();
        }

        @Test
        @DisplayName("Should include all address fields")
        void shouldIncludeAllAddressFields() {
            // Arrange
            when(userService.findById("user-123")).thenReturn(Mono.just(testUser));
            when(mongoTemplate.find(any(Query.class), eq(Order.class))).thenReturn(Flux.empty());
            when(mongoTemplate.find(any(Query.class), eq(PersistedCart.class))).thenReturn(Flux.empty());
            when(reviewRepository.findByTenantIdAndUserId("tenant-1", "user-123")).thenReturn(Flux.empty());
            when(wishlistRepository.findByUserIdAndTenantId("user-123", "tenant-1")).thenReturn(Mono.empty());
            when(mongoTemplate.find(any(Query.class), eq(Map.class), eq("user_activity")))
                .thenReturn(Flux.empty());

            // Act & Assert
            StepVerifier.create(gdprDataExportService.exportUserData("user-123"))
                .assertNext(export -> {
                    assertThat(export.getProfile().getAddresses()).isNotNull();
                })
                .verifyComplete();
        }
    }

    @Nested
    @DisplayName("Export User Data as JSON")
    class ExportUserDataAsJsonTests {

        @Test
        @DisplayName("Should export data as JSON string")
        void shouldExportDataAsJsonString() {
            // Arrange
            when(userService.findById("user-123")).thenReturn(Mono.just(testUser));
            when(mongoTemplate.find(any(Query.class), eq(Order.class))).thenReturn(Flux.empty());
            when(mongoTemplate.find(any(Query.class), eq(PersistedCart.class))).thenReturn(Flux.empty());
            when(reviewRepository.findByTenantIdAndUserId("tenant-1", "user-123")).thenReturn(Flux.empty());
            when(wishlistRepository.findByUserIdAndTenantId("user-123", "tenant-1")).thenReturn(Mono.empty());
            when(mongoTemplate.find(any(Query.class), eq(Map.class), eq("user_activity")))
                .thenReturn(Flux.empty());

            // Act & Assert
            StepVerifier.create(gdprDataExportService.exportUserDataAsJson("user-123"))
                .assertNext(json -> {
                    assertThat(json).isNotNull();
                    assertThat(json).contains("\"userId\" : \"user-123\"");
                    assertThat(json).contains("\"email\" : \"test@example.com\"");
                    assertThat(json).contains("\"gdprArticle\"");
                })
                .verifyComplete();
        }

        @Test
        @DisplayName("Should format JSON with pretty printing")
        void shouldFormatJsonWithPrettyPrinting() {
            // Arrange
            when(userService.findById("user-123")).thenReturn(Mono.just(testUser));
            when(mongoTemplate.find(any(Query.class), eq(Order.class))).thenReturn(Flux.empty());
            when(mongoTemplate.find(any(Query.class), eq(PersistedCart.class))).thenReturn(Flux.empty());
            when(reviewRepository.findByTenantIdAndUserId("tenant-1", "user-123")).thenReturn(Flux.empty());
            when(wishlistRepository.findByUserIdAndTenantId("user-123", "tenant-1")).thenReturn(Mono.empty());
            when(mongoTemplate.find(any(Query.class), eq(Map.class), eq("user_activity")))
                .thenReturn(Flux.empty());

            // Act & Assert
            StepVerifier.create(gdprDataExportService.exportUserDataAsJson("user-123"))
                .assertNext(json -> {
                    // Pretty-printed JSON should have newlines and indentation
                    assertThat(json).contains("\n");
                    assertThat(json).contains("  ");
                })
                .verifyComplete();
        }
    }

    @Nested
    @DisplayName("Profile Data Export")
    class ProfileDataExportTests {

        @Test
        @DisplayName("Should export phone number")
        void shouldExportPhoneNumber() {
            // Arrange
            when(userService.findById("user-123")).thenReturn(Mono.just(testUser));
            when(mongoTemplate.find(any(Query.class), eq(Order.class))).thenReturn(Flux.empty());
            when(mongoTemplate.find(any(Query.class), eq(PersistedCart.class))).thenReturn(Flux.empty());
            when(reviewRepository.findByTenantIdAndUserId("tenant-1", "user-123")).thenReturn(Flux.empty());
            when(wishlistRepository.findByUserIdAndTenantId("user-123", "tenant-1")).thenReturn(Mono.empty());
            when(mongoTemplate.find(any(Query.class), eq(Map.class), eq("user_activity")))
                .thenReturn(Flux.empty());

            // Act & Assert
            StepVerifier.create(gdprDataExportService.exportUserData("user-123"))
                .assertNext(export -> {
                    assertThat(export.getProfile().getPhone()).isEqualTo("+1234567890");
                })
                .verifyComplete();
        }

        @Test
        @DisplayName("Should export creation date")
        void shouldExportCreationDate() {
            // Arrange
            when(userService.findById("user-123")).thenReturn(Mono.just(testUser));
            when(mongoTemplate.find(any(Query.class), eq(Order.class))).thenReturn(Flux.empty());
            when(mongoTemplate.find(any(Query.class), eq(PersistedCart.class))).thenReturn(Flux.empty());
            when(reviewRepository.findByTenantIdAndUserId("tenant-1", "user-123")).thenReturn(Flux.empty());
            when(wishlistRepository.findByUserIdAndTenantId("user-123", "tenant-1")).thenReturn(Mono.empty());
            when(mongoTemplate.find(any(Query.class), eq(Map.class), eq("user_activity")))
                .thenReturn(Flux.empty());

            // Act & Assert
            StepVerifier.create(gdprDataExportService.exportUserData("user-123"))
                .assertNext(export -> {
                    assertThat(export.getProfile().getCreatedAt()).isNotNull();
                })
                .verifyComplete();
        }

        @Test
        @DisplayName("Should indicate LOCAL auth provider for non-OAuth users")
        void shouldIndicateLocalAuthProvider() {
            // Arrange - testUser has no OAuth2 provider set
            when(userService.findById("user-123")).thenReturn(Mono.just(testUser));
            when(mongoTemplate.find(any(Query.class), eq(Order.class))).thenReturn(Flux.empty());
            when(mongoTemplate.find(any(Query.class), eq(PersistedCart.class))).thenReturn(Flux.empty());
            when(reviewRepository.findByTenantIdAndUserId("tenant-1", "user-123")).thenReturn(Flux.empty());
            when(wishlistRepository.findByUserIdAndTenantId("user-123", "tenant-1")).thenReturn(Mono.empty());
            when(mongoTemplate.find(any(Query.class), eq(Map.class), eq("user_activity")))
                .thenReturn(Flux.empty());

            // Act & Assert
            StepVerifier.create(gdprDataExportService.exportUserData("user-123"))
                .assertNext(export -> {
                    assertThat(export.getProfile().getAuthProvider()).isEqualTo("LOCAL");
                })
                .verifyComplete();
        }
    }

    @Nested
    @DisplayName("Order Data Export")
    class OrderDataExportTests {

        @Test
        @DisplayName("Should export order status")
        void shouldExportOrderStatus() {
            // Arrange
            when(userService.findById("user-123")).thenReturn(Mono.just(testUser));
            when(mongoTemplate.find(any(Query.class), eq(Order.class)))
                .thenReturn(Flux.just(testOrder));
            when(mongoTemplate.find(any(Query.class), eq(PersistedCart.class))).thenReturn(Flux.empty());
            when(reviewRepository.findByTenantIdAndUserId("tenant-1", "user-123")).thenReturn(Flux.empty());
            when(wishlistRepository.findByUserIdAndTenantId("user-123", "tenant-1")).thenReturn(Mono.empty());
            when(mongoTemplate.find(any(Query.class), eq(Map.class), eq("user_activity")))
                .thenReturn(Flux.empty());

            // Act & Assert
            StepVerifier.create(gdprDataExportService.exportUserData("user-123"))
                .assertNext(export -> {
                    assertThat(export.getOrders().get(0).getStatus()).isEqualTo("DELIVERED");
                })
                .verifyComplete();
        }

        @Test
        @DisplayName("Should export order pricing")
        void shouldExportOrderPricing() {
            // Arrange
            when(userService.findById("user-123")).thenReturn(Mono.just(testUser));
            when(mongoTemplate.find(any(Query.class), eq(Order.class)))
                .thenReturn(Flux.just(testOrder));
            when(mongoTemplate.find(any(Query.class), eq(PersistedCart.class))).thenReturn(Flux.empty());
            when(reviewRepository.findByTenantIdAndUserId("tenant-1", "user-123")).thenReturn(Flux.empty());
            when(wishlistRepository.findByUserIdAndTenantId("user-123", "tenant-1")).thenReturn(Mono.empty());
            when(mongoTemplate.find(any(Query.class), eq(Map.class), eq("user_activity")))
                .thenReturn(Flux.empty());

            // Act & Assert
            StepVerifier.create(gdprDataExportService.exportUserData("user-123"))
                .assertNext(export -> {
                    assertThat(export.getOrders().get(0).getPricing()).isNotNull();
                })
                .verifyComplete();
        }
    }

    @Nested
    @DisplayName("Review Data Export")
    class ReviewDataExportTests {

        @Test
        @DisplayName("Should export review rating and comment")
        void shouldExportReviewRatingAndComment() {
            // Arrange
            when(userService.findById("user-123")).thenReturn(Mono.just(testUser));
            when(mongoTemplate.find(any(Query.class), eq(Order.class))).thenReturn(Flux.empty());
            when(mongoTemplate.find(any(Query.class), eq(PersistedCart.class))).thenReturn(Flux.empty());
            when(reviewRepository.findByTenantIdAndUserId("tenant-1", "user-123"))
                .thenReturn(Flux.just(testReview));
            when(wishlistRepository.findByUserIdAndTenantId("user-123", "tenant-1")).thenReturn(Mono.empty());
            when(mongoTemplate.find(any(Query.class), eq(Map.class), eq("user_activity")))
                .thenReturn(Flux.empty());

            // Act & Assert
            StepVerifier.create(gdprDataExportService.exportUserData("user-123"))
                .assertNext(export -> {
                    assertThat(export.getReviews()).hasSize(1);
                    assertThat(export.getReviews().get(0).getRating()).isEqualTo(5);
                    assertThat(export.getReviews().get(0).getTitle()).isEqualTo("Great product!");
                    assertThat(export.getReviews().get(0).getComment()).contains("Really enjoyed");
                })
                .verifyComplete();
        }

        @Test
        @DisplayName("Should export verified purchase status")
        void shouldExportVerifiedPurchaseStatus() {
            // Arrange
            when(userService.findById("user-123")).thenReturn(Mono.just(testUser));
            when(mongoTemplate.find(any(Query.class), eq(Order.class))).thenReturn(Flux.empty());
            when(mongoTemplate.find(any(Query.class), eq(PersistedCart.class))).thenReturn(Flux.empty());
            when(reviewRepository.findByTenantIdAndUserId("tenant-1", "user-123"))
                .thenReturn(Flux.just(testReview));
            when(wishlistRepository.findByUserIdAndTenantId("user-123", "tenant-1")).thenReturn(Mono.empty());
            when(mongoTemplate.find(any(Query.class), eq(Map.class), eq("user_activity")))
                .thenReturn(Flux.empty());

            // Act & Assert
            StepVerifier.create(gdprDataExportService.exportUserData("user-123"))
                .assertNext(export -> {
                    assertThat(export.getReviews().get(0).isVerifiedPurchase()).isTrue();
                })
                .verifyComplete();
        }
    }

    @Nested
    @DisplayName("Cart Data Export")
    class CartDataExportTests {

        @Test
        @DisplayName("Should export cart items")
        void shouldExportCartItems() {
            // Arrange
            when(userService.findById("user-123")).thenReturn(Mono.just(testUser));
            when(mongoTemplate.find(any(Query.class), eq(Order.class))).thenReturn(Flux.empty());
            when(mongoTemplate.find(any(Query.class), eq(PersistedCart.class)))
                .thenReturn(Flux.just(testCart));
            when(reviewRepository.findByTenantIdAndUserId("tenant-1", "user-123")).thenReturn(Flux.empty());
            when(wishlistRepository.findByUserIdAndTenantId("user-123", "tenant-1")).thenReturn(Mono.empty());
            when(mongoTemplate.find(any(Query.class), eq(Map.class), eq("user_activity")))
                .thenReturn(Flux.empty());

            // Act & Assert
            StepVerifier.create(gdprDataExportService.exportUserData("user-123"))
                .assertNext(export -> {
                    assertThat(export.getCarts()).hasSize(1);
                    assertThat(export.getCarts().get(0).getCartId()).isEqualTo("cart-123");
                    assertThat(export.getCarts().get(0).getItems()).isNotNull();
                })
                .verifyComplete();
        }

        @Test
        @DisplayName("Should export abandoned cart status")
        void shouldExportAbandonedCartStatus() {
            // Arrange
            testCart.setAbandonmentNotified(true);

            when(userService.findById("user-123")).thenReturn(Mono.just(testUser));
            when(mongoTemplate.find(any(Query.class), eq(Order.class))).thenReturn(Flux.empty());
            when(mongoTemplate.find(any(Query.class), eq(PersistedCart.class)))
                .thenReturn(Flux.just(testCart));
            when(reviewRepository.findByTenantIdAndUserId("tenant-1", "user-123")).thenReturn(Flux.empty());
            when(wishlistRepository.findByUserIdAndTenantId("user-123", "tenant-1")).thenReturn(Mono.empty());
            when(mongoTemplate.find(any(Query.class), eq(Map.class), eq("user_activity")))
                .thenReturn(Flux.empty());

            // Act & Assert
            StepVerifier.create(gdprDataExportService.exportUserData("user-123"))
                .assertNext(export -> {
                    assertThat(export.getCarts().get(0).isAbandoned()).isTrue();
                })
                .verifyComplete();
        }
    }

    @Nested
    @DisplayName("Wishlist Data Export")
    class WishlistDataExportTests {

        @Test
        @DisplayName("Should export wishlist items")
        void shouldExportWishlistItems() {
            // Arrange
            when(userService.findById("user-123")).thenReturn(Mono.just(testUser));
            when(mongoTemplate.find(any(Query.class), eq(Order.class))).thenReturn(Flux.empty());
            when(mongoTemplate.find(any(Query.class), eq(PersistedCart.class))).thenReturn(Flux.empty());
            when(reviewRepository.findByTenantIdAndUserId("tenant-1", "user-123")).thenReturn(Flux.empty());
            when(wishlistRepository.findByUserIdAndTenantId("user-123", "tenant-1"))
                .thenReturn(Mono.just(testWishlist));
            when(mongoTemplate.find(any(Query.class), eq(Map.class), eq("user_activity")))
                .thenReturn(Flux.empty());

            // Act & Assert
            StepVerifier.create(gdprDataExportService.exportUserData("user-123"))
                .assertNext(export -> {
                    assertThat(export.getWishlist()).hasSize(1);
                    assertThat(export.getWishlist().get(0).getProductId()).isEqualTo("prod-2");
                    assertThat(export.getWishlist().get(0).getProductName()).isEqualTo("Wishlist Product");
                })
                .verifyComplete();
        }

        @Test
        @DisplayName("Should export wishlist notes")
        void shouldExportWishlistNotes() {
            // Arrange
            testWishlistItem.setNotes("Want this for birthday");

            when(userService.findById("user-123")).thenReturn(Mono.just(testUser));
            when(mongoTemplate.find(any(Query.class), eq(Order.class))).thenReturn(Flux.empty());
            when(mongoTemplate.find(any(Query.class), eq(PersistedCart.class))).thenReturn(Flux.empty());
            when(reviewRepository.findByTenantIdAndUserId("tenant-1", "user-123")).thenReturn(Flux.empty());
            when(wishlistRepository.findByUserIdAndTenantId("user-123", "tenant-1"))
                .thenReturn(Mono.just(testWishlist));
            when(mongoTemplate.find(any(Query.class), eq(Map.class), eq("user_activity")))
                .thenReturn(Flux.empty());

            // Act & Assert
            StepVerifier.create(gdprDataExportService.exportUserData("user-123"))
                .assertNext(export -> {
                    assertThat(export.getWishlist().get(0).getNotes()).isEqualTo("Want this for birthday");
                })
                .verifyComplete();
        }
    }
}
