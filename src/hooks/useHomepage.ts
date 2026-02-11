import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { HomepageContent } from '@/types/database.types';

export const useHomepage = () => {
  const [content, setContent] = useState<HomepageContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContent = useCallback(async () => {
    try {
      // Try to load from cache first for instant LCP
      const cached = localStorage.getItem('homepage_content');
      if (cached) {
        setContent(JSON.parse(cached));
        setLoading(false); // Immediate display
      } else {
        setLoading(true);
      }

      setError(null);

      const { data, error } = await supabase
        .from('homepage_content')
        .select('*')
        .single();

      if (error) throw error;

      // Update state and cache
      setContent(data);
      localStorage.setItem('homepage_content', JSON.stringify(data));
    } catch (err) {
      console.error('Error fetching homepage content:', err);
      // Only set error if we don't have cached content
      if (!localStorage.getItem('homepage_content')) {
        setError('Gagal mengambil konten homepage');
      }
    } finally {
      setLoading(false);
    }
  }, []);

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
  }, [fetchContent]);

  return {
    content,
    loading,
    error,
    fetchContent,
    updateContent,
  };
}; 