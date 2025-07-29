# Docker bcrypt Compilation Issues - Solutions

## Problem
Docker build fails when compiling bcrypt native binaries with error:
```
gyp ERR! stack FetchError: request to https://nodejs.org/download/release/v18.20.8/node-v18.20.8-headers.tar.gz failed, reason: socket hang up
```

## Solutions Implemented

### Solution 1: Enhanced Dockerfile with Retry Logic (Current)
**File**: `Dockerfile`

- **Retry mechanism**: Configures npm with retry settings for network downloads
- **Fallback strategy**: If `npm rebuild bcrypt --build-from-source` fails, falls back to `npm install bcrypt@latest --force`
- **Network resilience**: Increases timeout and retry values for unstable connections

```dockerfile
RUN npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-retries 5 && \
    npm install --only=production --ignore-scripts && \
    (npm rebuild bcrypt --build-from-source || npm install bcrypt@latest --force)
```

### Solution 2: bcryptjs Alternative (Backup)
**File**: `Dockerfile.bcryptjs`

- **No compilation**: Uses `bcryptjs` (pure JavaScript) instead of `bcrypt` (native)
- **Smaller image**: Removes build dependencies (python3, make, g++)
- **Faster builds**: No native compilation step
- **100% compatible**: Drop-in replacement for bcrypt API

**Trade-offs**:
- ✅ Faster Docker builds, smaller images, no compilation issues
- ❌ ~30% slower hashing performance (negligible for most apps)

## Usage

### Current Solution (Enhanced Dockerfile)
```bash
docker build -f backend/Dockerfile -t foodtracker-backend .
```

### Alternative Solution (bcryptjs)
```bash
# Build with bcryptjs version
docker build -f backend/Dockerfile.bcryptjs -t foodtracker-backend .

# Or replace current Dockerfile temporarily
cp backend/Dockerfile.bcryptjs backend/Dockerfile
docker build -f backend/Dockerfile -t foodtracker-backend .
```

## Additional Debugging Options

### 1. Check Network Connectivity
```bash
# Test if Docker can reach nodejs.org
docker run --rm alpine/curl -I https://nodejs.org/download/release/v18.20.8/node-v18.20.8-headers.tar.gz
```

### 2. Use Docker BuildKit with Network Mode
```bash
# Enable BuildKit with host networking (for corporate proxies)
DOCKER_BUILDKIT=1 docker build --network=host -f backend/Dockerfile -t foodtracker-backend .
```

### 3. Pre-download Headers (Advanced)
```bash
# Download headers manually and add to Dockerfile
RUN curl -o node-headers.tar.gz https://nodejs.org/download/release/v18.20.8/node-v18.20.8-headers.tar.gz
```

## Recommendations

1. **Try current solution first**: Enhanced Dockerfile with retry logic
2. **If still failing**: Use bcryptjs alternative (`Dockerfile.bcryptjs`)
3. **For production**: Both solutions are production-ready
4. **Performance critical**: Stick with bcrypt (current solution)
5. **Simplicity preferred**: Use bcryptjs alternative

## Migration to bcryptjs (if needed)

If you choose the bcryptjs alternative:

1. **Update package.json**:
```bash
cd backend
npm uninstall bcrypt
npm install bcryptjs
npm install --save-dev @types/bcryptjs
```

2. **Update imports** (if using direct imports):
```typescript
// From
import * as bcrypt from 'bcrypt';

// To
import * as bcrypt from 'bcryptjs';
```

3. **API remains identical** - no code changes needed for NestJS hash service