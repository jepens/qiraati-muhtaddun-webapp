import React from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import GalleryManager from '@/components/admin/GalleryManager';
import ActivityManager from '@/components/admin/ActivityManager';
import AboutManager from '@/components/admin/AboutManager';
import AdminBeranda from './Beranda';
import AdminMonitoring from './Monitoring';
import ApiMonitor from '@/components/admin/ApiMonitor';

const Dashboard = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white shadow-sm mt-1">
        <div className="container mx-auto px-4">
          <div className="flex space-x-4">
            <Link to="/admin/beranda">
              <Button variant="ghost">Beranda</Button>
            </Link>
            <Link to="/admin/kegiatan">
              <Button variant="ghost">Kegiatan</Button>
            </Link>
            <Link to="/admin/galeri">
              <Button variant="ghost">Galeri</Button>
            </Link>
            <Link to="/admin/tentang-kami">
              <Button variant="ghost">Tentang Kami</Button>
            </Link>
            <Link to="/admin/monitoring">
              <Button variant="ghost">Monitoring</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="beranda" element={<AdminBeranda />} />
          <Route path="kegiatan" element={<ActivityManager />} />
          <Route path="galeri" element={<GalleryManager />} />
          <Route path="tentang-kami" element={<AboutManager />} />
          <Route path="monitoring" element={<AdminMonitoring />} />
          <Route
            index
            element={
              <div className="space-y-8">
                <div className="text-center">
                  <h2 className="text-2xl font-semibold mb-4">
                    Selamat Datang di Admin Dashboard
                  </h2>
                  <p className="text-muted-foreground mb-8">
                    Pilih menu di atas untuk mengelola konten website.
                  </p>
                </div>
                <ApiMonitor />
              </div>
            }
          />
        </Routes>
      </main>
    </div>
  );
};

export default Dashboard; 