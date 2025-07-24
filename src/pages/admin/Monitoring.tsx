import React from 'react';
import ApiMonitor from '@/components/admin/ApiMonitor';

const AdminMonitoring: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Monitoring Sistem API</h2>
          <p className="text-muted-foreground">Monitor status dan performa API yang digunakan aplikasi</p>
        </div>

        <ApiMonitor />
      </div>
    </div>
  );
};

export default AdminMonitoring; 