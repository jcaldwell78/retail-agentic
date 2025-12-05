package com.retail.api.validation;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Standardized validation error response.
 * Returns detailed field-level validation errors to clients.
 */
public class ValidationErrorResponse {

    private String message;
    private int status;
    private Instant timestamp;
    private String path;
    private List<FieldError> errors;

    public ValidationErrorResponse() {
        this.timestamp = Instant.now();
        this.errors = new ArrayList<>();
    }

    public ValidationErrorResponse(String message, int status, String path) {
        this();
        this.message = message;
        this.status = status;
        this.path = path;
    }

    public void addFieldError(String field, String message, Object rejectedValue) {
        errors.add(new FieldError(field, message, rejectedValue));
    }

    // Getters and Setters
    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public int getStatus() {
        return status;
    }

    public void setStatus(int status) {
        this.status = status;
    }

    public Instant getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Instant timestamp) {
        this.timestamp = timestamp;
    }

    public String getPath() {
        return path;
    }

    public void setPath(String path) {
        this.path = path;
    }

    public List<FieldError> getErrors() {
        return errors;
    }

    public void setErrors(List<FieldError> errors) {
        this.errors = errors;
    }

    /**
     * Individual field validation error
     */
    public static class FieldError {
        private String field;
        private String message;
        private Object rejectedValue;

        public FieldError() {
        }

        public FieldError(String field, String message, Object rejectedValue) {
            this.field = field;
            this.message = message;
            this.rejectedValue = rejectedValue;
        }

        public String getField() {
            return field;
        }

        public void setField(String field) {
            this.field = field;
        }

        public String getMessage() {
            return message;
        }

        public void setMessage(String message) {
            this.message = message;
        }

        public Object getRejectedValue() {
            return rejectedValue;
        }

        public void setRejectedValue(Object rejectedValue) {
            this.rejectedValue = rejectedValue;
        }
    }
}
