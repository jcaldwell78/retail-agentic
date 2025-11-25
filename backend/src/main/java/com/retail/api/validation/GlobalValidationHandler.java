package com.retail.api.validation;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.bind.support.WebExchangeBindException;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;

/**
 * Global exception handler for validation errors.
 * Intercepts validation exceptions and returns standardized error responses.
 */
@RestControllerAdvice
public class GlobalValidationHandler {

    /**
     * Handle Bean Validation (@Valid) errors
     */
    @ExceptionHandler(WebExchangeBindException.class)
    public Mono<ResponseEntity<ValidationErrorResponse>> handleValidationException(
            WebExchangeBindException ex,
            ServerWebExchange exchange) {

        ValidationErrorResponse response = new ValidationErrorResponse(
                "Validation failed",
                HttpStatus.BAD_REQUEST.value(),
                exchange.getRequest().getPath().value()
        );

        // Add field errors
        ex.getBindingResult().getAllErrors().forEach(error -> {
            if (error instanceof FieldError fieldError) {
                response.addFieldError(
                        fieldError.getField(),
                        fieldError.getDefaultMessage(),
                        fieldError.getRejectedValue()
                );
            } else {
                response.addFieldError(
                        error.getObjectName(),
                        error.getDefaultMessage(),
                        null
                );
            }
        });

        return Mono.just(ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(response));
    }

    /**
     * Handle constraint violation exceptions
     */
    @ExceptionHandler(ConstraintViolationException.class)
    public Mono<ResponseEntity<ValidationErrorResponse>> handleConstraintViolation(
            ConstraintViolationException ex,
            ServerWebExchange exchange) {

        ValidationErrorResponse response = new ValidationErrorResponse(
                "Constraint violation",
                HttpStatus.BAD_REQUEST.value(),
                exchange.getRequest().getPath().value()
        );

        // Add constraint violations
        ex.getConstraintViolations().forEach(violation -> {
            String propertyPath = getPropertyPath(violation);
            response.addFieldError(
                    propertyPath,
                    violation.getMessage(),
                    violation.getInvalidValue()
            );
        });

        return Mono.just(ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(response));
    }

    /**
     * Extract property path from constraint violation
     */
    private String getPropertyPath(ConstraintViolation<?> violation) {
        String path = violation.getPropertyPath().toString();
        // Remove method name prefix if present (e.g., "createProduct.product.name" -> "name")
        int lastDot = path.lastIndexOf('.');
        return lastDot >= 0 ? path.substring(lastDot + 1) : path;
    }
}
