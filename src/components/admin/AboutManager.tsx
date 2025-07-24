import React, { useEffect, useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { AboutContent } from '@/types/database.types';
import FacilityManager from './FacilityManager';

const AboutManager: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [content, setContent] = useState<AboutContent | null>(null);
  const [missionItems, setMissionItems] = useState<string[]>([]);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const { data, error } = await supabase
        .from('about_content')
        .select('*')
        .single();

      if (error) throw error;

      if (data) {
        setContent(data);
        setMissionItems(data.mission_items);
      }
    } catch (error) {
      console.error('Error fetching content:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Gagal mengambil data konten. Silakan coba lagi.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMissionItemChange = (index: number, value: string) => {
    const newItems = [...missionItems];
    newItems[index] = value;
    setMissionItems(newItems);
  };

  const addMissionItem = () => {
    setMissionItems([...missionItems, '']);
  };

  const removeMissionItem = (index: number) => {
    const newItems = missionItems.filter((_, i) => i !== index);
    setMissionItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const updatedContent = {
        ...content,
        mission_items: missionItems,
      };

      const { error } = await supabase
        .from('about_content')
        .upsert(updatedContent)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Konten berhasil disimpan.",
      });
    } catch (error) {
      console.error('Error saving content:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Gagal menyimpan konten. Silakan coba lagi.",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Kelola Halaman Tentang Kami</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Sejarah */}
            <div className="space-y-2">
              <Label htmlFor="history">Sejarah Singkat</Label>
              <Textarea
                id="history"
                value={content?.history_text || ''}
                onChange={(e) => setContent(prev => ({ ...prev!, history_text: e.target.value }))}
                rows={6}
                placeholder="Masukkan sejarah singkat masjid..."
              />
            </div>

            {/* Visi */}
            <div className="space-y-2">
              <Label htmlFor="vision">Visi</Label>
              <Textarea
                id="vision"
                value={content?.vision_text || ''}
                onChange={(e) => setContent(prev => ({ ...prev!, vision_text: e.target.value }))}
                rows={4}
                placeholder="Masukkan visi masjid..."
              />
            </div>

            {/* Misi */}
            <div className="space-y-2">
              <Label>Misi</Label>
              <div className="space-y-4">
                {missionItems.map((item, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={item}
                      onChange={(e) => handleMissionItemChange(index, e.target.value)}
                      placeholder={`Misi ${index + 1}`}
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => removeMissionItem(index)}
                    >
                      Hapus
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={addMissionItem}
                >
                  Tambah Misi
                </Button>
              </div>
            </div>

            {/* Kontak */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="address">Alamat</Label>
                <Textarea
                  id="address"
                  value={content?.address || ''}
                  onChange={(e) => setContent(prev => ({ ...prev!, address: e.target.value }))}
                  rows={3}
                  placeholder="Masukkan alamat masjid..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Nomor Telepon</Label>
                <Input
                  id="phone"
                  value={content?.phone || ''}
                  onChange={(e) => setContent(prev => ({ ...prev!, phone: e.target.value }))}
                  placeholder="Masukkan nomor telepon..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={content?.email || ''}
                  onChange={(e) => setContent(prev => ({ ...prev!, email: e.target.value }))}
                  placeholder="Masukkan alamat email..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="office_hours">Jam Operasional</Label>
                <Input
                  id="office_hours"
                  value={content?.office_hours || ''}
                  onChange={(e) => setContent(prev => ({ ...prev!, office_hours: e.target.value }))}
                  placeholder="Masukkan jam operasional..."
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Simpan Perubahan
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      {/* Fasilitas */}
      <FacilityManager />
    </div>
  );
};

export default AboutManager; 