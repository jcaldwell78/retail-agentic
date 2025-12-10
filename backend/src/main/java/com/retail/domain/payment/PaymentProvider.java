package com.retail.domain.payment;

/**
 * Enumeration of supported payment providers.
 */
public enum PaymentProvider {
    PAYPAL("PayPal"),
    APPLE_PAY("Apple Pay"),
    GOOGLE_PAY("Google Pay"),
    STRIPE("Stripe"),
    CREDIT_CARD("Credit Card");

    private final String displayName;

    PaymentProvider(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}