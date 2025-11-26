package com.retail.domain.payment;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.Objects;

/**
 * Payment transaction entity stored in PostgreSQL for ACID compliance.
 * Tracks payment attempts, status, and external gateway references.
 */
@Entity
@Table(
    name = "payment_transactions",
    indexes = {
        @Index(name = "idx_tenant_order", columnList = "tenant_id,order_id"),
        @Index(name = "idx_gateway_ref", columnList = "gateway_transaction_id"),
        @Index(name = "idx_created_at", columnList = "created_at")
    }
)
public class PaymentTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @NotBlank(message = "Tenant ID is required")
    @Column(name = "tenant_id", nullable = false, length = 100)
    private String tenantId;

    @NotBlank(message = "Order ID is required")
    @Column(name = "order_id", nullable = false, length = 100)
    private String orderId;

    @Column(name = "customer_id", length = 100)
    private String customerId;

    @NotNull(message = "Amount is required")
    @Column(nullable = false, precision = 19, scale = 4)
    private BigDecimal amount;

    @NotBlank(message = "Currency is required")
    @Column(nullable = false, length = 3)
    private String currency = "USD";

    @NotNull(message = "Payment method is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", nullable = false, length = 50)
    private PaymentMethod paymentMethod;

    @NotNull(message = "Status is required")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private PaymentStatus status = PaymentStatus.PENDING;

    @NotBlank(message = "Gateway is required")
    @Column(nullable = false, length = 50)
    private String gateway; // e.g., "STRIPE", "PAYPAL"

    @Column(name = "gateway_transaction_id", length = 255)
    private String gatewayTransactionId;

    @Column(name = "gateway_payment_intent_id", length = 255)
    private String gatewayPaymentIntentId;

    @Column(name = "failure_code", length = 100)
    private String failureCode;

    @Column(name = "failure_message", length = 500)
    private String failureMessage;

    @Column(name = "refund_amount", precision = 19, scale = 4)
    private BigDecimal refundAmount;

    @Column(name = "refund_reason", length = 500)
    private String refundReason;

    @Column(name = "refunded_at")
    private Instant refundedAt;

    @Column(name = "retry_count")
    private Integer retryCount = 0;

    @Column(name = "last_retry_at")
    private Instant lastRetryAt;

    @Column(name = "metadata", columnDefinition = "TEXT")
    private String metadata; // JSON string for additional gateway-specific data

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    // Constructors
    public PaymentTransaction() {
    }

    @PrePersist
    protected void onCreate() {
        Instant now = Instant.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();

        // Set completedAt when status becomes final
        if (completedAt == null && isFinalStatus()) {
            completedAt = Instant.now();
        }
    }

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getTenantId() {
        return tenantId;
    }

    public void setTenantId(String tenantId) {
        this.tenantId = tenantId;
    }

    public String getOrderId() {
        return orderId;
    }

    public void setOrderId(String orderId) {
        this.orderId = orderId;
    }

    public String getCustomerId() {
        return customerId;
    }

    public void setCustomerId(String customerId) {
        this.customerId = customerId;
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

    public PaymentMethod getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(PaymentMethod paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public PaymentStatus getStatus() {
        return status;
    }

    public void setStatus(PaymentStatus status) {
        this.status = status;
    }

    public String getGateway() {
        return gateway;
    }

    public void setGateway(String gateway) {
        this.gateway = gateway;
    }

    public String getGatewayTransactionId() {
        return gatewayTransactionId;
    }

    public void setGatewayTransactionId(String gatewayTransactionId) {
        this.gatewayTransactionId = gatewayTransactionId;
    }

    public String getGatewayPaymentIntentId() {
        return gatewayPaymentIntentId;
    }

    public void setGatewayPaymentIntentId(String gatewayPaymentIntentId) {
        this.gatewayPaymentIntentId = gatewayPaymentIntentId;
    }

    public String getFailureCode() {
        return failureCode;
    }

    public void setFailureCode(String failureCode) {
        this.failureCode = failureCode;
    }

    public String getFailureMessage() {
        return failureMessage;
    }

    public void setFailureMessage(String failureMessage) {
        this.failureMessage = failureMessage;
    }

    public BigDecimal getRefundAmount() {
        return refundAmount;
    }

    public void setRefundAmount(BigDecimal refundAmount) {
        this.refundAmount = refundAmount;
    }

    public String getRefundReason() {
        return refundReason;
    }

    public void setRefundReason(String refundReason) {
        this.refundReason = refundReason;
    }

    public Instant getRefundedAt() {
        return refundedAt;
    }

    public void setRefundedAt(Instant refundedAt) {
        this.refundedAt = refundedAt;
    }

    public Integer getRetryCount() {
        return retryCount;
    }

    public void setRetryCount(Integer retryCount) {
        this.retryCount = retryCount;
    }

    public Instant getLastRetryAt() {
        return lastRetryAt;
    }

    public void setLastRetryAt(Instant lastRetryAt) {
        this.lastRetryAt = lastRetryAt;
    }

    public String getMetadata() {
        return metadata;
    }

    public void setMetadata(String metadata) {
        this.metadata = metadata;
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

    public Instant getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(Instant completedAt) {
        this.completedAt = completedAt;
    }

    // Helper methods
    public boolean isFinalStatus() {
        return status == PaymentStatus.SUCCESS ||
               status == PaymentStatus.FAILED ||
               status == PaymentStatus.REFUNDED ||
               status == PaymentStatus.CANCELLED;
    }

    public boolean canRetry() {
        return status == PaymentStatus.FAILED && retryCount < 3;
    }

    public void incrementRetryCount() {
        this.retryCount++;
        this.lastRetryAt = Instant.now();
    }

    // equals, hashCode, and toString
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        PaymentTransaction that = (PaymentTransaction) o;
        return Objects.equals(id, that.id) &&
               Objects.equals(tenantId, that.tenantId) &&
               Objects.equals(orderId, that.orderId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, tenantId, orderId);
    }

    @Override
    public String toString() {
        return "PaymentTransaction{" +
                "id='" + id + '\'' +
                ", tenantId='" + tenantId + '\'' +
                ", orderId='" + orderId + '\'' +
                ", amount=" + amount +
                ", currency='" + currency + '\'' +
                ", status=" + status +
                ", gateway='" + gateway + '\'' +
                ", gatewayTransactionId='" + gatewayTransactionId + '\'' +
                ", createdAt=" + createdAt +
                '}';
    }

    /**
     * Payment method types
     */
    public enum PaymentMethod {
        CREDIT_CARD,
        DEBIT_CARD,
        PAYPAL,
        APPLE_PAY,
        GOOGLE_PAY,
        BANK_TRANSFER,
        CASH_ON_DELIVERY
    }

    /**
     * Payment transaction statuses
     */
    public enum PaymentStatus {
        PENDING,        // Payment initiated but not processed
        PROCESSING,     // Payment being processed by gateway
        SUCCESS,        // Payment successful
        FAILED,         // Payment failed
        REFUNDED,       // Payment was refunded
        PARTIALLY_REFUNDED, // Partial refund issued
        CANCELLED,      // Payment cancelled before processing
        EXPIRED         // Payment session expired
    }
}
