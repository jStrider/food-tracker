#!/bin/bash

# Test E2E for CI/pre-commit
# Only run if Docker compose is up

echo "🧪 Running E2E tests..."

# Check if Docker containers are running
if ! docker compose ps | grep -q "foodtracker-backend.*Up.*healthy"; then
    echo "⚠️  Backend container not running. Skipping E2E tests."
    echo "💡 Run 'docker compose up -d' to enable E2E tests."
    exit 0
fi

if ! docker compose ps | grep -q "foodtracker-frontend.*Up.*healthy"; then
    echo "⚠️  Frontend container not running. Skipping E2E tests."
    echo "💡 Run 'docker compose up -d' to enable E2E tests."
    exit 0
fi

# Run only the smoke tests for CI
# Change to frontend directory if not already there
if [ -d "frontend" ]; then
    cd frontend
fi

npm run test:e2e -- smoke-test.spec.ts --reporter=list || {
    echo "❌ E2E tests failed"
    exit 1
}

echo "✅ E2E tests passed"