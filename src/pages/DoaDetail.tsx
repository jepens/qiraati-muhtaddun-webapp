import React, { useState, useEffect } from 'react';
import { Share2, Copy, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useParams, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '@/lib/config';

interface DoaDetailData {
    id: string;
    nama: string;
    ar: string;
    tr: string;
    idn: string;
    tentang: string;
    grup: string;
    source?: string;
}

interface DoaListItem {
    id: string;
    nama: string;
    grup: string;
    tag?: string[];
}

const DoaDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [doa, setDoa] = useState<DoaDetailData | null>(null);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const [allDoas, setAllDoas] = useState<DoaListItem[]>([]);

    useEffect(() => {
        const fetchAllDoas = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/doa`);
                if (response.ok) {
                    const result = await response.json();
                    setAllDoas(Array.isArray(result) ? result : (result.data || []));
                }
            } catch (error) {
                console.error('Error fetching all doas:', error);
            }
        };
        fetchAllDoas();
    }, []);

    const nextDoa = React.useMemo(() => {
        if (!allDoas.length || !id) return null;
        // Convert both to strings for comparison to be safe
        const currentIndex = allDoas.findIndex(d => d.id.toString() === id);
        if (currentIndex !== -1 && currentIndex < allDoas.length - 1) {
            return allDoas[currentIndex + 1];
        }
        return null;
    }, [allDoas, id]);

    const relatedDoas = React.useMemo(() => {
        if (!doa || !allDoas.length) return [];
        return allDoas
            .filter(d => d.grup === doa.grup && d.id.toString() !== doa.id.toString())
            .slice(0, 3);
    }, [doa, allDoas]);

    useEffect(() => {
        const fetchDoaDetail = async () => {
            try {
                setLoading(true);
                if (!id) return;

                const response = await fetch(`${API_BASE_URL}/doa/${id}`);

                if (!response.ok) {
                    throw new Error('Failed to fetch doa detail');
                }

                const result = await response.json();
                // Adjust based on actual API response structure
                // Assuming result.data contains the info or result itself
                const data = result.data || result;

                setDoa(data);
            } catch (error) {
                console.error('Error fetching doa detail:', error);
                toast({
                    title: "Error",
                    description: "Gagal memuat detail doa.",
                    variant: "destructive",
                });
            } finally {
                setLoading(false);
            }
        };

        fetchDoaDetail();
    }, [id, toast]);

    useEffect(() => {
        if (doa) {
            document.title = `${doa.nama} - Doa Harian`;
        }
    }, [doa]);

    const handleCopy = () => {
        if (doa) {
            const text = `${doa.nama}\n\n${doa.ar}\n\n${doa.tr}\n\nArtinya: ${doa.idn}\n\nSumber: ${doa.tentang}`;
            navigator.clipboard.writeText(text);
            toast({
                title: "Berhasil disalin",
                description: "Teks doa telah disalin ke clipboard",
            });
        }
    };

    const handleShare = () => {
        if (doa) {
            if (navigator.share) {
                navigator.share({
                    title: doa.nama,
                    text: `Baca ${doa.nama} di Aplikasi Masjid Al-Muhtaddun`,
                    url: window.location.href,
                }).catch(console.error);
            } else {
                handleCopy();
            }
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!doa) return null;

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            {/* Top Navigation */}
            <Button
                variant="ghost"
                className="mb-6 flex items-center gap-2"
                onClick={() => navigate('/doa')}
            >
                <ChevronLeft className="h-4 w-4" />
                Kembali ke Daftar Doa
            </Button>

            {/* Main Doa Card */}
            <Card className="p-6 md:p-8 mb-8">
                <div className="flex justify-end gap-2 mb-6">
                    <Button variant="outline" size="icon" onClick={handleCopy} title="Salin Teks">
                        <Copy className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={handleShare} title="Bagikan">
                        <Share2 className="h-4 w-4" />
                    </Button>
                </div>

                <div className="text-center space-y-8">
                    <h1 className="text-2xl md:text-3xl font-bold text-primary mb-8">
                        {doa.nama}
                    </h1>

                    <div className="bg-muted/30 p-6 rounded-xl">
                        <p className="text-right text-3xl md:text-4xl leading-loose font-arabic mb-6" dir="rtl">
                            {doa.ar}
                        </p>
                    </div>

                    <div className="space-y-6 text-left">
                        {/* Transliterasi & Terjemahan */}
                        <div>
                            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                                Transliterasi
                            </h3>
                            <p className="text-lg italic text-foreground/80 leading-relaxed">
                                {doa.tr}
                            </p>
                        </div>

                        <div>
                            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                                Terjemahan
                            </h3>
                            <p className="text-lg leading-relaxed">
                                {doa.idn}
                            </p>
                        </div>

                        {doa.tentang && (
                            <div className="pt-4 border-t">
                                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                                    Sumber / Riwayat
                                </h3>
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                    {doa.tentang}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </Card>

            {/* Next Button */}
            {nextDoa && (
                <div className="flex justify-end mb-12">
                    <Button
                        onClick={() => navigate(`/doa/${nextDoa.id}`)}
                        className="gap-2"
                    >
                        Selanjutnya: {nextDoa.nama}
                        <ChevronLeft className="h-4 w-4 rotate-180" />
                    </Button>
                </div>
            )}

            {/* Related Doas */}
            {relatedDoas.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-primary">
                        Doa Lainnya dalam Kategori "{doa.grup}"
                    </h2>
                    <div className="grid grid-cols-1 gap-4">
                        {relatedDoas.map(related => (
                            <Card
                                key={related.id}
                                className="cursor-pointer hover:border-primary transition-colors"
                                onClick={() => navigate(`/doa/${related.id}`)}
                            >
                                <div className="p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                            <div className="w-2 h-2 rounded-full bg-primary" />
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-foreground">{related.nama}</h3>
                                            <p className="text-xs text-muted-foreground line-clamp-1">{related.grup}</p>
                                        </div>
                                    </div>
                                    <ChevronLeft className="h-4 w-4 text-muted-foreground rotate-180" />
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default DoaDetail;
