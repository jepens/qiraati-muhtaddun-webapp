import React, { useState, useEffect } from 'react';
import { Clock, MapPin, Sunrise, Sun, Sunset, Moon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { API_BASE_URL } from '@/lib/config';

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

interface PrayerScheduleResponse {
  status: boolean;
  request: {
    path: string;
  };
  data: {
    id: string;
    lokasi: string;
    daerah: string;
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
      date: string;
    };
  };
}

// Backend API base URL
// const API_BASE_URL = 'http://localhost:3001';

const JadwalSholat: React.FC = () => {
  const [prayerTimes, setPrayerTimes] = useState<PrayerTime | null>(null);
  const [location, setLocation] = useState<string>('');
  const [prayerDate, setPrayerDate] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [nextPrayer, setNextPrayer] = useState<string>('');
  const { toast } = useToast();

  // Update current time and recalculate next prayer every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      // Recalculate next prayer if we have prayer times
      if (prayerTimes) {
        calculateNextPrayer(prayerTimes);
      }
    }, 60000);

    return () => clearInterval(timer);
  }, [prayerTimes]);

  // Fetch prayer times from backend API
  useEffect(() => {
    const fetchPrayerTimes = async () => {
      try {
        setLoading(true);
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const date = String(now.getDate()).padStart(2, '0');
        
        const response = await fetch(`${API_BASE_URL}/api/prayer-times/${year}/${month}/${date}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch prayer times');
        }
        
        const result: PrayerScheduleResponse = await response.json();
        
        if (result.status && result.data) {
          const { jadwal, lokasi, daerah } = result.data;
          
          // Set prayer times from API response
          setPrayerTimes({
            imsak: jadwal.imsak,
            subuh: jadwal.subuh,
            terbit: jadwal.terbit,
            dhuha: jadwal.dhuha,
            dzuhur: jadwal.dzuhur,
            ashar: jadwal.ashar,
            maghrib: jadwal.maghrib,
            isya: jadwal.isya
          });
          
          // Set location info
          setLocation(`${lokasi}, ${daerah}`);
          setPrayerDate(jadwal.tanggal);
          
          // Calculate next prayer
          calculateNextPrayer({
            imsak: jadwal.imsak,
            subuh: jadwal.subuh,
            terbit: jadwal.terbit,
            dhuha: jadwal.dhuha,
            dzuhur: jadwal.dzuhur,
            ashar: jadwal.ashar,
            maghrib: jadwal.maghrib,
            isya: jadwal.isya
          });
          
        } else {
          throw new Error('Invalid response format');
        }
        
      } catch (error) {
        console.error('Error fetching prayer times:', error);
        toast({
          title: "Error",
          description: "Gagal memuat jadwal sholat. Menggunakan data fallback.",
          variant: "destructive",
        });
        
        // Fallback to mock data if API fails
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
        setLocation('Jakarta, Indonesia');
        setPrayerDate('Data Fallback');
        calculateNextPrayer(mockPrayerTimes);
        
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

    // Find the next prayer
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
    // Allow 5 minutes window for prayer time notification
    const [hours, minutes] = prayerTime.split(':').map(Number);
    const prayerTimeMinutes = hours * 60 + minutes;
    const currentTimeMinutes = now.getHours() * 60 + now.getMinutes();
    
    return Math.abs(currentTimeMinutes - prayerTimeMinutes) <= 5;
  };

  const isNextPrayer = (prayerName: string) => {
    return nextPrayer === prayerName;
  };

  const getTimeUntilNextPrayer = () => {
    if (!prayerTimes || !nextPrayer || nextPrayer === 'Subuh (Besok)') return '';
    
    const now = new Date();
    const currentTimeMinutes = now.getHours() * 60 + now.getMinutes();
    
    const prayers = [
      { name: 'Subuh', time: prayerTimes.subuh },
      { name: 'Dzuhur', time: prayerTimes.dzuhur },
      { name: 'Ashar', time: prayerTimes.ashar },
      { name: 'Maghrib', time: prayerTimes.maghrib },
      { name: 'Isya', time: prayerTimes.isya }
    ];

    const nextPrayerTime = prayers.find(p => p.name === nextPrayer)?.time;
    if (!nextPrayerTime) return '';

    const [hours, minutes] = nextPrayerTime.split(':').map(Number);
    const nextPrayerMinutes = hours * 60 + minutes;
    const diffMinutes = nextPrayerMinutes - currentTimeMinutes;
    
    if (diffMinutes <= 0) return '';
    
    const diffHours = Math.floor(diffMinutes / 60);
    const remainingMinutes = diffMinutes % 60;
    
    if (diffHours > 0) {
      return `${diffHours} jam ${remainingMinutes} menit lagi`;
    } else {
      return `${remainingMinutes} menit lagi`;
    }
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
          <span>{location || 'Jakarta, Indonesia'}</span>
        </div>
        <p className="text-elderly text-muted-foreground">
          {prayerDate || currentTime.toLocaleDateString('id-ID', {
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
              {getTimeUntilNextPrayer() && (
                <p className="text-elderly text-prayer-active mt-2">
                  {getTimeUntilNextPrayer()}
                </p>
              )}
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
                className={`prayer-card ${isActive ? 'active' : ''} ${isNext ? 'border-prayer-active' : ''}`}
              >
                <CardHeader className="text-center pb-3">
                  <div className="flex justify-center mb-2">
                    {getPrayerIcon(prayerName)}
                  </div>
                  <CardTitle className="text-elderly-lg text-primary">
                    {displayName}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-3xl font-bold text-primary mb-2">
                    {time}
                  </p>
                  {isNext && (
                    <p className="text-sm text-prayer-active font-semibold">
                      Sholat Selanjutnya
                    </p>
                  )}
                  {isActive && (
                    <p className="text-sm text-prayer-active font-semibold animate-pulse">
                      Waktu Sholat
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Footer Info */}
      <div className="mt-12 text-center">
        <Card className="bg-accent/10 border-accent">
          <CardContent className="py-6">
            <p className="text-elderly text-muted-foreground mb-2">
              <strong>Catatan:</strong> Jadwal sholat berdasarkan perhitungan untuk wilayah Jakarta.
            </p>
            <p className="text-elderly text-muted-foreground">
              Mohon sesuaikan dengan kondisi dan ketentuan setempat.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default JadwalSholat;