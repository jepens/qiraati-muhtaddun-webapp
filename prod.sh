#!/bin/bash

# Production Environment Script
echo "🚀 Starting Production Environment..."

# Stop any existing containers
echo "🛑 Stopping existing containers..."
docker-compose down

# Build and start production containers
echo "🔨 Building and starting production containers..."
docker-compose up --build -d

# Show status
echo "📊 Container status:"
docker-compose ps

echo "✅ Production environment is ready!"
echo "🌐 Application is running on production network"
echo ""
echo "To stop production environment:"
echo "  docker-compose down" 