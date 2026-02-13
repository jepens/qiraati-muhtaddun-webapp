import { EQuran, EQuranApiError } from 'equran';

// Route through proxy to avoid CORS (SDK sends X-SDK-* headers that trigger preflight)
// - Development: Vite dev proxy (/equran-api → equran.id/api/v2)
// - Production:  Nginx proxy    (/equran-api → equran.id/api/v2)
const baseUrl = '/equran-api';

// Singleton EQuran instance with caching enabled
export const quran = new EQuran({
    baseUrl,
    cache: {
        enabled: true,
        ttl: 60 * 60 * 1000, // 1 hour
        maxSize: 200,
    },
});

export { EQuranApiError };
