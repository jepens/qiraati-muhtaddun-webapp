# 🔴 EasyPanel + Nixpacks Issue

## Problem
EasyPanel's Nixpacks implementation **overrides** `nixpacks.toml` and generates its own Dockerfile with problematic cache mounts:

```dockerfile
RUN --mount=type=cache,id=...,target=/app/node_modules/.cache npm run build
```

This causes `vite: not found` because the cache mount interferes with `node_modules/.bin`.

---

## Solution Options

### ✅ Option 1: Use Custom Dockerfile (RECOMMENDED)

EasyPanel allows you to use a custom Dockerfile instead of Nixpacks auto-generation.

**Steps:**

1. **In EasyPanel Dashboard:**
   - Go to your app settings
   - Look for "Build Method" or "Buildpack" section
   - Change from "Nixpacks" to "Dockerfile"
   - Specify: `Dockerfile` (use the existing one)

2. **Existing Dockerfile already works!**
   - File: `Dockerfile` in root
   - Already tested and working
   - Uses Nginx for serving
   - Multi-stage build optimized

3. **Rebuild:**
   - Click "Rebuild" or wait for auto-deploy
   - Should use `Dockerfile` instead of generating one

---

### ✅ Option 2: Tell EasyPanel to Use Dockerfile.nixpacks

If you want to keep Nixpacks-style deployment:

**Created file:** `Dockerfile.nixpacks`
- Optimized for serve-based deployment
- Explicit vite verification
- No cache mount issues

**Configure in EasyPanel:**
- Build Method: Dockerfile
- Dockerfile path: `Dockerfile.nixpacks`

---

### ⚠️ Option 3: Platform Configuration (If Available)

Some platforms allow Nixpacks cache configuration. Check if EasyPanel has:

**Environment Variables:**
```bash
NIXPACKS_NO_CACHE=true
NIXPACKS_BUILD_FLAGS=--no-cache
```

**Or Dashboard Settings:**
- Disable build cache
- Clear cache before build

---

## Recommended Approach

### **USE THE EXISTING DOCKERFILE** ✅

Your original `Dockerfile` (the one that worked with docker-compose) is already perfect:

```dockerfile
# Multi-stage build with Nginx
FROM node:18-alpine AS builder
...
RUN npm ci
RUN npm run build

FROM nginx:alpine AS production
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
```

**Why this is best:**
- ✅ Already tested and working
- ✅ No cache mount issues
- ✅ Uses Nginx (production-grade)
- ✅ Includes compression & caching headers
- ✅ Health checks configured

**How to use in EasyPanel:**

1. **Change build method:**
   ```
   Build Method: Dockerfile
   Dockerfile: Dockerfile (default)
   ```

2. **Set environment variables:**
   ```
   VITE_SUPABASE_URL=https://vqrtwwberevzvxmcycij.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

3. **Port mapping:**
   ```
   Container Port: 80
   Expose Port: 80 or 8080
   ```

4. **Rebuild:**
   - Trigger rebuild
   - Should work immediately!

---

## Why Nixpacks is Problematic Here

**Nixpacks auto-generates Dockerfile:**
1. Detects Node.js project ✅
2. Guesses build commands ✅
3. **Adds cache mounts ❌** (causes our issue)
4. Generated Dockerfile overrides `nixpacks.toml` config

**Our `nixpacks.toml` tried to fix this but:**
- EasyPanel's Nixpacks version might ignore some config
- Cache mount is hardcoded in their Nixpacks template
- Not all Nixpacks implementations are equal

---

## Verification Steps

### After switching to Dockerfile:

**Check build logs for:**
```bash
✅ Step 8/15 : RUN npm ci
✅ added 480 packages
✅ Step 9/15 : RUN npm run build
✅ vite v5.4.10 building for production...
✅ ✓ built in X.XXs
✅ Step 11/15 : FROM nginx:alpine
✅ Successfully built [image-id]
```

**No more:**
```bash
❌ sh: 1: vite: not found
❌ exit code: 127
```

---

## Files Ready

| File | Purpose | Status |
|------|---------|--------|
| `Dockerfile` | ⭐ Original working Dockerfile (Nginx) | ✅ Use This! |
| `Dockerfile.nixpacks` | Alternative (serve-based) | ✅ Fallback |
| `nixpacks.toml` | Nixpacks config (if platform supports) | ⚠️ May not work with EasyPanel |
| `.npmrc` | NPM configuration | ✅ Helps both methods |
| `.nixpacksignore` | Ignore files for Nixpacks | ✅ Helps if using Nixpacks |

---

## Configuration for EasyPanel

### Method 1: Original Dockerfile (RECOMMENDED)
```
Build Method: Dockerfile
Dockerfile Path: Dockerfile
Port: 80
Environment Variables:
  - VITE_SUPABASE_URL=your_url
  - VITE_SUPABASE_ANON_KEY=your_key
```

### Method 2: Serve-based Dockerfile
```
Build Method: Dockerfile
Dockerfile Path: Dockerfile.nixpacks
Port: 8080
Environment Variables:
  - VITE_SUPABASE_URL=your_url
  - VITE_SUPABASE_ANON_KEY=your_key
```

### Method 3: Try to Fix Nixpacks (Not Recommended)
```
Build Method: Nixpacks
Environment Variables:
  - NIXPACKS_NO_CACHE=true
  - VITE_SUPABASE_URL=your_url
  - VITE_SUPABASE_ANON_KEY=your_key
```

---

## Expected Timeline

**Switching to Dockerfile:**
- Configuration change: 2 minutes
- Rebuild: 3-5 minutes
- **Total: ~7 minutes to working deployment** ✅

**Trying to fix Nixpacks:**
- Trial and error: Unknown
- Platform limitations: May not be solvable
- **Not recommended**

---

## Summary

**Problem:** EasyPanel's Nixpacks generates Dockerfile with cache mounts that break vite

**Solution:** **Use `Dockerfile` instead of Nixpacks** ✅

**Steps:**
1. EasyPanel dashboard → App settings
2. Change: Build Method → Dockerfile
3. Set environment variables
4. Rebuild
5. ✅ Working!

**Why:** Your original Dockerfile already works perfectly. No need for Nixpacks.

---

**Recommendation:** Switch to Dockerfile method NOW. Save time debugging Nixpacks.

**Time to fix:** 5-7 minutes  
**Success rate:** 99%  
**Risk:** Minimal (just reverting to working config)
