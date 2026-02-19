import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';

interface LoginRequiredDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title?: string;
    description?: string;
}

const LoginRequiredDialog: React.FC<LoginRequiredDialogProps> = ({
    open,
    onOpenChange,
    title = "Login Diperlukan",
    description = "Anda harus login terlebih dahulu untuk bermain game dan menyimpan skor di leaderboard.",
}) => {
    const navigate = useNavigate();

    const handleLogin = () => {
        navigate('/login');
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur-sm border-emerald-500/20">
                <DialogHeader className="flex flex-col items-center text-center space-y-4 pt-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 rounded-full border border-emerald-500/20">
                        <LogIn className="w-8 h-8 text-emerald-400" />
                    </div>
                    <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent">
                        {title}
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground text-center max-w-xs">
                        {description}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="flex flex-col sm:flex-col gap-3 mt-4 w-full">
                    <Button
                        onClick={handleLogin}
                        size="lg"
                        className="w-full h-12 text-base font-semibold bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 shadow-lg shadow-emerald-500/20 transition-all duration-300"
                    >
                        <LogIn className="w-4 h-4 mr-2" />
                        Login Sekarang
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        className="w-full text-muted-foreground hover:text-foreground"
                    >
                        Nanti Saja
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default LoginRequiredDialog;
