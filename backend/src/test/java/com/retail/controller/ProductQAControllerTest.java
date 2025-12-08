package com.retail.controller;

import com.retail.domain.qa.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.reactive.WebFluxTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.reactive.server.WebTestClient;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.ArrayList;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Controller tests for ProductQAController REST API.
 * TODO: Fix WebFluxTest context loading - currently requires full app context with MongoDB
 */
@org.junit.jupiter.api.Disabled("WebFluxTest requires full app context - fix tenant/security config")
@WebFluxTest(ProductQAController.class)
class ProductQAControllerTest {

    @Autowired
    private WebTestClient webTestClient;

    @MockBean
    private ProductQAService qaService;

    private static final String PRODUCT_ID = "product-123";
    private static final String QUESTION_ID = "question-456";
    private static final String ANSWER_ID = "answer-789";
    private static final String USER_ID = "user-101";

    // ==================== Question Endpoint Tests ====================

    @Test
    void submitQuestion_ValidRequest_ReturnsCreated() {
        // Arrange
        ProductQuestion savedQuestion = createQuestion(QUESTION_ID, QuestionStatus.PENDING);

        when(qaService.submitQuestion(eq(USER_ID), eq(PRODUCT_ID), any(ProductQuestion.class)))
                .thenReturn(Mono.just(savedQuestion));

        String requestBody = """
            {
                "questionText": "What is the battery life?"
            }
            """;

        // Act & Assert
        webTestClient.post()
                .uri("/api/v1/qa/products/{productId}/questions?userId={userId}", PRODUCT_ID, USER_ID)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(requestBody)
                .exchange()
                .expectStatus().isCreated()
                .expectBody()
                .jsonPath("$.id").isEqualTo(QUESTION_ID)
                .jsonPath("$.status").isEqualTo("PENDING");

        verify(qaService).submitQuestion(eq(USER_ID), eq(PRODUCT_ID), any(ProductQuestion.class));
    }

    @Test
    void submitQuestion_EmptyText_ReturnsBadRequest() {
        // Arrange
        String requestBody = """
            {
                "questionText": ""
            }
            """;

        // Act & Assert
        webTestClient.post()
                .uri("/api/v1/qa/products/{productId}/questions?userId={userId}", PRODUCT_ID, USER_ID)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(requestBody)
                .exchange()
                .expectStatus().isBadRequest();
    }

    @Test
    void getProductQuestions_ReturnsQuestions() {
        // Arrange
        ProductQuestion q1 = createQuestion("q1", QuestionStatus.APPROVED);
        ProductQuestion q2 = createQuestion("q2", QuestionStatus.ANSWERED);

        when(qaService.getProductQuestions(PRODUCT_ID))
                .thenReturn(Flux.just(q1, q2));

        // Act & Assert
        webTestClient.get()
                .uri("/api/v1/qa/products/{productId}/questions", PRODUCT_ID)
                .exchange()
                .expectStatus().isOk()
                .expectBodyList(ProductQuestion.class)
                .hasSize(2);

        verify(qaService).getProductQuestions(PRODUCT_ID);
    }

    @Test
    void searchQuestions_ReturnsMatchingQuestions() {
        // Arrange
        ProductQuestion q1 = createQuestion("q1", QuestionStatus.APPROVED);

        when(qaService.searchQuestions(PRODUCT_ID, "battery"))
                .thenReturn(Flux.just(q1));

        // Act & Assert
        webTestClient.get()
                .uri("/api/v1/qa/products/{productId}/questions/search?query=battery", PRODUCT_ID)
                .exchange()
                .expectStatus().isOk()
                .expectBodyList(ProductQuestion.class)
                .hasSize(1);

        verify(qaService).searchQuestions(PRODUCT_ID, "battery");
    }

    @Test
    void getProductQAStatistics_ReturnsStats() {
        // Arrange
        QAStatistics stats = new QAStatistics(25, 15);

        when(qaService.getProductQAStatistics(PRODUCT_ID))
                .thenReturn(Mono.just(stats));

        // Act & Assert
        webTestClient.get()
                .uri("/api/v1/qa/products/{productId}/statistics", PRODUCT_ID)
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.totalQuestions").isEqualTo(25)
                .jsonPath("$.answeredQuestions").isEqualTo(15);

        verify(qaService).getProductQAStatistics(PRODUCT_ID);
    }

    @Test
    void upvoteQuestion_ReturnsUpdatedQuestion() {
        // Arrange
        ProductQuestion question = createQuestion(QUESTION_ID, QuestionStatus.APPROVED);
        question.setUpvoteCount(10);

        when(qaService.upvoteQuestion(QUESTION_ID, USER_ID))
                .thenReturn(Mono.just(question));

        // Act & Assert
        webTestClient.post()
                .uri("/api/v1/qa/questions/{questionId}/upvote?userId={userId}", QUESTION_ID, USER_ID)
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.upvoteCount").isEqualTo(10);

        verify(qaService).upvoteQuestion(QUESTION_ID, USER_ID);
    }

    @Test
    void deleteQuestion_Success_ReturnsNoContent() {
        // Arrange
        when(qaService.deleteQuestion(QUESTION_ID, USER_ID, false))
                .thenReturn(Mono.empty());

        // Act & Assert
        webTestClient.delete()
                .uri("/api/v1/qa/questions/{questionId}?userId={userId}", QUESTION_ID, USER_ID)
                .exchange()
                .expectStatus().isNoContent();

        verify(qaService).deleteQuestion(QUESTION_ID, USER_ID, false);
    }

    @Test
    void deleteQuestion_NotOwner_ReturnsForbidden() {
        // Arrange
        when(qaService.deleteQuestion(QUESTION_ID, USER_ID, false))
                .thenReturn(Mono.error(new IllegalStateException("You can only delete your own questions")));

        // Act & Assert
        webTestClient.delete()
                .uri("/api/v1/qa/questions/{questionId}?userId={userId}", QUESTION_ID, USER_ID)
                .exchange()
                .expectStatus().isForbidden();
    }

    // ==================== Answer Endpoint Tests ====================

    @Test
    void submitAnswer_ValidRequest_ReturnsCreated() {
        // Arrange
        ProductAnswer savedAnswer = createAnswer(ANSWER_ID);

        when(qaService.submitAnswer(eq(USER_ID), eq(QUESTION_ID), any(ProductAnswer.class), eq(false)))
                .thenReturn(Mono.just(savedAnswer));

        String requestBody = """
            {
                "answerText": "The battery life is approximately 10 hours."
            }
            """;

        // Act & Assert
        webTestClient.post()
                .uri("/api/v1/qa/questions/{questionId}/answers?userId={userId}", QUESTION_ID, USER_ID)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(requestBody)
                .exchange()
                .expectStatus().isCreated()
                .expectBody()
                .jsonPath("$.id").isEqualTo(ANSWER_ID);

        verify(qaService).submitAnswer(eq(USER_ID), eq(QUESTION_ID), any(ProductAnswer.class), eq(false));
    }

    @Test
    void submitAnswer_SellerAnswer_SetsFlag() {
        // Arrange
        ProductAnswer savedAnswer = createAnswer(ANSWER_ID);
        savedAnswer.setIsSellerAnswer(true);

        when(qaService.submitAnswer(eq(USER_ID), eq(QUESTION_ID), any(ProductAnswer.class), eq(true)))
                .thenReturn(Mono.just(savedAnswer));

        String requestBody = """
            {
                "answerText": "Official answer from the store."
            }
            """;

        // Act & Assert
        webTestClient.post()
                .uri("/api/v1/qa/questions/{questionId}/answers?userId={userId}&isSeller=true", QUESTION_ID, USER_ID)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(requestBody)
                .exchange()
                .expectStatus().isCreated()
                .expectBody()
                .jsonPath("$.isSellerAnswer").isEqualTo(true);

        verify(qaService).submitAnswer(eq(USER_ID), eq(QUESTION_ID), any(ProductAnswer.class), eq(true));
    }

    @Test
    void submitAnswer_EmptyText_ReturnsBadRequest() {
        // Arrange
        String requestBody = """
            {
                "answerText": ""
            }
            """;

        // Act & Assert
        webTestClient.post()
                .uri("/api/v1/qa/questions/{questionId}/answers?userId={userId}", QUESTION_ID, USER_ID)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(requestBody)
                .exchange()
                .expectStatus().isBadRequest();
    }

    @Test
    void getQuestionAnswers_ReturnsAnswers() {
        // Arrange
        ProductAnswer a1 = createAnswer("a1");
        ProductAnswer a2 = createAnswer("a2");

        when(qaService.getQuestionAnswers(QUESTION_ID))
                .thenReturn(Flux.just(a1, a2));

        // Act & Assert
        webTestClient.get()
                .uri("/api/v1/qa/questions/{questionId}/answers", QUESTION_ID)
                .exchange()
                .expectStatus().isOk()
                .expectBodyList(ProductAnswer.class)
                .hasSize(2);

        verify(qaService).getQuestionAnswers(QUESTION_ID);
    }

    @Test
    void markAnswerHelpful_ReturnsUpdatedAnswer() {
        // Arrange
        ProductAnswer answer = createAnswer(ANSWER_ID);
        answer.setHelpfulCount(10);

        when(qaService.markAnswerHelpful(ANSWER_ID, USER_ID))
                .thenReturn(Mono.just(answer));

        // Act & Assert
        webTestClient.post()
                .uri("/api/v1/qa/answers/{answerId}/helpful?userId={userId}", ANSWER_ID, USER_ID)
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.helpfulCount").isEqualTo(10);

        verify(qaService).markAnswerHelpful(ANSWER_ID, USER_ID);
    }

    @Test
    void deleteAnswer_Success_ReturnsNoContent() {
        // Arrange
        when(qaService.deleteAnswer(ANSWER_ID, USER_ID, false))
                .thenReturn(Mono.empty());

        // Act & Assert
        webTestClient.delete()
                .uri("/api/v1/qa/answers/{answerId}?userId={userId}", ANSWER_ID, USER_ID)
                .exchange()
                .expectStatus().isNoContent();

        verify(qaService).deleteAnswer(ANSWER_ID, USER_ID, false);
    }

    // ==================== Admin Endpoint Tests ====================

    @Test
    void getPendingQuestions_ReturnsQuestions() {
        // Arrange
        ProductQuestion q1 = createQuestion("q1", QuestionStatus.PENDING);
        ProductQuestion q2 = createQuestion("q2", QuestionStatus.PENDING);

        when(qaService.getPendingQuestions())
                .thenReturn(Flux.just(q1, q2));

        // Act & Assert
        webTestClient.get()
                .uri("/api/v1/qa/admin/pending")
                .exchange()
                .expectStatus().isOk()
                .expectBodyList(ProductQuestion.class)
                .hasSize(2);

        verify(qaService).getPendingQuestions();
    }

    @Test
    void approveQuestion_UpdatesStatus() {
        // Arrange
        ProductQuestion question = createQuestion(QUESTION_ID, QuestionStatus.APPROVED);

        when(qaService.approveQuestion(QUESTION_ID))
                .thenReturn(Mono.just(question));

        // Act & Assert
        webTestClient.post()
                .uri("/api/v1/qa/admin/questions/{questionId}/approve", QUESTION_ID)
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.status").isEqualTo("APPROVED");

        verify(qaService).approveQuestion(QUESTION_ID);
    }

    @Test
    void rejectQuestion_UpdatesStatus() {
        // Arrange
        ProductQuestion question = createQuestion(QUESTION_ID, QuestionStatus.REJECTED);

        when(qaService.rejectQuestion(QUESTION_ID))
                .thenReturn(Mono.just(question));

        // Act & Assert
        webTestClient.post()
                .uri("/api/v1/qa/admin/questions/{questionId}/reject", QUESTION_ID)
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.status").isEqualTo("REJECTED");

        verify(qaService).rejectQuestion(QUESTION_ID);
    }

    @Test
    void verifyAnswer_SetsVerifiedFlag() {
        // Arrange
        ProductAnswer answer = createAnswer(ANSWER_ID);
        answer.setIsVerified(true);

        when(qaService.verifyAnswer(ANSWER_ID))
                .thenReturn(Mono.just(answer));

        // Act & Assert
        webTestClient.post()
                .uri("/api/v1/qa/admin/answers/{answerId}/verify", ANSWER_ID)
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.isVerified").isEqualTo(true);

        verify(qaService).verifyAnswer(ANSWER_ID);
    }

    // ==================== Helper Methods ====================

    private ProductQuestion createQuestion(String id, QuestionStatus status) {
        ProductQuestion question = new ProductQuestion();
        question.setId(id);
        question.setProductId(PRODUCT_ID);
        question.setUserId(USER_ID);
        question.setUserName("Test User");
        question.setQuestionText("Test question?");
        question.setStatus(status);
        question.setUpvoteCount(0);
        question.setUpvotedBy(new ArrayList<>());
        question.setAnswerCount(0);
        question.setCreatedAt(Instant.now());
        question.setUpdatedAt(Instant.now());
        return question;
    }

    private ProductAnswer createAnswer(String id) {
        ProductAnswer answer = new ProductAnswer();
        answer.setId(id);
        answer.setQuestionId(QUESTION_ID);
        answer.setProductId(PRODUCT_ID);
        answer.setUserId(USER_ID);
        answer.setUserName("Test User");
        answer.setAnswerText("Test answer");
        answer.setIsSellerAnswer(false);
        answer.setIsVerified(false);
        answer.setHelpfulCount(0);
        answer.setNotHelpfulCount(0);
        answer.setHelpfulVotedBy(new ArrayList<>());
        answer.setCreatedAt(Instant.now());
        answer.setUpdatedAt(Instant.now());
        return answer;
    }
}
