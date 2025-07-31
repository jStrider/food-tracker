# 🧪 Testing Infrastructure Documentation

## Overview

This document describes the comprehensive testing infrastructure implemented as part of the Testing Infrastructure Improvement Plan (Issue #86). The infrastructure provides automated testing, coverage reporting, quality monitoring, and CI/CD integration.

## Architecture

### Phase 1: Critical Fixes ✅
- Fixed backend compilation errors in test files
- Resolved variable naming inconsistencies  
- Added missing imports (NotFoundException, Repository, date-fns)
- Standardized test file structure

### Phase 2: Framework Updates ✅
- Created comprehensive Jest configuration with separate unit and e2e test projects
- Updated package.json with new test scripts (test:unit, test:e2e, typecheck)
- Implemented test/jest-e2e.json configuration
- Enhanced jest.config.js with proper module resolution

### Phase 3: Infrastructure ✅
- Enhanced CI/CD pipeline with comprehensive quality gates
- Implemented coverage reporting with Codecov integration
- Added security scanning with OWASP ZAP
- Created pre-commit hooks for local development
- Implemented performance monitoring and quality drift detection
- Added comprehensive test utilities and helpers

## Components

### 1. CI/CD Pipeline (.github/workflows/ci.yml)

**Enhanced Features:**
- PostgreSQL and Redis services for integration testing
- Parallel job execution (test, coverage, security, docker)
- TypeScript compilation checks for both backend and frontend
- Re-enabled backend testing (previously disabled due to ESLint issues)
- Coverage quality gates (70% backend, 60% frontend minimum)
- Security vulnerability scanning
- Docker build validation

**Jobs:**
- `test`: Linting, TypeScript checks, unit tests, e2e tests, builds
- `coverage`: Coverage generation and quality gates with Codecov integration
- `security`: Dependency audits and OWASP ZAP security scanning
- `docker`: Docker build and stack testing

### 2. Quality Monitoring (.github/workflows/quality-monitoring.yml)

**Daily Monitoring:**
- Dependency security checks with vulnerability thresholds
- Bundle size monitoring (5MB threshold)
- Code quality drift detection using ESLint metrics
- Test stability checks (multiple runs to detect flaky tests)

**Automated Alerts:**
- Critical/high vulnerabilities → Pipeline failure
- Bundle size exceeds 5MB → Pipeline failure  
- ESLint errors → Quality drift alert
- Test failure rate >10% → Stability issue alert

### 3. Pre-commit Hooks (.pre-commit-config.yaml)

**Local Quality Gates:**
- Trailing whitespace and line ending fixes
- JSON/YAML syntax validation
- Backend and frontend linting
- TypeScript compilation checks
- Unit test execution
- Security audit checks
- Conventional commit message validation

### 4. Test Utilities and Helpers

**Backend (backend/src/test/utils/test-helpers.ts):**
- `createTestingModule()`: Common NestJS testing module setup
- `createMockRequest()` / `createMockResponse()`: HTTP request/response mocks
- `generateTestData`: Type-safe test data factories
- `sleep()`: Async operation testing helper

**Frontend (frontend/src/test/utils/test-utils.tsx):**
- Custom render function with React Router and React Query providers
- `createMockApiResponse()`: API response mocking helper
- `mockLocalStorage()`: localStorage mock implementation
- `waitMs()`: Async testing utility

### 5. Coverage Configuration (codecov.yml)

**Quality Gates:**
- Project coverage: 75% target, 2% threshold
- Patch coverage: 80% target, 2% threshold
- Separate flags for backend (70% target) and frontend (60% target)
- Automatic carryforward for stable coverage tracking

### 6. Management Scripts

**Test Dashboard (scripts/test-dashboard.js):**
- Coverage metrics visualization
- Quality recommendations
- Real-time status reporting

**Performance Benchmark (scripts/performance-benchmark.js):**
- Test execution time monitoring
- Bundle size analysis
- Build performance tracking
- Historical performance data

**Setup Script (scripts/setup-testing.sh):**
- Automated infrastructure setup
- Pre-commit hooks installation
- Test utilities configuration
- Dependency installation and validation

## Usage

### Local Development

```bash
# Install and setup testing infrastructure
./scripts/setup-testing.sh

# Run all quality checks
npm run quality:check

# Generate coverage reports
npm run test:coverage

# View test dashboard
npm run quality:dashboard

# Run performance benchmarks
npm run performance:benchmark

# Watch mode for development
npm run test:watch
```

### Available Scripts

```bash
# Testing
npm run test:all              # All tests (unit + e2e)
npm run test:backend          # Backend unit tests
npm run test:frontend         # Frontend unit tests  
npm run test:e2e              # Backend e2e tests
npm run test:coverage         # Generate coverage reports
npm run test:watch            # Watch mode for both backend/frontend

# Quality Checks
npm run lint                  # ESLint for both backend/frontend
npm run typecheck            # TypeScript compilation checks
npm run quality:check        # Full quality check (lint + typecheck + test)
npm run security:audit       # Security vulnerability audit

# Monitoring
npm run quality:dashboard     # Test quality dashboard
npm run performance:benchmark # Performance benchmarking

# Development
npm run dev                   # Start development servers
npm run build                 # Build all packages
```

### CI/CD Integration

**Pull Request Flow:**
1. Pre-commit hooks run locally
2. CI pipeline runs on PR:
   - Code linting and TypeScript checks
   - Unit and integration tests
   - Coverage reporting and quality gates
   - Security vulnerability scanning
   - Docker build validation
3. Coverage reports posted to PR
4. All quality gates must pass for merge

**Daily Monitoring:**
- Dependency vulnerability scanning
- Performance regression detection
- Code quality drift monitoring
- Test stability validation

## Quality Standards

### Coverage Requirements
- **Backend**: 70% minimum line coverage
- **Frontend**: 60% minimum line coverage
- **New Code**: 80% minimum coverage for patches
- **Critical Paths**: 100% coverage for authentication, payment, data integrity

### Performance Thresholds
- **Test Execution**: <5 minutes for unit tests, <15 minutes for full suite
- **Bundle Size**: <5MB total frontend bundle
- **Build Time**: <5 minutes for backend build
- **Reliability**: 95%+ test pass rate, <5% flaky tests

### Security Standards
- **Vulnerabilities**: Zero tolerance for critical/high severity
- **Dependencies**: Regular security audits with automated alerts
- **Code Quality**: Zero ESLint errors, controlled warning count (<50)

## Troubleshooting

### Common Issues

**1. Pre-commit Hooks Failing**
```bash
# Reinstall hooks
pre-commit uninstall
pre-commit install
pre-commit install --hook-type commit-msg

# Run hooks manually
pre-commit run --all-files
```

**2. Coverage Below Threshold**
```bash
# Generate detailed coverage report
npm run test:coverage
npm run quality:dashboard

# Check coverage per file
open backend/coverage/lcov-report/index.html
open frontend/coverage/index.html
```

**3. Flaky Tests**
```bash
# Run tests multiple times to identify flaky tests
for i in {1..10}; do npm run test:all || echo "Failed run $i"; done

# Check test stability
npm run performance:benchmark
```

**4. Security Vulnerabilities**
```bash
# Fix vulnerabilities
npm audit fix
npm audit fix --force  # If needed for breaking changes

# Check specific vulnerabilities
npm audit --audit-level moderate
```

### Performance Optimization

**Backend Tests:**
- Use SQLite in-memory database for speed
- Mock external API calls
- Parallel test execution where possible
- Proper test isolation and cleanup

**Frontend Tests:**
- Use Vitest for faster TypeScript testing
- Mock API calls with MSW
- Component testing with React Testing Library
- Avoid unnecessary re-renders in tests

## Monitoring and Alerting

### GitHub Actions Integration
- **Status Checks**: All quality gates must pass for PR merge
- **Coverage Reports**: Automatic coverage posting to PRs
- **Security Alerts**: Immediate notification of vulnerabilities
- **Performance Alerts**: Bundle size and performance regression detection

### Quality Metrics Dashboard
- Real-time coverage metrics
- Test execution performance
- Security vulnerability status
- Code quality trends

### Automated Responses
- **Critical Vulnerabilities**: Immediate pipeline failure
- **Coverage Drop**: PR blocking until coverage restored
- **Performance Regression**: Alert and investigation tracking
- **Test Failures**: Automatic retry once, then investigation

## Best Practices

### Test Writing
1. **Arrange-Act-Assert Pattern**: Clear test structure
2. **Descriptive Test Names**: What behavior is being tested
3. **Single Responsibility**: One assertion per test when possible
4. **Mock External Dependencies**: Isolated, predictable tests
5. **Test Edge Cases**: Null values, empty arrays, error conditions

### Coverage Strategy
1. **Focus on Business Logic**: Prioritize core functionality
2. **Test Public APIs**: Focus on exported functions/components
3. **Integration Over Unit**: Test realistic user scenarios
4. **Regression Prevention**: Write tests for every bug fix

### Performance Considerations
1. **Fast Feedback**: Unit tests under 5 minutes total
2. **Parallel Execution**: Utilize available CPU cores
3. **Smart Caching**: Cache dependencies and build artifacts
4. **Test Isolation**: Avoid shared state between tests

## Migration Guide

### From Previous Setup
1. **Run Setup Script**: `./scripts/setup-testing.sh`
2. **Update Dependencies**: `npm run install:all`
3. **Install Pre-commit**: Pre-commit hooks automatically installed
4. **Verify Setup**: `npm run quality:check`
5. **Update CI/CD**: New pipeline automatically active

### Team Onboarding
1. **Clone Repository**: Standard git clone
2. **Run Setup**: `./scripts/setup-testing.sh` (one-time setup)
3. **Install Dependencies**: `npm run install:all`
4. **Verify Installation**: `npm run test:all`
5. **Review Documentation**: Read this guide and best practices

## Maintenance

### Regular Tasks
- **Weekly**: Review coverage trends, update dependencies
- **Monthly**: Security audit, performance benchmark review
- **Quarterly**: Test infrastructure review, quality standards update

### Continuous Improvement
- Monitor test execution times and optimize slow tests
- Review and update coverage thresholds based on codebase evolution
- Enhance test utilities based on common patterns
- Update security scanning rules and thresholds

---

## Related Documentation
- [PR Test Workflow](./PR_TEST_WORKFLOW.md) - Required workflow for all PRs
- [Issue #86](https://github.com/jStrider/food-tracker/issues/86) - Original improvement plan
- [Calendar Implementation Status](./CALENDAR_IMPLEMENTATION_STATUS.md) - Current feature status

## Support
For issues with the testing infrastructure:
1. Check this documentation and troubleshooting section
2. Review CI/CD pipeline logs for specific error details
3. Run `npm run quality:dashboard` for current status
4. Create issue with `testing` label for infrastructure problems