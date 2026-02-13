import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Calendar,
    Image,
    Activity,
    Building2,
    Plus,
    ArrowUpRight,
    RefreshCw,
    Loader2,
} from 'lucide-react';
import { useAdminStats } from '@/hooks/useAdminStats';
import ApiMonitor from '@/components/admin/ApiMonitor';

const Overview: React.FC = () => {
    const {
        totalActivities,
        activeActivities,
        totalAlbums,
        totalPhotos,
        totalFacilities,
        isLoading,
        refresh,
    } = useAdminStats();

    const statCards = [
        {
            title: 'Total Kegiatan',
            value: totalActivities,
            sub: `${activeActivities} aktif`,
            icon: Calendar,
            color: 'text-blue-500',
            bg: 'bg-blue-500/10',
            link: '/admin/kegiatan',
        },
        {
            title: 'Album Galeri',
            value: totalAlbums,
            sub: `${totalPhotos} foto`,
            icon: Image,
            color: 'text-purple-500',
            bg: 'bg-purple-500/10',
            link: '/admin/galeri',
        },
        {
            title: 'Fasilitas',
            value: totalFacilities,
            sub: 'fasilitas terdaftar',
            icon: Building2,
            color: 'text-emerald-500',
            bg: 'bg-emerald-500/10',
            link: '/admin/tentang-kami',
        },
        {
            title: 'Kegiatan Aktif',
            value: activeActivities,
            sub: 'sedang berjalan',
            icon: Activity,
            color: 'text-orange-500',
            bg: 'bg-orange-500/10',
            link: '/admin/kegiatan',
        },
    ];

    const quickActions = [
        { label: 'Tambah Kegiatan', path: '/admin/kegiatan', icon: Calendar },
        { label: 'Upload Foto', path: '/admin/galeri', icon: Image },
        { label: 'Edit Beranda', path: '/admin/beranda', icon: ArrowUpRight },
    ];

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="space-y-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                            Dashboard Admin
                        </h2>
                        <p className="text-muted-foreground">
                            Selamat datang di panel admin Masjid Al-Muhtaddun
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={refresh}
                        disabled={isLoading}
                        className="w-fit"
                    >
                        {isLoading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <RefreshCw className="mr-2 h-4 w-4" />
                        )}
                        Refresh Data
                    </Button>
                </div>

                {/* Statistics Cards */}
                <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                    {statCards.map((card) => (
                        <Link key={card.title} to={card.link}>
                            <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 cursor-pointer group">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">
                                        {card.title}
                                    </CardTitle>
                                    <div className={`p-2 rounded-lg ${card.bg}`}>
                                        <card.icon className={`h-4 w-4 ${card.color}`} />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {isLoading ? (
                                        <div className="h-8 w-16 bg-muted animate-pulse rounded" />
                                    ) : (
                                        <div className="text-2xl font-bold">{card.value}</div>
                                    )}
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {card.sub}
                                    </p>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>

                {/* Quick Actions */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Aksi Cepat</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-3">
                            {quickActions.map((action) => (
                                <Link key={action.path} to={action.path}>
                                    <Button variant="outline" className="gap-2">
                                        <Plus className="h-4 w-4" />
                                        {action.label}
                                    </Button>
                                </Link>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* API Monitor */}
                <ApiMonitor />
            </div>
        </div>
    );
};

export default Overview;
