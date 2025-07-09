import React, { useState, useEffect } from 'react';
import { Clock, MapPin, Sunrise, Sun, Sunset, Moon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface PrayerTime {
  imsak: string;
  subuh: string;
  terbit: string;
  dhuha: string;
  dzuhur: string;
  ashar: string;
  maghrib: string;
  isya: string;
}

interface PrayerSchedule {
  jadwal: {
    tanggal: string;
    imsak: string;
    subuh: string;
    terbit: string;
    dhuha: string;
    dzuhur: string;
    ashar: string;
    maghrib: string;
    isya: string;
  };
}

const JadwalSholat: React.FC = () => {
  const [prayerTimes, setPrayerTimes] = useState<PrayerTime | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [nextPrayer, setNextPrayer] = useState<string>('');
  const { toast } = useToast();

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // Fetch prayer times
  useEffect(() => {
    const fetchPrayerTimes = async () => {
      try {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const date = String(now.getDate()).padStart(2, '0');
        
        // For now, we'll use mock data since we don't have the backend proxy yet
        // In production, this would call: `/api/prayer-times/${year}/${month}/${date}`
        
        // Mock data for demonstration
        const mockPrayerTimes: PrayerTime = {
          imsak: '04:30',
          subuh: '04:40',
          terbit: '06:00',
          dhuha: '06:20',
          dzuhur: '12:10',
          ashar: '15:20',
          maghrib: '18:15',
          isya: '19:30'
        };

        setPrayerTimes(mockPrayerTimes);
        
        // Calculate next prayer
        calculateNextPrayer(mockPrayerTimes);
        
      } catch (error) {
        console.error('Error fetching prayer times:', error);
        toast({
          title: "Error",
          description: "Gagal memuat jadwal sholat. Silakan coba lagi nanti.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPrayerTimes();
  }, [toast]);

  const calculateNextPrayer = (times: PrayerTime) => {
    const now = new Date();
    const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    const prayers = [
      { name: 'Subuh', time: times.subuh },
      { name: 'Dzuhur', time: times.dzuhur },
      { name: 'Ashar', time: times.ashar },
      { name: 'Maghrib', time: times.maghrib },
      { name: 'Isya', time: times.isya }
    ];

    for (const prayer of prayers) {
      if (currentTimeStr < prayer.time) {
        setNextPrayer(prayer.name);
        return;
      }
    }
    
    // If all prayers have passed, next prayer is tomorrow's Subuh
    setNextPrayer('Subuh (Besok)');
  };

  const getPrayerIcon = (prayerName: string) => {
    switch (prayerName.toLowerCase()) {
      case 'subuh':
      case 'imsak':
        return <Sunrise className="w-6 h-6" />;
      case 'terbit':
      case 'dhuha':
        return <Sun className="w-6 h-6" />;
      case 'dzuhur':
      case 'ashar':
        return <Sun className="w-6 h-6" />;
      case 'maghrib':
        return <Sunset className="w-6 h-6" />;
      case 'isya':
        return <Moon className="w-6 h-6" />;
      default:
        return <Clock className="w-6 h-6" />;
    }
  };

  const isPrayerTime = (prayerTime: string) => {
    const now = new Date();
    const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    return currentTimeStr === prayerTime;
  };

  const isNextPrayer = (prayerName: string) => {
    return nextPrayer === prayerName;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <Clock className="w-16 h-16 text-primary mx-auto mb-4 animate-spin" />
          <p className="text-elderly-lg text-muted-foreground">Memuat jadwal sholat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-bold text-primary mb-4">
          Jadwal Sholat Harian
        </h1>
        <div className="flex items-center justify-center gap-2 text-elderly-lg text-muted-foreground mb-2">
          <MapPin className="w-5 h-5" />
          <span>Jakarta, Indonesia</span>
        </div>
        <p className="text-elderly text-muted-foreground">
          {currentTime.toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </p>
        <p className="text-2xl font-semibold text-primary mt-2">
          {currentTime.toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </p>
      </div>

      {/* Next Prayer Alert */}
      {nextPrayer && (
        <div className="mb-8">
          <Card className="bg-prayer-active/10 border-prayer-active text-center">
            <CardContent className="py-6">
              <p className="text-elderly-lg font-semibold text-prayer-active">
                Sholat Selanjutnya: {nextPrayer}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Prayer Times Grid */}
      {prayerTimes && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Object.entries(prayerTimes).map(([prayerName, time]) => {
            const displayName = prayerName.charAt(0).toUpperCase() + prayerName.slice(1);
            const isActive = isPrayerTime(time);
            const isNext = isNextPrayer(displayName);
            
            return (
              <Card
                key={prayerName}
                className={`prayer-card text-center ${
                  isActive ? 'active' : isNext ? 'next' : ''
                }`}
              >
                <CardHeader className="pb-4">
                  <div className="flex justify-center mb-3">
                    {getPrayerIcon(prayerName)}
                  </div>
                  <CardTitle className="text-elderly-lg">
                    {displayName}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-primary mb-2">
                    {time}
                  </p>
                  {isActive && (
                    <p className="text-sm text-prayer-active font-semibold">
                      Waktu Sholat Sekarang
                    </p>
                  )}
                  {isNext && !isActive && (
                    <p className="text-sm text-prayer-next font-semibold">
                      Sholat Selanjutnya
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Important Notes */}
      <div className="mt-12">
        <Card className="bg-accent/20 border-accent">
          <CardHeader>
            <CardTitle className="text-elderly-lg text-center">
              Catatan Penting
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-elderly">
            <p className="text-center">
              • Jadwal sholat berdasarkan lokasi Jakarta, Indonesia
            </p>
            <p className="text-center">
              • Waktu dapat berbeda 2-3 menit tergantung lokasi spesifik
            </p>
            <p className="text-center">
              • Dianjurkan untuk memulai persiapan 10-15 menit sebelum waktu sholat
            </p>
            <div className="text-center arabic-text text-xl text-primary font-semibold mt-6">
              وَأَقِمِ الصَّلَاةَ إِنَّ الصَّلَاةَ تَنْهَىٰ عَنِ الْفَحْشَاءِ وَالْمُنكَرِ
            </div>
            <p className="text-center italic text-muted-foreground text-sm">
              "Dan laksanakanlah sholat. Sesungguhnya sholat itu mencegah dari perbuatan keji dan mungkar." (QS. Al-Ankabut: 45)
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default JadwalSholat;