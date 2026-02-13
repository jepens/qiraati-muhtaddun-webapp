import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft, Play, Pause, Plus, Minus,
  ScrollText, FastForward, ScanFace, Bookmark, BookmarkCheck,
  BookOpenText, Copy, Share2, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  useSurahList,
  useSurahDetail,
  useQariList,
  useTafsirAyat,
  useSurahNavigation,
  useAudioUrls,
} from '@/hooks/useQuran';
import { useBookmarks } from '@/hooks/useBookmarks';
import { useLastRead } from '@/hooks/useLastRead';
import { useFaceScroll } from '@/hooks/useFaceScroll';
import { useVoice, VoiceCommand } from '@/hooks/useVoice';
import SmartReaderOverlay from '@/components/SmartReaderOverlay';
import { useSmartReader } from '@/providers/SmartReaderHooks';
import SurahSidebar from '@/components/SurahSidebar';
import { useToast } from '@/hooks/use-toast';

const scrollSpeeds = { slow: 80, medium: 40, fast: 20 };
const fontSizes = { sm: '1rem', md: '1.25rem', lg: '1.5rem', xl: '2rem' };

const SurahDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // Data hooks
  const { surah: surahData, loading } = useSurahDetail(id);
  const { surahs: allSurahs, loading: surahsLoading } = useSurahList();
  const { qariList } = useQariList();
  const { tafsirAyat, loading: tafsirLoading, fetchTafsirAyat, reset: resetTafsir } = useTafsirAyat();
  const nomor = id ? parseInt(id) : undefined;
  const { nextSurat, prevSurat } = useSurahNavigation(nomor);
  const { getAudioFull, getAudioAyat } = useAudioUrls();
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const { updateLastRead } = useLastRead();

  // UI State
  const [isPlayingFull, setIsPlayingFull] = useState(false);
  const [playingAyat, setPlayingAyat] = useState<number | null>(null);
  const [fontSize, setFontSize] = useState<'sm' | 'md' | 'lg' | 'xl'>('md');
  const [isMuted] = useState(false);
  const [autoScroll, setAutoScroll] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState<'slow' | 'medium' | 'fast'>('medium');
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showTransliteration, setShowTransliteration] = useState(true);
  const [showTranslation, setShowTranslation] = useState(true);
  const [selectedQari, setSelectedQari] = useState<string>('05'); // Default: Misyari Rasyid
  const [tafsirModalOpen, setTafsirModalOpen] = useState(false);
  const [tafsirModalAyat, setTafsirModalAyat] = useState<number | null>(null);
  const { isSmartMode, setIsSmartMode } = useSmartReader();

  // Refs
  const ayatListRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const ayatAudioRefs = useRef<Record<number, HTMLAudioElement>>({});

  // Qari map for display
  const qariMap = useMemo(() => {
    const map: Record<string, string> = {
      '01': 'Abdullah Al-Juhany',
      '02': 'Abdul Muhsin Al-Qasim',
      '03': 'Abdurrahman as-Sudais',
      '04': 'Ibrahim Al-Dossari',
      '05': 'Misyari Rasyid Al-Afasi',
    };
    qariList.forEach((q) => {
      map[q.id] = q.name;
    });
    return map;
  }, [qariList]);

  // ─── Load/save font size ───
  useEffect(() => {
    const saved = localStorage.getItem('qiraati-font-size') as typeof fontSize;
    if (saved) setFontSize(saved);
  }, []);
  useEffect(() => {
    localStorage.setItem('qiraati-font-size', fontSize);
  }, [fontSize]);

  // ─── Scroll progress ───
  useEffect(() => {
    const container = ayatListRef.current;
    if (!container) return;
    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const scrollHeight = container.scrollHeight - container.clientHeight;
      setScrollProgress(scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0);
    };
    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // ─── Auto scroll ───
  useEffect(() => {
    if (!autoScroll) return;
    const container = ayatListRef.current;
    if (!container) return;
    let timer: number;
    const step = () => {
      if (!autoScroll) return;
      if (container.scrollTop + container.clientHeight >= container.scrollHeight) {
        setAutoScroll(false);
        return;
      }
      container.scrollTop += 1;
      timer = window.setTimeout(step, scrollSpeeds[scrollSpeed]);
    };
    timer = window.setTimeout(step, scrollSpeeds[scrollSpeed]);
    return () => clearTimeout(timer);
  }, [autoScroll, scrollSpeed]);

  // ─── Audio: Full Surah ───
  const playFullSurah = useCallback(async () => {
    if (!surahData || !nomor) return;

    if (audioRef.current && isPlayingFull) {
      audioRef.current.pause();
      setIsPlayingFull(false);
      return;
    }

    try {
      const url = await getAudioFull(nomor, selectedQari);
      if (url && audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.play().catch(console.error);
        setIsPlayingFull(true);
        setPlayingAyat(null);
        Object.values(ayatAudioRefs.current).forEach((a) => a.pause());
      }
    } catch (e) {
      console.error('Error playing full surah:', e);
    }
  }, [surahData, nomor, isPlayingFull, selectedQari, getAudioFull]);

  // ─── Audio: Per Ayat ───
  const playAyat = useCallback(async (ayatNumber: number) => {
    if (!surahData || !nomor) return;

    // Stop full surah
    if (audioRef.current && isPlayingFull) {
      audioRef.current.pause();
      setIsPlayingFull(false);
    }

    // Stop other ayat
    Object.entries(ayatAudioRefs.current).forEach(([num, audio]) => {
      if (parseInt(num) !== ayatNumber) audio.pause();
    });

    if (!ayatAudioRefs.current[ayatNumber]) {
      ayatAudioRefs.current[ayatNumber] = new Audio();
    }
    const ayatAudio = ayatAudioRefs.current[ayatNumber];

    if (playingAyat === ayatNumber) {
      ayatAudio.pause();
      setPlayingAyat(null);
    } else {
      try {
        const url = await getAudioAyat(nomor, ayatNumber, selectedQari);
        if (url) {
          ayatAudio.src = url;
          ayatAudio.play().catch(console.error);
          setPlayingAyat(ayatNumber);
          ayatAudio.onended = () => setPlayingAyat(null);
          // Track last read position
          if (surahData) {
            updateLastRead(surahData.nomor, surahData.namaLatin, ayatNumber);
          }
        }
      } catch (e) {
        console.error('Error playing ayat:', e);
      }
    }
  }, [surahData, nomor, isPlayingFull, playingAyat, selectedQari, getAudioAyat, updateLastRead]);

  // ─── Stop all audio ───
  const stopAllAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlayingFull(false);
    }
    setPlayingAyat(null);
    Object.values(ayatAudioRefs.current).forEach((a) => {
      a.pause();
      a.currentTime = 0;
    });
    setAutoScroll(false);
  }, []);

  useEffect(() => {
    return () => stopAllAudio();
  }, [stopAllAudio]);

  // ─── Auto-play from navigation state ───
  const lastProcessedState = useRef<any>(null);
  useEffect(() => {
    if (loading || !surahData || !location.state) return;
    if (location.state === lastProcessedState.current) return;
    const state = location.state as { autoPlayAyat?: number };
    if (state?.autoPlayAyat) {
      lastProcessedState.current = location.state;
      setTimeout(() => {
        playAyat(state.autoPlayAyat!);
        const el = document.getElementById(`ayat-${state.autoPlayAyat}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        window.history.replaceState({}, document.title);
      }, 1000);
    }
  }, [loading, surahData, location.state, playAyat]);

  // ─── Tafsir modal ───
  const openTafsir = useCallback(async (ayatNomor: number) => {
    if (!nomor) return;
    setTafsirModalAyat(ayatNomor);
    setTafsirModalOpen(true);
    await fetchTafsirAyat(nomor, ayatNomor);
  }, [nomor, fetchTafsirAyat]);

  const closeTafsir = useCallback(() => {
    setTafsirModalOpen(false);
    setTafsirModalAyat(null);
    resetTafsir();
  }, [resetTafsir]);

  // ─── Copy text ───
  const copyAyat = useCallback((ayat: any) => {
    const text = `${ayat.teksArab}\n\n${ayat.teksLatin}\n\n${ayat.teksIndonesia}\n\n— ${surahData?.namaLatin} : ${ayat.nomorAyat}`;
    navigator.clipboard.writeText(text).then(() => {
      toast({ title: 'Berhasil Disalin', description: 'Teks ayat telah disalin ke clipboard.' });
    }).catch(() => {
      toast({ variant: 'destructive', title: 'Gagal', description: 'Gagal menyalin teks.' });
    });
  }, [surahData, toast]);

  // ─── Share ───
  const shareAyat = useCallback((ayat: any) => {
    const url = `${window.location.origin}/qiraati/surat/${nomor}#ayat-${ayat.nomorAyat}`;
    const text = `${surahData?.namaLatin} Ayat ${ayat.nomorAyat}\n\n${ayat.teksArab}\n\n${ayat.teksIndonesia}`;

    if (navigator.share) {
      navigator.share({ title: `${surahData?.namaLatin} Ayat ${ayat.nomorAyat}`, text, url }).catch(() => { });
    } else {
      navigator.clipboard.writeText(`${text}\n\n${url}`).then(() => {
        toast({ title: 'Link Disalin', description: 'Link ayat telah disalin ke clipboard.' });
      }).catch(() => { });
    }
  }, [nomor, surahData, toast]);

  // ─── Font size ───
  const handleFontSizeChange = useCallback((newSize: typeof fontSize) => {
    setFontSize(newSize);
    if (ayatListRef.current) {
      const scroll = ayatListRef.current.scrollTop;
      requestAnimationFrame(() => {
        if (ayatListRef.current) ayatListRef.current.scrollTop = scroll;
      });
    }
  }, []);

  // ─── Smart Reader ───
  const { videoRef, isReady: isFaceReady, error: faceError, debugRefs } = useFaceScroll({
    enabled: isSmartMode,
    onScroll: (speed) => {
      if (ayatListRef.current) ayatListRef.current.scrollTop += speed;
    }
  });

  // ─── Voice Commands Registry (Context7 — command pattern) ───
  const voiceCommands: VoiceCommand[] = useMemo(() => [
    // Play / Pause / Stop
    { command: /(?:putar|baca|mulai)/, callback: () => playFullSurah(), description: 'Memutar audio...' },
    { command: /(?:berhenti|stop|jeda)/, callback: () => stopAllAudio(), description: 'Audio dihentikan.' },
    // Play specific ayat
    {
      command: /(?:baca|putar)?\s*ayat\s+(\d+)/, callback: (ayatStr: string) => {
        const num = parseInt(ayatStr);
        playAyat(num);
        document.getElementById(`ayat-${num}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, description: 'Memutar ayat...'
    },
    // Open surah with ayat
    {
      command: /(?:buka|putar|baca)?\s*(?:surah)?\s+(.+?)\s+ayat\s+(\d+)/, callback: (surahName: string, ayatStr: string) => {
        stopAllAudio();
        navigate(`/qiraati?voice_search=${encodeURIComponent(surahName)}&ayat=${ayatStr}`);
      }, description: 'Membuka surah...'
    },
    // Open surah
    {
      command: /(?:buka|putar|baca)?\s*(?:surah)\s+(.+)/, callback: (surahName: string) => {
        if (!surahName.includes('ayat')) {
          stopAllAudio();
          navigate(`/qiraati?voice_search=${encodeURIComponent(surahName)}`);
        }
      }, description: 'Membuka surah...'
    },
    // Fallback "buka X"
    {
      command: /^(?:buka|baca|cari)\s+(?!ayat)(.+)/, callback: (surahName: string) => {
        const clean = surahName.replace('surah', '').trim();
        if (clean && !clean.includes('ayat')) {
          stopAllAudio();
          navigate(`/qiraati?voice_search=${encodeURIComponent(clean)}`);
        }
      }, description: 'Membuka surah...'
    },
    // Scroll
    { command: /(?:turun|scroll)/, callback: () => setAutoScroll(true), description: 'Scroll aktif.' },
    { command: /(?:berhenti scroll|stop scroll)/, callback: () => setAutoScroll(false), description: 'Scroll nonaktif.' },

    // ── Phase 2: New Commands ──

    // Tafsir
    {
      command: /(?:tafsir|buka tafsir)\s*(?:ayat\s+)?(\d+)?/, callback: (ayatStr?: string) => {
        const ayatNum = ayatStr ? parseInt(ayatStr) : 1;
        openTafsir(ayatNum);
      }, description: 'Membuka tafsir...'
    },

    // Font size
    {
      command: /font (?:besar|lebih besar|perbesar)/, callback: () => {
        const sizes: Array<typeof fontSize> = ['sm', 'md', 'lg', 'xl'];
        const idx = sizes.indexOf(fontSize);
        if (idx < sizes.length - 1) handleFontSizeChange(sizes[idx + 1]);
      }, description: 'Font diperbesar.'
    },
    {
      command: /font (?:kecil|lebih kecil|perkecil)/, callback: () => {
        const sizes: Array<typeof fontSize> = ['sm', 'md', 'lg', 'xl'];
        const idx = sizes.indexOf(fontSize);
        if (idx > 0) handleFontSizeChange(sizes[idx - 1]);
      }, description: 'Font diperkecil.'
    },

    // Bookmark
    {
      command: /(?:bookmark|simpan|tandai)\s*(?:ayat\s+)?(\d+)?/, callback: (ayatStr?: string) => {
        if (!surahData) return;
        const ayatNum = ayatStr ? parseInt(ayatStr) : 1;
        toggleBookmark(surahData.nomor, surahData.namaLatin, ayatNum);
      }, description: 'Bookmark disimpan.'
    },

    // Navigation between surahs
    {
      command: /(?:selanjutnya|surah selanjutnya|surah berikutnya|next)/, callback: () => {
        if (nextSurat) { stopAllAudio(); navigate(`/qiraati/surat/${nextSurat.nomor}`); }
      }, description: 'Surah selanjutnya...'
    },
    {
      command: /(?:sebelumnya|surah sebelumnya|kembali|previous)/, callback: () => {
        if (prevSurat) { stopAllAudio(); navigate(`/qiraati/surat/${prevSurat.nomor}`); }
      }, description: 'Surah sebelumnya...'
    },

    // Toggle transliteration / translation
    {
      command: /transliterasi/, callback: () => {
        setShowTransliteration(prev => !prev);
      }, description: showTransliteration ? 'Transliterasi dinonaktifkan.' : 'Transliterasi diaktifkan.'
    },
    {
      command: /terjemahan/, callback: () => {
        setShowTranslation(prev => !prev);
      }, description: showTranslation ? 'Terjemahan dinonaktifkan.' : 'Terjemahan diaktifkan.'
    },

    // Random ayat
    {
      command: /(?:ayat acak|bacakan ayat acak|acak)/, callback: () => {
        if (!surahData?.ayat?.length) return;
        const randomIdx = Math.floor(Math.random() * surahData.ayat.length);
        const ayat = surahData.ayat[randomIdx];
        playAyat(ayat.nomorAyat);
        document.getElementById(`ayat-${ayat.nomorAyat}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, description: 'Memutar ayat acak...'
    },

    // Copy ayat
    {
      command: /(?:salin|copy)\s*(?:ayat\s+)?(\d+)?/, callback: (ayatStr?: string) => {
        if (!surahData?.ayat?.length) return;
        const ayatNum = ayatStr ? parseInt(ayatStr) : 1;
        const ayat = surahData.ayat.find(a => a.nomorAyat === ayatNum);
        if (ayat) copyAyat(ayat);
      }, description: 'Ayat disalin.'
    },

    // Share ayat
    {
      command: /(?:bagikan|share)\s*(?:ayat\s+)?(\d+)?/, callback: (ayatStr?: string) => {
        if (!surahData?.ayat?.length) return;
        const ayatNum = ayatStr ? parseInt(ayatStr) : 1;
        const ayat = surahData.ayat.find(a => a.nomorAyat === ayatNum);
        if (ayat) shareAyat(ayat);
      }, description: 'Ayat dibagikan.'
    },

  ], [playFullSurah, playAyat, stopAllAudio, navigate, openTafsir, fontSize, handleFontSizeChange, surahData, toggleBookmark, nextSurat, prevSurat, showTransliteration, showTranslation, copyAyat, shareAyat]);

  const { isListening, isProcessing, isSpeaking, lastCommand, error: voiceError, startListening: restartVoice } = useVoice({
    mode: 'command',
    commands: voiceCommands,
    enabled: isSmartMode,
  });

  return (
    <div className="flex min-h-screen">
      {/* Sidebar (desktop only) */}
      <SurahSidebar surahs={allSurahs} currentNomor={nomor} loading={surahsLoading} />

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        {/* Back button */}
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border/30 px-4 py-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/qiraati')}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Kembali ke Beranda
          </Button>
        </div>

        {loading ? (
          <div className="p-6 space-y-6">
            <div className="rounded-xl border border-border/30 bg-card p-6">
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-5 w-32" />
            </div>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border/30 bg-card p-6 space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-5 w-3/4" />
              </div>
            ))}
          </div>
        ) : surahData ? (
          <div className="p-4 md:p-6 space-y-4">
            {/* ── Surah Header ── */}
            <div className="rounded-xl border border-border/30 bg-card p-5 md:p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full border-2 border-emerald-500 flex items-center justify-center">
                    <span className="text-sm font-bold text-emerald-500">{surahData.nomor}</span>
                  </div>
                  <div>
                    <h1 className="text-xl md:text-2xl font-bold text-foreground">
                      {surahData.namaLatin}
                      <span className="text-muted-foreground font-normal text-base ml-2">• {surahData.arti}</span>
                    </h1>
                    <p className="text-sm text-muted-foreground">
                      ◉ {surahData.tempatTurun} • {surahData.jumlahAyat} Ayat
                    </p>
                  </div>
                </div>
                <span className="font-arabic text-2xl md:text-3xl text-emerald-500 leading-none">
                  {surahData.nama}
                </span>
              </div>
            </div>

            {/* ── Controls Bar ── */}
            <div className="rounded-xl border border-border/30 bg-card px-4 py-3 flex flex-wrap items-center gap-3 md:gap-4 text-sm">
              {/* Qari Selector */}
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground hidden sm:inline">Qari:</span>
                <Select value={selectedQari} onValueChange={(v) => { setSelectedQari(v); stopAllAudio(); }}>
                  <SelectTrigger className="w-[180px] md:w-[220px] h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(qariMap).map(([qid, name]) => (
                      <SelectItem key={qid} value={qid}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="hidden md:block w-px h-6 bg-border/50" />

              {/* Transliteration Toggle */}
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-muted-foreground text-xs">ꦲ Transliterasi</span>
                <Switch checked={showTransliteration} onCheckedChange={setShowTransliteration} />
              </label>

              {/* Translation Toggle */}
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-muted-foreground text-xs">T Terjemahan</span>
                <Switch checked={showTranslation} onCheckedChange={setShowTranslation} />
              </label>

              <div className="hidden md:block w-px h-6 bg-border/50" />

              {/* Play Full */}
              <Button variant="ghost" size="sm" onClick={playFullSurah} className="text-emerald-500 hover:text-emerald-400">
                {isPlayingFull ? <Pause className="w-4 h-4 mr-1" /> : <Play className="w-4 h-4 mr-1" />}
                Play Audio Full
              </Button>
            </div>

            {/* ── Font & Scroll Controls (collapsed) ── */}
            <details className="rounded-xl border border-border/30 bg-card">
              <summary className="px-4 py-3 text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                ⚙ Pengaturan Tampilan & Scroll
              </summary>
              <div className="px-4 pb-4 space-y-4">
                {/* Font Size */}
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground min-w-[80px]">Font:</span>
                  <Button variant="outline" size="icon" className="h-8 w-8"
                    onClick={() => { const s: (typeof fontSize)[] = ['sm', 'md', 'lg', 'xl']; const i = s.indexOf(fontSize); if (i > 0) handleFontSizeChange(s[i - 1]); }}
                    disabled={fontSize === 'sm'}>
                    <Minus className="w-3 h-3" />
                  </Button>
                  <span className="text-sm text-foreground min-w-[70px] text-center">
                    {{ sm: 'Kecil', md: 'Sedang', lg: 'Besar', xl: 'Sangat Besar' }[fontSize]}
                  </span>
                  <Button variant="outline" size="icon" className="h-8 w-8"
                    onClick={() => { const s: (typeof fontSize)[] = ['sm', 'md', 'lg', 'xl']; const i = s.indexOf(fontSize); if (i < s.length - 1) handleFontSizeChange(s[i + 1]); }}
                    disabled={fontSize === 'xl'}>
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
                {/* Auto Scroll */}
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground min-w-[80px]">Scroll:</span>
                  <Button size="sm" variant={autoScroll ? 'default' : 'outline'} onClick={() => setAutoScroll(!autoScroll)}>
                    <ScrollText className="w-3 h-3 mr-1" /> {autoScroll ? 'Stop' : 'Mulai'}
                  </Button>
                  {autoScroll && (
                    <Button size="sm" variant="outline"
                      onClick={() => { const sp: (typeof scrollSpeed)[] = ['slow', 'medium', 'fast']; setScrollSpeed(sp[(sp.indexOf(scrollSpeed) + 1) % 3]); }}>
                      <FastForward className="w-3 h-3 mr-1" /> {scrollSpeed}
                    </Button>
                  )}
                </div>
                <div className="h-1 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${scrollProgress}%` }} />
                </div>
                {/* Smart Reader */}
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground min-w-[80px]">Smart:</span>
                  <Button size="sm" variant={isSmartMode ? 'default' : 'outline'} onClick={() => setIsSmartMode(!isSmartMode)}>
                    <ScanFace className="w-3 h-3 mr-1" /> {isSmartMode ? 'Matikan' : 'Aktifkan'}
                  </Button>
                </div>
              </div>
            </details>

            {isSmartMode && (
              <SmartReaderOverlay
                videoRef={videoRef}
                isReady={isFaceReady}
                isListening={isListening}
                isSpeaking={isSpeaking}
                isProcessing={isProcessing}
                lastCommand={lastCommand}
                error={faceError || voiceError}
                debugRefs={debugRefs}
                onClose={() => setIsSmartMode(false)}
                onRetry={restartVoice}
              />
            )}

            {/* ── Ayat List ── */}
            <div
              ref={ayatListRef}
              className="space-y-3 max-h-[calc(100vh-16rem)] overflow-y-auto scroll-smooth"
            >
              {surahData.ayat.map((ayat) => {
                const bookmarked = isBookmarked(surahData.nomor, ayat.nomorAyat);

                return (
                  <div
                    key={ayat.nomorAyat}
                    id={`ayat-${ayat.nomorAyat}`}
                    className="rounded-xl border border-border/30 bg-card p-4 md:p-5 transition-colors"
                  >
                    {/* Action row */}
                    <div className="flex items-center gap-1.5 mb-4">
                      {/* Ayat number */}
                      <div className="w-8 h-8 rounded-full border-2 border-emerald-500/60 flex items-center justify-center mr-1">
                        <span className="text-xs font-semibold text-emerald-500">{ayat.nomorAyat}</span>
                      </div>
                      {/* Play */}
                      <Button variant="ghost" size="icon" className="h-8 w-8"
                        onClick={() => playAyat(ayat.nomorAyat)}>
                        {playingAyat === ayat.nomorAyat
                          ? <Pause className="w-4 h-4 text-emerald-500" />
                          : <Play className="w-4 h-4 text-muted-foreground hover:text-emerald-500" />}
                      </Button>
                      {/* Bookmark */}
                      <Button variant="ghost" size="icon" className="h-8 w-8"
                        onClick={() => toggleBookmark(surahData.nomor, surahData.namaLatin, ayat.nomorAyat, ayat.teksArab)}>
                        {bookmarked
                          ? <BookmarkCheck className="w-4 h-4 text-amber-500" />
                          : <Bookmark className="w-4 h-4 text-muted-foreground hover:text-amber-500" />}
                      </Button>
                      {/* Tafsir */}
                      <Button variant="ghost" size="icon" className="h-8 w-8"
                        onClick={() => openTafsir(ayat.nomorAyat)}>
                        <BookOpenText className="w-4 h-4 text-muted-foreground hover:text-sky-500" />
                      </Button>
                      {/* Copy */}
                      <Button variant="ghost" size="icon" className="h-8 w-8"
                        onClick={() => copyAyat(ayat)}>
                        <Copy className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                      </Button>
                      {/* Share */}
                      <Button variant="ghost" size="icon" className="h-8 w-8"
                        onClick={() => shareAyat(ayat)}>
                        <Share2 className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                      </Button>
                    </div>

                    {/* Arabic text */}
                    <p
                      className="font-arabic text-right leading-[2.2] mb-3 text-foreground"
                      style={{ fontSize: fontSizes[fontSize], transition: 'font-size 0.3s ease' }}
                    >
                      {ayat.teksArab}
                    </p>

                    {/* Transliteration */}
                    {showTransliteration && (
                      <p className="text-muted-foreground italic text-sm mb-2">
                        {ayat.teksLatin}
                      </p>
                    )}

                    {/* Translation */}
                    {showTranslation && (
                      <p className="text-foreground/80 text-sm">
                        {ayat.teksIndonesia}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* ── Next/Prev Navigation ── */}
            <div className="flex items-center justify-between pt-4">
              {prevSurat ? (
                <Button
                  variant="outline"
                  onClick={() => { stopAllAudio(); navigate(`/qiraati/surat/${prevSurat.nomor}`); }}
                  className="flex items-center gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">{prevSurat.namaLatin}</span>
                  <span className="sm:hidden">Sebelumnya</span>
                </Button>
              ) : <div />}
              {nextSurat ? (
                <Button
                  variant="outline"
                  onClick={() => { stopAllAudio(); navigate(`/qiraati/surat/${nextSurat.nomor}`); }}
                  className="flex items-center gap-2"
                >
                  <span className="hidden sm:inline">{nextSurat.namaLatin}</span>
                  <span className="sm:hidden">Selanjutnya</span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              ) : <div />}
            </div>
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-muted-foreground">Surat tidak ditemukan.</p>
            <Button variant="link" onClick={() => navigate('/qiraati')} className="mt-4">
              Kembali ke Daftar Surat
            </Button>
          </div>
        )}
      </div>

      {/* ── Tafsir Modal ── */}
      <Dialog open={tafsirModalOpen} onOpenChange={(open) => { if (!open) closeTafsir(); }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <BookOpenText className="w-5 h-5 text-emerald-500" />
              Tafsir {surahData?.namaLatin} Ayat {tafsirModalAyat}
            </DialogTitle>
            {surahData && tafsirModalAyat && (
              <div className="flex items-center gap-2 mt-2">
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium">
                  {surahData.namaLatin}
                </span>
                <span className="px-2.5 py-1 rounded-full bg-sky-500/10 text-sky-400 text-xs font-medium">
                  Ayat {tafsirModalAyat}
                </span>
              </div>
            )}
          </DialogHeader>

          <div className="py-4 space-y-4">
            {/* Arabic text of the ayat */}
            {surahData && tafsirModalAyat && (
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="font-arabic text-right text-xl leading-[2] text-foreground">
                  {surahData.ayat.find(a => a.nomorAyat === tafsirModalAyat)?.teksArab}
                </p>
              </div>
            )}

            {/* Tafsir content */}
            {tafsirLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-4 w-full" />
              </div>
            ) : tafsirAyat ? (
              <div className="prose prose-sm prose-invert max-w-none text-foreground/90 leading-relaxed">
                <p className="whitespace-pre-line">{tafsirAyat.teks}</p>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">Tafsir tidak tersedia.</p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeTafsir}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Audio element */}
      <audio ref={audioRef} onEnded={() => setIsPlayingFull(false)} muted={isMuted} />
    </div>
  );
};

export default SurahDetail;