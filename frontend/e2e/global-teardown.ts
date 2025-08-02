import { FullConfig } from '@playwright/test';
import fs from 'fs';
import path from 'path';

/**
 * Global teardown for Playwright tests
 * Cleanup test artifacts and generate summary reports
 */
async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting global test teardown...');

  try {
    // Clean up authentication files
    const authPath = 'playwright/.auth';
    if (fs.existsSync(authPath)) {
      fs.rmSync(authPath, { recursive: true, force: true });
      console.log('✅ Cleaned up authentication files');
    }

    // Generate test summary if in CI
    if (process.env.CI) {
      await generateTestSummary();
    }

    console.log('✅ Global teardown completed successfully');
  } catch (error) {
    console.error('❌ Global teardown failed:', error);
    // Don't throw error to prevent masking test failures
  }
}

/**
 * Generate a test summary for CI/CD pipeline
 */
async function generateTestSummary() {
  try {
    const resultsPath = 'test-results/results.json';
    if (!fs.existsSync(resultsPath)) {
      console.log('📊 No test results file found for summary');
      return;
    }

    const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
    const summary = {
      total: results.suites?.reduce((acc: number, suite: any) => 
        acc + (suite.specs?.length || 0), 0) || 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      duration: results.stats?.duration || 0,
    };

    // Count test outcomes
    results.suites?.forEach((suite: any) => {
      suite.specs?.forEach((spec: any) => {
        spec.tests?.forEach((test: any) => {
          switch (test.outcome) {
            case 'passed':
              summary.passed++;
              break;
            case 'failed':
              summary.failed++;
              break;
            case 'skipped':
              summary.skipped++;
              break;
          }
        });
      });
    });

    // Write summary to file for CI to pick up
    const summaryPath = 'test-results/summary.json';
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));

    console.log('📊 Test Summary:');
    console.log(`   Total: ${summary.total}`);
    console.log(`   Passed: ${summary.passed}`);
    console.log(`   Failed: ${summary.failed}`);
    console.log(`   Skipped: ${summary.skipped}`);
    console.log(`   Duration: ${Math.round(summary.duration / 1000)}s`);
  } catch (error) {
    console.error('❌ Failed to generate test summary:', error);
  }
}

export default globalTeardown;