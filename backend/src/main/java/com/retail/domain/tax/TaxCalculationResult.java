package com.retail.domain.tax;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * Result of tax calculation.
 */
public class TaxCalculationResult {

    private BigDecimal subtotal;
    private BigDecimal shipping;
    private BigDecimal taxableAmount;
    private BigDecimal taxAmount;
    private BigDecimal totalAmount;
    private String currency;
    private List<TaxBreakdown> breakdown = new ArrayList<>();

    public TaxCalculationResult() {
    }

    // Getters and setters
    public BigDecimal getSubtotal() {
        return subtotal;
    }

    public void setSubtotal(BigDecimal subtotal) {
        this.subtotal = subtotal;
    }

    public BigDecimal getShipping() {
        return shipping;
    }

    public void setShipping(BigDecimal shipping) {
        this.shipping = shipping;
    }

    public BigDecimal getTaxableAmount() {
        return taxableAmount;
    }

    public void setTaxableAmount(BigDecimal taxableAmount) {
        this.taxableAmount = taxableAmount;
    }

    public BigDecimal getTaxAmount() {
        return taxAmount;
    }

    public void setTaxAmount(BigDecimal taxAmount) {
        this.taxAmount = taxAmount;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public List<TaxBreakdown> getBreakdown() {
        return breakdown;
    }

    public void setBreakdown(List<TaxBreakdown> breakdown) {
        this.breakdown = breakdown;
    }

    public static class TaxBreakdown {
        private String taxType; // STATE, COUNTY, CITY, SPECIAL
        private String jurisdiction;
        private BigDecimal rate;
        private BigDecimal amount;

        public TaxBreakdown() {
        }

        public TaxBreakdown(String taxType, String jurisdiction, BigDecimal rate, BigDecimal amount) {
            this.taxType = taxType;
            this.jurisdiction = jurisdiction;
            this.rate = rate;
            this.amount = amount;
        }

        public String getTaxType() {
            return taxType;
        }

        public void setTaxType(String taxType) {
            this.taxType = taxType;
        }

        public String getJurisdiction() {
            return jurisdiction;
        }

        public void setJurisdiction(String jurisdiction) {
            this.jurisdiction = jurisdiction;
        }

        public BigDecimal getRate() {
            return rate;
        }

        public void setRate(BigDecimal rate) {
            this.rate = rate;
        }

        public BigDecimal getAmount() {
            return amount;
        }

        public void setAmount(BigDecimal amount) {
            this.amount = amount;
        }
    }
}
