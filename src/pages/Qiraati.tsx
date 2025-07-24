import React, { useState, useRef } from 'react';
import { Mic, MicOff, Search, BookOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { useSurahList } from '@/hooks/useQuran';

const Qiraati: React.FC = () => {
  const [isListening, setIsListening] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { surahs: allSurahs, loading } = useSurahList();
  const [searchResults, setSearchResults] = useState(allSurahs);

  // Update search results when surahs change
  React.useEffect(() => {
    setSearchResults(allSurahs);
  }, [allSurahs]);

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
            handleVoiceSearch(finalTranscript);
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
          if (!transcript) {
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
  }, [toast, transcript]);

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
    const normalizedQuery = query.toLowerCase().trim();
    
    // Convert number words to digits (Indonesian)
    const numberMap: { [key: string]: string } = {
      'satu': '1', 'dua': '2', 'tiga': '3', 'empat': '4', 'lima': '5',
      'enam': '6', 'tujuh': '7', 'delapan': '8', 'sembilan': '9', 'nol': '0',
      'sepuluh': '10', 'sebelas': '11', 'dua belas': '12', 'tiga belas': '13',
      'empat belas': '14', 'lima belas': '15', 'enam belas': '16',
      'tujuh belas': '17', 'delapan belas': '18', 'sembilan belas': '19',
      'dua puluh': '20', 'tiga puluh': '30', 'empat puluh': '40',
      'lima puluh': '50', 'enam puluh': '60', 'tujuh puluh': '70',
      'delapan puluh': '80', 'sembilan puluh': '90', 'seratus': '100',
      'tiga puluh enam': '36' // Khusus untuk Yasin
    };

    // Convert number words to digits
    let processedQuery = normalizedQuery;
    Object.entries(numberMap).forEach(([word, digit]) => {
      processedQuery = processedQuery.replace(new RegExp(`\\b${word}\\b`, 'g'), digit);
    });
    
    // Remove common prefixes and normalize variations
    processedQuery = processedQuery
      .replace(/^(surat|surah|al-|ar-|an-|surat ke|surah ke|nomor|nomer)\s*/i, '')
      .replace(/\byaasin\b/i, 'yasin')
      .replace(/\byassin\b/i, 'yasin')
      .replace(/\byaa sin\b/i, 'yasin')
      .replace(/\byas sin\b/i, 'yasin')
      .replace(/\bya sin\b/i, 'yasin')
      .trim();
    
    // Search for matching surahs
    const results = allSurahs.filter(surah => {
      const surahNumber = surah.nomor.toString();
      const namaLatin = surah.namaLatin.toLowerCase();
      const nama = surah.nama.toLowerCase();
      const arti = surah.arti.toLowerCase();
      
      return (
        surahNumber === processedQuery ||
        namaLatin.includes(processedQuery) ||
        nama.includes(processedQuery) ||
        arti.includes(processedQuery) ||
        // Additional checks for number + name combinations
        `${surahNumber} ${namaLatin}`.includes(processedQuery) ||
        `${namaLatin} ${surahNumber}`.includes(processedQuery)
      );
    });
    
    if (results.length > 0) {
      setSearchResults(results);
      toast({
        title: "Hasil Ditemukan",
        description: `Ditemukan ${results.length} surat yang sesuai dengan "${query}"`,
      });
    } else {
      setSearchResults([]);
      toast({
        variant: "destructive",
        title: "Tidak Ditemukan",
        description: `Tidak ada surat yang ditemukan untuk "${query}". Coba kata kunci lain.`,
      });
    }
  };

  const handleTextSearch = (query: string) => {
    if (!query.trim()) {
      setSearchResults(allSurahs);
      return;
    }
    
    const normalizedQuery = query.toLowerCase().trim();
    const cleanQuery = normalizedQuery
      .replace(/^(surat|surah|al-|ar-|an-)\s*/i, '')
      .trim();
    
    const results = allSurahs.filter(surah => 
      surah.namaLatin.toLowerCase().includes(cleanQuery) ||
      surah.nama.toLowerCase().includes(cleanQuery) ||
      surah.arti.toLowerCase().includes(cleanQuery) ||
      surah.nomor.toString().includes(cleanQuery)
    );
    
    setSearchResults(results);
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
              >
                {isListening ? (
                  <>
                    <MicOff className="w-4 h-4" />
                    <span className="hidden sm:inline">Berhenti</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4" />
                    <span className="hidden sm:inline">Cari dengan Suara</span>
                  </>
                )}
              </Button>
            </div>
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