package com.retail.domain.tax;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * Request for tax calculation.
 */
public class TaxCalculationRequest {

    @NotBlank(message = "Destination country is required")
    private String destinationCountry;

    @NotBlank(message = "Destination state is required")
    private String destinationState;

    @NotBlank(message = "Destination postal code is required")
    private String destinationPostalCode;

    private String destinationCity;

    @NotNull(message = "Order amount is required")
    @Positive(message = "Order amount must be positive")
    private BigDecimal orderAmount;

    @NotNull(message = "Shipping amount is required")
    private BigDecimal shippingAmount = BigDecimal.ZERO;

    private List<TaxableItem> items = new ArrayList<>();

    private String currency = "USD";

    // Constructors
    public TaxCalculationRequest() {
    }

    // Getters and setters
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

    public String getDestinationPostalCode() {
        return destinationPostalCode;
    }

    public void setDestinationPostalCode(String destinationPostalCode) {
        this.destinationPostalCode = destinationPostalCode;
    }

    public String getDestinationCity() {
        return destinationCity;
    }

    public void setDestinationCity(String destinationCity) {
        this.destinationCity = destinationCity;
    }

    public BigDecimal getOrderAmount() {
        return orderAmount;
    }

    public void setOrderAmount(BigDecimal orderAmount) {
        this.orderAmount = orderAmount;
    }

    public BigDecimal getShippingAmount() {
        return shippingAmount;
    }

    public void setShippingAmount(BigDecimal shippingAmount) {
        this.shippingAmount = shippingAmount;
    }

    public List<TaxableItem> getItems() {
        return items;
    }

    public void setItems(List<TaxableItem> items) {
        this.items = items;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public static class TaxableItem {
        private String productId;
        private BigDecimal amount;
        private String taxCategory; // GENERAL, FOOD, CLOTHING, etc.

        public TaxableItem() {
        }

        public TaxableItem(String productId, BigDecimal amount, String taxCategory) {
            this.productId = productId;
            this.amount = amount;
            this.taxCategory = taxCategory;
        }

        public String getProductId() {
            return productId;
        }

        public void setProductId(String productId) {
            this.productId = productId;
        }

        public BigDecimal getAmount() {
            return amount;
        }

        public void setAmount(BigDecimal amount) {
            this.amount = amount;
        }

        public String getTaxCategory() {
            return taxCategory;
        }

        public void setTaxCategory(String taxCategory) {
            this.taxCategory = taxCategory;
        }
    }
}
