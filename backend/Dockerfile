# =========================================================
# CloudVault Backend Production Dockerfile (Multi-Stage)
# =========================================================

# Stage 1: Build Dependencies
FROM node:20-alpine AS dependencies
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Stage 2: Final Production Runner
FROM node:20-alpine AS runner
WORKDIR /app

# Install system utilities needed for PDF processing & poppler (poppler-utils)
RUN apk add --no-cache poppler-utils cairo-dev pango-dev jpeg-dev giflib-dev librsvg-dev

ENV NODE_ENV=production
ENV PORT=5000

# Copy node_modules from dependencies stage
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .

# Create uploads and logs directories
RUN mkdir -p uploads/thumbnails logs

# Expose HTTP Port
EXPOSE 5000

# Health check endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:5000/api/files/list/all || exit 1

# Start Server
CMD ["node", "server.js"]
