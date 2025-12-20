# Dispatch Protocol Server
# Self-hosted fire department dispatch system
#
# MIT License - Free forever. frack predatory private equity.

FROM node:20-alpine AS builder

# Install build dependencies for native modules (better-sqlite3, bcrypt)
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files and install ALL deps (including devDependencies for build)
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

# Production stage
FROM node:20-alpine

RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files and install production deps only
COPY package*.json ./
RUN npm ci --only=production

# Copy built files from builder
COPY --from=builder /app/dist ./dist
COPY src/web/ ./src/web/

# Create data directory for SQLite
RUN mkdir -p /app/data

# Environment
ENV NODE_ENV=production
ENV HTTP_PORT=3000
ENV WS_PORT=3001
ENV DB_PATH=/app/data/dispatch.db

# Railway uses PORT env var
ENV PORT=3000

# Expose port (Railway assigns dynamically)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT}/api/health || exit 1

# Run server
CMD ["node", "dist/server/index.js"]
