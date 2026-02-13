import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface AdminStats {
    totalUsers: number;
    totalActivities: number;
    activeActivities: number;
    totalAlbums: number;
    totalPhotos: number;
    totalFacilities: number;
    isLoading: boolean;
}

export function useAdminStats() {
    const [stats, setStats] = useState<AdminStats>({
        totalUsers: 0,
        totalActivities: 0,
        activeActivities: 0,
        totalAlbums: 0,
        totalPhotos: 0,
        totalFacilities: 0,
        isLoading: true,
    });

    const fetchStats = useCallback(async () => {
        setStats(prev => ({ ...prev, isLoading: true }));

        try {
            const [
                activitiesRes,
                activeActivitiesRes,
                albumsRes,
                photosRes,
                facilitiesRes,
            ] = await Promise.all([
                supabase.from('activities').select('*', { count: 'exact', head: true }),
                supabase.from('activities').select('*', { count: 'exact', head: true }).eq('is_active', true),
                supabase.from('albums').select('*', { count: 'exact', head: true }),
                supabase.from('photos').select('*', { count: 'exact', head: true }),
                supabase.from('facilities').select('*', { count: 'exact', head: true }),
            ]);

            setStats({
                totalUsers: 0, // Will be updated when user management is added
                totalActivities: activitiesRes.count ?? 0,
                activeActivities: activeActivitiesRes.count ?? 0,
                totalAlbums: albumsRes.count ?? 0,
                totalPhotos: photosRes.count ?? 0,
                totalFacilities: facilitiesRes.count ?? 0,
                isLoading: false,
            });
        } catch (error) {
            console.error('Error fetching admin stats:', error);
            setStats(prev => ({ ...prev, isLoading: false }));
        }
    }, []);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    return { ...stats, refresh: fetchStats };
}
