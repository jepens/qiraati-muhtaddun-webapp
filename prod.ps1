# Production Environment Script for Windows PowerShell
Write-Host "🚀 Starting Production Environment..." -ForegroundColor Green

# Stop any existing containers
Write-Host "🛑 Stopping existing containers..." -ForegroundColor Yellow
docker-compose down

# Build and start production containers
Write-Host "🔨 Building and starting production containers..." -ForegroundColor Yellow
docker-compose up --build -d

# Show status
Write-Host "📊 Container status:" -ForegroundColor Cyan
docker-compose ps

Write-Host "✅ Production environment is ready!" -ForegroundColor Green
Write-Host "🌐 Application is running on production network" -ForegroundColor Cyan
Write-Host ""
Write-Host "To stop production environment:" -ForegroundColor Yellow
Write-Host "  docker-compose down" -ForegroundColor Gray 