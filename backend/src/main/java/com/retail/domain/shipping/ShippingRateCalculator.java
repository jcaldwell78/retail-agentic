package com.retail.domain.shipping;

import com.retail.security.tenant.TenantContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;

/**
 * Service for calculating shipping rates based on various factors.
 * Supports multiple carriers and service levels with reactive programming.
 */
@Service
public class ShippingRateCalculator {

    private static final Logger logger = LoggerFactory.getLogger(ShippingRateCalculator.class);

    // Base rates per pound for different service levels
    private static final BigDecimal STANDARD_BASE_RATE = new BigDecimal("5.00");
    private static final BigDecimal STANDARD_PER_POUND = new BigDecimal("0.50");

    private static final BigDecimal EXPRESS_BASE_RATE = new BigDecimal("12.00");
    private static final BigDecimal EXPRESS_PER_POUND = new BigDecimal("1.00");

    private static final BigDecimal OVERNIGHT_BASE_RATE = new BigDecimal("25.00");
    private static final BigDecimal OVERNIGHT_PER_POUND = new BigDecimal("2.00");

    // Distance multipliers (simplified zones)
    private static final BigDecimal LOCAL_MULTIPLIER = new BigDecimal("1.0");
    private static final BigDecimal REGIONAL_MULTIPLIER = new BigDecimal("1.5");
    private static final BigDecimal NATIONAL_MULTIPLIER = new BigDecimal("2.0");
    private static final BigDecimal INTERNATIONAL_MULTIPLIER = new BigDecimal("3.0");

    /**
     * Calculate shipping rates for all available service levels.
     *
     * @param request Shipping rate request with origin, destination, and package details
     * @return Flux of available shipping rates
     */
    public Flux<ShippingRate> calculateRates(ShippingRateRequest request) {
        return TenantContext.getTenantId()
            .flatMapMany(tenantId -> {
                logger.info("Calculating shipping rates for tenant: {} from {} to {}",
                    tenantId, request.getOriginPostalCode(), request.getDestinationPostalCode());

                return Mono.defer(() -> {
                    BigDecimal distanceMultiplier = calculateDistanceMultiplier(
                        request.getOriginCountry(),
                        request.getDestinationCountry(),
                        request.getOriginPostalCode(),
                        request.getDestinationPostalCode()
                    );

                    BigDecimal dimensionalWeight = calculateDimensionalWeight(
                        request.getLengthInches(),
                        request.getWidthInches(),
                        request.getHeightInches()
                    );

                    BigDecimal chargeableWeight = dimensionalWeight != null && dimensionalWeight.compareTo(request.getWeightPounds()) > 0
                        ? dimensionalWeight
                        : request.getWeightPounds();

                    List<ShippingRate> rates = new ArrayList<>();

                    // Standard shipping
                    rates.add(calculateStandardRate(chargeableWeight, distanceMultiplier, request.getCurrency()));

                    // Express shipping
                    rates.add(calculateExpressRate(chargeableWeight, distanceMultiplier, request.getCurrency()));

                    // Overnight shipping (only for domestic)
                    if (request.getOriginCountry().equalsIgnoreCase(request.getDestinationCountry())) {
                        rates.add(calculateOvernightRate(chargeableWeight, distanceMultiplier, request.getCurrency()));
                    }

                    return Mono.just(rates);
                })
                .flatMapMany(Flux::fromIterable)
                .doOnComplete(() -> logger.info("Shipping rates calculated successfully for tenant: {}", tenantId));
            });
    }

    /**
     * Calculate rate for a specific service level.
     *
     * @param request Shipping rate request
     * @param serviceLevel Service level (STANDARD, EXPRESS, OVERNIGHT)
     * @return Mono of shipping rate
     */
    public Mono<ShippingRate> calculateRate(ShippingRateRequest request, String serviceLevel) {
        return calculateRates(request)
            .filter(rate -> rate.getServiceLevel().equalsIgnoreCase(serviceLevel))
            .next()
            .switchIfEmpty(Mono.error(new IllegalArgumentException("Invalid service level: " + serviceLevel)));
    }

    /**
     * Calculate free shipping threshold eligibility.
     *
     * @param orderValue Order value
     * @param freeShippingThreshold Free shipping threshold
     * @return True if order qualifies for free shipping
     */
    public Mono<Boolean> qualifiesForFreeShipping(BigDecimal orderValue, BigDecimal freeShippingThreshold) {
        return Mono.just(orderValue.compareTo(freeShippingThreshold) >= 0);
    }

    private ShippingRate calculateStandardRate(BigDecimal weight, BigDecimal distanceMultiplier, String currency) {
        BigDecimal rate = STANDARD_BASE_RATE.add(
            STANDARD_PER_POUND.multiply(weight)
        ).multiply(distanceMultiplier);

        return new ShippingRate(
            "USPS",
            "STANDARD",
            rate.setScale(2, RoundingMode.HALF_UP),
            5,
            currency
        );
    }

    private ShippingRate calculateExpressRate(BigDecimal weight, BigDecimal distanceMultiplier, String currency) {
        BigDecimal rate = EXPRESS_BASE_RATE.add(
            EXPRESS_PER_POUND.multiply(weight)
        ).multiply(distanceMultiplier);

        return new ShippingRate(
            "FedEx",
            "EXPRESS",
            rate.setScale(2, RoundingMode.HALF_UP),
            2,
            currency
        );
    }

    private ShippingRate calculateOvernightRate(BigDecimal weight, BigDecimal distanceMultiplier, String currency) {
        BigDecimal rate = OVERNIGHT_BASE_RATE.add(
            OVERNIGHT_PER_POUND.multiply(weight)
        ).multiply(distanceMultiplier);

        return new ShippingRate(
            "FedEx",
            "OVERNIGHT",
            rate.setScale(2, RoundingMode.HALF_UP),
            1,
            currency
        );
    }

    private BigDecimal calculateDistanceMultiplier(String originCountry, String destinationCountry,
                                                   String originPostalCode, String destinationPostalCode) {
        // International shipping
        if (!originCountry.equalsIgnoreCase(destinationCountry)) {
            return INTERNATIONAL_MULTIPLIER;
        }

        // Simplified zone calculation based on postal code distance
        // In a real implementation, this would use actual distance/zone APIs
        try {
            int originZip = Integer.parseInt(originPostalCode.substring(0, Math.min(5, originPostalCode.length())));
            int destZip = Integer.parseInt(destinationPostalCode.substring(0, Math.min(5, destinationPostalCode.length())));
            int distance = Math.abs(originZip - destZip);

            if (distance < 100) {
                return LOCAL_MULTIPLIER;
            } else if (distance < 1000) {
                return REGIONAL_MULTIPLIER;
            } else {
                return NATIONAL_MULTIPLIER;
            }
        } catch (Exception e) {
            logger.warn("Error calculating distance, using regional multiplier", e);
            return REGIONAL_MULTIPLIER;
        }
    }

    private BigDecimal calculateDimensionalWeight(BigDecimal length, BigDecimal width, BigDecimal height) {
        if (length == null || width == null || height == null) {
            return null;
        }

        // Dimensional weight = (Length × Width × Height) / 166 (for inches)
        BigDecimal volumeCubicInches = length.multiply(width).multiply(height);
        BigDecimal dimensionalWeight = volumeCubicInches.divide(
            new BigDecimal("166"),
            2,
            RoundingMode.HALF_UP
        );

        return dimensionalWeight;
    }
}
