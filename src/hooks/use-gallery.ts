import { useContext } from 'react';
import { GalleryContext } from '@/contexts/gallery-context';

export const useGallery = () => {
    const context = useContext(GalleryContext);
    if (context === undefined) {
        throw new Error('useGallery must be used within a GalleryProvider');
    }
    return context;
};
