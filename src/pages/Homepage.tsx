import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Clock, Users, Building2, Heart } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const Homepage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <section className="text-center mb-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-primary mb-6">
            السَّلاَمُ عَلَيْكُمْ وَرَحْمَةُ اللهِ وَبَرَكَاتُهُ
          </h1>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
            Selamat Datang di Masjid Al-Muhtaddun
          </h2>
          <p className="text-elderly-lg text-muted-foreground mb-8 leading-relaxed">
            Rumah Allah yang menyediakan tempat ibadah yang khusyuk, kajian Islam, 
            dan berbagai kegiatan untuk mempererat ukhuwah islamiyah.
          </p>
          
          {/* Qiraati CTA Button */}
          <div className="mb-12">
            <Link
              to="/qiraati"
              className="btn-qiraati inline-flex items-center gap-4 no-underline"
            >
              <BookOpen className="w-8 h-8" />
              <div className="text-left">
                <div className="text-xl font-bold">Aplikasi Qiraati</div>
                <div className="text-lg opacity-90">Baca Al-Quran dengan Suara</div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Quick Access Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
        <Link to="/jadwal-sholat" className="no-underline">
          <Card className="prayer-card hover:transform hover:scale-105 cursor-pointer h-full">
            <CardHeader className="text-center">
              <Clock className="w-12 h-12 text-primary mx-auto mb-4" />
              <CardTitle className="text-elderly-lg">Jadwal Sholat</CardTitle>
              <CardDescription className="text-elderly">
                Lihat waktu sholat hari ini
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground">
                Waktu sholat terkini untuk Jakarta
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/kegiatan" className="no-underline">
          <Card className="prayer-card hover:transform hover:scale-105 cursor-pointer h-full">
            <CardHeader className="text-center">
              <Users className="w-12 h-12 text-primary mx-auto mb-4" />
              <CardTitle className="text-elderly-lg">Kegiatan Masjid</CardTitle>
              <CardDescription className="text-elderly">
                Program dan acara rutin
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground">
                Kajian, pengajian, dan kegiatan sosial
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/tentang-kami" className="no-underline">
          <Card className="prayer-card hover:transform hover:scale-105 cursor-pointer h-full">
            <CardHeader className="text-center">
              <Building2 className="w-12 h-12 text-primary mx-auto mb-4" />
              <CardTitle className="text-elderly-lg">Tentang Kami</CardTitle>
              <CardDescription className="text-elderly">
                Sejarah dan visi misi
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground">
                Mengenal lebih dekat Masjid Al-Muhtaddun
              </p>
            </CardContent>
          </Card>
        </Link>
      </section>

      {/* Welcome Message */}
      <section className="bg-card rounded-2xl p-8 mb-16 border-2 border-border">
        <div className="text-center">
          <Heart className="w-16 h-16 text-gold mx-auto mb-6" />
          <h3 className="text-2xl font-bold text-primary mb-6">
            Selamat Datang di Rumah Allah
          </h3>
          <div className="max-w-3xl mx-auto">
            <p className="text-elderly-lg text-muted-foreground mb-6 leading-relaxed">
              Masjid Al-Muhtaddun adalah tempat ibadah yang terbuka untuk semua umat Muslim. 
              Kami menyediakan fasilitas sholat yang nyaman, kajian rutin, dan berbagai 
              kegiatan untuk memperkuat ukhuwah islamiyah.
            </p>
            <div className="text-center arabic-text text-2xl text-primary font-semibold mb-4">
              إِنَّمَا يَعْمُرُ مَسَاجِدَ اللَّهِ مَنْ آمَنَ بِاللَّهِ وَالْيَوْمِ الْآخِرِ
            </div>
            <p className="text-elderly italic text-muted-foreground">
              "Sesungguhnya yang memakmurkan masjid-masjid Allah hanyalah orang-orang 
              yang beriman kepada Allah dan hari akhir." (QS. At-Taubah: 18)
            </p>
          </div>
        </div>
      </section>

      {/* Announcements */}
      <section>
        <h3 className="text-2xl font-bold text-primary mb-6 text-center">
          Pengumuman Terkini
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-accent/20 border-accent">
            <CardHeader>
              <CardTitle className="text-elderly-lg text-accent-foreground">
                Kajian Rutin Jumat
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-elderly text-muted-foreground">
                Setiap Jumat setelah Maghrib - Kajian Tafsir Al-Quran bersama Ustadz Ahmad
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gold/20 border-gold">
            <CardHeader>
              <CardTitle className="text-elderly-lg text-gold-foreground">
                Sholat Tarawih Ramadan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-elderly text-muted-foreground">
                Program khusus bulan Ramadan - Sholat Tarawih dan tadarus Al-Quran
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Homepage;