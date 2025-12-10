package com.retail.web.controller;

import com.retail.domain.payment.*;
import com.retail.security.tenant.TenantContext;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.math.BigDecimal;
import java.util.Map;

/**
 * REST controller for payment operations.
 * Handles payment initiation, verification, capture, refunds, and webhooks.
 */
@RestController
@RequestMapping("/api/v1/payments")
@Tag(name = "Payment", description = "Payment management endpoints")
public class PaymentController {

    private static final Logger log = LoggerFactory.getLogger(PaymentController.class);

    private final UnifiedPaymentService paymentService;

    public PaymentController(UnifiedPaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping("/initiate")
    @Operation(summary = "Initiate a payment", description = "Creates a new payment transaction with the specified provider")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Payment initiated successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid payment request"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    public Mono<ResponseEntity<PaymentResponse>> initiatePayment(
            @Valid @RequestBody PaymentRequest request) {

        // Set tenant ID from context if not provided
        Mono<PaymentRequest> requestMono;
        if (request.getTenantId() == null) {
            requestMono = TenantContext.getTenantIdOrEmpty()
                    .map(tenantId -> {
                        request.setTenantId(tenantId);
                        return request;
                    })
                    .defaultIfEmpty(request);
        } else {
            requestMono = Mono.just(request);
        }

        return requestMono.flatMap(req -> {
            log.info("Initiating payment for order {} with provider {} and amount {} {}",
                    req.getOrderId(), req.getProvider(), req.getAmount(), req.getCurrency());

            return paymentService.initiatePayment(req)
                    .map(ResponseEntity::ok)
                    .onErrorReturn(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build());
        });
    }

    @PostMapping("/{transactionId}/capture")
    @Operation(summary = "Capture a payment", description = "Captures a previously authorized payment")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Payment captured successfully"),
            @ApiResponse(responseCode = "404", description = "Transaction not found"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    public Mono<ResponseEntity<PaymentResponse>> capturePayment(
            @Parameter(description = "Transaction ID to capture") @PathVariable String transactionId,
            @Parameter(description = "Amount to capture (optional, defaults to full amount)")
            @RequestParam(required = false) BigDecimal amount) {

        log.info("Capturing payment for transaction {} with amount {}", transactionId, amount);

        return paymentService.capturePayment(transactionId, amount)
                .map(ResponseEntity::ok)
                .onErrorReturn(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build());
    }

    @GetMapping("/{transactionId}/verify")
    @Operation(summary = "Verify payment status", description = "Verifies the current status of a payment transaction")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Payment status retrieved successfully"),
            @ApiResponse(responseCode = "404", description = "Transaction not found"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    public Mono<ResponseEntity<PaymentResponse>> verifyPayment(
            @Parameter(description = "Transaction ID to verify") @PathVariable String transactionId) {

        log.info("Verifying payment status for transaction {}", transactionId);

        return paymentService.verifyPayment(transactionId)
                .map(ResponseEntity::ok)
                .onErrorReturn(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build());
    }

    @PostMapping("/{transactionId}/refund")
    @Operation(summary = "Refund a payment", description = "Processes a full or partial refund for a payment")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Refund processed successfully"),
            @ApiResponse(responseCode = "404", description = "Transaction not found"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    public Mono<ResponseEntity<PaymentResponse>> refundPayment(
            @Parameter(description = "Transaction ID to refund") @PathVariable String transactionId,
            @Parameter(description = "Amount to refund (optional, defaults to full refund)")
            @RequestParam(required = false) BigDecimal amount,
            @Parameter(description = "Reason for refund")
            @RequestParam(required = false) String reason) {

        log.info("Processing refund for transaction {} with amount {} and reason: {}",
                transactionId, amount, reason);

        return paymentService.refundPayment(transactionId, amount, reason)
                .map(ResponseEntity::ok)
                .onErrorReturn(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build());
    }

    @PostMapping("/{transactionId}/cancel")
    @Operation(summary = "Cancel a payment", description = "Cancels a pending payment transaction")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Payment cancelled successfully"),
            @ApiResponse(responseCode = "404", description = "Transaction not found"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    public Mono<ResponseEntity<PaymentResponse>> cancelPayment(
            @Parameter(description = "Transaction ID to cancel") @PathVariable String transactionId) {

        log.info("Cancelling payment transaction {}", transactionId);

        return paymentService.cancelPayment(transactionId)
                .map(ResponseEntity::ok)
                .onErrorReturn(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build());
    }

    @GetMapping("/providers")
    @Operation(summary = "Get available payment providers", description = "Returns list of available payment providers for the current tenant")
    @ApiResponse(responseCode = "200", description = "List of payment providers retrieved successfully")
    public Flux<UnifiedPaymentService.PaymentProviderInfo> getAvailableProviders() {
        return TenantContext.getTenantIdOrEmpty()
                .flatMapMany(tenantId -> {
                    log.info("Getting available payment providers for tenant {}", tenantId);
                    return paymentService.getAvailableProviders(tenantId);
                })
                .switchIfEmpty(Flux.defer(() -> {
                    log.warn("No tenant ID in context, returning empty provider list");
                    return Flux.empty();
                }));
    }

    @GetMapping("/transactions/{transactionId}")
    @Operation(summary = "Get transaction details", description = "Retrieves details of a payment transaction")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Transaction details retrieved successfully"),
            @ApiResponse(responseCode = "404", description = "Transaction not found")
    })
    public Mono<ResponseEntity<UnifiedPaymentService.PaymentTransaction>> getTransaction(
            @Parameter(description = "Transaction ID") @PathVariable String transactionId) {

        log.info("Getting transaction details for {}", transactionId);

        return paymentService.getTransaction(transactionId)
                .map(ResponseEntity::ok)
                .onErrorResume(UnifiedPaymentService.PaymentException.class,
                        e -> Mono.just(ResponseEntity.notFound().build()));
    }

    @PostMapping("/webhooks/paypal")
    @Operation(summary = "PayPal webhook endpoint", description = "Handles webhooks from PayPal")
    public Mono<ResponseEntity<Void>> handlePayPalWebhook(
            @RequestHeader Map<String, String> headers,
            @RequestBody String payload) {

        log.info("Received PayPal webhook");
        log.debug("PayPal webhook headers: {}", headers);

        return paymentService.handleWebhook(PaymentProvider.PAYPAL, headers, payload)
                .then(Mono.just(ResponseEntity.ok().build()));
    }

    @PostMapping("/webhooks/stripe")
    @Operation(summary = "Stripe webhook endpoint", description = "Handles webhooks from Stripe")
    public Mono<ResponseEntity<Void>> handleStripeWebhook(
            @RequestHeader Map<String, String> headers,
            @RequestBody String payload) {

        log.info("Received Stripe webhook");
        log.debug("Stripe webhook headers: {}", headers);

        return paymentService.handleWebhook(PaymentProvider.STRIPE, headers, payload)
                .then(Mono.just(ResponseEntity.ok().build()));
    }

    /**
     * Health check endpoint for payment services.
     */
    @GetMapping("/health")
    @Operation(summary = "Payment service health check", description = "Checks the health of payment services")
    public Mono<ResponseEntity<Map<String, String>>> healthCheck() {
        return Mono.just(ResponseEntity.ok(Map.of(
                "status", "UP",
                "service", "Payment Service",
                "timestamp", java.time.Instant.now().toString()
        )));
    }
}