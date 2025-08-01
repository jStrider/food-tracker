#!/bin/bash

# Pre-build TypeScript syntax check
# This script runs before Docker build to catch syntax errors early

echo "🔍 Running TypeScript syntax check..."

# Navigate to frontend directory
cd "$(dirname "$0")/.." || exit 1

# Check if TypeScript is installed
if ! npx tsc --version > /dev/null 2>&1; then
    echo "❌ TypeScript not found. Please run 'npm install' first."
    exit 1
fi

# Run TypeScript compiler in no-emit mode to check for errors
echo "📝 Checking TypeScript files..."
npx tsc --noEmit

if [ $? -eq 0 ]; then
    echo "✅ TypeScript check passed!"
else
    echo "❌ TypeScript errors found. Please fix them before building."
    echo ""
    echo "💡 Tip: Run 'npm run typecheck' locally to see detailed errors."
    exit 1
fi

# Optional: Run ESLint for additional checks
if command -v npx eslint > /dev/null 2>&1; then
    echo "🔍 Running ESLint check..."
    npx eslint src --ext .ts,.tsx --max-warnings 0
    
    if [ $? -eq 0 ]; then
        echo "✅ ESLint check passed!"
    else
        echo "⚠️  ESLint warnings/errors found. Consider fixing them."
        # Don't exit on ESLint errors, just warn
    fi
fi

echo "✨ Pre-build checks completed!"