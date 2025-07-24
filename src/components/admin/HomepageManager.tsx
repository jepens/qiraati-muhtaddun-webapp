import React, { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus, Trash2, Save } from 'lucide-react';
import { useHomepage } from '@/hooks/useHomepage';
import type { HomepageContent } from '@/types/database.types';

const HomepageManager: React.FC = () => {
  const { toast } = useToast();
  const { content, loading, updateContent } = useHomepage();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<HomepageContent>>({});
  const [announcements, setAnnouncements] = useState<HomepageContent['announcements']>([]);

  useEffect(() => {
    if (content) {
      setFormData({
        arabic_greeting: content.arabic_greeting,
        main_title: content.main_title,
        main_description: content.main_description,
        qiraati_title: content.qiraati_title,
        qiraati_subtitle: content.qiraati_subtitle,
        welcome_title: content.welcome_title,
        welcome_description: content.welcome_description,
        quran_verse_arabic: content.quran_verse_arabic,
        quran_verse_translation: content.quran_verse_translation,
        quran_verse_reference: content.quran_verse_reference,
      });
      setAnnouncements(content.announcements || []);
    }
  }, [content]);

  const handleInputChange = (field: keyof HomepageContent, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAnnouncementChange = (index: number, field: 'title' | 'description' | 'type', value: string) => {
    const newAnnouncements = [...announcements];
    newAnnouncements[index] = { ...newAnnouncements[index], [field]: value };
    setAnnouncements(newAnnouncements);
  };

  const addAnnouncement = () => {
    setAnnouncements([...announcements, { title: '', description: '', type: 'primary' }]);
  };

  const removeAnnouncement = (index: number) => {
    setAnnouncements(announcements.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const result = await updateContent({
        ...formData,
        announcements,
      });

      if (result.success) {
        toast({
          title: "Berhasil",
          description: "Konten beranda berhasil diperbarui.",
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error updating homepage content:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Gagal memperbarui konten beranda. Silakan coba lagi.",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Memuat konten beranda...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs defaultValue="hero" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="hero">Hero Section</TabsTrigger>
          <TabsTrigger value="qiraati">Qiraati</TabsTrigger>
          <TabsTrigger value="welcome">Welcome</TabsTrigger>
          <TabsTrigger value="announcements">Pengumuman</TabsTrigger>
        </TabsList>

        <TabsContent value="hero" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Hero Section</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="arabic_greeting">Salam dalam Bahasa Arab</Label>
                <Input
                  id="arabic_greeting"
                  value={formData.arabic_greeting || ''}
                  onChange={(e) => handleInputChange('arabic_greeting', e.target.value)}
                  placeholder="السَّلاَمُ عَلَيْكُمْ وَرَحْمَةُ اللهِ وَبَرَكَاتُهُ"
                  className="text-right"
                  dir="rtl"
                />
              </div>

              <div>
                <Label htmlFor="main_title">Judul Utama</Label>
                <Input
                  id="main_title"
                  value={formData.main_title || ''}
                  onChange={(e) => handleInputChange('main_title', e.target.value)}
                  placeholder="Selamat Datang di Masjid Al-Muhtaddun"
                />
              </div>

              <div>
                <Label htmlFor="main_description">Deskripsi Utama</Label>
                <Textarea
                  id="main_description"
                  value={formData.main_description || ''}
                  onChange={(e) => handleInputChange('main_description', e.target.value)}
                  placeholder="Deskripsi singkat tentang masjid..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="qiraati" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Bagian Qiraati</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="qiraati_title">Judul Qiraati</Label>
                <Input
                  id="qiraati_title"
                  value={formData.qiraati_title || ''}
                  onChange={(e) => handleInputChange('qiraati_title', e.target.value)}
                  placeholder="Aplikasi Qiraati"
                />
              </div>

              <div>
                <Label htmlFor="qiraati_subtitle">Subtitle Qiraati</Label>
                <Input
                  id="qiraati_subtitle"
                  value={formData.qiraati_subtitle || ''}
                  onChange={(e) => handleInputChange('qiraati_subtitle', e.target.value)}
                  placeholder="Baca Al-Quran dengan Suara"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="welcome" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Bagian Welcome Message</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="welcome_title">Judul Welcome</Label>
                <Input
                  id="welcome_title"
                  value={formData.welcome_title || ''}
                  onChange={(e) => handleInputChange('welcome_title', e.target.value)}
                  placeholder="Selamat Datang di Rumah Allah"
                />
              </div>

              <div>
                <Label htmlFor="welcome_description">Deskripsi Welcome</Label>
                <Textarea
                  id="welcome_description"
                  value={formData.welcome_description || ''}
                  onChange={(e) => handleInputChange('welcome_description', e.target.value)}
                  placeholder="Deskripsi tentang fasilitas dan kegiatan masjid..."
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="quran_verse_arabic">Ayat Al-Quran (Arab)</Label>
                <Textarea
                  id="quran_verse_arabic"
                  value={formData.quran_verse_arabic || ''}
                  onChange={(e) => handleInputChange('quran_verse_arabic', e.target.value)}
                  placeholder="إِنَّمَا يَعْمُرُ مَسَاجِدَ اللَّهِ مَنْ آمَنَ بِاللَّهِ وَالْيَوْمِ الْآخِرِ"
                  className="text-right"
                  dir="rtl"
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="quran_verse_translation">Terjemahan Ayat</Label>
                <Textarea
                  id="quran_verse_translation"
                  value={formData.quran_verse_translation || ''}
                  onChange={(e) => handleInputChange('quran_verse_translation', e.target.value)}
                  placeholder="Terjemahan ayat dalam bahasa Indonesia..."
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="quran_verse_reference">Referensi Ayat</Label>
                <Input
                  id="quran_verse_reference"
                  value={formData.quran_verse_reference || ''}
                  onChange={(e) => handleInputChange('quran_verse_reference', e.target.value)}
                  placeholder="(QS. At-Taubah: 18)"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="announcements" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Pengumuman</CardTitle>
              <Button
                type="button"
                onClick={addAnnouncement}
                size="sm"
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Tambah Pengumuman
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {announcements.map((announcement, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">Pengumuman {index + 1}</h4>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeAnnouncement(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div>
                    <Label htmlFor={`announcement_title_${index}`}>Judul</Label>
                    <Input
                      id={`announcement_title_${index}`}
                      value={announcement.title}
                      onChange={(e) => handleAnnouncementChange(index, 'title', e.target.value)}
                      placeholder="Judul pengumuman"
                    />
                  </div>

                  <div>
                    <Label htmlFor={`announcement_description_${index}`}>Deskripsi</Label>
                    <Textarea
                      id={`announcement_description_${index}`}
                      value={announcement.description}
                      onChange={(e) => handleAnnouncementChange(index, 'description', e.target.value)}
                      placeholder="Deskripsi pengumuman"
                      rows={2}
                    />
                  </div>

                  <div>
                    <Label htmlFor={`announcement_type_${index}`}>Tipe</Label>
                    <Select
                      value={announcement.type}
                      onValueChange={(value: 'primary' | 'secondary') => 
                        handleAnnouncementChange(index, 'type', value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="primary">Primary (Accent)</SelectItem>
                        <SelectItem value="secondary">Secondary (Gold)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
              {announcements.length === 0 && (
                <p className="text-muted-foreground text-center py-4">
                  Belum ada pengumuman. Klik "Tambah Pengumuman" untuk menambahkan.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button type="submit" disabled={saving} className="flex items-center gap-2">
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
        </Button>
      </div>
    </form>
  );
};

export default HomepageManager; 