# Backend Production Dockerfile
# Multi-stage build for optimized production image
FROM node:24-alpine AS base

# Install system dependencies and security updates
RUN apk update && apk upgrade && \
    apk add --no-cache \
    dumb-init \
    curl \
    python3 \
    py3-setuptools \
    make \
    g++ \
    && rm -rf /var/cache/apk/*

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY backend/package*.json ./
COPY shared/package*.json ./shared/

# Install production dependencies only (ignore prepare script for husky)
# Install bcrypt with retry mechanism and fallback to pre-built binaries
RUN npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-retries 5 && \
    npm install --only=production --ignore-scripts && \
    (npm rebuild bcrypt --build-from-source || npm install bcrypt@latest --force) && \
    npm cache clean --force && \
    rm -rf ~/.npm

# Build stage
FROM base AS builder
WORKDIR /app

# Copy package files
COPY backend/package*.json ./
COPY shared/package*.json ./shared/

# Install all dependencies (including dev, ignore prepare script for husky)
RUN npm install --ignore-scripts

# Copy source code
COPY backend/src ./src
COPY backend/nest-cli.json ./nest-cli.json
COPY backend/tsconfig*.json ./

# Build application with optimizations
RUN npm run build && \
    npm prune --production && \
    (npm rebuild bcrypt --build-from-source || npm install bcrypt@latest --force)

# Production runtime image
FROM node:24-alpine AS runner
WORKDIR /app

# Install security updates and build dependencies for sqlite3
RUN apk update && apk upgrade && \
    apk add --no-cache dumb-init curl python3 py3-setuptools make g++ && \
    rm -rf /var/cache/apk/*

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs --ingroup nodejs

# Copy only production files
COPY --from=deps --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/package*.json ./

# Rebuild native dependencies for the runtime environment with fallback
RUN npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-retries 5 && \
    (npm rebuild bcrypt --build-from-source || npm install bcrypt@latest --force)

# Create data directory with proper permissions
RUN mkdir -p /app/data /app/logs && \
    chown -R nestjs:nodejs /app/data /app/logs

# Set production environment
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=1024"

# Switch to non-root user
USER nestjs

# Expose port
EXPOSE 3001

# Health check with retry logic
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=5 \
  CMD curl -f http://localhost:3001/health || exit 1

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]