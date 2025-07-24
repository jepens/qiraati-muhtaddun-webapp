// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Quran API endpoints
export const QURAN_API = {
  SURAH_LIST: `${API_BASE_URL}/api/quran/surat`,
  SURAH_DETAIL: (id: string | number) => `${API_BASE_URL}/api/quran/surat/${id}`,
  PRAYER_TIMES: (year: number, month: string, date: string) => 
    `${API_BASE_URL}/api/prayer-times/${year}/${month}/${date}`,
};

// Cache configuration
export const CACHE_CONFIG = {
  SURAH_LIST: 24 * 60 * 60 * 1000, // 24 hours
  SURAH_DETAIL: 24 * 60 * 60 * 1000, // 24 hours
  PRAYER_TIMES: 5 * 60 * 1000, // 5 minutes
}; 