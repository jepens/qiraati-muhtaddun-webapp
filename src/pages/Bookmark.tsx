import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    BookmarkCheck, Bookmark as BookmarkIcon, BookOpen, Clock,
    Trash2, ArrowRight, LayoutGrid, CalendarDays, ChevronDown, ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBookmarks, AyatBookmark } from '@/hooks/useBookmarks';
import { useLastRead } from '@/hooks/useLastRead';
import { useAuth } from '@/hooks/use-auth';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

type ViewMode = 'surat' | 'tanggal';

const Bookmark: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { bookmarks, loading: bookmarksLoading, removeBookmark } = useBookmarks();
    const { lastRead, loading: lastReadLoading } = useLastRead();
    const [viewMode, setViewMode] = useState<ViewMode>('surat');
    const [expandedSurahs, setExpandedSurahs] = useState<Set<number>>(new Set());

    // Group bookmarks by surat
    const groupedBySurat = useMemo(() => {
        const map = new Map<number, { nama: string; bookmarks: AyatBookmark[] }>();
        bookmarks.forEach((b) => {
            const existing = map.get(b.surat_nomor);
            if (existing) {
                existing.bookmarks.push(b);
            } else {
                map.set(b.surat_nomor, { nama: b.surat_nama, bookmarks: [b] });
            }
        });
        // Sort bookmarks within each group by ayat number
        map.forEach((group) => {
            group.bookmarks.sort((a, b) => a.ayat_nomor - b.ayat_nomor);
        });
        return map;
    }, [bookmarks]);

    // Group bookmarks by date
    const groupedByDate = useMemo(() => {
        const map = new Map<string, AyatBookmark[]>();
        const sorted = [...bookmarks].sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        sorted.forEach((b) => {
            const date = new Date(b.created_at).toLocaleDateString('id-ID', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });
            const existing = map.get(date) || [];
            existing.push(b);
            map.set(date, existing);
        });
        return map;
    }, [bookmarks]);

    // Stats
    const totalBookmarks = bookmarks.length;
    const totalSurahs = groupedBySurat.size;

    const toggleSurah = (nomor: number) => {
        setExpandedSurahs((prev) => {
            const next = new Set(prev);
            if (next.has(nomor)) next.delete(nomor);
            else next.add(nomor);
            return next;
        });
    };

    const navigateToAyat = (suratNomor: number, ayatNomor: number) => {
        navigate(`/qiraati/surat/${suratNomor}#ayat-${ayatNomor}`, {
            state: { autoPlayAyat: ayatNomor },
        });
    };

    const formatTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatRelativeTime = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const minutes = Math.floor(diff / 60000);
        if (minutes < 1) return 'Baru saja';
        if (minutes < 60) return `${minutes} menit lalu`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours} jam lalu`;
        const days = Math.floor(hours / 24);
        if (days < 7) return `${days} hari lalu`;
        return new Date(dateStr).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    // Not logged in
    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center px-4">
                <div className="text-center max-w-md">
                    <BookmarkIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
                    <h2 className="text-xl font-bold text-foreground mb-2">Login Diperlukan</h2>
                    <p className="text-muted-foreground mb-6">
                        Silakan login untuk melihat dan mengelola bookmark Anda.
                    </p>
                    <Button onClick={() => navigate('/login')} className="bg-emerald-600 hover:bg-emerald-700">
                        Login Sekarang
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            {/* Header */}
            <div className="relative py-10 md:py-14 text-center px-4">
                <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                    Bookmark Saya
                </h1>
                <p className="text-muted-foreground max-w-lg mx-auto">
                    Kumpulan ayat yang telah Anda simpan untuk dibaca kembali
                </p>

                {/* Stats */}
                {totalBookmarks > 0 && (
                    <div className="flex items-center justify-center gap-6 mt-4 text-sm">
                        <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-amber-500" />
                            <span className="text-muted-foreground">{totalBookmarks} Bookmark</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span className="text-muted-foreground">{totalSurahs} Surat</span>
                        </span>
                    </div>
                )}
            </div>

            <div className="container mx-auto px-4 pb-12 space-y-6">
                {/* Last Read Card */}
                {!lastReadLoading && lastRead && (
                    <div className="relative overflow-hidden rounded-2xl border border-border/30 bg-gradient-to-br from-sky-950/40 via-card to-card p-5 md:p-6">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-sky-500/5 rounded-full blur-3xl" />
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2 text-sm text-sky-400">
                                    <Clock className="w-4 h-4" />
                                    <span>Terakhir Dibaca</span>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                    {formatRelativeTime(lastRead.updated_at)}
                                </span>
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold text-foreground">
                                        {lastRead.surat_nama}
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        Ayat {lastRead.ayat_nomor}
                                    </p>
                                </div>
                                <Button
                                    onClick={() => navigateToAyat(lastRead.surat_nomor, lastRead.ayat_nomor)}
                                    className="bg-sky-600 hover:bg-sky-700 text-white"
                                    size="sm"
                                >
                                    Lanjutkan Membaca
                                    <ArrowRight className="w-4 h-4 ml-1.5" />
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* View Mode Toggle + Content */}
                {bookmarksLoading ? (
                    <div className="space-y-3">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="rounded-xl border border-border/30 bg-card p-4 animate-pulse">
                                <div className="h-5 bg-muted rounded w-1/3 mb-2" />
                                <div className="h-4 bg-muted rounded w-1/2" />
                            </div>
                        ))}
                    </div>
                ) : totalBookmarks === 0 ? (
                    /* Empty State */
                    <div className="text-center py-20">
                        <BookmarkIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground/20" />
                        <h3 className="text-lg font-semibold text-foreground mb-2">Belum Ada Bookmark</h3>
                        <p className="text-muted-foreground max-w-sm mx-auto mb-6">
                            Simpan ayat favorit Anda dengan menekan ikon bookmark saat membaca Al-Quran.
                        </p>
                        <Button
                            onClick={() => navigate('/qiraati')}
                            className="bg-emerald-600 hover:bg-emerald-700"
                        >
                            <BookOpen className="w-4 h-4 mr-2" />
                            Jelajahi Al-Quran
                        </Button>
                    </div>
                ) : (
                    <>
                        {/* Filter Toggle */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setViewMode('surat')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${viewMode === 'surat'
                                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/25'
                                        : 'bg-card border border-border/50 text-muted-foreground hover:bg-accent hover:text-foreground'
                                    }`}
                            >
                                <LayoutGrid className="w-3.5 h-3.5" />
                                By Surat
                            </button>
                            <button
                                onClick={() => setViewMode('tanggal')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${viewMode === 'tanggal'
                                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/25'
                                        : 'bg-card border border-border/50 text-muted-foreground hover:bg-accent hover:text-foreground'
                                    }`}
                            >
                                <CalendarDays className="w-3.5 h-3.5" />
                                By Tanggal
                            </button>
                        </div>

                        {/* Grouped by Surat */}
                        {viewMode === 'surat' && (
                            <div className="space-y-3">
                                {Array.from(groupedBySurat.entries())
                                    .sort(([a], [b]) => a - b)
                                    .map(([nomor, group]) => {
                                        const isExpanded = expandedSurahs.has(nomor);
                                        return (
                                            <div
                                                key={nomor}
                                                className="rounded-xl border border-border/30 bg-card overflow-hidden"
                                            >
                                                {/* Surat Header */}
                                                <button
                                                    onClick={() => toggleSurah(nomor)}
                                                    className="w-full flex items-center justify-between p-4 hover:bg-accent/50 transition-colors"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-full border-2 border-emerald-500/50 flex items-center justify-center">
                                                            <span className="text-xs font-semibold text-emerald-500">
                                                                {nomor}
                                                            </span>
                                                        </div>
                                                        <div className="text-left">
                                                            <h3 className="font-semibold text-foreground text-sm">
                                                                {group.nama}
                                                            </h3>
                                                            <p className="text-xs text-muted-foreground">
                                                                {group.bookmarks.length} ayat di-bookmark
                                                            </p>
                                                        </div>
                                                    </div>
                                                    {isExpanded ? (
                                                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                                    ) : (
                                                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                                    )}
                                                </button>

                                                {/* Ayat List */}
                                                {isExpanded && (
                                                    <div className="border-t border-border/30">
                                                        {group.bookmarks.map((bookmark) => (
                                                            <BookmarkItem
                                                                key={bookmark.id}
                                                                bookmark={bookmark}
                                                                onNavigate={() =>
                                                                    navigateToAyat(bookmark.surat_nomor, bookmark.ayat_nomor)
                                                                }
                                                                onRemove={() =>
                                                                    removeBookmark(bookmark.surat_nomor, bookmark.ayat_nomor)
                                                                }
                                                                showSuratName={false}
                                                                formatTime={formatTime}
                                                            />
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                            </div>
                        )}

                        {/* Grouped by Date */}
                        {viewMode === 'tanggal' && (
                            <div className="space-y-6">
                                {Array.from(groupedByDate.entries()).map(([date, items]) => (
                                    <div key={date}>
                                        <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                                            <CalendarDays className="w-3.5 h-3.5" />
                                            {date}
                                        </h3>
                                        <div className="space-y-2">
                                            {items.map((bookmark) => (
                                                <BookmarkItem
                                                    key={bookmark.id}
                                                    bookmark={bookmark}
                                                    onNavigate={() =>
                                                        navigateToAyat(bookmark.surat_nomor, bookmark.ayat_nomor)
                                                    }
                                                    onRemove={() =>
                                                        removeBookmark(bookmark.surat_nomor, bookmark.ayat_nomor)
                                                    }
                                                    showSuratName={true}
                                                    formatTime={formatTime}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

/* ── Bookmark Item Component ── */
interface BookmarkItemProps {
    bookmark: AyatBookmark;
    onNavigate: () => void;
    onRemove: () => void;
    showSuratName: boolean;
    formatTime: (dateStr: string) => string;
}

const BookmarkItem: React.FC<BookmarkItemProps> = ({
    bookmark,
    onNavigate,
    onRemove,
    showSuratName,
    formatTime,
}) => {
    return (
        <div className="flex items-center gap-3 p-3 hover:bg-accent/30 transition-colors group rounded-xl border border-border/30 bg-card">
            {/* Bookmark icon */}
            <div className="flex-shrink-0">
                <BookmarkCheck className="w-4 h-4 text-amber-500" />
            </div>

            {/* Content — Clickable */}
            <button
                onClick={onNavigate}
                className="flex-1 text-left min-w-0"
            >
                <div className="flex items-baseline gap-2">
                    {showSuratName && (
                        <span className="text-xs font-medium text-emerald-500">
                            {bookmark.surat_nama}
                        </span>
                    )}
                    <span className="text-xs text-muted-foreground">
                        Ayat {bookmark.ayat_nomor}
                    </span>
                </div>

                {bookmark.teks_arab && (
                    <p className="font-arabic text-right text-base leading-[2] text-foreground mt-1 truncate">
                        {bookmark.teks_arab}
                    </p>
                )}

                <p className="text-[11px] text-muted-foreground mt-0.5">
                    {formatTime(bookmark.created_at)}
                </p>
            </button>

            {/* Delete button */}
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Bookmark?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bookmark {bookmark.surat_nama} Ayat {bookmark.ayat_nomor} akan dihapus.
                            Anda bisa menambahkannya kembali kapan saja.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={onRemove} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Hapus
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default Bookmark;
