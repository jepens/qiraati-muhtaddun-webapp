import { createContext } from 'react';
import type { Album, Photo } from '@/types/database.types';

export interface GalleryContextType {
    albums: Album[];
    addAlbum: (album: Omit<Album, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
    updateAlbum: (album: Album) => Promise<void>;
    deleteAlbum: (id: string) => Promise<void>;
    addPhotosToAlbum: (albumId: string, photos: Omit<Photo, 'id' | 'album_id' | 'created_at'>[]) => Promise<void>;
    deletePhotoFromAlbum: (albumId: string, photoId: string) => Promise<void>;
    updatePhotoInAlbum: (albumId: string, photo: Photo) => Promise<void>;
    isLoading: boolean;
    error: string | null;
}

export const GalleryContext = createContext<GalleryContextType | undefined>(undefined);
