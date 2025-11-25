package com.retail.domain.product;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Service for managing product images.
 * Handles image upload, storage, optimization, and URL generation.
 */
@Service
public class ProductImageService {

    private static final Logger logger = LoggerFactory.getLogger(ProductImageService.class);
    private static final int MAX_IMAGES_PER_PRODUCT = 10;
    private static final long MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

    private final ProductImageStorageConfig storageConfig;

    public ProductImageService(ProductImageStorageConfig storageConfig) {
        this.storageConfig = storageConfig;
    }

    /**
     * Upload and add image to product.
     * Generates unique filename and returns image URL.
     *
     * @param productId Product ID
     * @param imageData Image binary data
     * @param contentType Image content type (e.g., image/jpeg)
     * @param altText Alternative text for accessibility
     * @param displayOrder Display order (0-based)
     * @return Mono<ProductImage> with generated URL
     */
    public Mono<Product.ProductImage> uploadImage(
            String productId,
            byte[] imageData,
            String contentType,
            String altText,
            Integer displayOrder) {

        return Mono.fromCallable(() -> {
            // Validate image size
            if (imageData.length > MAX_IMAGE_SIZE_BYTES) {
                throw new IllegalArgumentException(
                        String.format("Image size %d bytes exceeds maximum %d bytes",
                                imageData.length, MAX_IMAGE_SIZE_BYTES)
                );
            }

            // Validate content type
            if (!isValidImageContentType(contentType)) {
                throw new IllegalArgumentException("Invalid image content type: " + contentType);
            }

            // Generate unique filename
            String filename = generateImageFilename(productId, contentType);

            // In a real implementation, this would upload to cloud storage (S3, Azure Blob, etc.)
            // For now, we'll generate a URL based on the configured base URL
            String imageUrl = storageConfig.getBaseUrl() + "/" + filename;

            logger.info("Image uploaded for product {}: {}", productId, imageUrl);

            return new Product.ProductImage(imageUrl, altText, displayOrder);
        });
    }

    /**
     * Delete image from product.
     * Removes image from storage and returns success indicator.
     *
     * @param imageUrl URL of image to delete
     * @return Mono<Boolean> true if deleted successfully
     */
    public Mono<Boolean> deleteImage(String imageUrl) {
        return Mono.fromCallable(() -> {
            // In a real implementation, this would delete from cloud storage
            logger.info("Image deleted: {}", imageUrl);
            return true;
        });
    }

    /**
     * Validate product images list.
     * Checks for duplicates, max count, and proper ordering.
     *
     * @param images List of product images
     * @return Mono<Boolean> true if valid
     */
    public Mono<Boolean> validateImages(List<Product.ProductImage> images) {
        return Mono.fromCallable(() -> {
            if (images == null) {
                return true;
            }

            // Check max count
            if (images.size() > MAX_IMAGES_PER_PRODUCT) {
                throw new IllegalArgumentException(
                        String.format("Product can have maximum %d images, got %d",
                                MAX_IMAGES_PER_PRODUCT, images.size())
                );
            }

            // Check for duplicate URLs
            long uniqueUrls = images.stream()
                    .map(Product.ProductImage::url)
                    .distinct()
                    .count();

            if (uniqueUrls != images.size()) {
                throw new IllegalArgumentException("Duplicate image URLs found");
            }

            // Validate display order sequence (should be 0, 1, 2, ...)
            List<Integer> orders = images.stream()
                    .map(Product.ProductImage::order)
                    .sorted()
                    .toList();

            for (int i = 0; i < orders.size(); i++) {
                if (orders.get(i) == null || orders.get(i) != i) {
                    throw new IllegalArgumentException(
                            String.format("Invalid display order sequence. Expected %d, got %s", i, orders.get(i))
                    );
                }
            }

            return true;
        });
    }

    /**
     * Reorder product images.
     * Updates display order for all images.
     *
     * @param images Current images list
     * @param oldIndex Current index
     * @param newIndex New index
     * @return Mono<List<ProductImage>> Updated images list
     */
    public Mono<List<Product.ProductImage>> reorderImages(
            List<Product.ProductImage> images,
            int oldIndex,
            int newIndex) {

        return Mono.fromCallable(() -> {
            if (images == null || images.isEmpty()) {
                return images;
            }

            if (oldIndex < 0 || oldIndex >= images.size() || newIndex < 0 || newIndex >= images.size()) {
                throw new IllegalArgumentException("Invalid reorder indices");
            }

            List<Product.ProductImage> reordered = new ArrayList<>(images);
            Product.ProductImage moved = reordered.remove(oldIndex);
            reordered.add(newIndex, moved);

            // Update display orders
            List<Product.ProductImage> result = new ArrayList<>();
            for (int i = 0; i < reordered.size(); i++) {
                Product.ProductImage img = reordered.get(i);
                result.add(new Product.ProductImage(img.url(), img.alt(), i));
            }

            return result;
        });
    }

    /**
     * Generate optimized image URL for different sizes.
     * Useful for responsive images (thumbnail, medium, large).
     *
     * @param originalUrl Original image URL
     * @param size Desired size (thumbnail, medium, large)
     * @return Mono<String> Optimized image URL
     */
    public Mono<String> getOptimizedImageUrl(String originalUrl, ImageSize size) {
        return Mono.fromCallable(() -> {
            // In a real implementation, this would generate URLs for CDN-optimized images
            // For now, append size suffix
            String suffix = switch (size) {
                case THUMBNAIL -> "_thumb";
                case MEDIUM -> "_md";
                case LARGE -> "_lg";
                case ORIGINAL -> "";
            };

            if (suffix.isEmpty()) {
                return originalUrl;
            }

            // Insert suffix before file extension
            int lastDot = originalUrl.lastIndexOf('.');
            if (lastDot > 0) {
                return originalUrl.substring(0, lastDot) + suffix + originalUrl.substring(lastDot);
            }

            return originalUrl + suffix;
        });
    }

    /**
     * Check if content type is a valid image format.
     */
    private boolean isValidImageContentType(String contentType) {
        return contentType != null && (
                contentType.equals("image/jpeg") ||
                contentType.equals("image/jpg") ||
                contentType.equals("image/png") ||
                contentType.equals("image/webp") ||
                contentType.equals("image/gif")
        );
    }

    /**
     * Generate unique filename for image.
     */
    private String generateImageFilename(String productId, String contentType) {
        String extension = switch (contentType) {
            case "image/jpeg", "image/jpg" -> ".jpg";
            case "image/png" -> ".png";
            case "image/webp" -> ".webp";
            case "image/gif" -> ".gif";
            default -> ".jpg";
        };

        return String.format("products/%s/%s%s",
                productId,
                UUID.randomUUID().toString(),
                extension
        );
    }

    /**
     * Image size options for optimization
     */
    public enum ImageSize {
        THUMBNAIL,  // 150x150
        MEDIUM,     // 600x600
        LARGE,      // 1200x1200
        ORIGINAL    // Original size
    }
}
