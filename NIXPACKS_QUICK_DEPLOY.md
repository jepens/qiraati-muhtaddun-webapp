# Nixpacks Quick Deploy Guide

## 📋 Pre-Deployment Checklist

### 1. Verify Files
Pastikan file-file berikut ada di repository:
- ✅ `nixpacks.toml` - Nixpacks configuration
- ✅ `package.json` - dengan dependency `serve` dan script `start`
- ✅ `.env` atau environment variables di platform

### 2. Environment Variables
Set environment variables berikut di platform deployment (Railway, Render, dll):

```bash
# Required
VITE_SUPABASE_URL=https://vqrtwwberevzvxmcycij.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Optional (jika ada)
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

**⚠️ PENTING**: Variables dengan prefix `VITE_` harus tersedia saat **BUILD TIME**, bukan runtime.

### 3. Commit & Push
```bash
git add nixpacks.toml package.json package-lock.json
git commit -m "feat: configure Nixpacks for deployment"
git push origin main
```

## 🚀 Platform-Specific Instructions

### Railway
1. Connect repository di Railway dashboard
2. Railway auto-detect `nixpacks.toml`
3. Set environment variables di Settings → Variables
4. Deploy otomatis saat push to main

**Port Configuration:**
- Nixpacks config: port 8080
- Railway otomatis expose port via `$PORT` variable
- Jika perlu custom port, update di `nixpacks.toml`:
  ```toml
  [start]
  cmd = "npx serve dist -s -l $PORT"
  ```

### Render
1. Create New Web Service
2. Connect repository
3. Build Command: Kosongkan (handled by Nixpacks)
4. Start Command: Kosongkan (handled by Nixpacks)
5. Set environment variables
6. Deploy

### Vercel (Alternative - Native Vite Support)
Vercel sudah native support Vite, tidak perlu `nixpacks.toml`:
```bash
npm i -g vercel
vercel
```

## 🧪 Test Locally (Simulate Nixpacks)

### Step 1: Build
```bash
npm run build
```

Verify output:
- ✅ Folder `/dist` created
- ✅ Files: `index.html`, `assets/*.js`, `assets/*.css`

### Step 2: Serve
```bash
npm start
# atau
npx serve dist -s -l 8080
```

### Step 3: Test
Buka browser: `http://localhost:8080`

Test checklist:
- ✅ Homepage loads tanpa error console
- ✅ Routing works (navigate ke different pages)
- ✅ Supabase connection works
- ✅ Static assets (images, icons) loading
- ✅ No "Failed to load module script" error

## 🔍 Troubleshooting

### Build Gagal: "VITE_SUPABASE_URL is not defined"
**Cause**: Environment variables tidak tersedia saat build.
**Fix**: Set di platform dashboard sebelum build.

### 404 Not Found di Routes
**Cause**: SPA routing tidak configure.
**Fix**: Sudah handled by `serve -s` flag (single-page mode).

### Port Conflict
**Cause**: Port 8080 sudah digunakan.
**Fix**: 
```bash
npx serve dist -s -l 3000  # gunakan port lain
```

### "Module not found" Error
**Cause**: Dependencies tidak ter-install atau build incomplete.
**Fix**:
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

## 📊 Deployment Metrics

Expected build time:
- Install deps: ~30s - 1 min
- Build: ~30s - 1 min  
- Total: ~1-2 min

Expected bundle size:
- JS: ~500KB - 1MB (after gzip)
- CSS: ~50KB - 100KB
- Total: ~1.5 - 2MB

## 🎯 Post-Deployment Verification

1. **Check Build Logs**: Verify semua steps sukses
2. **Test URL**: Buka deployed URL di browser
3. **Console Check**: F12 → Console, pastikan no errors
4. **Network Tab**: Verify all assets load dengan status 200
5. **Functionality**: Test login, navigation, features

## 🔄 Update Deployment

Untuk update aplikasi:
```bash
git add .
git commit -m "update: your changes"
git push origin main
```

Platform akan auto-rebuild dan redeploy.

## 💡 Tips

1. **Cache Busting**: Vite otomatis add hash ke filenames
2. **Compression**: `serve` package sudah include gzip
3. **Health Check**: Endpoint `/` should return 200
4. **Logs**: Check platform logs untuk debugging

## 📞 Support

Jika masih error:
1. Check build logs di platform
2. Verify environment variables
3. Test locally dengan `npm run build && npm start`
4. Compare dengan Docker deployment yang working
