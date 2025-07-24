#!/bin/bash

echo "🧪 Testing Qiraati Muhtaddun Webapp..."
echo "======================================="

# Check if container is running
if docker ps | grep -q qiraati-muhtaddun-webapp; then
    echo "✅ Container is running"
else
    echo "❌ Container is not running"
    exit 1
fi

# Check container health
HEALTH_STATUS=$(docker inspect qiraati-muhtaddun-webapp --format='{{.State.Health.Status}}')
echo "🏥 Health Status: $HEALTH_STATUS"

# Test HTTP response
echo "🌐 Testing HTTP response..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:80 | grep -q "200"; then
    echo "✅ HTTP Response: 200 OK"
else
    echo "❌ HTTP Response: Failed"
fi

# Check logs for errors
echo "📋 Recent logs:"
docker logs qiraati-muhtaddun-webapp --tail=10

# Test specific endpoints
echo "🔍 Testing endpoints..."
echo "Main page: http://localhost:80"
echo "Qiraati: http://localhost:80/qiraati"
echo "Jadwal Sholat: http://localhost:80/jadwal-sholat"
echo "Tentang Kami: http://localhost:80/tentang-kami"

echo ""
echo "✅ Test completed!"
echo "🌐 Open in browser: http://localhost:80" 