import { createContext } from 'react';
import type { Activity } from '@/types/database.types';

export interface ActivitiesContextType {
    activities: Activity[];
    addActivity: (activity: Omit<Activity, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
    updateActivity: (id: string, activity: Partial<Activity>) => Promise<void>;
    deleteActivity: (id: string) => Promise<void>;
    getActivity: (id: string) => Activity | undefined;
    getActiveActivities: () => Activity[];
    getActivitiesByCategory: (category: string) => Activity[];
    isLoading: boolean;
    error: string | null;
}

export const ActivitiesContext = createContext<ActivitiesContextType | undefined>(undefined);
