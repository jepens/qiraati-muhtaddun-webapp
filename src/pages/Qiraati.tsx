import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { useToast } from '@/hooks/use-toast';
import { Search, Mic, MicOff, BookOpen } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useSurahList } from '@/hooks/useQuran';

// Helper functions for search normalization
const numberWords: { [key: string]: string } = {
  'satu': '1', 'dua': '2', 'tiga': '3', 'empat': '4', 'lima': '5',
  'enam': '6', 'tujuh': '7', 'delapan': '8', 'sembilan': '9', 'sepuluh': '10'
};

function normalizeString(str: string) {
  return str.toLowerCase().replace(/[-\s]/g, '');
}

function removePrefixes(str: string) {
  let result = str.trim().toLowerCase();
  const prefixes = [
    'surat', 'surah',
    'al', 'an', 'ar', 'as', 'ash', 'at', 'az', 'ad', 'al-', 'an-', 'ar-', 'as-', 'ash-', 'at-', 'az-', 'ad-'
  ];
  let changed = true;
  while (changed) {
    changed = false;
    for (const prefix of prefixes) {
      const regex = new RegExp('^' + prefix + '[\\s-]*', 'i');
      if (regex.test(result)) {
        result = result.replace(regex, '');
        changed = true;
      }
    }
  }
  return result.trim();
}

const validSurahNames = [
  'al-fatihah', 'al-baqarah', 'al-i\'imran', 'an-nisa', 'al-ma\'idah', 'al-an\'am', 'al-a\'raf', 'al-anfal', 'at-taubah',
  'yunus', 'hud', 'yusuf', 'ar-ra\'d', 'ibrahim', 'al-hijr', 'an-nahl', 'al-isra', 'al-kahf', 'maryam', 'ta ha',
  'al-anbiya', 'al-hajj', 'al-mu\'minun', 'an-nur', 'al-furqan', 'ash-shu\'ara', 'an-naml', 'al-qasas', 'al-ankabut',
  'ar-rum', 'luqman', 'as-sajdah', 'al-ahzab', 'saba', 'fatir', 'ya sin', 'as-saffat', 'sad', 'az-zumar', 'ghafir',
  'fussilat', 'ash-shura', 'az-zukhruf', 'ad-dukhan', 'al-jathiyah', 'al-ahqaf', 'muhammad', 'al-fath', 'al-hujurat',
  'qaf', 'ad-dhariyat', 'at-tur', 'an-najm', 'al-qamar', 'ar-rahman', 'al-waqi\'ah', 'al-hadid', 'al-mujadilah',
  'al-hashr', 'al-mumtahanah', 'as-saff', 'al-jumu\'ah', 'al-munafiqun', 'at-taghabun', 'at-talaq', 'at-tahrim',
  'al-mulk', 'al-qalam', 'al-haqqah', 'al-ma\'arij', 'nuh', 'al-jinn', 'al-muzzammil', 'al-muddathir', 'al-qiyamah',
  'al-insan', 'al-mursalat', 'an-naba', 'an-nazi\'at', 'abasa', 'at-takwir', 'al-infitar', 'al-mutaffifin',
  'al-inshiqaq', 'al-buruj', 'at-tariq', 'al-a\'la', 'al-ghashiyah', 'al-fajr', 'al-balad', 'ash-shams', 'al-layl',
  'ad-duha', 'ash-sharh', 'at-tin', 'al-\'alaq', 'al-qadr', 'al-bayyinah', 'az-zalzalah', 'al-\'adiyat', 'al-qari\'ah',
  'at-takathur', 'al-\'asr', 'al-humazah', 'al-fil', 'quraysh', 'al-ma\'un', 'al-kawthar', 'al-kafirun', 'an-nasr',
  'al-masad', 'al-ikhlas', 'al-falaq', 'an-nas'
];

function isValidSurahName(str: string) {
  return validSurahNames.includes(str.toLowerCase());
}

function performRobustSearch(query: string, surahs: any[]) {
  if (!query.trim()) return surahs;

  // Pre-process query
  let processedQuery = query.toLowerCase();
  Object.keys(numberWords).forEach(word => {
    processedQuery = processedQuery.replace(new RegExp(word, 'g'), numberWords[word]);
  });

  let cleanQuery = processedQuery
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s-]/g, '')
    .trim();

  cleanQuery = removePrefixes(cleanQuery);
  const normalizedCleanQuery = normalizeString(cleanQuery);

  // 1. Exact/High-Confidence Match
  let results = surahs.filter(surah => {
    let namaLatinCleaned = surah.namaLatin.toLowerCase();
    let namaCleaned = surah.nama.toLowerCase();
    let artiCleaned = surah.arti.toLowerCase();

    if (!isValidSurahName(namaLatinCleaned)) namaLatinCleaned = removePrefixes(surah.namaLatin);
    if (!isValidSurahName(namaCleaned)) namaCleaned = removePrefixes(surah.nama);
    if (!isValidSurahName(artiCleaned)) artiCleaned = removePrefixes(surah.arti);

    const namaLatinNorm = normalizeString(namaLatinCleaned);
    const namaNorm = normalizeString(namaCleaned);
    const artiNorm = normalizeString(artiCleaned);
    const nomor = surah.nomor.toString();

    return (
      namaLatinNorm === normalizedCleanQuery ||
      namaNorm === normalizedCleanQuery ||
      artiNorm === normalizedCleanQuery ||
      nomor === cleanQuery
    );
  });

  // 2. Partial Match fallback
  if (results.length === 0 && normalizedCleanQuery.length > 2) {
    results = surahs.filter(surah => {
      let namaLatinCleaned = surah.namaLatin.toLowerCase();
      let namaCleaned = surah.nama.toLowerCase();
      let artiCleaned = surah.arti.toLowerCase();

      if (!isValidSurahName(namaLatinCleaned)) namaLatinCleaned = removePrefixes(surah.namaLatin);
      if (!isValidSurahName(namaCleaned)) namaCleaned = removePrefixes(surah.nama);
      if (!isValidSurahName(artiCleaned)) artiCleaned = removePrefixes(surah.arti);

      const namaLatinNorm = normalizeString(namaLatinCleaned);
      const namaNorm = normalizeString(namaCleaned);
      const artiNorm = normalizeString(artiCleaned);

      return (
        namaLatinNorm.includes(normalizedCleanQuery) ||
        namaNorm.includes(normalizedCleanQuery) ||
        artiNorm.includes(normalizedCleanQuery)
      );
    });
  }

  return results;
}

const Qiraati: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isDataReady, setIsDataReady] = useState(false);
  const [loading, setLoading] = useState(true);

  const recognitionRef = useRef<any>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { surahs: allSurahs, loading: surahLoading } = useSurahList();

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

  // Refs for callbacks to access latest state without triggering re-renders
  const transcriptRef = useRef(transcript);
  const allSurahsRef = useRef(allSurahs);

  // Update refs when state changes
  React.useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  React.useEffect(() => {
    allSurahsRef.current = allSurahs;
  }, [allSurahs]);

  // Handle URL query parameters for voice commands from SurahDetail
  React.useEffect(() => {
    if (allSurahs.length === 0) return;

    const params = new URLSearchParams(window.location.search);
    const voiceSearch = params.get('voice_search');
    const ayat = params.get('ayat');

    if (voiceSearch) {
      const decodedSearch = decodeURIComponent(voiceSearch);

      // Use the shared robust search logic
      const results = performRobustSearch(decodedSearch, allSurahs);

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
  }, [allSurahs, navigate, toast]);

  // Initialize Speech Recognition
  React.useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {

      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();

      if (recognitionRef.current) {
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'id-ID'; // Indonesian language
        recognitionRef.current.maxAlternatives = 3; // Get multiple alternatives

        recognitionRef.current.onstart = () => {
          setIsListening(true);
          toast({
            title: "Mendengarkan...",
            description: "Silakan ucapkan nama atau nomor surat yang ingin dibaca",
          });
        };


        recognitionRef.current.onresult = (event: any) => {
          let finalTranscript = '';
          let interimTranscript = '';

          // Process all results to get the best match
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }

          // If we have a final result, use it
          if (finalTranscript) {
            setTranscript(finalTranscript);
            setSearchQuery(finalTranscript);
            // Check if surahs are loaded before searching
            if (allSurahsRef.current.length > 0) {
              handleVoiceSearch(finalTranscript);
            } else {
              toast({
                title: "Loading...",
                description: "Sedang memuat data surat, silakan coba lagi dalam beberapa detik.",
              });
            }
          }
          // Show interim results while still processing
          else if (interimTranscript) {
            setTranscript(interimTranscript);
            setSearchQuery(interimTranscript);
          }
        };


        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);

          let errorMessage = "Maaf, suara tidak dikenali. ";
          switch (event.error) {
            case 'network':
              errorMessage += "Periksa koneksi internet Anda.";
              break;
            case 'not-allowed':
            case 'permission-denied':
              errorMessage += "Izinkan akses mikrofon untuk menggunakan fitur ini.";
              break;
            case 'no-speech':
              errorMessage += "Tidak ada suara yang terdeteksi. Mohon coba lagi.";
              break;
            default:
              errorMessage += "Mohon coba lagi dengan lebih jelas atau gunakan pencarian teks.";
          }

          toast({
            title: "Error",
            description: errorMessage,
            variant: "destructive",
          });
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
          // If no final result was received, show a message
          if (!transcriptRef.current) {
            toast({
              title: "Info",
              description: "Pencarian suara selesai. Jika hasil tidak sesuai, coba ucapkan dengan lebih jelas.",
            });
          }
        };
      }
    } else {
      toast({
        title: "Peringatan",
        description: "Browser Anda tidak mendukung fitur pencarian suara. Silakan gunakan pencarian teks.",
        variant: "destructive",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Initialize once

  const startVoiceRecognition = () => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error('Error starting speech recognition:', error);
        toast({
          title: "Error",
          description: "Tidak dapat memulai pencarian suara. Silakan coba lagi.",
          variant: "destructive",
        });
      }
    }
  };

  const stopVoiceRecognition = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  const handleVoiceSearch = (query: string) => {
    const results = performRobustSearch(query, allSurahs);
    handleSearchResults(results, query);
  };

  const handleTextSearch = (query: string) => {
    const results = performRobustSearch(query, allSurahs);
    setSearchResults(results);
  };

  const handleSearchResults = (results: any[], query: string) => {
    if (results.length > 0) {
      setSearchResults(results);
      toast({
        title: "Hasil Ditemukan",
        description: `Ditemukan ${results.length} surat yang sesuai dengan "${query}"`,
      });
    } else {
      setSearchResults([]);

      // Fallback: Suggest similar surah names
      function simpleSimilarity(a: string, b: string) {
        let max = 0;
        for (let i = 0; i < a.length; i++) {
          for (let j = i + 1; j <= a.length; j++) {
            const sub = a.slice(i, j);
            if (b.includes(sub) && sub.length > max) max = sub.length;
          }
        }
        return max;
      }

      // Normalize query for suggestion check
      // We need to re-normalize here since we don't have access to the clean query from performRobustSearch
      // unless we change signature, but re-doing it is fine for this fallback
      let cleanQuery = query.toLowerCase().replace(/[^\w\s]/g, '');
      cleanQuery = removePrefixes(cleanQuery);
      const normalizedQuery = normalizeString(cleanQuery);

      const suggestions = allSurahs
        .map(surah => {
          let namaLatinCleaned = surah.namaLatin.toLowerCase();
          if (!isValidSurahName(namaLatinCleaned)) {
            namaLatinCleaned = removePrefixes(surah.namaLatin);
          }
          const namaLatinNorm = normalizeString(namaLatinCleaned);
          const score = simpleSimilarity(namaLatinNorm, normalizedQuery);
          return { surah, score };
        })
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map(item => item.surah.namaLatin);

      const suggestionText = suggestions.length > 0
        ? `Coba: ${suggestions.join(', ')}`
        : 'Coba kata kunci lain seperti: Al-Fatihah, Yasin, Al-Baqarah, Al-Kafirun';

      toast({
        variant: "destructive",
        title: "Tidak Ditemukan",
        description: `Tidak ada surat yang ditemukan untuk "${query}". ${suggestionText}`,
      });
    }
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
                variant={isListening ? "destructive" : "secondary"}
                onClick={isListening ? stopVoiceRecognition : startVoiceRecognition}
                className="flex items-center gap-2"
                disabled={!isDataReady}
              >
                {isListening ? (
                  <>
                    <MicOff className="w-4 h-4" />
                    <span className="hidden sm:inline">Berhenti</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4" />
                    <span className="hidden sm:inline">
                      {isDataReady ? "Cari dengan Suara" : "Loading..."}
                    </span>
                  </>
                )}
              </Button>
            </div>
            {/* Debug: Show transcript */}
            {transcript && (
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Transcript:</p>
                <p className="text-sm font-mono">{transcript}</p>
              </div>
            )}
            {/* Data readiness indicator */}
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