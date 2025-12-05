package com.retail.domain.product;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration for product image storage.
 * Can be customized in application.yml for different environments.
 */
@Configuration
@ConfigurationProperties(prefix = "product.image.storage")
public class ProductImageStorageConfig {

    /**
     * Base URL for accessing images (CDN or storage service)
     * Example: https://cdn.example.com/images
     */
    private String baseUrl = "https://storage.retail-agentic.com/images";

    /**
     * Storage type: local, s3, azure, gcs
     */
    private StorageType type = StorageType.LOCAL;

    /**
     * Local storage path (if type is LOCAL)
     */
    private String localPath = "./uploads/products";

    /**
     * S3 bucket name (if type is S3)
     */
    private String s3Bucket;

    /**
     * S3 region (if type is S3)
     */
    private String s3Region;

    /**
     * Azure container name (if type is AZURE)
     */
    private String azureContainer;

    /**
     * GCS bucket name (if type is GCS)
     */
    private String gcsBucket;

    /**
     * Maximum file size in bytes (default: 5MB)
     */
    private long maxFileSizeBytes = 5 * 1024 * 1024;

    /**
     * Allowed content types
     */
    private String[] allowedContentTypes = {
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/webp",
            "image/gif"
    };

    // Getters and Setters
    public String getBaseUrl() {
        return baseUrl;
    }

    public void setBaseUrl(String baseUrl) {
        this.baseUrl = baseUrl;
    }

    public StorageType getType() {
        return type;
    }

    public void setType(StorageType type) {
        this.type = type;
    }

    public String getLocalPath() {
        return localPath;
    }

    public void setLocalPath(String localPath) {
        this.localPath = localPath;
    }

    public String getS3Bucket() {
        return s3Bucket;
    }

    public void setS3Bucket(String s3Bucket) {
        this.s3Bucket = s3Bucket;
    }

    public String getS3Region() {
        return s3Region;
    }

    public void setS3Region(String s3Region) {
        this.s3Region = s3Region;
    }

    public String getAzureContainer() {
        return azureContainer;
    }

    public void setAzureContainer(String azureContainer) {
        this.azureContainer = azureContainer;
    }

    public String getGcsBucket() {
        return gcsBucket;
    }

    public void setGcsBucket(String gcsBucket) {
        this.gcsBucket = gcsBucket;
    }

    public long getMaxFileSizeBytes() {
        return maxFileSizeBytes;
    }

    public void setMaxFileSizeBytes(long maxFileSizeBytes) {
        this.maxFileSizeBytes = maxFileSizeBytes;
    }

    public String[] getAllowedContentTypes() {
        return allowedContentTypes;
    }

    public void setAllowedContentTypes(String[] allowedContentTypes) {
        this.allowedContentTypes = allowedContentTypes;
    }

    /**
     * Storage type options
     */
    public enum StorageType {
        LOCAL,  // Local filesystem
        S3,     // Amazon S3
        AZURE,  // Azure Blob Storage
        GCS     // Google Cloud Storage
    }
}
