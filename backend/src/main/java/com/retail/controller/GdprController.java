package com.retail.controller;

import com.retail.domain.gdpr.GdprDataDeletionService;
import com.retail.domain.gdpr.GdprDataDeletionService.DeletionEligibility;
import com.retail.domain.gdpr.GdprDataDeletionService.DeletionResult;
import com.retail.domain.gdpr.GdprDataExportService;
import com.retail.domain.gdpr.GdprDataExportService.UserDataExport;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.time.format.DateTimeFormatter;

/**
 * REST controller for GDPR-related operations.
 * Implements data portability and privacy rights endpoints.
 */
@RestController
@RequestMapping("/api/v1/gdpr")
@Tag(name = "GDPR", description = "GDPR compliance endpoints for data portability and privacy rights")
public class GdprController {

    private final GdprDataExportService gdprDataExportService;
    private final GdprDataDeletionService gdprDataDeletionService;

    public GdprController(
            GdprDataExportService gdprDataExportService,
            GdprDataDeletionService gdprDataDeletionService) {
        this.gdprDataExportService = gdprDataExportService;
        this.gdprDataDeletionService = gdprDataDeletionService;
    }

    @GetMapping("/export/{userId}")
    @Operation(
        summary = "Export user data",
        description = "Export all user data in a portable JSON format (GDPR Article 20 - Right to Data Portability)"
    )
    public Mono<ResponseEntity<UserDataExport>> exportUserData(
            @Parameter(description = "User ID") @PathVariable String userId
    ) {
        return gdprDataExportService.exportUserData(userId)
            .map(export -> ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .body(export));
    }

    @GetMapping("/export/{userId}/download")
    @Operation(
        summary = "Download user data as file",
        description = "Download all user data as a JSON file"
    )
    public Mono<ResponseEntity<String>> downloadUserData(
            @Parameter(description = "User ID") @PathVariable String userId
    ) {
        return gdprDataExportService.exportUserDataAsJson(userId)
            .map(json -> {
                String filename = String.format("user-data-export-%s-%s.json",
                    userId,
                    DateTimeFormatter.ISO_INSTANT.format(Instant.now()).replace(":", "-"));

                return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                    .body(json);
            });
    }

    @PostMapping("/export/request")
    @Operation(
        summary = "Request data export",
        description = "Submit a request for data export. An email with the export will be sent when ready."
    )
    public Mono<ResponseEntity<ExportRequestResponse>> requestDataExport(
            @RequestBody ExportRequest request
    ) {
        // In a production system, this would:
        // 1. Queue the export request
        // 2. Process it asynchronously
        // 3. Send an email notification when complete
        // For now, we just acknowledge the request

        ExportRequestResponse response = new ExportRequestResponse();
        response.setRequestId(java.util.UUID.randomUUID().toString());
        response.setUserId(request.getUserId());
        response.setStatus("PROCESSING");
        response.setEstimatedCompletionTime("Within 24 hours");
        response.setMessage("Your data export request has been received. You will receive an email when your data is ready for download.");

        return Mono.just(ResponseEntity.accepted().body(response));
    }

    @GetMapping("/export/status/{requestId}")
    @Operation(
        summary = "Check export request status",
        description = "Check the status of a previously submitted export request"
    )
    public Mono<ResponseEntity<ExportRequestResponse>> getExportRequestStatus(
            @Parameter(description = "Request ID") @PathVariable String requestId
    ) {
        // In production, this would check the actual status from a queue/database
        ExportRequestResponse response = new ExportRequestResponse();
        response.setRequestId(requestId);
        response.setStatus("COMPLETED");
        response.setMessage("Your data export is ready for download.");

        return Mono.just(ResponseEntity.ok(response));
    }

    @GetMapping("/info")
    @Operation(
        summary = "Get GDPR information",
        description = "Get information about GDPR rights and data processing"
    )
    public Mono<ResponseEntity<GdprInfoResponse>> getGdprInfo() {
        GdprInfoResponse info = new GdprInfoResponse();
        info.setDataController("Our Company Name");
        info.setDataProtectionOfficerEmail("privacy@example.com");
        info.setPrivacyPolicyUrl("/privacy-policy");
        info.setRights(new String[]{
            "Right to Access (Article 15)",
            "Right to Rectification (Article 16)",
            "Right to Erasure (Article 17)",
            "Right to Restrict Processing (Article 18)",
            "Right to Data Portability (Article 20)",
            "Right to Object (Article 21)",
            "Right to Withdraw Consent"
        });
        info.setDataCategories(new String[]{
            "Personal Information (name, email, phone)",
            "Order History",
            "Shopping Cart Data",
            "Product Reviews",
            "Wishlist",
            "Account Activity"
        });
        info.setRetentionPeriods(new RetentionPeriod[]{
            new RetentionPeriod("Account Data", "Until account deletion or 3 years of inactivity"),
            new RetentionPeriod("Order History", "7 years (legal/tax requirements)"),
            new RetentionPeriod("Marketing Preferences", "Until consent withdrawn"),
            new RetentionPeriod("Analytics Data", "26 months")
        });

        return Mono.just(ResponseEntity.ok(info));
    }

    // Deletion endpoints (Article 17 - Right to Erasure)

    @GetMapping("/deletion/eligibility/{userId}")
    @Operation(
        summary = "Check deletion eligibility",
        description = "Check if a user's data can be deleted (GDPR Article 17 - Right to Erasure)"
    )
    public Mono<ResponseEntity<DeletionEligibility>> checkDeletionEligibility(
            @Parameter(description = "User ID") @PathVariable String userId
    ) {
        return gdprDataDeletionService.checkDeletionEligibility(userId)
            .map(eligibility -> ResponseEntity.ok(eligibility));
    }

    @DeleteMapping("/delete/{userId}")
    @Operation(
        summary = "Delete user data",
        description = "Delete all user data that can be removed, anonymize data that must be retained (GDPR Article 17)"
    )
    public Mono<ResponseEntity<DeletionResult>> deleteUserData(
            @Parameter(description = "User ID") @PathVariable String userId
    ) {
        return gdprDataDeletionService.deleteUserData(userId)
            .map(result -> ResponseEntity.ok(result));
    }

    @PostMapping("/deletion/request")
    @Operation(
        summary = "Request data deletion",
        description = "Submit a request for data deletion. This will be processed after verification."
    )
    public Mono<ResponseEntity<DeletionRequestResponse>> requestDataDeletion(
            @RequestBody DeletionRequest request
    ) {
        // In production, this would:
        // 1. Queue the deletion request
        // 2. Send a verification email
        // 3. Process after user confirms
        DeletionRequestResponse response = new DeletionRequestResponse();
        response.setRequestId(java.util.UUID.randomUUID().toString());
        response.setUserId(request.getUserId());
        response.setStatus("PENDING_VERIFICATION");
        response.setMessage("Your deletion request has been received. Please check your email to verify this request. " +
            "Once verified, your data will be processed within 30 days as required by GDPR.");

        return Mono.just(ResponseEntity.accepted().body(response));
    }

    @GetMapping("/deletion/status/{requestId}")
    @Operation(
        summary = "Check deletion request status",
        description = "Check the status of a previously submitted deletion request"
    )
    public Mono<ResponseEntity<DeletionRequestResponse>> getDeletionRequestStatus(
            @Parameter(description = "Request ID") @PathVariable String requestId
    ) {
        // In production, this would check the actual status from a queue/database
        DeletionRequestResponse response = new DeletionRequestResponse();
        response.setRequestId(requestId);
        response.setStatus("PROCESSING");
        response.setMessage("Your deletion request is being processed.");

        return Mono.just(ResponseEntity.ok(response));
    }

    // DTOs

    public static class ExportRequest {
        private String userId;
        private String email;
        private String format; // JSON, CSV, etc.

        public String getUserId() { return userId; }
        public void setUserId(String userId) { this.userId = userId; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getFormat() { return format; }
        public void setFormat(String format) { this.format = format; }
    }

    public static class ExportRequestResponse {
        private String requestId;
        private String userId;
        private String status;
        private String estimatedCompletionTime;
        private String message;
        private String downloadUrl;

        public String getRequestId() { return requestId; }
        public void setRequestId(String requestId) { this.requestId = requestId; }
        public String getUserId() { return userId; }
        public void setUserId(String userId) { this.userId = userId; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        public String getEstimatedCompletionTime() { return estimatedCompletionTime; }
        public void setEstimatedCompletionTime(String estimatedCompletionTime) { this.estimatedCompletionTime = estimatedCompletionTime; }
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
        public String getDownloadUrl() { return downloadUrl; }
        public void setDownloadUrl(String downloadUrl) { this.downloadUrl = downloadUrl; }
    }

    public static class GdprInfoResponse {
        private String dataController;
        private String dataProtectionOfficerEmail;
        private String privacyPolicyUrl;
        private String[] rights;
        private String[] dataCategories;
        private RetentionPeriod[] retentionPeriods;

        public String getDataController() { return dataController; }
        public void setDataController(String dataController) { this.dataController = dataController; }
        public String getDataProtectionOfficerEmail() { return dataProtectionOfficerEmail; }
        public void setDataProtectionOfficerEmail(String dataProtectionOfficerEmail) { this.dataProtectionOfficerEmail = dataProtectionOfficerEmail; }
        public String getPrivacyPolicyUrl() { return privacyPolicyUrl; }
        public void setPrivacyPolicyUrl(String privacyPolicyUrl) { this.privacyPolicyUrl = privacyPolicyUrl; }
        public String[] getRights() { return rights; }
        public void setRights(String[] rights) { this.rights = rights; }
        public String[] getDataCategories() { return dataCategories; }
        public void setDataCategories(String[] dataCategories) { this.dataCategories = dataCategories; }
        public RetentionPeriod[] getRetentionPeriods() { return retentionPeriods; }
        public void setRetentionPeriods(RetentionPeriod[] retentionPeriods) { this.retentionPeriods = retentionPeriods; }
    }

    public static class RetentionPeriod {
        private String dataType;
        private String period;

        public RetentionPeriod() {}

        public RetentionPeriod(String dataType, String period) {
            this.dataType = dataType;
            this.period = period;
        }

        public String getDataType() { return dataType; }
        public void setDataType(String dataType) { this.dataType = dataType; }
        public String getPeriod() { return period; }
        public void setPeriod(String period) { this.period = period; }
    }

    public static class DeletionRequest {
        private String userId;
        private String email;
        private String reason;

        public String getUserId() { return userId; }
        public void setUserId(String userId) { this.userId = userId; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getReason() { return reason; }
        public void setReason(String reason) { this.reason = reason; }
    }

    public static class DeletionRequestResponse {
        private String requestId;
        private String userId;
        private String status;
        private String message;
        private String verificationUrl;

        public String getRequestId() { return requestId; }
        public void setRequestId(String requestId) { this.requestId = requestId; }
        public String getUserId() { return userId; }
        public void setUserId(String userId) { this.userId = userId; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
        public String getVerificationUrl() { return verificationUrl; }
        public void setVerificationUrl(String verificationUrl) { this.verificationUrl = verificationUrl; }
    }
}
