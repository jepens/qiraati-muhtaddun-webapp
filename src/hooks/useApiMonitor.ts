import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { API_BASE_URL } from '@/lib/config';

export interface ApiStatus {
  name: string;
  url: string;
  status: 'online' | 'offline' | 'checking' | 'error';
  responseTime: number | null;
  lastChecked: Date | null;
  errorMessage?: string;
}

export const useApiMonitor = () => {
  const [apiStatuses, setApiStatuses] = useState<ApiStatus[]>([
    {
      name: 'Supabase Database',
      url: 'Supabase Cloud',
      status: 'checking',
      responseTime: null,
      lastChecked: null,
    },
    {
      name: 'Backend API',
      url: API_BASE_URL,
      status: 'checking',
      responseTime: null,
      lastChecked: null,
    },
    {
      name: 'Quran API (Surah List)',
      url: `${API_BASE_URL}/quran/surat`,
      status: 'checking',
      responseTime: null,
      lastChecked: null,
    },
    {
      name: 'Prayer Times API',
      url: 'MyQuran.com API',
      status: 'checking',
      responseTime: null,
      lastChecked: null,
    },
  ]);

  const checkSupabaseStatus = useCallback(async (): Promise<Partial<ApiStatus>> => {
    try {
      const startTime = Date.now();
      const { error } = await supabase
        .from('homepage_content')
        .select('id')
        .limit(1);

      const responseTime = Date.now() - startTime;

      if (error) {
        return {
          status: 'error',
          responseTime,
          lastChecked: new Date(),
          errorMessage: error.message,
        };
      }

      return {
        status: 'online',
        responseTime,
        lastChecked: new Date(),
      };
    } catch (_error) {
      return {
        status: 'offline',
        responseTime: null,
        lastChecked: new Date(),
        errorMessage: _error instanceof Error ? _error.message : 'Unknown error',
      };
    }
  }, []);

  const checkApiEndpoint = useCallback(async (url: string): Promise<Partial<ApiStatus>> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const startTime = Date.now();
      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
      });

      const responseTime = Date.now() - startTime;
      clearTimeout(timeoutId);

      if (response.ok) {
        return {
          status: 'online',
          responseTime,
          lastChecked: new Date(),
        };
      } else {
        return {
          status: 'error',
          responseTime,
          lastChecked: new Date(),
          errorMessage: `HTTP ${response.status}: ${response.statusText}`,
        };
      }
    } catch (error) {
      clearTimeout(timeoutId);
      return {
        status: 'offline',
        responseTime: null,
        lastChecked: new Date(),
        errorMessage: error instanceof Error ? error.message : 'Connection failed',
      };
    }
  }, []);

  const checkBackendApiStatus = useCallback(async (): Promise<Partial<ApiStatus>> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const startTime = Date.now();
      // Try to connect to the backend server, using an endpoint that should exist
      const response = await fetch(`${API_BASE_URL}/quran/surat`, {
        method: 'GET',
        signal: controller.signal,
      });

      const responseTime = Date.now() - startTime;
      clearTimeout(timeoutId);

      if (response.ok) {
        return {
          status: 'online',
          responseTime,
          lastChecked: new Date(),
        };
      } else {
        return {
          status: 'error',
          responseTime,
          lastChecked: new Date(),
          errorMessage: `HTTP ${response.status}: ${response.statusText}`,
        };
      }
    } catch (error) {
      clearTimeout(timeoutId);
      return {
        status: 'offline',
        responseTime: null,
        lastChecked: new Date(),
        errorMessage: error instanceof Error ? error.message : 'Backend server not running',
      };
    }
  }, []);

  const checkPrayerTimesApi = useCallback(async (): Promise<Partial<ApiStatus>> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const startTime = Date.now();
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const date = String(now.getDate()).padStart(2, '0');

      const response = await fetch(
        `${API_BASE_URL}/prayer-times/${year}/${month}/${date}`,
        {
          signal: controller.signal,
        }
      );

      const responseTime = Date.now() - startTime;
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data.status && data.data) {
          return {
            status: 'online',
            responseTime,
            lastChecked: new Date(),
          };
        } else {
          return {
            status: 'error',
            responseTime,
            lastChecked: new Date(),
            errorMessage: 'Invalid response format',
          };
        }
      } else {
        return {
          status: 'error',
          responseTime,
          lastChecked: new Date(),
          errorMessage: `HTTP ${response.status}: ${response.statusText}`,
        };
      }
    } catch (_error) {
      clearTimeout(timeoutId);
      return {
        status: 'offline',
        responseTime: null,
        lastChecked: new Date(),
        errorMessage: _error instanceof Error ? _error.message : 'Connection failed',
      };
    }
  }, []);

  const checkAllApis = useCallback(async () => {
    const checks = [
      { index: 0, checker: checkSupabaseStatus },
      { index: 1, checker: checkBackendApiStatus },
      { index: 2, checker: () => checkApiEndpoint(`${API_BASE_URL}/quran/surat`) },
      { index: 3, checker: checkPrayerTimesApi },
    ];

    // Run all checks in parallel
    const results = await Promise.allSettled(
      checks.map(({ checker }) => checker())
    );

    setApiStatuses(prev =>
      prev.map((api, index) => {
        const result = results[index];
        if (result.status === 'fulfilled') {
          return { ...api, ...result.value };
        } else {
          return {
            ...api,
            status: 'error' as const,
            responseTime: null,
            lastChecked: new Date(),
            errorMessage: result.reason?.message || 'Check failed',
          };
        }
      })
    );
  }, [checkSupabaseStatus, checkBackendApiStatus, checkApiEndpoint, checkPrayerTimesApi]);

  useEffect(() => {
    // Initial check
    checkAllApis();

    // Check every 5 minutes
    const interval = setInterval(checkAllApis, 300000);

    return () => clearInterval(interval);
  }, [checkAllApis]);

  const getOverallStatus = () => {
    const onlineCount = apiStatuses.filter(api => api.status === 'online').length;
    const totalCount = apiStatuses.length;

    if (onlineCount === totalCount) return 'healthy';
    if (onlineCount === 0) return 'critical';
    return 'warning';
  };

  const getAverageResponseTime = () => {
    const responseTimes = apiStatuses
      .filter(api => api.responseTime !== null)
      .map(api => api.responseTime!);

    if (responseTimes.length === 0) return null;

    return Math.round(responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length);
  };

  return {
    apiStatuses,
    checkAllApis,
    overallStatus: getOverallStatus(),
    averageResponseTime: getAverageResponseTime(),
    lastUpdated: new Date(),
  };
}; 