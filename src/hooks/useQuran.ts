import { useState, useEffect, useCallback, useMemo } from 'react';
import { quran, EQuranApiError } from '@/services/quranService';
import { useToast } from '@/hooks/use-toast';
import type {
  Surat,
  SuratDetail,
  TafsirDetail,
  TafsirAyat,
  RandomAyat,
} from '@/types/quran';

type SuratNav = SuratDetail | null;

// ─── Core: Get All Surat ───
export function useSurahList() {
  const [surahs, setSurahs] = useState<Surat[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    let cancelled = false;
    const fetchSurahs = async () => {
      try {
        setLoading(true);
        const data = await quran.getAllSurat();
        if (!cancelled) setSurahs(data);
      } catch (error) {
        console.error('Error fetching surahs:', error);
        if (error instanceof EQuranApiError) {
          toast({
            title: 'Error',
            description: `Gagal memuat daftar surat (${error.statusCode}).`,
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Error',
            description: 'Gagal memuat daftar surat. Silakan coba lagi nanti.',
            variant: 'destructive',
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchSurahs();
    return () => { cancelled = true; };
  }, [toast]);

  return { surahs, loading };
}

// ─── Core: Get Surat Detail ───
export function useSurahDetail(id: string | undefined) {
  const [surah, setSurah] = useState<SuratDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    let cancelled = false;
    const fetchDetail = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const data = await quran.getSurat(parseInt(id));
        if (!cancelled) setSurah(data);
      } catch (error) {
        console.error('Error fetching surah detail:', error);
        if (error instanceof EQuranApiError) {
          toast({
            title: 'Error',
            description: `Gagal memuat surat (${error.statusCode}).`,
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Error',
            description: 'Gagal memuat detail surat. Silakan coba lagi nanti.',
            variant: 'destructive',
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchDetail();
    return () => { cancelled = true; };
  }, [id, toast]);

  return { surah, loading };
}

// ─── Core: Get Tafsir ───
export function useTafsir(nomor: number | undefined) {
  const [tafsir, setTafsir] = useState<TafsirDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const fetchTafsir = async () => {
      if (!nomor) return;
      try {
        setLoading(true);
        const data = await quran.getTafsir(nomor);
        if (!cancelled) setTafsir(data);
      } catch (error) {
        console.error('Error fetching tafsir:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchTafsir();
    return () => { cancelled = true; };
  }, [nomor]);

  return { tafsir, loading };
}

// ─── Utility: Get Tafsir for Specific Ayat (on-demand) ───
export function useTafsirAyat() {
  const [tafsirAyat, setTafsirAyat] = useState<TafsirAyat | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchTafsirAyat = useCallback(async (suratNomor: number, ayatNomor: number) => {
    try {
      setLoading(true);
      const data = await quran.getTafsirAyat(suratNomor, ayatNomor);
      setTafsirAyat(data);
      return data;
    } catch (error) {
      console.error('Error fetching tafsir ayat:', error);
      setTafsirAyat(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setTafsirAyat(null);
  }, []);

  return { tafsirAyat, loading, fetchTafsirAyat, reset };
}

// ─── Utility: Random Ayat ───
export function useRandomAyat() {
  const [randomAyat, setRandomAyat] = useState<RandomAyat | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const data = await quran.getRandomAyat();
      setRandomAyat(data);
    } catch (error) {
      console.error('Error fetching random ayat:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { randomAyat, loading, refresh };
}

// ─── Audio: Qari List (synchronous) ───
export function useQariList() {
  // getQariList() is synchronous in equran SDK
  const qariList = useMemo(() => {
    try {
      return quran.getQariList();
    } catch {
      return [];
    }
  }, []);

  return { qariList, loading: false };
}

// ─── Helper: Surah Navigation ───
export function useSurahNavigation(currentNomor: number | undefined) {
  const [nextSurat, setNextSurat] = useState<SuratNav>(null);
  const [prevSurat, setPrevSurat] = useState<SuratNav>(null);

  useEffect(() => {
    let cancelled = false;
    const fetchNav = async () => {
      if (!currentNomor) return;

      try {
        const [next, prev] = await Promise.allSettled([
          quran.getNextSurat(currentNomor),
          quran.getPrevSurat(currentNomor),
        ]);

        if (!cancelled) {
          setNextSurat(next.status === 'fulfilled' ? next.value : null);
          setPrevSurat(prev.status === 'fulfilled' ? prev.value : null);
        }
      } catch (error) {
        console.error('Error fetching surah navigation:', error);
      }
    };

    fetchNav();
    return () => { cancelled = true; };
  }, [currentNomor]);

  return { nextSurat, prevSurat };
}

// ─── Helper: Makkiyah & Madaniyah Surat ───
export function useSurahFilter() {
  const [makkiyah, setMakkiyah] = useState<Surat[]>([]);
  const [madaniyah, setMadaniyah] = useState<Surat[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchFiltered = useCallback(async (filter: 'makkiyah' | 'madaniyah') => {
    try {
      setLoading(true);
      if (filter === 'makkiyah') {
        const data = await quran.getMakkiyahSurat();
        setMakkiyah(data);
        return data;
      } else {
        const data = await quran.getMadaniyahSurat();
        setMadaniyah(data);
        return data;
      }
    } catch (error) {
      console.error(`Error fetching ${filter} surat:`, error);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return { makkiyah, madaniyah, loading, fetchFiltered };
}

// ─── Audio: Get Audio URLs ───
export function useAudioUrls() {
  const getAudioFull = useCallback(async (suratNomor: number, qariId?: string) => {
    try {
      return await quran.getAudioFull(suratNomor, qariId);
    } catch (error) {
      console.error('Error fetching audio full:', error);
      return null;
    }
  }, []);

  const getAudioAyat = useCallback(async (suratNomor: number, ayatNomor: number, qariId?: string) => {
    try {
      return await quran.getAudioAyat(suratNomor, ayatNomor, qariId);
    } catch (error) {
      console.error('Error fetching audio ayat:', error);
      return null;
    }
  }, []);

  return { getAudioFull, getAudioAyat };
}