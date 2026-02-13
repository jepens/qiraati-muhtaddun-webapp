import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

export interface AyatBookmark {
    id: string;
    user_id: string;
    surat_nomor: number;
    surat_nama: string;
    ayat_nomor: number;
    teks_arab: string | null;
    created_at: string;
}

export function useBookmarks() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [bookmarks, setBookmarks] = useState<AyatBookmark[]>([]);
    const [loading, setLoading] = useState(false);

    // Fetch all bookmarks for the current user
    const fetchBookmarks = useCallback(async () => {
        if (!user) {
            setBookmarks([]);
            return;
        }

        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('ayat_bookmarks')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setBookmarks(data || []);
        } catch (error) {
            console.error('Error fetching bookmarks:', error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchBookmarks();
    }, [fetchBookmarks]);

    // Check if a specific ayat is bookmarked
    const isBookmarked = useCallback(
        (suratNomor: number, ayatNomor: number): boolean => {
            return bookmarks.some(
                (b) => b.surat_nomor === suratNomor && b.ayat_nomor === ayatNomor
            );
        },
        [bookmarks]
    );

    // Add a bookmark
    const addBookmark = useCallback(
        async (suratNomor: number, suratNama: string, ayatNomor: number, teksArab?: string) => {
            if (!user) {
                toast({
                    variant: 'destructive',
                    title: 'Login Diperlukan',
                    description: 'Silakan login untuk menyimpan bookmark.',
                });
                return false;
            }

            try {
                const { error } = await supabase.from('ayat_bookmarks').insert({
                    user_id: user.id,
                    surat_nomor: suratNomor,
                    surat_nama: suratNama,
                    ayat_nomor: ayatNomor,
                    teks_arab: teksArab || null,
                });

                if (error) {
                    if (error.code === '23505') {
                        // Already bookmarked (unique constraint)
                        toast({ title: 'Sudah Ada', description: 'Ayat ini sudah di-bookmark.' });
                        return false;
                    }
                    throw error;
                }

                toast({
                    title: 'Bookmark Disimpan',
                    description: `${suratNama} Ayat ${ayatNomor} berhasil di-bookmark.`,
                });

                await fetchBookmarks();
                return true;
            } catch (error) {
                console.error('Error adding bookmark:', error);
                toast({
                    variant: 'destructive',
                    title: 'Gagal',
                    description: 'Gagal menyimpan bookmark.',
                });
                return false;
            }
        },
        [user, toast, fetchBookmarks]
    );

    // Remove a bookmark
    const removeBookmark = useCallback(
        async (suratNomor: number, ayatNomor: number) => {
            if (!user) return false;

            try {
                const { error } = await supabase
                    .from('ayat_bookmarks')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('surat_nomor', suratNomor)
                    .eq('ayat_nomor', ayatNomor);

                if (error) throw error;

                toast({
                    title: 'Bookmark Dihapus',
                    description: 'Bookmark berhasil dihapus.',
                });

                await fetchBookmarks();
                return true;
            } catch (error) {
                console.error('Error removing bookmark:', error);
                toast({
                    variant: 'destructive',
                    title: 'Gagal',
                    description: 'Gagal menghapus bookmark.',
                });
                return false;
            }
        },
        [user, toast, fetchBookmarks]
    );

    // Toggle bookmark
    const toggleBookmark = useCallback(
        async (suratNomor: number, suratNama: string, ayatNomor: number, teksArab?: string) => {
            if (isBookmarked(suratNomor, ayatNomor)) {
                return removeBookmark(suratNomor, ayatNomor);
            } else {
                return addBookmark(suratNomor, suratNama, ayatNomor, teksArab);
            }
        },
        [isBookmarked, addBookmark, removeBookmark]
    );

    return {
        bookmarks,
        loading,
        isBookmarked,
        addBookmark,
        removeBookmark,
        toggleBookmark,
        refetch: fetchBookmarks,
    };
}
