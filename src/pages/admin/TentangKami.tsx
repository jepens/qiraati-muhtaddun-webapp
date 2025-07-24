import React from 'react';
import { Button } from '@/components/ui/button';
import AboutManager from '@/components/admin/AboutManager';
import AdminNavTabs from '@/components/admin/AdminNavTabs';

const AdminTentangKami: React.FC = () => {
  return (
    <div className="flex-1 space-y-4 p-2 sm:p-4 md:p-8 pt-4 sm:pt-6 w-full max-w-2xl mx-auto">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Manajemen Halaman Tentang Kami</h2>
          <p className="text-muted-foreground">Kelola konten halaman Tentang Kami</p>
        </div>
      </div>

      {/* Responsive menu navigation diganti komponen */}
      <AdminNavTabs />

      <AboutManager />
    </div>
  );
};

export default AdminTentangKami; 