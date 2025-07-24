import React from 'react';
import ActivityManager from '@/components/admin/ActivityManager';

const AdminKegiatan: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Manajemen Kegiatan</h2>
          <p className="text-muted-foreground">Kelola kegiatan dan acara masjid</p>
        </div>

        <ActivityManager />
      </div>
    </div>
  );
};

export default AdminKegiatan; 