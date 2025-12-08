import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import QAModeration from './QAModeration';
import * as qaApi from '@/lib/api/qa';

// Mock the API
vi.mock('@/lib/api/qa', () => ({
  qaApi: {
    getPendingQuestions: vi.fn(),
    getAllQuestions: vi.fn(),
    approveQuestion: vi.fn(),
    rejectQuestion: vi.fn(),
    verifyAnswer: vi.fn(),
    getQuestionAnswers: vi.fn(),
    deleteQuestion: vi.fn(),
  },
}));

const mockPendingQuestions: qaApi.ProductQuestion[] = [
  {
    id: 'q1',
    tenantId: 'tenant-1',
    productId: 'prod-1',
    userId: 'user-1',
    userName: 'John Doe',
    questionText: 'Does this product come with a warranty?',
    status: 'PENDING',
    upvoteCount: 5,
    upvotedBy: ['user-2', 'user-3'],
    answerCount: 2,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'q2',
    tenantId: 'tenant-1',
    productId: 'prod-1',
    userId: 'user-2',
    userName: 'Jane Smith',
    questionText: 'Is this compatible with other devices?',
    status: 'PENDING',
    upvoteCount: 2,
    upvotedBy: [],
    answerCount: 0,
    createdAt: '2024-01-14T08:00:00Z',
    updatedAt: '2024-01-14T08:00:00Z',
  },
];

const mockAllQuestions: qaApi.ProductQuestion[] = [
  ...mockPendingQuestions,
  {
    id: 'q3',
    tenantId: 'tenant-1',
    productId: 'prod-2',
    userId: 'user-3',
    userName: 'Bob Wilson',
    questionText: 'What are the dimensions?',
    status: 'APPROVED',
    upvoteCount: 10,
    upvotedBy: ['user-1', 'user-2'],
    answerCount: 1,
    createdAt: '2024-01-13T09:00:00Z',
    updatedAt: '2024-01-13T09:00:00Z',
  },
  {
    id: 'q4',
    tenantId: 'tenant-1',
    productId: 'prod-3',
    userId: 'user-4',
    userName: 'Alice Brown',
    questionText: 'Does it support fast charging?',
    status: 'ANSWERED',
    upvoteCount: 8,
    upvotedBy: [],
    answerCount: 3,
    createdAt: '2024-01-12T14:00:00Z',
    updatedAt: '2024-01-12T14:00:00Z',
  },
  {
    id: 'q5',
    tenantId: 'tenant-1',
    productId: 'prod-1',
    userId: 'user-5',
    userName: 'Charlie Davis',
    questionText: 'This is spam?',
    status: 'REJECTED',
    upvoteCount: 0,
    upvotedBy: [],
    answerCount: 0,
    createdAt: '2024-01-11T11:00:00Z',
    updatedAt: '2024-01-11T11:00:00Z',
  },
];

const mockAnswers: qaApi.ProductAnswer[] = [
  {
    id: 'a1',
    tenantId: 'tenant-1',
    questionId: 'q1',
    productId: 'prod-1',
    userId: 'seller-1',
    userName: 'Store Support',
    answerText: 'Yes, this product comes with a 2-year warranty.',
    isSellerAnswer: true,
    isVerified: true,
    helpfulCount: 10,
    notHelpfulCount: 1,
    helpfulVotedBy: ['user-1'],
    createdAt: '2024-01-15T11:00:00Z',
    updatedAt: '2024-01-15T11:00:00Z',
  },
  {
    id: 'a2',
    tenantId: 'tenant-1',
    questionId: 'q1',
    productId: 'prod-1',
    userId: 'user-4',
    userName: 'Customer',
    answerText: 'I can confirm, got my warranty card in the box.',
    isSellerAnswer: false,
    isVerified: false,
    helpfulCount: 3,
    notHelpfulCount: 0,
    helpfulVotedBy: [],
    createdAt: '2024-01-15T12:00:00Z',
    updatedAt: '2024-01-15T12:00:00Z',
  },
];

describe('QAModeration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(qaApi.qaApi.getPendingQuestions).mockResolvedValue(mockPendingQuestions);
    vi.mocked(qaApi.qaApi.getAllQuestions).mockResolvedValue(mockAllQuestions);
    vi.mocked(qaApi.qaApi.getQuestionAnswers).mockResolvedValue(mockAnswers);
  });

  describe('Rendering', () => {
    it('should render the Q&A moderation section', async () => {
      render(<QAModeration />);

      await waitFor(() => {
        expect(screen.getByTestId('qa-moderation')).toBeInTheDocument();
      });

      expect(screen.getByText('Q&A Moderation')).toBeInTheDocument();
    });

    it('should display pending questions by default', async () => {
      render(<QAModeration />);

      await waitFor(() => {
        expect(screen.getByText('Does this product come with a warranty?')).toBeInTheDocument();
        expect(screen.getByText('Is this compatible with other devices?')).toBeInTheDocument();
      });

      expect(qaApi.qaApi.getPendingQuestions).toHaveBeenCalled();
    });

    it('should display user names with questions', async () => {
      render(<QAModeration />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      });
    });

    it('should display upvote counts', async () => {
      render(<QAModeration />);

      await waitFor(() => {
        expect(screen.getByText('5 upvotes')).toBeInTheDocument();
        expect(screen.getByText('2 upvotes')).toBeInTheDocument();
      });
    });

    it('should display answer counts', async () => {
      render(<QAModeration />);

      await waitFor(() => {
        expect(screen.getByText('2 answers')).toBeInTheDocument();
        expect(screen.getByText('0 answers')).toBeInTheDocument();
      });
    });

    it('should show Pending badge for pending questions', async () => {
      render(<QAModeration />);

      await waitFor(() => {
        const badges = screen.getAllByText('Pending');
        expect(badges.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Tab Navigation', () => {
    it('should switch to all questions when tab is clicked', async () => {
      const user = userEvent.setup();
      render(<QAModeration />);

      await waitFor(() => {
        expect(screen.getByTestId('qa-moderation')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('tab-all'));

      await waitFor(() => {
        expect(qaApi.qaApi.getAllQuestions).toHaveBeenCalled();
      });
    });

    it('should show status filter only on all questions tab', async () => {
      const user = userEvent.setup();
      render(<QAModeration />);

      await waitFor(() => {
        expect(screen.getByTestId('qa-moderation')).toBeInTheDocument();
      });

      // Filter should not be visible on pending tab
      expect(screen.queryByTestId('filter-status')).not.toBeInTheDocument();

      // Switch to all tab
      await user.click(screen.getByTestId('tab-all'));

      await waitFor(() => {
        expect(screen.getByTestId('filter-status')).toBeInTheDocument();
      });
    });

    it('should switch back to pending questions', async () => {
      const user = userEvent.setup();
      render(<QAModeration />);

      await waitFor(() => {
        expect(screen.getByTestId('qa-moderation')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('tab-all'));
      await waitFor(() => {
        expect(qaApi.qaApi.getAllQuestions).toHaveBeenCalled();
      });

      await user.click(screen.getByTestId('tab-pending'));

      await waitFor(() => {
        expect(qaApi.qaApi.getPendingQuestions).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Approve and Reject', () => {
    it('should show approve and reject buttons for pending questions', async () => {
      render(<QAModeration />);

      await waitFor(() => {
        expect(screen.getByTestId('approve-q1')).toBeInTheDocument();
        expect(screen.getByTestId('reject-q1')).toBeInTheDocument();
      });
    });

    it('should call approve API when approve button is clicked', async () => {
      const user = userEvent.setup();
      const updatedQuestion = { ...mockPendingQuestions[0], status: 'APPROVED' as const };
      vi.mocked(qaApi.qaApi.approveQuestion).mockResolvedValue(updatedQuestion);

      render(<QAModeration />);

      await waitFor(() => {
        expect(screen.getByTestId('approve-q1')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('approve-q1'));

      await waitFor(() => {
        expect(qaApi.qaApi.approveQuestion).toHaveBeenCalledWith('q1');
      });
    });

    it('should call reject API when reject button is clicked', async () => {
      const user = userEvent.setup();
      const updatedQuestion = { ...mockPendingQuestions[0], status: 'REJECTED' as const };
      vi.mocked(qaApi.qaApi.rejectQuestion).mockResolvedValue(updatedQuestion);

      render(<QAModeration />);

      await waitFor(() => {
        expect(screen.getByTestId('reject-q1')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('reject-q1'));

      await waitFor(() => {
        expect(qaApi.qaApi.rejectQuestion).toHaveBeenCalledWith('q1');
      });
    });

    it('should use custom onApprove handler if provided', async () => {
      const user = userEvent.setup();
      const onApprove = vi.fn().mockResolvedValue(undefined);

      render(<QAModeration onApprove={onApprove} />);

      await waitFor(() => {
        expect(screen.getByTestId('approve-q1')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('approve-q1'));

      await waitFor(() => {
        expect(onApprove).toHaveBeenCalledWith('q1');
        expect(qaApi.qaApi.approveQuestion).not.toHaveBeenCalled();
      });
    });

    it('should use custom onReject handler if provided', async () => {
      const user = userEvent.setup();
      const onReject = vi.fn().mockResolvedValue(undefined);

      render(<QAModeration onReject={onReject} />);

      await waitFor(() => {
        expect(screen.getByTestId('reject-q1')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('reject-q1'));

      await waitFor(() => {
        expect(onReject).toHaveBeenCalledWith('q1');
        expect(qaApi.qaApi.rejectQuestion).not.toHaveBeenCalled();
      });
    });

    it('should update question status after approval', async () => {
      const user = userEvent.setup();
      const updatedQuestion = { ...mockPendingQuestions[0], status: 'APPROVED' as const };
      vi.mocked(qaApi.qaApi.approveQuestion).mockResolvedValue(updatedQuestion);

      render(<QAModeration />);

      await waitFor(() => {
        expect(screen.getByTestId('approve-q1')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('approve-q1'));

      await waitFor(() => {
        const questionElement = screen.getByTestId('question-q1');
        expect(questionElement).toContainElement(screen.getByText('Approved'));
      });
    });
  });

  describe('Search', () => {
    it('should have a search input', async () => {
      render(<QAModeration />);

      await waitFor(() => {
        expect(screen.getByTestId('search-input')).toBeInTheDocument();
      });
    });

    it('should filter questions by search query', async () => {
      const user = userEvent.setup();
      render(<QAModeration />);

      await waitFor(() => {
        expect(screen.getByTestId('search-input')).toBeInTheDocument();
      });

      await user.type(screen.getByTestId('search-input'), 'warranty');

      await waitFor(() => {
        expect(screen.getByText('Does this product come with a warranty?')).toBeInTheDocument();
        expect(screen.queryByText('Is this compatible with other devices?')).not.toBeInTheDocument();
      });
    });

    it('should filter questions by user name', async () => {
      const user = userEvent.setup();
      render(<QAModeration />);

      await waitFor(() => {
        expect(screen.getByTestId('search-input')).toBeInTheDocument();
      });

      await user.type(screen.getByTestId('search-input'), 'Jane');

      await waitFor(() => {
        expect(screen.queryByText('Does this product come with a warranty?')).not.toBeInTheDocument();
        expect(screen.getByText('Is this compatible with other devices?')).toBeInTheDocument();
      });
    });
  });

  describe('Status Filter', () => {
    it('should filter by status when on all tab', async () => {
      const user = userEvent.setup();
      render(<QAModeration />);

      await waitFor(() => {
        expect(screen.getByTestId('qa-moderation')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('tab-all'));

      await waitFor(() => {
        expect(screen.getByTestId('filter-status')).toBeInTheDocument();
      });

      await user.selectOptions(screen.getByTestId('filter-status'), 'APPROVED');

      await waitFor(() => {
        expect(screen.getByText('What are the dimensions?')).toBeInTheDocument();
        expect(screen.queryByText('Does this product come with a warranty?')).not.toBeInTheDocument();
      });
    });
  });

  describe('Answers Section', () => {
    it('should expand answers when expand button is clicked', async () => {
      const user = userEvent.setup();
      render(<QAModeration />);

      await waitFor(() => {
        expect(screen.getByTestId('expand-q1')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('expand-q1'));

      await waitFor(() => {
        expect(qaApi.qaApi.getQuestionAnswers).toHaveBeenCalledWith('q1');
        expect(screen.getByTestId('answers-q1')).toBeInTheDocument();
      });
    });

    it('should display answer content', async () => {
      const user = userEvent.setup();
      render(<QAModeration />);

      await waitFor(() => {
        expect(screen.getByTestId('expand-q1')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('expand-q1'));

      await waitFor(() => {
        expect(screen.getByText('Yes, this product comes with a 2-year warranty.')).toBeInTheDocument();
        expect(screen.getByText('I can confirm, got my warranty card in the box.')).toBeInTheDocument();
      });
    });

    it('should display Seller badge for seller answers', async () => {
      const user = userEvent.setup();
      render(<QAModeration />);

      await waitFor(() => {
        expect(screen.getByTestId('expand-q1')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('expand-q1'));

      await waitFor(() => {
        expect(screen.getByText('Seller')).toBeInTheDocument();
      });
    });

    it('should display Verified badge for verified answers', async () => {
      const user = userEvent.setup();
      render(<QAModeration />);

      await waitFor(() => {
        expect(screen.getByTestId('expand-q1')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('expand-q1'));

      await waitFor(() => {
        expect(screen.getByText('Verified')).toBeInTheDocument();
      });
    });

    it('should show verify button for unverified answers', async () => {
      const user = userEvent.setup();
      render(<QAModeration />);

      await waitFor(() => {
        expect(screen.getByTestId('expand-q1')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('expand-q1'));

      await waitFor(() => {
        expect(screen.getByTestId('verify-a2')).toBeInTheDocument();
      });
    });

    it('should not show verify button for already verified answers', async () => {
      const user = userEvent.setup();
      render(<QAModeration />);

      await waitFor(() => {
        expect(screen.getByTestId('expand-q1')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('expand-q1'));

      await waitFor(() => {
        expect(screen.queryByTestId('verify-a1')).not.toBeInTheDocument();
      });
    });

    it('should verify answer when verify button is clicked', async () => {
      const user = userEvent.setup();
      const verifiedAnswer = { ...mockAnswers[1], isVerified: true };
      vi.mocked(qaApi.qaApi.verifyAnswer).mockResolvedValue(verifiedAnswer);

      render(<QAModeration />);

      await waitFor(() => {
        expect(screen.getByTestId('expand-q1')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('expand-q1'));

      await waitFor(() => {
        expect(screen.getByTestId('verify-a2')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('verify-a2'));

      await waitFor(() => {
        expect(qaApi.qaApi.verifyAnswer).toHaveBeenCalledWith('a2');
      });
    });

    it('should collapse answers when clicking expand again', async () => {
      const user = userEvent.setup();
      render(<QAModeration />);

      await waitFor(() => {
        expect(screen.getByTestId('expand-q1')).toBeInTheDocument();
      });

      // Expand
      await user.click(screen.getByTestId('expand-q1'));
      await waitFor(() => {
        expect(screen.getByTestId('answers-q1')).toBeInTheDocument();
      });

      // Collapse
      await user.click(screen.getByTestId('expand-q1'));
      await waitFor(() => {
        expect(screen.queryByTestId('answers-q1')).not.toBeInTheDocument();
      });
    });
  });

  describe('Delete Question', () => {
    it('should show delete button for all questions', async () => {
      render(<QAModeration />);

      await waitFor(() => {
        expect(screen.getByTestId('delete-q1')).toBeInTheDocument();
        expect(screen.getByTestId('delete-q2')).toBeInTheDocument();
      });
    });

    it('should confirm before deleting', async () => {
      const user = userEvent.setup();
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

      render(<QAModeration />);

      await waitFor(() => {
        expect(screen.getByTestId('delete-q1')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('delete-q1'));

      expect(confirmSpy).toHaveBeenCalledWith('Are you sure you want to delete this question?');
      expect(qaApi.qaApi.deleteQuestion).not.toHaveBeenCalled();

      confirmSpy.mockRestore();
    });

    it('should delete question when confirmed', async () => {
      const user = userEvent.setup();
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
      vi.mocked(qaApi.qaApi.deleteQuestion).mockResolvedValue(undefined);

      render(<QAModeration />);

      await waitFor(() => {
        expect(screen.getByTestId('delete-q1')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('delete-q1'));

      await waitFor(() => {
        expect(qaApi.qaApi.deleteQuestion).toHaveBeenCalledWith('q1');
      });

      confirmSpy.mockRestore();
    });

    it('should remove question from list after deletion', async () => {
      const user = userEvent.setup();
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
      vi.mocked(qaApi.qaApi.deleteQuestion).mockResolvedValue(undefined);

      render(<QAModeration />);

      await waitFor(() => {
        expect(screen.getByTestId('question-q1')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('delete-q1'));

      await waitFor(() => {
        expect(screen.queryByTestId('question-q1')).not.toBeInTheDocument();
      });

      confirmSpy.mockRestore();
    });
  });

  describe('Empty State', () => {
    it('should display empty state when no pending questions', async () => {
      vi.mocked(qaApi.qaApi.getPendingQuestions).mockResolvedValue([]);

      render(<QAModeration />);

      await waitFor(() => {
        expect(screen.getByTestId('empty-state')).toBeInTheDocument();
        expect(screen.getByText('No questions found')).toBeInTheDocument();
        expect(screen.getByText('All questions have been reviewed')).toBeInTheDocument();
      });
    });

    it('should display empty state when search has no results', async () => {
      const user = userEvent.setup();
      render(<QAModeration />);

      await waitFor(() => {
        expect(screen.getByTestId('search-input')).toBeInTheDocument();
      });

      await user.type(screen.getByTestId('search-input'), 'nonexistent query xyz');

      await waitFor(() => {
        expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      });
    });
  });

  describe('Loading State', () => {
    it('should show loading skeleton while fetching data', () => {
      vi.mocked(qaApi.qaApi.getPendingQuestions).mockImplementation(
        () => new Promise(() => {})
      );

      render(<QAModeration />);

      expect(document.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
    });
  });

  describe('Error State', () => {
    it('should display error message when API fails', async () => {
      vi.mocked(qaApi.qaApi.getPendingQuestions).mockRejectedValue(new Error('API Error'));

      render(<QAModeration />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load questions')).toBeInTheDocument();
      });
    });

    it('should show retry button on error', async () => {
      vi.mocked(qaApi.qaApi.getPendingQuestions).mockRejectedValue(new Error('API Error'));

      render(<QAModeration />);

      await waitFor(() => {
        expect(screen.getByText('Try Again')).toBeInTheDocument();
      });
    });

    it('should retry fetching when retry button is clicked', async () => {
      const user = userEvent.setup();
      vi.mocked(qaApi.qaApi.getPendingQuestions)
        .mockRejectedValueOnce(new Error('API Error'))
        .mockResolvedValueOnce(mockPendingQuestions);

      render(<QAModeration />);

      await waitFor(() => {
        expect(screen.getByText('Try Again')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Try Again'));

      await waitFor(() => {
        expect(qaApi.qaApi.getPendingQuestions).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Refresh', () => {
    it('should have a refresh button', async () => {
      render(<QAModeration />);

      await waitFor(() => {
        expect(screen.getByTestId('refresh-btn')).toBeInTheDocument();
      });
    });

    it('should refresh questions when refresh button is clicked', async () => {
      const user = userEvent.setup();
      render(<QAModeration />);

      await waitFor(() => {
        expect(screen.getByTestId('refresh-btn')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('refresh-btn'));

      await waitFor(() => {
        expect(qaApi.qaApi.getPendingQuestions).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Stats Footer', () => {
    it('should display question count', async () => {
      render(<QAModeration />);

      await waitFor(() => {
        expect(screen.getByText('Showing 2 of 2 questions')).toBeInTheDocument();
      });
    });

    it('should display pending review count', async () => {
      render(<QAModeration />);

      await waitFor(() => {
        expect(screen.getByText('2 pending review')).toBeInTheDocument();
      });
    });
  });
});
