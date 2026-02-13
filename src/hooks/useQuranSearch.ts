import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Fuse from 'fuse.js';
import { quran } from '@/services/quranService';

// ─── Types ───

export interface AyatSearchResult {
    surahNomor: number;
    surahNama: string;
    surahNamaLatin: string;
    ayatNomor: number;
    teksArab: string;
    teksLatin: string;
    teksIndonesia: string;
}

interface FuseAyatItem extends AyatSearchResult { }

interface UseQuranSearchReturn {
    /** Search by query string — returns top results */
    search: (query: string) => AyatSearchResult[];
    /** Whether the index is currently being built */
    isIndexing: boolean;
    /** Progress 0–100 */
    indexProgress: number;
    /** Total ayat indexed */
    totalIndexed: number;
    /** Whether the index is ready for searching */
    isReady: boolean;
    /** Manually trigger indexing */
    startIndexing: () => void;
}

// ─── Constants ───

const BATCH_SIZE = 10; // Surah per batch
const TOTAL_SURAH = 114;

// ─── Fuse.js Config (Context7 — weighted keys, threshold) ───

const FUSE_OPTIONS = {
    keys: [
        { name: 'teksIndonesia', weight: 1.0 },
        { name: 'teksLatin', weight: 0.6 },
        { name: 'surahNamaLatin', weight: 0.4 },
    ],
    threshold: 0.35,
    includeScore: true,
    shouldSort: true,
    minMatchCharLength: 3,
    ignoreLocation: true, // Search entire string, not just near start
};

// ─── Singleton Index Cache ───
// Prevents re-fetching across component remounts

let cachedData: FuseAyatItem[] | null = null;
let cachedFuse: Fuse<FuseAyatItem> | null = null;
let indexingPromise: Promise<void> | null = null;

// ─── Hook ───

export const useQuranSearch = (): UseQuranSearchReturn => {
    const [isIndexing, setIsIndexing] = useState(false);
    const [indexProgress, setIndexProgress] = useState(cachedData ? 100 : 0);
    const [totalIndexed, setTotalIndexed] = useState(cachedData?.length ?? 0);
    const [isReady, setIsReady] = useState(!!cachedFuse);
    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false; };
    }, []);

    // ─── Progressive Fetch + Index ───
    const buildIndex = useCallback(async () => {
        // Already cached
        if (cachedFuse) {
            setIsReady(true);
            setIndexProgress(100);
            setTotalIndexed(cachedData?.length ?? 0);
            return;
        }

        // Another component already started indexing
        if (indexingPromise) {
            await indexingPromise;
            if (isMounted.current && cachedFuse) {
                setIsReady(true);
                setIndexProgress(100);
                setTotalIndexed(cachedData?.length ?? 0);
            }
            return;
        }

        setIsIndexing(true);
        const allItems: FuseAyatItem[] = [];

        indexingPromise = (async () => {
            try {
                for (let batch = 0; batch < Math.ceil(TOTAL_SURAH / BATCH_SIZE); batch++) {
                    const start = batch * BATCH_SIZE + 1;
                    const end = Math.min(start + BATCH_SIZE - 1, TOTAL_SURAH);
                    const nomorList = Array.from({ length: end - start + 1 }, (_, i) => start + i);

                    // Use bulkGetSurat for efficient batching
                    const surahs = await quran.bulkGetSurat(nomorList);

                    for (const surah of surahs) {
                        for (const ayat of surah.ayat) {
                            allItems.push({
                                surahNomor: surah.nomor,
                                surahNama: surah.nama,
                                surahNamaLatin: surah.namaLatin,
                                ayatNomor: ayat.nomorAyat,
                                teksArab: ayat.teksArab,
                                teksLatin: ayat.teksLatin,
                                teksIndonesia: ayat.teksIndonesia,
                            });
                        }
                    }

                    if (isMounted.current) {
                        const progress = Math.round(((batch + 1) * BATCH_SIZE / TOTAL_SURAH) * 100);
                        setIndexProgress(Math.min(progress, 100));
                        setTotalIndexed(allItems.length);
                    }

                    // Yield to main thread between batches
                    await new Promise(resolve => setTimeout(resolve, 50));
                }

                // Build Fuse.js index
                cachedData = allItems;
                cachedFuse = new Fuse(allItems, FUSE_OPTIONS);

                if (isMounted.current) {
                    setIsReady(true);
                    setIsIndexing(false);
                    setIndexProgress(100);
                    setTotalIndexed(allItems.length);
                }
            } catch (err) {
                console.error('Error building Quran search index:', err);
                if (isMounted.current) setIsIndexing(false);
            } finally {
                indexingPromise = null;
            }
        })();

        await indexingPromise;
    }, []);

    // ─── Search ───
    const search = useCallback((query: string): AyatSearchResult[] => {
        if (!cachedFuse || !query.trim()) return [];
        const results = cachedFuse.search(query, { limit: 20 });
        return results.map(r => r.item);
    }, []);

    // Stable reference
    const startIndexing = useMemo(() => buildIndex, [buildIndex]);

    return {
        search,
        isIndexing,
        indexProgress,
        totalIndexed,
        isReady,
        startIndexing,
    };
};
