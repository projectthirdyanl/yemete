# Multi-stage Dockerfile for production-optimized Next.js application
# Security: Non-root user, minimal base image, no build tools in final image

FROM node:20-alpine AS base

# Install security updates and required dependencies
RUN apk update && \
    apk upgrade && \
    apk add --no-cache libc6-compat curl && \
    rm -rf /var/cache/apk/*

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy dependency files
COPY package.json package-lock.json* ./

# Install dependencies with production-only flag for security
RUN npm ci --only=production --ignore-scripts && \
    npm cache clean --force

# Development dependencies stage (for building)
FROM base AS deps-dev
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci && \
    npm cache clean --force

# Builder stage - compile application
FROM base AS builder
WORKDIR /app

# Copy all dependencies (including dev dependencies for build)
COPY --from=deps-dev /app/node_modules ./node_modules

# Copy source code
COPY . .

# Generate Prisma Client (required for build)
RUN npx prisma generate

# Build Next.js application
# Using standalone output for minimal production image
RUN npm run build

# Production image - minimal and secure
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy built application from builder
# Next.js standalone output includes only production dependencies
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Health check for container orchestration
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Start the application
CMD ["node", "server.js"]
