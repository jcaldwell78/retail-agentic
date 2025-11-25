package com.retail.exception;

/**
 * Exception thrown when a requested resource is not found.
 */
public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String message) {
        super(message);
    }

    public ResourceNotFoundException(String resourceType, String id) {
        super(resourceType + " with id '" + id + "' not found");
    }

    public ResourceNotFoundException(String message, Throwable cause) {
        super(message, cause);
    }
}
