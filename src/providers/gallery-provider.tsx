import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Album, Photo } from '@/types/database.types';
import { GalleryContext } from '@/contexts/gallery-context';

export const GalleryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [albums, setAlbums] = useState<Album[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch albums and photos from Supabase
    useEffect(() => {
        const fetchAlbums = async () => {
            try {
                setIsLoading(true);
                setError(null);

                // First fetch all albums
                const { data: albumsData, error: albumsError } = await supabase
                    .from('albums')
                    .select('*')
                    .order('date', { ascending: false });

                if (albumsError) throw albumsError;

                // Then fetch photos for each album
                const albumsWithPhotos = await Promise.all(
                    (albumsData || []).map(async (album) => {
                        const { data: photosData } = await supabase
                            .from('photos')
                            .select('*')
                            .eq('album_id', album.id)
                            .order('created_at', { ascending: true });

                        return {
                            ...album,
                            photos: photosData || []
                        };
                    })
                );

                setAlbums(albumsWithPhotos);
            } catch (err) {
                console.error('Error fetching albums:', err);
                setError('Failed to fetch albums');
            } finally {
                setIsLoading(false);
            }
        };

        fetchAlbums();

        // Subscribe to changes
        const albumsChannel = supabase
            .channel('albums_changes')
            .on('postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'albums'
                },
                () => fetchAlbums()
            )
            .subscribe();

        const photosChannel = supabase
            .channel('photos_changes')
            .on('postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'photos'
                },
                () => fetchAlbums()
            )
            .subscribe();

        return () => {
            albumsChannel.unsubscribe();
            photosChannel.unsubscribe();
        };
    }, []);

    const addAlbum = async (albumData: Omit<Album, 'id' | 'created_at' | 'updated_at'>) => {
        try {
            setError(null);
            const { data, error: supabaseError } = await supabase
                .from('albums')
                .insert([albumData])
                .select()
                .single();

            if (supabaseError) throw supabaseError;

            setAlbums(prev => [{ ...data, photos: [] }, ...prev]);
        } catch (err) {
            console.error('Error adding album:', err);
            setError('Failed to add album');
            throw err;
        }
    };

    const updateAlbum = async (updatedAlbum: Album) => {
        try {
            setError(null);
            const { id, ...albumData } = updatedAlbum;
            const { data, error: supabaseError } = await supabase
                .from('albums')
                .update(albumData)
                .eq('id', id)
                .select()
                .single();

            if (supabaseError) throw supabaseError;

            setAlbums(prev =>
                prev.map(album => (album.id === id ? { ...data, photos: album.photos } : album))
            );
        } catch (err) {
            console.error('Error updating album:', err);
            setError('Failed to update album');
            throw err;
        }
    };

    const deleteAlbum = async (id: string) => {
        try {
            setError(null);
            const { error: supabaseError } = await supabase
                .from('albums')
                .delete()
                .eq('id', id);

            if (supabaseError) throw supabaseError;

            setAlbums(prev => prev.filter(album => album.id !== id));
        } catch (err) {
            console.error('Error deleting album:', err);
            setError('Failed to delete album');
            throw err;
        }
    };

    const addPhotosToAlbum = async (
        albumId: string,
        photos: Omit<Photo, 'id' | 'album_id' | 'created_at'>[]
    ) => {
        try {
            setError(null);
            const photosWithAlbumId = photos.map(photo => ({
                ...photo,
                album_id: albumId
            }));

            const { data, error: supabaseError } = await supabase
                .from('photos')
                .insert(photosWithAlbumId)
                .select();

            if (supabaseError) throw supabaseError;

            setAlbums(prev =>
                prev.map(album => {
                    if (album.id === albumId) {
                        return {
                            ...album,
                            photos: [...(album.photos || []), ...data]
                        };
                    }
                    return album;
                })
            );
        } catch (err) {
            console.error('Error adding photos:', err);
            setError('Failed to add photos');
            throw err;
        }
    };

    const deletePhotoFromAlbum = async (albumId: string, photoId: string) => {
        try {
            setError(null);
            const { error: supabaseError } = await supabase
                .from('photos')
                .delete()
                .eq('id', photoId);

            if (supabaseError) throw supabaseError;

            setAlbums(prev =>
                prev.map(album => {
                    if (album.id === albumId) {
                        return {
                            ...album,
                            photos: album.photos?.filter(photo => photo.id !== photoId) || []
                        };
                    }
                    return album;
                })
            );
        } catch (err) {
            console.error('Error deleting photo:', err);
            setError('Failed to delete photo');
            throw err;
        }
    };

    const updatePhotoInAlbum = async (albumId: string, updatedPhoto: Photo) => {
        try {
            setError(null);
            const { id, ...photoData } = updatedPhoto;
            const { data, error: supabaseError } = await supabase
                .from('photos')
                .update(photoData)
                .eq('id', id)
                .select()
                .single();

            if (supabaseError) throw supabaseError;

            setAlbums(prev =>
                prev.map(album => {
                    if (album.id === albumId) {
                        return {
                            ...album,
                            photos: album.photos?.map(photo =>
                                photo.id === updatedPhoto.id ? data : photo
                            ) || []
                        };
                    }
                    return album;
                })
            );
        } catch (err) {
            console.error('Error updating photo:', err);
            setError('Failed to update photo');
            throw err;
        }
    };

    return (
        <GalleryContext.Provider
            value={{
                albums,
                addAlbum,
                updateAlbum,
                deleteAlbum,
                addPhotosToAlbum,
                deletePhotoFromAlbum,
                updatePhotoInAlbum,
                isLoading,
                error
            }}
        >
            {children}
        </GalleryContext.Provider>
    );
};
