package com.retail.api.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

import java.util.regex.Pattern;

/**
 * Validator implementation for @ValidSlug annotation.
 * Ensures slugs follow URL-friendly conventions.
 */
public class SlugValidator implements ConstraintValidator<ValidSlug, String> {

    // Slug pattern: starts with letter, contains lowercase letters, numbers, hyphens
    // Cannot end with hyphen, no consecutive hyphens
    private static final Pattern SLUG_PATTERN = Pattern.compile("^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$");

    @Override
    public void initialize(ValidSlug constraintAnnotation) {
        // No initialization needed
    }

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        // Null values should be validated by @NotNull if required
        if (value == null) {
            return true;
        }

        // Empty strings are invalid
        if (value.trim().isEmpty()) {
            return false;
        }

        // Check pattern match
        return SLUG_PATTERN.matcher(value).matches();
    }
}
