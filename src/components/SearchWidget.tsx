import React, { useState, useEffect, useCallback, useRef, forwardRef, useImperativeHandle } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search, Mic, X, Loader2,
    Play, Square, Bookmark, ChevronRight, BookOpen, Sparkles
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerDescription,
} from '@/components/ui/drawer';
import { useFuseSearch } from '@/hooks/useFuseSearch';
import { useVectorSearch, VectorSearchResult } from '@/hooks/useVectorSearch';
import { useVoice } from '@/hooks/useVoice';
import { useToast } from '@/hooks/use-toast';
import { parseVoiceCommand, removePrefixes } from '@/utils/voiceCommandUtils';
import type { Surat, Ayat, SuratDetail } from '@/types/quran';

// ─── Types ───

interface SearchWidgetProps {
    /** All surahs for Fuse search */
    allSurahs: Surat[];
    /** Current surah data (for quick actions) */
    surahData?: SuratDetail | null;
    /** Callbacks for quick actions */
    onPlayFullSurah?: () => void;
    onStopAudio?: () => void;
    onPlayAyat?: (num: number) => void;
    onToggleBookmark?: (nomor: number, nama: string, ayat: number) => void;
    isBookmarked?: (nomor: number, ayat: number) => boolean;
    isPlayingFull?: boolean;
    /** Hide the FAB button (e.g. in smart mode) */
    hideFab?: boolean;
}

// ─── Imperative Handle ───

export interface SearchWidgetHandle {
    open: () => void;
    close: () => void;
    toggle: () => void;
    openWithMic: () => void;
    isOpen: boolean;
}

// ─── Search Mode Tabs ───

type SearchMode = 'surah' | 'ayat';

// ─── Component ───

const SearchWidget = forwardRef<SearchWidgetHandle, SearchWidgetProps>(({
    allSurahs,
    surahData,
    onPlayFullSurah,
    onStopAudio,
    onPlayAyat,
    onToggleBookmark,
    isBookmarked,
    isPlayingFull = false,
    hideFab = false,
}, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchMode, setSearchMode] = useState<SearchMode>('surah');
    const [ayatResults, setAyatResults] = useState<VectorSearchResult[]>([]);
    const [isVectorLoading, setIsVectorLoading] = useState(false);
    const [isVoiceActive, setIsVoiceActive] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // ── Imperative Handle (for hand gesture control) ──
    useImperativeHandle(ref, () => ({
        open: () => setIsOpen(true),
        close: () => setIsOpen(false),
        toggle: () => setIsOpen(prev => !prev),
        openWithMic: () => {
            setIsOpen(true);
            // Activate voice after drawer animation completes
            setTimeout(() => setIsVoiceActive(true), 300);
        },
        isOpen,
    }), [isOpen]);
    const autoSearchRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const navigate = useNavigate();
    const { toast } = useToast();

    // ── Search Hooks ──
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
    const { search: vectorSearch } = useVectorSearch();

    // ── Voice (optional mic in search widget) ──
    const {
        isListening,
        interimTranscript,
        fullTranscript,
        resetTranscript,
    } = useVoice({
        mode: 'search',
        continuous: true,
        lang: 'id-ID',
        enabled: isVoiceActive && isOpen,
    });

    // ── Keyboard Shortcut: Ctrl+K / ⌘K ──
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(prev => !prev);
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    // ── Focus input when drawer opens ──
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 200);
        } else {
            // Reset on close
            setSearchQuery('');
            setAyatResults([]);
            setIsVoiceActive(false);
            resetTranscript();
        }
    }, [isOpen, resetTranscript]);

    // ── Apply voice transcript to search ──
    useEffect(() => {
        if (!isVoiceActive || !isOpen) return;
        const text = (fullTranscript + ' ' + interimTranscript).trim();
        if (text) setSearchQuery(text);
    }, [fullTranscript, interimTranscript, isVoiceActive, isOpen]);

    // ── Voice auto-execute: auto-navigate after transcript stabilizes (2s debounce) ──
    const voiceAutoRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const executeVoiceSearch = useCallback((text: string) => {
        if (!text.trim()) return;

        const result = parseVoiceCommand(text, fuseSearch);

        switch (result.type) {
            case 'multi_surah_rejected':
                toast({
                    variant: 'destructive',
                    title: 'Satu Surat Saja',
                    description: 'Silakan sebutkan satu nama surat saja. Contoh: "Surat Yasin" atau "Al-Mulk".',
                });
                resetTranscript();
                break;

            case 'surah_navigate':
                setIsOpen(false);
                navigate(`/qiraati/surat/${result.surahNomor}`);
                toast({ title: 'Membuka Surat', description: result.surahNamaLatin });
                break;

            case 'surah_ayat_navigate':
                setIsOpen(false);
                navigate(`/qiraati/surat/${result.surahNomor}#ayat-${result.ayatNumber}`, {
                    state: { autoPlayAyat: result.ayatNumber },
                });
                toast({ title: 'Membuka Surat', description: `${result.surahNamaLatin} Ayat ${result.ayatNumber}` });
                break;

            case 'content_search':
                // Switch to ayat tab and trigger vector search
                setSearchMode('ayat');
                setSearchQuery(result.searchQuery);
                resetTranscript();
                break;

            case 'not_found':
                toast({
                    variant: 'destructive',
                    title: 'Tidak Ditemukan',
                    description: `Surat "${result.originalText}" tidak ditemukan. Coba nama lain atau gunakan tab Ayat AI.`,
                });
                resetTranscript();
                break;
        }
    }, [fuseSearch, navigate, toast, resetTranscript]);

    useEffect(() => {
        if (voiceAutoRef.current) {
            clearTimeout(voiceAutoRef.current);
            voiceAutoRef.current = null;
        }

        // Only auto-execute when voice is active, drawer is open, and in surah mode
        if (!isVoiceActive || !isOpen || searchMode !== 'surah') return;
        // Wait until interim settles (no partial results)
        if (!fullTranscript || interimTranscript) return;

        voiceAutoRef.current = setTimeout(() => {
            voiceAutoRef.current = null;
            if (fullTranscript.trim().length > 0) {
                executeVoiceSearch(fullTranscript);
            }
        }, 2000);

        return () => {
            if (voiceAutoRef.current) {
                clearTimeout(voiceAutoRef.current);
                voiceAutoRef.current = null;
            }
        };
    }, [fullTranscript, interimTranscript, isVoiceActive, isOpen, searchMode, executeVoiceSearch]);

    // ── Surah Search (Fuse.js) ──
    const surahResults = React.useMemo(() => {
        if (!searchQuery.trim() || searchMode !== 'surah') return [];
        const clean = removePrefixes(searchQuery);
        if (!clean) return [];
        return fuseSearch(clean).slice(0, 8);
    }, [searchQuery, searchMode, fuseSearch]);

    // ── Ayat Search (Vector API) — debounced ──
    const executeAyatSearch = useCallback(async (query: string) => {
        const clean = query.replace(/(?:cari\s+)?(?:ayat\s+)?(?:tentang\s+)?/, '').trim();
        if (!clean || clean.length < 2) return;
        setIsVectorLoading(true);
        try {
            const results = await vectorSearch(clean, { tipe: ['ayat'], batas: 8, skorMin: 0.3 });
            setAyatResults(results);
            if (results.length === 0) {
                toast({ variant: 'destructive', title: 'Tidak Ditemukan', description: `Tidak ditemukan ayat tentang "${clean}".` });
            }
        } catch { /* handled by hook */ }
        setIsVectorLoading(false);
    }, [vectorSearch, toast]);

    useEffect(() => {
        if (searchMode !== 'ayat' || !searchQuery.trim()) {
            setAyatResults([]);
            return;
        }
        if (autoSearchRef.current) clearTimeout(autoSearchRef.current);
        autoSearchRef.current = setTimeout(() => {
            executeAyatSearch(searchQuery);
        }, 800);
        return () => {
            if (autoSearchRef.current) clearTimeout(autoSearchRef.current);
        };
    }, [searchQuery, searchMode, executeAyatSearch]);

    // ── Handlers ──
    const handleSurahSelect = (surah: Surat) => {
        setIsOpen(false);
        navigate(`/qiraati/surat/${surah.nomor}`);
    };

    const handleAyatSelect = (result: VectorSearchResult) => {
        setIsOpen(false);
        if (result.data.id_surat) {
            navigate(`/qiraati/surat/${result.data.id_surat}${result.data.nomor_ayat ? `#ayat-${result.data.nomor_ayat}` : ''}`, {
                state: result.data.nomor_ayat ? { autoPlayAyat: result.data.nomor_ayat } : undefined
            });
        }
    };

    const handleQuickAction = (action: () => void) => {
        action();
    };

    return (
        <>
            {/* ── FAB Trigger — Fixed Bottom-Left ── */}
            {!hideFab && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="
          fixed z-40 left-4 flex items-center gap-2
          bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700
          text-white shadow-lg shadow-emerald-600/30 hover:shadow-emerald-500/40
          rounded-full transition-all duration-200 active:scale-95
          px-4 py-3 sm:px-5
        "
                    style={{ bottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}
                    title="Cari surat atau ayat (Ctrl+K)"
                >
                    <Search className="w-5 h-5" />
                    <span className="text-sm font-medium hidden sm:inline">Cari</span>
                    <kbd className="hidden md:inline-flex items-center gap-0.5 text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-mono">
                        ⌘K
                    </kbd>
                </button>
            )}

            {/* ── Drawer ── */}
            <Drawer open={isOpen} onOpenChange={setIsOpen}>
                <DrawerContent className="max-h-[85vh]">
                    <DrawerHeader className="pb-2">
                        <DrawerTitle className="text-base">Cari Surat & Ayat</DrawerTitle>
                        <DrawerDescription className="text-xs">
                            Cari nama surat, nomor, arti, atau konten ayat dengan AI
                        </DrawerDescription>
                    </DrawerHeader>

                    <div className="px-4 pb-4 space-y-3">
                        {/* ── Search Input ── */}
                        <div className="relative flex items-center gap-2">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    ref={inputRef}
                                    type="text"
                                    placeholder={searchMode === 'surah' ? 'Cari nama surat, nomor, atau arti...' : 'Cari ayat tentang... (AI)'}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 h-11 text-sm rounded-xl bg-card border-border/50 focus:ring-2 focus:ring-emerald-500/30"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => { setSearchQuery(''); setAyatResults([]); inputRef.current?.focus(); }}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                            <button
                                onClick={() => setIsVoiceActive(!isVoiceActive)}
                                className={`
                  h-11 w-11 rounded-xl flex items-center justify-center transition-all border
                  ${isVoiceActive
                                        ? 'bg-red-500/10 border-red-500/40 text-red-500'
                                        : 'bg-card border-border/50 text-muted-foreground hover:text-foreground'
                                    }
                `}
                                title={isVoiceActive ? 'Matikan mic' : 'Aktifkan mic'}
                            >
                                <Mic className={`w-4 h-4 ${isListening && isVoiceActive ? 'animate-pulse' : ''}`} />
                            </button>
                        </div>

                        {/* ── Search Mode Toggle ── */}
                        <div className="flex gap-1 bg-muted rounded-lg p-1">
                            <button
                                onClick={() => { setSearchMode('surah'); setAyatResults([]); }}
                                className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${searchMode === 'surah' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                <BookOpen className="w-3.5 h-3.5" /> Surah
                            </button>
                            <button
                                onClick={() => { setSearchMode('ayat'); }}
                                className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${searchMode === 'ayat' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                <Sparkles className="w-3.5 h-3.5" /> Ayat (AI)
                            </button>
                        </div>

                        {/* ── Results ── */}
                        <div className="max-h-[40vh] overflow-y-auto space-y-1.5 overscroll-contain">

                            {/* Surah Results */}
                            {searchMode === 'surah' && surahResults.length > 0 && (
                                surahResults.map((surah) => (
                                    <button
                                        key={surah.nomor}
                                        onClick={() => handleSurahSelect(surah)}
                                        className="w-full text-left p-3 rounded-xl border border-border/30 bg-card hover:border-emerald-500/40 hover:bg-card/80 transition-all flex items-center gap-3"
                                    >
                                        <div className="w-8 h-8 rounded-full border-2 border-emerald-500/50 flex items-center justify-center flex-shrink-0">
                                            <span className="text-xs font-semibold text-emerald-500">{surah.nomor}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-foreground truncate">{surah.namaLatin}</p>
                                            <p className="text-[11px] text-muted-foreground truncate">{surah.arti} • {surah.jumlahAyat} ayat</p>
                                        </div>
                                        <span className="font-arabic text-lg text-emerald-500/70 flex-shrink-0">{surah.nama}</span>
                                        <ChevronRight className="w-4 h-4 text-muted-foreground/50 flex-shrink-0" />
                                    </button>
                                ))
                            )}

                            {/* Surah: Empty State */}
                            {searchMode === 'surah' && searchQuery.trim() && surahResults.length === 0 && (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                    <p className="text-sm">Tidak ditemukan surat "{removePrefixes(searchQuery)}"</p>
                                    <p className="text-xs mt-1 opacity-70">Coba tab "Ayat (AI)" untuk pencarian semantik</p>
                                </div>
                            )}

                            {/* Ayat: Loading */}
                            {searchMode === 'ayat' && isVectorLoading && (
                                <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
                                    <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
                                    <span className="text-sm">Mencari dengan AI...</span>
                                </div>
                            )}

                            {/* Ayat Results */}
                            {searchMode === 'ayat' && !isVectorLoading && ayatResults.length > 0 && (
                                <>
                                    <p className="text-xs text-muted-foreground text-center font-medium py-1">
                                        🔍 {ayatResults.length} ayat ditemukan
                                    </p>
                                    {ayatResults.slice(0, 6).map((r, i) => (
                                        <button
                                            key={`${r.data.id_surat}-${r.data.nomor_ayat}-${i}`}
                                            onClick={() => handleAyatSelect(r)}
                                            className="w-full text-left p-3 rounded-xl border border-border/30 bg-card hover:border-emerald-500/40 hover:bg-card/80 transition-all"
                                        >
                                            <div className="flex items-center justify-between mb-1">
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
                                            <p className="text-[11px] text-muted-foreground line-clamp-2">
                                                {r.data.terjemahan_id || r.data.isi || r.data.deskripsi || r.data.arti_surat}
                                            </p>
                                        </button>
                                    ))}
                                </>
                            )}

                            {/* Ayat: Empty State (after search) */}
                            {searchMode === 'ayat' && !isVectorLoading && searchQuery.trim() && ayatResults.length === 0 && !autoSearchRef.current && (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                    <p className="text-sm">Ketik topik dan tunggu sebentar...</p>
                                    <p className="text-xs mt-1 opacity-70">Contoh: "sabar", "rezeki", "tentang surga"</p>
                                </div>
                            )}

                            {/* No Query: Show Quick Actions */}
                            {!searchQuery.trim() && surahData && (
                                <div className="space-y-1">
                                    <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider px-1 pt-1">
                                        Aksi Cepat — {surahData.namaLatin}
                                    </p>

                                    {/* Play / Stop */}
                                    {onPlayFullSurah && (
                                        <button
                                            onClick={() => handleQuickAction(isPlayingFull ? (onStopAudio || (() => { })) : onPlayFullSurah)}
                                            className="w-full flex items-center gap-3 p-3 rounded-xl border border-border/30 bg-card hover:border-emerald-500/40 transition-all text-left"
                                        >
                                            {isPlayingFull ? (
                                                <Square className="w-4 h-4 text-red-500" />
                                            ) : (
                                                <Play className="w-4 h-4 text-emerald-500" />
                                            )}
                                            <span className="text-sm">{isPlayingFull ? 'Hentikan Audio' : 'Putar Seluruh Surah'}</span>
                                        </button>
                                    )}

                                    {/* Bookmark current surah */}
                                    {onToggleBookmark && (
                                        <button
                                            onClick={() => handleQuickAction(() => onToggleBookmark(surahData.nomor, surahData.namaLatin, 1))}
                                            className="w-full flex items-center gap-3 p-3 rounded-xl border border-border/30 bg-card hover:border-emerald-500/40 transition-all text-left"
                                        >
                                            <Bookmark className={`w-4 h-4 ${isBookmarked?.(surahData.nomor, 1) ? 'text-amber-500 fill-amber-500' : 'text-muted-foreground'}`} />
                                            <span className="text-sm">{isBookmarked?.(surahData.nomor, 1) ? 'Hapus Bookmark' : 'Bookmark Surah Ini'}</span>
                                        </button>
                                    )}

                                    {/* Play specific ayat */}
                                    {onPlayAyat && surahData.ayat && surahData.ayat.length > 0 && (
                                        <div className="space-y-0.5">
                                            <p className="text-[10px] text-muted-foreground px-1 mt-2">Putar Ayat:</p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {surahData.ayat.slice(0, 10).map((ayat: Ayat) => (
                                                    <button
                                                        key={ayat.nomorAyat}
                                                        onClick={() => {
                                                            onPlayAyat(ayat.nomorAyat);
                                                            document.getElementById(`ayat-${ayat.nomorAyat}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                        }}
                                                        className="w-9 h-9 rounded-lg border border-border/30 bg-card hover:border-emerald-500/40 hover:bg-emerald-500/10 transition-all flex items-center justify-center text-xs font-medium text-muted-foreground hover:text-emerald-500"
                                                    >
                                                        {ayat.nomorAyat}
                                                    </button>
                                                ))}
                                                {surahData.ayat.length > 10 && (
                                                    <span className="w-9 h-9 flex items-center justify-center text-xs text-muted-foreground/50">
                                                        +{surahData.ayat.length - 10}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Initial empty state (no surah data, no query) */}
                            {!searchQuery.trim() && !surahData && (
                                <div className="text-center py-6 text-muted-foreground">
                                    <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                    <p className="text-sm">Ketik nama surat atau gunakan tab AI</p>
                                    <div className="flex flex-wrap gap-1.5 justify-center mt-3">
                                        {['Al-Fatihah', 'Yasin', 'Al-Mulk', 'Ar-Rahman'].map(name => (
                                            <button
                                                key={name}
                                                onClick={() => setSearchQuery(name)}
                                                className="px-2.5 py-1 rounded-full bg-muted text-xs text-muted-foreground hover:text-foreground transition-colors"
                                            >
                                                {name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </DrawerContent>
            </Drawer>
        </>
    );
});

SearchWidget.displayName = 'SearchWidget';

export default SearchWidget;
