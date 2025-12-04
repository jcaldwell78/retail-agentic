package com.retail.domain.auth;

/**
 * Exception thrown when OAuth2 authentication fails.
 */
public class OAuth2Exception extends RuntimeException {

    public OAuth2Exception(String message) {
        super(message);
    }

    public OAuth2Exception(String message, Throwable cause) {
        super(message, cause);
    }
}
