# Fix for Issue #89: 500 Internal Server Error when adding meals

## Root Cause
The issue was not actually a 500 error but an authentication requirement:
1. Global `JwtAuthGuard` in backend requires authentication for all routes
2. Frontend was not handling the authentication flow properly
3. Port configuration mismatch between local dev (3001) and Docker (3002)

## Solution Implemented

### 1. Auto-initialization with Default User
Created `frontend/src/utils/initializeApp.ts` that:
- Checks if user has a valid JWT token
- If not, creates a default user via `/users/init-default`
- Automatically logs in with the default user
- Stores the JWT token for subsequent requests

### 2. App Initialization on Mount
Modified `frontend/src/App.tsx` to:
- Import and call `initializeApp()` on component mount
- Ensures user is authenticated before any API calls

### 3. Fixed Docker Environment Configuration
Updated `frontend/.env.docker` to use correct port:
- Changed from `http://backend:3001` to `http://localhost:3002`
- Frontend runs in browser, needs to connect to exposed host port

## How It Works

1. When the app starts, it checks for an existing JWT token
2. If no valid token exists, it:
   - Creates a default development user
   - Logs in automatically with credentials
   - Stores the JWT token
3. All subsequent API calls include the JWT token
4. If token expires, the process repeats automatically

## Usage

### Local Development
```bash
# Backend runs on port 3001
npm run dev
```

### Docker Environment
```bash
# Backend exposed on port 3002
docker-compose up
```

The app will automatically handle authentication in both environments.

## Testing
1. Clear localStorage to remove any existing tokens
2. Open the app in a fresh browser session
3. The app should automatically authenticate
4. You should be able to create meals without errors

## Future Improvements
- Add proper user registration/login flow
- Implement token refresh mechanism
- Add loading state during initialization
- Handle edge cases in authentication flow