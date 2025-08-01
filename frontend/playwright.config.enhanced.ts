import { defineConfig, devices } from '@playwright/test';

/**
 * Enhanced Playwright Configuration for FoodTracker
 * Features:
 * - Multi-browser testing (Chrome, Firefox, Safari)
 * - Mobile and tablet viewports
 * - Accessibility testing setup
 * - Performance monitoring
 * - Visual regression testing
 * - CI/CD optimized settings
 */

const isCI = !!process.env.CI;
const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3003';
const apiURL = process.env.VITE_API_URL || 'http://localhost:3002';

export default defineConfig({
  testDir: './e2e',
  
  // Test Organization
  outputDir: './test-results',
  fullyParallel: true,
  forbidOnly: isCI,
  
  // Retry Strategy
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : 4,
  
  // Timeout Configuration
  timeout: 30 * 1000, // 30 seconds per test
  expect: {
    timeout: 10 * 1000, // 10 seconds for assertions
    toHaveScreenshot: {
      mode: 'only-on-failure',
      animations: 'disabled',
      caret: 'hide',
    },
  },
  
  // Global Setup
  globalSetup: './e2e/global-setup.ts',
  
  // Reporting
  reporter: [
    ['list'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['html', { 
      open: 'never',
      outputFolder: 'playwright-report' 
    }],
    ...(isCI ? [['github'] as const] : []),
  ],
  
  // Global Test Configuration
  use: {
    baseURL,
    
    // Browser Context
    actionTimeout: 10 * 1000,
    navigationTimeout: 30 * 1000,
    
    // Screenshots and Videos
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
    
    // Network
    extraHTTPHeaders: {
      'Accept-Language': 'en-US,en;q=0.9',
    },
    
    // Accessibility
    colorScheme: 'light',
    reducedMotion: 'reduce',
  },

  // Browser Projects
  projects: [
    // Setup project for authentication
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    
    // Desktop Chrome - Primary testing browser
    {
      name: 'chrome-desktop',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
      },
      dependencies: ['setup'],
    },
    
    // Desktop Firefox
    {
      name: 'firefox-desktop',
      use: { 
        ...devices['Desktop Firefox'],
        viewport: { width: 1920, height: 1080 },
      },
      dependencies: ['setup'],
    },
    
    // Desktop Safari (macOS only)
    {
      name: 'safari-desktop',
      use: { 
        ...devices['Desktop Safari'],
        viewport: { width: 1920, height: 1080 },
      },
      dependencies: ['setup'],
    },
    
    // Mobile Chrome
    {
      name: 'mobile-chrome',
      use: { 
        ...devices['Pixel 5'],
      },
      dependencies: ['setup'],
    },
    
    // Mobile Safari
    {
      name: 'mobile-safari',
      use: { 
        ...devices['iPhone 12'],
      },
      dependencies: ['setup'],
    },
    
    // Tablet
    {
      name: 'tablet',
      use: { 
        ...devices['iPad Pro'],
      },
      dependencies: ['setup'],
    },
    
    // Accessibility Testing Project
    {
      name: 'accessibility',
      testMatch: /.*\.a11y\.spec\.ts/,
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
      },
      dependencies: ['setup'],
    },
    
    // Performance Testing Project
    {
      name: 'performance',
      testMatch: /.*\.perf\.spec\.ts/,
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
      },
      dependencies: ['setup'],
    },
    
    // Visual Regression Testing
    {
      name: 'visual',
      testMatch: /.*\.visual\.spec\.ts/,
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
      },
      dependencies: ['setup'],
    },
  ],
  
  // Web Server Configuration
  webServer: {
    command: 'echo "Using external server setup"',
    url: baseURL,
    reuseExistingServer: !isCI,
    timeout: 120 * 1000,
  },
  
  // Test Match Patterns
  testMatch: [
    '**/*.spec.ts',
    '**/*.test.ts',
    '**/*.e2e.ts',
  ],
  
  // Ignore Patterns
  testIgnore: [
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**',
  ],
});