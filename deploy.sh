#!/bin/bash

# Script deployment untuk Qiraati Muhtaddun Webapp
# Pastikan Docker dan Docker Compose sudah terinstall di VPS

set -e

echo "🚀 Memulai deployment Qiraati Muhtaddun Webapp..."

# Check jika .env sudah ada
if [ ! -f .env ]; then
    echo "❌ File .env tidak ditemukan!"
    echo "📋 Silakan copy .env.example ke .env dan sesuaikan konfigurasi:"
    echo "   cp .env.example .env"
    echo "   nano .env"
    exit 1
fi

# Check jika Docker running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker tidak berjalan! Pastikan Docker sudah terinstall dan berjalan."
    exit 1
fi

# Stop container yang sedang berjalan (jika ada)
echo "🛑 Menghentikan container yang sedang berjalan..."
docker-compose down --remove-orphans || true

# Remove old images untuk menghemat space (opsional)
echo "🧹 Membersihkan image lama..."
docker image prune -f || true

# Build dan start container
echo "🔨 Building dan starting aplikasi..."
docker-compose up --build -d

# Check status
echo "🔍 Checking status container..."
sleep 10
docker-compose ps

# Check health
echo "🩺 Checking health aplikasi..."
sleep 30
if curl -f http://localhost:${PORT:-80} > /dev/null 2>&1; then
    echo "✅ Aplikasi berhasil di-deploy dan berjalan di port ${PORT:-80}!"
    echo "🌐 Akses aplikasi di: http://your-server-ip:${PORT:-80}"
else
    echo "❌ Aplikasi gagal start. Check logs:"
    docker-compose logs
    exit 1
fi

# Show logs
echo "📋 Logs aplikasi:"
docker-compose logs --tail=20

echo "✅ Deployment selesai!"
echo "📋 Command berguna:"
echo "   - Lihat logs: docker-compose logs -f"
echo "   - Restart: docker-compose restart"
echo "   - Stop: docker-compose down"
echo "   - Update: ./deploy.sh" 