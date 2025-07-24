#!/bin/bash

# Development Environment Script
echo "🚀 Starting Development Environment..."

# Stop any existing containers
echo "🛑 Stopping existing containers..."
docker-compose down

# Build and start development containers
echo "🔨 Building and starting development containers..."
docker-compose -f docker-compose.dev.yml up --build -d

# Show status
echo "📊 Container status:"
docker-compose -f docker-compose.dev.yml ps

echo "✅ Development environment is ready!"
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://localhost:3001"
echo ""
echo "To stop development environment:"
echo "  docker-compose -f docker-compose.dev.yml down" 