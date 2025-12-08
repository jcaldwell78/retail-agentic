package com.retail.controller;

import com.retail.domain.qa.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * REST controller for Product Q&A operations.
 */
@RestController
@RequestMapping("/api/v1/qa")
@Tag(name = "Product Q&A", description = "Product questions and answers API")
public class ProductQAController {

    private final ProductQAService qaService;

    public ProductQAController(ProductQAService qaService) {
        this.qaService = qaService;
    }

    // ==================== Question Endpoints ====================

    @PostMapping("/products/{productId}/questions")
    @Operation(summary = "Submit a question for a product")
    public Mono<ResponseEntity<ProductQuestion>> submitQuestion(
            @PathVariable String productId,
            @RequestParam String userId,
            @RequestBody ProductQuestion question) {

        if (question.getQuestionText() == null || question.getQuestionText().trim().isEmpty()) {
            return Mono.just(ResponseEntity.badRequest().build());
        }

        return qaService.submitQuestion(userId, productId, question)
                .map(saved -> ResponseEntity.status(HttpStatus.CREATED).body(saved))
                .onErrorResume(e -> Mono.just(ResponseEntity.badRequest().build()));
    }

    @GetMapping("/products/{productId}/questions")
    @Operation(summary = "Get all questions for a product")
    public Flux<ProductQuestion> getProductQuestions(@PathVariable String productId) {
        return qaService.getProductQuestions(productId);
    }

    @GetMapping("/products/{productId}/questions/search")
    @Operation(summary = "Search questions by text")
    public Flux<ProductQuestion> searchQuestions(
            @PathVariable String productId,
            @RequestParam String query) {
        return qaService.searchQuestions(productId, query);
    }

    @GetMapping("/products/{productId}/statistics")
    @Operation(summary = "Get Q&A statistics for a product")
    public Mono<QAStatistics> getProductQAStatistics(@PathVariable String productId) {
        return qaService.getProductQAStatistics(productId);
    }

    @GetMapping("/users/{userId}/questions")
    @Operation(summary = "Get questions asked by a user")
    public Flux<ProductQuestion> getUserQuestions(@PathVariable String userId) {
        return qaService.getUserQuestions(userId);
    }

    @PostMapping("/questions/{questionId}/upvote")
    @Operation(summary = "Upvote a question")
    public Mono<ProductQuestion> upvoteQuestion(
            @PathVariable String questionId,
            @RequestParam String userId) {
        return qaService.upvoteQuestion(questionId, userId);
    }

    @DeleteMapping("/questions/{questionId}/upvote")
    @Operation(summary = "Remove upvote from a question")
    public Mono<ProductQuestion> removeUpvote(
            @PathVariable String questionId,
            @RequestParam String userId) {
        return qaService.removeUpvote(questionId, userId);
    }

    @DeleteMapping("/questions/{questionId}")
    @Operation(summary = "Delete a question")
    public Mono<ResponseEntity<Void>> deleteQuestion(
            @PathVariable String questionId,
            @RequestParam String userId,
            @RequestParam(defaultValue = "false") boolean isAdmin) {

        return qaService.deleteQuestion(questionId, userId, isAdmin)
                .then(Mono.just(ResponseEntity.noContent().<Void>build()))
                .onErrorResume(IllegalStateException.class,
                        e -> Mono.just(ResponseEntity.status(HttpStatus.FORBIDDEN).build()));
    }

    // ==================== Answer Endpoints ====================

    @PostMapping("/questions/{questionId}/answers")
    @Operation(summary = "Submit an answer to a question")
    public Mono<ResponseEntity<ProductAnswer>> submitAnswer(
            @PathVariable String questionId,
            @RequestParam String userId,
            @RequestParam(defaultValue = "false") boolean isSeller,
            @RequestBody ProductAnswer answer) {

        if (answer.getAnswerText() == null || answer.getAnswerText().trim().isEmpty()) {
            return Mono.just(ResponseEntity.badRequest().build());
        }

        return qaService.submitAnswer(userId, questionId, answer, isSeller)
                .map(saved -> ResponseEntity.status(HttpStatus.CREATED).body(saved))
                .onErrorResume(IllegalStateException.class,
                        e -> Mono.just(ResponseEntity.badRequest().build()));
    }

    @GetMapping("/questions/{questionId}/answers")
    @Operation(summary = "Get all answers for a question")
    public Flux<ProductAnswer> getQuestionAnswers(@PathVariable String questionId) {
        return qaService.getQuestionAnswers(questionId);
    }

    @PostMapping("/answers/{answerId}/helpful")
    @Operation(summary = "Mark an answer as helpful")
    public Mono<ProductAnswer> markAnswerHelpful(
            @PathVariable String answerId,
            @RequestParam String userId) {
        return qaService.markAnswerHelpful(answerId, userId);
    }

    @PostMapping("/answers/{answerId}/not-helpful")
    @Operation(summary = "Mark an answer as not helpful")
    public Mono<ProductAnswer> markAnswerNotHelpful(@PathVariable String answerId) {
        return qaService.markAnswerNotHelpful(answerId);
    }

    @DeleteMapping("/answers/{answerId}")
    @Operation(summary = "Delete an answer")
    public Mono<ResponseEntity<Void>> deleteAnswer(
            @PathVariable String answerId,
            @RequestParam String userId,
            @RequestParam(defaultValue = "false") boolean isAdmin) {

        return qaService.deleteAnswer(answerId, userId, isAdmin)
                .then(Mono.just(ResponseEntity.noContent().<Void>build()))
                .onErrorResume(IllegalStateException.class,
                        e -> Mono.just(ResponseEntity.status(HttpStatus.FORBIDDEN).build()));
    }

    // ==================== Admin Endpoints ====================

    @GetMapping("/admin/pending")
    @Operation(summary = "Get pending questions for moderation (admin only)")
    public Flux<ProductQuestion> getPendingQuestions() {
        return qaService.getPendingQuestions();
    }

    @PostMapping("/admin/questions/{questionId}/approve")
    @Operation(summary = "Approve a question (admin only)")
    public Mono<ProductQuestion> approveQuestion(@PathVariable String questionId) {
        return qaService.approveQuestion(questionId);
    }

    @PostMapping("/admin/questions/{questionId}/reject")
    @Operation(summary = "Reject a question (admin only)")
    public Mono<ProductQuestion> rejectQuestion(@PathVariable String questionId) {
        return qaService.rejectQuestion(questionId);
    }

    @PostMapping("/admin/answers/{answerId}/verify")
    @Operation(summary = "Verify an answer (admin only)")
    public Mono<ProductAnswer> verifyAnswer(@PathVariable String answerId) {
        return qaService.verifyAnswer(answerId);
    }
}
