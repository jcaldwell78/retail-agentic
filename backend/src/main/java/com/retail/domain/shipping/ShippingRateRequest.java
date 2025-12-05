package com.retail.domain.shipping;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

/**
 * Request for shipping rate calculation.
 */
public class ShippingRateRequest {

    @NotBlank(message = "Origin postal code is required")
    private String originPostalCode;

    @NotBlank(message = "Origin country is required")
    private String originCountry;

    @NotBlank(message = "Destination postal code is required")
    private String destinationPostalCode;

    @NotBlank(message = "Destination country is required")
    private String destinationCountry;

    private String destinationState;

    @NotNull(message = "Weight is required")
    @Positive(message = "Weight must be positive")
    private BigDecimal weightPounds;

    private BigDecimal lengthInches;
    private BigDecimal widthInches;
    private BigDecimal heightInches;

    @NotNull(message = "Order value is required")
    @Positive(message = "Order value must be positive")
    private BigDecimal orderValue;

    private String currency = "USD";

    // Constructors
    public ShippingRateRequest() {
    }

    // Getters and setters
    public String getOriginPostalCode() {
        return originPostalCode;
    }

    public void setOriginPostalCode(String originPostalCode) {
        this.originPostalCode = originPostalCode;
    }

    public String getOriginCountry() {
        return originCountry;
    }

    public void setOriginCountry(String originCountry) {
        this.originCountry = originCountry;
    }

    public String getDestinationPostalCode() {
        return destinationPostalCode;
    }

    public void setDestinationPostalCode(String destinationPostalCode) {
        this.destinationPostalCode = destinationPostalCode;
    }

    public String getDestinationCountry() {
        return destinationCountry;
    }

    public void setDestinationCountry(String destinationCountry) {
        this.destinationCountry = destinationCountry;
    }

    public String getDestinationState() {
        return destinationState;
    }

    public void setDestinationState(String destinationState) {
        this.destinationState = destinationState;
    }

    public BigDecimal getWeightPounds() {
        return weightPounds;
    }

    public void setWeightPounds(BigDecimal weightPounds) {
        this.weightPounds = weightPounds;
    }

    public BigDecimal getLengthInches() {
        return lengthInches;
    }

    public void setLengthInches(BigDecimal lengthInches) {
        this.lengthInches = lengthInches;
    }

    public BigDecimal getWidthInches() {
        return widthInches;
    }

    public void setWidthInches(BigDecimal widthInches) {
        this.widthInches = widthInches;
    }

    public BigDecimal getHeightInches() {
        return heightInches;
    }

    public void setHeightInches(BigDecimal heightInches) {
        this.heightInches = heightInches;
    }

    public BigDecimal getOrderValue() {
        return orderValue;
    }

    public void setOrderValue(BigDecimal orderValue) {
        this.orderValue = orderValue;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }
}
