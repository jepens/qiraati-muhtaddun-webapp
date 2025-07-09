import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, BookOpen, Clock, Users, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();

  const navigationItems = [
    { name: 'Beranda', path: '/', icon: Home },
    { name: 'Qiraati', path: '/qiraati', icon: BookOpen },
    { name: 'Jadwal Sholat', path: '/jadwal-sholat', icon: Clock },
    { name: 'Kegiatan', path: '/kegiatan', icon: Users },
    { name: 'Tentang Kami', path: '/tentang-kami', icon: Info },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b-2 border-border shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Logo/Title */}
            <div className="text-center md:text-left">
              <Link to="/" className="block">
                <h1 className="text-2xl md:text-3xl font-bold text-primary">
                  Masjid Al-Muhtaddun
                </h1>
                <p className="text-muted-foreground text-elderly">
                  بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيم
                </p>
              </Link>
            </div>

            {/* Navigation */}
            <nav className="flex flex-wrap justify-center md:justify-end gap-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path ||
                  (item.path === '/qiraati' && location.pathname.startsWith('/qiraati'));
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all duration-300",
                      "text-elderly hover:transform hover:scale-105",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-lg"
                        : "bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="hidden sm:inline">{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="page-transition">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-primary text-primary-foreground mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h3 className="text-xl font-semibold mb-4">Masjid Al-Muhtaddun</h3>
            <p className="text-primary-foreground/80 text-elderly mb-4">
              Tempat Ibadah dan Pusat Kajian Islam
            </p>
            <div className="text-sm text-primary-foreground/60">
              <p>© 2024 Masjid Al-Muhtaddun. Semua hak dilindungi.</p>
              <p className="mt-2 arabic-text">
                وَأَنَّ الْمَسَاجِدَ لِلَّهِ فَلَا تَدْعُوا مَعَ اللَّهِ أَحَدًا
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;