import React from 'react';

export const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground mt-16">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h3 className="text-xl font-semibold mb-4">Masjid Al-Muhtaddun</h3>
          <p className="text-primary-foreground/80 text-elderly mb-4">
            Tempat Ibadah dan Pusat Kajian Islam
          </p>
          <div className="text-sm text-primary-foreground/60">
            <p>© 2025 Masjid Al-Muhtaddun. Semua hak dilindungi.</p>
            <p className="mt-2 arabic-text">
              وَأَنَّ الْمَسَاجِدَ لِلَّهِ فَلَا تَدْعُوا مَعَ اللَّهِ أَحَدًا
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}; 