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

# Set environment variables untuk build
ENV VITE_SUPABASE_URL=https://vqrtwwberevzvxmcycij.supabase.co
ENV VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxcnR3d2JlcmV2enZ4bWN5Y2lqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIxNDY0ODgsImV4cCI6MjA2NzcyMjQ4OH0.WD9swBhT3wMbEEPruCmouatFxCVlJ6HzVfGIx29E7Uc

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