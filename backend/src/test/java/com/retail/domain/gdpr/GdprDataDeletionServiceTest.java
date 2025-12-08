package com.retail.domain.gdpr;

import com.mongodb.client.result.DeleteResult;
import com.mongodb.client.result.UpdateResult;
import com.retail.domain.cart.PersistedCart;
import com.retail.domain.order.Order;
import com.retail.domain.order.OrderStatus;
import com.retail.domain.review.ProductReview;
import com.retail.domain.user.Address;
import com.retail.domain.user.User;
import com.retail.domain.user.UserService;
import com.retail.domain.user.UserStatus;
import com.retail.domain.wishlist.Wishlist;
import com.retail.domain.wishlist.WishlistItem;
import com.retail.infrastructure.persistence.PersistedCartRepository;
import com.retail.infrastructure.persistence.ProductReviewRepository;
import com.retail.infrastructure.persistence.UserRepository;
import com.retail.infrastructure.persistence.WishlistRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.math.BigDecimal;
import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("GdprDataDeletionService Tests")
class GdprDataDeletionServiceTest {

    @Mock
    private UserService userService;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ReactiveMongoTemplate mongoTemplate;

    @Mock
    private PersistedCartRepository cartRepository;

    @Mock
    private ProductReviewRepository reviewRepository;

    @Mock
    private WishlistRepository wishlistRepository;

    private GdprDataDeletionService gdprDataDeletionService;

    private User testUser;
    private Order testOrder;
    private PersistedCart testCart;
    private ProductReview testReview;
    private Wishlist testWishlist;

    @BeforeEach
    void setUp() {
        gdprDataDeletionService = new GdprDataDeletionService(
            userService,
            userRepository,
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
        testOrder.setCreatedAt(Instant.now());

        // Set up test cart
        testCart = new PersistedCart();
        testCart.setId("cart-123");
        testCart.setUserId("user-123");
        testCart.setTenantId("tenant-1");
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
        testReview.setCreatedAt(Instant.now());

        // Set up test wishlist
        WishlistItem item = new WishlistItem(
            "item-1", "prod-2", "Wishlist Product",
            new BigDecimal("29.99"), "http://example.com/img.jpg", true
        );
        item.setAddedAt(Instant.now());
        testWishlist = new Wishlist("tenant-1", "user-123");
        testWishlist.setId("wishlist-123");
        testWishlist.addItem(item);
    }

    private void setupDefaultMocks() {
        when(userService.findById("user-123")).thenReturn(Mono.just(testUser));
        when(userRepository.save(any(User.class))).thenReturn(Mono.just(testUser));
        when(wishlistRepository.findByUserIdAndTenantId("user-123", "tenant-1"))
            .thenReturn(Mono.empty());
        when(mongoTemplate.find(any(Query.class), eq(PersistedCart.class)))
            .thenReturn(Flux.empty());
        when(reviewRepository.findByTenantIdAndUserId("tenant-1", "user-123"))
            .thenReturn(Flux.empty());
        when(mongoTemplate.find(any(Query.class), eq(Order.class)))
            .thenReturn(Flux.empty());
        when(mongoTemplate.count(any(Query.class), eq("user_activity")))
            .thenReturn(Mono.just(0L));
    }

    @Nested
    @DisplayName("Delete User Data")
    class DeleteUserDataTests {

        @Test
        @DisplayName("Should delete all user data successfully")
        void shouldDeleteAllUserDataSuccessfully() {
            // Arrange
            when(userService.findById("user-123")).thenReturn(Mono.just(testUser));
            when(userRepository.save(any(User.class))).thenReturn(Mono.just(testUser));
            when(wishlistRepository.findByUserIdAndTenantId("user-123", "tenant-1"))
                .thenReturn(Mono.just(testWishlist));
            when(wishlistRepository.delete(any(Wishlist.class))).thenReturn(Mono.empty());
            when(mongoTemplate.find(any(Query.class), eq(PersistedCart.class)))
                .thenReturn(Flux.just(testCart));
            when(mongoTemplate.remove(any(Query.class), eq(PersistedCart.class)))
                .thenReturn(Mono.just(DeleteResult.acknowledged(1)));
            when(reviewRepository.findByTenantIdAndUserId("tenant-1", "user-123"))
                .thenReturn(Flux.just(testReview));
            when(mongoTemplate.updateMulti(any(Query.class), any(Update.class), eq(ProductReview.class)))
                .thenReturn(Mono.just(UpdateResult.acknowledged(1, 1L, null)));
            when(mongoTemplate.find(any(Query.class), eq(Order.class)))
                .thenReturn(Flux.just(testOrder));
            when(mongoTemplate.updateMulti(any(Query.class), any(Update.class), eq(Order.class)))
                .thenReturn(Mono.just(UpdateResult.acknowledged(1, 1L, null)));
            when(mongoTemplate.count(any(Query.class), eq("user_activity")))
                .thenReturn(Mono.just(5L));
            when(mongoTemplate.remove(any(Query.class), eq("user_activity")))
                .thenReturn(Mono.just(DeleteResult.acknowledged(5)));

            // Act & Assert
            StepVerifier.create(gdprDataDeletionService.deleteUserData("user-123"))
                .assertNext(result -> {
                    assertThat(result).isNotNull();
                    assertThat(result.getUserId()).isEqualTo("user-123");
                    assertThat(result.getStatus()).isEqualTo("COMPLETED");
                    assertThat(result.getGdprArticle()).contains("Article 17");
                    assertThat(result.getActions()).isNotEmpty();
                    assertThat(result.getCompletedAt()).isNotNull();
                })
                .verifyComplete();

            verify(userRepository).save(any(User.class));
            verify(wishlistRepository).delete(any(Wishlist.class));
        }

        @Test
        @DisplayName("Should return error for non-existent user")
        void shouldReturnErrorForNonExistentUser() {
            // Arrange
            when(userService.findById("non-existent")).thenReturn(Mono.empty());

            // Act & Assert
            StepVerifier.create(gdprDataDeletionService.deleteUserData("non-existent"))
                .expectError(IllegalArgumentException.class)
                .verify();
        }

        @Test
        @DisplayName("Should anonymize user personal data")
        void shouldAnonymizeUserPersonalData() {
            // Arrange
            setupDefaultMocks();
            ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
            when(userRepository.save(userCaptor.capture())).thenAnswer(inv -> Mono.just(inv.getArgument(0)));

            // Act & Assert
            StepVerifier.create(gdprDataDeletionService.deleteUserData("user-123"))
                .assertNext(result -> {
                    User anonymizedUser = userCaptor.getValue();
                    assertThat(anonymizedUser.getEmail()).startsWith("deleted_");
                    assertThat(anonymizedUser.getFirstName()).isEqualTo("Deleted");
                    assertThat(anonymizedUser.getLastName()).isEqualTo("User");
                    assertThat(anonymizedUser.getPhone()).isNull();
                    assertThat(anonymizedUser.getAddresses()).isEmpty();
                    assertThat(anonymizedUser.getStatus()).isEqualTo(UserStatus.DELETED);
                })
                .verifyComplete();
        }

        @Test
        @DisplayName("Should complete successfully with no data to delete")
        void shouldCompleteSuccessfullyWithNoDataToDelete() {
            // Arrange
            setupDefaultMocks();

            // Act & Assert
            StepVerifier.create(gdprDataDeletionService.deleteUserData("user-123"))
                .assertNext(result -> {
                    assertThat(result.getStatus()).isEqualTo("COMPLETED");
                    assertThat(result.getActions()).isNotEmpty();
                })
                .verifyComplete();
        }

        @Test
        @DisplayName("Should call wishlist repository delete when wishlist exists")
        void shouldCallWishlistDeleteWhenExists() {
            // Arrange
            setupDefaultMocks();
            when(wishlistRepository.findByUserIdAndTenantId("user-123", "tenant-1"))
                .thenReturn(Mono.just(testWishlist));
            when(wishlistRepository.delete(any(Wishlist.class))).thenReturn(Mono.empty());

            // Act & Assert
            StepVerifier.create(gdprDataDeletionService.deleteUserData("user-123"))
                .assertNext(result -> {
                    assertThat(result.getStatus()).isEqualTo("COMPLETED");
                })
                .verifyComplete();

            verify(wishlistRepository).delete(any(Wishlist.class));
        }

        @Test
        @DisplayName("Should call updateMulti for reviews when reviews exist")
        void shouldAnonymizeReviewsWhenExist() {
            // Arrange
            setupDefaultMocks();
            when(reviewRepository.findByTenantIdAndUserId("tenant-1", "user-123"))
                .thenReturn(Flux.just(testReview));
            when(mongoTemplate.updateMulti(any(Query.class), any(Update.class), eq(ProductReview.class)))
                .thenReturn(Mono.just(UpdateResult.acknowledged(1, 1L, null)));

            // Act & Assert
            StepVerifier.create(gdprDataDeletionService.deleteUserData("user-123"))
                .assertNext(result -> {
                    assertThat(result.getStatus()).isEqualTo("COMPLETED");
                })
                .verifyComplete();

            verify(mongoTemplate).updateMulti(any(Query.class), any(Update.class), eq(ProductReview.class));
            verify(mongoTemplate, never()).remove(any(Query.class), eq(ProductReview.class));
        }

        @Test
        @DisplayName("Should anonymize orders instead of deleting")
        void shouldAnonymizeOrdersInsteadOfDeleting() {
            // Arrange
            setupDefaultMocks();
            when(mongoTemplate.find(any(Query.class), eq(Order.class)))
                .thenReturn(Flux.just(testOrder));
            when(mongoTemplate.updateMulti(any(Query.class), any(Update.class), eq(Order.class)))
                .thenReturn(Mono.just(UpdateResult.acknowledged(1, 1L, null)));

            // Act & Assert
            StepVerifier.create(gdprDataDeletionService.deleteUserData("user-123"))
                .assertNext(result -> {
                    assertThat(result.getStatus()).isEqualTo("COMPLETED");
                    // Orders should be anonymized, not deleted
                })
                .verifyComplete();

            verify(mongoTemplate).updateMulti(any(Query.class), any(Update.class), eq(Order.class));
            verify(mongoTemplate, never()).remove(any(Query.class), eq(Order.class));
        }

        @Test
        @DisplayName("Should delete shopping carts")
        void shouldDeleteShoppingCarts() {
            // Arrange
            setupDefaultMocks();
            when(mongoTemplate.find(any(Query.class), eq(PersistedCart.class)))
                .thenReturn(Flux.just(testCart));
            when(mongoTemplate.remove(any(Query.class), eq(PersistedCart.class)))
                .thenReturn(Mono.just(DeleteResult.acknowledged(1)));

            // Act & Assert
            StepVerifier.create(gdprDataDeletionService.deleteUserData("user-123"))
                .assertNext(result -> {
                    assertThat(result.getStatus()).isEqualTo("COMPLETED");
                })
                .verifyComplete();

            verify(mongoTemplate).remove(any(Query.class), eq(PersistedCart.class));
        }

        @Test
        @DisplayName("Should delete activity logs")
        void shouldDeleteActivityLogs() {
            // Arrange
            setupDefaultMocks();
            when(mongoTemplate.count(any(Query.class), eq("user_activity")))
                .thenReturn(Mono.just(10L));
            when(mongoTemplate.remove(any(Query.class), eq("user_activity")))
                .thenReturn(Mono.just(DeleteResult.acknowledged(10)));

            // Act & Assert
            StepVerifier.create(gdprDataDeletionService.deleteUserData("user-123"))
                .assertNext(result -> {
                    assertThat(result.getStatus()).isEqualTo("COMPLETED");
                })
                .verifyComplete();

            verify(mongoTemplate).remove(any(Query.class), eq("user_activity"));
        }
    }

    @Nested
    @DisplayName("Deletion Eligibility Check")
    class DeletionEligibilityTests {

        @Test
        @DisplayName("Should return eligible when no pending orders")
        void shouldReturnEligibleWhenNoPendingOrders() {
            // Arrange
            when(userService.findById("user-123")).thenReturn(Mono.just(testUser));
            when(mongoTemplate.count(any(Query.class), eq(Order.class)))
                .thenReturn(Mono.just(0L));

            // Act & Assert
            StepVerifier.create(gdprDataDeletionService.checkDeletionEligibility("user-123"))
                .assertNext(eligibility -> {
                    assertThat(eligibility.getUserId()).isEqualTo("user-123");
                    assertThat(eligibility.isEligible()).isTrue();
                    assertThat(eligibility.getBlockingReasons()).isEmpty();
                    assertThat(eligibility.getInfo()).isNotEmpty();
                })
                .verifyComplete();
        }

        @Test
        @DisplayName("Should return ineligible when pending orders exist")
        void shouldReturnIneligibleWhenPendingOrdersExist() {
            // Arrange
            when(userService.findById("user-123")).thenReturn(Mono.just(testUser));
            when(mongoTemplate.count(any(Query.class), eq(Order.class)))
                .thenReturn(Mono.just(2L));

            // Act & Assert
            StepVerifier.create(gdprDataDeletionService.checkDeletionEligibility("user-123"))
                .assertNext(eligibility -> {
                    assertThat(eligibility.isEligible()).isFalse();
                    assertThat(eligibility.getBlockingReasons()).isNotEmpty();
                })
                .verifyComplete();
        }

        @Test
        @DisplayName("Should return error for non-existent user")
        void shouldReturnErrorForNonExistentUserEligibility() {
            // Arrange
            when(userService.findById("non-existent")).thenReturn(Mono.empty());

            // Act & Assert
            StepVerifier.create(gdprDataDeletionService.checkDeletionEligibility("non-existent"))
                .expectError(IllegalArgumentException.class)
                .verify();
        }

        @Test
        @DisplayName("Should include retention information")
        void shouldIncludeRetentionInformation() {
            // Arrange
            when(userService.findById("user-123")).thenReturn(Mono.just(testUser));
            when(mongoTemplate.count(any(Query.class), eq(Order.class)))
                .thenReturn(Mono.just(0L));

            // Act & Assert
            StepVerifier.create(gdprDataDeletionService.checkDeletionEligibility("user-123"))
                .assertNext(eligibility -> {
                    assertThat(eligibility.getInfo()).anyMatch(i -> i.contains("7 years"));
                })
                .verifyComplete();
        }
    }
}
