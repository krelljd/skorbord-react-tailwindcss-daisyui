import { jest } from '@jest/globals';

// Setup test environment
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
process.env.DB_FILE = ':memory:';
process.env.SOCKET_CORS_ORIGIN = 'http://localhost:5173';

// Mock console methods to reduce test output noise
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
