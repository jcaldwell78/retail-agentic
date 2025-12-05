package com.retail.security.tenant;

/**
 * Exception thrown when tenant cannot be resolved or does not exist.
 */
public class TenantNotFoundException extends RuntimeException {

    public TenantNotFoundException(String message) {
        super(message);
    }

    public TenantNotFoundException(String message, Throwable cause) {
        super(message, cause);
    }
}
