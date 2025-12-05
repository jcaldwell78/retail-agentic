package com.retail.domain.shipping;

import java.math.BigDecimal;

/**
 * Shipping rate calculation result.
 */
public class ShippingRate {

    private String carrier;
    private String serviceLevel;
    private BigDecimal rate;
    private Integer estimatedDays;
    private String currency;

    public ShippingRate() {
    }

    public ShippingRate(String carrier, String serviceLevel, BigDecimal rate, Integer estimatedDays, String currency) {
        this.carrier = carrier;
        this.serviceLevel = serviceLevel;
        this.rate = rate;
        this.estimatedDays = estimatedDays;
        this.currency = currency;
    }

    // Getters and setters
    public String getCarrier() {
        return carrier;
    }

    public void setCarrier(String carrier) {
        this.carrier = carrier;
    }

    public String getServiceLevel() {
        return serviceLevel;
    }

    public void setServiceLevel(String serviceLevel) {
        this.serviceLevel = serviceLevel;
    }

    public BigDecimal getRate() {
        return rate;
    }

    public void setRate(BigDecimal rate) {
        this.rate = rate;
    }

    public Integer getEstimatedDays() {
        return estimatedDays;
    }

    public void setEstimatedDays(Integer estimatedDays) {
        this.estimatedDays = estimatedDays;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }
}
