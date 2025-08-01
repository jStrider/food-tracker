# 🧪 PR Test Workflow - FoodTracker

## Overview
This document defines the comprehensive test workflow that must be followed before creating any Pull Request. This ensures code quality, prevents regressions, and maintains project stability.

## Pre-PR Checklist

### 1. 🔍 Static Analysis (5 mins)
```bash
# Frontend
cd frontend
npm run typecheck          # TypeScript compilation check
npm run lint               # ESLint validation
npm run pre-build          # Full pre-build validation

# Backend
cd ../backend
npm run lint               # ESLint for backend
npm run build              # Build check
```

**Expected**: All commands must pass with 0 errors

### 2. 🧪 Unit Tests (10 mins)
```bash
# Frontend tests
cd frontend
npm run test               # Run all unit tests
npm run test:coverage      # Check coverage (target: >80%)

# Backend tests
cd ../backend
npm run test               # Run all backend tests
npm run test:cov           # Coverage report
```

**Expected**: 
- All tests pass
- Coverage >80% for new code
- No broken tests

### 3. 🎭 E2E Tests (15 mins)
```bash
# Start services
docker compose up -d

# Run E2E tests
cd frontend
npm run test:e2e           # Playwright tests

# Critical user flows to test:
# - User registration/login
# - Create/edit/delete meal
# - Calendar navigation
# - Nutrition calculations
```

**Expected**: All E2E tests pass

### 4. 🏗️ Build Verification (5 mins)
```bash
# Test Docker builds
docker compose build frontend
docker compose build backend

# Test production builds
cd frontend && npm run build
cd ../backend && npm run build
```

**Expected**: Builds complete without errors

### 5. 🔄 Integration Testing (10 mins)
```bash
# Full stack test
docker compose up -d
# Wait for services to start

# Test API endpoints
curl http://localhost:3001/health
curl http://localhost:3001/api/v1/meals

# Test frontend
open http://localhost:3000
```

**Manual checks**:
- [ ] Frontend loads correctly
- [ ] API responds
- [ ] Database connections work
- [ ] Authentication flows work

### 6. 📱 Responsive Testing (5 mins)
Test on different viewports:
- [ ] Desktop (1920x1080)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667)

Key areas:
- Calendar views
- Meal forms
- Navigation
- Modals

### 7. ♿ Accessibility Testing (5 mins)
```bash
# Run automated checks
cd frontend
npm run test:a11y  # If available

# Manual checks with browser DevTools
# - Lighthouse accessibility score >90
# - Keyboard navigation works
# - Screen reader compatible
```

### 8. 🚀 Performance Testing (5 mins)
Browser DevTools checks:
- [ ] Initial load <3s
- [ ] No memory leaks
- [ ] Bundle size reasonable
- [ ] 60fps scrolling

### 9. 🔒 Security Validation (3 mins)
- [ ] No hardcoded secrets
- [ ] API auth required
- [ ] Input validation works
- [ ] XSS protection active

### 10. 📚 Documentation Check (2 mins)
- [ ] Code comments updated
- [ ] README updated if needed
- [ ] CHANGELOG entry added
- [ ] API docs current

## Automated PR Validation Script

Create this script as `scripts/pr-validate.sh`:

```bash
#!/bin/bash
set -e

echo "🚀 Starting PR validation..."

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# Function to run command and check result
run_check() {
    local name=$1
    local command=$2
    echo -n "Running $name... "
    if eval $command > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC}"
        return 0
    else
        echo -e "${RED}✗${NC}"
        return 1
    fi
}

# Frontend checks
echo "📦 Frontend validation:"
cd frontend
run_check "TypeScript" "npm run typecheck"
run_check "Lint" "npm run lint"
run_check "Tests" "npm run test"
run_check "Build" "npm run build"

# Backend checks
echo -e "\n📦 Backend validation:"
cd ../backend
run_check "Lint" "npm run lint"
run_check "Tests" "npm run test"
run_check "Build" "npm run build"

# Docker checks
echo -e "\n🐳 Docker validation:"
cd ..
run_check "Frontend Docker" "docker compose build frontend"
run_check "Backend Docker" "docker compose build backend"

echo -e "\n✅ All checks passed! Ready for PR."
```

## PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing Performed
- [ ] Unit tests pass
- [ ] E2E tests pass
- [ ] Manual testing completed
- [ ] Responsive testing done
- [ ] Accessibility checked

## Checklist
- [ ] Code follows project style
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings
- [ ] Tests added/updated

## Screenshots (if UI changes)
[Add screenshots here]

## Performance Impact
[Describe any performance implications]
```

## CI/CD Integration

Add to `.github/workflows/pr-checks.yml`:

```yaml
name: PR Validation

on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: |
          cd frontend && npm ci
          cd ../backend && npm ci
          
      - name: Run validation
        run: ./scripts/pr-validate.sh
        
      - name: Comment results
        if: failure()
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '❌ PR validation failed. Please run `./scripts/pr-validate.sh` locally.'
            })
```

## Special Considerations

### For Calendar Features
- Test all views (Month/Week/Day)
- Verify navigation between dates
- Check meal CRUD operations
- Validate nutrition calculations

### For Authentication Changes
- Test login/logout flows
- Verify JWT handling
- Check protected routes
- Test session persistence

### For API Changes
- Update Swagger docs
- Test with Postman/curl
- Verify error responses
- Check rate limiting

## Time Estimate
- **Quick fix**: 15-20 minutes
- **Feature addition**: 30-45 minutes
- **Major change**: 45-60 minutes

## Emergency Hotfix
For critical production issues only:
1. Run minimal tests (TypeScript + critical E2E)
2. Deploy to staging first
3. Monitor for 15 minutes
4. Full test suite after deployment

---

**Remember**: Quality > Speed. A well-tested PR saves time in the long run!