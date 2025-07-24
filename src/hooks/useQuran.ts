import { useState, useEffect } from 'react';
import { QURAN_API, CACHE_CONFIG } from '@/lib/config';
import { cache } from '@/lib/cache';
import { useToast } from '@/hooks/use-toast';

interface Surah {
  nomor: number;
  nama: string;
  namaLatin: string;
  arti: string;
  jumlahAyat: number;
}

interface SurahDetail extends Surah {
  tempatTurun: string;
  audioFull: Record<string, string>;
  ayat: {
    nomorAyat: number;
    teksArab: string;
    teksLatin: string;
    terjemahan: string;
    audio: Record<string, string>;
  }[];
}

export function useSurahList() {
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchSurahs = async () => {
      try {
        // Check cache first
        const cachedData = cache.get<Surah[]>('surah-list');
        if (cachedData) {
          setSurahs(cachedData);
          setLoading(false);
          return;
        }

        setLoading(true);
        const response = await fetch(QURAN_API.SURAH_LIST);
        
        if (!response.ok) {
          throw new Error('Failed to fetch surahs');
        }
        
        const result = await response.json();
        
        if (result.code === 200 && result.data) {
          setSurahs(result.data);
          // Cache the data
          cache.set('surah-list', result.data, CACHE_CONFIG.SURAH_LIST);
        } else {
          throw new Error('Invalid response format');
        }
      } catch (error) {
        console.error('Error fetching surahs:', error);
        toast({
          title: "Error",
          description: "Gagal memuat daftar surat. Silakan coba lagi nanti.",
          variant: "destructive",
        });
        
        // Fallback to basic surahs if API fails
        const fallbackSurahs: Surah[] = [
          { nomor: 1, nama: 'الفاتحة', namaLatin: 'Al-Fatihah', arti: 'Pembukaan', jumlahAyat: 7 },
          { nomor: 2, nama: 'البقرة', namaLatin: 'Al-Baqarah', arti: 'Sapi Betina', jumlahAyat: 286 },
          { nomor: 18, nama: 'الكهف', namaLatin: 'Al-Kahf', arti: 'Gua', jumlahAyat: 110 },
          { nomor: 36, nama: 'يس', namaLatin: 'Yasin', arti: 'Yasin', jumlahAyat: 83 },
          { nomor: 55, nama: 'الرحمن', namaLatin: 'Ar-Rahman', arti: 'Yang Maha Pengasih', jumlahAyat: 78 },
          { nomor: 67, nama: 'الملك', namaLatin: 'Al-Mulk', arti: 'Kerajaan', jumlahAyat: 30 },
          { nomor: 112, nama: 'الإخلاص', namaLatin: 'Al-Ikhlas', arti: 'Keikhlasan', jumlahAyat: 4 },
        ];
        setSurahs(fallbackSurahs);
      } finally {
        setLoading(false);
      }
    };

    fetchSurahs();
  }, [toast]);

  return { surahs, loading };
}

export function useSurahDetail(id: string | undefined) {
  const [surah, setSurah] = useState<SurahDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchSurahDetail = async () => {
      if (!id) return;

      try {
        // Check cache first
        const cacheKey = `surah-detail-${id}`;
        const cachedData = cache.get<SurahDetail>(cacheKey);
        if (cachedData) {
          setSurah(cachedData);
          setLoading(false);
          return;
        }

        setLoading(true);
        const response = await fetch(QURAN_API.SURAH_DETAIL(id));
        
        if (!response.ok) {
          throw new Error('Failed to fetch surah details');
        }
        
        const result = await response.json();
        
        if (result.code === 200 && result.data) {
          setSurah(result.data);
          // Cache the data
          cache.set(cacheKey, result.data, CACHE_CONFIG.SURAH_DETAIL);
        } else {
          throw new Error('Invalid response format');
        }
      } catch (error) {
        console.error('Error fetching surah details:', error);
        toast({
          title: "Error",
          description: "Gagal memuat detail surat. Silakan coba lagi nanti.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSurahDetail();
  }, [id, toast]);

  return { surah, loading };
} 