package com.retail.security.tenant;

/**
 * Exception thrown when tenant context is not available in the reactive context.
 */
public class TenantContextMissingException extends RuntimeException {

    public TenantContextMissingException(String message) {
        super(message);
    }

    public TenantContextMissingException(String message, Throwable cause) {
        super(message, cause);
    }
}
