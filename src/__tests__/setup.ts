/**
 * Global Test Setup
 * 
 * This file is run before all tests to set up the test environment.
 */

import { beforeAll, beforeEach, afterEach, afterAll } from 'bun:test';
import { setupTestDatabase, teardownTestDatabase, clearTestDatabase } from './utils/mock-db';

// Set test environment
process.env.NODE_ENV = 'test';

// Setup before all tests
beforeAll(async () => {
  setupTestDatabase();
});

// Clear database before each test
beforeEach(() => {
  clearTestDatabase();
});

// Cleanup after all tests
afterAll(() => {
  teardownTestDatabase();
});
