package com.retail.domain.tax;

import com.retail.security.tenant.TenantContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Service for calculating sales tax based on destination and tax rules.
 * Supports US state/local taxes with reactive programming.
 */
@Service
public class TaxCalculationService {

    private static final Logger logger = LoggerFactory.getLogger(TaxCalculationService.class);

    // Simplified US state tax rates (in real implementation, use tax API like TaxJar or Avalara)
    private static final Map<String, StateTaxRates> STATE_TAX_RATES = new HashMap<>();

    static {
        // Sample state tax rates
        STATE_TAX_RATES.put("CA", new StateTaxRates(new BigDecimal("7.25"), new BigDecimal("2.50"))); // CA: 7.25% state + up to 2.5% local
        STATE_TAX_RATES.put("NY", new StateTaxRates(new BigDecimal("4.00"), new BigDecimal("4.875"))); // NY: 4% state + up to 4.875% local
        STATE_TAX_RATES.put("TX", new StateTaxRates(new BigDecimal("6.25"), new BigDecimal("2.00"))); // TX: 6.25% state + up to 2% local
        STATE_TAX_RATES.put("FL", new StateTaxRates(new BigDecimal("6.00"), new BigDecimal("1.50"))); // FL: 6% state + up to 1.5% local
        STATE_TAX_RATES.put("WA", new StateTaxRates(new BigDecimal("6.50"), new BigDecimal("3.50"))); // WA: 6.5% state + up to 3.5% local
        STATE_TAX_RATES.put("IL", new StateTaxRates(new BigDecimal("6.25"), new BigDecimal("4.75"))); // IL: 6.25% state + up to 4.75% local
        STATE_TAX_RATES.put("PA", new StateTaxRates(new BigDecimal("6.00"), new BigDecimal("2.00"))); // PA: 6% state + up to 2% local
        STATE_TAX_RATES.put("OH", new StateTaxRates(new BigDecimal("5.75"), new BigDecimal("2.25"))); // OH: 5.75% state + up to 2.25% local
        STATE_TAX_RATES.put("DE", new StateTaxRates(BigDecimal.ZERO, BigDecimal.ZERO)); // DE: No sales tax
        STATE_TAX_RATES.put("OR", new StateTaxRates(BigDecimal.ZERO, BigDecimal.ZERO)); // OR: No sales tax
        STATE_TAX_RATES.put("MT", new StateTaxRates(BigDecimal.ZERO, BigDecimal.ZERO)); // MT: No sales tax
        STATE_TAX_RATES.put("NH", new StateTaxRates(BigDecimal.ZERO, BigDecimal.ZERO)); // NH: No sales tax
    }

    // Tax-exempt categories by state
    private static final Map<String, List<String>> TAX_EXEMPT_CATEGORIES = new HashMap<>();

    static {
        // Some states exempt groceries, clothing, etc.
        TAX_EXEMPT_CATEGORIES.put("PA", List.of("FOOD", "CLOTHING"));
        TAX_EXEMPT_CATEGORIES.put("NY", List.of("FOOD"));
    }

    /**
     * Calculate sales tax for an order.
     *
     * @param request Tax calculation request
     * @return Mono of tax calculation result
     */
    public Mono<TaxCalculationResult> calculateTax(TaxCalculationRequest request) {
        return TenantContext.getTenantId()
            .flatMap(tenantId -> {
                logger.info("Calculating tax for tenant: {} in {}, {}",
                    tenantId, request.getDestinationCity(), request.getDestinationState());

                return Mono.defer(() -> {
            // For non-US orders, return zero tax (simplified)
            if (!"US".equalsIgnoreCase(request.getDestinationCountry())) {
                return Mono.just(createZeroTaxResult(request));
            }

            StateTaxRates rates = STATE_TAX_RATES.get(request.getDestinationState().toUpperCase());

            if (rates == null) {
                logger.warn("Unknown state: {}, applying zero tax", request.getDestinationState());
                return Mono.just(createZeroTaxResult(request));
            }

            TaxCalculationResult result = new TaxCalculationResult();
            result.setSubtotal(request.getOrderAmount());
            result.setShipping(request.getShippingAmount());
            result.setCurrency(request.getCurrency());

            // Calculate taxable amount (excluding exempt items)
            BigDecimal taxableAmount = calculateTaxableAmount(request, rates);
            result.setTaxableAmount(taxableAmount);

            // Calculate tax breakdown
            List<TaxCalculationResult.TaxBreakdown> breakdown = new ArrayList<>();
            BigDecimal totalTax = BigDecimal.ZERO;

            // State tax
            if (rates.stateRate.compareTo(BigDecimal.ZERO) > 0) {
                BigDecimal stateTax = taxableAmount
                    .multiply(rates.stateRate)
                    .divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
                breakdown.add(new TaxCalculationResult.TaxBreakdown(
                    "STATE",
                    request.getDestinationState(),
                    rates.stateRate,
                    stateTax
                ));
                totalTax = totalTax.add(stateTax);
            }

            // Local tax (simplified - in reality varies by city/county)
            if (rates.maxLocalRate.compareTo(BigDecimal.ZERO) > 0) {
                BigDecimal localRate = calculateLocalRate(request.getDestinationPostalCode(), rates.maxLocalRate);
                if (localRate.compareTo(BigDecimal.ZERO) > 0) {
                    BigDecimal localTax = taxableAmount
                        .multiply(localRate)
                        .divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
                    breakdown.add(new TaxCalculationResult.TaxBreakdown(
                        "LOCAL",
                        request.getDestinationCity() != null ? request.getDestinationCity() : "Local",
                        localRate,
                        localTax
                    ));
                    totalTax = totalTax.add(localTax);
                }
            }

            result.setBreakdown(breakdown);
            result.setTaxAmount(totalTax);
            result.setTotalAmount(request.getOrderAmount().add(request.getShippingAmount()).add(totalTax));

            logger.info("Tax calculated: {} for tenant: {}", totalTax, tenantId);
            return Mono.just(result);
                });
            });
    }

    /**
     * Check if a product category is tax-exempt in a given state.
     *
     * @param state State code
     * @param category Product category
     * @return Mono of boolean indicating if category is exempt
     */
    public Mono<Boolean> isTaxExempt(String state, String category) {
        List<String> exemptCategories = TAX_EXEMPT_CATEGORIES.get(state.toUpperCase());
        if (exemptCategories == null) {
            return Mono.just(false);
        }
        return Mono.just(exemptCategories.contains(category.toUpperCase()));
    }

    /**
     * Get effective tax rate for a location.
     *
     * @param state State code
     * @param postalCode Postal code
     * @return Mono of effective tax rate percentage
     */
    public Mono<BigDecimal> getEffectiveTaxRate(String state, String postalCode) {
        StateTaxRates rates = STATE_TAX_RATES.get(state.toUpperCase());
        if (rates == null) {
            return Mono.just(BigDecimal.ZERO);
        }

        BigDecimal localRate = calculateLocalRate(postalCode, rates.maxLocalRate);
        return Mono.just(rates.stateRate.add(localRate));
    }

    private BigDecimal calculateTaxableAmount(TaxCalculationRequest request, StateTaxRates rates) {
        BigDecimal taxableAmount = request.getOrderAmount();

        // If items are provided, calculate taxable amount based on exemptions
        if (!request.getItems().isEmpty()) {
            taxableAmount = BigDecimal.ZERO;
            List<String> exemptCategories = TAX_EXEMPT_CATEGORIES.get(request.getDestinationState().toUpperCase());

            for (TaxCalculationRequest.TaxableItem item : request.getItems()) {
                boolean isExempt = exemptCategories != null &&
                    item.getTaxCategory() != null &&
                    exemptCategories.contains(item.getTaxCategory().toUpperCase());

                if (!isExempt) {
                    taxableAmount = taxableAmount.add(item.getAmount());
                }
            }
        }

        // Add shipping to taxable amount (most states tax shipping)
        taxableAmount = taxableAmount.add(request.getShippingAmount());

        return taxableAmount;
    }

    private BigDecimal calculateLocalRate(String postalCode, BigDecimal maxLocalRate) {
        // Simplified local rate calculation based on postal code
        // In reality, would use tax API or detailed tax database
        try {
            int zip = Integer.parseInt(postalCode.substring(0, Math.min(5, postalCode.length())));
            // Use last digit to determine local rate as percentage of max
            int lastDigit = zip % 10;
            BigDecimal percentage = new BigDecimal(lastDigit).divide(new BigDecimal("10"), 2, RoundingMode.HALF_UP);
            return maxLocalRate.multiply(percentage).setScale(2, RoundingMode.HALF_UP);
        } catch (Exception e) {
            logger.warn("Error parsing postal code for local rate calculation", e);
            return maxLocalRate.divide(new BigDecimal("2"), 2, RoundingMode.HALF_UP); // Use average
        }
    }

    private TaxCalculationResult createZeroTaxResult(TaxCalculationRequest request) {
        TaxCalculationResult result = new TaxCalculationResult();
        result.setSubtotal(request.getOrderAmount());
        result.setShipping(request.getShippingAmount());
        result.setTaxableAmount(BigDecimal.ZERO);
        result.setTaxAmount(BigDecimal.ZERO);
        result.setTotalAmount(request.getOrderAmount().add(request.getShippingAmount()));
        result.setCurrency(request.getCurrency());
        result.setBreakdown(new ArrayList<>());
        return result;
    }

    private static class StateTaxRates {
        BigDecimal stateRate;
        BigDecimal maxLocalRate;

        StateTaxRates(BigDecimal stateRate, BigDecimal maxLocalRate) {
            this.stateRate = stateRate;
            this.maxLocalRate = maxLocalRate;
        }
    }
}
