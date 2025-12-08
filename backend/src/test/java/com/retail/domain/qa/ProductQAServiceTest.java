package com.retail.domain.qa;

import com.retail.domain.user.User;
import com.retail.domain.user.UserService;
import com.retail.infrastructure.persistence.ProductAnswerRepository;
import com.retail.infrastructure.persistence.ProductQuestionRepository;
import com.retail.security.tenant.TenantContext;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.time.Instant;
import java.util.ArrayList;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for ProductQAService.
 */
@ExtendWith(MockitoExtension.class)
class ProductQAServiceTest {

    @Mock
    private ProductQuestionRepository questionRepository;

    @Mock
    private ProductAnswerRepository answerRepository;

    @Mock
    private UserService userService;

    @InjectMocks
    private ProductQAService qaService;

    private static final String TENANT_ID = "tenant-123";
    private static final String USER_ID = "user-456";
    private static final String PRODUCT_ID = "product-789";
    private static final String QUESTION_ID = "question-101";

    // ==================== Question Tests ====================

    @Test
    void submitQuestion_Success() {
        // Arrange
        User mockUser = new User();
        mockUser.setFirstName("John");
        mockUser.setLastName("Doe");

        ProductQuestion question = new ProductQuestion();
        question.setQuestionText("What is the battery life?");

        when(userService.findById(USER_ID)).thenReturn(Mono.just(mockUser));
        when(questionRepository.save(any(ProductQuestion.class)))
                .thenAnswer(invocation -> Mono.just(invocation.getArgument(0)));

        // Act & Assert
        StepVerifier.create(qaService.submitQuestion(USER_ID, PRODUCT_ID, question)
                        .contextWrite(TenantContext.withTenantId(TENANT_ID)))
                .expectNextMatches(savedQuestion ->
                        savedQuestion.getTenantId().equals(TENANT_ID) &&
                        savedQuestion.getProductId().equals(PRODUCT_ID) &&
                        savedQuestion.getUserId().equals(USER_ID) &&
                        savedQuestion.getUserName().equals("John D.") &&
                        savedQuestion.getStatus() == QuestionStatus.PENDING &&
                        savedQuestion.getQuestionText().equals("What is the battery life?")
                )
                .verifyComplete();

        verify(questionRepository).save(any(ProductQuestion.class));
    }

    @Test
    void getProductQuestions_ReturnsVisibleQuestions() {
        // Arrange
        ProductQuestion q1 = createQuestion("q1", QuestionStatus.APPROVED);
        q1.setUpvoteCount(10);
        ProductQuestion q2 = createQuestion("q2", QuestionStatus.ANSWERED);
        q2.setUpvoteCount(5);

        when(questionRepository.findVisibleByProduct(TENANT_ID, PRODUCT_ID))
                .thenReturn(Flux.just(q1, q2));

        // Act & Assert
        StepVerifier.create(qaService.getProductQuestions(PRODUCT_ID)
                        .contextWrite(TenantContext.withTenantId(TENANT_ID)))
                .expectNextMatches(q -> q.getId().equals("q1")) // Higher upvotes first
                .expectNextMatches(q -> q.getId().equals("q2"))
                .verifyComplete();
    }

    @Test
    void upvoteQuestion_FirstTime_IncrementsCount() {
        // Arrange
        ProductQuestion question = createQuestion(QUESTION_ID, QuestionStatus.APPROVED);
        question.setUpvoteCount(5);
        question.setUpvotedBy(new ArrayList<>());

        when(questionRepository.findById(QUESTION_ID)).thenReturn(Mono.just(question));
        when(questionRepository.save(any(ProductQuestion.class)))
                .thenAnswer(invocation -> Mono.just(invocation.getArgument(0)));

        // Act & Assert
        StepVerifier.create(qaService.upvoteQuestion(QUESTION_ID, USER_ID))
                .expectNextMatches(q ->
                        q.getUpvoteCount() == 6 &&
                        q.getUpvotedBy().contains(USER_ID)
                )
                .verifyComplete();
    }

    @Test
    void upvoteQuestion_AlreadyUpvoted_DoesNotIncrement() {
        // Arrange
        ProductQuestion question = createQuestion(QUESTION_ID, QuestionStatus.APPROVED);
        question.setUpvoteCount(5);
        ArrayList<String> upvotedBy = new ArrayList<>();
        upvotedBy.add(USER_ID);
        question.setUpvotedBy(upvotedBy);

        when(questionRepository.findById(QUESTION_ID)).thenReturn(Mono.just(question));

        // Act & Assert
        StepVerifier.create(qaService.upvoteQuestion(QUESTION_ID, USER_ID))
                .expectNextMatches(q -> q.getUpvoteCount() == 5) // No change
                .verifyComplete();

        verify(questionRepository, never()).save(any());
    }

    @Test
    void approveQuestion_UpdatesStatus() {
        // Arrange
        ProductQuestion question = createQuestion(QUESTION_ID, QuestionStatus.PENDING);

        when(questionRepository.findById(QUESTION_ID)).thenReturn(Mono.just(question));
        when(questionRepository.save(any(ProductQuestion.class)))
                .thenAnswer(invocation -> Mono.just(invocation.getArgument(0)));

        // Act & Assert
        StepVerifier.create(qaService.approveQuestion(QUESTION_ID))
                .expectNextMatches(q -> q.getStatus() == QuestionStatus.APPROVED)
                .verifyComplete();
    }

    @Test
    void rejectQuestion_UpdatesStatus() {
        // Arrange
        ProductQuestion question = createQuestion(QUESTION_ID, QuestionStatus.PENDING);

        when(questionRepository.findById(QUESTION_ID)).thenReturn(Mono.just(question));
        when(questionRepository.save(any(ProductQuestion.class)))
                .thenAnswer(invocation -> Mono.just(invocation.getArgument(0)));

        // Act & Assert
        StepVerifier.create(qaService.rejectQuestion(QUESTION_ID))
                .expectNextMatches(q -> q.getStatus() == QuestionStatus.REJECTED)
                .verifyComplete();
    }

    @Test
    void deleteQuestion_UserOwns_Succeeds() {
        // Arrange
        ProductQuestion question = createQuestion(QUESTION_ID, QuestionStatus.APPROVED);
        question.setUserId(USER_ID);

        when(questionRepository.findById(QUESTION_ID)).thenReturn(Mono.just(question));
        when(answerRepository.deleteByTenantIdAndQuestionId(TENANT_ID, QUESTION_ID))
                .thenReturn(Mono.empty());
        when(questionRepository.deleteById(eq(QUESTION_ID))).thenReturn(Mono.empty());

        // Act & Assert
        StepVerifier.create(qaService.deleteQuestion(QUESTION_ID, USER_ID, false)
                        .contextWrite(TenantContext.withTenantId(TENANT_ID)))
                .verifyComplete();

        verify(answerRepository).deleteByTenantIdAndQuestionId(TENANT_ID, QUESTION_ID);
        verify(questionRepository).deleteById(eq(QUESTION_ID));
    }

    @Test
    void deleteQuestion_UserDoesNotOwn_Fails() {
        // Arrange
        ProductQuestion question = createQuestion(QUESTION_ID, QuestionStatus.APPROVED);
        question.setUserId("different-user");

        when(questionRepository.findById(QUESTION_ID)).thenReturn(Mono.just(question));

        // Act & Assert
        StepVerifier.create(qaService.deleteQuestion(QUESTION_ID, USER_ID, false)
                        .contextWrite(TenantContext.withTenantId(TENANT_ID)))
                .expectError(IllegalStateException.class)
                .verify();

        verify(questionRepository, never()).deleteById(anyString());
    }

    @Test
    void deleteQuestion_AdminCanDeleteAny() {
        // Arrange
        ProductQuestion question = createQuestion(QUESTION_ID, QuestionStatus.APPROVED);
        question.setUserId("different-user");

        when(questionRepository.findById(QUESTION_ID)).thenReturn(Mono.just(question));
        when(answerRepository.deleteByTenantIdAndQuestionId(TENANT_ID, QUESTION_ID))
                .thenReturn(Mono.empty());
        when(questionRepository.deleteById(eq(QUESTION_ID))).thenReturn(Mono.empty());

        // Act & Assert
        StepVerifier.create(qaService.deleteQuestion(QUESTION_ID, USER_ID, true)
                        .contextWrite(TenantContext.withTenantId(TENANT_ID)))
                .verifyComplete();

        verify(questionRepository).deleteById(eq(QUESTION_ID));
    }

    // ==================== Answer Tests ====================

    @Test
    void submitAnswer_ApprovedQuestion_Succeeds() {
        // Arrange
        ProductQuestion question = createQuestion(QUESTION_ID, QuestionStatus.APPROVED);

        User mockUser = new User();
        mockUser.setFirstName("Jane");
        mockUser.setLastName("Smith");

        ProductAnswer answer = new ProductAnswer();
        answer.setAnswerText("The battery life is 10 hours.");

        when(questionRepository.findById(QUESTION_ID)).thenReturn(Mono.just(question));
        when(userService.findById(USER_ID)).thenReturn(Mono.just(mockUser));
        when(answerRepository.save(any(ProductAnswer.class)))
                .thenAnswer(invocation -> Mono.just(invocation.getArgument(0)));
        when(questionRepository.save(any(ProductQuestion.class)))
                .thenAnswer(invocation -> Mono.just(invocation.getArgument(0)));

        // Act & Assert
        StepVerifier.create(qaService.submitAnswer(USER_ID, QUESTION_ID, answer, false)
                        .contextWrite(TenantContext.withTenantId(TENANT_ID)))
                .expectNextMatches(savedAnswer ->
                        savedAnswer.getTenantId().equals(TENANT_ID) &&
                        savedAnswer.getQuestionId().equals(QUESTION_ID) &&
                        savedAnswer.getUserId().equals(USER_ID) &&
                        savedAnswer.getUserName().equals("Jane S.") &&
                        !savedAnswer.getIsSellerAnswer() &&
                        savedAnswer.getAnswerText().equals("The battery life is 10 hours.")
                )
                .verifyComplete();
    }

    @Test
    void submitAnswer_PendingQuestion_Fails() {
        // Arrange
        ProductQuestion question = createQuestion(QUESTION_ID, QuestionStatus.PENDING);

        ProductAnswer answer = new ProductAnswer();
        answer.setAnswerText("Some answer");

        when(questionRepository.findById(QUESTION_ID)).thenReturn(Mono.just(question));

        // Act & Assert
        StepVerifier.create(qaService.submitAnswer(USER_ID, QUESTION_ID, answer, false)
                        .contextWrite(TenantContext.withTenantId(TENANT_ID)))
                .expectError(IllegalStateException.class)
                .verify();
    }

    @Test
    void submitAnswer_SellerAnswer_SetsFlag() {
        // Arrange
        ProductQuestion question = createQuestion(QUESTION_ID, QuestionStatus.APPROVED);

        User mockUser = new User();
        mockUser.setFirstName("Store");
        mockUser.setLastName("Owner");

        ProductAnswer answer = new ProductAnswer();
        answer.setAnswerText("Official answer from the store.");

        when(questionRepository.findById(QUESTION_ID)).thenReturn(Mono.just(question));
        when(userService.findById(USER_ID)).thenReturn(Mono.just(mockUser));
        when(answerRepository.save(any(ProductAnswer.class)))
                .thenAnswer(invocation -> Mono.just(invocation.getArgument(0)));
        when(questionRepository.save(any(ProductQuestion.class)))
                .thenAnswer(invocation -> Mono.just(invocation.getArgument(0)));

        // Act & Assert
        StepVerifier.create(qaService.submitAnswer(USER_ID, QUESTION_ID, answer, true)
                        .contextWrite(TenantContext.withTenantId(TENANT_ID)))
                .expectNextMatches(savedAnswer -> savedAnswer.getIsSellerAnswer())
                .verifyComplete();
    }

    @Test
    void markAnswerHelpful_FirstTime_IncrementsCount() {
        // Arrange
        ProductAnswer answer = createAnswer("answer-1");
        answer.setHelpfulCount(5);
        answer.setHelpfulVotedBy(new ArrayList<>());

        when(answerRepository.findById("answer-1")).thenReturn(Mono.just(answer));
        when(answerRepository.save(any(ProductAnswer.class)))
                .thenAnswer(invocation -> Mono.just(invocation.getArgument(0)));

        // Act & Assert
        StepVerifier.create(qaService.markAnswerHelpful("answer-1", USER_ID))
                .expectNextMatches(a ->
                        a.getHelpfulCount() == 6 &&
                        a.getHelpfulVotedBy().contains(USER_ID)
                )
                .verifyComplete();
    }

    @Test
    void verifyAnswer_SetsVerifiedFlag() {
        // Arrange
        ProductAnswer answer = createAnswer("answer-1");
        answer.setIsVerified(false);

        when(answerRepository.findById("answer-1")).thenReturn(Mono.just(answer));
        when(answerRepository.save(any(ProductAnswer.class)))
                .thenAnswer(invocation -> Mono.just(invocation.getArgument(0)));

        // Act & Assert
        StepVerifier.create(qaService.verifyAnswer("answer-1"))
                .expectNextMatches(a -> a.getIsVerified())
                .verifyComplete();
    }

    @Test
    void getProductQAStatistics_ReturnsCorrectCounts() {
        // Arrange
        when(questionRepository.countByTenantIdAndProductIdAndStatusIn(
                eq(TENANT_ID), eq(PRODUCT_ID),
                eq(QuestionStatus.APPROVED), eq(QuestionStatus.ANSWERED)))
                .thenReturn(Mono.just(25L));
        when(questionRepository.countByTenantIdAndProductIdAndStatusIn(
                eq(TENANT_ID), eq(PRODUCT_ID),
                eq(QuestionStatus.ANSWERED)))
                .thenReturn(Mono.just(15L));

        // Act & Assert
        StepVerifier.create(qaService.getProductQAStatistics(PRODUCT_ID)
                        .contextWrite(TenantContext.withTenantId(TENANT_ID)))
                .expectNextMatches(stats ->
                        stats.getTotalQuestions() == 25 &&
                        stats.getAnsweredQuestions() == 15 &&
                        stats.getUnansweredQuestions() == 10 &&
                        stats.getAnsweredPercentage() == 60.0
                )
                .verifyComplete();
    }

    // ==================== Helper Methods ====================

    private ProductQuestion createQuestion(String id, QuestionStatus status) {
        ProductQuestion question = new ProductQuestion();
        question.setId(id);
        question.setTenantId(TENANT_ID);
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
        answer.setTenantId(TENANT_ID);
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
