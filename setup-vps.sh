#!/bin/bash

# Script setup awal VPS untuk deployment Qiraati Muhtaddun Webapp
# Mendukung Ubuntu 20.04+, CentOS 7+, Debian 11+

set -e

echo "🚀 Setup VPS untuk Qiraati Muhtaddun Webapp"
echo "============================================"

# Detect OS
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$NAME
    VER=$VERSION_ID
else
    echo "❌ Tidak dapat mendeteksi OS"
    exit 1
fi

echo "📋 OS terdeteksi: $OS $VER"

# Update sistem
echo "🔄 Updating sistem..."
if [[ "$OS" == *"Ubuntu"* ]] || [[ "$OS" == *"Debian"* ]]; then
    sudo apt update && sudo apt upgrade -y
    INSTALL_CMD="sudo apt install -y"
elif [[ "$OS" == *"CentOS"* ]] || [[ "$OS" == *"Red Hat"* ]]; then
    sudo yum update -y
    INSTALL_CMD="sudo yum install -y"
else
    echo "❌ OS tidak didukung"
    exit 1
fi

# Install dependencies dasar
echo "📦 Installing dependencies..."
$INSTALL_CMD curl wget git unzip

# Install Docker
echo "🐳 Installing Docker..."
if ! command -v docker &> /dev/null; then
    if [[ "$OS" == *"Ubuntu"* ]] || [[ "$OS" == *"Debian"* ]]; then
        # Ubuntu/Debian
        $INSTALL_CMD apt-transport-https ca-certificates curl software-properties-common
        curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
        echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
        sudo apt update
        $INSTALL_CMD docker-ce docker-ce-cli containerd.io docker-compose-plugin
    elif [[ "$OS" == *"CentOS"* ]]; then
        # CentOS
        $INSTALL_CMD yum-utils
        sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
        $INSTALL_CMD docker-ce docker-ce-cli containerd.io docker-compose-plugin
    fi
    
    # Enable dan start Docker
    sudo systemctl enable docker
    sudo systemctl start docker
    
    # Add user ke docker group
    sudo usermod -aG docker $USER
    
    echo "✅ Docker berhasil diinstall"
else
    echo "✅ Docker sudah terinstall"
fi

# Setup firewall
echo "🔥 Setup firewall..."
if command -v ufw &> /dev/null; then
    # Ubuntu/Debian UFW
    sudo ufw --force enable
    sudo ufw allow ssh
    sudo ufw allow 80/tcp
    sudo ufw allow 443/tcp
    echo "✅ UFW firewall dikonfigurasi"
elif command -v firewall-cmd &> /dev/null; then
    # CentOS/RHEL firewalld
    sudo systemctl enable firewalld
    sudo systemctl start firewalld
    sudo firewall-cmd --permanent --add-service=ssh
    sudo firewall-cmd --permanent --add-service=http
    sudo firewall-cmd --permanent --add-service=https
    sudo firewall-cmd --reload
    echo "✅ Firewalld dikonfigurasi"
fi

# Optimasi sistem untuk Docker
echo "⚡ Optimasi sistem..."
# Increase file limits
echo "fs.file-max = 100000" | sudo tee -a /etc/sysctl.conf
echo "vm.max_map_count = 262144" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p

# Setup swap jika belum ada (untuk VPS dengan RAM kecil)
if [ $(free | grep Swap | awk '{print $2}') -eq 0 ]; then
    echo "💾 Setup swap file..."
    sudo fallocate -l 1G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo "/swapfile swap swap defaults 0 0" | sudo tee -a /etc/fstab
    echo "✅ Swap 1GB ditambahkan"
fi

# Install Nginx (opsional, untuk reverse proxy)
echo "🌐 Install Nginx (opsional)..."
read -p "Install Nginx untuk reverse proxy? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if [[ "$OS" == *"Ubuntu"* ]] || [[ "$OS" == *"Debian"* ]]; then
        $INSTALL_CMD nginx certbot python3-certbot-nginx
    elif [[ "$OS" == *"CentOS"* ]]; then
        $INSTALL_CMD nginx certbot python3-certbot-nginx
    fi
    sudo systemctl enable nginx
    echo "✅ Nginx terinstall"
fi

# Setup log rotation untuk Docker
echo "📝 Setup log rotation..."
sudo tee /etc/logrotate.d/docker > /dev/null <<EOF
/var/lib/docker/containers/*/*.log {
    rotate 7
    daily
    compress
    size=1M
    missingok
    delaycompress
    copytruncate
}
EOF

echo ""
echo "✅ Setup VPS selesai!"
echo "============================================"
echo "📋 Yang sudah diinstall:"
echo "   - Docker & Docker Compose"
echo "   - Git, Curl, Wget"
echo "   - Firewall (port 22, 80, 443)"
echo "   - Swap file (1GB)"
echo "   - Log rotation untuk Docker"
echo ""
echo "📝 Langkah selanjutnya:"
echo "   1. Logout dan login kembali (atau jalankan: newgrp docker)"
echo "   2. Clone repository aplikasi"
echo "   3. Konfigurasi environment variables"
echo "   4. Jalankan deployment script"
echo ""
echo "🔄 Restart shell untuk apply Docker group:"
echo "   newgrp docker"
echo ""
echo "🚀 Siap untuk deployment!" 