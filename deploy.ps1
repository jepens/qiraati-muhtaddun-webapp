# Script deployment untuk Qiraati Muhtaddun Webapp (Windows PowerShell)
# Pastikan Docker dan Docker Compose sudah terinstall

Write-Host "🚀 Memulai deployment Qiraati Muhtaddun Webapp..." -ForegroundColor Green

# Check jika .env sudah ada
if (-not (Test-Path ".env")) {
    Write-Host "❌ File .env tidak ditemukan!" -ForegroundColor Red
    Write-Host "📋 Silakan copy .env.example ke .env dan sesuaikan konfigurasi:" -ForegroundColor Yellow
    Write-Host "   Copy-Item .env.example .env" -ForegroundColor Gray
    Write-Host "   notepad .env" -ForegroundColor Gray
    exit 1
}

# Check jika Docker running
try {
    docker info | Out-Null
} catch {
    Write-Host "❌ Docker tidak berjalan! Pastikan Docker sudah terinstall dan berjalan." -ForegroundColor Red
    exit 1
}

# Stop container yang sedang berjalan (jika ada)
Write-Host "🛑 Menghentikan container yang sedang berjalan..." -ForegroundColor Yellow
docker-compose down --remove-orphans

# Remove old images untuk menghemat space (opsional)
Write-Host "🧹 Membersihkan image lama..." -ForegroundColor Yellow
docker image prune -f

# Build dan start container
Write-Host "🔨 Building dan starting aplikasi..." -ForegroundColor Yellow
docker-compose up --build -d

# Check status
Write-Host "🔍 Checking status container..." -ForegroundColor Cyan
Start-Sleep -Seconds 10
docker-compose ps

# Check health
Write-Host "🩺 Checking health aplikasi..." -ForegroundColor Cyan
Start-Sleep -Seconds 30

$port = if ($env:PORT) { $env:PORT } else { "80" }
try {
    $response = Invoke-WebRequest -Uri "http://localhost:$port" -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Aplikasi berhasil di-deploy dan berjalan di port $port!" -ForegroundColor Green
        Write-Host "🌐 Akses aplikasi di: http://localhost:$port" -ForegroundColor Cyan
    }
} catch {
    Write-Host "❌ Aplikasi gagal start. Check logs:" -ForegroundColor Red
    docker-compose logs
    exit 1
}

# Show logs
Write-Host "📋 Logs aplikasi:" -ForegroundColor Cyan
docker-compose logs --tail=20

Write-Host "✅ Deployment selesai!" -ForegroundColor Green
Write-Host "📋 Command berguna:" -ForegroundColor Yellow
Write-Host "   - Lihat logs: docker-compose logs -f" -ForegroundColor Gray
Write-Host "   - Restart: docker-compose restart" -ForegroundColor Gray
Write-Host "   - Stop: docker-compose down" -ForegroundColor Gray
Write-Host "   - Update: .\deploy.ps1" -ForegroundColor Gray 