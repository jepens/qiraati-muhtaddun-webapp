import React from 'react';
import { Calendar, Clock, Users, BookOpen, Heart, Star, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Kegiatan: React.FC = () => {
  const kegiatanRutin = [
    {
      icon: BookOpen,
      nama: 'Kajian Tafsir Al-Quran',
      waktu: 'Setiap Jumat, 19:30 - 21:00 WIB',
      pembimbing: 'Ustadz Ahmad Hidayat',
      deskripsi: 'Kajian mendalam tentang makna dan hikmah ayat-ayat Al-Quran',
      peserta: 'Dewasa (17+ tahun)'
    },
    {
      icon: Users,
      nama: 'Pengajian Ibu-Ibu',
      waktu: 'Setiap Rabu, 10:00 - 11:30 WIB',
      pembimbing: 'Ustadzah Fatimah',
      deskripsi: 'Kajian fiqh wanita dan pendidikan anak dalam Islam',
      peserta: 'Ibu-ibu dan remaja putri'
    },
    {
      icon: Star,
      nama: 'Tahfidz Al-Quran',
      waktu: 'Senin & Kamis, 16:00 - 17:30 WIB',
      pembimbing: 'Ustadz Mahmud',
      deskripsi: 'Program menghafal Al-Quran untuk segala usia',
      peserta: 'Anak-anak dan dewasa'
    },
    {
      icon: Heart,
      nama: 'Bakti Sosial',
      waktu: 'Minggu pertama setiap bulan',
      pembimbing: 'Tim Takmir',
      deskripsi: 'Kegiatan sosial membantu fakir miskin dan yatim piatu',
      peserta: 'Seluruh jamaah'
    }
  ];

  const kegiatanKhusus = [
    {
      nama: 'Peringatan Maulid Nabi Muhammad SAW',
      tanggal: '12 Rabiul Awwal',
      deskripsi: 'Ceramah tentang sejarah dan akhlak Rasulullah SAW'
    },
    {
      nama: 'Program Ramadan',
      tanggal: 'Sepanjang bulan Ramadan',
      deskripsi: 'Tarawih, tadarus, i\'tikaf, dan buka puasa bersama'
    },
    {
      nama: 'Peringatan Isra Mi\'raj',
      tanggal: '27 Rajab',
      deskripsi: 'Kajian tentang hikmah perjalanan malam Rasulullah SAW'
    },
    {
      nama: 'Qurban dan Idul Adha',
      tanggal: '10 Dzulhijjah',
      deskripsi: 'Penyembelihan hewan qurban dan pembagian daging'
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-16">
        <h1 className="text-3xl md:text-4xl font-bold text-primary mb-6">
          Kegiatan Masjid Al-Muhtaddun
        </h1>
        <div className="arabic-text text-2xl text-gold font-semibold mb-4">
          وَتَعَاوَنُوا عَلَى الْبِرِّ وَالتَّقْوَى
        </div>
        <p className="text-elderly italic text-muted-foreground max-w-3xl mx-auto">
          "Dan tolong-menolonglah kamu dalam (mengerjakan) kebajikan dan takwa, 
          dan jangan tolong-menolong dalam berbuat dosa dan pelanggaran."
          (QS. Al-Maidah: 2)
        </p>
      </div>

      {/* Kegiatan Rutin */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-primary text-center mb-8">
          Kegiatan Rutin Mingguan
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {kegiatanRutin.map((kegiatan, index) => {
            const Icon = kegiatan.icon;
            return (
              <Card key={index} className="prayer-card h-full">
                <CardHeader>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                      <Icon className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <CardTitle className="text-elderly-lg">{kegiatan.nama}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2 text-elderly">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span>{kegiatan.waktu}</span>
                  </div>
                  <div className="flex items-center gap-2 text-elderly">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span>Pembimbing: {kegiatan.pembimbing}</span>
                  </div>
                  <div className="flex items-center gap-2 text-elderly">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span>Peserta: {kegiatan.peserta}</span>
                  </div>
                  <p className="text-elderly text-muted-foreground leading-relaxed">
                    {kegiatan.deskripsi}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Jadwal Sholat Berjamaah */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-primary text-center mb-8">
          Jadwal Sholat Berjamaah
        </h2>
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div className="space-y-4">
                <h3 className="text-elderly-lg font-semibold text-primary">Sholat Fardhu</h3>
                <div className="space-y-2 text-elderly">
                  <p>Subuh: 04:40 WIB</p>
                  <p>Dzuhur: 12:10 WIB</p>
                  <p>Ashar: 15:20 WIB</p>
                  <p>Maghrib: 18:15 WIB</p>
                  <p>Isya: 19:30 WIB</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-elderly-lg font-semibold text-primary">Sholat Sunnah</h3>
                <div className="space-y-2 text-elderly">
                  <p>Dhuha: 07:00 - 11:00 WIB</p>
                  <p>Qiyamul Lail: 03:00 - 04:00 WIB</p>
                  <p>Tahajjud: 02:00 - 04:00 WIB</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-elderly-lg font-semibold text-primary">Sholat Jumat</h3>
                <div className="space-y-2 text-elderly">
                  <p>Khotbah I: 11:30 WIB</p>
                  <p>Khotbah II: 11:45 WIB</p>
                  <p>Sholat Jumat: 12:00 WIB</p>
                </div>
              </div>
            </div>
            
            <div className="mt-8 text-center">
              <p className="text-elderly text-muted-foreground">
                * Waktu dapat berubah menyesuaikan jadwal sholat harian
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Kegiatan Khusus */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-primary text-center mb-8">
          Kegiatan Khusus & Peringatan
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {kegiatanKhusus.map((kegiatan, index) => (
            <Card key={index} className="bg-gold/5 border-gold/20">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Calendar className="w-6 h-6 text-gold" />
                  <CardTitle className="text-elderly-lg text-gold-foreground">
                    {kegiatan.nama}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-elderly font-semibold text-gold-foreground mb-2">
                  {kegiatan.tanggal}
                </p>
                <p className="text-elderly text-muted-foreground">
                  {kegiatan.deskripsi}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Panduan Kegiatan */}
      <section>
        <Card className="bg-accent/20 border-accent">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-primary text-center">
              Panduan Mengikuti Kegiatan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-elderly-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h4 className="font-semibold text-primary mb-3">Untuk Jamaah Baru:</h4>
                <ul className="space-y-2 text-elderly">
                  <li>• Datang 15 menit sebelum kegiatan dimulai</li>
                  <li>• Berpakaian sopan dan menutup aurat</li>
                  <li>• Membawa Al-Quran dan alat tulis</li>
                  <li>• Silakan bertanya kepada takmir masjid</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-primary mb-3">Fasilitas Tersedia:</h4>
                <ul className="space-y-2 text-elderly">
                  <li>• Tempat parkir yang aman</li>
                  <li>• Tempat wudhu yang bersih</li>
                  <li>• Mukena untuk jamaah wanita</li>
                  <li>• Sound system dan AC</li>
                </ul>
              </div>
            </div>
            
            <div className="text-center mt-8 p-6 bg-primary/10 rounded-xl">
              <h4 className="font-semibold text-primary mb-3">Informasi & Pendaftaran</h4>
              <p className="text-elderly">
                Untuk informasi lebih lanjut atau pendaftaran kegiatan, 
                silakan hubungi takmir masjid di nomor (021) 1234-5678 
                atau datang langsung ke kantor masjid.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default Kegiatan;