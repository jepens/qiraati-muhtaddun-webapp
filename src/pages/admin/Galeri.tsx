import React from 'react';
import GalleryManager from '@/components/admin/GalleryManager';

const AdminGaleri: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Manajemen Galeri</h2>
          <p className="text-muted-foreground">Kelola album dan foto galeri masjid</p>
        </div>

        <GalleryManager />
      </div>
    </div>
  );
};

export default AdminGaleri; 