import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { LogIn } from 'lucide-react';

const GameLayout: React.FC = () => {
    const { isAuthenticated, isLoading } = useAuth();
    const navigate = useNavigate();

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-background via-background to-emerald-950/20 flex items-center justify-center">
                <div className="animate-pulse text-muted-foreground text-lg">Memuat...</div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-background via-background to-emerald-950/20 flex items-center justify-center px-4">
                <div className="text-center max-w-md mx-auto">
                    <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 rounded-full mb-8 border border-emerald-500/20">
                        <LogIn className="w-12 h-12 text-emerald-400" />
                    </div>
                    <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent">
                        Login Diperlukan
                    </h2>
                    <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
                        Anda harus login terlebih dahulu untuk bermain game dan menyimpan skor di leaderboard.
                    </p>
                    <Button
                        onClick={() => navigate('/login')}
                        size="lg"
                        className="h-14 px-10 text-lg font-semibold bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 shadow-xl shadow-emerald-500/20 transition-all duration-300 hover:scale-105"
                    >
                        <LogIn className="w-5 h-5 mr-2" />
                        Login Sekarang
                    </Button>
                </div>
            </div>
        );
    }

    return <Outlet />;
};

export default GameLayout;
