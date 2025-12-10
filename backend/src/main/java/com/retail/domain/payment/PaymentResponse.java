package com.retail.domain.payment;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;

/**
 * Response model for payment operations.
 */
public class PaymentResponse {

    private String transactionId;
    private String orderId;
    private PaymentStatus status;
    private PaymentProvider provider;
    private BigDecimal amount;
    private String currency;
    private String message;
    private Instant createdAt;
    private Instant updatedAt;

    // For redirect-based flows (PayPal, etc.)
    private String redirectUrl;

    // For client-side flows (Apple Pay, Google Pay)
    private String clientToken;
    private Map<String, String> clientConfig;

    // Provider-specific response data
    private Map<String, Object> providerResponse;

    // Error information
    private String errorCode;
    private String errorMessage;

    public enum PaymentStatus {
        PENDING,
        PROCESSING,
        AUTHORIZED,
        CAPTURED,
        COMPLETED,
        FAILED,
        CANCELLED,
        REFUNDED,
        PARTIALLY_REFUNDED
    }

    // Constructor
    public PaymentResponse() {
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    // Builder pattern for easier construction
    public static PaymentResponseBuilder builder() {
        return new PaymentResponseBuilder();
    }

    // Getters and Setters
    public String getTransactionId() {
        return transactionId;
    }

    public void setTransactionId(String transactionId) {
        this.transactionId = transactionId;
    }

    public String getOrderId() {
        return orderId;
    }

    public void setOrderId(String orderId) {
        this.orderId = orderId;
    }

    public PaymentStatus getStatus() {
        return status;
    }

    public void setStatus(PaymentStatus status) {
        this.status = status;
    }

    public PaymentProvider getProvider() {
        return provider;
    }

    public void setProvider(PaymentProvider provider) {
        this.provider = provider;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }

    public String getRedirectUrl() {
        return redirectUrl;
    }

    public void setRedirectUrl(String redirectUrl) {
        this.redirectUrl = redirectUrl;
    }

    public String getClientToken() {
        return clientToken;
    }

    public void setClientToken(String clientToken) {
        this.clientToken = clientToken;
    }

    public Map<String, String> getClientConfig() {
        return clientConfig;
    }

    public void setClientConfig(Map<String, String> clientConfig) {
        this.clientConfig = clientConfig;
    }

    public Map<String, Object> getProviderResponse() {
        return providerResponse;
    }

    public void setProviderResponse(Map<String, Object> providerResponse) {
        this.providerResponse = providerResponse;
    }

    public String getErrorCode() {
        return errorCode;
    }

    public void setErrorCode(String errorCode) {
        this.errorCode = errorCode;
    }

    public String getErrorMessage() {
        return errorMessage;
    }

    public void setErrorMessage(String errorMessage) {
        this.errorMessage = errorMessage;
    }

    // Builder class
    public static class PaymentResponseBuilder {
        private PaymentResponse response;

        public PaymentResponseBuilder() {
            this.response = new PaymentResponse();
        }

        public PaymentResponseBuilder transactionId(String transactionId) {
            response.transactionId = transactionId;
            return this;
        }

        public PaymentResponseBuilder orderId(String orderId) {
            response.orderId = orderId;
            return this;
        }

        public PaymentResponseBuilder status(PaymentStatus status) {
            response.status = status;
            return this;
        }

        public PaymentResponseBuilder provider(PaymentProvider provider) {
            response.provider = provider;
            return this;
        }

        public PaymentResponseBuilder amount(BigDecimal amount) {
            response.amount = amount;
            return this;
        }

        public PaymentResponseBuilder currency(String currency) {
            response.currency = currency;
            return this;
        }

        public PaymentResponseBuilder message(String message) {
            response.message = message;
            return this;
        }

        public PaymentResponseBuilder redirectUrl(String redirectUrl) {
            response.redirectUrl = redirectUrl;
            return this;
        }

        public PaymentResponseBuilder clientToken(String clientToken) {
            response.clientToken = clientToken;
            return this;
        }

        public PaymentResponseBuilder clientConfig(Map<String, String> clientConfig) {
            response.clientConfig = clientConfig;
            return this;
        }

        public PaymentResponseBuilder providerResponse(Map<String, Object> providerResponse) {
            response.providerResponse = providerResponse;
            return this;
        }

        public PaymentResponseBuilder errorCode(String errorCode) {
            response.errorCode = errorCode;
            return this;
        }

        public PaymentResponseBuilder errorMessage(String errorMessage) {
            response.errorMessage = errorMessage;
            return this;
        }

        public PaymentResponse build() {
            return response;
        }
    }
}