module.exports = {
  testEnvironment: 'node',
  verbose: true,
  testMatch: ['**/tests/**/*.test.js'],
  testTimeout: 20000,
  cacheDirectory: '<rootDir>/.jest-cache',
  setupFilesAfterEnv: ['<rootDir>/tests/setup/jest.setup.js'],
  collectCoverageFrom: [
    'controllers/**/*.js',
    'routes/**/*.js',
    'middleware/**/*.js',
    'services/**/*.js',
    '!**/node_modules/**',
  ],
  coverageDirectory: 'coverage',
  forceExit: true,
};
