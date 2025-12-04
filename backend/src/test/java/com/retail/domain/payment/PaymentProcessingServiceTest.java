package com.retail.domain.payment;

import com.retail.domain.payment.gateway.PayPalGatewayService;
import com.retail.domain.payment.gateway.PaymentResponse;
import com.retail.infrastructure.persistence.PaymentTransactionRepository;
import com.retail.security.tenant.TenantContext;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.math.BigDecimal;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PaymentProcessingServiceTest {

    @Mock
    private PaymentService paymentService;

    @Mock
    private PayPalGatewayService payPalGatewayService;

    @Mock
    private PaymentTransactionRepository paymentTransactionRepository;

    private PaymentProcessingService paymentProcessingService;

    @BeforeEach
    void setUp() {
        paymentProcessingService = new PaymentProcessingService(paymentService, payPalGatewayService);
        // Tenant context will be added via .contextWrite() in each test
    }

    @Test
    void processPayment_shouldCreateAndAuthorizePayment() {
        // Arrange
        String orderId = "order-123";
        BigDecimal amount = new BigDecimal("100.00");
        String currency = "USD";
        PaymentTransaction.PaymentMethod paymentMethod = PaymentTransaction.PaymentMethod.PAYPAL;
        String customerEmail = "test@example.com";

        PaymentTransaction transaction = createMockTransaction(orderId, amount);

        PaymentResponse gatewayResponse = new PaymentResponse();
        gatewayResponse.setSuccess(true);
        gatewayResponse.setTransactionId("PAYPAL-123");
        gatewayResponse.setStatus(PaymentTransaction.PaymentStatus.PENDING);

        when(paymentService.createTransaction(eq(orderId), eq(amount), eq(currency),
            eq(paymentMethod), anyString()))
            .thenReturn(Mono.just(transaction));

        when(payPalGatewayService.authorizePayment(any()))
            .thenReturn(Mono.just(gatewayResponse));

        when(paymentService.updateStatus(anyString(), any(), anyString()))
            .thenReturn(Mono.just(transaction));

        // Act & Assert
        StepVerifier.create(
                paymentProcessingService.processPayment(orderId, amount, currency,
                    paymentMethod, customerEmail)
                    .contextWrite(TenantContext.withTenantId("test-tenant"))
            )
            .expectNext(transaction)
            .verifyComplete();

        verify(paymentService).createTransaction(eq(orderId), eq(amount), eq(currency),
            eq(paymentMethod), anyString());
        verify(payPalGatewayService).authorizePayment(any());
        verify(paymentService).updateStatus(anyString(), any(), anyString());
    }

    @Test
    void capturePayment_shouldCaptureAuthorizedPayment() {
        // Arrange
        String transactionId = "tx-123";
        BigDecimal amount = new BigDecimal("100.00");

        PaymentTransaction transaction = createMockTransaction("order-123", amount);
        transaction.setGatewayTransactionId("PAYPAL-123");

        PaymentResponse captureResponse = new PaymentResponse();
        captureResponse.setSuccess(true);
        captureResponse.setTransactionId("CAPTURE-123");
        captureResponse.setStatus(PaymentTransaction.PaymentStatus.SUCCESS);

        when(paymentService.getTransactionsByOrder(transactionId))
            .thenReturn(Flux.just(transaction));

        when(payPalGatewayService.capturePayment(anyString(), eq(amount)))
            .thenReturn(Mono.just(captureResponse));

        when(paymentService.updateStatus(anyString(), any(), anyString()))
            .thenReturn(Mono.just(transaction));

        // Act & Assert
        StepVerifier.create(paymentProcessingService.capturePayment(transactionId, amount)
                .contextWrite(TenantContext.withTenantId("test-tenant")))
            .expectNext(transaction)
            .verifyComplete();

        verify(payPalGatewayService).capturePayment(anyString(), eq(amount));
        verify(paymentService).updateStatus(anyString(), eq(PaymentTransaction.PaymentStatus.SUCCESS), anyString());
    }

    @Test
    void processRefund_shouldRefundPayment() {
        // Arrange
        String transactionId = "tx-123";
        BigDecimal refundAmount = new BigDecimal("50.00");
        String reason = "Customer request";

        PaymentTransaction transaction = createMockTransaction("order-123", new BigDecimal("100.00"));
        transaction.setGatewayTransactionId("CAPTURE-123");
        transaction.setStatus(PaymentTransaction.PaymentStatus.SUCCESS);

        PaymentResponse refundResponse = new PaymentResponse();
        refundResponse.setSuccess(true);
        refundResponse.setTransactionId("REFUND-123");

        when(paymentService.getTransactionsByOrder(transactionId))
            .thenReturn(Flux.just(transaction));

        when(payPalGatewayService.supportsPartialRefunds())
            .thenReturn(true);

        when(payPalGatewayService.refundPayment(anyString(), eq(refundAmount), eq(reason)))
            .thenReturn(Mono.just(refundResponse));

        when(paymentService.refund(anyString(), eq(refundAmount), eq(reason)))
            .thenReturn(Mono.just(transaction));

        // Act & Assert
        StepVerifier.create(
                paymentProcessingService.processRefund(transactionId, refundAmount, reason)
                    .contextWrite(TenantContext.withTenantId("test-tenant"))
            )
            .expectNext(transaction)
            .verifyComplete();

        verify(payPalGatewayService).refundPayment(anyString(), eq(refundAmount), eq(reason));
        verify(paymentService).refund(anyString(), eq(refundAmount), eq(reason));
    }

    private PaymentTransaction createMockTransaction(String orderId, BigDecimal amount) {
        PaymentTransaction transaction = new PaymentTransaction();
        transaction.setId("tx-123");
        transaction.setTenantId("test-tenant");
        transaction.setOrderId(orderId);
        transaction.setAmount(amount);
        transaction.setCurrency("USD");
        transaction.setPaymentMethod(PaymentTransaction.PaymentMethod.PAYPAL);
        transaction.setGateway("PAYPAL");
        transaction.setStatus(PaymentTransaction.PaymentStatus.PENDING);
        return transaction;
    }
}
