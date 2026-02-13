import React from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { LogOut, Home, Users, Image, Info, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import AdminBeranda from './Beranda';
import AdminKegiatan from './Kegiatan';
import AdminGaleri from './Galeri';
import AdminTentangKami from './TentangKami';
import AdminMonitoring from './Monitoring';
import ApiMonitor from '@/components/admin/ApiMonitor';

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();

  const adminNavigationItems = [
    { name: 'Beranda', path: '/admin/beranda', icon: Home },
    { name: 'Kegiatan', path: '/admin/kegiatan', icon: Users },
    { name: 'Galeri', path: '/admin/galeri', icon: Image },
    { name: 'Tentang Kami', path: '/admin/tentang-kami', icon: Info },
    { name: 'Monitoring', path: '/admin/monitoring', icon: Activity },
  ];

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-lg border-b-2 border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Logo/Title */}
            <div className="text-center md:text-left">
              <h1 className="text-2xl md:text-3xl font-bold text-primary">
                Al-Muhtaddun
              </h1>
              <p className="text-muted-foreground text-elderly">
                بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيم
              </p>
            </div>

            {/* Logout Button */}
            <div className="flex justify-center md:justify-end">
              <Button variant="outline" onClick={handleSignOut} className="gap-2">
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-card shadow-sm border-b border-border">
        <div className="container mx-auto px-4 py-2">
          <div className="flex flex-wrap justify-center md:justify-start gap-2">
            {adminNavigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-300",
                    "text-elderly hover:transform hover:scale-105",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="flex-1 bg-background">
        <Routes>
          <Route path="beranda" element={<AdminBeranda />} />
          <Route path="kegiatan" element={<AdminKegiatan />} />
          <Route path="galeri" element={<AdminGaleri />} />
          <Route path="tentang-kami" element={<AdminTentangKami />} />
          <Route path="monitoring" element={<AdminMonitoring />} />
          <Route
            index
            element={
              <div className="container mx-auto px-4 py-8">
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
              </div>
            }
          />
        </Routes>
      </main>
    </div>
  );
};

export default Dashboard; 