import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Save } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { AboutContent } from '@/types/database.types';

const Pengaturan: React.FC = () => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [data, setData] = useState<Partial<AboutContent>>({
        address: '',
        phone: '',
        email: '',
        office_hours: '',
        google_maps_embed: '',
    });

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const { data: result, error } = await supabase
                .from('about_content')
                .select('address, phone, email, office_hours, google_maps_embed')
                .limit(1)
                .single();

            if (error && error.code !== 'PGRST116') throw error;
            if (result) {
                setData(result);
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleChange = (field: string, value: string) => {
        setData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const { data: existing } = await supabase
                .from('about_content')
                .select('id')
                .limit(1)
                .single();

            if (existing) {
                const { error } = await supabase
                    .from('about_content')
                    .update({
                        address: data.address,
                        phone: data.phone,
                        email: data.email,
                        office_hours: data.office_hours,
                        google_maps_embed: data.google_maps_embed,
                    })
                    .eq('id', existing.id);

                if (error) throw error;
            }

            toast({
                title: 'Berhasil',
                description: 'Informasi masjid berhasil diperbarui',
            });
        } catch (error) {
            console.error('Error saving settings:', error);
            toast({
                title: 'Gagal',
                description: 'Terjadi kesalahan saat menyimpan',
                variant: 'destructive',
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-2xl mx-auto space-y-6">
                <div>
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                        Pengaturan
                    </h2>
                    <p className="text-muted-foreground">
                        Kelola informasi dasar masjid
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Informasi Masjid</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="address">Alamat</Label>
                            <Textarea
                                id="address"
                                value={data.address || ''}
                                onChange={(e) => handleChange('address', e.target.value)}
                                placeholder="Masukkan alamat lengkap masjid"
                                rows={3}
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="phone">Nomor Telepon</Label>
                                <Input
                                    id="phone"
                                    value={data.phone || ''}
                                    onChange={(e) => handleChange('phone', e.target.value)}
                                    placeholder="Contoh: 021-1234567"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={data.email || ''}
                                    onChange={(e) => handleChange('email', e.target.value)}
                                    placeholder="Contoh: info@masjid.com"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="office_hours">Jam Operasional</Label>
                            <Input
                                id="office_hours"
                                value={data.office_hours || ''}
                                onChange={(e) => handleChange('office_hours', e.target.value)}
                                placeholder="Contoh: 06:00 - 22:00 WIB"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="google_maps_embed">
                                Google Maps Embed URL
                            </Label>
                            <Input
                                id="google_maps_embed"
                                value={data.google_maps_embed || ''}
                                onChange={(e) => handleChange('google_maps_embed', e.target.value)}
                                placeholder="https://www.google.com/maps/embed?..."
                            />
                            <p className="text-xs text-muted-foreground">
                                Masukkan URL embed Google Maps untuk menampilkan lokasi masjid
                            </p>
                        </div>

                        <div className="flex justify-end pt-4">
                            <Button onClick={handleSave} disabled={saving} className="gap-2">
                                {saving ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Save className="h-4 w-4" />
                                )}
                                Simpan Perubahan
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default Pengaturan;
