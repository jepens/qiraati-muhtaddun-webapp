import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Clock, Users, Building2, Heart, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useHomepage } from '@/hooks/useHomepage';

const Homepage: React.FC = () => {
  const { content, loading } = useHomepage();

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Memuat konten beranda...</p>
        </div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-muted-foreground">Konten beranda tidak tersedia.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <section className="text-center mb-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-primary mb-6">
            {content.arabic_greeting}
          </h1>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
            {content.main_title}
          </h2>
          <p className="text-elderly-lg text-muted-foreground mb-8 leading-relaxed">
            {content.main_description}
          </p>
          
          {/* Qiraati CTA Button */}
          <div className="mb-12">
            <Link
              to="/qiraati"
              className="btn-qiraati inline-flex items-center gap-4 no-underline"
            >
              <BookOpen className="w-8 h-8" />
              <div className="text-left">
                <div className="text-xl font-bold">{content.qiraati_title}</div>
                <div className="text-lg opacity-90">{content.qiraati_subtitle}</div>
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
            {content.welcome_title}
          </h3>
          <div className="max-w-3xl mx-auto">
            <p className="text-elderly-lg text-muted-foreground mb-6 leading-relaxed">
              {content.welcome_description}
            </p>
            <div className="text-center arabic-text text-2xl text-primary font-semibold mb-4">
              {content.quran_verse_arabic}
            </div>
            <p className="text-elderly italic text-muted-foreground">
              {content.quran_verse_translation} {content.quran_verse_reference}
            </p>
          </div>
        </div>
      </section>

      {/* Announcements */}
      {content.announcements && content.announcements.length > 0 && (
        <section>
          <h3 className="text-2xl font-bold text-primary mb-6 text-center">
            Pengumuman Terkini
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {content.announcements.map((announcement, index) => (
              <Card 
                key={index}
                className={
                  announcement.type === 'primary' 
                    ? "bg-accent/20 border-accent" 
                    : "bg-gold/20 border-gold"
                }
              >
                <CardHeader>
                  <CardTitle className={
                    announcement.type === 'primary'
                      ? "text-elderly-lg text-accent-foreground"
                      : "text-elderly-lg text-gold-foreground"
                  }>
                    {announcement.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-elderly text-muted-foreground">
                    {announcement.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default Homepage;