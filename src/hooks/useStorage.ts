import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export const useStorage = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadPhoto = async (file: File): Promise<string> => {
    try {
      setIsUploading(true);
      setError(null);

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `photos/${fileName}`;

      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('photos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('photos')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (err) {
      console.error('Error uploading photo:', err);
      setError('Failed to upload photo');
      throw err;
    } finally {
      setIsUploading(false);
    }
  };

  const deletePhoto = async (url: string) => {
    try {
      setError(null);
      // Extract path from URL
      const path = url.split('/').pop();
      if (!path) throw new Error('Invalid photo URL');

      const { error: deleteError } = await supabase.storage
        .from('photos')
        .remove([`photos/${path}`]);

      if (deleteError) throw deleteError;
    } catch (err) {
      console.error('Error deleting photo:', err);
      setError('Failed to delete photo');
      throw err;
    }
  };

  return {
    uploadPhoto,
    deletePhoto,
    isUploading,
    error
  };
}; 