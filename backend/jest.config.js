module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: [
    '**/*.(t|j)s',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/migrations/**',
    '!**/dist/**',
    '!main.ts',
    '!**/*.interface.ts',
    '!**/*.enum.ts',
    '!**/*.dto.ts',
  ],
  coverageDirectory: '../coverage',
  coverageReporters: [
    'text',
    'text-summary',
    'lcov',
    'html',
    'json',
    'json-summary',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/../jest.setup.js'],
  // Parallel test execution
  maxWorkers: '50%',
  // Test timeout
  testTimeout: 10000,
  // Collect coverage on CI
  collectCoverage: process.env.CI === 'true',
  // Reporters for CI
  reporters: process.env.CI
    ? [
        'default',
        [
          'jest-junit',
          {
            outputDirectory: 'test-results',
            outputName: 'junit.xml',
            suiteName: 'Backend Unit Tests',
            classNameTemplate: '{classname}',
            titleTemplate: '{title}',
          },
        ],
        [
          'jest-html-reporters',
          {
            publicPath: 'test-results',
            filename: 'test-report.html',
            pageTitle: 'Backend Test Report',
          },
        ],
      ]
    : ['default'],
  // Clear mocks between tests
  clearMocks: true,
  // Restore mocks after each test
  restoreMocks: true,
  // Module name mapping for absolute imports
  moduleNameMapping: {
    '^src/(.*)$': '<rootDir>/$1',
  },
};