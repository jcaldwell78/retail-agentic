package com.retail.domain.recommendation;

import com.retail.domain.order.Order;
import com.retail.domain.product.Product;
import com.retail.infrastructure.persistence.OrderRepository;
import com.retail.infrastructure.persistence.ProductRepository;
import com.retail.security.tenant.TenantContext;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Basic product recommendation engine.
 *
 * Strategies implemented:
 * 1. Frequently bought together (based on order history)
 * 2. Similar products (based on category)
 * 3. Popular products (based on order frequency)
 * 4. User-based recommendations (based on purchase history)
 */
@Service
public class ProductRecommendationService {

    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;

    public ProductRecommendationService(
        ProductRepository productRepository,
        OrderRepository orderRepository
    ) {
        this.productRepository = productRepository;
        this.orderRepository = orderRepository;
    }

    /**
     * Get personalized product recommendations for a user
     * Based on their purchase history
     */
    public Flux<Product> getPersonalizedRecommendations(String userId, int limit) {
        return TenantContext.getTenantId()
            .flatMapMany(tenantId ->
                // Get user's purchase history
                orderRepository.findByCustomerEmail(userId, tenantId)
                    .collectList()
                    .flatMapMany(orders -> {
                        if (orders.isEmpty()) {
                            // No history - return popular products
                            return getPopularProducts(limit);
                        }

                        // Extract product IDs from user's orders
                        Set<String> purchasedProductIds = orders.stream()
                            .flatMap(order -> order.getItems().stream())
                            .map(Order.OrderItem::productId)
                            .collect(Collectors.toSet());

                        // Get categories user has purchased from
                        return Flux.fromIterable(purchasedProductIds)
                            .flatMap(productId -> productRepository.findById(productId))
                            .collectList()
                            .flatMapMany(products -> {
                                Set<String> categories = products.stream()
                                    .flatMap(p -> p.getCategory().stream())
                                    .collect(Collectors.toSet());

                                // Recommend products from same categories that user hasn't bought
                                return Flux.fromIterable(categories)
                                    .flatMap(category ->
                                        productRepository.findByTenantIdAndCategoryContaining(
                                            tenantId, category, PageRequest.of(0, 10)
                                        )
                                    )
                                    .filter(product -> !purchasedProductIds.contains(product.getId()))
                                    .distinct(Product::getId)
                                    .take(limit);
                            });
                    })
            );
    }

    /**
     * Get products frequently bought together with a given product
     * Based on order co-occurrence analysis
     */
    public Flux<Product> getFrequentlyBoughtTogether(String productId, int limit) {
        return TenantContext.getTenantId()
            .flatMapMany(tenantId ->
                // Find orders containing this product
                orderRepository.findByTenantId(tenantId, PageRequest.of(0, 100))
                    .filter(order ->
                        order.getItems().stream()
                            .anyMatch(item -> item.productId().equals(productId))
                    )
                    .collectList()
                    .flatMapMany(orders -> {
                        if (orders.isEmpty()) {
                            return Flux.empty();
                        }

                        // Count co-occurrences of other products
                        Map<String, Integer> productCounts = new HashMap<>();

                        for (Order order : orders) {
                            for (Order.OrderItem item : order.getItems()) {
                                if (!item.productId().equals(productId)) {
                                    productCounts.merge(item.productId(), 1, Integer::sum);
                                }
                            }
                        }

                        // Get top co-occurring products
                        List<String> topProductIds = productCounts.entrySet().stream()
                            .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
                            .limit(limit)
                            .map(Map.Entry::getKey)
                            .collect(Collectors.toList());

                        // Fetch and return products
                        return Flux.fromIterable(topProductIds)
                            .flatMap(id -> productRepository.findByIdAndTenantId(id, tenantId));
                    })
            );
    }

    /**
     * Get similar products based on category and attributes
     */
    public Flux<Product> getSimilarProducts(String productId, int limit) {
        return TenantContext.getTenantId()
            .flatMapMany(tenantId ->
                productRepository.findByIdAndTenantId(productId, tenantId)
                    .flatMapMany(product -> {
                        if (product.getCategory().isEmpty()) {
                            return Flux.empty();
                        }

                        // Find products in same categories
                        return Flux.fromIterable(product.getCategory())
                            .flatMap(category ->
                                productRepository.findByTenantIdAndCategoryContaining(
                                    tenantId, category, PageRequest.of(0, limit * 2)
                                )
                            )
                            .filter(p -> !p.getId().equals(productId)) // Exclude the product itself
                            .distinct(Product::getId)
                            .take(limit);
                    })
            );
    }

    /**
     * Get popular products based on order frequency
     */
    public Flux<Product> getPopularProducts(int limit) {
        return TenantContext.getTenantId()
            .flatMapMany(tenantId ->
                // Get recent orders
                orderRepository.findByTenantId(tenantId, PageRequest.of(0, 200))
                    .collectList()
                    .flatMapMany(orders -> {
                        if (orders.isEmpty()) {
                            // No orders - return active products
                            return productRepository.findActiveProducts(PageRequest.of(0, limit));
                        }

                        // Count product frequency in orders
                        Map<String, Integer> productCounts = new HashMap<>();

                        for (Order order : orders) {
                            for (Order.OrderItem item : order.getItems()) {
                                productCounts.merge(item.productId(), item.quantity(), Integer::sum);
                            }
                        }

                        // Get top products by frequency
                        List<String> topProductIds = productCounts.entrySet().stream()
                            .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
                            .limit(limit)
                            .map(Map.Entry::getKey)
                            .collect(Collectors.toList());

                        // Fetch and return products
                        return Flux.fromIterable(topProductIds)
                            .flatMap(id -> productRepository.findByIdAndTenantId(id, tenantId));
                    })
            );
    }

    /**
     * Get trending products (popular in recent time window)
     */
    public Flux<Product> getTrendingProducts(int limit) {
        return TenantContext.getTenantId()
            .flatMapMany(tenantId ->
                // Get very recent orders (last 50)
                orderRepository.findByTenantId(tenantId, PageRequest.of(0, 50))
                    .collectList()
                    .flatMapMany(orders -> {
                        if (orders.isEmpty()) {
                            return productRepository.findActiveProducts(PageRequest.of(0, limit));
                        }

                        // Count product frequency in recent orders
                        Map<String, Integer> productCounts = new HashMap<>();

                        for (Order order : orders) {
                            for (Order.OrderItem item : order.getItems()) {
                                productCounts.merge(item.productId(), 1, Integer::sum);
                            }
                        }

                        // Get top trending products
                        List<String> topProductIds = productCounts.entrySet().stream()
                            .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
                            .limit(limit)
                            .map(Map.Entry::getKey)
                            .collect(Collectors.toList());

                        // Fetch and return products
                        return Flux.fromIterable(topProductIds)
                            .flatMap(id -> productRepository.findByIdAndTenantId(id, tenantId));
                    })
            );
    }

    /**
     * Get new arrivals (recently added products)
     */
    public Flux<Product> getNewArrivals(int limit) {
        return TenantContext.getTenantId()
            .flatMapMany(tenantId ->
                productRepository.findActiveProducts(PageRequest.of(0, limit))
                    .sort(Comparator.comparing(Product::getCreatedAt).reversed())
                    .take(limit)
            );
    }

    /**
     * Get products on sale (discounted prices - placeholder logic)
     * Note: Would need discount/sale price field in Product model for full implementation
     */
    public Flux<Product> getProductsOnSale(int limit) {
        return TenantContext.getTenantId()
            .flatMapMany(tenantId ->
                // For now, return random active products
                // In production, would filter by discount/sale fields
                productRepository.findActiveProducts(PageRequest.of(0, limit))
            );
    }
}
