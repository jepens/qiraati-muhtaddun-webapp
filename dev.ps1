# Development Environment Script for Windows PowerShell
Write-Host "🚀 Starting Development Environment..." -ForegroundColor Green

# Stop any existing containers
Write-Host "🛑 Stopping existing containers..." -ForegroundColor Yellow
docker-compose down

# Build and start development containers
Write-Host "🔨 Building and starting development containers..." -ForegroundColor Yellow
docker-compose -f docker-compose.dev.yml up --build -d

# Show status
Write-Host "📊 Container status:" -ForegroundColor Cyan
docker-compose -f docker-compose.dev.yml ps

Write-Host "✅ Development environment is ready!" -ForegroundColor Green
Write-Host "🌐 Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "🔧 Backend API: http://localhost:3001" -ForegroundColor Cyan
Write-Host ""
Write-Host "To stop development environment:" -ForegroundColor Yellow
Write-Host "  docker-compose -f docker-compose.dev.yml down" -ForegroundColor Gray 