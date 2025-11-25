package com.retail.infrastructure.migration;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/**
 * Migration history record.
 * Tracks which migrations have been executed.
 */
@Document(collection = "migration_history")
public class MigrationHistory {

    @Id
    private String id;

    @Indexed(unique = true)
    private Integer version;

    private String description;

    private Instant executedAt;

    private Long executionTimeMs;

    private boolean success;

    private String errorMessage;

    // Constructors
    public MigrationHistory() {
    }

    public MigrationHistory(Integer version, String description) {
        this.version = version;
        this.description = description;
        this.executedAt = Instant.now();
    }

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public Integer getVersion() {
        return version;
    }

    public void setVersion(Integer version) {
        this.version = version;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Instant getExecutedAt() {
        return executedAt;
    }

    public void setExecutedAt(Instant executedAt) {
        this.executedAt = executedAt;
    }

    public Long getExecutionTimeMs() {
        return executionTimeMs;
    }

    public void setExecutionTimeMs(Long executionTimeMs) {
        this.executionTimeMs = executionTimeMs;
    }

    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public String getErrorMessage() {
        return errorMessage;
    }

    public void setErrorMessage(String errorMessage) {
        this.errorMessage = errorMessage;
    }

    public void markSuccess(long executionTimeMs) {
        this.success = true;
        this.executionTimeMs = executionTimeMs;
    }

    public void markFailure(String errorMessage, long executionTimeMs) {
        this.success = false;
        this.errorMessage = errorMessage;
        this.executionTimeMs = executionTimeMs;
    }
}
