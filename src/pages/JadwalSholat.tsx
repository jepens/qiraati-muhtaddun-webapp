import React, { useState, useEffect } from 'react';
import {
  Clock, MapPin, Sunrise, Sun, Sunset, Moon,
  Calendar as CalendarIcon, Bell
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { getProvinces, getCities, getPrayerSchedule, PrayerSchedule } from '@/services/prayerTimeService';

const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

const JadwalSholat: React.FC = () => {
  const { toast } = useToast();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [nextPrayer, setNextPrayer] = useState<string>('');

  // Data State
  const [provinces, setProvinces] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [monthlySchedule, setMonthlySchedule] = useState<PrayerSchedule[]>([]);
  const [todaySchedule, setTodaySchedule] = useState<PrayerSchedule | null>(null);

  // Selection State
  const [selectedProvince, setSelectedProvince] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>(String(new Date().getMonth() + 1));
  const [selectedYear] = useState<string>(String(new Date().getFullYear()));

  const [loading, setLoading] = useState(false);

  // Load saved location from local storage on mount
  useEffect(() => {
    const savedProvince = localStorage.getItem('jadwal_sholat_province');
    const savedCity = localStorage.getItem('jadwal_sholat_city');

    // Fetch provinces first
    const fetchProvinces = async () => {
      const data = await getProvinces();
      setProvinces(data);

      if (savedProvince && data.includes(savedProvince)) {
        setSelectedProvince(savedProvince);
        // Fetch cities for saved province
        const cityData = await getCities(savedProvince);
        setCities(cityData);

        if (savedCity && cityData.includes(savedCity)) {
          setSelectedCity(savedCity);
        }
      } else if (data.length > 0) {
        const jakarta = data.find(p => p.toLowerCase().includes('jakarta'));
        if (jakarta) setSelectedProvince(jakarta);
      }
    };

    fetchProvinces();
  }, []);

  // Fetch Cities when Province changes
  const handleProvinceChange = async (province: string) => {
    setSelectedProvince(province);
    setSelectedCity('');
    localStorage.setItem('jadwal_sholat_province', province);
    localStorage.removeItem('jadwal_sholat_city');

    const data = await getCities(province);
    setCities(data);
  };

  const handleCityChange = (city: string) => {
    setSelectedCity(city);
    localStorage.setItem('jadwal_sholat_city', city);
  };

  // Fetch Schedule
  useEffect(() => {
    if (selectedProvince && selectedCity) {
      setLoading(true);
      getPrayerSchedule(
        selectedProvince,
        selectedCity,
        parseInt(selectedMonth),
        parseInt(selectedYear)
      ).then(data => {
        if (data) {
          setMonthlySchedule(data.jadwal);
          // Find today's schedule
          const today = new Date();
          const year = today.getFullYear();
          const month = String(today.getMonth() + 1).padStart(2, '0');
          const day = String(today.getDate()).padStart(2, '0');
          const todayIso = `${year}-${month}-${day}`;

          const todayData = data.jadwal.find(s => s.tanggal_lengkap === todayIso);
          setTodaySchedule(todayData || null);

          if (todayData) {
            calculateNextPrayer(todayData);
          }
        }
        setLoading(false);
      }).catch(err => {
        console.error(err);
        setLoading(false);
        toast({
          title: "Error",
          description: "Gagal memuat jadwal sholat.",
          variant: "destructive",
        });
      });
    }
  }, [selectedProvince, selectedCity, selectedMonth, selectedYear, toast]);

  // Timer for current time and next prayer calculation
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      if (todaySchedule) {
        calculateNextPrayer(todaySchedule);
      }
    }, 1000); // Update every second for countdown

    return () => clearInterval(timer);
  }, [todaySchedule]);

  const calculateNextPrayer = (times: PrayerSchedule) => {
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
    setNextPrayer('Subuh');
  };

  const getPrayerIcon = (prayerName: string) => {
    switch (prayerName.toLowerCase()) {
      case 'subuh':
      case 'imsak': return <Sunrise className="w-6 h-6" />;
      case 'terbit':
      case 'dhuha': return <Sun className="w-6 h-6" />;
      case 'dzuhur':
      case 'ashar': return <Sun className="w-6 h-6" />;
      case 'maghrib': return <Sunset className="w-6 h-6" />;
      case 'isya': return <Moon className="w-6 h-6" />;
      default: return <Clock className="w-6 h-6" />;
    }
  };

  const getTimeUntilNextPrayer = () => {
    if (!todaySchedule || !nextPrayer) return '';

    const now = new Date();
    // const currentTimeMinutes = now.getHours() * 60 + now.getMinutes();
    const currentSeconds = now.getSeconds();

    let targetTime = '';

    if (nextPrayer === 'Subuh') {
      if (now.getHours() > 20) { // Late night, assume tomorrow
        targetTime = todaySchedule.subuh;
      } else {
        targetTime = todaySchedule.subuh;
      }
    } else {
      const prayers = [
        { name: 'Subuh', time: todaySchedule.subuh },
        { name: 'Dzuhur', time: todaySchedule.dzuhur },
        { name: 'Ashar', time: todaySchedule.ashar },
        { name: 'Maghrib', time: todaySchedule.maghrib },
        { name: 'Isya', time: todaySchedule.isya }
      ];
      targetTime = prayers.find(p => p.name === nextPrayer)?.time || '';
    }

    if (!targetTime) return '';

    let [hours, minutes] = targetTime.split(':').map(Number);
    let targetTotalSeconds = hours * 3600 + minutes * 60;
    const currentTotalSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + currentSeconds;

    if (currentTotalSeconds > targetTotalSeconds) {
      // Target is tomorrow
      targetTotalSeconds += 24 * 3600;
    }

    const diffSeconds = targetTotalSeconds - currentTotalSeconds;

    const h = Math.floor(diffSeconds / 3600);
    const m = Math.floor((diffSeconds % 3600) / 60);
    const s = diffSeconds % 60;

    return `${String(h).padStart(2, '0')} : ${String(m).padStart(2, '0')} : ${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">

      {/* 1. Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
              <MapPin className="w-4 h-4 text-primary" /> Pilih Provinsi
            </CardTitle>
            <p className="text-xs text-muted-foreground/60">Pilih provinsi tempat tinggal Anda</p>
          </CardHeader>
          <CardContent>
            <Select value={selectedProvince} onValueChange={handleProvinceChange}>
              <SelectTrigger className="w-full bg-background border-input">
                <SelectValue placeholder="Pilih Provinsi" />
              </SelectTrigger>
              <SelectContent>
                {provinces.map((prov) => (
                  <SelectItem key={prov} value={prov}>{prov}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
              <MapPin className="w-4 h-4 text-primary" /> Pilih Kabupaten/Kota
            </CardTitle>
            <p className="text-xs text-muted-foreground/60">Pilih kabupaten atau kota</p>
          </CardHeader>
          <CardContent>
            <Select value={selectedCity} onValueChange={handleCityChange} disabled={!selectedProvince}>
              <SelectTrigger className="w-full bg-background border-input">
                <SelectValue placeholder={!selectedProvince ? "-- Pilih Provinsi --" : "Pilih Kabupaten/Kota"} />
              </SelectTrigger>
              <SelectContent>
                {cities.map((city) => (
                  <SelectItem key={city} value={city}>{city}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
              <CalendarIcon className="w-4 h-4 text-primary" /> Pilih Bulan
            </CardTitle>
            <p className="text-xs text-muted-foreground/60">Pilih bulan yang ingin dilihat</p>
          </CardHeader>
          <CardContent>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-full bg-background border-input">
                <SelectValue placeholder="Pilih Bulan" />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((month, index) => (
                  <SelectItem key={index} value={String(index + 1)}>{month}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      {!selectedCity ? (
        <Card className="border-dashed py-12 text-center bg-accent/5 mt-8">
          <CardContent>
            <Clock className="w-12 h-12 mx-auto text-primary mb-4" />
            <h3 className="text-lg font-medium text-foreground">Pilih Lokasi Anda</h3>
            <p className="text-muted-foreground">Pilih provinsi dan kabupaten/kota untuk melihat jadwal shalat bulanan</p>
          </CardContent>
        </Card>
      ) : loading ? (
        <div className="text-center py-12">
          <Clock className="w-10 h-10 animate-spin mx-auto text-primary mb-4" />
          <p className="text-muted-foreground">Memuat data...</p>
        </div>
      ) : (
        <>
          {/* 2. Next Prayer Alert Banner */}
          {todaySchedule && nextPrayer && (
            <div className="relative overflow-hidden rounded-xl border border-primary/20 bg-background/50 p-1">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 md:px-8 bg-card/40 rounded-lg backdrop-blur-sm">

                {/* Left: Icon & Next Prayer Name */}
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                    <Bell className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Shalat Berikutnya</p>
                    <h2 className="text-2xl font-bold text-primary">{nextPrayer}</h2>
                  </div>
                </div>

                {/* Center: Countdown */}
                <div className="flex items-center gap-3">
                  <span className="text-4xl md:text-5xl font-mono font-bold text-primary tracking-widest tabular-nums">
                    {getTimeUntilNextPrayer()}
                  </span>
                  {todaySchedule && (
                    <Badge variant="outline" className="rounded-full px-3 py-1 text-xs border-primary/30 text-primary">
                      {
                        (todaySchedule as any)[nextPrayer.toLowerCase() === 'subuh (besok)' ? 'subuh' : nextPrayer.toLowerCase()]
                      }
                    </Badge>
                  )}
                </div>

                {/* Right: Current Time */}
                <div className="text-right hidden md:block">
                  <p className="text-xs text-muted-foreground">Sekarang</p>
                  <p className="text-xl font-medium text-foreground tracking-wide tabular-nums">
                    {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(/\./g, ':')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 3. Today's Schedule Grid */}
          {todaySchedule && (
            <div className="space-y-4 pt-4">
              <div className="flex items-center gap-3">
                <Sun className="w-6 h-6 text-primary" />
                <h2 className="text-xl font-bold">Jadwal Shalat Hari Ini</h2>
                <Badge className="bg-primary hover:bg-primary/90 text-primary-foreground border-none rounded-full px-4">
                  {todaySchedule.hari}, {todaySchedule.tanggal} {MONTHS[parseInt(todaySchedule.tanggal_lengkap.split('-')[1]) - 1]} {todaySchedule.tanggal_lengkap.split('-')[0]}
                </Badge>
              </div>
              <p className="text-muted-foreground text-sm">
                {selectedCity}, {selectedProvince}
              </p>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                  { label: "Subuh", time: todaySchedule.subuh },
                  { label: "Dzuhur", time: todaySchedule.dzuhur },
                  { label: "Ashar", time: todaySchedule.ashar },
                  { label: "Maghrib", time: todaySchedule.maghrib },
                  { label: "Isya", time: todaySchedule.isya },
                ].map((item) => {
                  const isNext = nextPrayer === item.label || (nextPrayer === 'Subuh (Besok)' && item.label === 'Subuh');
                  return (
                    <div
                      key={item.label}
                      className={`relative group overflow-hidden rounded-xl border p-6 text-center transition-all duration-300 ${isNext
                        ? "border-primary bg-primary/5 shadow-lg shadow-primary/5 ring-1 ring-primary"
                        : "border-border bg-card hover:border-primary/50"
                        }`}
                    >
                      <div className={`mb-3 flex justify-center ${isNext ? 'text-primary' : 'text-muted-foreground'}`}>
                        {getPrayerIcon(item.label)}
                      </div>
                      <p className={`text-sm font-medium mb-1 ${isNext ? 'text-primary' : 'text-muted-foreground'}`}>
                        {item.label}
                      </p>
                      <p className={`text-3xl font-bold tracking-tight ${isNext ? 'text-primary' : 'text-foreground'}`}>
                        {item.time}
                      </p>
                      {isNext && (
                        <div className="absolute inset-0 bg-primary/5 animate-pulse" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4. Monthly Schedule Table */}
          <div className="space-y-4 pt-8">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-primary" />
                  Jadwal Shalat {MONTHS[parseInt(selectedMonth) - 1]} {selectedYear}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {selectedCity}, {selectedProvince} • {monthlySchedule.length} hari
                </p>
              </div>

            </div>

            <Card className="overflow-hidden border-border bg-card">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow className="hover:bg-transparent border-border">
                      <TableHead className="w-[50px] font-bold text-foreground">Tgl</TableHead>
                      <TableHead className="font-bold text-foreground">Hari</TableHead>
                      <TableHead className="text-center text-warning font-medium">Imsak</TableHead>
                      <TableHead className="text-center text-primary font-bold">Subuh</TableHead>
                      <TableHead className="text-center text-muted-foreground">Terbit</TableHead>
                      <TableHead className="text-center text-muted-foreground">Dhuha</TableHead>
                      <TableHead className="text-center text-primary font-bold">Dzuhur</TableHead>
                      <TableHead className="text-center text-primary font-bold">Ashar</TableHead>
                      <TableHead className="text-center text-orange-500 font-bold">Maghrib</TableHead>
                      <TableHead className="text-center text-indigo-400 font-bold">Isya</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {monthlySchedule.map((schedule) => {
                      // Construct local date to match
                      const today = new Date();
                      const year = today.getFullYear();
                      const month = String(today.getMonth() + 1).padStart(2, '0');
                      const day = String(today.getDate()).padStart(2, '0');
                      const todayIso = `${year}-${month}-${day}`;

                      const isToday = schedule.tanggal_lengkap === todayIso;

                      return (
                        <TableRow
                          key={schedule.tanggal_lengkap}
                          className={`border-b border-border/50 hover:bg-muted/30 transition-colors ${isToday ? "bg-primary/10 hover:bg-primary/20" : ""
                            }`}
                        >
                          <TableCell className="font-medium text-foreground">
                            {schedule.tanggal}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className={isToday ? "font-bold text-primary" : "text-muted-foreground"}>
                                {schedule.hari}
                              </span>
                              {isToday && (
                                <Badge variant="secondary" className="bg-primary text-primary-foreground hover:bg-primary/90 text-[10px] h-5 px-1.5 py-0">
                                  Hari ini
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center text-warning/90 font-medium">{schedule.imsak}</TableCell>
                          <TableCell className="text-center font-bold text-primary">{schedule.subuh}</TableCell>
                          <TableCell className="text-center text-muted-foreground text-sm">{schedule.terbit}</TableCell>
                          <TableCell className="text-center text-muted-foreground text-sm">{schedule.dhuha}</TableCell>
                          <TableCell className="text-center font-bold text-primary">{schedule.dzuhur}</TableCell>
                          <TableCell className="text-center font-bold text-primary">{schedule.ashar}</TableCell>
                          <TableCell className="text-center font-bold text-orange-500">{schedule.maghrib}</TableCell>
                          <TableCell className="text-center font-bold text-indigo-400">{schedule.isya}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default JadwalSholat;