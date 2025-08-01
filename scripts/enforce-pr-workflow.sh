#!/bin/bash

# This script ensures Claude follows the PR workflow
# It should be run as a git pre-commit hook

echo "🔒 Enforcing PR Workflow..."

# Check if we're in a feature branch (not main/master)
CURRENT_BRANCH=$(git branch --show-current)
if [[ "$CURRENT_BRANCH" == "main" || "$CURRENT_BRANCH" == "master" ]]; then
    echo "❌ Cannot commit directly to main/master branch!"
    echo "Please create a feature branch first."
    exit 1
fi

# Check if pr-validate.sh exists and is executable
if [ ! -x "./scripts/pr-validate.sh" ]; then
    echo "❌ PR validation script not found or not executable!"
    echo "Please ensure ./scripts/pr-validate.sh exists and is executable."
    exit 1
fi

# Run the validation script
echo "Running PR validation..."
if ! ./scripts/pr-validate.sh; then
    echo ""
    echo "❌ PR validation failed!"
    echo "Fix the issues above before committing."
    echo ""
    echo "Common fixes:"
    echo "  - npm run typecheck   # Fix TypeScript errors"
    echo "  - npm run lint        # Fix linting issues"
    echo "  - npm run test        # Fix failing tests"
    exit 1
fi

echo "✅ PR validation passed! Proceeding with commit..."
exit 0