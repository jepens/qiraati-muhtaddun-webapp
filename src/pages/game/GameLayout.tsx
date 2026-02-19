import React from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';


const GameLayout: React.FC = () => {
    const { isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-background via-background to-emerald-950/20 flex items-center justify-center">
                <div className="animate-pulse text-muted-foreground text-lg">Memuat...</div>
            </div>
        );
    }



    return <Outlet />;
};

export default GameLayout;
