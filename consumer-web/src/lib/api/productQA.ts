import { api } from './client';

/**
 * Product Q&A types
 */
export interface ProductQuestion {
  id: string;
  tenantId: string;
  productId: string;
  userId: string;
  userName: string;
  questionText: string;
  status: 'PENDING' | 'APPROVED' | 'ANSWERED' | 'REJECTED';
  upvoteCount: number;
  upvotedBy: string[];
  answerCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductAnswer {
  id: string;
  tenantId: string;
  questionId: string;
  productId: string;
  userId: string;
  userName: string;
  answerText: string;
  isSellerAnswer: boolean;
  isVerified: boolean;
  helpfulCount: number;
  notHelpfulCount: number;
  helpfulVotedBy: string[];
  createdAt: string;
  updatedAt: string;
}

export interface QAStatistics {
  totalQuestions: number;
  answeredQuestions: number;
  pendingQuestions: number;
}

const BASE_URL = '/api/v1/qa';

/**
 * Submit a new question for a product
 */
export async function submitQuestion(
  productId: string,
  userId: string,
  questionText: string,
  userName?: string
): Promise<ProductQuestion> {
  return api.post<ProductQuestion>(
    `${BASE_URL}/products/${productId}/questions?userId=${userId}`,
    { questionText, userName }
  );
}

/**
 * Get all questions for a product
 */
export async function getProductQuestions(productId: string): Promise<ProductQuestion[]> {
  return api.get<ProductQuestion[]>(`${BASE_URL}/products/${productId}/questions`);
}

/**
 * Search questions by text
 */
export async function searchQuestions(productId: string, query: string): Promise<ProductQuestion[]> {
  return api.get<ProductQuestion[]>(`${BASE_URL}/products/${productId}/questions/search`, {
    params: { query },
  });
}

/**
 * Get Q&A statistics for a product
 */
export async function getQAStatistics(productId: string): Promise<QAStatistics> {
  return api.get<QAStatistics>(`${BASE_URL}/products/${productId}/statistics`);
}

/**
 * Get questions asked by a user
 */
export async function getUserQuestions(userId: string): Promise<ProductQuestion[]> {
  return api.get<ProductQuestion[]>(`${BASE_URL}/users/${userId}/questions`);
}

/**
 * Upvote a question
 */
export async function upvoteQuestion(questionId: string, userId: string): Promise<ProductQuestion> {
  return api.post<ProductQuestion>(`${BASE_URL}/questions/${questionId}/upvote?userId=${userId}`);
}

/**
 * Remove upvote from a question
 */
export async function removeUpvote(questionId: string, userId: string): Promise<ProductQuestion> {
  return api.delete<ProductQuestion>(`${BASE_URL}/questions/${questionId}/upvote?userId=${userId}`);
}

/**
 * Submit an answer to a question
 */
export async function submitAnswer(
  questionId: string,
  userId: string,
  answerText: string,
  userName?: string,
  isSeller = false
): Promise<ProductAnswer> {
  return api.post<ProductAnswer>(
    `${BASE_URL}/questions/${questionId}/answers?userId=${userId}&isSeller=${isSeller}`,
    { answerText, userName }
  );
}

/**
 * Get all answers for a question
 */
export async function getQuestionAnswers(questionId: string): Promise<ProductAnswer[]> {
  return api.get<ProductAnswer[]>(`${BASE_URL}/questions/${questionId}/answers`);
}

/**
 * Mark an answer as helpful
 */
export async function markAnswerHelpful(answerId: string, userId: string): Promise<ProductAnswer> {
  return api.post<ProductAnswer>(`${BASE_URL}/answers/${answerId}/helpful?userId=${userId}`);
}

/**
 * Mark an answer as not helpful
 */
export async function markAnswerNotHelpful(answerId: string): Promise<ProductAnswer> {
  return api.post<ProductAnswer>(`${BASE_URL}/answers/${answerId}/not-helpful`);
}

export const productQAApi = {
  submitQuestion,
  getProductQuestions,
  searchQuestions,
  getQAStatistics,
  getUserQuestions,
  upvoteQuestion,
  removeUpvote,
  submitAnswer,
  getQuestionAnswers,
  markAnswerHelpful,
  markAnswerNotHelpful,
};
