const nextJest = require('next/jest');
const createJestConfig = nextJest({ dir: './' });
module.exports = createJestConfig({ setupFilesAfterEnv: ['<rootDir>/jest.setup.js'], testEnvironment: 'jsdom', testMatch: ['<rootDir>/src/**/*.test.ts?(x)'] });
