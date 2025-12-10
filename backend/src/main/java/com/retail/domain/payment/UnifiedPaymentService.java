package com.retail.domain.payment;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Unified payment service that orchestrates multiple payment providers.
 * Routes payment requests to the appropriate provider based on the payment method.
 */
@Service
public class UnifiedPaymentService {

    private static final Logger log = LoggerFactory.getLogger(UnifiedPaymentService.class);

    private final List<PaymentProviderService> paymentProviders;
    private final Map<String, PaymentTransaction> transactionStore;

    public UnifiedPaymentService(List<PaymentProviderService> paymentProviders) {
        this.paymentProviders = paymentProviders;
        this.transactionStore = new ConcurrentHashMap<>();
        log.info("UnifiedPaymentService initialized with {} payment providers", paymentProviders.size());
        paymentProviders.forEach(provider ->
                log.info("  - {} provider registered", provider.getProvider()));
    }

    /**
     * Initiate a payment with the specified provider.
     */
    public Mono<PaymentResponse> initiatePayment(PaymentRequest request) {
        return findProvider(request.getProvider())
                .flatMap(provider -> {
                    log.info("Initiating {} payment for order {} with amount {} {}",
                            request.getProvider(), request.getOrderId(),
                            request.getAmount(), request.getCurrency());
                    return provider.initiatePayment(request);
                })
                .doOnSuccess(response -> {
                    // Store transaction for later reference
                    if (response.getTransactionId() != null) {
                        PaymentTransaction transaction = new PaymentTransaction(
                                response.getTransactionId(),
                                request.getOrderId(),
                                request.getTenantId(),
                                request.getProvider(),
                                response.getStatus(),
                                request.getAmount(),
                                request.getCurrency()
                        );
                        transactionStore.put(response.getTransactionId(), transaction);
                    }
                    log.info("Payment initiated successfully: transactionId={}, status={}",
                            response.getTransactionId(), response.getStatus());
                })
                .doOnError(error -> log.error("Payment initiation failed: {}", error.getMessage()));
    }

    /**
     * Capture a previously authorized payment.
     */
    public Mono<PaymentResponse> capturePayment(String transactionId, BigDecimal amount) {
        return getTransactionProvider(transactionId)
                .flatMap(provider -> {
                    log.info("Capturing payment for transaction {} with amount {}",
                            transactionId, amount);
                    return provider.capturePayment(transactionId, amount);
                })
                .doOnSuccess(response -> {
                    updateTransactionStatus(transactionId, response.getStatus());
                    log.info("Payment captured successfully: transactionId={}, status={}",
                            transactionId, response.getStatus());
                })
                .doOnError(error -> log.error("Payment capture failed: {}", error.getMessage()));
    }

    /**
     * Verify the status of a payment transaction.
     */
    public Mono<PaymentResponse> verifyPayment(String transactionId) {
        return getTransactionProvider(transactionId)
                .flatMap(provider -> {
                    log.info("Verifying payment status for transaction {}", transactionId);
                    return provider.verifyPayment(transactionId);
                })
                .doOnSuccess(response -> {
                    updateTransactionStatus(transactionId, response.getStatus());
                    log.info("Payment verification completed: transactionId={}, status={}",
                            transactionId, response.getStatus());
                })
                .doOnError(error -> log.error("Payment verification failed: {}", error.getMessage()));
    }

    /**
     * Refund a payment transaction.
     */
    public Mono<PaymentResponse> refundPayment(String transactionId, BigDecimal amount, String reason) {
        return getTransactionProvider(transactionId)
                .flatMap(provider -> {
                    log.info("Processing refund for transaction {} with amount {} and reason: {}",
                            transactionId, amount, reason);
                    return provider.refundPayment(transactionId, amount, reason);
                })
                .doOnSuccess(response -> {
                    updateTransactionStatus(transactionId, response.getStatus());
                    log.info("Refund processed successfully: transactionId={}, status={}",
                            transactionId, response.getStatus());
                })
                .doOnError(error -> log.error("Refund processing failed: {}", error.getMessage()));
    }

    /**
     * Cancel a payment transaction.
     */
    public Mono<PaymentResponse> cancelPayment(String transactionId) {
        return getTransactionProvider(transactionId)
                .flatMap(provider -> {
                    log.info("Cancelling payment transaction {}", transactionId);
                    return provider.cancelPayment(transactionId);
                })
                .doOnSuccess(response -> {
                    updateTransactionStatus(transactionId, response.getStatus());
                    log.info("Payment cancelled successfully: transactionId={}, status={}",
                            transactionId, response.getStatus());
                })
                .doOnError(error -> log.error("Payment cancellation failed: {}", error.getMessage()));
    }

    /**
     * Get available payment providers for a tenant.
     */
    public Flux<PaymentProviderInfo> getAvailableProviders(String tenantId) {
        return Flux.fromIterable(paymentProviders)
                .map(provider -> new PaymentProviderInfo(
                        provider.getProvider(),
                        provider.getProvider().getDisplayName(),
                        isProviderEnabled(provider.getProvider(), tenantId)
                ));
    }

    /**
     * Handle webhook callbacks from payment providers.
     */
    public Mono<Void> handleWebhook(PaymentProvider provider, Map<String, String> headers, String payload) {
        return findProvider(provider)
                .flatMap(providerService -> {
                    log.info("Processing webhook from {} provider", provider);
                    // Provider-specific webhook handling would go here
                    // For now, just log the webhook
                    log.debug("Webhook payload: {}", payload);
                    return Mono.empty();
                })
                .then();
    }

    /**
     * Get transaction details.
     */
    public Mono<PaymentTransaction> getTransaction(String transactionId) {
        PaymentTransaction transaction = transactionStore.get(transactionId);
        if (transaction != null) {
            return Mono.just(transaction);
        }
        return Mono.error(new PaymentException("Transaction not found: " + transactionId));
    }

    private Mono<PaymentProviderService> findProvider(PaymentProvider provider) {
        return Flux.fromIterable(paymentProviders)
                .filter(p -> p.supports(provider))
                .next()
                .switchIfEmpty(Mono.error(new PaymentException("No provider found for: " + provider)));
    }

    private Mono<PaymentProviderService> getTransactionProvider(String transactionId) {
        PaymentTransaction transaction = transactionStore.get(transactionId);
        if (transaction == null) {
            return Mono.error(new PaymentException("Transaction not found: " + transactionId));
        }
        return findProvider(transaction.getProvider());
    }

    private void updateTransactionStatus(String transactionId, PaymentResponse.PaymentStatus status) {
        PaymentTransaction transaction = transactionStore.get(transactionId);
        if (transaction != null) {
            transaction.setStatus(status);
            transaction.setUpdatedAt(java.time.Instant.now());
        }
    }

    private boolean isProviderEnabled(PaymentProvider provider, String tenantId) {
        // In a real implementation, this would check tenant-specific configuration
        // For now, all providers are enabled for all tenants
        return true;
    }

    /**
     * Payment provider information DTO.
     */
    public static class PaymentProviderInfo {
        private final PaymentProvider provider;
        private final String displayName;
        private final boolean enabled;

        public PaymentProviderInfo(PaymentProvider provider, String displayName, boolean enabled) {
            this.provider = provider;
            this.displayName = displayName;
            this.enabled = enabled;
        }

        public PaymentProvider getProvider() {
            return provider;
        }

        public String getDisplayName() {
            return displayName;
        }

        public boolean isEnabled() {
            return enabled;
        }
    }

    /**
     * Payment transaction record.
     */
    public static class PaymentTransaction {
        private final String transactionId;
        private final String orderId;
        private final String tenantId;
        private final PaymentProvider provider;
        private PaymentResponse.PaymentStatus status;
        private final BigDecimal amount;
        private final String currency;
        private final java.time.Instant createdAt;
        private java.time.Instant updatedAt;

        public PaymentTransaction(String transactionId, String orderId, String tenantId,
                                  PaymentProvider provider, PaymentResponse.PaymentStatus status,
                                  BigDecimal amount, String currency) {
            this.transactionId = transactionId;
            this.orderId = orderId;
            this.tenantId = tenantId;
            this.provider = provider;
            this.status = status;
            this.amount = amount;
            this.currency = currency;
            this.createdAt = java.time.Instant.now();
            this.updatedAt = java.time.Instant.now();
        }

        // Getters and setters
        public String getTransactionId() {
            return transactionId;
        }

        public String getOrderId() {
            return orderId;
        }

        public String getTenantId() {
            return tenantId;
        }

        public PaymentProvider getProvider() {
            return provider;
        }

        public PaymentResponse.PaymentStatus getStatus() {
            return status;
        }

        public void setStatus(PaymentResponse.PaymentStatus status) {
            this.status = status;
        }

        public BigDecimal getAmount() {
            return amount;
        }

        public String getCurrency() {
            return currency;
        }

        public java.time.Instant getCreatedAt() {
            return createdAt;
        }

        public java.time.Instant getUpdatedAt() {
            return updatedAt;
        }

        public void setUpdatedAt(java.time.Instant updatedAt) {
            this.updatedAt = updatedAt;
        }
    }

    /**
     * Payment processing exception.
     */
    public static class PaymentException extends RuntimeException {
        public PaymentException(String message) {
            super(message);
        }

        public PaymentException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}