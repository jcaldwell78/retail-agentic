package com.retail.controller;

import com.retail.domain.product.Product;
import com.retail.domain.product.ProductService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * REST controller for Product operations.
 * All endpoints automatically filter by current tenant.
 */
@RestController
@RequestMapping("/api/v1/products")
@Tag(name = "Products", description = "Product catalog management")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @Operation(
        summary = "List products",
        description = "Get paginated list of products for current tenant",
        responses = {
            @ApiResponse(responseCode = "200", description = "Success"),
            @ApiResponse(responseCode = "404", description = "Tenant not found")
        }
    )
    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public Flux<Product> listProducts(
        @Parameter(description = "Page number (0-indexed)")
        @RequestParam(defaultValue = "0") int page,

        @Parameter(description = "Page size")
        @RequestParam(defaultValue = "20") int size,

        @Parameter(description = "Sort field")
        @RequestParam(defaultValue = "createdAt") String sortBy,

        @Parameter(description = "Sort direction (asc/desc)")
        @RequestParam(defaultValue = "desc") String sortDir,

        @Parameter(description = "Filter by status")
        @RequestParam(required = false) String status,

        @Parameter(description = "Filter by category")
        @RequestParam(required = false) String category
    ) {
        Sort.Direction direction = "asc".equalsIgnoreCase(sortDir) ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));

        if ("active".equalsIgnoreCase(status)) {
            return productService.findActiveProducts(pageable);
        } else if (category != null && !category.isBlank()) {
            return productService.findByCategory(category, pageable);
        } else {
            return productService.findAll(pageable);
        }
    }

    @Operation(
        summary = "Get product by ID",
        description = "Retrieve a single product by ID for current tenant",
        responses = {
            @ApiResponse(responseCode = "200", description = "Success"),
            @ApiResponse(responseCode = "404", description = "Product not found")
        }
    )
    @GetMapping(value = "/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
    public Mono<Product> getProduct(
        @Parameter(description = "Product ID")
        @PathVariable String id
    ) {
        return productService.findById(id)
            .switchIfEmpty(Mono.error(new ProductNotFoundException("Product not found: " + id)));
    }

    @Operation(
        summary = "Create product",
        description = "Create a new product for current tenant",
        responses = {
            @ApiResponse(responseCode = "201", description = "Product created"),
            @ApiResponse(responseCode = "400", description = "Invalid product data")
        }
    )
    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<Product> createProduct(
        @Valid @RequestBody Product product
    ) {
        return productService.create(product);
    }

    @Operation(
        summary = "Update product",
        description = "Update an existing product for current tenant",
        responses = {
            @ApiResponse(responseCode = "200", description = "Product updated"),
            @ApiResponse(responseCode = "404", description = "Product not found"),
            @ApiResponse(responseCode = "400", description = "Invalid product data")
        }
    )
    @PutMapping(value = "/{id}", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public Mono<Product> updateProduct(
        @Parameter(description = "Product ID")
        @PathVariable String id,

        @Valid @RequestBody Product product
    ) {
        return productService.update(id, product)
            .switchIfEmpty(Mono.error(new ProductNotFoundException("Product not found: " + id)));
    }

    @Operation(
        summary = "Delete product",
        description = "Delete a product for current tenant",
        responses = {
            @ApiResponse(responseCode = "204", description = "Product deleted"),
            @ApiResponse(responseCode = "404", description = "Product not found")
        }
    )
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public Mono<Void> deleteProduct(
        @Parameter(description = "Product ID")
        @PathVariable String id
    ) {
        return productService.delete(id);
    }

    @Operation(
        summary = "Get low stock products",
        description = "Get products with stock below threshold for current tenant"
    )
    @GetMapping("/low-stock")
    public Flux<Product> getLowStockProducts(
        @Parameter(description = "Stock threshold")
        @RequestParam(defaultValue = "10") int threshold
    ) {
        return productService.findLowStockProducts(threshold);
    }

    /**
     * Exception for product not found
     */
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public static class ProductNotFoundException extends RuntimeException {
        public ProductNotFoundException(String message) {
            super(message);
        }
    }
}
