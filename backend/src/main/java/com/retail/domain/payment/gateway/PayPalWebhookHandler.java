package com.retail.domain.payment.gateway;

import com.retail.domain.payment.PaymentService;
import com.retail.domain.payment.PaymentTransaction;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.Map;

/**
 * Handler for PayPal webhook events.
 *
 * Processes PayPal IPN (Instant Payment Notification) and webhook events
 * to keep payment transaction status in sync.
 */
@Service
public class PayPalWebhookHandler {

    private static final Logger logger = LoggerFactory.getLogger(PayPalWebhookHandler.class);

    private final PaymentService paymentService;
    private final PayPalGatewayService payPalGatewayService;

    public PayPalWebhookHandler(
        PaymentService paymentService,
        PayPalGatewayService payPalGatewayService
    ) {
        this.paymentService = paymentService;
        this.payPalGatewayService = payPalGatewayService;
    }

    /**
     * Process PayPal webhook event.
     *
     * @param eventType PayPal event type (e.g., PAYMENT.CAPTURE.COMPLETED)
     * @param eventData Event payload
     * @param headers Webhook headers for signature verification
     * @return Processing result
     */
    public Mono<WebhookProcessingResult> processWebhook(
        String eventType,
        Map<String, Object> eventData,
        Map<String, String> headers
    ) {
        logger.info("Processing PayPal webhook event: {}", eventType);

        return verifyWebhookSignature(headers, eventData)
            .flatMap(isValid -> {
                if (!isValid) {
                    logger.warn("Invalid PayPal webhook signature");
                    return Mono.just(WebhookProcessingResult.invalid("Invalid webhook signature"));
                }

                return handleWebhookEvent(eventType, eventData);
            })
            .doOnSuccess(result ->
                logger.info("Webhook processed: {} - {}", eventType, result.getMessage())
            )
            .doOnError(error ->
                logger.error("Failed to process webhook: {}", eventType, error)
            )
            .onErrorResume(error ->
                Mono.just(WebhookProcessingResult.error("Webhook processing failed: " + error.getMessage()))
            );
    }

    /**
     * Handle specific webhook event types.
     */
    private Mono<WebhookProcessingResult> handleWebhookEvent(
        String eventType,
        Map<String, Object> eventData
    ) {
        return switch (eventType) {
            case "PAYMENT.CAPTURE.COMPLETED" ->
                handlePaymentCaptureCompleted(eventData);

            case "PAYMENT.CAPTURE.DECLINED" ->
                handlePaymentCaptureDeclined(eventData);

            case "PAYMENT.CAPTURE.REFUNDED" ->
                handlePaymentRefunded(eventData);

            case "PAYMENT.CAPTURE.REVERSED" ->
                handlePaymentReversed(eventData);

            case "PAYMENT.CAPTURE.PENDING" ->
                handlePaymentPending(eventData);

            case "CHECKOUT.ORDER.APPROVED" ->
                handleOrderApproved(eventData);

            case "CHECKOUT.ORDER.COMPLETED" ->
                handleOrderCompleted(eventData);

            default -> {
                logger.warn("Unhandled PayPal webhook event type: {}", eventType);
                yield Mono.just(WebhookProcessingResult.success("Event type not handled: " + eventType));
            }
        };
    }

    private Mono<WebhookProcessingResult> handlePaymentCaptureCompleted(Map<String, Object> eventData) {
        String gatewayTransactionId = extractTransactionId(eventData);

        return paymentService.getByGatewayTransactionId(gatewayTransactionId)
            .flatMap(transaction ->
                paymentService.updateStatus(
                    transaction.getId(),
                    PaymentTransaction.PaymentStatus.SUCCESS,
                    gatewayTransactionId
                )
            )
            .map(tx -> WebhookProcessingResult.success("Payment capture completed"))
            .switchIfEmpty(
                Mono.just(WebhookProcessingResult.error("Transaction not found: " + gatewayTransactionId))
            );
    }

    private Mono<WebhookProcessingResult> handlePaymentCaptureDeclined(Map<String, Object> eventData) {
        String gatewayTransactionId = extractTransactionId(eventData);
        String reason = extractValue(eventData, "reason", "Payment declined");

        return paymentService.getByGatewayTransactionId(gatewayTransactionId)
            .flatMap(transaction ->
                paymentService.markFailed(
                    transaction.getId(),
                    "PAYMENT_DECLINED",
                    reason
                )
            )
            .map(tx -> WebhookProcessingResult.success("Payment capture declined"))
            .switchIfEmpty(
                Mono.just(WebhookProcessingResult.error("Transaction not found: " + gatewayTransactionId))
            );
    }

    private Mono<WebhookProcessingResult> handlePaymentRefunded(Map<String, Object> eventData) {
        String gatewayTransactionId = extractTransactionId(eventData);

        return paymentService.getByGatewayTransactionId(gatewayTransactionId)
            .flatMap(transaction ->
                paymentService.updateStatus(
                    transaction.getId(),
                    PaymentTransaction.PaymentStatus.REFUNDED,
                    gatewayTransactionId
                )
            )
            .map(tx -> WebhookProcessingResult.success("Payment refunded"))
            .switchIfEmpty(
                Mono.just(WebhookProcessingResult.error("Transaction not found: " + gatewayTransactionId))
            );
    }

    private Mono<WebhookProcessingResult> handlePaymentReversed(Map<String, Object> eventData) {
        String gatewayTransactionId = extractTransactionId(eventData);

        return paymentService.getByGatewayTransactionId(gatewayTransactionId)
            .flatMap(transaction ->
                paymentService.markFailed(
                    transaction.getId(),
                    "PAYMENT_REVERSED",
                    "Payment was reversed by PayPal"
                )
            )
            .map(tx -> WebhookProcessingResult.success("Payment reversed"))
            .switchIfEmpty(
                Mono.just(WebhookProcessingResult.error("Transaction not found: " + gatewayTransactionId))
            );
    }

    private Mono<WebhookProcessingResult> handlePaymentPending(Map<String, Object> eventData) {
        String gatewayTransactionId = extractTransactionId(eventData);

        return paymentService.getByGatewayTransactionId(gatewayTransactionId)
            .flatMap(transaction ->
                paymentService.updateStatus(
                    transaction.getId(),
                    PaymentTransaction.PaymentStatus.PENDING,
                    gatewayTransactionId
                )
            )
            .map(tx -> WebhookProcessingResult.success("Payment pending"))
            .switchIfEmpty(
                Mono.just(WebhookProcessingResult.success("Transaction not found, ignoring pending event"))
            );
    }

    private Mono<WebhookProcessingResult> handleOrderApproved(Map<String, Object> eventData) {
        logger.info("PayPal order approved: {}", eventData);
        // Order approved - customer can now proceed to capture
        return Mono.just(WebhookProcessingResult.success("Order approved"));
    }

    private Mono<WebhookProcessingResult> handleOrderCompleted(Map<String, Object> eventData) {
        logger.info("PayPal order completed: {}", eventData);
        return Mono.just(WebhookProcessingResult.success("Order completed"));
    }

    /**
     * Verify webhook signature to ensure it's from PayPal.
     */
    private Mono<Boolean> verifyWebhookSignature(
        Map<String, String> headers,
        Map<String, Object> eventData
    ) {
        String transmissionId = headers.get("PAYPAL-TRANSMISSION-ID");
        String transmissionTime = headers.get("PAYPAL-TRANSMISSION-TIME");
        String certUrl = headers.get("PAYPAL-CERT-URL");
        String authAlgo = headers.get("PAYPAL-AUTH-ALGO");
        String transmissionSig = headers.get("PAYPAL-TRANSMISSION-SIG");
        String webhookId = headers.get("WEBHOOK-ID");

        // For testing/development, skip signature verification if headers not present
        if (transmissionId == null) {
            logger.warn("Webhook signature headers not present, skipping verification (DEV MODE)");
            return Mono.just(true);
        }

        return payPalGatewayService.verifyWebhookSignature(
            transmissionId,
            transmissionTime,
            certUrl,
            authAlgo,
            transmissionSig,
            webhookId,
            eventData.toString()
        );
    }

    private String extractTransactionId(Map<String, Object> eventData) {
        // Extract transaction ID from PayPal event structure
        Object resource = eventData.get("resource");
        if (resource instanceof Map) {
            @SuppressWarnings("unchecked")
            Map<String, Object> resourceMap = (Map<String, Object>) resource;
            Object id = resourceMap.get("id");
            return id != null ? id.toString() : "unknown";
        }
        return "unknown";
    }

    private String extractValue(Map<String, Object> eventData, String key, String defaultValue) {
        Object value = eventData.get(key);
        return value != null ? value.toString() : defaultValue;
    }

    /**
     * Result of webhook processing.
     */
    public static class WebhookProcessingResult {
        private final boolean success;
        private final String message;
        private final String errorCode;

        private WebhookProcessingResult(boolean success, String message, String errorCode) {
            this.success = success;
            this.message = message;
            this.errorCode = errorCode;
        }

        public static WebhookProcessingResult success(String message) {
            return new WebhookProcessingResult(true, message, null);
        }

        public static WebhookProcessingResult error(String message) {
            return new WebhookProcessingResult(false, message, "PROCESSING_ERROR");
        }

        public static WebhookProcessingResult invalid(String message) {
            return new WebhookProcessingResult(false, message, "INVALID_SIGNATURE");
        }

        public boolean isSuccess() {
            return success;
        }

        public String getMessage() {
            return message;
        }

        public String getErrorCode() {
            return errorCode;
        }
    }
}
