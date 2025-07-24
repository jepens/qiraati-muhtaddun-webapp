import React from 'react';
import { Button } from '@/components/ui/button';
import ApiMonitor from '@/components/admin/ApiMonitor';
import AdminNavTabs from '@/components/admin/AdminNavTabs';

const AdminMonitoring: React.FC = () => {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Monitoring Sistem API</h2>
          <p className="text-muted-foreground">Monitor status dan performa API yang digunakan aplikasi</p>
        </div>
      </div>

      {/* Responsive menu navigation diganti komponen */}
      <AdminNavTabs />

      <ApiMonitor />
    </div>
  );
};

export default AdminMonitoring; 