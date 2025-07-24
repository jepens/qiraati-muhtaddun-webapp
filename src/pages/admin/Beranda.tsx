import React from 'react';
import { Button } from '@/components/ui/button';
import HomepageManager from '@/components/admin/HomepageManager';
import AdminNavTabs from '@/components/admin/AdminNavTabs';

const AdminBeranda: React.FC = () => {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Manajemen Halaman Beranda</h2>
          <p className="text-muted-foreground">Kelola konten halaman beranda website</p>
        </div>
      </div>

      {/* Responsive menu navigation diganti komponen */}
      <AdminNavTabs />

      <HomepageManager />
    </div>
  );
};

export default AdminBeranda; 