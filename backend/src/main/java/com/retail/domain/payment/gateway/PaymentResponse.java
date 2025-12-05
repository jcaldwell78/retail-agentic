package com.retail.domain.payment.gateway;

import com.retail.domain.payment.PaymentTransaction;

import java.util.HashMap;
import java.util.Map;

/**
 * Payment response from gateway.
 */
public class PaymentResponse {

    private boolean success;
    private String transactionId;
    private PaymentTransaction.PaymentStatus status;
    private String message;
    private String errorCode;
    private Map<String, String> gatewayResponse;

    public PaymentResponse() {
        this.gatewayResponse = new HashMap<>();
    }

    // Getters and setters

    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public String getTransactionId() {
        return transactionId;
    }

    public void setTransactionId(String transactionId) {
        this.transactionId = transactionId;
    }

    public PaymentTransaction.PaymentStatus getStatus() {
        return status;
    }

    public void setStatus(PaymentTransaction.PaymentStatus status) {
        this.status = status;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getErrorCode() {
        return errorCode;
    }

    public void setErrorCode(String errorCode) {
        this.errorCode = errorCode;
    }

    public Map<String, String> getGatewayResponse() {
        return gatewayResponse;
    }

    public void setGatewayResponse(Map<String, String> gatewayResponse) {
        this.gatewayResponse = gatewayResponse;
    }
}
