import { api } from './client';

/**
 * Product Q&A types for admin moderation
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
 * Get all pending questions for moderation
 */
export async function getPendingQuestions(): Promise<ProductQuestion[]> {
  return api.get<ProductQuestion[]>(`${BASE_URL}/admin/pending`);
}

/**
 * Get all questions (for admin view)
 */
export async function getAllQuestions(): Promise<ProductQuestion[]> {
  return api.get<ProductQuestion[]>(`${BASE_URL}/admin/questions`);
}

/**
 * Approve a question
 */
export async function approveQuestion(questionId: string): Promise<ProductQuestion> {
  return api.post<ProductQuestion>(`${BASE_URL}/admin/questions/${questionId}/approve`);
}

/**
 * Reject a question
 */
export async function rejectQuestion(questionId: string): Promise<ProductQuestion> {
  return api.post<ProductQuestion>(`${BASE_URL}/admin/questions/${questionId}/reject`);
}

/**
 * Verify an answer (mark as verified by admin/seller)
 */
export async function verifyAnswer(answerId: string): Promise<ProductAnswer> {
  return api.post<ProductAnswer>(`${BASE_URL}/admin/answers/${answerId}/verify`);
}

/**
 * Get answers for a question
 */
export async function getQuestionAnswers(questionId: string): Promise<ProductAnswer[]> {
  return api.get<ProductAnswer[]>(`${BASE_URL}/questions/${questionId}/answers`);
}

/**
 * Delete a question (admin only)
 */
export async function deleteQuestion(questionId: string): Promise<void> {
  return api.delete<void>(`${BASE_URL}/admin/questions/${questionId}`);
}

/**
 * Delete an answer (admin only)
 */
export async function deleteAnswer(answerId: string): Promise<void> {
  return api.delete<void>(`${BASE_URL}/admin/answers/${answerId}`);
}

export const qaApi = {
  getPendingQuestions,
  getAllQuestions,
  approveQuestion,
  rejectQuestion,
  verifyAnswer,
  getQuestionAnswers,
  deleteQuestion,
  deleteAnswer,
};
