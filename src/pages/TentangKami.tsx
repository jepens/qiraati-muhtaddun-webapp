import React from 'react';
import { MapPin, Phone, Mail, Clock, Heart, Users, Book } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const TentangKami: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-16">
        <h1 className="text-3xl md:text-4xl font-bold text-primary mb-6">
          Tentang Masjid Al-Muhtaddun
        </h1>
        <div className="arabic-text text-2xl text-gold font-semibold mb-4">
          وَأَنَّ الْمَسَاجِدَ لِلَّهِ فَلَا تَدْعُوا مَعَ اللَّهِ أَحَدًا
        </div>
        <p className="text-elderly italic text-muted-foreground max-w-3xl mx-auto">
          "Dan sesungguhnya masjid-masjid itu adalah kepunyaan Allah. 
          Maka janganlah kamu menyembah seseorangpun di dalamnya di samping (menyembah) Allah."
          (QS. Al-Jin: 18)
        </p>
      </div>

      {/* Sejarah */}
      <section className="mb-16">
        <Card className="bg-card border-2 border-border">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-primary text-center mb-4">
              Sejarah Singkat
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-elderly-lg leading-relaxed">
            <p>
              Masjid Al-Muhtaddun didirikan pada tahun 1995 oleh sekelompok umat Muslim 
              yang memiliki visi untuk menciptakan tempat ibadah yang tidak hanya berfungsi 
              sebagai tempat sholat, tetapi juga sebagai pusat pendidikan dan dakwah Islam.
            </p>
            <p>
              Nama "Al-Muhtaddun" yang berarti "orang-orang yang mendapat petunjuk" 
              dipilih dengan harapan bahwa masjid ini dapat menjadi tempat di mana 
              umat Muslim dapat memperoleh hidayah dan memperdalam pemahaman agama mereka.
            </p>
            <p>
              Sejak berdiri, Masjid Al-Muhtaddun telah melayani ribuan jamaah dan 
              menjadi pusat kegiatan keislaman di wilayah ini. Berbagai program 
              pendidikan, sosial, dan dakwah telah dilaksanakan untuk kesejahteraan umat.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Visi & Misi */}
      <section className="mb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Visi */}
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <Heart className="w-12 h-12 text-primary mx-auto mb-4" />
              <CardTitle className="text-2xl font-bold text-primary text-center">
                Visi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-elderly-lg text-center leading-relaxed">
                Menjadi masjid yang memakmur dalam menjalankan fungsi ibadah, 
                pendidikan, dan dakwah untuk membentuk umat yang bertakwa, 
                berilmu, dan berakhlaq mulia.
              </p>
            </CardContent>
          </Card>

          {/* Misi */}
          <Card className="bg-gold/5 border-gold/20">
            <CardHeader>
              <Book className="w-12 h-12 text-gold mx-auto mb-4" />
              <CardTitle className="text-2xl font-bold text-gold-foreground text-center">
                Misi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-elderly-lg space-y-3">
                <li>• Menyelenggarakan ibadah yang khusyuk dan berjamaah</li>
                <li>• Memberikan pendidikan agama untuk segala usia</li>
                <li>• Melaksanakan dakwah Islam dengan bijaksana</li>
                <li>• Memberdayakan umat melalui kegiatan sosial</li>
                <li>• Mempererat ukhuwah islamiyah</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Fasilitas */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-primary text-center mb-8">
          Fasilitas Masjid
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="text-center p-6">
            <Users className="w-12 h-12 text-primary mx-auto mb-4" />
            <h3 className="text-elderly-lg font-semibold mb-2">Ruang Sholat</h3>
            <p className="text-elderly text-muted-foreground">
              Kapasitas 500 jamaah dengan AC dan sound system
            </p>
          </Card>

          <Card className="text-center p-6">
            <Book className="w-12 h-12 text-primary mx-auto mb-4" />
            <h3 className="text-elderly-lg font-semibold mb-2">Perpustakaan</h3>
            <p className="text-elderly text-muted-foreground">
              Koleksi buku-buku Islam dan Al-Quran
            </p>
          </Card>

          <Card className="text-center p-6">
            <Clock className="w-12 h-12 text-primary mx-auto mb-4" />
            <h3 className="text-elderly-lg font-semibold mb-2">Ruang Kajian</h3>
            <p className="text-elderly text-muted-foreground">
              Tempat pengajian dan diskusi keislaman
            </p>
          </Card>
        </div>
      </section>

      {/* Kontak */}
      <section>
        <Card className="bg-gradient-to-br from-primary/10 to-gold/10 border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-primary text-center mb-6">
              Informasi Kontak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <MapPin className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="text-elderly-lg font-semibold mb-2">Alamat</h4>
                    <p className="text-elderly text-muted-foreground">
                      Jl. Masjid Al-Muhtaddun No. 123<br />
                      Jakarta Selatan 12345<br />
                      Indonesia
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <Phone className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="text-elderly-lg font-semibold mb-2">Telepon</h4>
                    <p className="text-elderly text-muted-foreground">
                      (021) 1234-5678<br />
                      +62 812-3456-7890
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <Mail className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="text-elderly-lg font-semibold mb-2">Email</h4>
                    <p className="text-elderly text-muted-foreground">
                      info@almuhtaddun.org<br />
                      takmir@almuhtaddun.org
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <Clock className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="text-elderly-lg font-semibold mb-2">Jam Buka</h4>
                    <p className="text-elderly text-muted-foreground">
                      24 jam (untuk ibadah)<br />
                      Kantor: 08.00 - 17.00 WIB
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 text-center">
              <div className="arabic-text text-2xl text-primary font-semibold mb-2">
                بَارَكَ اللَّهُ فِيكُمْ
              </div>
              <p className="text-elderly italic text-muted-foreground">
                Barakallahu fiikum - Semoga Allah memberkahi kalian
              </p>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default TentangKami;