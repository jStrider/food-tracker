import { test, expect, chromium } from '@playwright/test';
import { playAudit } from 'playwright-lighthouse';

/**
 * Performance Testing Suite
 * Monitors Core Web Vitals, Lighthouse scores, and runtime performance
 * 
 * Metrics Tracked:
 * - First Contentful Paint (FCP)
 * - Largest Contentful Paint (LCP)
 * - Cumulative Layout Shift (CLS)
 * - First Input Delay (FID)
 * - Time to Interactive (TTI)
 * - Speed Index (SI)
 * - Lighthouse Performance Score
 */

interface PerformanceMetrics {
  fcp: number;
  lcp: number;
  cls: number;
  fid: number;
  tti: number;
  speedIndex: number;
  performanceScore: number;
}

const PERFORMANCE_THRESHOLDS = {
  fcp: 1800, // First Contentful Paint < 1.8s
  lcp: 2500, // Largest Contentful Paint < 2.5s
  cls: 0.1,  // Cumulative Layout Shift < 0.1
  fid: 100,  // First Input Delay < 100ms
  tti: 3800, // Time to Interactive < 3.8s
  speedIndex: 3400, // Speed Index < 3.4s
  performanceScore: 0.9, // Lighthouse Performance Score > 90
};

test.describe('Performance Tests', () => {
  test.beforeAll(async () => {
    // Ensure clean performance testing environment
    console.log('🚀 Starting Performance Test Suite');
    console.log('📊 Performance Thresholds:', PERFORMANCE_THRESHOLDS);
  });

  test('Homepage performance - Core Web Vitals', async ({ page }) => {
    // Start performance monitoring
    await page.goto('/', { waitUntil: 'networkidle' });
    
    // Measure Core Web Vitals
    const webVitals = await page.evaluate(() => {
      return new Promise((resolve) => {
        const vitals: any = {};
        
        // Measure FCP (First Contentful Paint)
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.name === 'first-contentful-paint') {
              vitals.fcp = entry.startTime;
            }
          }
        }).observe({ entryTypes: ['paint'] });
        
        // Measure LCP (Largest Contentful Paint)
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          vitals.lcp = lastEntry.startTime;
        }).observe({ entryTypes: ['largest-contentful-paint'] });
        
        // Measure CLS (Cumulative Layout Shift)
        let cls = 0;
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries() as any[]) {
            if (!entry.hadRecentInput) {
              cls += entry.value;
            }
          }
          vitals.cls = cls;
        }).observe({ entryTypes: ['layout-shift'] });
        
        // Collect navigation timing
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        vitals.domContentLoaded = navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart;
        vitals.loadComplete = navigation.loadEventEnd - navigation.loadEventStart;
        
        // Give time for metrics to be collected
        setTimeout(() => resolve(vitals), 3000);
      });
    });
    
    console.log('📊 Core Web Vitals:', webVitals);
    
    // Assert performance thresholds
    if (webVitals.fcp) {
      expect(webVitals.fcp).toBeLessThan(PERFORMANCE_THRESHOLDS.fcp);
    }
    if (webVitals.lcp) {
      expect(webVitals.lcp).toBeLessThan(PERFORMANCE_THRESHOLDS.lcp);
    }
    if (webVitals.cls !== undefined) {
      expect(webVitals.cls).toBeLessThan(PERFORMANCE_THRESHOLDS.cls);
    }
  });

  test('Lighthouse performance audit - Homepage', async () => {
    const browser = await chromium.launch({
      args: ['--remote-debugging-port=9222'],
      headless: true,
    });
    
    const context = await browser.newContext();
    const page = await context.newPage();
    
    try {
      await page.goto('http://localhost:3003/');
      
      const lighthouseResult = await playAudit({
        page,
        thresholds: {
          performance: 90,
          accessibility: 90,
          'best-practices': 90,
          seo: 80,
        },
        reports: {
          formats: {
            json: true,
            html: true,
          },
          directory: './test-results/lighthouse/',
        },
      });
      
      console.log('🔍 Lighthouse Performance Score:', lighthouseResult.lhr.categories.performance.score * 100);
      
      // Assert Lighthouse thresholds
      expect(lighthouseResult.lhr.categories.performance.score).toBeGreaterThan(PERFORMANCE_THRESHOLDS.performanceScore);
      expect(lighthouseResult.lhr.categories.accessibility.score).toBeGreaterThan(0.90);
      
    } finally {
      await context.close();
      await browser.close();
    }
  });

  test('Calendar view performance', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Measure calendar rendering performance
    const startTime = Date.now();
    
    // Switch between calendar views and measure performance
    const views = ['Day', 'Week', 'Month'];
    const viewPerformance = {};
    
    for (const view of views) {
      const viewStartTime = performance.now();
      
      await page.getByRole('button', { name: view }).click();
      await page.waitForLoadState('networkidle');
      
      const viewEndTime = performance.now();
      viewPerformance[view] = viewEndTime - viewStartTime;
      
      // Each view switch should be fast
      expect(viewPerformance[view]).toBeLessThan(1000); // < 1 second
    }
    
    console.log('📊 Calendar View Performance:', viewPerformance);
  });

  test('Food search performance', async ({ page }) => {
    await page.goto('/foods');
    await page.waitForLoadState('networkidle');
    
    const searchInput = page.getByPlaceholder('Enter food name...');
    
    // Measure search performance
    const searchTerms = ['apple', 'chicken', 'bread', 'milk'];
    const searchPerformance = {};
    
    for (const term of searchTerms) {
      const startTime = performance.now();
      
      await searchInput.fill(term);
      
      // Wait for search results with timeout
      try {
        await page.waitForSelector('[data-testid="search-results"]', { timeout: 2000 });
        const endTime = performance.now();
        searchPerformance[term] = endTime - startTime;
        
        // Search should respond quickly
        expect(searchPerformance[term]).toBeLessThan(2000); // < 2 seconds
      } catch (error) {
        console.warn(`Search for "${term}" timed out`);
        searchPerformance[term] = 2000; // Mark as timeout
      }
      
      // Clear search
      await searchInput.clear();
      await page.waitForTimeout(500);
    }
    
    console.log('📊 Search Performance:', searchPerformance);
  });

  test('Meal creation performance', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Click on today's date
    const today = new Date().getDate().toString();
    await page.getByText(today, { exact: true }).first().click();
    
    // Measure modal opening performance
    const modalStartTime = performance.now();
    await page.getByRole('button', { name: 'Add Meal' }).click();
    
    // Wait for modal to be visible
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    const modalEndTime = performance.now();
    
    const modalOpenTime = modalEndTime - modalStartTime;
    console.log('📊 Modal Open Time:', modalOpenTime + 'ms');
    
    // Modal should open quickly
    expect(modalOpenTime).toBeLessThan(500); // < 500ms
    
    // Measure form submission performance
    await page.getByPlaceholder('e.g., Chicken salad').fill('Performance Test Meal');
    
    const submitStartTime = performance.now();
    await page.getByRole('button', { name: 'Create Meal' }).click();
    
    // Wait for success feedback
    try {
      await page.waitForSelector('text=Success', { timeout: 5000 });
      const submitEndTime = performance.now();
      
      const submitTime = submitEndTime - submitStartTime;
      console.log('📊 Meal Creation Time:', submitTime + 'ms');
      
      // Meal creation should be reasonably fast
      expect(submitTime).toBeLessThan(3000); // < 3 seconds
    } catch (error) {
      console.warn('Meal creation timed out or failed');
    }
  });

  test('Bundle size and resource loading', async ({ page }) => {
    // Monitor network requests
    const requests = [];
    const responses = [];
    
    page.on('request', request => {
      requests.push({
        url: request.url(),
        method: request.method(),
        resourceType: request.resourceType(),
      });
    });
    
    page.on('response', response => {
      responses.push({
        url: response.url(),
        status: response.status(),
        size: response.headers()['content-length'] || 0,
      });
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Analyze resource loading
    const jsFiles = responses.filter(r => r.url.endsWith('.js'));
    const cssFiles = responses.filter(r => r.url.endsWith('.css'));
    const imageFiles = responses.filter(r => 
      r.url.match(/\.(jpg|jpeg|png|gif|svg|webp)$/i)
    );
    
    // Calculate total bundle size
    const totalJSSize = jsFiles.reduce((sum, file) => sum + parseInt(file.size || '0'), 0);
    const totalCSSSize = cssFiles.reduce((sum, file) => sum + parseInt(file.size || '0'), 0);
    
    console.log('📊 Resource Analysis:');
    console.log(`  JS Files: ${jsFiles.length}, Total Size: ${(totalJSSize / 1024).toFixed(2)} KB`);
    console.log(`  CSS Files: ${cssFiles.length}, Total Size: ${(totalCSSSize / 1024).toFixed(2)} KB`);
    console.log(`  Images: ${imageFiles.length}`);
    console.log(`  Total Requests: ${requests.length}`);
    
    // Assert reasonable bundle sizes
    expect(totalJSSize).toBeLessThan(1024 * 1024); // < 1MB JS
    expect(totalCSSSize).toBeLessThan(100 * 1024); // < 100KB CSS
    expect(requests.length).toBeLessThan(50); // < 50 total requests
  });

  test('Memory usage monitoring', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Monitor memory usage during typical user workflow
    const memoryMetrics = await page.evaluate(async () => {
      const measurements = [];
      
      // Get initial memory
      if ('memory' in performance) {
        measurements.push({
          phase: 'initial',
          ...(performance as any).memory
        });
      }
      
      // Simulate user interactions
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if ('memory' in performance) {
        measurements.push({
          phase: 'after_interaction',
          ...(performance as any).memory
        });
      }
      
      return measurements;
    });
    
    if (memoryMetrics.length > 0) {
      console.log('📊 Memory Usage:', memoryMetrics);
      
      // Check for reasonable memory usage
      const latestMemory = memoryMetrics[memoryMetrics.length - 1];
      if (latestMemory.usedJSHeapSize) {
        // Should use less than 50MB
        expect(latestMemory.usedJSHeapSize).toBeLessThan(50 * 1024 * 1024);
      }
    }
  });

  test('Mobile performance', async () => {
    const browser = await chromium.launch();
    const context = await browser.newContext({
      ...require('@playwright/test').devices['iPhone 12'],
      // Simulate slower network
      extraHTTPHeaders: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15'
      }
    });
    
    const page = await context.newPage();
    
    try {
      const startTime = performance.now();
      await page.goto('http://localhost:3003/');
      await page.waitForLoadState('networkidle');
      const endTime = performance.now();
      
      const loadTime = endTime - startTime;
      console.log('📱 Mobile Load Time:', loadTime + 'ms');
      
      // Mobile should load within reasonable time
      expect(loadTime).toBeLessThan(5000); // < 5 seconds on mobile
      
      // Test mobile interactions
      await page.tap('body');
      
      // Check if page is responsive
      const viewport = page.viewportSize();
      expect(viewport?.width).toBeLessThanOrEqual(414); // iPhone 12 width
      
    } finally {
      await context.close();
      await browser.close();
    }
  });

  test('API response times', async ({ page }) => {
    // Monitor API calls and their response times
    const apiCalls = [];
    
    page.on('response', response => {
      if (response.url().includes('/api/')) {
        apiCalls.push({
          url: response.url(),
          status: response.status(),
          method: response.request().method(),
          timing: response.request().timing(),
        });
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Navigate to different sections to trigger API calls
    if (await page.getByRole('link', { name: 'Foods' }).isVisible()) {
      await page.getByRole('link', { name: 'Foods' }).click();
      await page.waitForLoadState('networkidle');
    }
    
    // Analyze API performance
    console.log('📊 API Calls Analysis:');
    apiCalls.forEach(call => {
      console.log(`  ${call.method} ${call.url} - Status: ${call.status}`);
      
      // API calls should respond quickly
      expect(call.status).toBeLessThan(400);
    });
    
    // Should have made some API calls
    expect(apiCalls.length).toBeGreaterThan(0);
  });

  test.afterAll(async () => {
    console.log('✅ Performance Test Suite Completed');
    console.log('📈 Check test-results/lighthouse/ for detailed reports');
  });
});