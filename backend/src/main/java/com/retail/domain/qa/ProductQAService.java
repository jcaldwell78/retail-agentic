package com.retail.domain.qa;

import com.retail.domain.user.User;
import com.retail.domain.user.UserService;
import com.retail.infrastructure.persistence.ProductAnswerRepository;
import com.retail.infrastructure.persistence.ProductQuestionRepository;
import com.retail.security.tenant.TenantContext;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Comparator;

/**
 * Service for managing product questions and answers.
 */
@Service
public class ProductQAService {

    private final ProductQuestionRepository questionRepository;
    private final ProductAnswerRepository answerRepository;
    private final UserService userService;

    public ProductQAService(
            ProductQuestionRepository questionRepository,
            ProductAnswerRepository answerRepository,
            UserService userService) {
        this.questionRepository = questionRepository;
        this.answerRepository = answerRepository;
        this.userService = userService;
    }

    // ==================== Question Operations ====================

    /**
     * Submit a new question for a product.
     */
    public Mono<ProductQuestion> submitQuestion(String userId, String productId, ProductQuestion question) {
        return TenantContext.getTenantId()
                .flatMap(tenantId -> userService.findById(userId)
                        .flatMap(user -> {
                            question.setTenantId(tenantId);
                            question.setProductId(productId);
                            question.setUserId(userId);
                            question.setUserName(formatUserName(user));
                            question.setStatus(QuestionStatus.PENDING);
                            return questionRepository.save(question);
                        }));
    }

    /**
     * Get all visible questions for a product (approved or answered).
     */
    public Flux<ProductQuestion> getProductQuestions(String productId) {
        return TenantContext.getTenantId()
                .flatMapMany(tenantId -> questionRepository.findVisibleByProduct(tenantId, productId))
                .sort(Comparator.comparing(ProductQuestion::getUpvoteCount).reversed()
                        .thenComparing(Comparator.comparing(ProductQuestion::getCreatedAt).reversed()));
    }

    /**
     * Get questions by user.
     */
    public Flux<ProductQuestion> getUserQuestions(String userId) {
        return TenantContext.getTenantId()
                .flatMapMany(tenantId -> questionRepository.findByTenantIdAndUserId(tenantId, userId));
    }

    /**
     * Get pending questions for moderation.
     */
    public Flux<ProductQuestion> getPendingQuestions() {
        return TenantContext.getTenantId()
                .flatMapMany(tenantId -> questionRepository.findByTenantIdAndStatus(tenantId, QuestionStatus.PENDING));
    }

    /**
     * Search questions by text.
     */
    public Flux<ProductQuestion> searchQuestions(String productId, String searchText) {
        return TenantContext.getTenantId()
                .flatMapMany(tenantId -> questionRepository.searchByText(tenantId, productId, searchText));
    }

    /**
     * Upvote a question.
     */
    public Mono<ProductQuestion> upvoteQuestion(String questionId, String userId) {
        return questionRepository.findById(questionId)
                .flatMap(question -> {
                    if (question.upvote(userId)) {
                        return questionRepository.save(question);
                    }
                    return Mono.just(question); // Already upvoted
                });
    }

    /**
     * Remove upvote from a question.
     */
    public Mono<ProductQuestion> removeUpvote(String questionId, String userId) {
        return questionRepository.findById(questionId)
                .flatMap(question -> {
                    if (question.removeUpvote(userId)) {
                        return questionRepository.save(question);
                    }
                    return Mono.just(question);
                });
    }

    /**
     * Approve a question (admin only).
     */
    public Mono<ProductQuestion> approveQuestion(String questionId) {
        return questionRepository.findById(questionId)
                .flatMap(question -> {
                    question.approve();
                    return questionRepository.save(question);
                });
    }

    /**
     * Reject a question (admin only).
     */
    public Mono<ProductQuestion> rejectQuestion(String questionId) {
        return questionRepository.findById(questionId)
                .flatMap(question -> {
                    question.reject();
                    return questionRepository.save(question);
                });
    }

    /**
     * Delete a question and all its answers.
     */
    public Mono<Void> deleteQuestion(String questionId, String userId, boolean isAdmin) {
        return TenantContext.getTenantId()
                .flatMap(tenantId -> questionRepository.findById(questionId)
                        .flatMap(question -> {
                            if (!isAdmin && !question.getUserId().equals(userId)) {
                                return Mono.error(new IllegalStateException("You can only delete your own questions"));
                            }
                            // Delete all answers first, then the question
                            return answerRepository.deleteByTenantIdAndQuestionId(tenantId, questionId)
                                    .then(questionRepository.deleteById(questionId));
                        }));
    }

    // ==================== Answer Operations ====================

    /**
     * Submit an answer to a question.
     */
    public Mono<ProductAnswer> submitAnswer(String userId, String questionId, ProductAnswer answer, boolean isSeller) {
        return TenantContext.getTenantId()
                .flatMap(tenantId -> questionRepository.findById(questionId)
                        .flatMap(question -> {
                            if (!question.isApproved()) {
                                return Mono.error(new IllegalStateException("Cannot answer a question that is not approved"));
                            }
                            return userService.findById(userId)
                                    .flatMap(user -> {
                                        answer.setTenantId(tenantId);
                                        answer.setQuestionId(questionId);
                                        answer.setProductId(question.getProductId());
                                        answer.setUserId(userId);
                                        answer.setUserName(formatUserName(user));
                                        answer.setIsSellerAnswer(isSeller);

                                        return answerRepository.save(answer)
                                                .flatMap(savedAnswer -> {
                                                    question.incrementAnswerCount();
                                                    return questionRepository.save(question)
                                                            .thenReturn(savedAnswer);
                                                });
                                    });
                        }));
    }

    /**
     * Get all answers for a question.
     */
    public Flux<ProductAnswer> getQuestionAnswers(String questionId) {
        return TenantContext.getTenantId()
                .flatMapMany(tenantId -> answerRepository.findByTenantIdAndQuestionId(tenantId, questionId))
                .sort(Comparator.comparing(ProductAnswer::getHelpfulnessScore).reversed()
                        .thenComparing(Comparator.comparing(ProductAnswer::getCreatedAt)));
    }

    /**
     * Mark an answer as helpful.
     */
    public Mono<ProductAnswer> markAnswerHelpful(String answerId, String voterId) {
        return answerRepository.findById(answerId)
                .flatMap(answer -> {
                    if (answer.markHelpful(voterId)) {
                        return answerRepository.save(answer);
                    }
                    return Mono.just(answer); // Already voted
                });
    }

    /**
     * Mark an answer as not helpful.
     */
    public Mono<ProductAnswer> markAnswerNotHelpful(String answerId) {
        return answerRepository.findById(answerId)
                .flatMap(answer -> {
                    answer.incrementNotHelpful();
                    return answerRepository.save(answer);
                });
    }

    /**
     * Verify an answer (admin only).
     */
    public Mono<ProductAnswer> verifyAnswer(String answerId) {
        return answerRepository.findById(answerId)
                .flatMap(answer -> {
                    answer.verify();
                    return answerRepository.save(answer);
                });
    }

    /**
     * Delete an answer.
     */
    public Mono<Void> deleteAnswer(String answerId, String userId, boolean isAdmin) {
        return answerRepository.findById(answerId)
                .flatMap(answer -> {
                    if (!isAdmin && !answer.getUserId().equals(userId)) {
                        return Mono.error(new IllegalStateException("You can only delete your own answers"));
                    }
                    return questionRepository.findById(answer.getQuestionId())
                            .flatMap(question -> {
                                question.decrementAnswerCount();
                                return questionRepository.save(question);
                            })
                            .then(answerRepository.deleteById(answerId));
                });
    }

    /**
     * Get Q&A statistics for a product.
     */
    public Mono<QAStatistics> getProductQAStatistics(String productId) {
        return TenantContext.getTenantId()
                .flatMap(tenantId -> {
                    Mono<Long> questionCount = questionRepository.countByTenantIdAndProductIdAndStatusIn(
                            tenantId, productId, QuestionStatus.APPROVED, QuestionStatus.ANSWERED);
                    Mono<Long> answeredCount = questionRepository.countByTenantIdAndProductIdAndStatusIn(
                            tenantId, productId, QuestionStatus.ANSWERED);

                    return Mono.zip(questionCount, answeredCount)
                            .map(tuple -> new QAStatistics(
                                    tuple.getT1().intValue(),
                                    tuple.getT2().intValue()
                            ));
                });
    }

    private String formatUserName(User user) {
        if (user.getLastName() != null && !user.getLastName().isEmpty()) {
            return user.getFirstName() + " " + user.getLastName().charAt(0) + ".";
        }
        return user.getFirstName();
    }
}
