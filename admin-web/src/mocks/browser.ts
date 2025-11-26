/**
 * Mock server setup for browser (used in development with mock mode)
 */
import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

export const worker = setupWorker(...handlers);
