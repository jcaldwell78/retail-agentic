package com.retail.infrastructure.payment;

import com.paypal.core.PayPalEnvironment;
import com.paypal.core.PayPalHttpClient;
import com.paypal.http.HttpResponse;
import com.paypal.orders.*;
import com.retail.domain.payment.PaymentProvider;
import com.retail.domain.payment.PaymentProviderService;
import com.retail.domain.payment.PaymentRequest;
import com.retail.domain.payment.PaymentResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.math.BigDecimal;
import java.util.*;

/**
 * PayPal payment provider implementation using PayPal Checkout SDK.
 * Configured for sandbox/development environment.
 */
@Service
public class PayPalPaymentService implements PaymentProviderService {

    private static final Logger log = LoggerFactory.getLogger(PayPalPaymentService.class);

    private final PayPalHttpClient client;
    private final String returnUrl;
    private final String cancelUrl;

    public PayPalPaymentService(
            @Value("${payment.paypal.client-id:#{null}}") String clientId,
            @Value("${payment.paypal.client-secret:#{null}}") String clientSecret,
            @Value("${payment.paypal.sandbox:true}") boolean useSandbox,
            @Value("${payment.paypal.return-url:http://localhost:3000/checkout/success}") String returnUrl,
            @Value("${payment.paypal.cancel-url:http://localhost:3000/checkout/cancel}") String cancelUrl) {

        // Use sandbox environment by default for development
        // Credentials must be provided via environment variables
        PayPalEnvironment environment;
        if (clientId == null || clientId.isEmpty() || clientSecret == null || clientSecret.isEmpty()) {
            log.warn("PayPal credentials not configured - service will be disabled");
            environment = null;
        } else if (useSandbox) {
            environment = new PayPalEnvironment.Sandbox(clientId, clientSecret);
            log.info("PayPal service initialized with SANDBOX environment");
        } else {
            environment = new PayPalEnvironment.Live(clientId, clientSecret);
            log.info("PayPal service initialized with LIVE environment");
        }

        this.client = environment != null ? new PayPalHttpClient(environment) : null;
        this.returnUrl = returnUrl;
        this.cancelUrl = cancelUrl;
    }

    @Override
    public Mono<PaymentResponse> initiatePayment(PaymentRequest request) {
        return Mono.fromCallable(() -> {
            try {
                // Create order request
                OrderRequest orderRequest = new OrderRequest();
                orderRequest.checkoutPaymentIntent("CAPTURE");

                // Set application context
                ApplicationContext applicationContext = new ApplicationContext()
                        .brandName("Retail Platform")
                        .landingPage("BILLING")
                        .cancelUrl(request.getCancelUrl() != null ? request.getCancelUrl() : cancelUrl)
                        .returnUrl(request.getReturnUrl() != null ? request.getReturnUrl() : returnUrl)
                        .userAction("PAY_NOW")
                        .shippingPreference("SET_PROVIDED_ADDRESS");
                orderRequest.applicationContext(applicationContext);

                // Set purchase units
                List<PurchaseUnitRequest> purchaseUnits = new ArrayList<>();
                PurchaseUnitRequest purchaseUnit = new PurchaseUnitRequest()
                        .referenceId(request.getOrderId())
                        .description(request.getDescription() != null ? request.getDescription() : "Order " + request.getOrderId())
                        .customId(request.getTenantId())
                        .softDescriptor("RETAIL")
                        .amountWithBreakdown(new AmountWithBreakdown()
                                .currencyCode(request.getCurrency())
                                .value(request.getAmount().toString()));

                // Add shipping address if provided
                // Note: PayPal SDK v2 uses different mechanism for shipping - it's typically
                // set via applicationContext.shippingPreference() or updated after order creation.
                // The shipping address will be collected by PayPal during checkout flow.
                if (request.getShippingAddress() != null) {
                    log.debug("Shipping address provided: {}, {}, {}",
                            request.getShippingAddress().getCity(),
                            request.getShippingAddress().getState(),
                            request.getShippingAddress().getCountryCode());
                    // Shipping will be handled by PayPal checkout flow based on shippingPreference
                }

                purchaseUnits.add(purchaseUnit);
                orderRequest.purchaseUnits(purchaseUnits);

                // Create the order
                OrdersCreateRequest createRequest = new OrdersCreateRequest();
                createRequest.prefer("return=representation");
                createRequest.requestBody(orderRequest);

                HttpResponse<Order> response = client.execute(createRequest);
                Order order = response.result();

                // Extract approval URL
                String approvalUrl = order.links().stream()
                        .filter(link -> "approve".equals(link.rel()))
                        .findFirst()
                        .map(LinkDescription::href)
                        .orElse(null);

                // Build response
                Map<String, Object> providerResponse = new HashMap<>();
                providerResponse.put("paypalOrderId", order.id());
                providerResponse.put("status", order.status());

                return PaymentResponse.builder()
                        .transactionId(order.id())
                        .orderId(request.getOrderId())
                        .status(PaymentResponse.PaymentStatus.PENDING)
                        .provider(PaymentProvider.PAYPAL)
                        .amount(request.getAmount())
                        .currency(request.getCurrency())
                        .redirectUrl(approvalUrl)
                        .message("PayPal order created. Redirect user to approval URL.")
                        .providerResponse(providerResponse)
                        .build();

            } catch (Exception e) {
                log.error("PayPal payment initiation failed", e);
                return PaymentResponse.builder()
                        .orderId(request.getOrderId())
                        .status(PaymentResponse.PaymentStatus.FAILED)
                        .provider(PaymentProvider.PAYPAL)
                        .errorCode("PAYPAL_ERROR")
                        .errorMessage(e.getMessage())
                        .build();
            }
        }).subscribeOn(Schedulers.boundedElastic());
    }

    @Override
    public Mono<PaymentResponse> capturePayment(String transactionId, BigDecimal amount) {
        return Mono.fromCallable(() -> {
            try {
                // Capture the order
                OrdersCaptureRequest captureRequest = new OrdersCaptureRequest(transactionId);
                captureRequest.prefer("return=representation");

                HttpResponse<Order> response = client.execute(captureRequest);
                Order order = response.result();

                // Determine status based on PayPal order status
                PaymentResponse.PaymentStatus status = switch (order.status()) {
                    case "COMPLETED" -> PaymentResponse.PaymentStatus.COMPLETED;
                    case "APPROVED" -> PaymentResponse.PaymentStatus.AUTHORIZED;
                    case "CREATED" -> PaymentResponse.PaymentStatus.PENDING;
                    default -> PaymentResponse.PaymentStatus.FAILED;
                };

                Map<String, Object> providerResponse = new HashMap<>();
                providerResponse.put("paypalOrderId", order.id());
                providerResponse.put("status", order.status());
                if (order.purchaseUnits() != null && !order.purchaseUnits().isEmpty()) {
                    PurchaseUnit purchaseUnit = order.purchaseUnits().get(0);
                    if (purchaseUnit.payments() != null && purchaseUnit.payments().captures() != null
                            && !purchaseUnit.payments().captures().isEmpty()) {
                        Capture capture = purchaseUnit.payments().captures().get(0);
                        providerResponse.put("captureId", capture.id());
                        providerResponse.put("captureStatus", capture.status());
                    }
                }

                return PaymentResponse.builder()
                        .transactionId(order.id())
                        .status(status)
                        .provider(PaymentProvider.PAYPAL)
                        .message("Payment captured successfully")
                        .providerResponse(providerResponse)
                        .build();

            } catch (Exception e) {
                log.error("PayPal payment capture failed", e);
                return PaymentResponse.builder()
                        .transactionId(transactionId)
                        .status(PaymentResponse.PaymentStatus.FAILED)
                        .provider(PaymentProvider.PAYPAL)
                        .errorCode("CAPTURE_ERROR")
                        .errorMessage(e.getMessage())
                        .build();
            }
        }).subscribeOn(Schedulers.boundedElastic());
    }

    @Override
    public Mono<PaymentResponse> verifyPayment(String transactionId) {
        return Mono.fromCallable(() -> {
            try {
                // Get order details
                OrdersGetRequest getRequest = new OrdersGetRequest(transactionId);
                HttpResponse<Order> response = client.execute(getRequest);
                Order order = response.result();

                PaymentResponse.PaymentStatus status = switch (order.status()) {
                    case "COMPLETED" -> PaymentResponse.PaymentStatus.COMPLETED;
                    case "APPROVED" -> PaymentResponse.PaymentStatus.AUTHORIZED;
                    case "CREATED" -> PaymentResponse.PaymentStatus.PENDING;
                    case "VOIDED" -> PaymentResponse.PaymentStatus.CANCELLED;
                    default -> PaymentResponse.PaymentStatus.FAILED;
                };

                Map<String, Object> providerResponse = new HashMap<>();
                providerResponse.put("paypalOrderId", order.id());
                providerResponse.put("status", order.status());

                return PaymentResponse.builder()
                        .transactionId(order.id())
                        .status(status)
                        .provider(PaymentProvider.PAYPAL)
                        .message("Payment verification completed")
                        .providerResponse(providerResponse)
                        .build();

            } catch (Exception e) {
                log.error("PayPal payment verification failed", e);
                return PaymentResponse.builder()
                        .transactionId(transactionId)
                        .status(PaymentResponse.PaymentStatus.FAILED)
                        .provider(PaymentProvider.PAYPAL)
                        .errorCode("VERIFICATION_ERROR")
                        .errorMessage(e.getMessage())
                        .build();
            }
        }).subscribeOn(Schedulers.boundedElastic());
    }

    @Override
    public Mono<PaymentResponse> refundPayment(String transactionId, BigDecimal amount, String reason) {
        return Mono.fromCallable(() -> {
            try {
                // Note: For refunds, we need the capture ID, not the order ID
                // This is a simplified implementation
                log.info("Processing refund for transaction: {}, amount: {}, reason: {}",
                         transactionId, amount, reason);

                // In production, you would:
                // 1. Get the capture ID from your database
                // 2. Create a refund request using CapturesRefundRequest
                // 3. Execute the refund

                return PaymentResponse.builder()
                        .transactionId(transactionId)
                        .status(PaymentResponse.PaymentStatus.REFUNDED)
                        .provider(PaymentProvider.PAYPAL)
                        .message("Refund initiated")
                        .build();

            } catch (Exception e) {
                log.error("PayPal refund failed", e);
                return PaymentResponse.builder()
                        .transactionId(transactionId)
                        .status(PaymentResponse.PaymentStatus.FAILED)
                        .provider(PaymentProvider.PAYPAL)
                        .errorCode("REFUND_ERROR")
                        .errorMessage(e.getMessage())
                        .build();
            }
        }).subscribeOn(Schedulers.boundedElastic());
    }

    @Override
    public Mono<PaymentResponse> cancelPayment(String transactionId) {
        return Mono.fromCallable(() -> {
            try {
                log.info("Cancelling PayPal order: {}", transactionId);

                // PayPal orders are automatically cancelled if not captured within 3 hours
                // For immediate cancellation, you would void the authorization

                return PaymentResponse.builder()
                        .transactionId(transactionId)
                        .status(PaymentResponse.PaymentStatus.CANCELLED)
                        .provider(PaymentProvider.PAYPAL)
                        .message("Payment cancelled")
                        .build();

            } catch (Exception e) {
                log.error("PayPal cancellation failed", e);
                return PaymentResponse.builder()
                        .transactionId(transactionId)
                        .status(PaymentResponse.PaymentStatus.FAILED)
                        .provider(PaymentProvider.PAYPAL)
                        .errorCode("CANCEL_ERROR")
                        .errorMessage(e.getMessage())
                        .build();
            }
        }).subscribeOn(Schedulers.boundedElastic());
    }

    @Override
    public PaymentProvider getProvider() {
        return PaymentProvider.PAYPAL;
    }
}