import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ProductQA } from './ProductQA';
import * as productQAApi from '@/lib/api/productQA';
import * as userStore from '@/store/userStore';
import type { ProductQuestion, ProductAnswer, QAStatistics } from '@/lib/api/productQA';

// Mock the API
vi.mock('@/lib/api/productQA', () => ({
  productQAApi: {
    getProductQuestions: vi.fn(),
    getQAStatistics: vi.fn(),
    searchQuestions: vi.fn(),
    submitQuestion: vi.fn(),
    upvoteQuestion: vi.fn(),
    removeUpvote: vi.fn(),
    getQuestionAnswers: vi.fn(),
    submitAnswer: vi.fn(),
    markAnswerHelpful: vi.fn(),
    markAnswerNotHelpful: vi.fn(),
  },
}));

// Mock the user store
vi.mock('@/store/userStore', () => ({
  useUserStore: vi.fn(),
}));

const mockQuestions: ProductQuestion[] = [
  {
    id: 'q1',
    tenantId: 'tenant-1',
    productId: 'prod-1',
    userId: 'user-1',
    userName: 'John Doe',
    questionText: 'Does this product come with a warranty?',
    status: 'ANSWERED',
    upvoteCount: 5,
    upvotedBy: ['user-2', 'user-3'],
    answerCount: 2,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T12:00:00Z',
  },
  {
    id: 'q2',
    tenantId: 'tenant-1',
    productId: 'prod-1',
    userId: 'user-2',
    userName: 'Jane Smith',
    questionText: 'Is this compatible with other devices?',
    status: 'APPROVED',
    upvoteCount: 2,
    upvotedBy: [],
    answerCount: 0,
    createdAt: '2024-01-14T08:00:00Z',
    updatedAt: '2024-01-14T08:00:00Z',
  },
];

const mockAnswers: ProductAnswer[] = [
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

const mockStatistics: QAStatistics = {
  totalQuestions: 2,
  answeredQuestions: 1,
  pendingQuestions: 0,
};

const renderWithRouter = (component: React.ReactElement) => {
  return render(<MemoryRouter>{component}</MemoryRouter>);
};

describe('ProductQA', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementations
    vi.mocked(productQAApi.productQAApi.getProductQuestions).mockResolvedValue(mockQuestions);
    vi.mocked(productQAApi.productQAApi.getQAStatistics).mockResolvedValue(mockStatistics);
    vi.mocked(productQAApi.productQAApi.getQuestionAnswers).mockResolvedValue(mockAnswers);

    vi.mocked(userStore.useUserStore).mockReturnValue({
      user: { id: 'user-5', firstName: 'Test User', email: 'test@test.com' } as unknown,
      token: 'token',
      isAuthenticated: true,
      setUser: vi.fn(),
      setToken: vi.fn(),
      login: vi.fn(),
      logout: vi.fn(),
      updateUser: vi.fn(),
    } as ReturnType<typeof userStore.useUserStore>);
  });

  describe('Rendering', () => {
    it('should render the Q&A section', async () => {
      renderWithRouter(<ProductQA productId="prod-1" />);

      await waitFor(() => {
        expect(screen.getByTestId('product-qa-section')).toBeInTheDocument();
      });

      expect(screen.getByText('Questions & Answers')).toBeInTheDocument();
    });

    it('should display statistics', async () => {
      renderWithRouter(<ProductQA productId="prod-1" />);

      await waitFor(() => {
        expect(screen.getByText(/2 questions, 1 answered/)).toBeInTheDocument();
      });
    });

    it('should display questions', async () => {
      renderWithRouter(<ProductQA productId="prod-1" />);

      await waitFor(() => {
        expect(screen.getByText('Does this product come with a warranty?')).toBeInTheDocument();
        expect(screen.getByText('Is this compatible with other devices?')).toBeInTheDocument();
      });
    });

    it('should show "Answered" badge for answered questions', async () => {
      renderWithRouter(<ProductQA productId="prod-1" />);

      await waitFor(() => {
        expect(screen.getByText('Answered')).toBeInTheDocument();
      });
    });

    it('should display upvote counts', async () => {
      renderWithRouter(<ProductQA productId="prod-1" />);

      await waitFor(() => {
        expect(screen.getByText('5')).toBeInTheDocument(); // First question upvotes
      });
    });
  });

  describe('Ask Question', () => {
    it('should show "Ask a Question" button for authenticated users', async () => {
      renderWithRouter(<ProductQA productId="prod-1" />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Ask a Question' })).toBeInTheDocument();
      });
    });

    it('should show question form when button is clicked', async () => {
      renderWithRouter(<ProductQA productId="prod-1" />);

      await waitFor(() => {
        expect(screen.getByTestId('product-qa-section')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByRole('button', { name: 'Ask a Question' }));

      expect(screen.getByPlaceholderText('What would you like to know about this product?')).toBeInTheDocument();
    });

    it('should submit a new question', async () => {
      const newQuestion: ProductQuestion = {
        id: 'q-new',
        tenantId: 'tenant-1',
        productId: 'prod-1',
        userId: 'user-5',
        userName: 'Test User',
        questionText: 'New test question?',
        status: 'PENDING',
        upvoteCount: 0,
        upvotedBy: [],
        answerCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      vi.mocked(productQAApi.productQAApi.submitQuestion).mockResolvedValue(newQuestion);

      renderWithRouter(<ProductQA productId="prod-1" productName="Test Product" />);

      await waitFor(() => {
        expect(screen.getByTestId('product-qa-section')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByRole('button', { name: 'Ask a Question' }));

      const textarea = screen.getByPlaceholderText('What would you like to know about this product?');
      await userEvent.type(textarea, 'New test question?');

      await userEvent.click(screen.getByRole('button', { name: 'Submit Question' }));

      await waitFor(() => {
        expect(productQAApi.productQAApi.submitQuestion).toHaveBeenCalledWith(
          'prod-1',
          'user-5',
          'New test question?',
          'Test User'
        );
      });
    });
  });

  describe('Search', () => {
    it('should have a search input', async () => {
      renderWithRouter(<ProductQA productId="prod-1" />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search questions...')).toBeInTheDocument();
      });
    });

    it('should search questions on button click', async () => {
      vi.mocked(productQAApi.productQAApi.searchQuestions).mockResolvedValue([mockQuestions[0]]);

      renderWithRouter(<ProductQA productId="prod-1" />);

      await waitFor(() => {
        expect(screen.getByTestId('product-qa-section')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search questions...');
      await userEvent.type(searchInput, 'warranty');

      await userEvent.click(screen.getByRole('button', { name: 'Search' }));

      await waitFor(() => {
        expect(productQAApi.productQAApi.searchQuestions).toHaveBeenCalledWith('prod-1', 'warranty');
      });
    });
  });

  describe('Upvoting', () => {
    it('should upvote a question', async () => {
      const updatedQuestion = { ...mockQuestions[1], upvoteCount: 3, upvotedBy: ['user-5'] };
      vi.mocked(productQAApi.productQAApi.upvoteQuestion).mockResolvedValue(updatedQuestion);

      renderWithRouter(<ProductQA productId="prod-1" />);

      await waitFor(() => {
        expect(screen.getByTestId('product-qa-section')).toBeInTheDocument();
      });

      const upvoteButtons = screen.getAllByLabelText(/Upvote question/);
      await userEvent.click(upvoteButtons[1]); // Upvote second question

      await waitFor(() => {
        expect(productQAApi.productQAApi.upvoteQuestion).toHaveBeenCalledWith('q2', 'user-5');
      });
    });
  });

  describe('Answers', () => {
    it('should expand answers when clicked', async () => {
      renderWithRouter(<ProductQA productId="prod-1" />);

      await waitFor(() => {
        expect(screen.getByText('2 answers')).toBeInTheDocument();
      });

      const answersButton = screen.getByText('2 answers');
      await userEvent.click(answersButton);

      // Wait for the answer content to appear, which confirms the API was called
      await waitFor(() => {
        expect(screen.getByText('Yes, this product comes with a 2-year warranty.')).toBeInTheDocument();
      });

      expect(productQAApi.productQAApi.getQuestionAnswers).toHaveBeenCalledWith('q1');
    });

    it('should display seller badge on seller answers', async () => {
      renderWithRouter(<ProductQA productId="prod-1" />);

      await waitFor(() => {
        expect(screen.getByText('2 answers')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByText('2 answers'));

      await waitFor(() => {
        expect(screen.getByText('Seller')).toBeInTheDocument();
      });
    });

    it('should display verified badge on verified answers', async () => {
      renderWithRouter(<ProductQA productId="prod-1" />);

      await waitFor(() => {
        expect(screen.getByText('2 answers')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByText('2 answers'));

      await waitFor(() => {
        expect(screen.getByText('Verified')).toBeInTheDocument();
      });
    });
  });

  describe('Empty State', () => {
    it('should display empty state when no questions', async () => {
      vi.mocked(productQAApi.productQAApi.getProductQuestions).mockResolvedValue([]);
      vi.mocked(productQAApi.productQAApi.getQAStatistics).mockResolvedValue({
        totalQuestions: 0,
        answeredQuestions: 0,
        pendingQuestions: 0,
      });

      renderWithRouter(<ProductQA productId="prod-1" />);

      await waitFor(() => {
        expect(screen.getByText('No questions yet')).toBeInTheDocument();
        expect(screen.getByText('Be the first to ask about this product!')).toBeInTheDocument();
      });
    });
  });

  describe('Unauthenticated User', () => {
    it('should show login prompt for unauthenticated users', async () => {
      vi.mocked(userStore.useUserStore).mockReturnValue({
        user: null,
        token: null,
        isAuthenticated: false,
        setUser: vi.fn(),
        setToken: vi.fn(),
        login: vi.fn(),
        logout: vi.fn(),
        updateUser: vi.fn(),
      });

      renderWithRouter(<ProductQA productId="prod-1" />);

      await waitFor(() => {
        expect(screen.getByText('Sign in')).toBeInTheDocument();
      });
    });

    it('should not show "Ask a Question" button for unauthenticated users', async () => {
      vi.mocked(userStore.useUserStore).mockReturnValue({
        user: null,
        token: null,
        isAuthenticated: false,
        setUser: vi.fn(),
        setToken: vi.fn(),
        login: vi.fn(),
        logout: vi.fn(),
        updateUser: vi.fn(),
      });

      renderWithRouter(<ProductQA productId="prod-1" />);

      await waitFor(() => {
        expect(screen.getByTestId('product-qa-section')).toBeInTheDocument();
      });

      expect(screen.queryByRole('button', { name: 'Ask a Question' })).not.toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should show loading skeleton while fetching data', () => {
      // Don't resolve the promises immediately
      vi.mocked(productQAApi.productQAApi.getProductQuestions).mockImplementation(
        () => new Promise(() => {})
      );
      vi.mocked(productQAApi.productQAApi.getQAStatistics).mockImplementation(
        () => new Promise(() => {})
      );

      renderWithRouter(<ProductQA productId="prod-1" />);

      // Should see skeleton elements (identified by animate-pulse class)
      expect(document.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
    });
  });
});
