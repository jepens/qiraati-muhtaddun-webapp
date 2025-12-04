# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/677bbaab-d5b7-42e9-924e-78394e93df17

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/677bbaab-d5b7-42e9-924e-78394e93df17) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## ⚡ Performance Optimizations

This project includes comprehensive build optimizations:

- **Lazy Loading** - Routes load on-demand for faster initial load
- **Code Splitting** - Vendor libraries separated for better caching
- **Minification** - Terser compression with console removal in production
- **Asset Organization** - Optimized file structure for CDN caching

**Results:**
- 34% smaller initial bundle
- 90% better caching on updates
- 0 build warnings

📖 See [OPTIMIZATION_SUMMARY.md](./OPTIMIZATION_SUMMARY.md) for details.

## How can I deploy this project?

### Option 1: Lovable (Easiest)
Simply open [Lovable](https://lovable.dev/projects/677bbaab-d5b7-42e9-924e-78394e93df17) and click on Share -> Publish.

### Option 2: Nixpacks (Railway, Render, etc)
This project includes `nixpacks.toml` configuration for seamless deployment to Nixpacks-compatible platforms.

**Quick Deploy:**
```bash
# 1. Set environment variables on your platform:
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# 2. Push code (auto-deploy)
git push origin main
```

**Platforms supported:**
- Railway
- Render
- Heroku (with Nixpacks buildpack)

**Documentation:**
- 📋 [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) - Complete deployment guide
- 🚀 [NIXPACKS_QUICK_DEPLOY.md](./NIXPACKS_QUICK_DEPLOY.md) - Quick reference
- 🔧 [NIXPACKS_DEPLOYMENT_FIX.md](./NIXPACKS_DEPLOYMENT_FIX.md) - Detailed explanation

### Option 3: Docker (VPS, Cloud)
For VPS or cloud deployment with full control:

**Production:**
```bash
docker-compose -f docker-compose.prod.yml up -d
```

**Development:**
```bash
docker-compose -f docker-compose.dev.yml up
```

**Documentation:**
- 📖 [DOCKER_ENVIRONMENTS.md](./DOCKER_ENVIRONMENTS.md) - Docker configuration guide
- 📦 [DEPLOYMENT.md](./DEPLOYMENT.md) - VPS deployment guide

### Option 4: Vercel/Netlify (Static)
Vite apps can be deployed to static hosting:

**Vercel:**
```bash
npm i -g vercel
vercel
```

**Netlify:**
```bash
npm run build
# Upload dist/ folder to Netlify
```

## Troubleshooting Deployment

### MIME Type Error
If you see: `Failed to load module script: Expected a JavaScript-or-Wasm module script but the server responded with a MIME type of ""`

**Solution:** Check [NIXPACKS_FIX_SUMMARY.md](./NIXPACKS_FIX_SUMMARY.md)

### Build Fails
1. Verify environment variables are set
2. Check build logs for errors
3. Test locally: `npm run build`

### Runtime Errors
1. Check browser console (F12)
2. Verify Supabase connection
3. Check API endpoints

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

## 📚 Additional Documentation

- [GAME_HAFALAN_IMPLEMENTATION.md](./GAME_HAFALAN_IMPLEMENTATION.md) - Game features
- [GOOGLE_MAPS_SETUP.md](./GOOGLE_MAPS_SETUP.md) - Maps configuration
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Common issues
