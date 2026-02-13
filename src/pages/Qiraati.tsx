
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Search, Mic, X, Check } from "lucide-react";
import { useSurahList } from '@/hooks/useQuran';
import { useToast } from "@/hooks/use-toast";
// import { useVoiceControl } from '@/hooks/useVoiceControl'; // REMOVED
import { useSpeechToText } from '@/hooks/useSpeechToText'; // NEW HOOK
import { useFuseSearch } from '@/hooks/useFuseSearch';
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

const Qiraati: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isDataReady, setIsDataReady] = useState(false);
  const [loading, setLoading] = useState(true);

  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { surahs: allSurahs, loading: surahLoading } = useSurahList();

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

  // New Voice Control Integration
  const {
    isListening,
    transcript,
    fullTranscript, // Combined transcript for display
    startListening,
    stopListening,
    resetTranscript
  } = useSpeechToText({
    continuous: true,
    lang: 'id-ID'
  });

  /* Start of Handlers */
  const handleSearchResults = useCallback((results: any[], query: string, showToast = false) => {
    if (results.length > 0) {
      setSearchResults(results);
      if (showToast) {
        toast({
          title: "Hasil Ditemukan",
          description: `Ditemukan ${results.length} surat yang sesuai dengan "${query}"`,
        });
      }
    } else {
      setSearchResults([]);
      if (showToast) {
        toast({
          variant: "destructive",
          title: "Tidak Ditemukan",
          description: `Tidak ada surat yang ditemukan untuk "${query}".`,
        });
      }
    }
  }, [toast]);

  const handleTextSearch = useCallback((query: string, showToast = false) => {
    const cleanQuery = removePrefixes(query);
    const results = fuseSearch(cleanQuery);
    handleSearchResults(results, query, showToast);
    return results;
  }, [fuseSearch, handleSearchResults]);

  // Execute Voice Command (Navigation or Search)
  const executeVoiceCommand = useCallback((text: string) => {
    console.log("Executing Voice Command:", text);
    const lowerText = text.toLowerCase();

    // Check for Ayat navigation: "Surat Yasin Ayat 5" or "Buka Yasin Ayat 5"
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

    // Default: Search for Surah
    const results = handleTextSearch(text, true); // Search and show toast

    // If exactly one highly relevant result, maybe auto-open?
    // For now, let's just show results in the list (already done by handleTextSearch)
    // But if we are in Modal, we might want to close it?
    // Let's close modal if we found something
    if (results.length > 0) {
      // If we found an exact match or close match, and it looks like a navigation intent
      if (text.includes('buka') || text.includes('baca')) {
        setIsVoiceModalOpen(false);
        navigate(`/qiraati/surat/${results[0].nomor}`);
        toast({ title: "Membuka Surat", description: `${results[0].namaLatin}` });
      } else {
        // Just filtering the list
        setIsVoiceModalOpen(false);
        setSearchQuery(text); // Update search box
      }
    }

  }, [fuseSearch, handleTextSearch, navigate, toast]);

  // Debounce Logic for Voice
  useEffect(() => {
    if (!isVoiceModalOpen || !transcript) return;

    // Debounce: Wait 1.5s after last FINAL transcript update
    const timer = setTimeout(() => {
      if (transcript.trim().length > 0) {
        executeVoiceCommand(transcript);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [transcript, isVoiceModalOpen, executeVoiceCommand]);

  // Start listening when modal opens
  useEffect(() => {
    if (isVoiceModalOpen) {
      startListening();
    } else {
      stopListening();
      resetTranscript();
    }
  }, [isVoiceModalOpen, startListening, stopListening, resetTranscript]);

  /* End of Handlers */

  // Update search results when surahs change
  React.useEffect(() => {
    setSearchResults(allSurahs);
    if (allSurahs.length > 0) {
      setIsDataReady(true);
    } else {
      setIsDataReady(false);
    }
  }, [allSurahs]);

  // Update loading state based on surahLoading
  React.useEffect(() => {
    setLoading(surahLoading);
  }, [surahLoading]);

  // Handle URL query parameters
  React.useEffect(() => {
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

        // Small delay to allow toast to be seen
        setTimeout(() => {
          // Clear query params to prevent re-triggering on refresh
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

  const startVoiceSearch = () => {
    if (!isDataReady) return;
    setIsVoiceModalOpen(true);
    setSearchQuery('');
  };

  const handleSurahClick = (surahId: number) => {
    navigate(`/qiraati/surat/${surahId}`);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col gap-6">
        {/* Search Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-6 h-6" />
              Cari Surat
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Ketik nama atau nomor surat..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    handleTextSearch(e.target.value);
                  }}
                  className="pl-9"
                />
              </div>
              <Button
                variant="secondary"
                onClick={startVoiceSearch}
                className="flex items-center gap-2"
                disabled={!isDataReady}
              >
                <Mic className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {isDataReady ? "Cari dengan Suara" : "Loading..."}
                </span>
              </Button>
            </div>

            {/* Voice Search Modal */}
            <Dialog open={isVoiceModalOpen} onOpenChange={setIsVoiceModalOpen}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-center flex flex-col items-center gap-4">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center ${isListening ? 'bg-red-100 animate-pulse' : 'bg-gray-100'}`}>
                      <Mic className={`w-8 h-8 ${isListening ? 'text-red-500' : 'text-gray-400'}`} />
                    </div>
                    {isListening ? "Mendengarkan..." : "Memproses..."}
                  </DialogTitle>
                  <DialogDescription className="text-center">
                    Katakan nama surat. Jeda sejenak untuk mencari otomatis.
                  </DialogDescription>
                </DialogHeader>

                <div className="py-6 space-y-4">
                  <div className="bg-muted p-4 rounded-lg min-h-[80px] flex items-center justify-center text-center">
                    <p className="text-lg font-medium text-foreground">
                      {fullTranscript || "..."}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 justify-center text-xs text-muted-foreground">
                    <span className="bg-secondary px-2 py-1 rounded-md">"Al-Mulk"</span>
                    <span className="bg-secondary px-2 py-1 rounded-md">"Surat Yasin"</span>
                    <span className="bg-secondary px-2 py-1 rounded-md">"Buka Ayat 5"</span>
                  </div>
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

            {!isDataReady && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  ⏳ Sedang memuat data surat... Voice search akan tersedia dalam beberapa detik.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Surah List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            // Loading skeletons
            Array.from({ length: 6 }).map((_, index) => (
              <Card key={`skeleton-${index}`} className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader>
                  <Skeleton className="h-6 w-24" />
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-2">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : searchResults.length > 0 ? (
            searchResults.map((surah) => (
              <Card
                key={surah.nomor}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => handleSurahClick(surah.nomor)}
              >
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{surah.nomor}. {surah.namaLatin}</span>
                    <span className="text-xl font-arabic">{surah.nama}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{surah.arti}</p>
                  <p className="text-sm mt-2">
                    <span className="font-medium">{surah.jumlahAyat}</span> Ayat
                  </p>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-8">
              <p className="text-muted-foreground">Tidak ada surat yang ditemukan.</p>
              <p className="text-sm">Coba kata kunci lain atau periksa ejaan Anda. Contoh: Surat Yasin / Surah Yasin</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Qiraati;