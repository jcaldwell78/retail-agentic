/**
 * Global setup for Playwright tests
 * Initializes MSW mock server when USE_MOCK_SERVER=true
 */
import { server } from '../src/mocks/server';

export default function globalSetup() {
  if (process.env.USE_MOCK_SERVER === 'true') {
    console.log('Starting MSW mock server for Admin E2E tests...');
    server.listen({ onUnhandledRequest: 'warn' });
  }
}

export function globalTeardown() {
  if (process.env.USE_MOCK_SERVER === 'true') {
    console.log('Stopping MSW mock server...');
    server.close();
  }
}
