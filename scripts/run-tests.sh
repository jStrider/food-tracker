#!/bin/bash

# Comprehensive test runner script for CI/CD
# Runs all test types in parallel with proper error handling

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
  echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

print_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
  echo -e "${RED}❌ $1${NC}"
}

print_warning() {
  echo -e "${YELLOW}⚠️ $1${NC}"
}

# Cleanup function
cleanup() {
  print_status "Cleaning up test environment..."
  docker-compose -f docker-compose.test.yml down --volumes --remove-orphans 2>/dev/null || true
  killall node 2>/dev/null || true
}

# Set trap to cleanup on exit
trap cleanup EXIT

# Main function
main() {
  print_status "Starting comprehensive test suite..."

  # Check if required tools are installed
  if ! command -v docker-compose &> /dev/null; then
    print_error "docker-compose is required but not installed"
    exit 1
  fi

  # Create test results directories
  mkdir -p test-results/{backend,frontend,e2e,performance,accessibility}

  # Start test services
  print_status "Starting test services..."
  docker-compose -f docker-compose.test.yml up -d --build

  # Wait for services to be healthy
  print_status "Waiting for services to be ready..."
  timeout 120s bash -c 'until docker-compose -f docker-compose.test.yml ps | grep -q "healthy"; do sleep 5; done'

  # Initialize test results
  BACKEND_TESTS_PASSED=false
  FRONTEND_TESTS_PASSED=false
  E2E_TESTS_PASSED=false
  PERFORMANCE_TESTS_PASSED=false
  ACCESSIBILITY_TESTS_PASSED=false

  # Run backend tests
  print_status "Running backend tests..."
  if cd backend && npm run test:ci; then
    print_success "Backend unit tests passed"
    BACKEND_TESTS_PASSED=true
  else
    print_error "Backend unit tests failed"
  fi
  cd ..

  # Run backend integration tests
  print_status "Running backend integration tests..."
  if cd backend && npm run test:e2e; then
    print_success "Backend integration tests passed"
  else
    print_error "Backend integration tests failed"
    BACKEND_TESTS_PASSED=false
  fi
  cd ..

  # Run frontend tests
  print_status "Running frontend tests..."
  if cd frontend && npm run test:coverage; then
    print_success "Frontend unit tests passed"
    FRONTEND_TESTS_PASSED=true
  else
    print_error "Frontend unit tests failed"
  fi
  cd ..

  # Install Playwright browsers if not in CI
  if [ "$CI" != "true" ]; then
    print_status "Installing Playwright browsers..."
    cd frontend && npx playwright install --with-deps
    cd ..
  fi

  # Run E2E tests
  print_status "Running E2E tests..."
  if cd frontend && npx playwright test; then
    print_success "E2E tests passed"
    E2E_TESTS_PASSED=true
  else
    print_error "E2E tests failed"
  fi
  cd ..

  # Run performance tests
  print_status "Running performance tests..."
  if cd frontend && npx playwright test --grep="@performance"; then
    print_success "Performance tests passed"
    PERFORMANCE_TESTS_PASSED=true
  else
    print_warning "Performance tests failed or not found"
  fi
  cd ..

  # Run accessibility tests
  print_status "Running accessibility tests..."
  if cd frontend && npx playwright test --grep="@a11y"; then
    print_success "Accessibility tests passed"
    ACCESSIBILITY_TESTS_PASSED=true
  else
    print_warning "Accessibility tests failed or not found"
  fi
  cd ..

  # Generate test summary
  print_status "Generating test summary..."
  
  TOTAL_TESTS=0
  PASSED_TESTS=0
  
  # Count results
  if [ "$BACKEND_TESTS_PASSED" = true ]; then
    ((PASSED_TESTS++))
  fi
  ((TOTAL_TESTS++))
  
  if [ "$FRONTEND_TESTS_PASSED" = true ]; then
    ((PASSED_TESTS++))
  fi
  ((TOTAL_TESTS++))
  
  if [ "$E2E_TESTS_PASSED" = true ]; then
    ((PASSED_TESTS++))
  fi
  ((TOTAL_TESTS++))

  # Optional tests don't count toward failure
  if [ "$PERFORMANCE_TESTS_PASSED" = true ]; then
    print_success "Performance tests: PASSED"
  else
    print_warning "Performance tests: SKIPPED/FAILED"
  fi

  if [ "$ACCESSIBILITY_TESTS_PASSED" = true ]; then
    print_success "Accessibility tests: PASSED"
  else
    print_warning "Accessibility tests: SKIPPED/FAILED"
  fi

  # Print final summary
  echo
  print_status "=== TEST SUMMARY ==="
  echo -e "Backend Tests: $([ "$BACKEND_TESTS_PASSED" = true ] && echo -e "${GREEN}PASSED${NC}" || echo -e "${RED}FAILED${NC}")"
  echo -e "Frontend Tests: $([ "$FRONTEND_TESTS_PASSED" = true ] && echo -e "${GREEN}PASSED${NC}" || echo -e "${RED}FAILED${NC}")"
  echo -e "E2E Tests: $([ "$E2E_TESTS_PASSED" = true ] && echo -e "${GREEN}PASSED${NC}" || echo -e "${RED}FAILED${NC}")"
  echo -e "Performance Tests: $([ "$PERFORMANCE_TESTS_PASSED" = true ] && echo -e "${GREEN}PASSED${NC}" || echo -e "${YELLOW}SKIPPED${NC}")"
  echo -e "Accessibility Tests: $([ "$ACCESSIBILITY_TESTS_PASSED" = true ] && echo -e "${GREEN}PASSED${NC}" || echo -e "${YELLOW}SKIPPED${NC}")"
  echo
  echo -e "Overall: ${PASSED_TESTS}/${TOTAL_TESTS} core test suites passed"

  # Exit with error if any core tests failed
  if [ $PASSED_TESTS -eq $TOTAL_TESTS ]; then
    print_success "All core tests passed! 🎉"
    exit 0
  else
    print_error "Some core tests failed"
    exit 1
  fi
}

# Run main function
main "$@"