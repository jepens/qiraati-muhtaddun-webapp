import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { HomepageContent } from '@/types/database.types';

export const useHomepage = () => {
  const [content, setContent] = useState<HomepageContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContent = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('homepage_content')
        .select('*')
        .single();

      if (error) throw error;

      setContent(data);
    } catch (err) {
      console.error('Error fetching homepage content:', err);
      setError('Gagal mengambil konten homepage');
    } finally {
      setLoading(false);
    }
  };

  const updateContent = async (updates: Partial<Omit<HomepageContent, 'id' | 'created_at' | 'updated_at'>>) => {
    try {
      if (!content?.id) throw new Error('Content ID not found');

      const { data, error } = await supabase
        .from('homepage_content')
        .update(updates)
        .eq('id', content.id)
        .select()
        .single();

      if (error) throw error;

      setContent(data);
      return { success: true, data };
    } catch (err) {
      console.error('Error updating homepage content:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Gagal mengupdate konten' };
    }
  };

  useEffect(() => {
    fetchContent();
  }, []);

  return {
    content,
    loading,
    error,
    fetchContent,
    updateContent,
  };
}; 