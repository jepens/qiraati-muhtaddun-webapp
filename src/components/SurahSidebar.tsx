import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, BookOpen } from 'lucide-react';
import { Input } from '@/components/ui/input';
import type { Surat } from '@/types/quran';

interface SurahSidebarProps {
    surahs: Surat[];
    currentNomor?: number;
    loading?: boolean;
}

const SurahSidebar: React.FC<SurahSidebarProps> = ({ surahs, currentNomor, loading }) => {
    const [search, setSearch] = useState('');
    const navigate = useNavigate();

    const filtered = useMemo(() => {
        if (!search.trim()) return surahs;
        const q = search.toLowerCase();
        return surahs.filter(
            (s) =>
                s.namaLatin.toLowerCase().includes(q) ||
                s.nama.includes(q) ||
                s.arti.toLowerCase().includes(q) ||
                String(s.nomor).includes(q)
        );
    }, [surahs, search]);

    return (
        <aside className="hidden lg:flex flex-col w-64 xl:w-72 border-r border-border/30 bg-card/50 h-[calc(100vh-4rem)] sticky top-16">
            {/* Header */}
            <div className="p-4 border-b border-border/30">
                <h2 className="font-bold text-foreground mb-3">Daftar Surat</h2>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-3.5 h-3.5" />
                    <Input
                        placeholder="Cari surat..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 h-9 text-sm bg-background/50"
                    />
                </div>
            </div>

            {/* Surah list */}
            <div className="flex-1 overflow-y-auto">
                {loading ? (
                    <div className="p-4 text-sm text-muted-foreground">Memuat...</div>
                ) : (
                    filtered.map((surah) => {
                        const isActive = surah.nomor === currentNomor;
                        return (
                            <button
                                key={surah.nomor}
                                onClick={() => navigate(`/qiraati/surat/${surah.nomor}`)}
                                className={`
                  w-full text-left px-4 py-3 border-b border-border/10
                  transition-colors duration-150
                  ${isActive
                                        ? 'bg-emerald-500/10 border-l-2 border-l-emerald-500'
                                        : 'hover:bg-accent/50 border-l-2 border-l-transparent'
                                    }
                `}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <span className={`
                      w-7 h-7 flex items-center justify-center rounded-full text-xs font-semibold flex-shrink-0
                      ${isActive
                                                ? 'bg-emerald-500 text-white'
                                                : 'bg-muted text-muted-foreground'
                                            }
                    `}>
                                            {surah.nomor}
                                        </span>
                                        <div className="min-w-0">
                                            <p className={`text-sm font-medium truncate ${isActive ? 'text-emerald-400' : 'text-foreground'}`}>
                                                {surah.namaLatin}
                                            </p>
                                            <p className="text-xs text-muted-foreground truncate">{surah.arti}</p>
                                        </div>
                                    </div>
                                    <span className={`font-arabic text-base flex-shrink-0 ml-2 ${isActive ? 'text-emerald-400' : 'text-muted-foreground'}`}>
                                        {surah.nama}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground ml-9">
                                    <span className="flex items-center gap-0.5">
                                        <MapPin className="w-2.5 h-2.5" />
                                        {surah.tempatTurun}
                                    </span>
                                    <span className="flex items-center gap-0.5">
                                        <BookOpen className="w-2.5 h-2.5" />
                                        {surah.jumlahAyat}
                                    </span>
                                </div>
                            </button>
                        );
                    })
                )}
            </div>
        </aside>
    );
};

export default SurahSidebar;
