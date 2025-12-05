package com.retail.controller;

import com.retail.domain.product.Product;
import com.retail.domain.product.ProductService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Flux;

/**
 * REST controller for product search operations.
 * Provides search functionality across product catalog.
 */
@RestController
@RequestMapping("/api/v1/search")
@Tag(name = "Search", description = "Product search endpoints")
public class SearchController {

    private final ProductService productService;

    public SearchController(ProductService productService) {
        this.productService = productService;
    }

    @GetMapping
    @Operation(summary = "Search products", description = "Search products by query")
    public Flux<Product> search(
        @Parameter(description = "Search query") @RequestParam(required = false) String q,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        // For now, return all products - actual search implementation would use Elasticsearch
        return productService.findAll(pageable);
    }
}
