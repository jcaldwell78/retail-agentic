package com.retail.controller;

import com.retail.domain.payment.gateway.PayPalWebhookHandler;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.Map;

/**
 * Controller for handling payment gateway webhooks.
 */
@RestController
@RequestMapping("/api/v1/webhooks/payment")
public class PaymentWebhookController {

    private final PayPalWebhookHandler payPalWebhookHandler;

    public PaymentWebhookController(PayPalWebhookHandler payPalWebhookHandler) {
        this.payPalWebhookHandler = payPalWebhookHandler;
    }

    /**
     * Handle PayPal webhook events.
     *
     * @param payload Event payload from PayPal
     * @param headers HTTP headers including signature
     * @return Response indicating webhook processing status
     */
    @PostMapping("/paypal")
    public Mono<ResponseEntity<Map<String, String>>> handlePayPalWebhook(
        @RequestBody Map<String, Object> payload,
        @RequestHeader HttpHeaders headers
    ) {
        String eventType = extractEventType(payload);

        // Convert headers to Map
        Map<String, String> headerMap = new HashMap<>();
        headers.forEach((key, value) ->
            headerMap.put(key, value.isEmpty() ? null : value.get(0))
        );

        return payPalWebhookHandler.processWebhook(eventType, payload, headerMap)
            .map(result -> {
                Map<String, String> response = new HashMap<>();
                response.put("status", result.isSuccess() ? "success" : "error");
                response.put("message", result.getMessage());

                if (!result.isSuccess()) {
                    response.put("errorCode", result.getErrorCode());
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
                }

                return ResponseEntity.ok(response);
            })
            .onErrorResume(error -> {
                Map<String, String> response = new HashMap<>();
                response.put("status", "error");
                response.put("message", "Webhook processing failed: " + error.getMessage());
                return Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response));
            });
    }

    private String extractEventType(Map<String, Object> payload) {
        Object eventType = payload.get("event_type");
        return eventType != null ? eventType.toString() : "UNKNOWN";
    }
}
