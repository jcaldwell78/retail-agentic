package com.retail.infrastructure.persistence;

import com.retail.domain.qa.ProductQuestion;
import com.retail.domain.qa.QuestionStatus;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * Repository for product questions with tenant isolation.
 */
@Repository
public interface ProductQuestionRepository extends TenantAwareRepository<ProductQuestion, String> {

    /**
     * Find all approved/answered questions for a product.
     */
    @Query("{ 'tenantId': ?0, 'productId': ?1, 'status': { $in: ['APPROVED', 'ANSWERED'] } }")
    Flux<ProductQuestion> findVisibleByProduct(String tenantId, String productId);

    /**
     * Find questions by user.
     */
    Flux<ProductQuestion> findByTenantIdAndUserId(String tenantId, String userId);

    /**
     * Find questions pending moderation.
     */
    Flux<ProductQuestion> findByTenantIdAndStatus(String tenantId, QuestionStatus status);

    /**
     * Count questions for a product.
     */
    Mono<Long> countByTenantIdAndProductIdAndStatusIn(String tenantId, String productId, QuestionStatus... statuses);

    /**
     * Search questions by text.
     */
    @Query("{ 'tenantId': ?0, 'productId': ?1, 'questionText': { $regex: ?2, $options: 'i' }, 'status': { $in: ['APPROVED', 'ANSWERED'] } }")
    Flux<ProductQuestion> searchByText(String tenantId, String productId, String searchText);
}
