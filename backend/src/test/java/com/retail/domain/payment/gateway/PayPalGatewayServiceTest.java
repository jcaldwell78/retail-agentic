package com.retail.domain.payment.gateway;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import reactor.test.StepVerifier;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

class PayPalGatewayServiceTest {

    private PayPalGatewayService payPalGatewayService;

    @BeforeEach
    void setUp() {
        payPalGatewayService = new PayPalGatewayService();
    }

    @Test
    void authorizePayment_shouldReturnSuccessfulResponse() {
        // Arrange
        PaymentRequest request = new PaymentRequest();
        request.setOrderId("order-123");
        request.setAmount(new BigDecimal("100.00"));
        request.setCurrency("USD");
        request.setCustomerEmail("test@example.com");

        // Act & Assert
        StepVerifier.create(payPalGatewayService.authorizePayment(request))
            .assertNext(response -> {
                assertTrue(response.isSuccess());
                assertNotNull(response.getTransactionId());
                assertTrue(response.getTransactionId().startsWith("PAYPAL-"));
                assertNotNull(response.getGatewayResponse());
                assertTrue(response.getGatewayResponse().containsKey("orderId"));
                assertTrue(response.getGatewayResponse().containsKey("approvalUrl"));
            })
            .verifyComplete();
    }

    @Test
    void capturePayment_shouldReturnSuccessfulResponse() {
        // Arrange
        String transactionId = "PAYPAL-test-123";
        BigDecimal amount = new BigDecimal("100.00");

        // Act & Assert
        StepVerifier.create(payPalGatewayService.capturePayment(transactionId, amount))
            .assertNext(response -> {
                assertTrue(response.isSuccess());
                assertNotNull(response.getTransactionId());
                assertTrue(response.getTransactionId().startsWith("CAPTURE-"));
                assertEquals("Payment captured successfully", response.getMessage());
            })
            .verifyComplete();
    }

    @Test
    void refundPayment_shouldReturnSuccessfulResponse() {
        // Arrange
        String transactionId = "CAPTURE-test-123";
        BigDecimal refundAmount = new BigDecimal("50.00");
        String reason = "Customer request";

        // Act & Assert
        StepVerifier.create(payPalGatewayService.refundPayment(transactionId, refundAmount, reason))
            .assertNext(response -> {
                assertTrue(response.isSuccess());
                assertNotNull(response.getTransactionId());
                assertTrue(response.getTransactionId().startsWith("REFUND-"));
                assertEquals("Refund processed successfully", response.getMessage());
            })
            .verifyComplete();
    }

    @Test
    void getGatewayName_shouldReturnPayPal() {
        assertEquals("PAYPAL", payPalGatewayService.getGatewayName());
    }

    @Test
    void supportsRecurring_shouldReturnTrue() {
        assertTrue(payPalGatewayService.supportsRecurring());
    }

    @Test
    void supportsPartialRefunds_shouldReturnTrue() {
        assertTrue(payPalGatewayService.supportsPartialRefunds());
    }

    @Test
    void verifyWebhookSignature_shouldReturnTrue_whenValidHeaders() {
        // Arrange
        String transmissionId = "test-transmission-id";
        String transmissionTime = "2024-01-01T00:00:00Z";
        String certUrl = "https://api.paypal.com/cert";
        String authAlgo = "SHA256withRSA";
        String transmissionSig = "test-signature";
        String webhookId = "webhook-id";
        String eventBody = "{}";

        // Act & Assert
        StepVerifier.create(payPalGatewayService.verifyWebhookSignature(
                transmissionId, transmissionTime, certUrl, authAlgo,
                transmissionSig, webhookId, eventBody))
            .expectNext(true)
            .verifyComplete();
    }

    @Test
    void verifyWebhookSignature_shouldReturnFalse_whenMissingHeaders() {
        // Act & Assert
        StepVerifier.create(payPalGatewayService.verifyWebhookSignature(
                null, null, null, null, null, null, "{}"))
            .expectNext(false)
            .verifyComplete();
    }

    @Test
    void getPaymentDetails_shouldReturnPaymentInfo() {
        // Arrange
        String transactionId = "PAYPAL-test-123";

        // Act & Assert
        StepVerifier.create(payPalGatewayService.getPaymentDetails(transactionId))
            .assertNext(details -> {
                assertNotNull(details);
                assertEquals(transactionId, details.get("id"));
                assertEquals("COMPLETED", details.get("status"));
                assertNotNull(details.get("create_time"));
            })
            .verifyComplete();
    }
}
