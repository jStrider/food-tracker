import { defineConfig, devices } from '@playwright/test';

/**
 * Enhanced Playwright configuration for comprehensive testing
 * Includes performance, accessibility, visual regression, and cross-browser testing
 */
export default defineConfig({
  testDir: './e2e',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI for stability. */
  workers: process.env.CI ? 2 : undefined,
  
  /* Reporter configuration for CI/CD */
  reporter: process.env.CI 
    ? [
        ['html', { outputFolder: 'playwright-report' }],
        ['junit', { outputFile: 'test-results/junit.xml' }],
        ['json', { outputFile: 'test-results/results.json' }],
        ['github'],
      ]
    : [
        ['html'],
        ['list'],
      ],

  /* Global setup for test data and authentication */
  globalSetup: './e2e/global-setup.ts',

  /* Shared settings for all the projects below */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:3003',

    /* Collect trace when retrying the failed test */
    trace: process.env.CI ? 'on-first-retry' : 'retain-on-failure',

    /* Screenshot configuration */
    screenshot: process.env.CI ? 'only-on-failure' : 'only-on-failure',

    /* Video recording */
    video: process.env.CI ? 'retain-on-failure' : 'off',

    /* Global test timeout */
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },

  /* Output directories */
  outputDir: 'test-results',

  /* Configure projects for comprehensive testing */
  projects: [
    /* Desktop Browsers */
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Enable additional browser features for testing
        launchOptions: {
          args: [
            '--enable-features=NetworkService,NetworkServiceLogging',
            '--enable-automation=false',
            '--no-default-browser-check',
          ],
        },
      },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    /* Mobile Browsers */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },

    /* Performance Testing */
    {
      name: 'performance',
      testMatch: '**/*.perf.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: [
            '--enable-features=NetworkService,NetworkServiceLogging',
            '--disable-web-security',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding',
          ],
        },
      },
    },

    /* Accessibility Testing */
    {
      name: 'accessibility',
      testMatch: '**/*.a11y.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        // Slow down interactions for better accessibility testing
        actionTimeout: 15000,
      },
    },

    /* Visual Regression Testing */
    {
      name: 'visual',
      testMatch: '**/*.visual.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        // Consistent viewport for visual tests
        viewport: { width: 1280, height: 720 },
      },
    },

    /* API Testing */
    {
      name: 'api',
      testMatch: '**/api/**/*.spec.ts',
      use: {
        // Skip browser for API tests
        browserName: undefined,
        baseURL: 'http://localhost:3001/api',
      },
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: process.env.CI 
    ? {
        // In CI, assume services are already running via Docker
        command: 'echo "Using Docker containers for testing"',
        url: 'http://localhost:3003',
        reuseExistingServer: true,
        timeout: 120 * 1000,
      }
    : {
        // Local development setup
        command: 'npm run dev',
        port: 3003,
        reuseExistingServer: !process.env.CI,
      },

  /* Test timeout */
  timeout: 60000,

  /* Expect timeout for assertions */
  expect: {
    timeout: 10000,
    // Visual comparison threshold
    threshold: 0.2,
  },

  /* Global teardown */
  globalTeardown: './e2e/global-teardown.ts',
});