import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  BarChart3,
  Users,
  CheckCircle,
  AlertCircle,
  Plus,
  Edit,
  Trash2,
  Calendar,
  Search,
} from 'lucide-react';
import { useActivities } from '@/hooks/useActivities';
import type { Activity } from '@/types/database.types';
import GalleryManager from '@/components/admin/GalleryManager';
import AboutManager from '@/components/admin/AboutManager';
import HomepageManager from '@/components/admin/HomepageManager';

const AdminDashboard = () => {
  const { activities, addActivity, updateActivity, deleteActivity } = useActivities();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [activityToDelete, setActivityToDelete] = useState<Activity | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    category: 'kajian' as Activity['category'],
    max_participants: '',
    current_participants: 0,
    is_active: true,
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      date: '',
      time: '',
      location: '',
      category: 'kajian',
      max_participants: '',
      current_participants: 0,
      is_active: true,
    });
  };

  const handleAddActivity = () => {
    if (!formData.title || !formData.description || !formData.date || !formData.time || !formData.location) {
      alert('Silakan lengkapi semua field yang diperlukan');
      return;
    }

    addActivity({
      title: formData.title,
      description: formData.description,
      date: formData.date,
      time: formData.time,
      location: formData.location,
      category: formData.category,
      max_participants: formData.max_participants ? parseInt(formData.max_participants) : undefined,
      current_participants: formData.current_participants,
      is_active: formData.is_active,
    });

    resetForm();
    setIsAddDialogOpen(false);
  };

  const handleEditActivity = (activity: Activity) => {
    setEditingActivity(activity);
    setFormData({
      title: activity.title,
      description: activity.description,
      date: activity.date,
      time: activity.time,
      location: activity.location,
      category: activity.category,
      max_participants: activity.max_participants?.toString() || '',
      current_participants: activity.current_participants,
      is_active: activity.is_active,
    });
  };

  const handleUpdateActivity = () => {
    if (!editingActivity) return;

    if (!formData.title || !formData.description || !formData.date || !formData.time || !formData.location) {
      alert('Silakan lengkapi semua field yang diperlukan');
      return;
    }

    updateActivity(editingActivity.id, {
      title: formData.title,
      description: formData.description,
      date: formData.date,
      time: formData.time,
      location: formData.location,
      category: formData.category,
      max_participants: formData.max_participants ? parseInt(formData.max_participants) : undefined,
      current_participants: formData.current_participants,
      is_active: formData.is_active,
    });

    resetForm();
    setEditingActivity(null);
  };

  const handleDeleteActivity = (activity: Activity) => {
    setActivityToDelete(activity);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteActivity = () => {
    if (activityToDelete) {
      deleteActivity(activityToDelete.id);
      setIsDeleteDialogOpen(false);
      setActivityToDelete(null);
    }
  };

  // Filter activities
  const filteredActivities = activities.filter(activity => {
    const matchesSearch = activity.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || activity.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryLabel = (category: Activity['category']) => {
    switch (category) {
      case 'kajian': return 'Kajian';
      case 'sholat': return 'Sholat';
      case 'sosial': return 'Sosial';
      case 'pendidikan': return 'Pendidikan';
      case 'lainnya': return 'Lainnya';
      default: return 'Lainnya';
    }
  };

  const getCategoryBadgeColor = (category: Activity['category']) => {
    switch (category) {
      case 'kajian': return 'bg-blue-100 text-blue-800';
      case 'sholat': return 'bg-green-100 text-green-800';
      case 'sosial': return 'bg-purple-100 text-purple-800';
      case 'pendidikan': return 'bg-orange-100 text-orange-800';
      case 'lainnya': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return timeString.substring(0, 5);
  };

  const isUpcoming = (dateString: string, timeString: string) => {
    const activityDateTime = new Date(`${dateString}T${timeString}:00`);
    return activityDateTime > new Date();
  };

  // Statistics
  const stats = {
    totalActivities: activities.length,
    activeActivities: activities.filter(a => a.is_active).length,
    upcomingActivities: activities.filter(a => a.is_active && isUpcoming(a.date, a.time)).length,
    totalParticipants: activities.reduce((sum, a) => sum + a.current_participants, 0),
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard Admin</h2>
          <p className="text-muted-foreground">Selamat datang di panel admin Masjid Al-Muhtaddun</p>
        </div>
      </div>

      <div className="flex items-center space-x-2 mb-4">
        <Button
          variant="link"
          className={`text-muted-foreground hover:text-primary ${window.location.pathname === '/admin/beranda' ? 'text-primary font-semibold' : ''}`}
          onClick={() => window.location.href = '/admin/beranda'}
        >
          Beranda
        </Button>
        <Button
          variant="link"
          className={`text-muted-foreground hover:text-primary ${window.location.pathname === '/admin/kegiatan' ? 'text-primary font-semibold' : ''}`}
          onClick={() => window.location.href = '/admin/kegiatan'}
        >
          Kegiatan
        </Button>
        <Button
          variant="link"
          className={`text-muted-foreground hover:text-primary ${window.location.pathname === '/admin/galeri' ? 'text-primary font-semibold' : ''}`}
          onClick={() => window.location.href = '/admin/galeri'}
        >
          Galeri
        </Button>
        <Button
          variant="link"
          className={`text-muted-foreground hover:text-primary ${window.location.pathname === '/admin/tentang-kami' ? 'text-primary font-semibold' : ''}`}
          onClick={() => window.location.href = '/admin/tentang-kami'}
        >
          Tentang Kami
        </Button>
        <Button
          variant="link"
          className={`text-muted-foreground hover:text-primary ${window.location.pathname === '/admin/monitoring' ? 'text-primary font-semibold' : ''}`}
          onClick={() => window.location.href = '/admin/monitoring'}
        >
          Monitoring
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-9">
          <TabsTrigger value="overview">Dashboard Utama</TabsTrigger>
          <TabsTrigger value="homepage">Beranda</TabsTrigger>
          <TabsTrigger value="qiraati">Manajemen Qiraati</TabsTrigger>
          <TabsTrigger value="prayer">Jadwal Sholat</TabsTrigger>
          <TabsTrigger value="activities">Kegiatan Masjid</TabsTrigger>
          <TabsTrigger value="gallery">Galeri</TabsTrigger>
          <TabsTrigger value="about">Tentang Kami</TabsTrigger>
          <TabsTrigger value="notifications">Notifikasi</TabsTrigger>
          <TabsTrigger value="settings">Pengaturan</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Pengguna</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1,234</div>
                <p className="text-xs text-muted-foreground">+20.1% dari bulan lalu</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Bacaan Quran</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">567</div>
                <p className="text-xs text-muted-foreground">+12.5% dari bulan lalu</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Kegiatan Aktif</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeActivities}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.upcomingActivities} mendatang
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Peserta Kegiatan</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalParticipants}</div>
                <p className="text-xs text-muted-foreground">Total peserta terdaftar</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Aktivitas Terbaru</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  <div className="flex items-center">
                    <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center">
                      <Users className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="ml-4 space-y-1">
                      <p className="text-sm font-medium leading-none">
                        Ahmad Fauzi bergabung dengan Kajian Tafsir
                      </p>
                      <p className="text-sm text-muted-foreground">2 menit yang lalu</p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <div className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="ml-4 space-y-1">
                      <p className="text-sm font-medium leading-none">
                        Kegiatan Buka Puasa Bersama telah selesai
                      </p>
                      <p className="text-sm text-muted-foreground">1 jam yang lalu</p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <div className="w-9 h-9 bg-purple-100 rounded-full flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="ml-4 space-y-1">
                      <p className="text-sm font-medium leading-none">
                        Siti Aminah membaca Surah Al-Baqarah
                      </p>
                      <p className="text-sm text-muted-foreground">3 jam yang lalu</p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <div className="w-9 h-9 bg-orange-100 rounded-full flex items-center justify-center">
                      <AlertCircle className="w-4 h-4 text-orange-600" />
                    </div>
                    <div className="ml-4 space-y-1">
                      <p className="text-sm font-medium leading-none">
                        Jadwal sholat telah diperbarui
                      </p>
                      <p className="text-sm text-muted-foreground">1 hari yang lalu</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Ringkasan Kegiatan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total Kegiatan</span>
                    <span className="text-2xl font-bold">{stats.totalActivities}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Kegiatan Aktif</span>
                    <span className="text-2xl font-bold text-green-600">{stats.activeActivities}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Mendatang</span>
                    <span className="text-2xl font-bold text-blue-600">{stats.upcomingActivities}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total Peserta</span>
                    <span className="text-2xl font-bold text-purple-600">{stats.totalParticipants}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="homepage" className="space-y-4">
          <HomepageManager />
        </TabsContent>

        <TabsContent value="qiraati" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Manajemen Qiraati</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Statistik Audio</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">114</div>
                      <p className="text-xs text-muted-foreground">Surah tersedia</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Pencarian Suara</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">1,247</div>
                      <p className="text-xs text-muted-foreground">Pencarian bulan ini</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Surah Populer</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-lg font-bold">Al-Fatihah</div>
                      <p className="text-xs text-muted-foreground">Paling sering dibaca</p>
                    </CardContent>
                  </Card>
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Sistem Qiraati berfungsi dengan baik. API terhubung dengan EQuran.id untuk audio Al-Quran.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prayer" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Manajemen Jadwal Sholat</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Status API</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-sm">Terhubung dengan MyQuran.com</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Lokasi: Jakarta, Indonesia
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Akses Harian</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">456</div>
                      <p className="text-xs text-muted-foreground">Kunjungan hari ini</p>
                    </CardContent>
                  </Card>
                </div>

                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Jadwal sholat diperbarui otomatis setiap hari dari API MyQuran.com.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Manajemen Kegiatan</span>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="btn-mosque">
                      <Plus className="w-4 h-4 mr-2" />
                      Tambah Kegiatan
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Tambah Kegiatan Baru</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="title">Judul Kegiatan *</Label>
                          <Input
                            id="title"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="Masukkan judul kegiatan"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="category">Kategori *</Label>
                          <Select value={formData.category} onValueChange={(value: Activity['category']) => setFormData({ ...formData, category: value })}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="kajian">Kajian</SelectItem>
                              <SelectItem value="sholat">Sholat</SelectItem>
                              <SelectItem value="sosial">Sosial</SelectItem>
                              <SelectItem value="pendidikan">Pendidikan</SelectItem>
                              <SelectItem value="lainnya">Lainnya</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="description">Deskripsi *</Label>
                        <Textarea
                          id="description"
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          placeholder="Masukkan deskripsi kegiatan"
                          rows={3}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="date">Tanggal *</Label>
                          <Input
                            id="date"
                            type="date"
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="time">Waktu *</Label>
                          <Input
                            id="time"
                            type="time"
                            value={formData.time}
                            onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="location">Lokasi *</Label>
                        <Input
                          id="location"
                          value={formData.location}
                          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                          placeholder="Masukkan lokasi kegiatan"
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          id="isActive"
                          checked={formData.is_active}
                          onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                        />
                        <Label htmlFor="isActive">Kegiatan Aktif</Label>
                      </div>

                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                          Batal
                        </Button>
                        <Button onClick={handleAddActivity} className="btn-mosque">
                          Simpan Kegiatan
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Total Kegiatan</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.totalActivities}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Kegiatan Aktif</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">{stats.activeActivities}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Mendatang</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-blue-600">{stats.upcomingActivities}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Total Peserta</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-purple-600">{stats.totalParticipants}</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Cari kegiatan..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="w-full md:w-48">
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih kategori" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Semua Kategori</SelectItem>
                        <SelectItem value="kajian">Kajian</SelectItem>
                        <SelectItem value="sholat">Sholat</SelectItem>
                        <SelectItem value="sosial">Sosial</SelectItem>
                        <SelectItem value="pendidikan">Pendidikan</SelectItem>
                        <SelectItem value="lainnya">Lainnya</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Activities Table */}
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Judul</TableHead>
                        <TableHead>Kategori</TableHead>
                        <TableHead>Tanggal & Waktu</TableHead>
                        <TableHead>Lokasi</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredActivities.map((activity) => (
                        <TableRow key={activity.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{activity.title}</div>
                              <div className="text-sm text-muted-foreground line-clamp-1">
                                {activity.description}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getCategoryBadgeColor(activity.category)}>
                              {getCategoryLabel(activity.category)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>{formatDate(activity.date)}</div>
                              <div className="text-muted-foreground">
                                {formatTime(activity.time)} WIB
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{activity.location}</TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <Badge variant={activity.is_active ? "default" : "secondary"}>
                                {activity.is_active ? "Aktif" : "Nonaktif"}
                              </Badge>
                              {activity.is_active && (
                                <Badge variant="outline" className={isUpcoming(activity.date, activity.time) ? "border-green-500 text-green-700" : "border-gray-500 text-gray-700"}>
                                  {isUpcoming(activity.date, activity.time) ? "Mendatang" : "Selesai"}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditActivity(activity)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteActivity(activity)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {filteredActivities.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Tidak ada kegiatan yang ditemukan
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gallery" className="space-y-4">
          <GalleryManager />
        </TabsContent>

        <TabsContent value="about" className="space-y-4">
          <AboutManager />
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Manajemen Notifikasi</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <AlertCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Fitur Dalam Pengembangan</h3>
                <p className="text-muted-foreground">
                  Sistem notifikasi untuk jamaah akan segera tersedia
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pengaturan Sistem</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Informasi Website</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div><strong>Nama:</strong> Qiraati Muhtaddun</div>
                        <div><strong>Version:</strong> 1.0.0</div>
                        <div><strong>Status:</strong> <span className="text-green-600">Online</span></div>
                        <div><strong>Masjid:</strong> Al-Muhtaddun</div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Status Server</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span>Database: Connected</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span>API: Running</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span>Storage: Available</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Semua sistem berjalan dengan normal. Terakhir diperbarui: {new Date().toLocaleString('id-ID')}
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Activity Dialog */}
      <Dialog open={!!editingActivity} onOpenChange={(open) => !open && setEditingActivity(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Kegiatan</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Judul Kegiatan *</Label>
                <Input
                  id="edit-title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Masukkan judul kegiatan"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-category">Kategori *</Label>
                <Select value={formData.category} onValueChange={(value: Activity['category']) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kajian">Kajian</SelectItem>
                    <SelectItem value="sholat">Sholat</SelectItem>
                    <SelectItem value="sosial">Sosial</SelectItem>
                    <SelectItem value="pendidikan">Pendidikan</SelectItem>
                    <SelectItem value="lainnya">Lainnya</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Deskripsi *</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Masukkan deskripsi kegiatan"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-date">Tanggal *</Label>
                <Input
                  id="edit-date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-time">Waktu *</Label>
                <Input
                  id="edit-time"
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-location">Lokasi *</Label>
              <Input
                id="edit-location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Masukkan lokasi kegiatan"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="edit-isActive"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="edit-isActive">Kegiatan Aktif</Label>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setEditingActivity(null)}>
                Batal
              </Button>
              <Button onClick={handleUpdateActivity} className="btn-mosque">
                Simpan Perubahan
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Hapus</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Apakah Anda yakin ingin menghapus kegiatan "{activityToDelete?.title}"?
              Tindakan ini tidak dapat dibatalkan.
            </p>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={confirmDeleteActivity}>
              Hapus
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard; 