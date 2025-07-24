import React from 'react';
import AboutManager from '@/components/admin/AboutManager';

const AdminTentangKami: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Manajemen Halaman Tentang Kami</h2>
          <p className="text-muted-foreground">Kelola konten halaman Tentang Kami</p>
        </div>

        <AboutManager />
      </div>
    </div>
  );
};

export default AdminTentangKami; 