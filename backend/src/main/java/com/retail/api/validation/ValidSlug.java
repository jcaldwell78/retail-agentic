package com.retail.api.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.*;

/**
 * Validates that a string is a valid URL slug.
 * Valid slugs contain only lowercase letters, numbers, and hyphens.
 * They must start with a letter and cannot end with a hyphen.
 *
 * Example valid slugs: "electronics", "mens-clothing", "iphone-15"
 * Example invalid slugs: "-invalid", "Invalid", "slug_with_underscore"
 */
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = SlugValidator.class)
@Documented
public @interface ValidSlug {

    String message() default "Invalid slug format. Must contain only lowercase letters, numbers, and hyphens, starting with a letter.";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
