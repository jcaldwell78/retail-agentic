package com.retail.domain.auth;

/**
 * Supported OAuth2 providers.
 */
public enum OAuth2Provider {
    GOOGLE,
    FACEBOOK;

    public static OAuth2Provider fromString(String provider) {
        if (provider == null) {
            return null;
        }
        try {
            return valueOf(provider.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Unsupported OAuth2 provider: " + provider);
        }
    }
}
