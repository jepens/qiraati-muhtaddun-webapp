import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Search, BookOpen, Volume2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

// Mock Surah data - In production, this would come from the API
const mockSurahs = [
  { nomor: 1, nama: 'Al-Fatihah', namaLatin: 'Al-Fatihah', arti: 'Pembukaan', jumlahAyat: 7 },
  { nomor: 2, nama: 'Al-Baqarah', namaLatin: 'Al-Baqarah', arti: 'Sapi Betina', jumlahAyat: 286 },
  { nomor: 18, nama: 'Al-Kahf', namaLatin: 'Al-Kahf', arti: 'Gua', jumlahAyat: 110 },
  { nomor: 36, nama: 'Yasin', namaLatin: 'Yasin', arti: 'Yasin', jumlahAyat: 83 },
  { nomor: 55, nama: 'Ar-Rahman', namaLatin: 'Ar-Rahman', arti: 'Yang Maha Pengasih', jumlahAyat: 78 },
  { nomor: 67, nama: 'Al-Mulk', namaLatin: 'Al-Mulk', arti: 'Kerajaan', jumlahAyat: 30 },
  { nomor: 112, nama: 'Al-Ikhlas', namaLatin: 'Al-Ikhlas', arti: 'Keikhlasan', jumlahAyat: 4 },
];

const Qiraati: React.FC = () => {
  const [isListening, setIsListening] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(mockSurahs);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Initialize Speech Recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      if (recognitionRef.current) {
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = 'id-ID'; // Indonesian language
        
        recognitionRef.current.onstart = () => {
          setIsListening(true);
          toast({
            title: "Mendengarkan...",
            description: "Silakan ucapkan nama surat atau ayat yang ingin dibaca",
          });
        };
        
        recognitionRef.current.onresult = (event) => {
          const speechResult = event.results[0][0].transcript;
          setTranscript(speechResult);
          setSearchQuery(speechResult);
          handleVoiceSearch(speechResult);
        };
        
        recognitionRef.current.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
          toast({
            title: "Error",
            description: "Maaf, suara tidak dikenali. Mohon coba lagi dengan lebih jelas atau gunakan pencarian teks.",
            variant: "destructive",
          });
        };
        
        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
      }
    } else {
      toast({
        title: "Peringatan",
        description: "Browser Anda tidak mendukung fitur pencarian suara. Silakan gunakan pencarian teks.",
        variant: "destructive",
      });
    }
  }, [toast]);

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
    
    // Remove common prefixes
    const cleanQuery = normalizedQuery
      .replace(/^(surat|surah|al-|ar-|an-)\s*/i, '')
      .trim();
    
    // Search for matching surahs
    const results = mockSurahs.filter(surah => 
      surah.namaLatin.toLowerCase().includes(cleanQuery) ||
      surah.nama.toLowerCase().includes(cleanQuery) ||
      surah.arti.toLowerCase().includes(cleanQuery)
    );
    
    if (results.length > 0) {
      setSearchResults(results);
      toast({
        title: "Hasil Ditemukan",
        description: `Ditemukan ${results.length} surat yang sesuai dengan "${query}"`,
      });
    } else {
      setSearchResults([]);
      toast({
        title: "Tidak Ditemukan",
        description: `Tidak ada surat yang ditemukan untuk "${query}". Coba kata kunci lain.`,
        variant: "destructive",
      });
    }
  };

  const handleTextSearch = (query: string) => {
    if (!query.trim()) {
      setSearchResults(mockSurahs);
      return;
    }
    
    const normalizedQuery = query.toLowerCase().trim();
    const cleanQuery = normalizedQuery
      .replace(/^(surat|surah|al-|ar-|an-)\s*/i, '')
      .trim();
    
    const results = mockSurahs.filter(surah => 
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
      {/* Header */}
      <div className="text-center mb-12">
        <div className="mb-6">
          <BookOpen className="w-20 h-20 text-primary mx-auto mb-4" />
          <h1 className="text-4xl md:text-5xl font-bold text-primary mb-4">
            Qiraati
          </h1>
          <p className="text-2xl text-gold font-semibold mb-2">
            أَعُوذُ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ
          </p>
          <p className="text-elderly-lg text-muted-foreground">
            Aplikasi Al-Quran dengan Suara
          </p>
        </div>
      </div>

      {/* Voice Search Section */}
      <div className="max-w-2xl mx-auto mb-12">
        <Card className="text-center p-8">
          <CardContent className="space-y-6">
            {/* Microphone Button */}
            <div className="flex justify-center">
              <button
                onClick={isListening ? stopVoiceRecognition : startVoiceRecognition}
                className={`btn-microphone ${isListening ? 'recording' : ''}`}
                disabled={!recognitionRef.current}
              >
                {isListening ? (
                  <MicOff className="w-10 h-10" />
                ) : (
                  <Mic className="w-10 h-10" />
                )}
              </button>
            </div>
            
            {/* Instructions */}
            <div className="space-y-2">
              <p className="text-elderly-lg font-semibold text-primary">
                {isListening ? 'Mendengarkan...' : 'Tekan mikrofon untuk mencari surat/ayat'}
              </p>
              <p className="text-elderly text-muted-foreground">
                Contoh: "Surat Al-Fatihah", "Al-Baqarah", "Yasin"
              </p>
            </div>

            {/* Voice Transcript */}
            {transcript && (
              <div className="bg-accent/20 rounded-lg p-4">
                <p className="text-elderly font-medium text-accent-foreground">
                  Yang diucapkan: "{transcript}"
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Text Search */}
      <div className="max-w-2xl mx-auto mb-12">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-6 h-6" />
          <Input
            type="text"
            placeholder="Atau ketik nama surat di sini..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              handleTextSearch(e.target.value);
            }}
            className="pl-12 pr-4 py-6 text-elderly text-center rounded-xl border-2"
          />
        </div>
      </div>

      {/* Search Results */}
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-primary mb-6 text-center">
          {searchQuery ? `Hasil Pencarian "${searchQuery}"` : 'Daftar Surat Al-Quran'}
        </h2>
        
        {searchResults.length === 0 ? (
          <Card className="text-center p-8">
            <CardContent>
              <p className="text-elderly-lg text-muted-foreground">
                Tidak ada surat yang ditemukan. Coba kata kunci lain.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {searchResults.map((surah) => (
              <Card
                key={surah.nomor}
                className="prayer-card cursor-pointer hover:transform hover:scale-105"
                onClick={() => handleSurahClick(surah.nomor)}
              >
                <CardHeader className="text-center">
                  <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold">
                    {surah.nomor}
                  </div>
                  <CardTitle className="text-elderly-lg">
                    {surah.namaLatin}
                  </CardTitle>
                  <p className="arabic-text text-xl text-primary font-semibold">
                    {surah.nama}
                  </p>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-elderly text-muted-foreground mb-2">
                    {surah.arti}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {surah.jumlahAyat} Ayat
                  </p>
                  <div className="mt-4 flex justify-center">
                    <Volume2 className="w-5 h-5 text-gold" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Quick Access Popular Surahs */}
      <div className="max-w-4xl mx-auto mt-16">
        <h3 className="text-xl font-bold text-primary mb-6 text-center">
          Surat Populer
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 18, 36, 112].map((surahNumber) => {
            const surah = mockSurahs.find(s => s.nomor === surahNumber);
            if (!surah) return null;
            
            return (
              <Button
                key={surahNumber}
                variant="outline"
                className="h-auto p-4 text-center"
                onClick={() => handleSurahClick(surahNumber)}
              >
                <div>
                  <p className="font-bold text-elderly">{surah.namaLatin}</p>
                  <p className="text-sm text-muted-foreground">{surah.jumlahAyat} Ayat</p>
                </div>
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Qiraati;