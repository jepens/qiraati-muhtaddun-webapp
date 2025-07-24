import React from 'react';
import { Button } from '@/components/ui/button';

const adminMenus = [
  { label: 'Beranda', path: '/admin/beranda' },
  { label: 'Kegiatan', path: '/admin/kegiatan' },
  { label: 'Galeri', path: '/admin/galeri' },
  { label: 'Tentang Kami', path: '/admin/tentang-kami' },
  { label: 'Monitoring', path: '/admin/monitoring' },
];

const AdminNavTabs: React.FC = () => {
  return (
    <div className="w-full max-w-full overflow-x-auto mb-4 pb-1">
      <div className="flex flex-nowrap gap-2">
        {adminMenus.map((menu) => (
          <Button
            key={menu.path}
            variant="link"
            className={`min-w-fit text-muted-foreground hover:text-primary ${window.location.pathname === menu.path ? 'text-primary font-semibold bg-accent/60' : ''}`}
            onClick={() => window.location.href = menu.path}
          >
            {menu.label}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default AdminNavTabs; 