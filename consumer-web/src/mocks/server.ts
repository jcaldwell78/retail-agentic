/**
 * Mock server setup for Node.js (used in tests)
 */
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
