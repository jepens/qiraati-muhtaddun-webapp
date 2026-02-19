import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Home,
    Calendar,
    Image,
    Info,
    Activity,
    Settings,
    LogOut,
    Landmark,
    Users,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
    SidebarSeparator,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const navMain = [
    {
        title: 'Dashboard',
        path: '/admin',
        icon: LayoutDashboard,
        exact: true,
    },
];

const navContent = [
    {
        title: 'Beranda',
        path: '/admin/beranda',
        icon: Home,
    },
    {
        title: 'Kegiatan',
        path: '/admin/kegiatan',
        icon: Calendar,
    },
    {
        title: 'Galeri',
        path: '/admin/galeri',
        icon: Image,
    },
    {
        title: 'Tentang Kami',
        path: '/admin/tentang-kami',
        icon: Info,
    },
];

const navSystem = [
    {
        title: 'Monitoring',
        path: '/admin/monitoring',
        icon: Activity,
    },
    {
        title: 'Pengaturan',
        path: '/admin/pengaturan',
        icon: Settings,
    },
    {
        title: 'Users',
        path: '/admin/users',
        icon: Users,
    },
];

const AdminSidebar: React.FC = () => {
    const location = useLocation();
    const { user, signOut } = useAuth();

    const isActive = (path: string, exact?: boolean) => {
        if (exact) return location.pathname === path;
        return location.pathname.startsWith(path);
    };

    const userInitials = user?.email
        ? user.email.substring(0, 2).toUpperCase()
        : 'AD';

    return (
        <Sidebar collapsible="icon">
            {/* Header */}
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link to="/admin">
                                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                                    <Landmark className="size-4" />
                                </div>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-semibold">Al-Muhtaddun</span>
                                    <span className="truncate text-xs text-muted-foreground">Admin Panel</span>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarSeparator />

            {/* Content */}
            <SidebarContent>
                {/* Main Navigation */}
                <SidebarGroup>
                    <SidebarGroupLabel>Utama</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {navMain.map((item) => (
                                <SidebarMenuItem key={item.path}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={isActive(item.path, item.exact)}
                                        tooltip={item.title}
                                    >
                                        <Link to={item.path}>
                                            <item.icon />
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                {/* Content Management */}
                <SidebarGroup>
                    <SidebarGroupLabel>Manajemen Konten</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {navContent.map((item) => (
                                <SidebarMenuItem key={item.path}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={isActive(item.path)}
                                        tooltip={item.title}
                                    >
                                        <Link to={item.path}>
                                            <item.icon />
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                {/* System */}
                <SidebarGroup>
                    <SidebarGroupLabel>Sistem</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {navSystem.map((item) => (
                                <SidebarMenuItem key={item.path}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={isActive(item.path)}
                                        tooltip={item.title}
                                    >
                                        <Link to={item.path}>
                                            <item.icon />
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            {/* Footer with User Profile */}
            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <SidebarMenuButton
                                    size="lg"
                                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                                >
                                    <Avatar className="h-8 w-8 rounded-lg">
                                        <AvatarFallback className="rounded-lg bg-primary/10 text-primary text-xs">
                                            {userInitials}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="grid flex-1 text-left text-sm leading-tight">
                                        <span className="truncate font-semibold">Admin</span>
                                        <span className="truncate text-xs text-muted-foreground">
                                            {user?.email || 'admin@masjid.com'}
                                        </span>
                                    </div>
                                </SidebarMenuButton>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                                side="top"
                                align="start"
                                sideOffset={4}
                            >
                                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                                    <Avatar className="h-8 w-8 rounded-lg">
                                        <AvatarFallback className="rounded-lg bg-primary/10 text-primary text-xs">
                                            {userInitials}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="grid flex-1 text-left text-sm leading-tight">
                                        <span className="truncate font-semibold">Admin</span>
                                        <span className="truncate text-xs text-muted-foreground">
                                            {user?.email || 'admin@masjid.com'}
                                        </span>
                                    </div>
                                </div>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => signOut()} className="text-red-500 cursor-pointer">
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Logout
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>

            <SidebarRail />
        </Sidebar>
    );
};

export default AdminSidebar;
