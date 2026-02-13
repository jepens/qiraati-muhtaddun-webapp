import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';

export interface LastRead {
    id: string;
    user_id: string;
    surat_nomor: number;
    surat_nama: string;
    ayat_nomor: number;
    updated_at: string;
}

export function useLastRead() {
    const { user } = useAuth();
    const [lastRead, setLastRead] = useState<LastRead | null>(null);
    const [loading, setLoading] = useState(false);

    const fetchLastRead = useCallback(async () => {
        if (!user) {
            setLastRead(null);
            return;
        }

        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('last_read')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
            setLastRead(data || null);
        } catch (error) {
            console.error('Error fetching last read:', error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchLastRead();
    }, [fetchLastRead]);

    const updateLastRead = useCallback(
        async (suratNomor: number, suratNama: string, ayatNomor: number) => {
            if (!user) return;

            try {
                const { error } = await supabase.from('last_read').upsert(
                    {
                        user_id: user.id,
                        surat_nomor: suratNomor,
                        surat_nama: suratNama,
                        ayat_nomor: ayatNomor,
                        updated_at: new Date().toISOString(),
                    },
                    { onConflict: 'user_id' }
                );

                if (error) throw error;

                // Optimistic update
                setLastRead((prev) => ({
                    id: prev?.id || '',
                    user_id: user.id,
                    surat_nomor: suratNomor,
                    surat_nama: suratNama,
                    ayat_nomor: ayatNomor,
                    updated_at: new Date().toISOString(),
                }));
            } catch (error) {
                console.error('Error updating last read:', error);
            }
        },
        [user]
    );

    return {
        lastRead,
        loading,
        updateLastRead,
        refetch: fetchLastRead,
    };
}
