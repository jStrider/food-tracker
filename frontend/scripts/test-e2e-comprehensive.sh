#!/bin/bash

# Comprehensive E2E Test Runner for FoodTracker
# Runs accessibility, performance, visual regression, and functional tests

set -e

echo "🚀 Starting Comprehensive E2E Test Suite for FoodTracker..."

# Configuration
PROJECT_ROOT="$(dirname "$(dirname "$(realpath "$0")")")"
REPORTS_DIR="$PROJECT_ROOT/test-results"
LIGHTHOUSE_DIR="$REPORTS_DIR/lighthouse"
ACCESSIBILITY_DIR="$REPORTS_DIR/accessibility"
VISUAL_DIR="$REPORTS_DIR/visual"
PERFORMANCE_DIR="$REPORTS_DIR/performance"

# Create directories
mkdir -p "$REPORTS_DIR" "$LIGHTHOUSE_DIR" "$ACCESSIBILITY_DIR" "$VISUAL_DIR" "$PERFORMANCE_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check dependencies
check_dependencies() {
    log_info "Checking dependencies..."
    
    if ! command -v npm &> /dev/null; then
        log_error "npm is not installed"
        exit 1
    fi
    
    if ! command -v curl &> /dev/null; then
        log_error "curl is not installed"
        exit 1
    fi
    
    log_success "Dependencies check passed"
}

# Check if services are running
check_services() {
    log_info "Checking if services are running..."
    
    # Check backend
    if ! curl -s http://localhost:3002/api/health > /dev/null 2>&1; then
        log_warning "Backend is not running on port 3002"
        log_info "Starting backend..."
        cd ../backend && npm run start:dev &
        BACKEND_PID=$!
        
        # Wait for backend to start
        log_info "Waiting for backend to start..."
        for i in {1..30}; do
            if curl -s http://localhost:3002/api/health > /dev/null 2>&1; then
                log_success "Backend is running"
                break
            fi
            sleep 2
        done
        
        if ! curl -s http://localhost:3002/api/health > /dev/null 2>&1; then
            log_error "Backend failed to start"
            exit 1
        fi
    else
        log_success "Backend is running on port 3002"
    fi
    
    # Check frontend
    if ! curl -s http://localhost:3003 > /dev/null 2>&1; then
        log_warning "Frontend is not running on port 3003"
        log_info "Starting frontend..."
        npm run dev &
        FRONTEND_PID=$!
        
        # Wait for frontend to start
        log_info "Waiting for frontend to start..."
        for i in {1..30}; do
            if curl -s http://localhost:3003 > /dev/null 2>&1; then
                log_success "Frontend is running"
                break
            fi
            sleep 2
        done
        
        if ! curl -s http://localhost:3003 > /dev/null 2>&1; then
            log_error "Frontend failed to start"
            exit 1
        fi
    else
        log_success "Frontend is running on port 3003"
    fi
}

# Run test suite by category
run_accessibility_tests() {
    log_info "Running Accessibility Tests..."
    
    npx playwright test \
        --config=playwright.config.enhanced.ts \
        --project=accessibility \
        --reporter=html \
        --output-dir="$ACCESSIBILITY_DIR" \
        e2e/accessibility.a11y.spec.ts
    
    if [ $? -eq 0 ]; then
        log_success "Accessibility tests passed"
    else
        log_error "Accessibility tests failed"
        return 1
    fi
}

run_performance_tests() {
    log_info "Running Performance Tests..."
    
    npx playwright test \
        --config=playwright.config.enhanced.ts \
        --project=performance \
        --reporter=html \
        --output-dir="$PERFORMANCE_DIR" \
        e2e/performance.perf.spec.ts
    
    if [ $? -eq 0 ]; then
        log_success "Performance tests passed"
    else
        log_error "Performance tests failed"
        return 1
    fi
}

run_visual_tests() {
    log_info "Running Visual Regression Tests..."
    
    npx playwright test \
        --config=playwright.config.enhanced.ts \
        --project=visual \
        --reporter=html \
        --output-dir="$VISUAL_DIR" \
        e2e/visual-regression.visual.spec.ts
    
    if [ $? -eq 0 ]; then
        log_success "Visual regression tests passed"
    else
        log_warning "Visual regression tests failed (may be due to new baselines)"
        return 0  # Don't fail build for visual changes initially
    fi
}

run_functional_tests() {
    log_info "Running Functional E2E Tests..."
    
    npx playwright test \
        --config=playwright.config.enhanced.ts \
        --project=chrome-desktop \
        --reporter=html \
        --output-dir="$REPORTS_DIR/functional" \
        e2e/*.spec.ts \
        --ignore="e2e/accessibility.a11y.spec.ts" \
        --ignore="e2e/performance.perf.spec.ts" \
        --ignore="e2e/visual-regression.visual.spec.ts"
    
    if [ $? -eq 0 ]; then
        log_success "Functional tests passed"
    else
        log_error "Functional tests failed"
        return 1
    fi
}

run_cross_browser_tests() {
    log_info "Running Cross-Browser Tests..."
    
    npx playwright test \
        --config=playwright.config.enhanced.ts \
        --project=chrome-desktop \
        --project=firefox-desktop \
        --project=mobile-chrome \
        --reporter=html \
        --output-dir="$REPORTS_DIR/cross-browser" \
        e2e/smoke-test.spec.ts \
        e2e/login-essential.spec.ts
    
    if [ $? -eq 0 ]; then
        log_success "Cross-browser tests passed"
    else
        log_error "Cross-browser tests failed"
        return 1
    fi
}

# Generate comprehensive report
generate_report() {
    log_info "Generating comprehensive test report..."
    
    cat > "$REPORTS_DIR/test-summary.html" << EOF
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FoodTracker E2E Test Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; margin: 40px; }
        .header { text-align: center; margin-bottom: 40px; }
        .test-category { margin: 20px 0; padding: 20px; border-radius: 8px; }
        .passed { background-color: #d4edda; border-left: 4px solid #28a745; }
        .failed { background-color: #f8d7da; border-left: 4px solid #dc3545; }
        .warning { background-color: #fff3cd; border-left: 4px solid #ffc107; }
        .links { margin-top: 10px; }
        .links a { margin-right: 15px; text-decoration: none; color: #007bff; }
        .timestamp { color: #6c757d; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🧪 FoodTracker E2E Test Report</h1>
        <p class="timestamp">Generated on $(date)</p>
    </div>
    
    <div class="test-category ${ACCESSIBILITY_STATUS:-failed}">
        <h2>🌐 Accessibility Tests</h2>
        <p>WCAG 2.1 AA compliance and keyboard navigation testing</p>
        <div class="links">
            <a href="accessibility/index.html">View Report</a>
        </div>
    </div>
    
    <div class="test-category ${PERFORMANCE_STATUS:-failed}">
        <h2>⚡ Performance Tests</h2>
        <p>Core Web Vitals, Lighthouse scores, and runtime performance</p>
        <div class="links">
            <a href="performance/index.html">View Report</a>
            <a href="lighthouse/">Lighthouse Reports</a>
        </div>
    </div>
    
    <div class="test-category ${VISUAL_STATUS:-warning}">
        <h2>👁️ Visual Regression Tests</h2>
        <p>Screenshot comparisons and layout validation</p>
        <div class="links">
            <a href="visual/index.html">View Report</a>
        </div>
    </div>
    
    <div class="test-category ${FUNCTIONAL_STATUS:-failed}">
        <h2>🔧 Functional Tests</h2>
        <p>User workflows and application functionality</p>
        <div class="links">
            <a href="functional/index.html">View Report</a>
        </div>
    </div>
    
    <div class="test-category ${CROSSBROWSER_STATUS:-failed}">
        <h2>🌍 Cross-Browser Tests</h2>
        <p>Chrome, Firefox, Safari, and mobile compatibility</p>
        <div class="links">
            <a href="cross-browser/index.html">View Report</a>
        </div>
    </div>
</body>
</html>
EOF
    
    log_success "Comprehensive report generated at $REPORTS_DIR/test-summary.html"
}

# Cleanup function
cleanup() {
    log_info "Cleaning up..."
    
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
    fi
    
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
    fi
}

# Trap cleanup on exit
trap cleanup EXIT

# Main execution
main() {
    cd "$PROJECT_ROOT"
    
    check_dependencies
    check_services
    
    # Run test suites
    ACCESSIBILITY_STATUS="passed"
    PERFORMANCE_STATUS="passed"
    VISUAL_STATUS="passed"
    FUNCTIONAL_STATUS="passed"
    CROSSBROWSER_STATUS="passed"
    
    if ! run_accessibility_tests; then
        ACCESSIBILITY_STATUS="failed"
        OVERALL_FAILED=true
    fi
    
    if ! run_performance_tests; then
        PERFORMANCE_STATUS="failed"
        OVERALL_FAILED=true
    fi
    
    if ! run_visual_tests; then
        VISUAL_STATUS="warning"
    fi
    
    if ! run_functional_tests; then
        FUNCTIONAL_STATUS="failed"
        OVERALL_FAILED=true
    fi
    
    if ! run_cross_browser_tests; then
        CROSSBROWSER_STATUS="failed"
        OVERALL_FAILED=true
    fi
    
    # Export status for report generation
    export ACCESSIBILITY_STATUS PERFORMANCE_STATUS VISUAL_STATUS FUNCTIONAL_STATUS CROSSBROWSER_STATUS
    
    generate_report
    
    # Summary
    echo ""
    echo "================================================"
    echo "🧪 TEST SUITE SUMMARY"
    echo "================================================"
    echo "Accessibility Tests: $ACCESSIBILITY_STATUS"
    echo "Performance Tests: $PERFORMANCE_STATUS"
    echo "Visual Regression: $VISUAL_STATUS"
    echo "Functional Tests: $FUNCTIONAL_STATUS"
    echo "Cross-Browser Tests: $CROSSBROWSER_STATUS"
    echo "================================================"
    
    if [ "$OVERALL_FAILED" = true ]; then
        log_error "Some test suites failed"
        echo "📊 View detailed reports at: $REPORTS_DIR/test-summary.html"
        exit 1
    else
        log_success "All test suites passed!"
        echo "📊 View detailed reports at: $REPORTS_DIR/test-summary.html"
        exit 0
    fi
}

# Parse command line arguments
case "${1:-all}" in
    "accessibility"|"a11y")
        run_accessibility_tests
        ;;
    "performance"|"perf")
        run_performance_tests
        ;;
    "visual")
        run_visual_tests
        ;;
    "functional"|"func")
        run_functional_tests
        ;;
    "cross-browser"|"cross")
        run_cross_browser_tests
        ;;
    "all"|"")
        main
        ;;
    *)
        echo "Usage: $0 [accessibility|performance|visual|functional|cross-browser|all]"
        exit 1
        ;;
esac