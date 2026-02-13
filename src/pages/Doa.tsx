import React, { useState, useEffect, useMemo } from 'react';
import { Search, Share2, BookOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import Fuse from 'fuse.js';
import { API_BASE_URL } from '@/lib/config';

interface DoaItem {
    id: string;
    nama: string;
    tentang?: string;
    tag?: string[];
    grup?: string;
}

const Doa: React.FC = () => {
    const [doas, setDoas] = useState<DoaItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>("all");
    const [selectedTag, setSelectedTag] = useState<string>("all");
    const { toast } = useToast();

    useEffect(() => {
        document.title = "Kumpulan Doa Harian - Masjid Al-Muhtaddun";
    }, []);

    useEffect(() => {
        const fetchDoas = async () => {
            try {
                setLoading(true);
                const response = await fetch(`${API_BASE_URL}/doa`);

                if (!response.ok) {
                    throw new Error('Failed to fetch doa list');
                }

                const result = await response.json();
                let data: DoaItem[] = [];
                if (Array.isArray(result)) {
                    data = result;
                } else if (result.data && Array.isArray(result.data)) {
                    data = result.data;
                } else {
                    console.error("Unknown API format:", result);
                    data = [];
                }

                setDoas(data);
            } catch (error) {
                console.error('Error fetching doas:', error);
                toast({
                    title: "Error",
                    description: "Gagal memuat daftar doa.",
                    variant: "destructive",
                });
            } finally {
                setLoading(false);
            }
        };

        fetchDoas();
    }, [toast]);

    const uniqueTags = useMemo(() => {
        const tags = new Set<string>();
        doas.forEach(doa => {
            if (doa.tag && Array.isArray(doa.tag)) {
                doa.tag.forEach(t => tags.add(t));
            }
        });
        return Array.from(tags).sort();
    }, [doas]);

    const uniqueCategories = useMemo(() => {
        const categories = new Set<string>();
        doas.forEach(doa => {
            if (doa.grup) {
                categories.add(doa.grup);
            }
        });
        return Array.from(categories).sort();
    }, [doas]);

    const filteredDoas = useMemo(() => {
        let activeDoas = doas;

        if (selectedCategory && selectedCategory !== "all") {
            activeDoas = activeDoas.filter(doa => doa.grup === selectedCategory);
        }

        if (selectedTag && selectedTag !== "all") {
            activeDoas = activeDoas.filter(doa => doa.tag?.includes(selectedTag));
        }

        if (!searchTerm) return activeDoas;

        const fuse = new Fuse(activeDoas, {
            keys: ['nama', 'tag', 'grup'],
            threshold: 0.3,
        });

        return fuse.search(searchTerm).map(result => result.item);
    }, [doas, searchTerm, selectedTag, selectedCategory]);

    const handleShare = (doa: DoaItem) => {
        if (navigator.share) {
            navigator.share({
                title: doa.nama,
                text: `Baca ${doa.nama} di Aplikasi Masjid Al-Muhtaddun`,
                url: `${window.location.origin}/doa/${doa.id}`,
            }).catch(console.error);
        } else {
            // Fallback or just copy link
            navigator.clipboard.writeText(`${window.location.origin}/doa/${doa.id}`);
            toast({
                title: "Tautan Disalin",
                description: "Tautan doa telah disalin ke clipboard.",
            });
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="text-center mb-12">
                <h1 className="text-3xl md:text-4xl font-bold text-primary mb-4">
                    Kumpulan Doa Harian
                </h1>
                <p className="text-elderly-lg text-muted-foreground mb-6">
                    Kumpulan doa-doa harian dalam Islam lengkap dengan teks Arab, transliterasi, dan terjemahan.
                </p>

                {/* Stats Badges */}
                <div className="flex justify-center gap-4 mb-8">
                    <div className="bg-muted/50 px-4 py-1.5 rounded-full text-sm font-medium">
                        <span className="text-primary font-bold">{doas.length}</span> Doa
                    </div>
                    <div className="bg-muted/50 px-4 py-1.5 rounded-full text-sm font-medium">
                        <span className="text-primary font-bold">{uniqueCategories.length}</span> Kategori
                    </div>
                </div>

                <div className="max-w-4xl mx-auto space-y-4">
                    {/* Search Bar - Full Width */}
                    <div className="relative w-full">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                            type="text"
                            placeholder="Cari doa berdasarkan nama, isi, atau kategori..."
                            className="pl-10 w-full"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Filters - Side by Side */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                            <SelectTrigger>
                                <SelectValue placeholder="Semua Kategori" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Kategori</SelectItem>
                                {uniqueCategories.map(cat => (
                                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={selectedTag} onValueChange={setSelectedTag}>
                            <SelectTrigger>
                                <SelectValue placeholder="Semua Tag" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Tag</SelectItem>
                                {uniqueTags.map(tag => (
                                    <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="text-sm text-muted-foreground pt-2">
                        Menampilkan {filteredDoas.length} dari {doas.length} doa
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-12">
                    <BookOpen className="w-16 h-16 text-primary mx-auto mb-4 animate-pulse" />
                    <p className="text-muted-foreground">Memuat data doa...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredDoas.map((doa) => (
                        <Card key={doa.id} className="hover:border-primary transition-colors h-full flex flex-col">
                            <CardHeader>
                                <CardTitle className="text-xl text-primary line-clamp-2">
                                    {doa.nama}
                                </CardTitle>
                                {doa.grup && (
                                    <span className="inline-block w-fit text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full mt-2">
                                        {doa.grup}
                                    </span>
                                )}
                            </CardHeader>
                            <CardContent className="flex-grow flex flex-col justify-end">
                                {doa.tag && doa.tag.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {doa.tag.map((tag, idx) => (
                                            <span key={idx} className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-full border border-secondary-foreground/10">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                <div className="flex gap-2 mt-auto">
                                    <Button asChild className="flex-1 bg-primary hover:bg-primary/90">
                                        <Link to={`/doa/${doa.id}`}>
                                            <BookOpen className="w-4 h-4 mr-2" />
                                            Baca
                                        </Link>
                                    </Button>
                                    <Button variant="outline" size="icon" onClick={() => handleShare(doa)}>
                                        <Share2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    {filteredDoas.length === 0 && (
                        <div className="col-span-full text-center py-12 text-muted-foreground">
                            Tidak ada doa yang ditemukan.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Doa;
