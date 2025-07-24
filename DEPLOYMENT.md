# 🚀 Panduan Deployment Qiraati Muhtaddun Webapp

Panduan lengkap untuk deploy aplikasi Qiraati Muhtaddun Webapp menggunakan Docker di VPS.

## 📋 Prasyarat

### 1. VPS Requirements
- **OS**: Ubuntu 20.04+ / CentOS 7+ / Debian 11+
- **RAM**: Minimal 1GB (Recommended 2GB+)
- **Storage**: Minimal 10GB free space
- **CPU**: 1 vCPU (Recommended 2+ vCPU)

### 2. Software yang Dibutuhkan
- Docker (versi 20.10+)
- Docker Compose (versi 2.0+)
- Git
- Curl

## 🔧 Instalasi Prerequisites

### Install Docker & Docker Compose di Ubuntu
```bash
# Update sistem
sudo apt update && sudo apt upgrade -y

# Install dependencies
sudo apt install -y apt-transport-https ca-certificates curl software-properties-common

# Add Docker repository
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Enable dan start Docker
sudo systemctl enable docker
sudo systemctl start docker

# Add user ke docker group
sudo usermod -aG docker $USER

# Logout dan login kembali, atau jalankan:
newgrp docker
```

## 📂 Setup Aplikasi

### 1. Clone Repository
```bash
# Clone repository ke VPS
git clone https://github.com/your-username/qiraati-muhtaddun-webapp.git
cd qiraati-muhtaddun-webapp
```

### 2. Konfigurasi Environment
```bash
# Copy template environment
cp .env.example .env

# Edit konfigurasi (sesuaikan dengan setup Anda)
nano .env
```

**Konfigurasi wajib di `.env`:**
```env
# Supabase Configuration (WAJIB)
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Port configuration
PORT=80

# Domain (untuk production)
DOMAIN=your-domain.com
```

### 3. Deploy Aplikasi

#### Menggunakan Script Otomatis (Recommended)
```bash
# Berikan permission execute
chmod +x deploy.sh

# Jalankan deployment
./deploy.sh
```

#### Manual Deployment
```bash
# Build dan jalankan container
docker-compose up --build -d

# Check status
docker-compose ps

# Lihat logs
docker-compose logs -f
```

## 🌐 Setup Domain & SSL (Opsional)

### 1. Setup Nginx Reverse Proxy dengan SSL
```bash
# Install nginx
sudo apt install nginx certbot python3-certbot-nginx

# Buat konfigurasi nginx
sudo nano /etc/nginx/sites-available/qiraati-webapp
```

Konfigurasi Nginx:
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/qiraati-webapp /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Setup SSL dengan Let's Encrypt
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

## 🔍 Monitoring & Maintenance

### Commands Berguna
```bash
# Lihat status container
docker-compose ps

# Lihat logs aplikasi
docker-compose logs -f

# Restart aplikasi
docker-compose restart

# Stop aplikasi
docker-compose down

# Update aplikasi
git pull
./deploy.sh

# Monitoring resource usage
docker stats

# Backup data (jika ada volume)
docker-compose exec qiraati-webapp tar -czf /backup.tar.gz /data
```

### Health Check
```bash
# Check aplikasi via curl
curl -f http://localhost:80

# Check response time
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:80
```

## 🛠️ Troubleshooting

### Problem Umum & Solusi

#### 1. Container tidak start
```bash
# Check logs untuk error
docker-compose logs

# Check disk space
df -h

# Check memory usage
free -h
```

#### 2. Port sudah digunakan
```bash
# Check port yang digunakan
sudo netstat -tulpn | grep :80

# Ganti port di .env
echo "PORT=8080" >> .env
docker-compose up -d
```

#### 3. Permission issues
```bash
# Fix ownership
sudo chown -R $USER:$USER .

# Fix permissions
chmod +x deploy.sh
```

#### 4. Memory issues
```bash
# Restart Docker daemon
sudo systemctl restart docker

# Clear unused containers/images
docker system prune -a
```

## 🔐 Security Best Practices

1. **Firewall Setup**
```bash
# Setup UFW
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

2. **Update Reguler**
```bash
# Update sistem
sudo apt update && sudo apt upgrade -y

# Update Docker images
docker-compose pull
./deploy.sh
```

3. **Backup Environment**
```bash
# Backup .env file
cp .env .env.backup.$(date +%Y%m%d)
```

## 📊 Performance Tuning

### 1. Optimasi Nginx (jika menggunakan reverse proxy)
```nginx
# Tambahkan ke konfigurasi nginx
client_max_body_size 16M;
proxy_buffer_size 128k;
proxy_buffers 4 256k;
proxy_busy_buffers_size 256k;
```

### 2. Docker Optimasi
```bash
# Set restart policy
docker-compose up -d --restart=unless-stopped

# Limit memory usage (tambahkan ke docker-compose.yml)
deploy:
  resources:
    limits:
      memory: 512M
```

## 📞 Support

Jika mengalami kendala:
1. Check logs: `docker-compose logs`
2. Check documentation ini
3. Check GitHub issues
4. Contact developer

---

**Selamat! Aplikasi Qiraati Muhtaddun Webapp berhasil di-deploy! 🎉** 