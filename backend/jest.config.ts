import type { Config } from 'jest';

const config: Config = {
  // Use ts-jest to run TypeScript directly
  preset: 'ts-jest',
  testEnvironment: 'node',

  // Only look for test files in the test/ directory
  roots: ['<rootDir>/test'],
  testMatch: ['**/*.e2e-spec.ts'],

  // Module resolution matching tsconfig paths
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },

  // Timeout: e2e tests can be slower (DB + HTTP)
  testTimeout: 30000,

  // Run tests sequentially — they share a database
  maxWorkers: 1,
};

export default config;
