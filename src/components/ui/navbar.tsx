import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, BookOpen, Clock, Users, Info, Image, LogIn, Gamepad2, Heart, Sparkles, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const navigationItems = [
  { name: 'Beranda', path: '/', icon: Home },
  { name: 'Qiraati', path: '/qiraati', icon: BookOpen },
  { name: 'Doa', path: '/doa', icon: Heart },
  { name: 'Game Hafalan', path: '/game-hafalan', icon: Gamepad2 },
  { name: 'Jadwal Sholat', path: '/jadwal-sholat', icon: Clock },
  { name: 'Kegiatan', path: '/kegiatan', icon: Users },
  { name: 'Galeri', path: '/galeri', icon: Image },
  { name: 'Tentang Kami', path: '/tentang-kami', icon: Info },
  { name: 'AI Chat', path: '/ai-chat', icon: Sparkles },
  { name: 'AI Chat', path: '/ai-chat', icon: Sparkles },
];

export const Navbar = () => {
  const location = useLocation();

  return (
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
                  aria-label={item.name}
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

          {/* User Profile / Login */}
          <div className="flex justify-center md:justify-end mt-4 md:mt-0">
            <AuthButtons />
          </div>
        </div>
      </div>
    </header>
  );
};

const AuthButtons = () => {
  const { user, signOut, isAuthenticated } = useAuth();

  if (isAuthenticated && user) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger className="outline-none">
          <Avatar className="h-10 w-10 border-2 border-primary cursor-pointer hover:opacity-80 transition-opacity">
            <AvatarImage src={user.user_metadata?.avatar_url} alt={user.email || 'User'} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {user.email?.charAt(0).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{user.user_metadata?.full_name || user.email || 'User'}</p>
              <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => signOut()} className="cursor-pointer text-destructive focus:text-destructive">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Link
      to="/login"
      className={cn(
        "flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all duration-300",
        "bg-primary text-primary-foreground shadow-lg hover:transform hover:scale-105"
      )}
    >
      <LogIn className="w-5 h-5" />
      <span>Login</span>
    </Link>
  );
}; 