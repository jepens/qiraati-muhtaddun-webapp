import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Heart,
  MapPin,
  Mail,
  Facebook,
  Instagram,
  Youtube,
  ExternalLink,
  BookOpen,
  Users
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { AboutContent } from '@/types/database.types';

export const Footer = () => {
  const currentYear = new Date().getFullYear();
  const [content, setContent] = useState<AboutContent | null>(null);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const { data } = await supabase
          .from('about_content')
          .select('*')
          .single();
        if (data) {
          setContent(data);
        }
      } catch (error) {
        console.error('Error fetching footer content:', error);
      }
    };

    fetchContent();
  }, []);

  return (
    <footer className="bg-slate-950 text-slate-200 mt-auto border-t border-slate-800">
      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">

          {/* Brand Column */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl">
                M
              </div>
              <h3 className="text-xl font-bold text-white">Masjid Al-Muhtaddun</h3>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Platform digital Al-Quran dan manajemen masjid terlengkap. Mengadopsi teknologi modern untuk kemudahan ibadah umat.
            </p>
            <div className="flex gap-4 pt-2">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <BookOpen className="w-4 h-4 text-primary" />
                <span>114 Surat</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Users className="w-4 h-4 text-primary" />
                <span>500+ Jamaah</span>
              </div>
            </div>
          </div>

          {/* Fitur Utama */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4 relative inline-block">
              Fitur Utama
              <span className="absolute -bottom-1 left-0 w-1/3 h-1 bg-primary rounded-full"></span>
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/qiraati" className="text-slate-400 hover:text-primary transition-colors flex items-center gap-2 group">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-600 group-hover:bg-primary transition-colors"></span>
                  Baca Al-Quran
                </Link>
              </li>
              <li>
                <Link to="/jadwal-sholat" className="text-slate-400 hover:text-primary transition-colors flex items-center gap-2 group">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-600 group-hover:bg-primary transition-colors"></span>
                  Jadwal Sholat
                </Link>
              </li>
              <li>
                <Link to="/game" className="text-slate-400 hover:text-primary transition-colors flex items-center gap-2 group">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-600 group-hover:bg-primary transition-colors"></span>
                  Game Edukatif
                </Link>
              </li>
              <li>
                <Link to="/doa" className="text-slate-400 hover:text-primary transition-colors flex items-center gap-2 group">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-600 group-hover:bg-primary transition-colors"></span>
                  Kumpulan Doa
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Info */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4 relative inline-block">
              Informasi
              <span className="absolute -bottom-1 left-0 w-1/3 h-1 bg-primary rounded-full"></span>
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <div className="text-slate-400 flex items-start gap-2">
                  <MapPin className="w-4 h-4 mt-1 text-primary shrink-0" />
                  <span className="whitespace-pre-line">{content?.address || 'Perum PTB, RT.6/RW.5, Klp. Dua Wetan, Kec. Ciracas, Kota Jakarta Timur, Daerah Khusus Ibukota Jakarta 13730'}</span>
                </div>
              </li>
              <li>
                <div className="text-slate-400 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-primary shrink-0" />
                  <span>{content?.email || '(021) 87703384'}</span>
                </div>
              </li>
              <li>
                <Link to="/tentang-kami" className="text-slate-400 hover:text-primary transition-colors flex items-center gap-2">
                  <span>Tentang Kami</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Partner */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4 relative inline-block">
              Partner
              <span className="absolute -bottom-1 left-0 w-1/3 h-1 bg-primary rounded-full"></span>
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="https://equran.id"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-primary transition-colors flex items-center gap-2 group"
                >
                  <ExternalLink className="w-4 h-4" />
                  Equran.id
                </a>
              </li>
            </ul>
            <div className="mt-6">
              <p className="text-sm text-slate-500 mb-2">Social Media</p>
              <div className="flex gap-3">
                <a href="#" className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-primary hover:text-white transition-all">
                  <Facebook className="w-4 h-4" />
                </a>
                <a href="#" className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-primary hover:text-white transition-all">
                  <Instagram className="w-4 h-4" />
                </a>
                <a href="#" className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-primary hover:text-white transition-all">
                  <Youtube className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-slate-800 bg-slate-950">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">

            <div className="text-slate-400 text-sm flex flex-col md:flex-row items-center gap-2">
              <span>© {currentYear} Masjid Al-Muhtaddun.</span>
              <span className="hidden md:inline text-slate-700">•</span>
              <span>All rights reserved.</span>
            </div>

            <div className="flex items-center gap-2 text-sm text-slate-400 scroll-m-20">
              <span>Made by Muslim from Indonesia with</span>
              <Heart className="w-4 h-4 text-red-500 fill-red-500 animate-pulse" />
            </div>

            {/* Quran Verse (Optional - kept from old design but subtler) */}
            <div className="hidden lg:block text-slate-600 text-xs font-arabic" dir="rtl">
              وَأَنَّ الْمَسَاجِدَ لِلَّهِ فَلَا تَدْعُوا مَعَ اللَّهِ أَحَدًا
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};