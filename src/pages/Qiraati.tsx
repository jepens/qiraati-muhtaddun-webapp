
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Search, Mic, X, Check, RefreshCw, MapPin, BookMarked, Loader2 } from "lucide-react";
import { useSurahList, useRandomAyat } from '@/hooks/useQuran';
import { useToast } from "@/hooks/use-toast";
import { useVoice } from '@/hooks/useVoice';
import { useVectorSearch, VectorSearchResult } from '@/hooks/useVectorSearch';
import { useFuseSearch } from '@/hooks/useFuseSearch';
import type { Surat } from '@/types/quran';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const PREFIX_REGEX = /^(surat|surah|baca|buka|cari)(\s+|$)/i;

function removePrefixes(str: string): string {
  return str.toLowerCase()
    .replace(PREFIX_REGEX, '')
    .trim();
}

type FilterType = 'semua' | 'makkiyah' | 'madaniyah';

const Qiraati: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredSurahs, setFilteredSurahs] = useState<Surat[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterType>('semua');
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isDataReady, setIsDataReady] = useState(false);
  const [ayatResults, setAyatResults] = useState<VectorSearchResult[]>([]);
  const [isVectorLoading, setIsVectorLoading] = useState(false);
  const [voiceSearchMode, setVoiceSearchMode] = useState<'surah' | 'ayat'>('surah');
  const autoSearchRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { surahs: allSurahs, loading: surahLoading } = useSurahList();
  const { randomAyat, loading: randomLoading, refresh: refreshRandom } = useRandomAyat();

  // Fuse Search Integration
  const { search: fuseSearch } = useFuseSearch(allSurahs, {
    keys: [
      { name: 'nomor', weight: 1 },
      { name: 'namaLatin', weight: 0.7 },
      { name: 'nama', weight: 0.5 },
      { name: 'arti', weight: 0.4 }
    ],
    threshold: 0.3,
    ignoreDiacritics: true,
  });

  // Vector Search API (equran.id)
  const { search: vectorSearch } = useVectorSearch();

  // Voice Search (unified hook — search mode)
  const {
    isListening,
    interimTranscript,
    fullTranscript,
    resetTranscript
  } = useVoice({
    mode: 'search',
    continuous: true,
    lang: 'id-ID',
    enabled: isVoiceModalOpen,
  });

  /* ── Handlers ── */

  const applyFilter = useCallback((surahs: Surat[], filter: FilterType) => {
    if (filter === 'makkiyah') return surahs.filter(s => s.tempatTurun === 'Mekah');
    if (filter === 'madaniyah') return surahs.filter(s => s.tempatTurun === 'Madinah');
    return surahs;
  }, []);

  const handleSearch = useCallback((query: string) => {
    const cleanQuery = removePrefixes(query);
    let results: Surat[];
    if (cleanQuery.trim()) {
      results = fuseSearch(cleanQuery);
    } else {
      results = allSurahs;
    }
    setFilteredSurahs(applyFilter(results, activeFilter));
  }, [fuseSearch, allSurahs, activeFilter, applyFilter]);

  const handleFilterChange = useCallback((filter: FilterType) => {
    setActiveFilter(filter);
    const cleanQuery = removePrefixes(searchQuery);
    let results: Surat[];
    if (cleanQuery.trim()) {
      results = fuseSearch(cleanQuery);
    } else {
      results = allSurahs;
    }
    setFilteredSurahs(applyFilter(results, filter));
  }, [searchQuery, fuseSearch, allSurahs, applyFilter]);

  // Voice command execution (async — uses Vector Search API)
  const executeVoiceCommand = useCallback(async (text: string) => {
    const lowerText = text.toLowerCase();

    // ── Guard: detect multiple surahs in surah mode ──
    if (voiceSearchMode === 'surah') {
      const multiPattern = /\b(dan|atau|sama)\b/i;
      if (multiPattern.test(lowerText.replace(PREFIX_REGEX, '').trim())) {
        toast({
          variant: 'destructive',
          title: 'Satu Surat Saja',
          description: 'Silakan sebutkan satu nama surat saja. Contoh: "Surat Yasin" atau "Al-Mulk".',
        });
        return;
      }
    }

    // ── Ayat search mode: semantic search via Vector API ──
    if (voiceSearchMode === 'ayat') {
      const cleanQuery = lowerText.replace(/(?:cari\s+)?(?:ayat\s+)?(?:tentang\s+)?/, '').trim();
      if (!cleanQuery) return;
      setIsVectorLoading(true);
      try {
        const results = await vectorSearch(cleanQuery, { tipe: ['ayat'], batas: 10, skorMin: 0.3 });
        if (results.length > 0) {
          setAyatResults(results);
          toast({ title: '🔍 AI Vector Search', description: `${results.length} ayat ditemukan untuk "${cleanQuery}".` });
        } else {
          toast({ variant: 'destructive', title: 'Tidak Ditemukan', description: `Tidak ditemukan ayat tentang "${cleanQuery}".` });
        }
      } catch { /* handled by hook */ }
      setIsVectorLoading(false);
      return;
    }

    // ── Content search detection (surah mode fallback) ──
    const contentMatch = lowerText.match(/(?:cari\s+)?(?:ayat\s+)?tentang\s+(.+)/);
    if (contentMatch) {
      const query = contentMatch[1].trim();
      setIsVectorLoading(true);
      try {
        const results = await vectorSearch(query, { tipe: ['ayat'], batas: 10, skorMin: 0.3 });
        if (results.length > 0) {
          setAyatResults(results);
          toast({ title: '🔍 AI Vector Search', description: `${results.length} ayat ditemukan untuk "${query}".` });
        } else {
          toast({ variant: 'destructive', title: 'Tidak Ditemukan', description: `Tidak ditemukan ayat tentang "${query}".` });
        }
      } catch { /* handled by hook */ }
      setIsVectorLoading(false);
      return;
    }

    // ── Surah + Ayat navigation ──
    const ayatMatch = lowerText.match(/(?:surat|surah)?\s*(.+?)\s+ayat\s+(\d+)/);
    if (ayatMatch) {
      const surahName = ayatMatch[1];
      const ayatNum = ayatMatch[2];
      const cleanName = removePrefixes(surahName);
      const results = fuseSearch(cleanName);
      if (results.length > 0) {
        setIsVoiceModalOpen(false);
        const targetSurah = results[0];
        navigate(`/qiraati/surat/${targetSurah.nomor}#ayat-${ayatNum}`, {
          state: { autoPlayAyat: parseInt(ayatNum) }
        });
        toast({ title: "Membuka Surat", description: `${targetSurah.namaLatin} Ayat ${ayatNum}` });
        return;
      }
    }

    // ── Surah name search (Fuse.js for names) → always auto-navigate ──
    const cleanQuery = removePrefixes(text);
    const results = fuseSearch(cleanQuery);
    if (results.length > 0) {
      setIsVoiceModalOpen(false);
      navigate(`/qiraati/surat/${results[0].nomor}`);
      toast({ title: "Membuka Surat", description: results[0].namaLatin });
    } else {
      // Fallback: try Vector API semantic search
      setIsVectorLoading(true);
      try {
        const vectorResults = await vectorSearch(cleanQuery, { batas: 5, skorMin: 0.3 });
        if (vectorResults.length > 0) {
          setAyatResults(vectorResults);
          toast({ title: '🔍 AI Vector Search', description: `${vectorResults.length} hasil ditemukan.` });
        } else {
          toast({ variant: "destructive", title: "Tidak Ditemukan", description: `Tidak ada hasil untuk "${text}".` });
        }
      } catch { /* handled by hook */ }
      setIsVectorLoading(false);
    }
  }, [fuseSearch, navigate, toast, vectorSearch, voiceSearchMode]);

  // Auto-search: execute after transcript stabilizes (2s debounce)
  useEffect(() => {
    if (autoSearchRef.current) {
      clearTimeout(autoSearchRef.current);
      autoSearchRef.current = null;
    }

    if (!isVoiceModalOpen || !fullTranscript || interimTranscript) return;

    autoSearchRef.current = setTimeout(() => {
      autoSearchRef.current = null;
      if (fullTranscript.trim().length > 0) executeVoiceCommand(fullTranscript);
    }, 2000);

    return () => {
      if (autoSearchRef.current) {
        clearTimeout(autoSearchRef.current);
        autoSearchRef.current = null;
      }
    };
  }, [fullTranscript, interimTranscript, isVoiceModalOpen, executeVoiceCommand]);

  // Modal → listen (handled by enabled prop in useVoice)
  useEffect(() => {
    if (!isVoiceModalOpen) {
      resetTranscript();
    }
  }, [isVoiceModalOpen, resetTranscript]);

  // Init data
  useEffect(() => {
    setFilteredSurahs(allSurahs);
    setIsDataReady(allSurahs.length > 0);
  }, [allSurahs]);

  // Handle URL query params (voice search from SurahDetail)
  useEffect(() => {
    if (allSurahs.length === 0) return;
    const params = new URLSearchParams(location.search);
    const voiceSearch = params.get('voice_search');
    const ayat = params.get('ayat');

    if (voiceSearch) {
      const decodedSearch = decodeURIComponent(voiceSearch);
      const clean = removePrefixes(decodedSearch);
      const results = fuseSearch(clean);

      if (results.length > 0) {
        const targetSurah = results[0];
        toast({
          title: "Perintah Suara",
          description: `Membuka ${targetSurah.namaLatin}${ayat ? ` ayat ${ayat}` : ''}...`
        });
        setTimeout(() => {
          window.history.replaceState({}, '', '/qiraati');
          navigate(`/qiraati/surat/${targetSurah.nomor}${ayat ? `#ayat-${ayat}` : ''}`, {
            state: { autoPlayAyat: ayat ? parseInt(ayat) : undefined }
          });
        }, 1000);
      } else {
        toast({
          variant: "destructive",
          title: "Tidak Ditemukan",
          description: `Surat "${decodedSearch}" tidak ditemukan.`
        });
      }
    }
  }, [allSurahs, location.search, fuseSearch, navigate, toast]);

  const handleSurahClick = (surahId: number) => navigate(`/qiraati/surat/${surahId}`);

  // Count stats
  const makkiyahCount = allSurahs.filter(s => s.tempatTurun === 'Mekah').length;
  const madaniyahCount = allSurahs.filter(s => s.tempatTurun === 'Madinah').length;
  const totalAyat = allSurahs.reduce((sum, s) => sum + s.jumlahAyat, 0);

  return (
    <div className="min-h-screen">
      {/* ── Hero Section ── */}
      <div className="relative py-12 md:py-16 text-center px-4">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-3">
          Jelajahi {allSurahs.length || 114} Surat Al-Quran
        </h1>
        <p className="text-muted-foreground max-w-lg mx-auto mb-8">
          Cari berdasarkan nama surat, nomor, atau arti dalam bahasa Indonesia
        </p>

        {/* Search Bar */}
        <div className="max-w-xl mx-auto mb-4">
          <div className="relative flex items-center gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                type="text"
                placeholder='Cari nama surat, nomor, atau arti...'
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  handleSearch(e.target.value);
                }}
                className="pl-12 h-12 text-base rounded-xl bg-card border-border/50 focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => { setIsVoiceModalOpen(true); setSearchQuery(''); }}
              disabled={!isDataReady}
              className="h-12 w-12 rounded-xl"
            >
              <Mic className="w-5 h-5" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Contoh "Al-Fatihah", "1", atau "Pembukaan"
          </p>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-center gap-6 flex-wrap text-sm">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-muted-foreground">{allSurahs.length || 114} Surat</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-sky-500" />
            <span className="text-muted-foreground">{totalAyat || '6.236'} Ayat</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-muted-foreground">30 Juz</span>
          </span>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-12">
        {/* ── Random Ayat Widget ── */}
        {!randomLoading && randomAyat && (
          <div className="mb-8 relative overflow-hidden rounded-2xl border border-border/30 bg-gradient-to-br from-emerald-950/40 via-card to-card p-6 md:p-8">
            <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/5 rounded-full blur-3xl" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-sm text-emerald-400">
                  <BookMarked className="w-4 h-4" />
                  <span>Ayat Harian</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={refreshRandom}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                  Refresh
                </Button>
              </div>

              <p className="font-arabic text-right text-2xl md:text-3xl leading-[2.2] mb-4 text-foreground">
                {randomAyat.ayat.teksArab}
              </p>
              <p className="text-muted-foreground italic text-sm mb-2">
                {randomAyat.ayat.teksLatin}
              </p>
              <p className="text-foreground/80 mb-4">
                {randomAyat.ayat.teksIndonesia}
              </p>
              <div className="flex items-center gap-3 text-xs">
                <button
                  onClick={() => navigate(`/qiraati/surat/${randomAyat.suratNomor}#ayat-${randomAyat.ayat.nomorAyat}`)}
                  className="text-emerald-400 hover:text-emerald-300 transition-colors font-medium"
                >
                  {randomAyat.suratNamaLatin} • Ayat {randomAyat.ayat.nomorAyat} →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Filter Chips ── */}
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          {([
            { key: 'semua' as const, label: 'Semua', count: allSurahs.length },
            { key: 'makkiyah' as const, label: 'Makkiyah', count: makkiyahCount },
            { key: 'madaniyah' as const, label: 'Madaniyah', count: madaniyahCount },
          ]).map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => handleFilterChange(key)}
              className={`
                px-4 py-2 rounded-full text-sm font-medium transition-all
                ${activeFilter === key
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/25'
                  : 'bg-card border border-border/50 text-muted-foreground hover:bg-accent hover:text-foreground'
                }
              `}
            >
              {label} ({count})
            </button>
          ))}
        </div>

        {/* ── Surah Grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {surahLoading ? (
            Array.from({ length: 12 }).map((_, i) => (
              <div key={`skeleton-${i}`} className="rounded-xl border border-border/30 bg-card p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div>
                      <Skeleton className="h-5 w-24 mb-1.5" />
                      <Skeleton className="h-3.5 w-16" />
                    </div>
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
                <div className="flex items-center gap-3 mt-3">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-12" />
                </div>
              </div>
            ))
          ) : filteredSurahs.length > 0 ? (
            filteredSurahs.map((surah) => (
              <button
                key={surah.nomor}
                onClick={() => handleSurahClick(surah.nomor)}
                className="
                  group text-left rounded-xl border border-border/30 bg-card p-4
                  hover:border-emerald-500/40 hover:bg-card/80
                  transition-all duration-200 hover:shadow-lg hover:shadow-emerald-500/5
                "
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {/* Number circle */}
                    <div className="relative w-10 h-10 flex items-center justify-center">
                      <div className="absolute inset-0 rounded-full border-2 border-emerald-500/50 group-hover:border-emerald-400 transition-colors" />
                      <span className="text-sm font-semibold text-emerald-500 group-hover:text-emerald-400">
                        {surah.nomor}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground group-hover:text-emerald-400 transition-colors">
                        {surah.namaLatin}
                      </h3>
                      <p className="text-xs text-muted-foreground">{surah.arti}</p>
                    </div>
                  </div>
                  {/* Arabic name */}
                  <span className="font-arabic text-xl text-emerald-500/80 group-hover:text-emerald-400 transition-colors leading-none mt-1">
                    {surah.nama}
                  </span>
                </div>

                {/* Meta */}
                <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {surah.tempatTurun}
                  </span>
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-3 h-3" />
                    {surah.jumlahAyat}
                  </span>
                </div>
              </button>
            ))
          ) : (
            <div className="col-span-full text-center py-16">
              <Search className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
              <p className="text-muted-foreground font-medium">Tidak ada surat yang ditemukan.</p>
              <p className="text-sm text-muted-foreground/70 mt-1">Coba kata kunci lain. Contoh: Yasin, Al-Mulk, atau Pembukaan</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Voice Search Modal ── */}
      <Dialog open={isVoiceModalOpen} onOpenChange={setIsVoiceModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center flex flex-col items-center gap-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${isListening ? 'bg-red-500/10 animate-pulse' : 'bg-muted'}`}>
                <Mic className={`w-8 h-8 ${isListening ? 'text-red-500' : 'text-muted-foreground'}`} />
              </div>
              {isListening ? "Mendengarkan..." : "Memproses..."}
            </DialogTitle>
            <DialogDescription className="text-center">
              {voiceSearchMode === 'surah'
                ? 'Katakan nama surat. Jeda sejenak untuk mencari otomatis.'
                : 'Katakan kata kunci konten ayat. Contoh: "tentang sabar"'}
            </DialogDescription>
          </DialogHeader>

          <div className="py-6 space-y-4">
            {/* Search Mode Toggle */}
            <div className="flex justify-center gap-1 bg-muted rounded-lg p-1">
              <button
                onClick={() => { setVoiceSearchMode('surah'); setAyatResults([]); }}
                className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${voiceSearchMode === 'surah' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                Cari Surah
              </button>
              <button
                onClick={() => { setVoiceSearchMode('ayat'); setAyatResults([]); }}
                className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${voiceSearchMode === 'ayat' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                🔍 Cari Ayat (AI)
              </button>
            </div>
            <div className="bg-muted p-4 rounded-lg min-h-[80px] flex items-center justify-center text-center">
              <p className="text-lg font-medium text-foreground">
                {interimTranscript || fullTranscript || "..."}
              </p>
            </div>

            <div className="flex flex-wrap gap-2 justify-center text-xs text-muted-foreground">
              <span className="bg-secondary px-2 py-1 rounded-md">"Al-Mulk"</span>
              <span className="bg-secondary px-2 py-1 rounded-md">"Surat Yasin"</span>
              <span className="bg-secondary px-2 py-1 rounded-md">"Buka Ayat 5"</span>
              <span className="bg-secondary px-2 py-1 rounded-md">"Cari ayat tentang sabar"</span>
            </div>

            {/* Vector Search Loading */}
            {isVectorLoading && (
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground py-2">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                <span>Mencari dengan AI Vector Search...</span>
              </div>
            )}

            {/* Vector Search Results */}
            {ayatResults.length > 0 && (
              <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                <p className="text-xs text-muted-foreground text-center font-medium">🔍 Hasil AI Search ({ayatResults.length})</p>
                {ayatResults.slice(0, 5).map((r, i) => (
                  <button
                    key={`${r.data.id_surat}-${r.data.nomor_ayat}-${i}`}
                    onClick={() => {
                      setIsVoiceModalOpen(false);
                      setAyatResults([]);
                      if (r.tipe === 'ayat' && r.data.id_surat) {
                        navigate(`/qiraati/surat/${r.data.id_surat}${r.data.nomor_ayat ? `#ayat-${r.data.nomor_ayat}` : ''}`, {
                          state: r.data.nomor_ayat ? { autoPlayAyat: r.data.nomor_ayat } : undefined
                        });
                      } else if (r.tipe === 'surat' && r.data.id_surat) {
                        navigate(`/qiraati/surat/${r.data.id_surat}`);
                      }
                    }}
                    className="w-full text-left p-3 rounded-lg border border-border/40 hover:border-emerald-500/50 bg-card hover:bg-card/80 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-emerald-500 font-medium">
                        {r.data.nama_surat}{r.data.nomor_ayat ? ` : ${r.data.nomor_ayat}` : ''}
                      </p>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${r.relevansi === 'tinggi' ? 'bg-emerald-500/20 text-emerald-400' :
                        r.relevansi === 'sedang' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-muted text-muted-foreground'
                        }`}>
                        {Math.round(r.skor * 100)}%
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">
                      {r.data.terjemahan_id || r.data.isi || r.data.deskripsi || r.data.arti_surat}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          <DialogFooter className="sm:justify-between gap-2">
            <Button variant="ghost" onClick={() => setIsVoiceModalOpen(false)}>
              <X className="w-4 h-4 mr-2" /> Batal
            </Button>
            <Button
              onClick={() => executeVoiceCommand(fullTranscript)}
              disabled={!fullTranscript.trim()}
            >
              <Check className="w-4 h-4 mr-2" /> Cari Sekarang
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div >
  );
};

export default Qiraati;