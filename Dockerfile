# Multi-stage build untuk optimasi production
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (termasuk devDependencies untuk build)
RUN npm ci

# Copy source code
COPY . .

# Set environment variables untuk build (bisa di-override via build args)
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY

ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

# Build aplikasi untuk production
RUN npm run build

# Production stage dengan Nginx
FROM nginx:alpine AS production

# Install curl untuk health check
RUN apk add --no-cache curl

# Copy built assets dari stage builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy konfigurasi nginx custom
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"] 