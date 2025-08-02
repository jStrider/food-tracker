module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  
  // Test patterns
  testMatch: [
    '<rootDir>/src/**/*.spec.ts',
    '<rootDir>/test/**/*.e2e-spec.ts'
  ],
  
  // Transform configuration
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  
  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.(t|j)s',
    '!src/**/*.spec.ts',
    '!src/**/*.e2e-spec.ts',
    '!src/main.ts',
    '!src/**/*.module.ts',
    '!src/**/index.ts',
    '!**/migrations/**',
    '!**/*.interface.ts',
    '!**/*.enum.ts',
    '!**/*.dto.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'text-summary', 'lcov', 'html', 'json', 'json-summary'],
  
  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  
  // Module resolution
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1',
    '^test/(.*)$': '<rootDir>/test/$1',
  },
  
  // Jest configuration for better error handling
  verbose: true,
  forceExit: true,
  detectOpenHandles: true,
  
  // Performance settings
  maxWorkers: '50%',
  testTimeout: 10000,
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
  
  // Mock settings
  clearMocks: true,
  restoreMocks: true,
  
  // Projects configuration for unit and e2e tests
  projects: [
    {
      displayName: 'unit',
      testMatch: ['<rootDir>/src/**/*.spec.ts'],
      preset: 'ts-jest',
      testEnvironment: 'node',
      setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    },
    {
      displayName: 'e2e',
      testMatch: ['<rootDir>/test/**/*.e2e-spec.ts'],
      preset: 'ts-jest',
      testEnvironment: 'node',
      setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    }
  ]
};