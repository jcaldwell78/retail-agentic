package com.retail.domain.user;

import java.util.ArrayList;
import java.util.List;

/**
 * Validates password strength according to security requirements.
 * Passwords must meet minimum complexity requirements to reduce the risk
 * of brute force and dictionary attacks.
 */
public class PasswordValidator {

    private static final int MIN_LENGTH = 8;
    private static final String UPPERCASE_PATTERN = ".*[A-Z].*";
    private static final String LOWERCASE_PATTERN = ".*[a-z].*";
    private static final String DIGIT_PATTERN = ".*\\d.*";
    private static final String SPECIAL_CHAR_PATTERN = ".*[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>\\/?].*";

    /**
     * Validates password strength and returns validation result.
     *
     * @param password the password to validate
     * @return ValidationResult containing validation status and error messages
     */
    public static ValidationResult validate(String password) {
        List<String> errors = new ArrayList<>();

        if (password == null || password.isEmpty()) {
            errors.add("Password is required");
            return new ValidationResult(false, errors);
        }

        if (password.length() < MIN_LENGTH) {
            errors.add("Password must be at least " + MIN_LENGTH + " characters long");
        }

        if (!password.matches(UPPERCASE_PATTERN)) {
            errors.add("Password must contain at least one uppercase letter");
        }

        if (!password.matches(LOWERCASE_PATTERN)) {
            errors.add("Password must contain at least one lowercase letter");
        }

        if (!password.matches(DIGIT_PATTERN)) {
            errors.add("Password must contain at least one number");
        }

        if (!password.matches(SPECIAL_CHAR_PATTERN)) {
            errors.add("Password must contain at least one special character (!@#$%^&*()_+-=[]{};':\"\\|,.<>/?)");
        }

        return new ValidationResult(errors.isEmpty(), errors);
    }

    /**
     * Result of password validation
     */
    public static class ValidationResult {
        private final boolean valid;
        private final List<String> errors;

        public ValidationResult(boolean valid, List<String> errors) {
            this.valid = valid;
            this.errors = errors;
        }

        public boolean isValid() {
            return valid;
        }

        public List<String> getErrors() {
            return errors;
        }

        public String getErrorMessage() {
            return String.join("; ", errors);
        }
    }
}
