import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft, Play, Pause, Plus, Minus, X,
  ScrollText, FastForward, ScanFace, Hand, Bookmark, BookmarkCheck,
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
import { useHandGesture } from '@/hooks/useHandGesture';
import { useIsMobile } from '@/hooks/use-mobile';

import SmartReaderOverlay from '@/components/SmartReaderOverlay';
import { HandPointer } from '@/components/HandPointer';
import SmartModeOnboarding from '@/components/SmartModeOnboarding';
import SearchWidget, { type SearchWidgetHandle } from '@/components/SearchWidget';
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
  const isPlayingFullRef = useRef(false);
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
  const [smartOnboardingOpen, setSmartOnboardingOpen] = useState(false);
  const [onboardingType, setOnboardingType] = useState<'head' | 'hand'>('head');
  const { isSmartMode, setIsSmartMode, gestureType, setGestureType } = useSmartReader();
  const isMobile = useIsMobile();
  const searchWidgetRef = useRef<SearchWidgetHandle>(null);

  // Refs
  const ayatListRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const ayatAudioRefs = useRef<Record<number, HTMLAudioElement>>({});
  const tafsirContentRef = useRef<HTMLDivElement>(null);

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

    // Use ref to avoid stale closure when called from gesture handler
    if (audioRef.current && isPlayingFullRef.current) {
      audioRef.current.pause();
      setIsPlayingFull(false);
      isPlayingFullRef.current = false;
      return;
    }

    try {
      const url = await getAudioFull(nomor, selectedQari);
      if (url && audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.play().catch(console.error);
        setIsPlayingFull(true);
        isPlayingFullRef.current = true;
        setPlayingAyat(null);
        Object.values(ayatAudioRefs.current).forEach((a) => a.pause());
      }
    } catch (e) {
      console.error('Error playing full surah:', e);
    }
  }, [surahData, nomor, selectedQari, getAudioFull]);

  // ─── Audio: Per Ayat ───
  const playAyat = useCallback(async (ayatNumber: number) => {
    if (!surahData || !nomor) return;

    // ─── Validate ayat number range ───
    if (ayatNumber < 1 || ayatNumber > surahData.jumlahAyat) {
      toast({
        variant: 'destructive',
        title: 'Ayat Tidak Ditemukan',
        description: `Surat ${surahData.namaLatin} hanya memiliki ${surahData.jumlahAyat} ayat. Ayat ${ayatNumber} tidak tersedia.`,
      });
      return;
    }

    // Stop full surah
    if (audioRef.current && isPlayingFullRef.current) {
      audioRef.current.pause();
      setIsPlayingFull(false);
      isPlayingFullRef.current = false;
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
      } catch (e: any) {
        console.error('Error playing ayat:', e);
        toast({
          variant: 'destructive',
          title: 'Gagal Memutar Audio',
          description: e?.message || 'Terjadi kesalahan saat memutar audio ayat.',
        });
      }
    }
  }, [surahData, nomor, playingAyat, selectedQari, getAudioAyat, updateLastRead, toast]);

  // ─── Stop all audio ───
  const stopAllAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlayingFull(false);
      isPlayingFullRef.current = false;
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

  // ─── Auto-scroll to playing ayat ───
  useEffect(() => {
    if (playingAyat === null) return;
    const el = document.getElementById(`ayat-${playingAyat}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [playingAyat]);

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

  const isHandMode = gestureType === 'hand';
  const isFaceMode = gestureType === 'head';

  // ── Face scroll (mobile) ──
  const handleFaceScroll = useCallback((speed: number) => {
    if (ayatListRef.current) ayatListRef.current.scrollTop += speed;
  }, []);

  const { videoRef, isReady: isFaceReady, error: faceError, isFaceLost, isTooClose, headPosition, debugRefs } = useFaceScroll({
    enabled: isSmartMode && isFaceMode,
    onScroll: handleFaceScroll,
  });

  // ── Hand gesture (desktop) ──
  const handleHandScroll = useCallback((delta: number) => {
    if (ayatListRef.current) ayatListRef.current.scrollTop += delta;
  }, []);

  // Ref to always hold the latest playFullSurah — same pattern as searchWidgetRef for Victory
  const playFullSurahRef = useRef(playFullSurah);
  useEffect(() => { playFullSurahRef.current = playFullSurah; }, [playFullSurah]);

  const handleGesture = useCallback((gesture: string) => {
    switch (gesture) {
      case 'Victory':
        // Toggle search drawer — open with mic if closed, close if open
        if (searchWidgetRef.current?.isOpen) {
          searchWidgetRef.current.close();
        } else {
          searchWidgetRef.current?.openWithMic();
        }
        break;
      case 'Thumb_Up':
        // Toggle play full surah audio — call via ref (same pattern as Victory)
        playFullSurahRef.current();
        break;
    }
  }, []);

  const {
    videoRef: handVideoRef,
    canvasRef: handCanvasRef,
    isReady: isHandReady,
    error: handError,
    pointer: handPointer,
    gesture: currentGesture,
    isPinching,
    isGrabbing,
    isHandDetected,
    scrollVelocity,
  } = useHandGesture({
    enabled: isSmartMode && isHandMode,
    onScroll: handleHandScroll,
    onGesture: handleGesture,
    containerRef: tafsirModalOpen ? tafsirContentRef : ayatListRef,
  });

  // Combined video ref — use the active one
  const activeVideoRef = isHandMode ? handVideoRef : videoRef;
  const activeReady = isHandMode ? isHandReady : isFaceReady;
  const activeError = isHandMode ? handError : faceError;




  return (
    <div className={`flex ${isSmartMode ? '' : 'min-h-screen'}`}>
      {/* Sidebar (desktop only) — hidden in Smart Mode */}
      {!isSmartMode && <SurahSidebar surahs={allSurahs} currentNomor={nomor} loading={surahsLoading} />}

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        {/* Back button — hidden in Smart Mode */}
        {!isSmartMode && (
          <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border/30 px-4 py-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/qiraati')}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Kembali ke Beranda
            </Button>
          </div>
        )}

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
          <div className={isSmartMode ? '' : 'p-4 md:p-6 space-y-4'}>
            {/* ── Surah Header — hidden in Smart Mode ── */}
            {!isSmartMode && (
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
            )}

            {/* ── Controls Bar ── */}
            <div data-hand-controls="true" className={`rounded-xl border border-border/30 bg-card px-4 py-3 flex flex-wrap items-center justify-center gap-3 md:gap-4 text-sm ${isSmartMode ? 'sticky top-0 z-50 shadow-lg backdrop-blur-sm bg-card/95 mx-auto max-w-fit' : ''}`}>

              {/* Prev Surah */}
              {prevSurat && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex gap-1 text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    stopAllAudio();
                    navigate(`/qiraati/surat/${prevSurat.nomor}`);
                    if (ayatListRef.current) ayatListRef.current.scrollTop = 0;
                  }}
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="hidden lg:inline text-xs">{prevSurat.namaLatin}</span>
                </Button>
              )}

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

              {/* Next Surah */}
              {nextSurat && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex gap-1 text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    stopAllAudio();
                    navigate(`/qiraati/surat/${nextSurat.nomor}`);
                    if (ayatListRef.current) ayatListRef.current.scrollTop = 0;
                  }}
                >
                  <span className="hidden lg:inline text-xs">{nextSurat.namaLatin}</span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              )}
            </div>

            {/* ── Font & Scroll Controls — hidden in Smart Mode ── */}
            {!isSmartMode && (
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

                </div>
              </details>
            )}

            {isSmartMode && (
              <SmartReaderOverlay
                videoRef={videoRef}
                isReady={isFaceReady}
                isFaceLost={isFaceLost}
                isTooClose={isTooClose}
                headPosition={headPosition}
                error={faceError}
                debugRefs={debugRefs}
                onClose={() => setIsSmartMode(false)}
              />
            )}

            {/* ── Ayat List ── */}
            <div
              ref={ayatListRef}
              className={`space-y-3 overflow-y-auto scroll-smooth ${isSmartMode
                ? 'h-dvh'
                : 'max-h-[calc(100vh-16rem)] pb-20'
                }`}
              style={isSmartMode ? { paddingBottom: 'calc(5rem + env(safe-area-inset-bottom, 0px))' } : undefined}
            >
              {/* ── Immersive Header (Smart Mode only, inside scroll container for sticky) ── */}
              {isSmartMode && surahData && (
                <div className="sticky top-0 z-10 flex items-center justify-between bg-background/90 backdrop-blur-md border-b border-border/20 px-4 py-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full border-2 border-emerald-500 flex items-center justify-center">
                      <span className="text-[10px] font-bold text-emerald-500">{surahData.nomor}</span>
                    </div>
                    <span className="text-sm font-semibold text-foreground">{surahData.namaLatin}</span>
                    <span className="text-xs text-muted-foreground">• {surahData.jumlahAyat} Ayat</span>
                  </div>
                  <span className="font-arabic text-lg text-emerald-500">{surahData.nama}</span>
                </div>
              )}
              {surahData.ayat.map((ayat) => {
                const bookmarked = isBookmarked(surahData.nomor, ayat.nomorAyat);
                const isPlaying = playingAyat === ayat.nomorAyat;

                return (
                  <div
                    key={ayat.nomorAyat}
                    id={`ayat-${ayat.nomorAyat}`}
                    data-ayat-number={ayat.nomorAyat}
                    data-surah-number={surahData.nomor}
                    className={[
                      'transition-all duration-300 ease-in-out',
                      'rounded-xl border p-4 md:p-5',
                      isPlaying
                        ? 'border-emerald-500/40 bg-emerald-500/5 border-l-2 border-l-emerald-500 shadow-sm shadow-emerald-500/10'
                        : 'border-border/30 bg-card',
                    ].join(' ')}
                  >
                    {/* Action row */}
                    <div className="flex items-center gap-1.5 mb-4">
                      {/* Ayat number */}
                      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center mr-1 transition-all duration-300 ${isPlaying
                        ? 'border-emerald-500 bg-emerald-500/15 animate-pulse'
                        : 'border-emerald-500/60'
                        }`}>
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
                      className={`font-arabic leading-[2.2] mb-3 text-foreground ${isSmartMode ? 'text-center' : 'text-right'}`}
                      style={{ fontSize: fontSizes[fontSize], transition: 'font-size 0.3s ease, text-align 0.3s ease' }}
                    >
                      {ayat.teksArab}
                    </p>

                    {/* Transliteration */}
                    {showTransliteration && (
                      <p className={`text-muted-foreground italic text-sm mb-2 ${isSmartMode ? 'text-center' : ''}`}
                        style={{ transition: 'text-align 0.3s ease' }}>
                        {ayat.teksLatin}
                      </p>
                    )}

                    {/* Translation */}
                    {showTranslation && (
                      <p className={`text-foreground/80 text-sm ${isSmartMode ? 'text-center' : ''}`}
                        style={{ transition: 'text-align 0.3s ease' }}>
                        {ayat.teksIndonesia}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* ── Next/Prev Navigation ── */}
            {(
              <div className="flex items-center justify-between pt-4">
                {prevSurat ? (
                  <Button
                    variant="outline"
                    onClick={() => { stopAllAudio(); navigate(`/qiraati/surat/${prevSurat.nomor}`); if (ayatListRef.current) ayatListRef.current.scrollTop = 0; }}
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
                    onClick={() => { stopAllAudio(); navigate(`/qiraati/surat/${nextSurat.nomor}`); if (ayatListRef.current) ayatListRef.current.scrollTop = 0; }}
                    className="flex items-center gap-2"
                  >
                    <span className="hidden sm:inline">{nextSurat.namaLatin}</span>
                    <span className="sm:hidden">Selanjutnya</span>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                ) : <div />}
              </div>
            )}
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
        <DialogContent ref={tafsirContentRef} className="max-w-2xl max-h-[80vh] overflow-y-auto">
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
      <audio ref={audioRef} onEnded={() => { setIsPlayingFull(false); isPlayingFullRef.current = false; }} muted={isMuted} />

      {/* ── Smart Reader Overlay — floating widget ── */}
      {isSmartMode && (
        <SmartReaderOverlay
          mode={isHandMode ? 'hand' : 'face'}
          videoRef={activeVideoRef}
          canvasRef={isHandMode ? handCanvasRef : undefined}
          isReady={activeReady}
          isFaceLost={isFaceMode ? isFaceLost : false}
          isTooClose={isFaceMode ? isTooClose : false}
          headPosition={isFaceMode ? headPosition : 0}
          error={activeError}
          debugRefs={isFaceMode ? debugRefs : undefined}
          gesture={isHandMode ? currentGesture : undefined}
          isHandDetected={isHandMode ? isHandDetected : undefined}
          isPinching={isHandMode ? isPinching : undefined}
          isGrabbing={isHandMode ? isGrabbing : undefined}
          onClose={() => setIsSmartMode(false)}
        />
      )}

      {/* ── Hand Pointer (desktop smart mode) ── */}
      {isSmartMode && isHandMode && (
        <HandPointer
          pointer={handPointer}
          isPinching={isPinching}
          isGrabbing={isGrabbing}
          isActive={isHandDetected}
          scrollVelocity={scrollVelocity}
          onAyatPlay={(num) => playAyat(num)}
          onAyatBookmark={(num) => {
            if (surahData) toggleBookmark(surahData.nomor, surahData.namaLatin, num);
          }}
          onAyatTafsir={(num) => openTafsir(num)}
          onAyatCopy={(num) => {
            const ayat = surahData?.ayat.find(a => a.nomorAyat === num);
            if (ayat) {
              navigator.clipboard.writeText(ayat.teksArab);
              toast({ title: 'Tersalin', description: `Ayat ${num} disalin ke clipboard` });
            }
          }}
        />
      )}

      {/* ── Close Smart Mode — Fixed Bottom Center ── */}
      {isSmartMode && (
        <button
          onClick={() => setIsSmartMode(false)}
          className="
            fixed z-40 left-1/2 -translate-x-1/2
            flex items-center gap-2
            bg-red-600/90 hover:bg-red-500 active:bg-red-700
            text-white shadow-lg shadow-red-600/30
            rounded-full transition-all duration-200 active:scale-95
            px-5 py-2.5 backdrop-blur-sm
          "
          style={{ bottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}
          title="Matikan Smart Mode"
        >
          <X className="w-4 h-4" />
          <span className="text-sm font-medium">Matikan Smart Mode</span>
        </button>
      )}

      {/* ── Smart Mode FABs — Fixed Bottom-Right ── */}
      {!isSmartMode && (
        <div
          className="fixed z-40 right-4 flex flex-col gap-2"
          style={{ bottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}
        >
          {/* Hand Gesture FAB — desktop only */}
          {!isMobile && (
            <button
              onClick={() => {
                setOnboardingType('hand');
                if (localStorage.getItem('smartmode-onboarding-skip-hand') === 'true') {
                  setGestureType('hand');
                  setIsSmartMode(true);
                } else {
                  setSmartOnboardingOpen(true);
                }
              }}
              className="
                flex items-center gap-2
                bg-sky-600 hover:bg-sky-500 active:bg-sky-700
                text-white shadow-lg shadow-sky-600/30 hover:shadow-sky-500/40
                rounded-full transition-all duration-200 active:scale-95
                px-4 py-3 sm:px-5
              "
              title="Smart Mode — Hand Gesture (desktop)"
            >
              <Hand className="w-5 h-5" />
              <span className="text-sm font-medium hidden sm:inline">Hand</span>
            </button>
          )}

          {/* Face Gesture FAB — always visible */}
          <button
            onClick={() => {
              setOnboardingType('head');
              if (localStorage.getItem('smartmode-onboarding-skip-head') === 'true') {
                setGestureType('head');
                setIsSmartMode(true);
              } else {
                setSmartOnboardingOpen(true);
              }
            }}
            className="
              flex items-center gap-2
              bg-violet-600 hover:bg-violet-500 active:bg-violet-700
              text-white shadow-lg shadow-violet-600/30 hover:shadow-violet-500/40
              rounded-full transition-all duration-200 active:scale-95
              px-4 py-3 sm:px-5
            "
            title="Smart Mode — Face Gesture"
          >
            <ScanFace className="w-5 h-5" />
            <span className="text-sm font-medium hidden sm:inline">Smart</span>
          </button>
        </div>
      )}

      {/* ── Smart Mode Onboarding Drawer ── */}
      <SmartModeOnboarding
        open={smartOnboardingOpen}
        onOpenChange={setSmartOnboardingOpen}
        gestureType={onboardingType}
        onActivate={() => {
          setGestureType(onboardingType);
          setIsSmartMode(true);
        }}
      />

      {/* ── Search Widget (FAB + Drawer) ── */}
      {/* In hand mode: FAB hidden but widget controllable via gestures */}
      <SearchWidget
        ref={searchWidgetRef}
        hideFab={isSmartMode}
        allSurahs={allSurahs}
        surahData={surahData}
        onPlayFullSurah={playFullSurah}
        onStopAudio={stopAllAudio}
        onPlayAyat={playAyat}
        onToggleBookmark={toggleBookmark}
        isBookmarked={isBookmarked}
        isPlayingFull={isPlayingFull}
      />
    </div>
  );
};

export default SurahDetail;