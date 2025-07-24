# 🐳 Docker Environments Configuration

## 📋 Overview

Aplikasi Masjid Al-Muhtaddun sekarang memiliki konfigurasi Docker yang terpisah untuk development dan production environments.

## 🏗️ File Structure

```
qiraati-muhtaddun-webapp/
├── docker-compose.yml          # Production environment
├── docker-compose.dev.yml      # Development environment
├── dev.sh                      # Development startup script (Linux/Mac)
├── prod.sh                     # Production startup script (Linux/Mac)
├── dev.ps1                     # Development startup script (Windows)
├── prod.ps1                    # Production startup script (Windows)
├── deploy.sh                   # Deployment script (Linux/Mac)
├── deploy.ps1                  # Deployment script (Windows)
└── DOCKER_ENVIRONMENTS.md      # This documentation
```

## 🔧 Development Environment

### **File:** `docker-compose.dev.yml`

**Fitur Development:**
- **Port Mapping:** Expose ports untuk akses langsung
  - Frontend: `3000:80`
  - Backend API: `3001:3001`
- **Environment:** `NODE_ENV=development`
- **Volume Mounting:** Source code mounting untuk hot reload
- **Debugging:** Health checks disabled untuk debugging

**Cara Menjalankan:**
```bash
# Windows PowerShell
.\dev.ps1

# Linux/Mac
./dev.sh

# Manual
docker-compose -f docker-compose.dev.yml up --build -d
```

**Akses:**
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:3001

## 🚀 Production Environment

### **File:** `docker-compose.yml`

**Fitur Production:**
- **No Port Mapping:** Tidak expose ports ke host (internal network only)
- **Environment:** `NODE_ENV=production`
- **No Volume Mounting:** Optimized untuk production
- **Health Checks:** Available untuk monitoring
- **Restart Policy:** `unless-stopped`

**Cara Menjalankan:**
```bash
# Windows PowerShell
.\prod.ps1

# Linux/Mac
./prod.sh

# Manual
docker-compose up --build -d
```

**Akses:**
- Aplikasi berjalan di internal Docker network
- Biasanya diakses melalui reverse proxy (nginx, traefik, dll.)

## 📊 Perbandingan Environments

| Feature | Development | Production |
|---------|-------------|------------|
| **Port Mapping** | ✅ Exposed (3000, 3001) | ❌ Internal only |
| **Environment** | `development` | `production` |
| **Volume Mounting** | ✅ Source code mounted | ❌ No mounting |
| **Health Checks** | ❌ Disabled | ✅ Enabled |
| **Hot Reload** | ✅ Available | ❌ Not available |
| **Debugging** | ✅ Easy access | ❌ Limited access |
| **Performance** | ⚠️ Development optimized | ✅ Production optimized |
| **Security** | ⚠️ Less secure | ✅ More secure |

## 🛠️ Scripts

### **Development Script (`dev.sh` / `dev.ps1`)**
```bash
#!/bin/bash
# Development Environment Script
echo "🚀 Starting Development Environment..."
docker-compose down
docker-compose -f docker-compose.dev.yml up --build -d
docker-compose -f docker-compose.dev.yml ps
```

### **Production Script (`prod.sh` / `prod.ps1`)**
```bash
#!/bin/bash
# Production Environment Script
echo "🚀 Starting Production Environment..."
docker-compose down
docker-compose up --build -d
docker-compose ps
```

### **Deployment Script (`deploy.sh` / `deploy.ps1`)**
```bash
#!/bin/bash
# Deployment Script for VPS
echo "🚀 Memulai deployment Qiraati Muhtaddun Webapp..."
docker-compose down --remove-orphans
docker image prune -f
docker-compose up --build -d
docker-compose ps
```

## 🔄 Workflow Development & Deployment

### **📝 Development Workflow (Lokal)**

1. **Development & Testing:**
   ```bash
   # Jalankan development environment
   .\dev.ps1  # Windows
   ./dev.sh   # Linux/Mac
   
   # Test aplikasi di localhost:3000
   # Pastikan semua fitur berfungsi
   ```

2. **Commit & Push:**
   ```bash
   git add .
   git commit -m "Add new features"
   git push origin main
   ```

### **🚀 Production Deployment (VPS)**

1. **Pull Kode Terbaru:**
   ```bash
   git pull origin main
   ```

2. **Deploy dengan Script:**
   ```bash
   # Linux/Mac
   ./deploy.sh
   
   # Windows (jika VPS Windows)
   .\deploy.ps1
   
   # Manual
   docker-compose down
   docker-compose up --build -d
   ```

## ❓ **FAQ: Build Production di Lokal?**

### **❌ TIDAK PERLU** build production di lokal sebelum push ke GitHub!

**Alasan:**
1. **Environment Isolation:** Development dan production terpisah
2. **Build Context:** Docker build dilakukan di environment target
3. **Security:** Production environment tidak expose ports ke host
4. **Consistency:** Memastikan build environment sama dengan runtime

### **✅ Workflow yang Benar:**

```
Development (Lokal) → Push GitHub → Production (VPS)
     ↓                      ↓              ↓
  .\dev.ps1           git push origin   ./deploy.sh
  localhost:3000      main              production
```

## 🔄 Switching Between Environments

### **Development → Production:**
```bash
# Stop development
docker-compose -f docker-compose.dev.yml down

# Start production
.\prod.ps1  # Windows
./prod.sh   # Linux/Mac
```

### **Production → Development:**
```bash
# Stop production
docker-compose down

# Start development
.\dev.ps1  # Windows
./dev.sh   # Linux/Mac
```

## 🐛 Troubleshooting

### **Port Conflicts:**
Jika port 3000 atau 3001 sudah digunakan:
```bash
# Check what's using the port
netstat -tulpn | grep :3000
netstat -tulpn | grep :3001

# Kill the process or change ports in docker-compose.dev.yml
```

### **Permission Issues:**
```bash
# Make scripts executable (Linux/Mac)
chmod +x dev.sh prod.sh deploy.sh
```

### **Container Issues:**
```bash
# View logs
docker-compose -f docker-compose.dev.yml logs
docker-compose logs

# Rebuild containers
docker-compose -f docker-compose.dev.yml up --build --force-recreate
docker-compose up --build --force-recreate
```

## 📝 Best Practices

### **Development:**
1. Gunakan `dev.ps1` atau `dev.sh` untuk memulai development
2. Akses aplikasi melalui localhost:3000
3. Gunakan volume mounting untuk hot reload
4. Monitor logs untuk debugging
5. **JANGAN** build production di lokal

### **Production:**
1. Gunakan `deploy.sh` atau `deploy.ps1` untuk deployment
2. Jangan expose ports ke host
3. Gunakan reverse proxy untuk akses eksternal
4. Monitor health checks
5. Backup data secara regular

## 🔒 Security Considerations

### **Development:**
- Ports exposed untuk kemudahan debugging
- Volume mounting bisa mengekspos source code
- Environment variables untuk development

### **Production:**
- No port exposure (internal network only)
- No volume mounting
- Environment variables untuk production
- Health checks untuk monitoring
- Restart policies untuk reliability

## 📚 Additional Resources

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Production Deployment Guide](DEPLOYMENT.md) 