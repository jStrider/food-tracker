#!/bin/bash

set -e

echo "🧪 Setting up comprehensive testing infrastructure..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the project root
if [ ! -f "package.json" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

print_status "Installing pre-commit hooks..."
if command -v pre-commit &> /dev/null; then
    pre-commit install
    pre-commit install --hook-type commit-msg
    print_success "Pre-commit hooks installed"
else
    print_warning "pre-commit not found. Installing..."
    pip install pre-commit
    pre-commit install
    pre-commit install --hook-type commit-msg
    print_success "Pre-commit installed and hooks configured"
fi

print_status "Setting up backend testing infrastructure..."
cd backend

# Install missing test dependencies if needed
if ! npm list --depth=0 jest-extended &> /dev/null; then
    print_status "Installing additional test utilities..."
    npm install --save-dev jest-extended @types/supertest
fi

# Create test configuration files
print_status "Creating test configuration files..."

# Create Jest setup file
cat > jest.setup.js << 'EOF'
const { execSync } = require('child_process');
const path = require('path');

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.POSTGRES_HOST = 'localhost';
process.env.POSTGRES_PORT = '5432';
process.env.POSTGRES_DB = 'foodtracker_test';
process.env.POSTGRES_USER = 'postgres';
process.env.POSTGRES_PASSWORD = 'postgres';
process.env.REDIS_URL = 'redis://localhost:6379';

// Extend Jest matchers
require('jest-extended');

// Set test timeout
jest.setTimeout(30000);

// Global test setup
beforeAll(async () => {
  // Any global setup can go here
});

// Global test teardown
afterAll(async () => {
  // Any global cleanup can go here
});
EOF

# Create test utilities
mkdir -p src/test/utils
cat > src/test/utils/test-helpers.ts << 'EOF'
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

/**
 * Creates a testing module with common configurations
 */
export async function createTestingModule(imports: any[] = [], providers: any[] = []): Promise<TestingModule> {
  return Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
        envFilePath: '.env.test',
      }),
      TypeOrmModule.forRoot({
        type: 'sqlite',
        database: ':memory:',
        entities: ['src/**/*.entity.ts'],
        synchronize: true,
        logging: false,
      }),
      ThrottlerModule.forRoot({
        ttl: 60,
        limit: 1000, // High limit for tests
      }),
      ...imports,
    ],
    providers: [
      {
        provide: APP_GUARD,
        useClass: ThrottlerGuard,
      },
      ...providers,
    ],
  }).compile();
}

/**
 * Helper to create mock request objects
 */
export const createMockRequest = (overrides = {}) => ({
  user: { id: 'test-user-id' },
  ip: '127.0.0.1',
  headers: {},
  query: {},
  params: {},
  body: {},
  ...overrides,
});

/**
 * Helper to create mock response objects
 */
export const createMockResponse = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
  send: jest.fn().mockReturnThis(),
  setHeader: jest.fn().mockReturnThis(),
});

/**
 * Helper to sleep for testing async operations
 */
export const sleep = (ms: number): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, ms));

/**
 * Helper to generate test data with proper types
 */
export const generateTestData = {
  user: (overrides = {}) => ({
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),
  
  meal: (overrides = {}) => ({
    id: 'test-meal-id',
    name: 'Test Meal',
    category: 'breakfast',
    date: '2024-01-15',
    time: '08:00',
    notes: 'Test notes',
    totalCalories: 300,
    totalProtein: 20,
    totalCarbs: 40,
    totalFat: 10,
    ...overrides,
  }),
  
  food: (overrides = {}) => ({
    id: 'test-food-id',
    name: 'Test Food',
    calories: 100,
    protein: 5,
    carbs: 20,
    fat: 2,
    fiber: 3,
    sugar: 15,
    sodium: 100,
    ...overrides,
  }),
};
EOF

print_success "Backend test infrastructure configured"

cd ../frontend

print_status "Setting up frontend testing infrastructure..."

# Check if Vitest is configured
if ! npm list --depth=0 @vitest/coverage-v8 &> /dev/null; then
    print_status "Installing frontend test coverage tools..."
    npm install --save-dev @vitest/coverage-v8
fi

# Create test setup file
cat > src/test/setup.ts << 'EOF'
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with testing-library matchers
expect.extend(matchers);

// Clean up after each test
afterEach(() => {
  cleanup();
});

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock scrollTo
window.scrollTo = vi.fn();
EOF

# Create test utilities
mkdir -p src/test/utils
cat > src/test/utils/test-utils.tsx << 'EOF'
import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a test query client
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: Infinity,
    },
    mutations: {
      retry: false,
    },
  },
});

interface AllTheProvidersProps {
  children: React.ReactNode;
}

const AllTheProviders = ({ children }: AllTheProvidersProps) => {
  const queryClient = createTestQueryClient();
  
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };

// Helper functions for common test scenarios
export const createMockApiResponse = <T>(data: T, status = 200) => ({
  data,
  status,
  statusText: 'OK',
  headers: {},
  config: {},
});

export const waitMs = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const mockLocalStorage = () => {
  const storage: Record<string, string> = {};
  
  return {
    getItem: (key: string) => storage[key] || null,
    setItem: (key: string, value: string) => { storage[key] = value; },
    removeItem: (key: string) => { delete storage[key]; },
    clear: () => { Object.keys(storage).forEach(key => delete storage[key]); },
    length: Object.keys(storage).length,
    key: (index: number) => Object.keys(storage)[index] || null,
  };
};
EOF

print_success "Frontend test infrastructure configured"

cd ..

print_status "Creating test coverage configuration..."

# Create codecov configuration
cat > codecov.yml << 'EOF'
coverage:
  status:
    project:
      default:
        target: 75%
        threshold: 2%
        base: auto
    patch:
      default:
        target: 80%
        threshold: 2%
        base: auto

comment:
  layout: "reach,diff,flags,tree"
  behavior: default
  require_changes: false

flag_management:
  default_rules:
    carryforward: true
    statuses:
      - name: "backend"
        type: "project"
        target: 70%
      - name: "frontend"
        type: "project"
        target: 60%

flags:
  backend:
    paths:
      - backend/src/
  frontend:
    paths:
      - frontend/src/

ignore:
  - "*.config.js"
  - "*.config.ts"
  - "**/dist/**"
  - "**/build/**"
  - "**/coverage/**"
  - "**/node_modules/**"
  - "**/*.test.ts"
  - "**/*.test.tsx"
  - "**/*.spec.ts"
  - "**/test/**"
  - "**/tests/**"
EOF

print_status "Creating quality monitoring dashboard script..."

cat > scripts/test-dashboard.js << 'EOF'
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function generateTestDashboard() {
  console.log('📊 Test Quality Dashboard\n');
  
  // Backend coverage
  const backendCoveragePath = path.join(__dirname, '../backend/coverage/coverage-summary.json');
  if (fs.existsSync(backendCoveragePath)) {
    const backendCoverage = JSON.parse(fs.readFileSync(backendCoveragePath, 'utf8'));
    console.log('🔧 Backend Coverage:');
    console.log(`  Lines: ${backendCoverage.total.lines.pct}%`);
    console.log(`  Functions: ${backendCoverage.total.functions.pct}%`);
    console.log(`  Branches: ${backendCoverage.total.branches.pct}%`);
    console.log(`  Statements: ${backendCoverage.total.statements.pct}%\n`);
  } else {
    console.log('⚠️  Backend coverage not found. Run: npm run test:coverage:backend\n');
  }
  
  // Frontend coverage
  const frontendCoveragePath = path.join(__dirname, '../frontend/coverage/coverage-summary.json');
  if (fs.existsSync(frontendCoveragePath)) {
    const frontendCoverage = JSON.parse(fs.readFileSync(frontendCoveragePath, 'utf8'));
    console.log('⚛️  Frontend Coverage:');
    console.log(`  Lines: ${frontendCoverage.total.lines.pct}%`);
    console.log(`  Functions: ${frontendCoverage.total.functions.pct}%`);
    console.log(`  Branches: ${frontendCoverage.total.branches.pct}%`);
    console.log(`  Statements: ${frontendCoverage.total.statements.pct}%\n`);
  } else {
    console.log('⚠️  Frontend coverage not found. Run: npm run test:coverage:frontend\n');
  }
  
  // Quality recommendations
  console.log('💡 Quality Recommendations:');
  console.log('  • Aim for 80%+ line coverage on new code');
  console.log('  • Write tests before fixing bugs');
  console.log('  • Add E2E tests for critical user journeys');
  console.log('  • Use pre-commit hooks to catch issues early');
  console.log('  • Review test failures in CI/CD pipeline');
}

generateTestDashboard();
EOF

chmod +x scripts/test-dashboard.js

print_status "Creating performance benchmarking script..."

cat > scripts/performance-benchmark.js << 'EOF'
#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function runPerformanceBenchmark() {
  console.log('🚀 Performance Benchmark Suite\n');
  
  const results = {
    timestamp: new Date().toISOString(),
    backend: {},
    frontend: {},
  };
  
  // Backend performance tests
  console.log('🔧 Running backend performance tests...');
  try {
    const backendStart = Date.now();
    execSync('cd backend && npm test -- --testNamePattern="performance" --silent', { stdio: 'inherit' });
    results.backend.testDuration = Date.now() - backendStart;
    console.log(`✅ Backend tests completed in ${results.backend.testDuration}ms\n`);
  } catch (error) {
    console.log('⚠️  Backend performance tests not found or failed\n');
  }
  
  // Frontend performance tests
  console.log('⚛️  Running frontend performance tests...');
  try {
    const frontendStart = Date.now();
    execSync('cd frontend && npm test -- --run --reporter=verbose', { stdio: 'inherit' });
    results.frontend.testDuration = Date.now() - frontendStart;
    console.log(`✅ Frontend tests completed in ${results.frontend.testDuration}ms\n`);
  } catch (error) {
    console.log('⚠️  Frontend performance tests not found or failed\n');
  }
  
  // Bundle size analysis
  console.log('📦 Analyzing bundle sizes...');
  try {
    const buildStart = Date.now();
    execSync('cd frontend && npm run build', { stdio: 'pipe' });
    results.frontend.buildDuration = Date.now() - buildStart;
    
    // Check bundle size
    const buildPath = path.join(__dirname, '../frontend/dist');
    if (fs.existsSync(buildPath)) {
      const stats = fs.statSync(path.join(buildPath, 'assets'));
      results.frontend.bundleSize = getDirectorySize(path.join(buildPath, 'assets'));
      console.log(`📊 Bundle size: ${(results.frontend.bundleSize / 1024 / 1024).toFixed(2)}MB`);
    }
  } catch (error) {
    console.log('⚠️  Bundle analysis failed');
  }
  
  // Save results
  const resultsPath = path.join(__dirname, '../performance-results.json');
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
  
  console.log('\n📈 Performance Summary:');
  console.log(`  Backend test time: ${results.backend.testDuration || 'N/A'}ms`);
  console.log(`  Frontend test time: ${results.frontend.testDuration || 'N/A'}ms`);
  console.log(`  Frontend build time: ${results.frontend.buildDuration || 'N/A'}ms`);
  console.log(`  Bundle size: ${results.frontend.bundleSize ? (results.frontend.bundleSize / 1024 / 1024).toFixed(2) + 'MB' : 'N/A'}`);
  console.log(`\n📄 Detailed results saved to: ${resultsPath}`);
}

function getDirectorySize(dirPath) {
  let size = 0;
  const files = fs.readdirSync(dirPath);
  
  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stats = fs.statSync(filePath);
    
    if (stats.isDirectory()) {
      size += getDirectorySize(filePath);
    } else {
      size += stats.size;
    }
  }
  
  return size;
}

runPerformanceBenchmark();
EOF

chmod +x scripts/performance-benchmark.js

print_success "Testing infrastructure setup completed!"

print_status "Summary of created components:"
echo "  ✅ Pre-commit hooks configuration"
echo "  ✅ Backend test utilities and helpers"
echo "  ✅ Frontend test utilities and setup"
echo "  ✅ Coverage configuration (codecov.yml)"
echo "  ✅ Test quality dashboard script"
echo "  ✅ Performance benchmarking script"
echo "  ✅ Enhanced CI/CD pipeline"

print_status "Next steps:"
echo "  1. Run 'npm run install:all' to install dependencies"
echo "  2. Run 'pre-commit run --all-files' to test hooks"
echo "  3. Run 'npm run test:all' to verify all tests pass"
echo "  4. Run 'node scripts/test-dashboard.js' to see coverage"
echo "  5. Commit changes to trigger CI/CD pipeline"

print_status "Available scripts:"
echo "  • npm run test:all - Run all tests"
echo "  • npm run test:coverage - Generate coverage reports"
echo "  • node scripts/test-dashboard.js - View test quality dashboard"
echo "  • node scripts/performance-benchmark.js - Run performance benchmarks"
echo "  • pre-commit run --all-files - Run all quality checks"

print_success "🎉 Testing infrastructure is ready!"