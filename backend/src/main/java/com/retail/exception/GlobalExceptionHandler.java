package com.retail.exception;

import com.fasterxml.jackson.core.JsonProcessingException;
import org.springframework.core.codec.DecodingException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.bind.support.WebExchangeBindException;
import org.springframework.web.reactive.resource.NoResourceFoundException;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.ServerWebInputException;
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
     * Handle missing endpoints and routes (404 Not Found)
     * Catches NoResourceFoundException from Spring WebFlux when no handler is found
     */
    @ExceptionHandler(NoResourceFoundException.class)
    public Mono<ResponseEntity<ErrorResponse>> handleNoResourceFound(
            NoResourceFoundException ex,
            ServerWebExchange exchange) {

        ErrorResponse errorResponse = new ErrorResponse(
            "Not Found",
            "The requested endpoint does not exist",
            HttpStatus.NOT_FOUND.value(),
            exchange.getRequest().getPath().value()
        );

        return Mono.just(ResponseEntity
            .status(HttpStatus.NOT_FOUND)
            .body(errorResponse));
    }

    /**
     * Handle product not found (404 Not Found)
     * Catches ProductNotFoundException from ProductController
     */
    @ExceptionHandler(RuntimeException.class)
    public Mono<ResponseEntity<ErrorResponse>> handleRuntimeException(
            RuntimeException ex,
            ServerWebExchange exchange) {

        // Check if it's a ProductNotFoundException or other not-found exceptions
        if (ex.getClass().getSimpleName().contains("NotFoundException")) {
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

        // For other RuntimeExceptions, let them fall through to generic handler
        return handleGenericException(ex, exchange);
    }

    /**
     * Handle JSON parsing errors and malformed requests (400 Bad Request)
     * This catches NoSQL injection attempts with special characters in JSON
     */
    @ExceptionHandler({DecodingException.class, ServerWebInputException.class})
    public Mono<ResponseEntity<ErrorResponse>> handleDecodingErrors(
            Exception ex,
            ServerWebExchange exchange) {

        String message = "Invalid request format";

        // Extract more specific error if available
        Throwable cause = ex.getCause();
        if (cause instanceof JsonProcessingException) {
            message = "Invalid JSON format in request body";
        }

        ErrorResponse errorResponse = new ErrorResponse(
            "Bad Request",
            message,
            HttpStatus.BAD_REQUEST.value(),
            exchange.getRequest().getPath().value()
        );

        return Mono.just(ResponseEntity
            .status(HttpStatus.BAD_REQUEST)
            .body(errorResponse));
    }

    /**
     * Handle JSON processing errors (400 Bad Request)
     */
    @ExceptionHandler(JsonProcessingException.class)
    public Mono<ResponseEntity<ErrorResponse>> handleJsonProcessingException(
            JsonProcessingException ex,
            ServerWebExchange exchange) {

        ErrorResponse errorResponse = new ErrorResponse(
            "Bad Request",
            "Invalid JSON format in request body",
            HttpStatus.BAD_REQUEST.value(),
            exchange.getRequest().getPath().value()
        );

        return Mono.just(ResponseEntity
            .status(HttpStatus.BAD_REQUEST)
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
