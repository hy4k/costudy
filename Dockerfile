# Costudy.in Frontend Dockerfile
# Multi-stage build for production static site

# ============================================
# Stage 1: Build the Vite application
# ============================================
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies first (better layer caching)
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

# Copy source files
COPY . .

# Build arguments for environment variables (injected at build time)
ARG VITE_COSTUDY_API_URL=https://api.costudy.in
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
ARG VITE_SUPABASE_ANON_KEY

# Set environment variables for the build
ENV VITE_COSTUDY_API_URL=$VITE_COSTUDY_API_URL
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

# Build the application
RUN npm run build

# ============================================
# Stage 2: Serve with nginx
# ============================================
FROM nginx:alpine AS production

# Copy custom nginx configuration
COPY --from=builder /app/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy _redirects for SPA routing (fallback handled by nginx.conf)
# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:80/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
