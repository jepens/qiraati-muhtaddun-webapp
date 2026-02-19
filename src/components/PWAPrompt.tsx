import { useRegisterSW } from 'virtual:pwa-register/react';
import { toast } from 'sonner';
import { useEffect, useCallback } from 'react';

export function PWAPrompt() {
    const {
        offlineReady: [offlineReady, setOfflineReady],
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegistered(r) {
            console.log('SW Registered: ' + r);
        },
        onRegisterError(error) {
            console.error('SW registration error', error);
        },
    });

    const close = useCallback(() => {
        setOfflineReady(false);
        setNeedRefresh(false);
    }, [setOfflineReady, setNeedRefresh]);

    useEffect(() => {
        if (offlineReady) {
            toast.success('App siap digunakan secara offline!', {
                description: 'Anda dapat menggunakan aplikasi ini tanpa koneksi internet.',
                action: {
                    label: 'OK',
                    onClick: close,
                },
                onDismiss: close,
            });
        }

        if (needRefresh) {
            toast('Update Tersedia!', {
                description: 'Versi baru aplikasi telah tersedia. Klik untuk perbarui.',
                action: {
                    label: 'Perbarui',
                    onClick: () => {
                        updateServiceWorker(true);
                    },
                },
                onDismiss: close,
                duration: Infinity, // don't auto close
            });
        }
    }, [offlineReady, needRefresh, updateServiceWorker, close]);

    // Kami kembalikan null karena UI ditangani oleh toast
    return null;
}
