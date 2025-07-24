-- Create homepage_content table
CREATE TABLE IF NOT EXISTS homepage_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  arabic_greeting TEXT NOT NULL DEFAULT 'السَّلاَمُ عَلَيْكُمْ وَرَحْمَةُ اللهِ وَبَرَكَاتُهُ',
  main_title TEXT NOT NULL DEFAULT 'Selamat Datang di Masjid Al-Muhtaddun',
  main_description TEXT NOT NULL DEFAULT 'Rumah Allah yang menyediakan tempat ibadah yang khusyuk, kajian Islam, dan berbagai kegiatan untuk mempererat ukhuwah islamiyah.',
  qiraati_title TEXT NOT NULL DEFAULT 'Aplikasi Qiraati',
  qiraati_subtitle TEXT NOT NULL DEFAULT 'Baca Al-Quran dengan Suara',
  welcome_title TEXT NOT NULL DEFAULT 'Selamat Datang di Rumah Allah',
  welcome_description TEXT NOT NULL DEFAULT 'Masjid Al-Muhtaddun adalah tempat ibadah yang terbuka untuk semua umat Muslim. Kami menyediakan fasilitas sholat yang nyaman, kajian rutin, dan berbagai kegiatan untuk memperkuat ukhuwah islamiyah.',
  quran_verse_arabic TEXT NOT NULL DEFAULT 'إِنَّمَا يَعْمُرُ مَسَاجِدَ اللَّهِ مَنْ آمَنَ بِاللَّهِ وَالْيَوْمِ الْآخِرِ',
  quran_verse_translation TEXT NOT NULL DEFAULT '"Sesungguhnya yang memakmurkan masjid-masjid Allah hanyalah orang-orang yang beriman kepada Allah dan hari akhir."',
  quran_verse_reference TEXT NOT NULL DEFAULT '(QS. At-Taubah: 18)',
  announcements JSONB NOT NULL DEFAULT '[
    {
      "title": "Kajian Rutin Jumat",
      "description": "Setiap Jumat setelah Maghrib - Kajian Tafsir Al-Quran bersama Ustadz Ahmad",
      "type": "primary"
    },
    {
      "title": "Sholat Tarawih Ramadan",
      "description": "Program khusus bulan Ramadan - Sholat Tarawih dan tadarus Al-Quran",
      "type": "secondary"
    }
  ]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default homepage content
INSERT INTO homepage_content (id) VALUES (gen_random_uuid()) 
ON CONFLICT DO NOTHING;

-- Add RLS (Row Level Security)
ALTER TABLE homepage_content ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all users" ON homepage_content
  FOR SELECT USING (true);

CREATE POLICY "Enable write access for authenticated users only" ON homepage_content
  FOR ALL USING (auth.role() = 'authenticated');

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_homepage_content_updated_at 
  BEFORE UPDATE ON homepage_content 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 