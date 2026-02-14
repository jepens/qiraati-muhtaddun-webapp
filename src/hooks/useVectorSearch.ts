import { useState, useCallback, useRef, useEffect } from 'react';

// ─── API Types (equran.id Vector Search) ───

export interface VectorResultData {
    id_surat?: number;
    nama_surat?: string;
    nama_surat_arab?: string;
    nomor_ayat?: number;
    teks_arab?: string;
    teks_latin?: string;
    terjemahan_id?: string;
    // Tafsir
    isi?: string;
    // Doa
    judul?: string;
    arab?: string;
    latin?: string;
    arti?: string;
    sumber?: string;
    // Surat
    arti_surat?: string;
    tempat_turun?: string;
    jumlah_ayat?: number;
    deskripsi?: string;
}

export interface VectorSearchResult {
    tipe: 'surat' | 'ayat' | 'tafsir' | 'doa';
    skor: number;
    relevansi: 'tinggi' | 'sedang' | 'rendah';
    data: VectorResultData;
}

interface VectorSearchResponse {
    status: string;
    cari: string;
    jumlah: number;
    hasil: VectorSearchResult[];
}

export interface VectorSearchOptions {
    batas?: number;      // max results (default 5, max 10)
    tipe?: ('surat' | 'ayat' | 'tafsir' | 'doa')[];
    skorMin?: number;    // minimum similarity score 0-1
}

interface UseVectorSearchReturn {
    search: (query: string, options?: VectorSearchOptions) => Promise<VectorSearchResult[]>;
    results: VectorSearchResult[];
    isLoading: boolean;
    error: string | null;
    clearResults: () => void;
}

// ─── In-memory cache (5 min TTL, matching API cache) ───

interface CacheEntry {
    data: VectorSearchResult[];
    timestamp: number;
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const cache = new Map<string, CacheEntry>();

function getCacheKey(query: string, options?: VectorSearchOptions): string {
    return JSON.stringify({ q: query.toLowerCase().trim(), ...options });
}

function getCached(key: string): VectorSearchResult[] | null {
    const entry = cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > CACHE_TTL) {
        cache.delete(key);
        return null;
    }
    return entry.data;
}

// ─── Hook ───

export const useVectorSearch = (): UseVectorSearchReturn => {
    const [results, setResults] = useState<VectorSearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const abortRef = useRef<AbortController | null>(null);
    const isMounted = useRef(true);

    // Cleanup on unmount
    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
            abortRef.current?.abort();
        };
    }, []);

    const search = useCallback(async (
        query: string,
        options?: VectorSearchOptions
    ): Promise<VectorSearchResult[]> => {
        const trimmed = query.trim();
        if (!trimmed) {
            setResults([]);
            return [];
        }

        // Check cache first
        const cacheKey = getCacheKey(trimmed, options);
        const cached = getCached(cacheKey);
        if (cached) {
            setResults(cached);
            setError(null);
            return cached;
        }

        // Abort previous request (race condition prevention — Context7 pattern)
        if (abortRef.current) {
            abortRef.current.abort();
        }
        const controller = new AbortController();
        abortRef.current = controller;

        setIsLoading(true);
        setError(null);

        try {
            const body: Record<string, unknown> = { cari: trimmed };
            if (options?.batas) body.batas = options.batas;
            if (options?.tipe) body.tipe = options.tipe;
            if (options?.skorMin !== undefined) body.skorMin = options.skorMin;

            const response = await fetch('https://equran.id/api/vector', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
                signal: controller.signal,
            });

            if (!response.ok) {
                const remaining = response.headers.get('X-RateLimit-Remaining');
                if (response.status === 429 || remaining === '0') {
                    throw new Error('Batas pencarian tercapai. Coba lagi dalam 1 menit.');
                }
                throw new Error(`Server error: ${response.status}`);
            }

            const data: VectorSearchResponse = await response.json();

            if (controller.signal.aborted) return [];

            const items = data.hasil ?? [];

            // Cache the result
            cache.set(cacheKey, { data: items, timestamp: Date.now() });

            if (isMounted.current) {
                setResults(items);
                setIsLoading(false);
            }
            return items;
        } catch (err: unknown) {
            if (err instanceof DOMException && err.name === 'AbortError') {
                return []; // Silently ignore aborted requests
            }
            const message = err instanceof Error ? err.message : 'Gagal mencari. Periksa koneksi internet.';
            if (isMounted.current) {
                setError(message);
                setIsLoading(false);
                setResults([]);
            }
            return [];
        }
    }, []);

    const clearResults = useCallback(() => {
        setResults([]);
        setError(null);
    }, []);

    return { search, results, isLoading, error, clearResults };
};
