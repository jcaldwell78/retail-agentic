package com.retail.domain.tax;

import com.retail.security.tenant.TenantContext;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import reactor.test.StepVerifier;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

class TaxCalculationServiceTest {

    private TaxCalculationService service;

    @BeforeEach
    void setUp() {
        service = new TaxCalculationService();
    }

    @Test
    void shouldCalculateTaxForCalifornia() {
        TaxCalculationRequest request = createBasicRequest("CA", "90001");

        StepVerifier.create(
            service.calculateTax(request)
                .contextWrite(TenantContext.withTenantId("test-tenant"))
        )
            .assertNext(result -> {
                assertThat(result.getTaxAmount()).isGreaterThan(BigDecimal.ZERO);
                assertThat(result.getBreakdown()).isNotEmpty();
                assertThat(result.getTotalAmount()).isEqualTo(
                    result.getSubtotal().add(result.getShipping()).add(result.getTaxAmount())
                );
            })
            .verifyComplete();
    }

    @Test
    void shouldCalculateTaxForNewYork() {
        TaxCalculationRequest request = createBasicRequest("NY", "10001");

        StepVerifier.create(
            service.calculateTax(request)
                .contextWrite(TenantContext.withTenantId("test-tenant"))
        )
            .assertNext(result -> {
                assertThat(result.getTaxAmount()).isGreaterThan(BigDecimal.ZERO);
                assertThat(result.getBreakdown()).hasSize(2); // State + Local
                assertThat(result.getBreakdown().get(0).getTaxType()).isEqualTo("STATE");
            })
            .verifyComplete();
    }

    @Test
    void shouldReturnZeroTaxForDelaware() {
        TaxCalculationRequest request = createBasicRequest("DE", "19901");

        StepVerifier.create(
            service.calculateTax(request)
                .contextWrite(TenantContext.withTenantId("test-tenant"))
        )
            .assertNext(result -> {
                assertThat(result.getTaxAmount()).isEqualTo(BigDecimal.ZERO);
                assertThat(result.getBreakdown()).isEmpty();
                assertThat(result.getTotalAmount()).isEqualTo(
                    result.getSubtotal().add(result.getShipping())
                );
            })
            .verifyComplete();
    }

    @Test
    void shouldReturnZeroTaxForOregon() {
        TaxCalculationRequest request = createBasicRequest("OR", "97201");

        StepVerifier.create(
            service.calculateTax(request)
                .contextWrite(TenantContext.withTenantId("test-tenant"))
        )
            .assertNext(result -> {
                assertThat(result.getTaxAmount()).isEqualTo(BigDecimal.ZERO);
            })
            .verifyComplete();
    }

    @Test
    void shouldIncludeShippingInTaxableAmount() {
        TaxCalculationRequest request = createBasicRequest("CA", "90001");
        request.setShippingAmount(new BigDecimal("10.00"));

        StepVerifier.create(
            service.calculateTax(request)
                .contextWrite(TenantContext.withTenantId("test-tenant"))
        )
            .assertNext(result -> {
                assertThat(result.getTaxableAmount()).isEqualTo(
                    request.getOrderAmount().add(request.getShippingAmount())
                );
            })
            .verifyComplete();
    }

    @Test
    void shouldExemptFoodInPennsylvania() {
        TaxCalculationRequest request = createBasicRequest("PA", "19019");

        TaxCalculationRequest.TaxableItem food = new TaxCalculationRequest.TaxableItem();
        food.setProductId("food-1");
        food.setAmount(new BigDecimal("50.00"));
        food.setTaxCategory("FOOD");

        TaxCalculationRequest.TaxableItem general = new TaxCalculationRequest.TaxableItem();
        general.setProductId("general-1");
        general.setAmount(new BigDecimal("50.00"));
        general.setTaxCategory("GENERAL");

        request.getItems().add(food);
        request.getItems().add(general);

        StepVerifier.create(
            service.calculateTax(request)
                .contextWrite(TenantContext.withTenantId("test-tenant"))
        )
            .assertNext(result -> {
                // Only general item + shipping should be taxed, not food
                BigDecimal expectedTaxable = new BigDecimal("50.00").add(request.getShippingAmount());
                assertThat(result.getTaxableAmount()).isEqualByComparingTo(expectedTaxable);
            })
            .verifyComplete();
    }

    @Test
    void shouldCheckTaxExemptionForFood() {
        StepVerifier.create(
            service.isTaxExempt("PA", "FOOD")
                .contextWrite(TenantContext.withTenantId("test-tenant"))
        )
            .expectNext(true)
            .verifyComplete();

        StepVerifier.create(
            service.isTaxExempt("PA", "GENERAL")
                .contextWrite(TenantContext.withTenantId("test-tenant"))
        )
            .expectNext(false)
            .verifyComplete();
    }

    @Test
    void shouldCheckTaxExemptionForClothing() {
        StepVerifier.create(
            service.isTaxExempt("PA", "CLOTHING")
                .contextWrite(TenantContext.withTenantId("test-tenant"))
        )
            .expectNext(true)
            .verifyComplete();

        StepVerifier.create(
            service.isTaxExempt("CA", "CLOTHING")
                .contextWrite(TenantContext.withTenantId("test-tenant"))
        )
            .expectNext(false)
            .verifyComplete();
    }

    @Test
    void shouldReturnZeroTaxForInternationalOrders() {
        TaxCalculationRequest request = createBasicRequest("CA", "90001");
        request.setDestinationCountry("CA"); // Canada

        StepVerifier.create(
            service.calculateTax(request)
                .contextWrite(TenantContext.withTenantId("test-tenant"))
        )
            .assertNext(result -> {
                assertThat(result.getTaxAmount()).isEqualTo(BigDecimal.ZERO);
                assertThat(result.getBreakdown()).isEmpty();
            })
            .verifyComplete();
    }

    @Test
    void shouldHandleUnknownState() {
        TaxCalculationRequest request = createBasicRequest("XX", "00000");

        StepVerifier.create(
            service.calculateTax(request)
                .contextWrite(TenantContext.withTenantId("test-tenant"))
        )
            .assertNext(result -> {
                assertThat(result.getTaxAmount()).isEqualTo(BigDecimal.ZERO);
            })
            .verifyComplete();
    }

    @Test
    void shouldGetEffectiveTaxRateForCalifornia() {
        StepVerifier.create(
            service.getEffectiveTaxRate("CA", "90001")
                .contextWrite(TenantContext.withTenantId("test-tenant"))
        )
            .assertNext(rate -> {
                assertThat(rate).isGreaterThan(new BigDecimal("7.00"));
                assertThat(rate).isLessThan(new BigDecimal("10.00"));
            })
            .verifyComplete();
    }

    @Test
    void shouldGetZeroEffectiveTaxRateForDelaware() {
        StepVerifier.create(
            service.getEffectiveTaxRate("DE", "19901")
                .contextWrite(TenantContext.withTenantId("test-tenant"))
        )
            .assertNext(rate -> {
                assertThat(rate).isEqualByComparingTo(BigDecimal.ZERO);
            })
            .verifyComplete();
    }

    @Test
    void shouldIncludeStateTaxInBreakdown() {
        TaxCalculationRequest request = createBasicRequest("TX", "75001");

        StepVerifier.create(
            service.calculateTax(request)
                .contextWrite(TenantContext.withTenantId("test-tenant"))
        )
            .assertNext(result -> {
                assertThat(result.getBreakdown()).anySatisfy(breakdown -> {
                    assertThat(breakdown.getTaxType()).isEqualTo("STATE");
                    assertThat(breakdown.getJurisdiction()).isEqualTo("TX");
                    assertThat(breakdown.getRate()).isEqualByComparingTo(new BigDecimal("6.25"));
                });
            })
            .verifyComplete();
    }

    @Test
    void shouldIncludeLocalTaxInBreakdown() {
        TaxCalculationRequest request = createBasicRequest("NY", "10001");
        request.setDestinationCity("New York");

        StepVerifier.create(
            service.calculateTax(request)
                .contextWrite(TenantContext.withTenantId("test-tenant"))
        )
            .assertNext(result -> {
                assertThat(result.getBreakdown()).anySatisfy(breakdown -> {
                    assertThat(breakdown.getTaxType()).isEqualTo("LOCAL");
                    assertThat(breakdown.getJurisdiction()).isEqualTo("New York");
                    assertThat(breakdown.getRate()).isGreaterThan(BigDecimal.ZERO);
                });
            })
            .verifyComplete();
    }

    @Test
    void shouldRoundTaxToTwoDecimalPlaces() {
        TaxCalculationRequest request = createBasicRequest("CA", "90001");
        request.setOrderAmount(new BigDecimal("99.99"));

        StepVerifier.create(
            service.calculateTax(request)
                .contextWrite(TenantContext.withTenantId("test-tenant"))
        )
            .assertNext(result -> {
                assertThat(result.getTaxAmount().scale()).isEqualTo(2);
                assertThat(result.getTotalAmount().scale()).isLessThanOrEqualTo(2);
            })
            .verifyComplete();
    }

    @Test
    void shouldCalculateCorrectTotalAmount() {
        TaxCalculationRequest request = createBasicRequest("FL", "33101");
        request.setOrderAmount(new BigDecimal("100.00"));
        request.setShippingAmount(new BigDecimal("10.00"));

        StepVerifier.create(
            service.calculateTax(request)
                .contextWrite(TenantContext.withTenantId("test-tenant"))
        )
            .assertNext(result -> {
                BigDecimal expectedTotal = result.getSubtotal()
                    .add(result.getShipping())
                    .add(result.getTaxAmount());
                assertThat(result.getTotalAmount()).isEqualByComparingTo(expectedTotal);
            })
            .verifyComplete();
    }

    @Test
    void shouldHandleZeroShipping() {
        TaxCalculationRequest request = createBasicRequest("WA", "98101");
        request.setShippingAmount(BigDecimal.ZERO);

        StepVerifier.create(
            service.calculateTax(request)
                .contextWrite(TenantContext.withTenantId("test-tenant"))
        )
            .assertNext(result -> {
                assertThat(result.getShipping()).isEqualByComparingTo(BigDecimal.ZERO);
                assertThat(result.getTaxableAmount()).isEqualByComparingTo(request.getOrderAmount());
            })
            .verifyComplete();
    }

    @Test
    void shouldPreserveCurrency() {
        TaxCalculationRequest request = createBasicRequest("IL", "60601");
        request.setCurrency("EUR");

        StepVerifier.create(
            service.calculateTax(request)
                .contextWrite(TenantContext.withTenantId("test-tenant"))
        )
            .assertNext(result -> {
                assertThat(result.getCurrency()).isEqualTo("EUR");
            })
            .verifyComplete();
    }

    @Test
    void shouldCalculateDifferentLocalRatesForDifferentPostalCodes() {
        TaxCalculationRequest request1 = createBasicRequest("CA", "90001");
        TaxCalculationRequest request2 = createBasicRequest("CA", "90009");

        StepVerifier.create(
            service.calculateTax(request1)
                .contextWrite(TenantContext.withTenantId("test-tenant"))
        )
            .assertNext(result1 -> {
                StepVerifier.create(
                    service.calculateTax(request2)
                        .contextWrite(TenantContext.withTenantId("test-tenant"))
                )
                    .assertNext(result2 -> {
                        // Different postal codes may have different local rates
                        // Due to our simplified calculation based on last digit
                        boolean ratesDifferent = !result1.getTaxAmount().equals(result2.getTaxAmount());
                        assertThat(ratesDifferent).isTrue();
                    })
                    .verifyComplete();
            })
            .verifyComplete();
    }

    @Test
    void shouldHandleMultipleItemsWithMixedCategories() {
        TaxCalculationRequest request = createBasicRequest("NY", "10001");

        TaxCalculationRequest.TaxableItem food1 = new TaxCalculationRequest.TaxableItem();
        food1.setProductId("food-1");
        food1.setAmount(new BigDecimal("25.00"));
        food1.setTaxCategory("FOOD");

        TaxCalculationRequest.TaxableItem food2 = new TaxCalculationRequest.TaxableItem();
        food2.setProductId("food-2");
        food2.setAmount(new BigDecimal("25.00"));
        food2.setTaxCategory("FOOD");

        TaxCalculationRequest.TaxableItem general = new TaxCalculationRequest.TaxableItem();
        general.setProductId("general-1");
        general.setAmount(new BigDecimal("50.00"));
        general.setTaxCategory("GENERAL");

        request.getItems().add(food1);
        request.getItems().add(food2);
        request.getItems().add(general);

        StepVerifier.create(
            service.calculateTax(request)
                .contextWrite(TenantContext.withTenantId("test-tenant"))
        )
            .assertNext(result -> {
                // In NY, food is exempt, so only general item + shipping taxed
                assertThat(result.getTaxableAmount()).isGreaterThan(BigDecimal.ZERO);
                assertThat(result.getTaxAmount()).isGreaterThan(BigDecimal.ZERO);
            })
            .verifyComplete();
    }

    private TaxCalculationRequest createBasicRequest(String state, String postalCode) {
        TaxCalculationRequest request = new TaxCalculationRequest();
        request.setDestinationCountry("US");
        request.setDestinationState(state);
        request.setDestinationPostalCode(postalCode);
        request.setDestinationCity("Test City");
        request.setOrderAmount(new BigDecimal("100.00"));
        request.setShippingAmount(new BigDecimal("5.00"));
        request.setCurrency("USD");
        return request;
    }
}
