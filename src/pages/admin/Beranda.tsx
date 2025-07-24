import React from 'react';
import HomepageManager from '@/components/admin/HomepageManager';

const AdminBeranda: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Manajemen Halaman Beranda</h2>
          <p className="text-muted-foreground">Kelola konten halaman beranda website</p>
        </div>

        <HomepageManager />
      </div>
    </div>
  );
};

export default AdminBeranda; 