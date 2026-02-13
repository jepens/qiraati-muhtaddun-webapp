import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import Overview from './Overview';
import AdminBeranda from './Beranda';
import AdminKegiatan from './Kegiatan';
import AdminGaleri from './Galeri';
import AdminTentangKami from './TentangKami';
import AdminMonitoring from './Monitoring';
import Pengaturan from './Pengaturan';

const Dashboard: React.FC = () => {
  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset>
        <AdminHeader />
        <div className="flex-1">
          <Routes>
            <Route index element={<Overview />} />
            <Route path="beranda" element={<AdminBeranda />} />
            <Route path="kegiatan" element={<AdminKegiatan />} />
            <Route path="galeri" element={<AdminGaleri />} />
            <Route path="tentang-kami" element={<AdminTentangKami />} />
            <Route path="monitoring" element={<AdminMonitoring />} />
            <Route path="pengaturan" element={<Pengaturan />} />
          </Routes>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default Dashboard;