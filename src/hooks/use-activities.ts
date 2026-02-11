import { useContext } from 'react';
import { ActivitiesContext } from '@/contexts/activities-context';

export const useActivities = () => {
    const context = useContext(ActivitiesContext);
    if (context === undefined) {
        throw new Error('useActivities must be used within an ActivitiesProvider');
    }
    return context;
};
