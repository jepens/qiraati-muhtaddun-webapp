import React, { useEffect, useState } from 'react';
import { MapPin, Phone, Mail, Clock, Heart, Users, Book } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import type { AboutContent, Facility } from '@/types/database.types';
import { Loader2 } from 'lucide-react';
import { Icons } from '@/components/icons';

const TentangKami: React.FC = () => {
  const [content, setContent] = useState<AboutContent | null>(null);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContent();
    fetchFacilities();
  }, []);

  const fetchContent = async () => {
    try {
      const { data, error } = await supabase
        .from('about_content')
        .select('*')
        .single();

      if (error) throw error;
      setContent(data);
    } catch (error) {
      console.error('Error fetching content:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFacilities = async () => {
    try {
      const { data, error } = await supabase
        .from('facilities')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setFacilities(data || []);
    } catch (error) {
      console.error('Error fetching facilities:', error);
    }
  };

  const IconComponent = ({ name }: { name: Facility['icon_name'] }) => {
    const Icon = Icons[name];
    return Icon ? <Icon className="w-12 h-12 text-primary mx-auto mb-4" /> : null;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

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
            <p>{content?.history_text}</p>
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
                {content?.vision_text}
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
                {content?.mission_items.map((item, index) => (
                  <li key={index}>• {item}</li>
                ))}
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
          {facilities.map((facility) => (
            <Card key={facility.id} className="text-center p-6">
              <IconComponent name={facility.icon_name} />
              <h3 className="text-elderly-lg font-semibold mb-2">{facility.name}</h3>
            <p className="text-elderly text-muted-foreground">
                {facility.description}
            </p>
          </Card>
          ))}
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
                    <p className="text-elderly text-muted-foreground whitespace-pre-line">
                      {content?.address}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <Phone className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="text-elderly-lg font-semibold mb-2">Telepon</h4>
                    <p className="text-elderly text-muted-foreground whitespace-pre-line">
                      {content?.phone}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <Mail className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="text-elderly-lg font-semibold mb-2">Email</h4>
                    <p className="text-elderly text-muted-foreground whitespace-pre-line">
                      {content?.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <Clock className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="text-elderly-lg font-semibold mb-2">Jam Buka</h4>
                    <p className="text-elderly text-muted-foreground whitespace-pre-line">
                      {content?.office_hours}
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