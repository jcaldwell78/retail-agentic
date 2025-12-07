import { useState, useEffect, useCallback } from 'react';
import { MessageCircle, ThumbsUp, ThumbsDown, CheckCircle, Search, ChevronDown, ChevronUp, Send } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useUserStore } from '@/store/userStore';
import { productQAApi, type ProductQuestion, type ProductAnswer, type QAStatistics } from '@/lib/api/productQA';

interface ProductQAProps {
  productId: string;
  productName?: string;
  className?: string;
}

/**
 * Format relative time (e.g., "2 days ago")
 */
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours === 0) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return diffMins <= 1 ? 'just now' : `${diffMins} minutes ago`;
    }
    return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
  }
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

/**
 * Single Answer component
 */
function AnswerItem({
  answer,
  userId,
  onMarkHelpful,
  onMarkNotHelpful,
}: {
  answer: ProductAnswer;
  userId: string | undefined;
  onMarkHelpful: (answerId: string) => void;
  onMarkNotHelpful: (answerId: string) => void;
}) {
  const hasVoted = Boolean(userId && answer.helpfulVotedBy?.includes(userId));

  return (
    <div className="pl-8 py-3 border-l-2 border-gray-200 ml-4">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm">{answer.userName || 'Anonymous'}</span>
            {answer.isSellerAnswer && (
              <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                Seller
              </Badge>
            )}
            {answer.isVerified && (
              <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                <CheckCircle className="w-3 h-3 mr-1" />
                Verified
              </Badge>
            )}
            <span className="text-xs text-gray-500">{formatRelativeTime(answer.createdAt)}</span>
          </div>
          <p className="text-sm text-gray-700">{answer.answerText}</p>
          <div className="flex items-center gap-4 mt-2">
            <button
              onClick={() => onMarkHelpful(answer.id)}
              disabled={hasVoted}
              className={`flex items-center gap-1 text-xs ${
                hasVoted ? 'text-green-600' : 'text-gray-500 hover:text-green-600'
              } transition-colors`}
              aria-label="Mark as helpful"
            >
              <ThumbsUp className="w-3.5 h-3.5" />
              <span>{answer.helpfulCount || 0}</span>
            </button>
            <button
              onClick={() => onMarkNotHelpful(answer.id)}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-600 transition-colors"
              aria-label="Mark as not helpful"
            >
              <ThumbsDown className="w-3.5 h-3.5" />
              <span>{answer.notHelpfulCount || 0}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Single Question component with expandable answers
 */
function QuestionItem({
  question,
  userId,
  onUpvote,
  onSubmitAnswer,
}: {
  question: ProductQuestion;
  userId: string | undefined;
  onUpvote: (questionId: string) => void;
  onSubmitAnswer: (questionId: string, answerText: string) => Promise<void>;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [answers, setAnswers] = useState<ProductAnswer[]>([]);
  const [loadingAnswers, setLoadingAnswers] = useState(false);
  const [showAnswerForm, setShowAnswerForm] = useState(false);
  const [answerText, setAnswerText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const hasUpvoted = Boolean(userId && question.upvotedBy?.includes(userId));

  const loadAnswers = useCallback(async () => {
    if (answers.length > 0 || question.answerCount === 0) return;

    setLoadingAnswers(true);
    try {
      const data = await productQAApi.getQuestionAnswers(question.id);
      setAnswers(data);
    } catch (error) {
      console.error('Failed to load answers:', error);
    } finally {
      setLoadingAnswers(false);
    }
  }, [question.id, question.answerCount, answers.length]);

  const handleExpand = () => {
    setIsExpanded(!isExpanded);
    if (!isExpanded && question.answerCount > 0) {
      loadAnswers();
    }
  };

  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answerText.trim()) return;

    setSubmitting(true);
    try {
      await onSubmitAnswer(question.id, answerText);
      setAnswerText('');
      setShowAnswerForm(false);
      // Reload answers
      const data = await productQAApi.getQuestionAnswers(question.id);
      setAnswers(data);
    } catch (error) {
      console.error('Failed to submit answer:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkHelpful = async (answerId: string) => {
    if (!userId) return;
    try {
      const updated = await productQAApi.markAnswerHelpful(answerId, userId);
      setAnswers((prev) => prev.map((a) => (a.id === answerId ? updated : a)));
    } catch (error) {
      console.error('Failed to mark helpful:', error);
    }
  };

  const handleMarkNotHelpful = async (answerId: string) => {
    try {
      const updated = await productQAApi.markAnswerNotHelpful(answerId);
      setAnswers((prev) => prev.map((a) => (a.id === answerId ? updated : a)));
    } catch (error) {
      console.error('Failed to mark not helpful:', error);
    }
  };

  return (
    <div className="py-4 border-b last:border-b-0" data-testid="question-item">
      <div className="flex items-start gap-3">
        {/* Upvote button */}
        <button
          onClick={() => onUpvote(question.id)}
          disabled={hasUpvoted}
          className={`flex flex-col items-center p-2 rounded ${
            hasUpvoted ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100 text-gray-500'
          } transition-colors`}
          aria-label={`Upvote question (${question.upvoteCount} upvotes)`}
        >
          <ThumbsUp className="w-4 h-4" />
          <span className="text-xs font-medium mt-1">{question.upvoteCount || 0}</span>
        </button>

        {/* Question content */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm">{question.userName || 'Anonymous'}</span>
            <span className="text-xs text-gray-500">{formatRelativeTime(question.createdAt)}</span>
            {question.status === 'ANSWERED' && (
              <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                Answered
              </Badge>
            )}
          </div>

          <p className="text-gray-800">{question.questionText}</p>

          {/* Answers section */}
          <div className="mt-3">
            <button
              onClick={handleExpand}
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              <span>
                {question.answerCount === 0
                  ? 'Be the first to answer'
                  : `${question.answerCount} answer${question.answerCount > 1 ? 's' : ''}`}
              </span>
            </button>

            {isExpanded && (
              <div className="mt-3 space-y-2">
                {loadingAnswers ? (
                  <div className="pl-8 space-y-2">
                    <Skeleton className="h-16 w-full" />
                  </div>
                ) : (
                  answers.map((answer) => (
                    <AnswerItem
                      key={answer.id}
                      answer={answer}
                      userId={userId}
                      onMarkHelpful={handleMarkHelpful}
                      onMarkNotHelpful={handleMarkNotHelpful}
                    />
                  ))
                )}

                {/* Answer form */}
                {userId && (
                  <div className="pl-8 mt-4">
                    {showAnswerForm ? (
                      <form onSubmit={handleSubmitAnswer} className="space-y-2">
                        <Textarea
                          value={answerText}
                          onChange={(e) => setAnswerText(e.target.value)}
                          placeholder="Write your answer..."
                          rows={3}
                          className="w-full"
                          disabled={submitting}
                        />
                        <div className="flex gap-2">
                          <Button type="submit" size="sm" disabled={submitting || !answerText.trim()}>
                            {submitting ? 'Submitting...' : 'Submit Answer'}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setShowAnswerForm(false)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAnswerForm(true)}
                        className="text-blue-600"
                      >
                        <Send className="w-4 h-4 mr-1" />
                        Answer this question
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Product Q&A Section
 */
export function ProductQA({ productId, productName, className = '' }: ProductQAProps) {
  const { user, isAuthenticated } = useUserStore();
  const userId = user?.id;

  const [questions, setQuestions] = useState<ProductQuestion[]>([]);
  const [statistics, setStatistics] = useState<QAStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Load questions and statistics
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [questionsData, statsData] = await Promise.all([
          productQAApi.getProductQuestions(productId),
          productQAApi.getQAStatistics(productId),
        ]);
        setQuestions(questionsData);
        setStatistics(statsData);
      } catch (error) {
        console.error('Failed to load Q&A data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [productId]);

  // Handle search
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      const data = await productQAApi.getProductQuestions(productId);
      setQuestions(data);
      return;
    }

    try {
      const results = await productQAApi.searchQuestions(productId, searchQuery);
      setQuestions(results);
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  // Submit new question
  const handleSubmitQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim() || !userId) return;

    setSubmitting(true);
    try {
      const created = await productQAApi.submitQuestion(
        productId,
        userId,
        newQuestion,
        user?.firstName || 'Anonymous'
      );
      setQuestions((prev) => [created, ...prev]);
      setNewQuestion('');
      setShowQuestionForm(false);
      if (statistics) {
        setStatistics({ ...statistics, totalQuestions: statistics.totalQuestions + 1 });
      }
    } catch (error) {
      console.error('Failed to submit question:', error);
    } finally {
      setSubmitting(false);
    }
  };

  // Upvote question
  const handleUpvote = async (questionId: string) => {
    if (!userId) return;
    try {
      const updated = await productQAApi.upvoteQuestion(questionId, userId);
      setQuestions((prev) => prev.map((q) => (q.id === questionId ? updated : q)));
    } catch (error) {
      console.error('Failed to upvote:', error);
    }
  };

  // Submit answer
  const handleSubmitAnswer = async (questionId: string, answerText: string) => {
    if (!userId) return;
    await productQAApi.submitAnswer(questionId, userId, answerText, user?.firstName || 'Anonymous');
    // Update question answer count
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === questionId
          ? { ...q, answerCount: q.answerCount + 1, status: 'ANSWERED' as const }
          : q
      )
    );
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className} data-testid="product-qa-section">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-gray-600" />
            <CardTitle className="text-lg">
              Questions & Answers
              {statistics && (
                <span className="text-sm font-normal text-gray-500 ml-2">
                  ({statistics.totalQuestions} questions, {statistics.answeredQuestions} answered)
                </span>
              )}
            </CardTitle>
          </div>
          {isAuthenticated && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowQuestionForm(!showQuestionForm)}
            >
              Ask a Question
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {/* Search bar */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10"
            />
          </div>
          <Button variant="secondary" onClick={handleSearch}>
            Search
          </Button>
        </div>

        {/* Ask question form */}
        {showQuestionForm && isAuthenticated && (
          <form onSubmit={handleSubmitQuestion} className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium mb-2">Ask about {productName || 'this product'}</h3>
            <Textarea
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              placeholder="What would you like to know about this product?"
              rows={3}
              className="w-full mb-3"
              disabled={submitting}
            />
            <div className="flex gap-2">
              <Button type="submit" disabled={submitting || !newQuestion.trim()}>
                {submitting ? 'Submitting...' : 'Submit Question'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowQuestionForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        )}

        {/* Login prompt for non-authenticated users */}
        {!isAuthenticated && !showQuestionForm && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
            <a href="/login" className="font-medium hover:underline">
              Sign in
            </a>{' '}
            to ask a question or answer others.
          </div>
        )}

        {/* Questions list */}
        <div className="divide-y" role="list" aria-label="Product questions">
          {questions.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="font-medium">No questions yet</p>
              <p className="text-sm mt-1">Be the first to ask about this product!</p>
            </div>
          ) : (
            questions.map((question) => (
              <QuestionItem
                key={question.id}
                question={question}
                userId={userId}
                onUpvote={handleUpvote}
                onSubmitAnswer={handleSubmitAnswer}
              />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default ProductQA;
