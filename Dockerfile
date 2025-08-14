# Multi-stage build for better caching and smaller image
FROM node:23.11.0-alpine AS deps
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Build stage
FROM node:23.11.0-alpine AS builder
WORKDIR /app

# Accept build arguments
ARG VITE_API_URL=http://localhost:7130

# Copy package files
COPY package.json package-lock.json ./

# Install all dependencies (including dev)
RUN npm ci

# Copy source code
COPY . .

# Set environment variables for build
ENV VITE_API_URL=${VITE_API_URL}

# Build the application
RUN npm run build

# Production stage
FROM node:23.11.0-alpine AS runner
WORKDIR /app

# Install serve globally
RUN npm install -g serve

# Copy built application from builder stage  
COPY --from=builder /app/dist ./dist

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S ricebikes -u 1001 -G nodejs

# Change ownership of app directory
RUN chown -R ricebikes:nodejs /app
USER ricebikes

# Expose port
EXPOSE 5173

# Start the application
CMD ["serve", "-s", "./dist", "-l", "5173"]
