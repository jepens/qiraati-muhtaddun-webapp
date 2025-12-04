# Nixpacks Deployment Fix

## 🔴 Masalah
Setelah deployment dengan Nixpacks, aplikasi menampilkan error:
```
main.tsx:1 Failed to load module script: Expected a JavaScript-or-Wasm module script but the server responded with a MIME type of "". Strict MIME type checking is enforced for module scripts per HTML spec.
```

## 🔍 Root Cause
Aplikasi ini adalah **Vite + React** SPA yang memerlukan build process untuk menghasilkan static files. Masalahnya:

1. **Docker Deployment (✅ Works)**: 
   - Menggunakan multi-stage build
   - Build step: `npm run build` → menghasilkan `/dist` folder
   - Serve step: Nginx serve static files dari `/dist`
   - MIME types dikonfigurasi dengan benar di Nginx

2. **Nixpacks Deployment (❌ Broken)**:
   - Nixpacks tidak tahu cara build Vite application dengan benar
   - Mencoba serve aplikasi tanpa build process yang tepat
   - File `main.tsx` tidak di-compile/bundle dengan benar
   - Server tidak serve static files dengan MIME type yang benar

## ✅ Solusi

### 1. **Buat `nixpacks.toml` Configuration**
File ini memberitahu Nixpacks cara build dan serve aplikasi Vite dengan benar:

```toml
[phases.setup]
nixPkgs = ["nodejs_18", "npm-9_x"]

[phases.install]
cmds = ["npm ci"]

[phases.build]
cmds = ["npm run build"]

[start]
cmd = "npx serve dist -s -l 8080"

[variables]
NODE_ENV = "production"
```

**Penjelasan:**
- **setup**: Install Node.js 18 dan npm 9
- **install**: Install dependencies dengan `npm ci` (clean install)
- **build**: Jalankan `npm run build` untuk compile Vite app ke `/dist`
- **start**: Gunakan `serve` package untuk serve static files dari `/dist`
  - `-s`: Single-page application mode (fallback ke index.html untuk routing)
  - `-l 8080`: Listen di port 8080
- **variables**: Set NODE_ENV ke production

### 2. **Update `package.json`**
Tambahkan:
- Script `"start": "serve dist -s -l 8080"` untuk production serving
- Dependency `"serve": "^14.2.4"` untuk static file server

## 📝 Langkah Deployment

1. **Commit perubahan:**
   ```bash
   git add nixpacks.toml package.json package-lock.json
   git commit -m "fix: add Nixpacks configuration for Vite deployment"
   git push
   ```

2. **Redeploy dengan Nixpacks:**
   Nixpacks akan otomatis mendeteksi `nixpacks.toml` dan mengikuti instruksi yang ada.

3. **Verify build process:**
   - Phase 1: Install Node.js + npm
   - Phase 2: `npm ci` - install dependencies
   - Phase 3: `npm run build` - build aplikasi ke `/dist`
   - Phase 4: `npx serve dist -s -l 8080` - serve static files

## 🔧 Environment Variables
Pastikan environment variables berikut tersedia saat build:
- `VITE_SUPABASE_URL`: URL Supabase project
- `VITE_SUPABASE_ANON_KEY`: Supabase anon key

**Catatan**: Environment variables dengan prefix `VITE_` akan di-inline ke dalam bundle saat build time.

## ✨ Hasil Akhir
Setelah deployment:
- ✅ Build process berjalan dengan benar
- ✅ Static files di-serve dari `/dist`
- ✅ MIME types dikonfigurasi dengan benar oleh `serve`
- ✅ SPA routing berfungsi (fallback ke index.html)
- ✅ Aplikasi accessible di browser tanpa error

## 🔗 Alternative: Tetap Gunakan Docker
Jika lebih nyaman dengan Docker, Anda bisa tetap menggunakan `Dockerfile` dan `docker-compose.yml` yang sudah ada. Deployment dengan Docker sudah terbukti bekerja dengan baik.

Pilih salah satu:
- **Nixpacks**: Lebih simple, otomatis detect, cocok untuk platform seperti Railway/Render
- **Docker**: Lebih kontrol, consistent across environments, cocok untuk VPS/Kubernetes
