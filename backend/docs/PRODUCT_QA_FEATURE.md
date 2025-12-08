# Product Q&A Feature Documentation

## Overview

The Product Q&A system allows customers to ask questions about products and receive answers from sellers or community members. This builds trust and reduces customer support burden.

## Domain Model

### ProductQuestion Entity

Located in `com.retail.domain.qa.ProductQuestion`

```java
@Document(collection = "product_questions")
public class ProductQuestion {
    private String id;
    private String tenantId;        // Multi-tenant isolation
    private String productId;
    private String userId;
    private String userName;
    private String questionText;
    private QuestionStatus status;  // PENDING, APPROVED, ANSWERED, REJECTED
    private Integer upvoteCount;
    private List<String> upvotedBy; // Track who upvoted to prevent duplicates
    private Integer answerCount;
    private Instant createdAt;
    private Instant updatedAt;
}
```

### ProductAnswer Entity

Located in `com.retail.domain.qa.ProductAnswer`

```java
@Document(collection = "product_answers")
public class ProductAnswer {
    private String id;
    private String tenantId;
    private String questionId;
    private String productId;       // Denormalized for efficient queries
    private String userId;
    private String userName;
    private String answerText;
    private Boolean isSellerAnswer; // Official answer from store
    private Boolean isVerified;     // Verified by moderator
    private Integer helpfulCount;
    private Integer notHelpfulCount;
    private List<String> helpfulVotedBy;
    private Instant createdAt;
    private Instant updatedAt;
}
```

### QuestionStatus Enum

```java
public enum QuestionStatus {
    PENDING,   // Awaiting moderation
    APPROVED,  // Published, awaiting answers
    ANSWERED,  // Has at least one answer
    REJECTED   // Rejected by moderator
}
```

### QAStatistics DTO

```java
public class QAStatistics {
    private Integer totalQuestions;
    private Integer answeredQuestions;

    // Computed properties
    public Integer getUnansweredQuestions();
    public double getAnsweredPercentage();
}
```

## API Endpoints

Base path: `/api/v1/qa`

### Question Endpoints

#### Submit a Question

```http
POST /api/v1/qa/products/{productId}/questions?userId={userId}
```

**Request Body**:
```json
{
  "questionText": "What is the battery life on this product?"
}
```

**Response**: `201 Created`
```json
{
  "id": "question-123",
  "productId": "product-456",
  "userId": "user-789",
  "userName": "John D.",
  "questionText": "What is the battery life on this product?",
  "status": "PENDING",
  "upvoteCount": 0,
  "answerCount": 0,
  "createdAt": "2025-12-07T10:30:00Z"
}
```

#### Get Product Questions

```http
GET /api/v1/qa/products/{productId}/questions
```

Returns all **approved** or **answered** questions, sorted by upvote count.

#### Search Questions

```http
GET /api/v1/qa/products/{productId}/questions/search?query={searchText}
```

Search questions by keyword within approved/answered questions.

#### Get Q&A Statistics

```http
GET /api/v1/qa/products/{productId}/statistics
```

**Response**: `200 OK`
```json
{
  "totalQuestions": 25,
  "answeredQuestions": 15
}
```

#### Get User's Questions

```http
GET /api/v1/qa/users/{userId}/questions
```

Returns all questions asked by a specific user.

#### Upvote a Question

```http
POST /api/v1/qa/questions/{questionId}/upvote?userId={userId}
```

Users can only upvote once per question. Returns updated question.

#### Remove Upvote

```http
DELETE /api/v1/qa/questions/{questionId}/upvote?userId={userId}
```

#### Delete Question

```http
DELETE /api/v1/qa/questions/{questionId}?userId={userId}&isAdmin={boolean}
```

Users can only delete their own questions. Admins can delete any question.
Deleting a question also deletes all its answers.

### Answer Endpoints

#### Submit an Answer

```http
POST /api/v1/qa/questions/{questionId}/answers?userId={userId}&isSeller={boolean}
```

**Request Body**:
```json
{
  "answerText": "The battery life is approximately 10 hours with normal use."
}
```

**Parameters**:
- `isSeller`: Set to `true` if this is an official answer from the store

**Response**: `201 Created`

#### Get Question Answers

```http
GET /api/v1/qa/questions/{questionId}/answers
```

Returns all answers, sorted by helpfulness score (seller answers first, then by helpful votes).

#### Mark Answer Helpful

```http
POST /api/v1/qa/answers/{answerId}/helpful?userId={userId}
```

Users can only mark helpful once per answer.

#### Mark Answer Not Helpful

```http
POST /api/v1/qa/answers/{answerId}/not-helpful
```

#### Delete Answer

```http
DELETE /api/v1/qa/answers/{answerId}?userId={userId}&isAdmin={boolean}
```

### Admin Endpoints

#### Get Pending Questions

```http
GET /api/v1/qa/admin/pending
```

Returns all questions with `PENDING` status for moderation.

#### Approve Question

```http
POST /api/v1/qa/admin/questions/{questionId}/approve
```

Changes status to `APPROVED`, making the question visible.

#### Reject Question

```http
POST /api/v1/qa/admin/questions/{questionId}/reject
```

Changes status to `REJECTED`, hiding the question.

#### Verify Answer

```http
POST /api/v1/qa/admin/answers/{answerId}/verify
```

Marks an answer as verified by moderators, giving it higher ranking.

## Business Logic

### Question Moderation Workflow

```
User submits question
    ↓
Status: PENDING
    ↓
Admin reviews
    ↓
Approve → Status: APPROVED (visible, awaiting answers)
    OR
Reject → Status: REJECTED (not visible)
    ↓
(If approved and answer received)
    ↓
Status: ANSWERED
```

### Answer Priority/Sorting

Answers are sorted by "helpfulness score":

```java
public double getHelpfulnessScore() {
    double baseScore = helpfulCount - (notHelpfulCount * 0.5);
    if (isSellerAnswer) {
        baseScore += 100; // Seller answers always prioritized
    }
    if (isVerified) {
        baseScore += 10;
    }
    return baseScore;
}
```

**Sort Order**:
1. Seller answers (always first)
2. Verified answers
3. Most helpful answers
4. Oldest answers (within same helpfulness)

### Upvote Tracking

To prevent duplicate votes, we track who upvoted:

```java
public boolean upvote(String userId) {
    if (!this.upvotedBy.contains(userId)) {
        this.upvotedBy.add(userId);
        this.upvoteCount++;
        return true;
    }
    return false; // Already upvoted
}
```

### Automatic Status Updates

When a question receives its first answer:
- Status changes from `APPROVED` to `ANSWERED`

When the last answer is deleted:
- Status reverts from `ANSWERED` to `APPROVED`

## Multi-Tenant Architecture

All Q&A operations are tenant-aware:

1. **TenantId Injection**: Automatically injected from reactive context
2. **Data Isolation**: All queries filter by tenantId
3. **Repositories**: Extend `TenantAwareRepository`

## Service Layer

### ProductQAService

Located in `com.retail.domain.qa.ProductQAService`

**Question Methods**:
- `submitQuestion(userId, productId, question)`
- `getProductQuestions(productId)`
- `getUserQuestions(userId)`
- `getPendingQuestions()`
- `searchQuestions(productId, searchText)`
- `upvoteQuestion(questionId, userId)`
- `removeUpvote(questionId, userId)`
- `approveQuestion(questionId)`
- `rejectQuestion(questionId)`
- `deleteQuestion(questionId, userId, isAdmin)`

**Answer Methods**:
- `submitAnswer(userId, questionId, answer, isSeller)`
- `getQuestionAnswers(questionId)`
- `markAnswerHelpful(answerId, voterId)`
- `markAnswerNotHelpful(answerId)`
- `verifyAnswer(answerId)`
- `deleteAnswer(answerId, userId, isAdmin)`

**Statistics**:
- `getProductQAStatistics(productId)`

## Repository Layer

### ProductQuestionRepository

```java
public interface ProductQuestionRepository extends TenantAwareRepository<ProductQuestion, String> {
    Flux<ProductQuestion> findVisibleByProduct(String tenantId, String productId);
    Flux<ProductQuestion> findByTenantIdAndUserId(String tenantId, String userId);
    Flux<ProductQuestion> findByTenantIdAndStatus(String tenantId, QuestionStatus status);
    Mono<Long> countByTenantIdAndProductIdAndStatusIn(String tenantId, String productId, QuestionStatus... statuses);
    Flux<ProductQuestion> searchByText(String tenantId, String productId, String searchText);
}
```

### ProductAnswerRepository

```java
public interface ProductAnswerRepository extends TenantAwareRepository<ProductAnswer, String> {
    Flux<ProductAnswer> findByTenantIdAndQuestionId(String tenantId, String questionId);
    Flux<ProductAnswer> findByTenantIdAndUserId(String tenantId, String userId);
    Flux<ProductAnswer> findSellerAnswersByProduct(String tenantId, String productId);
    Mono<Long> countByTenantIdAndQuestionId(String tenantId, String questionId);
    Mono<Void> deleteByTenantIdAndQuestionId(String tenantId, String questionId);
}
```

## Database Indexes

MongoDB compound indexes for performance:

```java
@CompoundIndex(name = "tenant_product", def = "{'tenantId': 1, 'productId': 1}")
@CompoundIndex(name = "product_status", def = "{'productId': 1, 'status': 1}")
```

## Testing

### Unit Tests

**ProductQAServiceTest**: 15 tests (ALL PASSING)
- Submit question
- Get product questions
- Upvote questions (first time, duplicate prevention)
- Approve/reject questions
- Delete questions (owner, admin, unauthorized)
- Submit answers (approved question, pending question fails, seller flag)
- Mark answers helpful
- Verify answers
- Q&A statistics calculation

## Error Handling

**HTTP Status Codes**:
- `200 OK` - Successful operation
- `201 Created` - Question/answer submitted
- `204 No Content` - Question/answer deleted
- `400 Bad Request` - Empty question/answer text
- `403 Forbidden` - User cannot delete others' content
- `500 Internal Server Error` - Server errors

## Security Considerations

1. **User Isolation**: Users can only delete their own questions/answers
2. **Tenant Isolation**: All operations enforce tenant boundaries
3. **Input Validation**: Question/answer text validated for non-empty
4. **Moderation**: Questions require admin approval before visibility
5. **Vote Tracking**: Prevents duplicate upvotes/helpful votes

## Integration with Product Catalog

Q&A integrates with the product catalog to show:

1. **Question Count**: "25 questions answered" badge
2. **Recent Questions**: Show latest answered questions on product page
3. **Search Integration**: Q&A results in product search

## Future Enhancements

Potential improvements:

1. **Email Notifications**: Notify users when their question is answered
2. **Question Categories**: Categorize questions (shipping, sizing, usage, etc.)
3. **Rich Text Answers**: Support markdown formatting in answers
4. **Image Attachments**: Allow images in questions/answers
5. **Answer Templates**: Common answer templates for sellers
6. **Auto-Moderation**: AI-based spam detection for questions
7. **Featured Questions**: Pin important questions to top
8. **Answer Requests**: Request answer from specific users (experts)
9. **Analytics**: Track which questions lead to purchases
10. **Similar Questions**: Suggest existing questions when asking new ones

## Related Documentation

- [Product Reviews Feature](./PRODUCT_REVIEWS_FEATURE.md)
- [Wishlist Feature](./WISHLIST_FEATURE.md)
- [Multi-Tenant Architecture](../CLAUDE.md#multi-tenancy-architecture)
