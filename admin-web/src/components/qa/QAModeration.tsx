import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle,
  XCircle,
  ShieldCheck,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  ThumbsUp,
  Clock,
  User,
  AlertCircle,
  Trash2,
  Search,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { qaApi, type ProductQuestion, type ProductAnswer } from '@/lib/api/qa';

export type ModerationTab = 'pending' | 'all';
export type FilterStatus = 'ALL' | 'PENDING' | 'APPROVED' | 'ANSWERED' | 'REJECTED';

interface QAModerationProps {
  className?: string;
  onApprove?: (questionId: string) => Promise<void>;
  onReject?: (questionId: string) => Promise<void>;
  onVerify?: (answerId: string) => Promise<void>;
  onDelete?: (questionId: string) => Promise<void>;
}

export default function QAModeration({
  className = '',
  onApprove,
  onReject,
  onVerify,
  onDelete,
}: QAModerationProps) {
  const [questions, setQuestions] = useState<ProductQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ModerationTab>('pending');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());
  const [questionAnswers, setQuestionAnswers] = useState<Record<string, ProductAnswer[]>>({});
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  const fetchQuestions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = activeTab === 'pending'
        ? await qaApi.getPendingQuestions()
        : await qaApi.getAllQuestions();
      setQuestions(data);
    } catch (err) {
      setError('Failed to load questions');
      console.error('Error loading questions:', err);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const fetchAnswers = async (questionId: string) => {
    try {
      const answers = await qaApi.getQuestionAnswers(questionId);
      setQuestionAnswers(prev => ({ ...prev, [questionId]: answers }));
    } catch (err) {
      console.error('Error loading answers:', err);
    }
  };

  const toggleExpanded = (questionId: string) => {
    const newExpanded = new Set(expandedQuestions);
    if (newExpanded.has(questionId)) {
      newExpanded.delete(questionId);
    } else {
      newExpanded.add(questionId);
      if (!questionAnswers[questionId]) {
        fetchAnswers(questionId);
      }
    }
    setExpandedQuestions(newExpanded);
  };

  const handleApprove = async (questionId: string) => {
    setProcessingIds(prev => new Set(prev).add(questionId));
    try {
      if (onApprove) {
        await onApprove(questionId);
      } else {
        await qaApi.approveQuestion(questionId);
      }
      setQuestions(prev => prev.map(q =>
        q.id === questionId ? { ...q, status: 'APPROVED' as const } : q
      ));
    } catch (err) {
      console.error('Error approving question:', err);
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(questionId);
        return newSet;
      });
    }
  };

  const handleReject = async (questionId: string) => {
    setProcessingIds(prev => new Set(prev).add(questionId));
    try {
      if (onReject) {
        await onReject(questionId);
      } else {
        await qaApi.rejectQuestion(questionId);
      }
      setQuestions(prev => prev.map(q =>
        q.id === questionId ? { ...q, status: 'REJECTED' as const } : q
      ));
    } catch (err) {
      console.error('Error rejecting question:', err);
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(questionId);
        return newSet;
      });
    }
  };

  const handleVerify = async (answerId: string, questionId: string) => {
    setProcessingIds(prev => new Set(prev).add(answerId));
    try {
      if (onVerify) {
        await onVerify(answerId);
      } else {
        await qaApi.verifyAnswer(answerId);
      }
      setQuestionAnswers(prev => ({
        ...prev,
        [questionId]: prev[questionId]?.map(a =>
          a.id === answerId ? { ...a, isVerified: true } : a
        ) || [],
      }));
    } catch (err) {
      console.error('Error verifying answer:', err);
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(answerId);
        return newSet;
      });
    }
  };

  const handleDelete = async (questionId: string) => {
    if (!confirm('Are you sure you want to delete this question?')) {
      return;
    }
    setProcessingIds(prev => new Set(prev).add(questionId));
    try {
      if (onDelete) {
        await onDelete(questionId);
      } else {
        await qaApi.deleteQuestion(questionId);
      }
      setQuestions(prev => prev.filter(q => q.id !== questionId));
    } catch (err) {
      console.error('Error deleting question:', err);
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(questionId);
        return newSet;
      });
    }
  };

  const filteredQuestions = questions.filter(q => {
    const matchesStatus = filterStatus === 'ALL' || q.status === filterStatus;
    const matchesSearch = !searchQuery ||
      q.questionText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.userName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: ProductQuestion['status']) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'APPROVED':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Approved</Badge>;
      case 'ANSWERED':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Answered</Badge>;
      case 'REJECTED':
        return <Badge variant="secondary" className="bg-red-100 text-red-800">Rejected</Badge>;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`} data-testid="qa-moderation">
        <Card className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${className}`} data-testid="qa-moderation">
        <Card className="p-6">
          <div className="text-center text-red-600">
            <AlertCircle className="w-12 h-12 mx-auto mb-2" />
            <p>{error}</p>
            <Button onClick={fetchQuestions} className="mt-4" variant="outline">
              Try Again
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`} data-testid="qa-moderation">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Q&A Moderation</h1>
        <Button onClick={fetchQuestions} variant="outline" size="sm" data-testid="refresh-btn">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <Button
          variant={activeTab === 'pending' ? 'default' : 'outline'}
          onClick={() => setActiveTab('pending')}
          data-testid="tab-pending"
        >
          <Clock className="w-4 h-4 mr-2" />
          Pending Review
        </Button>
        <Button
          variant={activeTab === 'all' ? 'default' : 'outline'}
          onClick={() => setActiveTab('all')}
          data-testid="tab-all"
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          All Questions
        </Button>
      </div>

      {/* Search and Filter */}
      <Card className="p-4">
        <div className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              data-testid="search-input"
            />
          </div>
          {activeTab === 'all' && (
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                data-testid="filter-status"
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="ANSWERED">Answered</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
          )}
        </div>
      </Card>

      {/* Questions List */}
      <Card>
        {filteredQuestions.length === 0 ? (
          <div className="p-8 text-center text-gray-500" data-testid="empty-state">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p className="font-medium">No questions found</p>
            <p className="text-sm mt-1">
              {activeTab === 'pending'
                ? 'All questions have been reviewed'
                : 'No questions match your search criteria'}
            </p>
          </div>
        ) : (
          <div className="divide-y" data-testid="questions-list">
            {filteredQuestions.map((question) => (
              <div
                key={question.id}
                className="p-4"
                data-testid={`question-${question.id}`}
              >
                {/* Question Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-sm">{question.userName}</span>
                      <span className="text-gray-400">|</span>
                      <span className="text-sm text-gray-500">{formatDate(question.createdAt)}</span>
                      {getStatusBadge(question.status)}
                    </div>
                    <p className="text-gray-900">{question.questionText}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="w-4 h-4" />
                        {question.upvoteCount} upvotes
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-4 h-4" />
                        {question.answerCount} answers
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    {question.status === 'PENDING' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          onClick={() => handleApprove(question.id)}
                          disabled={processingIds.has(question.id)}
                          data-testid={`approve-${question.id}`}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleReject(question.id)}
                          disabled={processingIds.has(question.id)}
                          data-testid={`reject-${question.id}`}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleDelete(question.id)}
                      disabled={processingIds.has(question.id)}
                      data-testid={`delete-${question.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    {question.answerCount > 0 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleExpanded(question.id)}
                        data-testid={`expand-${question.id}`}
                      >
                        {expandedQuestions.has(question.id) ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Answers Section */}
                {expandedQuestions.has(question.id) && (
                  <div className="mt-4 pl-6 border-l-2 border-gray-200 space-y-4" data-testid={`answers-${question.id}`}>
                    {questionAnswers[question.id]?.map((answer) => (
                      <div key={answer.id} className="bg-gray-50 rounded-lg p-4" data-testid={`answer-${answer.id}`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-medium text-sm">{answer.userName}</span>
                              {answer.isSellerAnswer && (
                                <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                                  Seller
                                </Badge>
                              )}
                              {answer.isVerified && (
                                <Badge variant="secondary" className="bg-green-100 text-green-800">
                                  <ShieldCheck className="w-3 h-3 mr-1" />
                                  Verified
                                </Badge>
                              )}
                            </div>
                            <p className="text-gray-700">{answer.answerText}</p>
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                              <span>{answer.helpfulCount} found helpful</span>
                              <span>{formatDate(answer.createdAt)}</span>
                            </div>
                          </div>
                          {!answer.isVerified && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={() => handleVerify(answer.id, question.id)}
                              disabled={processingIds.has(answer.id)}
                              data-testid={`verify-${answer.id}`}
                            >
                              <ShieldCheck className="w-4 h-4 mr-1" />
                              Verify
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Stats Footer */}
      <Card className="p-4">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            Showing {filteredQuestions.length} of {questions.length} questions
          </span>
          <span>
            {questions.filter(q => q.status === 'PENDING').length} pending review
          </span>
        </div>
      </Card>
    </div>
  );
}
