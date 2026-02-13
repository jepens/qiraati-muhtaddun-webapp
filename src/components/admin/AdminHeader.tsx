import React from 'react';
import { useLocation } from 'react-router-dom';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

const pageTitles: Record<string, string> = {
    '/admin': 'Dashboard',
    '/admin/beranda': 'Beranda',
    '/admin/kegiatan': 'Kegiatan',
    '/admin/galeri': 'Galeri',
    '/admin/tentang-kami': 'Tentang Kami',
    '/admin/monitoring': 'Monitoring',
    '/admin/pengaturan': 'Pengaturan',
};

const AdminHeader: React.FC = () => {
    const location = useLocation();
    const currentTitle = pageTitles[location.pathname] || 'Dashboard';
    const isRoot = location.pathname === '/admin';

    return (
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        {isRoot ? (
                            <BreadcrumbPage>Dashboard</BreadcrumbPage>
                        ) : (
                            <BreadcrumbLink href="/admin">Admin</BreadcrumbLink>
                        )}
                    </BreadcrumbItem>
                    {!isRoot && (
                        <>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbPage>{currentTitle}</BreadcrumbPage>
                            </BreadcrumbItem>
                        </>
                    )}
                </BreadcrumbList>
            </Breadcrumb>
        </header>
    );
};

export default AdminHeader;
