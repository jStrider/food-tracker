#!/bin/bash

# Script to run E2E tests with proper setup

echo "🚀 Starting E2E tests for FoodTracker..."

# Check if backend is running
if ! curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo "⚠️  Backend is not running on port 3001"
    echo "Please start the backend first with: cd ../backend && npm run start:dev"
    exit 1
fi

# Check if frontend is running
if ! curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "⚠️  Frontend is not running on port 3000"
    echo "Starting frontend in the background..."
    npm run dev &
    FRONTEND_PID=$!
    
    # Wait for frontend to be ready
    echo "Waiting for frontend to start..."
    sleep 10
fi

# Run the E2E tests
echo "🧪 Running E2E tests..."
npm run test:e2e

# Store the exit code
TEST_EXIT_CODE=$?

# If we started the frontend, stop it
if [ ! -z "$FRONTEND_PID" ]; then
    echo "Stopping frontend..."
    kill $FRONTEND_PID 2>/dev/null
fi

# Exit with the test exit code
if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo "✅ E2E tests passed!"
else
    echo "❌ E2E tests failed"
fi

exit $TEST_EXIT_CODE