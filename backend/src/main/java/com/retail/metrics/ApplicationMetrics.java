package com.retail.metrics;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import org.springframework.stereotype.Component;

/**
 * Custom application metrics for business-specific monitoring.
 *
 * Provides metrics for:
 * - Order processing
 * - Product catalog operations
 * - Authentication events
 * - Cache performance
 * - Multi-tenant operations
 */
@Component
public class ApplicationMetrics {

    private final MeterRegistry meterRegistry;

    // Order Metrics
    private final Counter ordersCreated;
    private final Counter ordersFailed;
    private final Counter ordersCompleted;
    private final Timer orderProcessingTime;

    // Product Metrics
    private final Counter productsViewed;
    private final Counter productsCreated;
    private final Counter productsUpdated;
    private final Counter productsSearched;
    private final Timer productSearchTime;

    // Cart Metrics
    private final Counter itemsAddedToCart;
    private final Counter itemsRemovedFromCart;
    private final Counter cartsAbandoned;
    private final Counter cartsConverted;

    // Authentication Metrics
    private final Counter loginAttempts;
    private final Counter loginSuccesses;
    private final Counter loginFailures;
    private final Counter registrations;
    private final Timer authenticationTime;

    // Cache Metrics
    private final Counter cacheHits;
    private final Counter cacheMisses;
    private final Timer cacheLoadTime;

    // Tenant Metrics
    private final Counter tenantRequests;
    private final Timer tenantContextResolutionTime;

    // Payment Metrics
    private final Counter paymentsProcessed;
    private final Counter paymentsSucceeded;
    private final Counter paymentsFailed;
    private final Timer paymentProcessingTime;

    public ApplicationMetrics(MeterRegistry meterRegistry) {
        this.meterRegistry = meterRegistry;

        // Initialize Order Metrics
        this.ordersCreated = Counter.builder("orders.created")
                .description("Total number of orders created")
                .register(meterRegistry);

        this.ordersFailed = Counter.builder("orders.failed")
                .description("Total number of failed orders")
                .register(meterRegistry);

        this.ordersCompleted = Counter.builder("orders.completed")
                .description("Total number of completed orders")
                .register(meterRegistry);

        this.orderProcessingTime = Timer.builder("orders.processing.time")
                .description("Order processing duration")
                .register(meterRegistry);

        // Initialize Product Metrics
        this.productsViewed = Counter.builder("products.viewed")
                .description("Total number of product views")
                .register(meterRegistry);

        this.productsCreated = Counter.builder("products.created")
                .description("Total number of products created")
                .register(meterRegistry);

        this.productsUpdated = Counter.builder("products.updated")
                .description("Total number of products updated")
                .register(meterRegistry);

        this.productsSearched = Counter.builder("products.searched")
                .description("Total number of product searches")
                .register(meterRegistry);

        this.productSearchTime = Timer.builder("products.search.time")
                .description("Product search duration")
                .register(meterRegistry);

        // Initialize Cart Metrics
        this.itemsAddedToCart = Counter.builder("cart.items.added")
                .description("Total number of items added to cart")
                .register(meterRegistry);

        this.itemsRemovedFromCart = Counter.builder("cart.items.removed")
                .description("Total number of items removed from cart")
                .register(meterRegistry);

        this.cartsAbandoned = Counter.builder("cart.abandoned")
                .description("Total number of abandoned carts")
                .register(meterRegistry);

        this.cartsConverted = Counter.builder("cart.converted")
                .description("Total number of carts converted to orders")
                .register(meterRegistry);

        // Initialize Authentication Metrics
        this.loginAttempts = Counter.builder("auth.login.attempts")
                .description("Total number of login attempts")
                .register(meterRegistry);

        this.loginSuccesses = Counter.builder("auth.login.successes")
                .description("Total number of successful logins")
                .register(meterRegistry);

        this.loginFailures = Counter.builder("auth.login.failures")
                .description("Total number of failed logins")
                .register(meterRegistry);

        this.registrations = Counter.builder("auth.registrations")
                .description("Total number of user registrations")
                .register(meterRegistry);

        this.authenticationTime = Timer.builder("auth.processing.time")
                .description("Authentication processing duration")
                .register(meterRegistry);

        // Initialize Cache Metrics
        this.cacheHits = Counter.builder("cache.hits")
                .description("Total number of cache hits")
                .register(meterRegistry);

        this.cacheMisses = Counter.builder("cache.misses")
                .description("Total number of cache misses")
                .register(meterRegistry);

        this.cacheLoadTime = Timer.builder("cache.load.time")
                .description("Cache load duration")
                .register(meterRegistry);

        // Initialize Tenant Metrics
        this.tenantRequests = Counter.builder("tenant.requests")
                .description("Total number of requests per tenant")
                .tag("tenant", "unknown")
                .register(meterRegistry);

        this.tenantContextResolutionTime = Timer.builder("tenant.context.resolution.time")
                .description("Tenant context resolution duration")
                .register(meterRegistry);

        // Initialize Payment Metrics
        this.paymentsProcessed = Counter.builder("payments.processed")
                .description("Total number of payment attempts")
                .register(meterRegistry);

        this.paymentsSucceeded = Counter.builder("payments.succeeded")
                .description("Total number of successful payments")
                .register(meterRegistry);

        this.paymentsFailed = Counter.builder("payments.failed")
                .description("Total number of failed payments")
                .register(meterRegistry);

        this.paymentProcessingTime = Timer.builder("payments.processing.time")
                .description("Payment processing duration")
                .register(meterRegistry);
    }

    // Order Metrics Methods
    public void recordOrderCreated() {
        ordersCreated.increment();
    }

    public void recordOrderCreated(String tenantId) {
        Counter.builder("orders.created")
                .tag("tenant", tenantId)
                .register(meterRegistry)
                .increment();
    }

    public void recordOrderFailed() {
        ordersFailed.increment();
    }

    public void recordOrderCompleted() {
        ordersCompleted.increment();
    }

    public Timer.Sample startOrderProcessing() {
        return Timer.start(meterRegistry);
    }

    public void endOrderProcessing(Timer.Sample sample) {
        sample.stop(orderProcessingTime);
    }

    // Product Metrics Methods
    public void recordProductViewed(String tenantId, String productId) {
        Counter.builder("products.viewed")
                .tag("tenant", tenantId)
                .tag("product", productId)
                .register(meterRegistry)
                .increment();
    }

    public void recordProductCreated() {
        productsCreated.increment();
    }

    public void recordProductUpdated() {
        productsUpdated.increment();
    }

    public void recordProductSearch(String query) {
        productsSearched.increment();
        Counter.builder("products.search.query")
                .tag("query_length", String.valueOf(query.length()))
                .register(meterRegistry)
                .increment();
    }

    public Timer.Sample startProductSearch() {
        return Timer.start(meterRegistry);
    }

    public void endProductSearch(Timer.Sample sample) {
        sample.stop(productSearchTime);
    }

    // Cart Metrics Methods
    public void recordItemAddedToCart(String tenantId) {
        Counter.builder("cart.items.added")
                .tag("tenant", tenantId)
                .register(meterRegistry)
                .increment();
    }

    public void recordItemRemovedFromCart() {
        itemsRemovedFromCart.increment();
    }

    public void recordCartAbandoned(String tenantId) {
        Counter.builder("cart.abandoned")
                .tag("tenant", tenantId)
                .register(meterRegistry)
                .increment();
    }

    public void recordCartConverted() {
        cartsConverted.increment();
    }

    // Authentication Metrics Methods
    public void recordLoginAttempt() {
        loginAttempts.increment();
    }

    public void recordLoginSuccess(String method) {
        loginSuccesses.increment();
        Counter.builder("auth.login.successes")
                .tag("method", method)
                .register(meterRegistry)
                .increment();
    }

    public void recordLoginFailure(String reason) {
        loginFailures.increment();
        Counter.builder("auth.login.failures")
                .tag("reason", reason)
                .register(meterRegistry)
                .increment();
    }

    public void recordRegistration() {
        registrations.increment();
    }

    public Timer.Sample startAuthentication() {
        return Timer.start(meterRegistry);
    }

    public void endAuthentication(Timer.Sample sample) {
        sample.stop(authenticationTime);
    }

    // Cache Metrics Methods
    public void recordCacheHit(String cacheName) {
        cacheHits.increment();
        Counter.builder("cache.hits")
                .tag("cache", cacheName)
                .register(meterRegistry)
                .increment();
    }

    public void recordCacheMiss(String cacheName) {
        cacheMisses.increment();
        Counter.builder("cache.misses")
                .tag("cache", cacheName)
                .register(meterRegistry)
                .increment();
    }

    public Timer.Sample startCacheLoad() {
        return Timer.start(meterRegistry);
    }

    public void endCacheLoad(Timer.Sample sample, String cacheName) {
        Timer.builder("cache.load.time")
                .tag("cache", cacheName)
                .register(meterRegistry)
                .record(() -> sample.stop(cacheLoadTime));
    }

    // Tenant Metrics Methods
    public void recordTenantRequest(String tenantId) {
        Counter.builder("tenant.requests")
                .tag("tenant", tenantId)
                .register(meterRegistry)
                .increment();
    }

    public Timer.Sample startTenantContextResolution() {
        return Timer.start(meterRegistry);
    }

    public void endTenantContextResolution(Timer.Sample sample) {
        sample.stop(tenantContextResolutionTime);
    }

    // Payment Metrics Methods
    public void recordPaymentProcessed() {
        paymentsProcessed.increment();
    }

    public void recordPaymentSucceeded(String gateway) {
        paymentsSucceeded.increment();
        Counter.builder("payments.succeeded")
                .tag("gateway", gateway)
                .register(meterRegistry)
                .increment();
    }

    public void recordPaymentFailed(String reason) {
        paymentsFailed.increment();
        Counter.builder("payments.failed")
                .tag("reason", reason)
                .register(meterRegistry)
                .increment();
    }

    public Timer.Sample startPaymentProcessing() {
        return Timer.start(meterRegistry);
    }

    public void endPaymentProcessing(Timer.Sample sample) {
        sample.stop(paymentProcessingTime);
    }

    // Utility Methods
    public MeterRegistry getMeterRegistry() {
        return meterRegistry;
    }
}
