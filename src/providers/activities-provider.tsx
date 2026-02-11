import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Activity } from '@/types/database.types';
import { ActivitiesContext } from '@/contexts/activities-context';

export const ActivitiesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch activities from Supabase
    useEffect(() => {
        const fetchActivities = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const { data, error: supabaseError } = await supabase
                    .from('activities')
                    .select('*')
                    .order('date', { ascending: true });

                if (supabaseError) throw supabaseError;

                setActivities(data || []);
            } catch (err) {
                console.error('Error fetching activities:', err);
                setError('Failed to fetch activities');
            } finally {
                setIsLoading(false);
            }
        };

        fetchActivities();

        // Subscribe to changes
        const channel = supabase
            .channel('activities_changes')
            .on('postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'activities'
                },
                () => {
                    fetchActivities(); // Refresh data
                }
            )
            .subscribe();

        return () => {
            channel.unsubscribe();
        };
    }, []);

    const addActivity = async (activityData: Omit<Activity, 'id' | 'created_at' | 'updated_at'>) => {
        try {
            setError(null);
            const { data, error: supabaseError } = await supabase
                .from('activities')
                .insert([activityData])
                .select()
                .single();

            if (supabaseError) throw supabaseError;

            setActivities(prev => [data, ...prev]);
        } catch (err) {
            console.error('Error adding activity:', err);
            setError('Failed to add activity');
            throw err;
        }
    };

    const updateActivity = async (id: string, updates: Partial<Activity>) => {
        try {
            setError(null);
            const { data, error: supabaseError } = await supabase
                .from('activities')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (supabaseError) throw supabaseError;

            setActivities(prev =>
                prev.map(activity => (activity.id === id ? { ...activity, ...data } : activity))
            );
        } catch (err) {
            console.error('Error updating activity:', err);
            setError('Failed to update activity');
            throw err;
        }
    };

    const deleteActivity = async (id: string) => {
        try {
            setError(null);
            const { error: supabaseError } = await supabase
                .from('activities')
                .delete()
                .eq('id', id);

            if (supabaseError) throw supabaseError;

            setActivities(prev => prev.filter(activity => activity.id !== id));
        } catch (err) {
            console.error('Error deleting activity:', err);
            setError('Failed to delete activity');
            throw err;
        }
    };

    const getActivity = (id: string) => {
        return activities.find(activity => activity.id === id);
    };

    const getActiveActivities = () => {
        return activities.filter(activity => activity.is_active);
    };

    const getActivitiesByCategory = (category: string) => {
        return activities.filter(
            activity => activity.category === category && activity.is_active
        );
    };

    return (
        <ActivitiesContext.Provider
            value={{
                activities,
                addActivity,
                updateActivity,
                deleteActivity,
                getActivity,
                getActiveActivities,
                getActivitiesByCategory,
                isLoading,
                error
            }}
        >
            {children}
        </ActivitiesContext.Provider>
    );
};
