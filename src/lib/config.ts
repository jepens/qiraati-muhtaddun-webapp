// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Prayer Times API endpoint (uses backend proxy)
export const PRAYER_API = {
  PRAYER_TIMES: (year: number, month: string, date: string) =>
    `${API_BASE_URL}/prayer-times/${year}/${month}/${date}`,
};

// Cache configuration
export const CACHE_CONFIG = {
  PRAYER_TIMES: 5 * 60 * 1000, // 5 minutes
};
