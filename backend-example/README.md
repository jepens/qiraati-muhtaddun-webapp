# Masjid Al-Muhtaddun API Server

Backend proxy server for the Masjid Al-Muhtaddun website and Qiraati Quran reading application.

## Features

- **Quran API Proxy**: Proxies requests to EQuran.id API for surah data and audio
- **Prayer Times API**: Proxies requests to MyQuran.com API for Jakarta prayer schedules
- **CORS Support**: Configured to allow requests from your React frontend
- **Error Handling**: Proper error responses for failed API calls

## API Endpoints

### Quran Endpoints (EQuran.id Proxy)

- `GET /api/quran/surat` - Get list of all surahs
- `GET /api/quran/surat/:id` - Get detailed surah data with ayats and audio

### Prayer Times Endpoints (MyQuran.com Proxy)

- `GET /api/prayer-times/:year/:month/:date` - Get prayer schedule for Jakarta on specific date
- Example: `/api/prayer-times/2024/03/15`

### Health Check

- `GET /health` - Server health status

## Installation & Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run in development mode:**
   ```bash
   npm run dev
   ```

3. **Run in production:**
   ```bash
   npm start
   ```

The server will start on port 3001 (or the port specified in the PORT environment variable).

## Deployment

### VPS Deployment

1. **Upload files to your VPS:**
   ```bash
   scp -r backend-example/ user@your-vps-ip:/path/to/your/app/
   ```

2. **Install dependencies on VPS:**
   ```bash
   ssh user@your-vps-ip
   cd /path/to/your/app/backend-example
   npm install --production
   ```

3. **Run with PM2 (recommended):**
   ```bash
   npm install -g pm2
   pm2 start server.js --name "masjid-api"
   pm2 startup
   pm2 save
   ```

4. **Configure reverse proxy (Nginx example):**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location /api/ {
           proxy_pass http://localhost:3001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

## Environment Variables

Create a `.env` file for configuration:

```env
PORT=3001
NODE_ENV=production
```

## Frontend Integration

Update your React app to use this backend:

```javascript
// In your React components
const API_BASE_URL = 'http://your-domain.com/api'; // or 'http://localhost:3001/api' for development

// Fetch surahs
const response = await fetch(`${API_BASE_URL}/quran/surat`);
const surahs = await response.json();

// Fetch prayer times
const today = new Date();
const year = today.getFullYear();
const month = String(today.getMonth() + 1).padStart(2, '0');
const date = String(today.getDate()).padStart(2, '0');

const response = await fetch(`${API_BASE_URL}/prayer-times/${year}/${month}/${date}`);
const prayerTimes = await response.json();
```

## Security Notes

- The APIs being proxied (EQuran.id and MyQuran.com) don't require API keys
- Consider implementing rate limiting for production use
- Use HTTPS in production
- Consider implementing request logging for monitoring

## Support

For issues or questions, contact the Masjid Al-Muhtaddun technical team.