package com.retail.infrastructure.persistence;

import com.retail.domain.qa.ProductAnswer;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * Repository for product answers with tenant isolation.
 */
@Repository
public interface ProductAnswerRepository extends TenantAwareRepository<ProductAnswer, String> {

    /**
     * Find all answers for a question.
     */
    Flux<ProductAnswer> findByTenantIdAndQuestionId(String tenantId, String questionId);

    /**
     * Find answers by user.
     */
    Flux<ProductAnswer> findByTenantIdAndUserId(String tenantId, String userId);

    /**
     * Find seller answers for a product.
     */
    @Query("{ 'tenantId': ?0, 'productId': ?1, 'isSellerAnswer': true }")
    Flux<ProductAnswer> findSellerAnswersByProduct(String tenantId, String productId);

    /**
     * Count answers for a question.
     */
    Mono<Long> countByTenantIdAndQuestionId(String tenantId, String questionId);

    /**
     * Delete all answers for a question.
     */
    Mono<Void> deleteByTenantIdAndQuestionId(String tenantId, String questionId);
}
