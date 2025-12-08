package com.retail.domain.user;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for PasswordValidator
 */
class PasswordValidatorTest {

    @Test
    void testValidPassword() {
        // Given a password that meets all requirements
        String password = "ValidPass123!";

        // When validating
        PasswordValidator.ValidationResult result = PasswordValidator.validate(password);

        // Then validation should pass
        assertTrue(result.isValid());
        assertTrue(result.getErrors().isEmpty());
    }

    @Test
    void testNullPassword() {
        // When validating null password
        PasswordValidator.ValidationResult result = PasswordValidator.validate(null);

        // Then validation should fail
        assertFalse(result.isValid());
        assertEquals(1, result.getErrors().size());
        assertTrue(result.getErrorMessage().contains("required"));
    }

    @Test
    void testEmptyPassword() {
        // When validating empty password
        PasswordValidator.ValidationResult result = PasswordValidator.validate("");

        // Then validation should fail
        assertFalse(result.isValid());
        assertEquals(1, result.getErrors().size());
        assertTrue(result.getErrorMessage().contains("required"));
    }

    @Test
    void testTooShortPassword() {
        // Given a password that's too short
        String password = "Short1!";

        // When validating
        PasswordValidator.ValidationResult result = PasswordValidator.validate(password);

        // Then validation should fail
        assertFalse(result.isValid());
        assertTrue(result.getErrorMessage().contains("at least 8 characters"));
    }

    @Test
    void testNoUppercaseLetter() {
        // Given a password without uppercase letter
        String password = "password123!";

        // When validating
        PasswordValidator.ValidationResult result = PasswordValidator.validate(password);

        // Then validation should fail
        assertFalse(result.isValid());
        assertTrue(result.getErrorMessage().contains("uppercase letter"));
    }

    @Test
    void testNoLowercaseLetter() {
        // Given a password without lowercase letter
        String password = "PASSWORD123!";

        // When validating
        PasswordValidator.ValidationResult result = PasswordValidator.validate(password);

        // Then validation should fail
        assertFalse(result.isValid());
        assertTrue(result.getErrorMessage().contains("lowercase letter"));
    }

    @Test
    void testNoDigit() {
        // Given a password without digit
        String password = "PasswordOnly!";

        // When validating
        PasswordValidator.ValidationResult result = PasswordValidator.validate(password);

        // Then validation should fail
        assertFalse(result.isValid());
        assertTrue(result.getErrorMessage().contains("number"));
    }

    @Test
    void testNoSpecialCharacter() {
        // Given a password without special character
        String password = "Password123";

        // When validating
        PasswordValidator.ValidationResult result = PasswordValidator.validate(password);

        // Then validation should fail
        assertFalse(result.isValid());
        assertTrue(result.getErrorMessage().contains("special character"));
    }

    @Test
    void testMultipleViolations() {
        // Given a password that violates multiple rules
        String password = "short";

        // When validating
        PasswordValidator.ValidationResult result = PasswordValidator.validate(password);

        // Then validation should fail with multiple errors
        assertFalse(result.isValid());
        assertTrue(result.getErrors().size() > 1);
    }

    @ParameterizedTest
    @ValueSource(strings = {
        "ValidPass123!",
        "MyP@ssw0rd",
        "Test1234#",
        "Secure$Pass1",
        "Complex9&Pass"
    })
    void testValidPasswords(String password) {
        // When validating various valid passwords
        PasswordValidator.ValidationResult result = PasswordValidator.validate(password);

        // Then all should pass
        assertTrue(result.isValid(), "Password '" + password + "' should be valid");
    }

    @ParameterizedTest
    @ValueSource(strings = {
        "short",           // Too short, no uppercase, no digit, no special char
        "password",        // No uppercase, no digit, no special char
        "PASSWORD",        // No lowercase, no digit, no special char
        "12345678",        // No uppercase, no lowercase, no special char
        "!!!!!!!!!",       // No uppercase, no lowercase, no digit
        "NoSpecial123",    // No special char
        "nouppercas1!"     // No uppercase
    })
    void testInvalidPasswords(String password) {
        // When validating various invalid passwords
        PasswordValidator.ValidationResult result = PasswordValidator.validate(password);

        // Then all should fail
        assertFalse(result.isValid(), "Password '" + password + "' should be invalid");
    }

    @Test
    void testMinimumValidPassword() {
        // Given a password that just meets all requirements
        String password = "Aa1!Aa1!";

        // When validating
        PasswordValidator.ValidationResult result = PasswordValidator.validate(password);

        // Then validation should pass
        assertTrue(result.isValid());
    }

    @Test
    void testVariousSpecialCharacters() {
        // Test that various special characters are accepted
        String[] passwords = {
            "Pass!word1",
            "Pass@word1",
            "Pass#word1",
            "Pass$word1",
            "Pass%word1",
            "Pass^word1",
            "Pass&word1",
            "Pass*word1",
            "Pass(word1)",
            "Pass_word1",
            "Pass+word1",
            "Pass-word1",
            "Pass=word1",
            "Pass[word]1",
            "Pass{word}1",
            "Pass;word:1",
            "Pass'word\"1",
            "Pass\\word|1",
            "Pass,word.1",
            "Pass<word>1",
            "Pass/word?1"
        };

        for (String password : passwords) {
            PasswordValidator.ValidationResult result = PasswordValidator.validate(password);
            assertTrue(result.isValid(),
                "Password with special character should be valid: " + password);
        }
    }
}
