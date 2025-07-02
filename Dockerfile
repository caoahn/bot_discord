# Stage 1: Build
FROM node:18-alpine AS builder

# Install build tools
RUN apk add --no-cache python3 make g++

# Set working dir
WORKDIR /app

# Copy dependencies
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

# Build
RUN npx tsc && find dist -type f -name "*.d.ts" -delete

# Stage 2: Runtime
FROM node:18-alpine

WORKDIR /app

# Only copy production deps and dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# Add non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S discordbot -u 1001
USER discordbot

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node --version || exit 1

# Run the bot
CMD ["node", "dist/index.js"]
