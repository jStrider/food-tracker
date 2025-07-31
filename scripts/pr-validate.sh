#!/bin/bash
set -e

echo "🚀 Starting PR validation for FoodTracker..."

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Track overall status
FAILED=0
WARNINGS=0

# Function to run command and check result
run_check() {
    local name=$1
    local command=$2
    local required=${3:-true}
    
    echo -n "  $name... "
    
    if eval $command > /tmp/pr-check-output.log 2>&1; then
        echo -e "${GREEN}✓${NC}"
        return 0
    else
        if [ "$required" = true ]; then
            echo -e "${RED}✗${NC}"
            echo "    Error output:"
            cat /tmp/pr-check-output.log | head -5
            FAILED=$((FAILED + 1))
        else
            echo -e "${YELLOW}⚠${NC} (warning)"
            WARNINGS=$((WARNINGS + 1))
        fi
        return 1
    fi
}

# Helper to check if service is running
check_service() {
    local service=$1
    local port=$2
    nc -z localhost $port 2>/dev/null
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📦 FRONTEND VALIDATION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cd frontend 2>/dev/null || { echo "Frontend directory not found!"; exit 1; }

run_check "TypeScript compilation" "npm run typecheck"
run_check "ESLint" "npm run lint" false
run_check "Unit tests" "npm run test -- --run"
run_check "Build check" "npm run build"

echo -e "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📦 BACKEND VALIDATION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cd ../backend 2>/dev/null || { echo "Backend directory not found!"; exit 1; }

run_check "ESLint" "npm run lint" false
run_check "Unit tests" "npm run test"
run_check "Build check" "npm run build"

echo -e "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🐳 DOCKER VALIDATION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cd ..

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "  Docker check... ${YELLOW}⚠${NC} (Docker not running - skipping)"
    WARNINGS=$((WARNINGS + 1))
else
    run_check "Frontend Docker build" "docker compose build frontend"
    run_check "Backend Docker build" "docker compose build backend"
fi

echo -e "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 CODE QUALITY CHECKS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check for common issues
echo -n "  Checking for console.log... "
if grep -r "console\.log" frontend/src backend/src --exclude-dir=node_modules --exclude-dir=dist > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠${NC} (found - consider removing)"
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "${GREEN}✓${NC}"
fi

echo -n "  Checking for hardcoded secrets... "
if grep -r -E "(password|secret|key|token)\s*=\s*[\"'][^\"']+[\"']" frontend/src backend/src --exclude-dir=node_modules --exclude-dir=dist > /dev/null 2>&1; then
    echo -e "${RED}✗${NC}"
    FAILED=$((FAILED + 1))
else
    echo -e "${GREEN}✓${NC}"
fi

echo -n "  Checking for TODO comments... "
TODO_COUNT=$(grep -r "TODO\|FIXME\|HACK" frontend/src backend/src --exclude-dir=node_modules --exclude-dir=dist 2>/dev/null | wc -l || echo "0")
if [ "$TODO_COUNT" -gt "10" ]; then
    echo -e "${YELLOW}⚠${NC} ($TODO_COUNT found - consider addressing)"
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "${GREEN}✓${NC} ($TODO_COUNT found)"
fi

echo -e "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $FAILED -eq 0 ]; then
    if [ $WARNINGS -eq 0 ]; then
        echo -e "${GREEN}✅ All checks passed!${NC} Ready for PR."
    else
        echo -e "${GREEN}✅ All required checks passed!${NC}"
        echo -e "${YELLOW}⚠  $WARNINGS warnings found${NC} - consider addressing before PR."
    fi
    
    echo -e "\n📝 Next steps:"
    echo "  1. Run E2E tests: cd frontend && npm run test:e2e"
    echo "  2. Test manually in browser"
    echo "  3. Update CHANGELOG.md if needed"
    echo "  4. Create PR with descriptive message"
    
    exit 0
else
    echo -e "${RED}❌ $FAILED checks failed!${NC} Please fix before creating PR."
    
    if [ $WARNINGS -gt 0 ]; then
        echo -e "${YELLOW}⚠  $WARNINGS warnings found${NC}"
    fi
    
    echo -e "\n💡 Tips:"
    echo "  - Run 'npm run typecheck' to see TypeScript errors"
    echo "  - Run 'npm run lint' to see linting issues"
    echo "  - Check /tmp/pr-check-output.log for detailed errors"
    
    exit 1
fi