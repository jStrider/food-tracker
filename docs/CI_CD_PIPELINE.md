# 🚀 CI/CD Pipeline Documentation

## Overview

The FoodTracker project uses a comprehensive CI/CD pipeline built with GitHub Actions to ensure code quality, security, and reliable deployments.

## 🔧 Pipeline Architecture

### Workflow Files

| Workflow | Purpose | Triggers |
|----------|---------|----------|
| `ci.yml` | Main CI/CD pipeline | Push to main/develop, PRs |
| `pr-checks.yml` | Fast PR validation | Pull requests |
| `security.yml` | Security scanning | Daily schedule, security-related changes |
| `badges.yml` | Update README badges | Workflow completions |
| `release.yml` | Release management | Version tags, manual triggers |

## 📋 Pipeline Stages

### 1. Security & Vulnerability Scanning 🛡️

**Purpose**: Identify security vulnerabilities early in the development cycle

**Tools Used**:
- **Trivy**: Container and filesystem vulnerability scanning
- **npm audit**: JavaScript dependency security check
- **CodeQL**: Static code analysis for security vulnerabilities
- **TruffleHog**: Secrets detection in code and git history

**Coverage**:
- Backend, frontend, and shared package dependencies
- Docker container images
- Source code security patterns
- Git history for exposed secrets

### 2. Backend CI/CD 🏗️

**Environment**: Ubuntu with PostgreSQL 15

**Steps**:
1. **Dependencies**: Install Node.js 20 and npm packages
2. **Database**: Setup PostgreSQL test database and run migrations
3. **Type Checking**: TypeScript compilation validation
4. **Linting**: ESLint code quality checks
5. **Unit Tests**: Jest test suite with coverage reporting
6. **Integration Tests**: E2E API testing
7. **Build**: Production build verification
8. **Coverage**: Enforce 80% minimum coverage threshold

**Coverage Requirements**:
- Lines: 80%
- Functions: 80%
- Branches: 80%
- Statements: 80%

### 3. Frontend CI/CD 🎨

**Environment**: Ubuntu with Node.js 20

**Steps**:
1. **Dependencies**: Install Node.js and npm packages
2. **Type Checking**: TypeScript compilation validation
3. **Linting**: ESLint code quality checks
4. **Unit Tests**: Vitest test suite with coverage reporting
5. **Build**: Production build verification
6. **Bundle Analysis**: Size validation and optimization warnings

**Performance Budgets**:
- JavaScript: <500KB
- CSS: <100KB
- Build warnings: Zero tolerance

### 4. Shared Package CI 📦

**Purpose**: Validate shared TypeScript types and interfaces

**Steps**:
1. **Type Checking**: Strict TypeScript validation
2. **Build**: Package compilation
3. **Caching**: Build artifacts for dependent packages

### 5. E2E Testing 🎭

**Environment**: Full application stack with PostgreSQL

**Tools**: Playwright with multi-browser testing

**Coverage**:
- Critical user workflows
- Cross-browser compatibility (Chrome, Firefox, Safari, Edge)
- Accessibility compliance (WCAG 2.1 AA)
- Performance validation
- Visual regression testing

**Browsers Tested**:
- Chromium (latest)
- Firefox (latest)
- WebKit (Safari equivalent)

### 6. Performance & Lighthouse 🚀

**Tools**: Lighthouse CI with comprehensive metrics

**Thresholds**:
- Performance: >80
- Accessibility: >90
- Best Practices: >80
- SEO: >80

**Core Web Vitals**:
- LCP (Largest Contentful Paint): <2.5s
- CLS (Cumulative Layout Shift): <0.1
- TBT (Total Blocking Time): <300ms

### 7. Docker Build & Push 🐳

**Registries**: DockerHub

**Images Built**:
- `foodtracker-backend:latest` and `foodtracker-backend:${sha}`
- `foodtracker-frontend:latest` and `foodtracker-frontend:${sha}`

**Features**:
- Multi-stage builds for optimization
- Layer caching for faster builds
- Security scanning of final images

## 🔄 Workflow Triggers

### Main CI/CD Pipeline (`ci.yml`)
```yaml
on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]
  workflow_dispatch:
```

### PR Quality Checks (`pr-checks.yml`)
```yaml
on:
  pull_request:
    branches: [ main, develop ]
    types: [opened, synchronize, reopened, ready_for_review]
```

### Security Scanning (`security.yml`)
```yaml
on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM UTC
  workflow_dispatch:
  push:
    branches: [ main ]
    paths: [ 'backend/**', 'frontend/**', 'shared/**', 'package*.json' ]
```

## 📊 Quality Gates

### Automated Checks
- ✅ **TypeScript**: Zero compilation errors
- ✅ **ESLint**: Code style compliance
- ✅ **Tests**: All tests must pass
- ✅ **Coverage**: 80% minimum threshold
- ✅ **Security**: No high/critical vulnerabilities
- ✅ **Build**: Successful production builds
- ✅ **Performance**: Lighthouse thresholds met

### Manual Review Requirements
- Code review from team members (CODEOWNERS)
- Security review for security-related changes
- Database migration review for schema changes
- Performance impact assessment for large changes

## 🚨 Failure Handling

### Automatic Retries
- Network-related failures: 3 retries with exponential backoff
- Flaky test failures: Automatic re-run on failure

### Notifications
- Failed builds trigger GitHub notifications
- Security vulnerabilities create GitHub Security alerts
- Coverage drops below threshold fail the build

### Recovery Procedures
1. **Build Failures**: Check logs, fix issues, push new commits
2. **Test Failures**: Investigate failing tests, update code or tests
3. **Security Issues**: Review vulnerabilities, update dependencies
4. **Performance Regressions**: Analyze bundle size, optimize code

## 🔐 Security Measures

### Secrets Management
- All sensitive data stored in GitHub Secrets
- Environment-specific configuration
- No secrets in code or logs

### Access Control
- Branch protection rules enforce PR reviews
- CODEOWNERS file defines review requirements
- Dependabot for automated dependency updates

### Vulnerability Response
- Daily security scans
- Automated dependency updates
- Security advisory notifications
- SARIF reporting to GitHub Security tab

## 📈 Monitoring & Metrics

### Code Coverage
- Backend: Codecov integration with branch/PR reporting
- Frontend: Vitest coverage with HTML reports
- Historical coverage tracking

### Performance Monitoring
- Lighthouse CI scores over time
- Bundle size tracking
- Core Web Vitals monitoring

### Build Metrics
- Build duration tracking
- Success/failure rates
- Resource usage optimization

## 🛠️ Local Development

### Running CI Checks Locally

```bash
# Type checking
npm run typecheck  # All packages

# Linting
npm run lint      # All packages

# Testing with coverage
cd backend && npm run test:cov
cd frontend && npm run test:coverage

# Build verification
npm run build     # All packages

# E2E tests (requires running backend)
cd frontend && npm run test:e2e
```

### Pre-commit Hooks

The project uses Husky for pre-commit hooks:
- Lint-staged for code formatting
- Type checking on staged files
- Test execution for changed components

## 🚀 Deployment

### Staging Deployment
- Automatic deployment to staging on `develop` branch
- Full CI/CD pipeline execution
- Integration testing in staging environment

### Production Deployment
- Manual approval required for `main` branch deployments
- Blue-green deployment strategy
- Database migration automation
- Rollback procedures available

### Docker Deployment
```bash
# Pull latest images
docker pull foodtracker-backend:latest
docker pull foodtracker-frontend:latest

# Deploy with docker-compose
docker-compose up -d
```

## 📚 Best Practices

### Code Quality
- Maintain 80%+ test coverage
- Zero linting warnings
- TypeScript strict mode
- Regular dependency updates

### Security
- Regular security audits
- Dependency vulnerability scanning
- Secrets rotation
- Access control reviews

### Performance
- Bundle size monitoring
- Core Web Vitals compliance
- Regular performance audits
- Image optimization

### Documentation
- Keep pipeline documentation updated
- Document breaking changes
- Maintain deployment procedures
- Update security protocols

## 🆘 Troubleshooting

### Common Issues

1. **Test Timeouts**
   - Increase timeout values in test configuration
   - Check for resource contention
   - Optimize slow tests

2. **Build Failures**
   - Check dependency versions
   - Verify environment configuration
   - Review build logs for specific errors

3. **Security Scan Failures**
   - Update vulnerable dependencies
   - Review security advisories
   - Apply security patches

4. **Performance Regressions**
   - Analyze bundle size changes
   - Profile performance bottlenecks
   - Optimize critical rendering path

### Getting Help
- Check GitHub Actions logs for detailed error messages
- Review existing issues and discussions
- Contact the development team for complex issues
- Consult the security team for vulnerability-related problems

---

**Last Updated**: August 2025  
**Version**: 1.0.0  
**Maintained by**: FoodTracker DevOps Team