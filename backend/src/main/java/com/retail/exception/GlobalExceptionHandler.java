package com.retail.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.bind.support.WebExchangeBindException;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Global exception handler for consistent error responses across the API.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * Handle validation errors
     */
    @ExceptionHandler(WebExchangeBindException.class)
    public Mono<ResponseEntity<ErrorResponse>> handleValidationErrors(
            WebExchangeBindException ex,
            ServerWebExchange exchange) {

        List<ErrorResponse.FieldError> fieldErrors = ex.getBindingResult()
            .getFieldErrors()
            .stream()
            .map(error -> new ErrorResponse.FieldError(
                error.getField(),
                error.getDefaultMessage(),
                error.getRejectedValue()
            ))
            .collect(Collectors.toList());

        ErrorResponse errorResponse = new ErrorResponse(
            "Validation Failed",
            "One or more fields have validation errors",
            HttpStatus.BAD_REQUEST.value(),
            exchange.getRequest().getPath().value()
        );
        errorResponse.setFieldErrors(fieldErrors);

        return Mono.just(ResponseEntity
            .status(HttpStatus.BAD_REQUEST)
            .body(errorResponse));
    }

    /**
     * Handle illegal argument exceptions (400 Bad Request)
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public Mono<ResponseEntity<ErrorResponse>> handleIllegalArgument(
            IllegalArgumentException ex,
            ServerWebExchange exchange) {

        ErrorResponse errorResponse = new ErrorResponse(
            "Bad Request",
            ex.getMessage(),
            HttpStatus.BAD_REQUEST.value(),
            exchange.getRequest().getPath().value()
        );

        return Mono.just(ResponseEntity
            .status(HttpStatus.BAD_REQUEST)
            .body(errorResponse));
    }

    /**
     * Handle illegal state exceptions (409 Conflict)
     */
    @ExceptionHandler(IllegalStateException.class)
    public Mono<ResponseEntity<ErrorResponse>> handleIllegalState(
            IllegalStateException ex,
            ServerWebExchange exchange) {

        ErrorResponse errorResponse = new ErrorResponse(
            "Conflict",
            ex.getMessage(),
            HttpStatus.CONFLICT.value(),
            exchange.getRequest().getPath().value()
        );

        return Mono.just(ResponseEntity
            .status(HttpStatus.CONFLICT)
            .body(errorResponse));
    }

    /**
     * Handle resource not found (404 Not Found)
     */
    @ExceptionHandler(ResourceNotFoundException.class)
    public Mono<ResponseEntity<ErrorResponse>> handleResourceNotFound(
            ResourceNotFoundException ex,
            ServerWebExchange exchange) {

        ErrorResponse errorResponse = new ErrorResponse(
            "Not Found",
            ex.getMessage(),
            HttpStatus.NOT_FOUND.value(),
            exchange.getRequest().getPath().value()
        );

        return Mono.just(ResponseEntity
            .status(HttpStatus.NOT_FOUND)
            .body(errorResponse));
    }

    /**
     * Handle generic exceptions (500 Internal Server Error)
     */
    @ExceptionHandler(Exception.class)
    public Mono<ResponseEntity<ErrorResponse>> handleGenericException(
            Exception ex,
            ServerWebExchange exchange) {

        ErrorResponse errorResponse = new ErrorResponse(
            "Internal Server Error",
            "An unexpected error occurred",
            HttpStatus.INTERNAL_SERVER_ERROR.value(),
            exchange.getRequest().getPath().value()
        );

        // Log the full exception for debugging
        ex.printStackTrace();

        return Mono.just(ResponseEntity
            .status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(errorResponse));
    }
}
