import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Pause, Volume2, VolumeX, Plus, Minus, ScrollText, FastForward } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useSurahDetail } from '@/hooks/useQuran';
import { Slider } from '@/components/ui/slider';

const scrollSpeeds = {
  slow: 80,
  medium: 40,
  fast: 20,
};

const fontSizes = {
  sm: '1rem',    // 16px
  md: '1.25rem', // 20px
  lg: '1.5rem',  // 24px
  xl: '2rem'     // 32px
};

const SurahDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { surah: surahData, loading } = useSurahDetail(id);
  
  const [isPlayingFull, setIsPlayingFull] = useState(false);
  const [playingAyat, setPlayingAyat] = useState<number | null>(null);
  const [fontSize, setFontSize] = useState<'sm' | 'md' | 'lg' | 'xl'>('md');
  const [isMuted, setIsMuted] = useState(false);
  const [autoScroll, setAutoScroll] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState<'slow' | 'medium' | 'fast'>('medium');
  const [scrollProgress, setScrollProgress] = useState(0);
  const ayatListRef = useRef<HTMLDivElement>(null);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const ayatAudioRefs = useRef<Record<number, HTMLAudioElement>>({});

  // Load font size from localStorage
  useEffect(() => {
    const savedFontSize = localStorage.getItem('qiraati-font-size') as typeof fontSize;
    if (savedFontSize) {
      setFontSize(savedFontSize);
    }
  }, []);

  // Save font size to localStorage
  useEffect(() => {
    localStorage.setItem('qiraati-font-size', fontSize);
  }, [fontSize]);

  // Handle scroll progress
  useEffect(() => {
    const container = ayatListRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const scrollHeight = container.scrollHeight - container.clientHeight;
      const progress = (scrollTop / scrollHeight) * 100;
      setScrollProgress(progress);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto scroll effect with improved control
  useEffect(() => {
    if (!autoScroll) return;
    const container = ayatListRef.current;
    if (!container) return;
    
    let animationFrame: number;
    const scrollStep = () => {
      if (!autoScroll) return;
      if (container.scrollTop + container.clientHeight >= container.scrollHeight) {
        setAutoScroll(false);
        return;
      }
      container.scrollTop += 1;
      animationFrame = window.setTimeout(scrollStep, scrollSpeeds[scrollSpeed]);
    };
    
    animationFrame = window.setTimeout(scrollStep, scrollSpeeds[scrollSpeed]);
    return () => {
      clearTimeout(animationFrame);
    };
  }, [autoScroll, scrollSpeed]);

  const playFullSurah = () => {
    if (!surahData?.audioFull?.['01']) return;
    
    if (audioRef.current) {
      if (isPlayingFull) {
        audioRef.current.pause();
        setIsPlayingFull(false);
      } else {
        audioRef.current.src = surahData.audioFull['01'];
        audioRef.current.play().catch(error => {
          console.error('Error playing full surah:', error);
        });
        setIsPlayingFull(true);
        
        // Stop any playing ayat
        setPlayingAyat(null);
        Object.values(ayatAudioRefs.current).forEach(audio => {
          audio.pause();
        });
      }
    }
  };

  const playAyat = (ayatNumber: number) => {
    if (!surahData) return;
    
    const ayat = surahData.ayat.find(a => a.nomorAyat === ayatNumber);
    if (!ayat?.audio?.['01']) return;

    // Stop full surah if playing
    if (audioRef.current && isPlayingFull) {
      audioRef.current.pause();
      setIsPlayingFull(false);
    }

    // Stop other ayat if playing
    Object.entries(ayatAudioRefs.current).forEach(([num, audio]) => {
      if (parseInt(num) !== ayatNumber) {
        audio.pause();
      }
    });

    if (!ayatAudioRefs.current[ayatNumber]) {
      ayatAudioRefs.current[ayatNumber] = new Audio();
    }

    const ayatAudio = ayatAudioRefs.current[ayatNumber];
    
    if (playingAyat === ayatNumber) {
      ayatAudio.pause();
      setPlayingAyat(null);
    } else {
      ayatAudio.src = ayat.audio['01'];
      ayatAudio.play().catch(error => {
        console.error('Error playing ayat:', error);
      });
      setPlayingAyat(ayatNumber);
      
      ayatAudio.onended = () => {
        setPlayingAyat(null);
      };
    }
  };

  const handleFontSizeChange = (newSize: typeof fontSize) => {
    setFontSize(newSize);
    // Smoothly scroll to maintain reading position
    if (ayatListRef.current) {
      const currentScroll = ayatListRef.current.scrollTop;
      requestAnimationFrame(() => {
        if (ayatListRef.current) {
          ayatListRef.current.scrollTop = currentScroll;
        }
      });
    }
  };

  const getFontSizeLabel = (size: typeof fontSize) => {
    switch (size) {
      case 'sm': return 'Kecil';
      case 'md': return 'Sedang';
      case 'lg': return 'Besar';
      case 'xl': return 'Sangat Besar';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => navigate('/qiraati')}
        className="mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Kembali ke Daftar Surat
      </Button>

      {loading ? (
        // Loading skeleton
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-3/4" />
            </CardContent>
          </Card>

          {/* Ayat skeletons */}
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={`skeleton-${index}`}>
              <CardHeader>
                <Skeleton className="h-6 w-16" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : surahData ? (
        <div className="space-y-8">
          {/* Surah Header */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold">
                    {surahData.nomor}. {surahData.namaLatin}
                  </h1>
                  <p className="text-xl font-arabic mt-2">{surahData.nama}</p>
                </div>
                <div className="text-right">
                  <p className="text-muted-foreground">{surahData.arti}</p>
                  <p className="text-sm mt-1">
                    {surahData.tempatTurun} • {surahData.jumlahAyat} Ayat
                  </p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Reading Controls */}
              <div className="space-y-6">
                {/* Audio Controls */}
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    onClick={playFullSurah}
                    className="flex items-center gap-2"
                  >
                    {isPlayingFull ? (
                      <>
                        <Pause className="w-4 h-4" />
                        <span>Jeda</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        <span>Putar Semua</span>
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => setIsMuted(!isMuted)}
                    className="flex items-center gap-2"
                  >
                    {isMuted ? (
                      <VolumeX className="w-4 h-4" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                  </Button>
                </div>

                {/* Font Size Controls */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Ukuran Font</span>
                    <span className="text-sm text-muted-foreground">{getFontSizeLabel(fontSize)}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        const sizes: typeof fontSize[] = ['sm', 'md', 'lg', 'xl'];
                        const currentIndex = sizes.indexOf(fontSize);
                        if (currentIndex > 0) {
                          handleFontSizeChange(sizes[currentIndex - 1]);
                        }
                      }}
                      disabled={fontSize === 'sm'}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <div className="flex-1 h-4 bg-secondary rounded-full overflow-hidden">
                      {['sm', 'md', 'lg', 'xl'].map((size, index) => (
                        <div
                          key={size}
                          className={`h-full w-1/4 ${
                            fontSize === size ? 'bg-primary' : ''
                          }`}
                        />
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        const sizes: typeof fontSize[] = ['sm', 'md', 'lg', 'xl'];
                        const currentIndex = sizes.indexOf(fontSize);
                        if (currentIndex < sizes.length - 1) {
                          handleFontSizeChange(sizes[currentIndex + 1]);
                        }
                      }}
                      disabled={fontSize === 'xl'}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Auto Scroll Controls */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Auto Scroll</span>
                    <span className="text-sm text-muted-foreground">
                      {autoScroll ? `Kecepatan: ${scrollSpeed}` : 'Nonaktif'}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <Button
                      variant={autoScroll ? "default" : "outline"}
                      onClick={() => setAutoScroll(!autoScroll)}
                      className="flex items-center gap-2"
                    >
                      <ScrollText className="w-4 h-4" />
                      <span>{autoScroll ? 'Hentikan' : 'Mulai'}</span>
                    </Button>
                    {autoScroll && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          const speeds: typeof scrollSpeed[] = ['slow', 'medium', 'fast'];
                          const currentIndex = speeds.indexOf(scrollSpeed);
                          setScrollSpeed(speeds[(currentIndex + 1) % speeds.length]);
                        }}
                        className="flex items-center gap-2"
                      >
                        <FastForward className="w-4 h-4" />
                        <span>{scrollSpeed}</span>
                      </Button>
                    )}
                  </div>
                  {/* Scroll Progress Bar */}
                  <div className="h-1 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${scrollProgress}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ayat List with improved styling */}
          <div 
            ref={ayatListRef} 
            className="space-y-6 max-h-[calc(100vh-24rem)] overflow-y-auto scroll-smooth"
            style={{
              scrollBehavior: 'smooth'
            }}
          >
            {surahData.ayat.map((ayat) => (
              <Card key={ayat.nomorAyat}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Ayat {ayat.nomorAyat}</span>
                    <Button
                      variant="ghost"
                      onClick={() => playAyat(ayat.nomorAyat)}
                      className="flex items-center gap-2"
                    >
                      {playingAyat === ayat.nomorAyat ? (
                        <>
                          <Pause className="w-4 h-4" />
                          <span className="sr-only">Jeda</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4" />
                          <span className="sr-only">Putar</span>
                        </>
                      )}
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p 
                    className="font-arabic text-right leading-[2]"
                    style={{ 
                      fontSize: fontSizes[fontSize],
                      transition: 'font-size 0.3s ease'
                    }}
                  >
                    {ayat.teksArab}
                  </p>
                  <p className="text-muted-foreground italic">
                    {ayat.teksLatin}
                  </p>
                  <p>{ayat.terjemahan}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Surat tidak ditemukan.</p>
          <Button
            variant="link"
            onClick={() => navigate('/qiraati')}
            className="mt-4"
          >
            Kembali ke Daftar Surat
          </Button>
        </div>
      )}

      {/* Audio Elements */}
      <audio
        ref={audioRef}
        onEnded={() => setIsPlayingFull(false)}
        muted={isMuted}
      />
    </div>
  );
};

export default SurahDetail;