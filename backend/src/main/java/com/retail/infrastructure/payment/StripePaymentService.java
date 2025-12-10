package com.retail.infrastructure.payment;

import com.retail.domain.payment.PaymentProvider;
import com.retail.domain.payment.PaymentProviderService;
import com.retail.domain.payment.PaymentRequest;
import com.retail.domain.payment.PaymentResponse;
import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.PaymentIntent;
import com.stripe.model.Refund;
import com.stripe.param.PaymentIntentCreateParams;
import com.stripe.param.PaymentIntentCaptureParams;
import com.stripe.param.RefundCreateParams;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import jakarta.annotation.PostConstruct;
import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

/**
 * Stripe payment provider implementation supporting Apple Pay, Google Pay, and credit cards.
 * Configured for test environment by default.
 */
@Service
public class StripePaymentService implements PaymentProviderService {

    private static final Logger log = LoggerFactory.getLogger(StripePaymentService.class);

    @Value("${payment.stripe.secret-key:#{null}}")
    private String secretKey;

    @Value("${payment.stripe.publishable-key:#{null}}")
    private String publishableKey;

    @Value("${payment.stripe.webhook-secret:#{null}}")
    private String webhookSecret;

    @PostConstruct
    public void init() {
        // Initialize Stripe with test/sandbox key
        Stripe.apiKey = secretKey;
        log.info("Stripe service initialized with {} environment",
                secretKey.startsWith("sk_test") ? "TEST" : "LIVE");
    }

    @Override
    public Mono<PaymentResponse> initiatePayment(PaymentRequest request) {
        return Mono.fromCallable(() -> {
            try {
                // Build payment intent parameters
                PaymentIntentCreateParams.Builder paramsBuilder = PaymentIntentCreateParams.builder()
                        .setAmount(request.getAmount().multiply(new BigDecimal("100")).longValue()) // Convert to cents
                        .setCurrency(request.getCurrency().toLowerCase())
                        .setDescription(request.getDescription() != null ?
                                request.getDescription() : "Order " + request.getOrderId())
                        .putMetadata("orderId", request.getOrderId())
                        .putMetadata("tenantId", request.getTenantId());

                // Add customer email if provided
                if (request.getCustomerEmail() != null) {
                    paramsBuilder.setReceiptEmail(request.getCustomerEmail());
                }

                // Configure payment methods based on provider
                if (request.getProvider() == PaymentProvider.APPLE_PAY) {
                    paramsBuilder.addPaymentMethodType("card")
                            .setPaymentMethodOptions(
                                    PaymentIntentCreateParams.PaymentMethodOptions.builder()
                                            .setCard(PaymentIntentCreateParams.PaymentMethodOptions.Card.builder()
                                                    .setRequestThreeDSecure(
                                                            PaymentIntentCreateParams.PaymentMethodOptions.Card.RequestThreeDSecure.AUTOMATIC)
                                                    .build())
                                            .build());
                    paramsBuilder.putMetadata("walletType", "apple_pay");
                } else if (request.getProvider() == PaymentProvider.GOOGLE_PAY) {
                    paramsBuilder.addPaymentMethodType("card")
                            .setPaymentMethodOptions(
                                    PaymentIntentCreateParams.PaymentMethodOptions.builder()
                                            .setCard(PaymentIntentCreateParams.PaymentMethodOptions.Card.builder()
                                                    .setRequestThreeDSecure(
                                                            PaymentIntentCreateParams.PaymentMethodOptions.Card.RequestThreeDSecure.AUTOMATIC)
                                                    .build())
                                            .build());
                    paramsBuilder.putMetadata("walletType", "google_pay");
                } else {
                    // Default to card payments
                    paramsBuilder.addPaymentMethodType("card");
                }

                // Set capture method - automatic for immediate capture, manual for auth only
                paramsBuilder.setCaptureMethod(PaymentIntentCreateParams.CaptureMethod.AUTOMATIC);

                // Add shipping address if provided
                if (request.getShippingAddress() != null) {
                    PaymentIntentCreateParams.Shipping shipping = PaymentIntentCreateParams.Shipping.builder()
                            .setName(request.getShippingAddress().getFirstName() + " " +
                                    request.getShippingAddress().getLastName())
                            .setAddress(PaymentIntentCreateParams.Shipping.Address.builder()
                                    .setLine1(request.getShippingAddress().getAddressLine1())
                                    .setLine2(request.getShippingAddress().getAddressLine2())
                                    .setCity(request.getShippingAddress().getCity())
                                    .setState(request.getShippingAddress().getState())
                                    .setPostalCode(request.getShippingAddress().getPostalCode())
                                    .setCountry(request.getShippingAddress().getCountryCode())
                                    .build())
                            .build();
                    paramsBuilder.setShipping(shipping);
                }

                // Create the payment intent
                PaymentIntentCreateParams params = paramsBuilder.build();
                PaymentIntent paymentIntent = PaymentIntent.create(params);

                // Build client configuration for frontend
                Map<String, String> clientConfig = new HashMap<>();
                clientConfig.put("publishableKey", publishableKey);
                clientConfig.put("clientSecret", paymentIntent.getClientSecret());
                clientConfig.put("paymentIntentId", paymentIntent.getId());

                // For Apple Pay specific configuration
                if (request.getProvider() == PaymentProvider.APPLE_PAY) {
                    clientConfig.put("countryCode", "US");
                    clientConfig.put("merchantName", "Retail Platform");
                    clientConfig.put("supportedNetworks", "visa,mastercard,amex,discover");
                }

                // For Google Pay specific configuration
                if (request.getProvider() == PaymentProvider.GOOGLE_PAY) {
                    clientConfig.put("environment", secretKey.startsWith("sk_test") ? "TEST" : "PRODUCTION");
                    clientConfig.put("merchantId", "BCR2DN6T2K7G5ELA"); // Test merchant ID
                    clientConfig.put("merchantName", "Retail Platform");
                }

                Map<String, Object> providerResponse = new HashMap<>();
                providerResponse.put("paymentIntentId", paymentIntent.getId());
                providerResponse.put("status", paymentIntent.getStatus());
                providerResponse.put("amount", paymentIntent.getAmount());
                providerResponse.put("currency", paymentIntent.getCurrency());

                return PaymentResponse.builder()
                        .transactionId(paymentIntent.getId())
                        .orderId(request.getOrderId())
                        .status(mapStripeStatus(paymentIntent.getStatus()))
                        .provider(request.getProvider())
                        .amount(request.getAmount())
                        .currency(request.getCurrency())
                        .clientToken(paymentIntent.getClientSecret())
                        .clientConfig(clientConfig)
                        .message("Payment intent created. Use client secret for frontend processing.")
                        .providerResponse(providerResponse)
                        .build();

            } catch (StripeException e) {
                log.error("Stripe payment initiation failed", e);
                return PaymentResponse.builder()
                        .orderId(request.getOrderId())
                        .status(PaymentResponse.PaymentStatus.FAILED)
                        .provider(request.getProvider())
                        .errorCode(e.getCode())
                        .errorMessage(e.getMessage())
                        .build();
            } catch (Exception e) {
                log.error("Payment initiation failed", e);
                return PaymentResponse.builder()
                        .orderId(request.getOrderId())
                        .status(PaymentResponse.PaymentStatus.FAILED)
                        .provider(request.getProvider())
                        .errorCode("PAYMENT_ERROR")
                        .errorMessage(e.getMessage())
                        .build();
            }
        }).subscribeOn(Schedulers.boundedElastic());
    }

    @Override
    public Mono<PaymentResponse> capturePayment(String transactionId, BigDecimal amount) {
        return Mono.fromCallable(() -> {
            try {
                PaymentIntent paymentIntent = PaymentIntent.retrieve(transactionId);

                // Only capture if status is requires_capture
                if ("requires_capture".equals(paymentIntent.getStatus())) {
                    PaymentIntentCaptureParams params = PaymentIntentCaptureParams.builder()
                            .setAmountToCapture(amount != null ?
                                    amount.multiply(new BigDecimal("100")).longValue() :
                                    paymentIntent.getAmount())
                            .build();
                    paymentIntent = paymentIntent.capture(params);
                }

                Map<String, Object> providerResponse = new HashMap<>();
                providerResponse.put("paymentIntentId", paymentIntent.getId());
                providerResponse.put("status", paymentIntent.getStatus());
                providerResponse.put("capturedAmount", paymentIntent.getAmountCapturable());

                return PaymentResponse.builder()
                        .transactionId(paymentIntent.getId())
                        .status(mapStripeStatus(paymentIntent.getStatus()))
                        .provider(getProviderFromMetadata(paymentIntent.getMetadata()))
                        .message("Payment captured successfully")
                        .providerResponse(providerResponse)
                        .build();

            } catch (StripeException e) {
                log.error("Stripe payment capture failed", e);
                return PaymentResponse.builder()
                        .transactionId(transactionId)
                        .status(PaymentResponse.PaymentStatus.FAILED)
                        .errorCode(e.getCode())
                        .errorMessage(e.getMessage())
                        .build();
            }
        }).subscribeOn(Schedulers.boundedElastic());
    }

    @Override
    public Mono<PaymentResponse> verifyPayment(String transactionId) {
        return Mono.fromCallable(() -> {
            try {
                PaymentIntent paymentIntent = PaymentIntent.retrieve(transactionId);

                Map<String, Object> providerResponse = new HashMap<>();
                providerResponse.put("paymentIntentId", paymentIntent.getId());
                providerResponse.put("status", paymentIntent.getStatus());
                providerResponse.put("amount", paymentIntent.getAmount());
                providerResponse.put("currency", paymentIntent.getCurrency());

                // In Stripe API v2023+, getCharges() is deprecated - use getLatestCharge() instead
                if (paymentIntent.getLatestCharge() != null) {
                    providerResponse.put("chargeId", paymentIntent.getLatestCharge());
                }

                return PaymentResponse.builder()
                        .transactionId(paymentIntent.getId())
                        .status(mapStripeStatus(paymentIntent.getStatus()))
                        .provider(getProviderFromMetadata(paymentIntent.getMetadata()))
                        .message("Payment verification completed")
                        .providerResponse(providerResponse)
                        .build();

            } catch (StripeException e) {
                log.error("Stripe payment verification failed", e);
                return PaymentResponse.builder()
                        .transactionId(transactionId)
                        .status(PaymentResponse.PaymentStatus.FAILED)
                        .errorCode(e.getCode())
                        .errorMessage(e.getMessage())
                        .build();
            }
        }).subscribeOn(Schedulers.boundedElastic());
    }

    @Override
    public Mono<PaymentResponse> refundPayment(String transactionId, BigDecimal amount, String reason) {
        return Mono.fromCallable(() -> {
            try {
                RefundCreateParams.Builder paramsBuilder = RefundCreateParams.builder()
                        .setPaymentIntent(transactionId);

                if (amount != null) {
                    paramsBuilder.setAmount(amount.multiply(new BigDecimal("100")).longValue());
                }

                if (reason != null) {
                    paramsBuilder.setReason(RefundCreateParams.Reason.REQUESTED_BY_CUSTOMER);
                    paramsBuilder.putMetadata("reason", reason);
                }

                RefundCreateParams params = paramsBuilder.build();
                Refund refund = Refund.create(params);

                Map<String, Object> providerResponse = new HashMap<>();
                providerResponse.put("refundId", refund.getId());
                providerResponse.put("status", refund.getStatus());
                providerResponse.put("amount", refund.getAmount());

                return PaymentResponse.builder()
                        .transactionId(transactionId)
                        .status("succeeded".equals(refund.getStatus()) ?
                                PaymentResponse.PaymentStatus.REFUNDED :
                                PaymentResponse.PaymentStatus.FAILED)
                        .message("Refund processed")
                        .providerResponse(providerResponse)
                        .build();

            } catch (StripeException e) {
                log.error("Stripe refund failed", e);
                return PaymentResponse.builder()
                        .transactionId(transactionId)
                        .status(PaymentResponse.PaymentStatus.FAILED)
                        .errorCode(e.getCode())
                        .errorMessage(e.getMessage())
                        .build();
            }
        }).subscribeOn(Schedulers.boundedElastic());
    }

    @Override
    public Mono<PaymentResponse> cancelPayment(String transactionId) {
        return Mono.fromCallable(() -> {
            try {
                PaymentIntent paymentIntent = PaymentIntent.retrieve(transactionId);
                paymentIntent = paymentIntent.cancel();

                Map<String, Object> providerResponse = new HashMap<>();
                providerResponse.put("paymentIntentId", paymentIntent.getId());
                providerResponse.put("status", paymentIntent.getStatus());

                return PaymentResponse.builder()
                        .transactionId(transactionId)
                        .status(PaymentResponse.PaymentStatus.CANCELLED)
                        .message("Payment cancelled")
                        .providerResponse(providerResponse)
                        .build();

            } catch (StripeException e) {
                log.error("Stripe cancellation failed", e);
                return PaymentResponse.builder()
                        .transactionId(transactionId)
                        .status(PaymentResponse.PaymentStatus.FAILED)
                        .errorCode(e.getCode())
                        .errorMessage(e.getMessage())
                        .build();
            }
        }).subscribeOn(Schedulers.boundedElastic());
    }

    @Override
    public PaymentProvider getProvider() {
        return PaymentProvider.STRIPE;
    }

    @Override
    public boolean supports(PaymentProvider provider) {
        return provider == PaymentProvider.STRIPE ||
               provider == PaymentProvider.APPLE_PAY ||
               provider == PaymentProvider.GOOGLE_PAY ||
               provider == PaymentProvider.CREDIT_CARD;
    }

    private PaymentResponse.PaymentStatus mapStripeStatus(String stripeStatus) {
        return switch (stripeStatus) {
            case "succeeded" -> PaymentResponse.PaymentStatus.COMPLETED;
            case "processing" -> PaymentResponse.PaymentStatus.PROCESSING;
            case "requires_payment_method", "requires_confirmation" -> PaymentResponse.PaymentStatus.PENDING;
            case "requires_action" -> PaymentResponse.PaymentStatus.PENDING;
            case "requires_capture" -> PaymentResponse.PaymentStatus.AUTHORIZED;
            case "canceled" -> PaymentResponse.PaymentStatus.CANCELLED;
            default -> PaymentResponse.PaymentStatus.FAILED;
        };
    }

    private PaymentProvider getProviderFromMetadata(Map<String, String> metadata) {
        if (metadata == null) {
            return PaymentProvider.STRIPE;
        }
        String walletType = metadata.get("walletType");
        if ("apple_pay".equals(walletType)) {
            return PaymentProvider.APPLE_PAY;
        } else if ("google_pay".equals(walletType)) {
            return PaymentProvider.GOOGLE_PAY;
        }
        return PaymentProvider.CREDIT_CARD;
    }
}