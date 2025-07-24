import React, { useEffect, useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import type { Facility } from '@/types/database.types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Icons } from '@/components/icons';

const iconOptions = [
  { value: 'users', label: 'Users', description: 'Icon orang/jamaah' },
  { value: 'book', label: 'Book', description: 'Icon buku' },
  { value: 'clock', label: 'Clock', description: 'Icon jam' },
  { value: 'heart', label: 'Heart', description: 'Icon hati' },
  { value: 'home', label: 'Home', description: 'Icon rumah' },
  { value: 'mosque', label: 'Mosque', description: 'Icon masjid' },
  { value: 'quran', label: 'Quran', description: 'Icon Al-Quran' },
  { value: 'parking', label: 'Parking', description: 'Icon parkir' },
  { value: 'wifi', label: 'Wifi', description: 'Icon wifi' },
  { value: 'mic', label: 'Microphone', description: 'Icon mikrofon' },
  { value: 'ac', label: 'AC', description: 'Icon AC' },
];

const FacilityManager: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingFacility, setEditingFacility] = useState<Facility | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon_name: 'users' as Facility['icon_name'],
  });

  useEffect(() => {
    fetchFacilities();
  }, []);

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
      toast({
        variant: "destructive",
        title: "Error",
        description: "Gagal mengambil data fasilitas. Silakan coba lagi.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (editingFacility) {
        const { error } = await supabase
          .from('facilities')
          .update({
            name: formData.name,
            description: formData.description,
            icon_name: formData.icon_name,
          })
          .eq('id', editingFacility.id);

        if (error) throw error;

        toast({
          title: "Berhasil",
          description: "Fasilitas berhasil diperbarui.",
        });
      } else {
        const { error } = await supabase
          .from('facilities')
          .insert([formData]);

        if (error) throw error;

        toast({
          title: "Berhasil",
          description: "Fasilitas baru berhasil ditambahkan.",
        });
      }

      setFormData({
        name: '',
        description: '',
        icon_name: 'users',
      });
      setEditingFacility(null);
      setIsAddDialogOpen(false);
      fetchFacilities();
    } catch (error) {
      console.error('Error saving facility:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Gagal menyimpan fasilitas. Silakan coba lagi.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (facility: Facility) => {
    setEditingFacility(facility);
    setFormData({
      name: facility.name,
      description: facility.description,
      icon_name: facility.icon_name,
    });
    setIsAddDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('facilities')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Fasilitas berhasil dihapus.",
      });
      fetchFacilities();
    } catch (error) {
      console.error('Error deleting facility:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Gagal menghapus fasilitas. Silakan coba lagi.",
      });
    }
  };

  const IconComponent = ({ name }: { name: Facility['icon_name'] }) => {
    const Icon = Icons[name];
    return Icon ? <Icon className="h-12 w-12 text-primary mx-auto mb-4" /> : null;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Fasilitas Masjid</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingFacility(null);
              setFormData({
                name: '',
                description: '',
                icon_name: 'users',
              });
            }}>
              Tambah Fasilitas
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingFacility ? 'Edit Fasilitas' : 'Tambah Fasilitas Baru'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Fasilitas</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Masukkan nama fasilitas..."
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Deskripsi</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Masukkan deskripsi fasilitas..."
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="icon">Icon</Label>
                <Select
                  value={formData.icon_name}
                  onValueChange={(value: Facility['icon_name']) => 
                    setFormData(prev => ({ ...prev, icon_name: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih icon" />
                  </SelectTrigger>
                  <SelectContent>
                    {iconOptions.map((icon) => (
                      <SelectItem key={icon.value} value={icon.value}>
                        <div className="flex items-center">
                          <IconComponent name={icon.value as Facility['icon_name']} />
                          <div className="ml-2">
                            <div>{icon.label}</div>
                            <div className="text-sm text-muted-foreground">{icon.description}</div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingFacility ? 'Simpan Perubahan' : 'Tambah Fasilitas'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {facilities.map((facility) => (
          <Card key={facility.id} className="text-center p-6">
            <IconComponent name={facility.icon_name} />
            <h3 className="text-elderly-lg font-semibold mb-2">{facility.name}</h3>
            <p className="text-elderly text-muted-foreground mb-4">{facility.description}</p>
            <div className="flex justify-center space-x-2">
              <Button variant="outline" size="sm" onClick={() => handleEdit(facility)}>
                Edit
              </Button>
              <Button variant="destructive" size="sm" onClick={() => handleDelete(facility.id)}>
                Hapus
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default FacilityManager; 