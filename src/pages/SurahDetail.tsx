import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Pause, Volume2, VolumeX, Plus, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface Ayat {
  nomorAyat: number;
  teksArab: string;
  teksLatin: string;
  terjemahan: string;
  audio: Record<string, string>;
}

interface SurahDetail {
  nomor: number;
  nama: string;
  namaLatin: string;
  arti: string;
  tempatTurun: string;
  jumlahAyat: number;
  audioFull: Record<string, string>;
  ayat: Ayat[];
}

// Mock detailed surah data
const mockSurahDetails: Record<number, SurahDetail> = {
  1: {
    nomor: 1,
    nama: 'الفاتحة',
    namaLatin: 'Al-Fatihah',
    arti: 'Pembukaan',
    tempatTurun: 'Mekah',
    jumlahAyat: 7,
    audioFull: {
      '01': 'https://equran.nos.wjv-1.neo.id/audio-full/01001.mp3',
    },
    ayat: [
      {
        nomorAyat: 1,
        teksArab: 'بِسۡمِ ٱللَّهِ ٱلرَّحۡمَـٰنِ ٱلرَّحِیمِ',
        teksLatin: 'Bismillāhir-raḥmānir-raḥīm',
        terjemahan: 'Dengan menyebut nama Allah Yang Maha Pemurah lagi Maha Penyayang.',
        audio: {
          '01': 'https://equran.nos.wjv-1.neo.id/audio-partial/01001001.mp3',
        }
      },
      {
        nomorAyat: 2,
        teksArab: 'ٱلۡحَمۡدُ لِلَّهِ رَبِّ ٱلۡعَـٰلَمِینَ',
        teksLatin: 'Al-ḥamdu lillāhi rabbil-ʿālamīn',
        terjemahan: 'Segala puji bagi Allah, Tuhan seluruh alam.',
        audio: {
          '01': 'https://equran.nos.wjv-1.neo.id/audio-partial/01001002.mp3',
        }
      },
      {
        nomorAyat: 3,
        teksArab: 'ٱلرَّحۡمَـٰنِ ٱلرَّحِیمِ',
        teksLatin: 'Ar-raḥmānir-raḥīm',
        terjemahan: 'Yang Maha Pemurah lagi Maha Penyayang.',
        audio: {
          '01': 'https://equran.nos.wjv-1.neo.id/audio-partial/01001003.mp3',
        }
      },
      {
        nomorAyat: 4,
        teksArab: 'مَـٰلِكِ یَوۡمِ ٱلدِّینِ',
        teksLatin: 'Māliki yawmid-dīn',
        terjemahan: 'Yang menguasai Hari Pembalasan.',
        audio: {
          '01': 'https://equran.nos.wjv-1.neo.id/audio-partial/01001004.mp3',
        }
      },
      {
        nomorAyat: 5,
        teksArab: 'إِیَّاكَ نَعۡبُدُ وَإِیَّاكَ نَسۡتَعِینُ',
        teksLatin: 'Iyyāka naʿbudu wa iyyāka nastaʿīn',
        terjemahan: 'Hanya kepada Engkaulah kami menyembah dan hanya kepada Engkaulah kami memohon pertolongan.',
        audio: {
          '01': 'https://equran.nos.wjv-1.neo.id/audio-partial/01001005.mp3',
        }
      },
      {
        nomorAyat: 6,
        teksArab: 'ٱهۡدِنَا ٱلصِّرَ ٰ⁠طَ ٱلۡمُسۡتَقِیمَ',
        teksLatin: 'Ihdinaṣ-ṣirāṭal-mustaqīm',
        terjemahan: 'Tunjukilah kami jalan yang lurus.',
        audio: {
          '01': 'https://equran.nos.wjv-1.neo.id/audio-partial/01001006.mp3',
        }
      },
      {
        nomorAyat: 7,
        teksArab: 'صِرَ ٰ⁠طَ ٱلَّذِینَ أَنۡعَمۡتَ عَلَیۡهِمۡ غَیۡرِ ٱلۡمَغۡضُوبِ عَلَیۡهِمۡ وَلَا ٱلضَّاۤلِّینَ',
        teksLatin: 'Ṣirāṭallaḏīna anʿamta ʿalayhim gayril-magḍūbi ʿalayhim wa laḍ-ḍāllīn',
        terjemahan: '(yaitu) jalan orang-orang yang telah Engkau beri nikmat kepadanya; bukan (jalan) mereka yang dimurkai dan bukan (pula jalan) mereka yang sesat.',
        audio: {
          '01': 'https://equran.nos.wjv-1.neo.id/audio-partial/01001007.mp3',
        }
      }
    ]
  },
  112: {
    nomor: 112,
    nama: 'الإخلاص',
    namaLatin: 'Al-Ikhlas',
    arti: 'Keikhlasan',
    tempatTurun: 'Mekah',
    jumlahAyat: 4,
    audioFull: {
      '01': 'https://equran.nos.wjv-1.neo.id/audio-full/01112.mp3',
    },
    ayat: [
      {
        nomorAyat: 1,
        teksArab: 'قُلۡ هُوَ ٱللَّهُ أَحَدٌ',
        teksLatin: 'Qul huwallāhu aḥad',
        terjemahan: 'Katakanlah: "Dia-lah Allah, Yang Maha Esa.',
        audio: {
          '01': 'https://equran.nos.wjv-1.neo.id/audio-partial/01112001.mp3',
        }
      },
      {
        nomorAyat: 2,
        teksArab: 'ٱللَّهُ ٱلصَّمَدُ',
        teksLatin: 'Allāhuṣ-ṣamad',
        terjemahan: 'Allah adalah Tuhan yang bergantung kepada-Nya segala sesuatu.',
        audio: {
          '01': 'https://equran.nos.wjv-1.neo.id/audio-partial/01112002.mp3',
        }
      },
      {
        nomorAyat: 3,
        teksArab: 'لَمۡ یَلِدۡ وَلَمۡ یُولَدۡ',
        teksLatin: 'Lam yalid wa lam yūlad',
        terjemahan: 'Dia tiada beranak dan tidak pula diperanakkan.',
        audio: {
          '01': 'https://equran.nos.wjv-1.neo.id/audio-partial/01112003.mp3',
        }
      },
      {
        nomorAyat: 4,
        teksArab: 'وَلَمۡ یَكُن لَّهُۥ كُفُوًا أَحَدٌۢ',
        teksLatin: 'Wa lam yakul-lahū kufuwan aḥad',
        terjemahan: 'Dan tidak ada seorangpun yang setara dengan Dia."',
        audio: {
          '01': 'https://equran.nos.wjv-1.neo.id/audio-partial/01112004.mp3',
        }
      }
    ]
  }
};

const SurahDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [surahData, setSurahData] = useState<SurahDetail | null>(null);
  const [isPlayingFull, setIsPlayingFull] = useState(false);
  const [playingAyat, setPlayingAyat] = useState<number | null>(null);
  const [fontSize, setFontSize] = useState<'sm' | 'md' | 'lg' | 'xl'>('md');
  const [isMuted, setIsMuted] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const ayatAudioRefs = useRef<Record<number, HTMLAudioElement>>({});

  useEffect(() => {
    if (id) {
      const surahId = parseInt(id);
      const data = mockSurahDetails[surahId];
      
      if (data) {
        setSurahData(data);
      } else {
        toast({
          title: "Surat Tidak Ditemukan",
          description: "Surat yang Anda cari tidak tersedia.",
          variant: "destructive",
        });
        navigate('/qiraati');
      }
    }
  }, [id, navigate, toast]);

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

  const playFullSurah = () => {
    if (!surahData?.audioFull['01']) return;
    
    if (audioRef.current) {
      if (isPlayingFull) {
        audioRef.current.pause();
        setIsPlayingFull(false);
      } else {
        audioRef.current.src = surahData.audioFull['01'];
        audioRef.current.play();
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
    if (!ayat?.audio['01']) return;

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
      ayatAudio.play();
      setPlayingAyat(ayatNumber);
      
      ayatAudio.onended = () => {
        setPlayingAyat(null);
      };
    }
  };

  const adjustFontSize = (direction: 'increase' | 'decrease') => {
    const sizes: Array<typeof fontSize> = ['sm', 'md', 'lg', 'xl'];
    const currentIndex = sizes.indexOf(fontSize);
    
    if (direction === 'increase' && currentIndex < sizes.length - 1) {
      setFontSize(sizes[currentIndex + 1]);
    } else if (direction === 'decrease' && currentIndex > 0) {
      setFontSize(sizes[currentIndex - 1]);
    }
  };

  const toggleMute = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    
    if (audioRef.current) {
      audioRef.current.muted = newMutedState;
    }
    
    Object.values(ayatAudioRefs.current).forEach(audio => {
      audio.muted = newMutedState;
    });
  };

  if (!surahData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-elderly-lg text-muted-foreground">Memuat surat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`container mx-auto px-4 py-8 font-size-${fontSize}`}>
      {/* Header */}
      <div className="mb-8">
        <Button
          onClick={() => navigate('/qiraati')}
          variant="outline"
          className="mb-6 text-elderly"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Kembali ke Qiraati
        </Button>

        <Card className="text-center p-8 bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="text-3xl md:text-4xl font-bold text-primary mb-4">
              {surahData.namaLatin}
            </CardTitle>
            <div className="arabic-text text-4xl md:text-5xl text-primary font-bold mb-4">
              {surahData.nama}
            </div>
            <p className="text-elderly-lg text-muted-foreground mb-2">
              {surahData.arti} • {surahData.tempatTurun} • {surahData.jumlahAyat} Ayat
            </p>
          </CardHeader>
        </Card>
      </div>

      {/* Controls */}
      <div className="mb-8 flex flex-wrap justify-center gap-4">
        {/* Font Size Controls */}
        <div className="font-controls">
          <span className="text-elderly font-medium">Ukuran Teks:</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => adjustFontSize('decrease')}
            disabled={fontSize === 'sm'}
          >
            <Minus className="w-4 h-4" />
          </Button>
          <span className="px-2 text-elderly font-semibold">{fontSize.toUpperCase()}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => adjustFontSize('increase')}
            disabled={fontSize === 'xl'}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Audio Controls */}
        <div className="font-controls">
          <Button
            onClick={playFullSurah}
            className="btn-mosque"
            disabled={!surahData.audioFull['01']}
          >
            {isPlayingFull ? (
              <Pause className="w-5 h-5 mr-2" />
            ) : (
              <Play className="w-5 h-5 mr-2" />
            )}
            {isPlayingFull ? 'Jeda' : 'Dengarkan'} Seluruh Surat
          </Button>
          
          <Button
            variant="outline"
            onClick={toggleMute}
          >
            {isMuted ? (
              <VolumeX className="w-5 h-5" />
            ) : (
              <Volume2 className="w-5 h-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Bismillah */}
      {surahData.nomor !== 1 && surahData.nomor !== 9 && (
        <div className="text-center mb-12">
          <div className="arabic-text text-3xl md:text-4xl text-primary font-bold">
            بِسۡمِ ٱللَّهِ ٱلرَّحۡمَـٰنِ ٱلرَّحِیمِ
          </div>
          <p className="text-elderly-lg text-muted-foreground mt-2">
            Dengan menyebut nama Allah Yang Maha Pemurah lagi Maha Penyayang
          </p>
        </div>
      )}

      {/* Ayat List */}
      <div className="space-y-8">
        {surahData.ayat.map((ayat) => (
          <Card key={ayat.nomorAyat} className="p-6 border-2 border-border hover:border-primary/30 transition-colors">
            <CardContent className="space-y-6">
              {/* Ayat Number and Audio Control */}
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xl font-bold">
                  {ayat.nomorAyat}
                </div>
                <Button
                  variant="outline"
                  onClick={() => playAyat(ayat.nomorAyat)}
                  disabled={!ayat.audio['01']}
                  className={playingAyat === ayat.nomorAyat ? 'bg-primary text-primary-foreground' : ''}
                >
                  {playingAyat === ayat.nomorAyat ? (
                    <Pause className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                </Button>
              </div>

              {/* Arabic Text */}
              <div className="arabic-text text-right text-primary font-semibold leading-relaxed">
                {ayat.teksArab}
              </div>

              {/* Latin Transliteration */}
              <div className="text-elderly italic text-muted-foreground">
                {ayat.teksLatin}
              </div>

              {/* Indonesian Translation */}
              <div className="text-elderly-lg text-foreground leading-relaxed">
                {ayat.terjemahan}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Audio Elements */}
      <audio ref={audioRef} onEnded={() => setIsPlayingFull(false)} />
    </div>
  );
};

export default SurahDetail;