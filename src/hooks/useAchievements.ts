import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';
import { Trophy, Zap, Target, Flame, Star, Award } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface AchievementDef {
    key: string;
    name: string;
    description: string;
    icon: LucideIcon;
    color: string;
}

export interface UserAchievement {
    id: string;
    user_id: string;
    achievement_key: string;
    unlocked_at: string;
}

// All available achievements
export const ACHIEVEMENTS: AchievementDef[] = [
    {
        key: 'first_game',
        name: 'Pemula',
        description: 'Selesaikan game pertama',
        icon: Star,
        color: '#10b981',
    },
    {
        key: 'perfect_score',
        name: 'Sempurna',
        description: '100% akurasi di satu game',
        icon: Trophy,
        color: '#f59e0b',
    },
    {
        key: 'speed_demon',
        name: 'Kilat',
        description: 'Selesaikan game dalam < 2 menit',
        icon: Zap,
        color: '#3b82f6',
    },
    {
        key: 'streak_5',
        name: 'Konsisten',
        description: '5 jawaban benar berturut-turut',
        icon: Flame,
        color: '#ef4444',
    },
    {
        key: 'games_10',
        name: 'Rajin',
        description: 'Mainkan 10 game',
        icon: Target,
        color: '#8b5cf6',
    },
    {
        key: 'games_50',
        name: 'Hafidz Junior',
        description: 'Mainkan 50 game',
        icon: Award,
        color: '#ec4899',
    },
];

export function useAchievements() {
    const { user } = useAuth();
    const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
    const [loading, setLoading] = useState(true);
    const [newlyUnlocked, setNewlyUnlocked] = useState<AchievementDef[]>([]);

    // Fetch user's achievements
    const fetchAchievements = useCallback(async () => {
        if (!user) {
            setUserAchievements([]);
            setLoading(false);
            return;
        }

        const { data, error } = await supabase
            .from('user_achievements')
            .select('*')
            .eq('user_id', user.id);

        if (error) {
            console.error('Error fetching achievements:', error);
        } else {
            setUserAchievements(data || []);
        }
        setLoading(false);
    }, [user]);

    useEffect(() => {
        fetchAchievements();
    }, [fetchAchievements]);

    // Unlock an achievement
    const unlockAchievement = useCallback(async (key: string) => {
        if (!user) return false;

        // Check if already unlocked
        const alreadyUnlocked = userAchievements.some(a => a.achievement_key === key);
        if (alreadyUnlocked) return false;

        const { error } = await supabase
            .from('user_achievements')
            .insert({
                user_id: user.id,
                achievement_key: key,
            });

        if (error) {
            // Might be a duplicate — that's fine
            if (error.code !== '23505') {
                console.error('Error unlocking achievement:', error);
            }
            return false;
        }

        // Find achievement definition
        const achievementDef = ACHIEVEMENTS.find(a => a.key === key);
        if (achievementDef) {
            setNewlyUnlocked(prev => [...prev, achievementDef]);
        }

        // Refresh achievements
        await fetchAchievements();
        return true;
    }, [user, userAchievements, fetchAchievements]);

    // Check and award achievements after a game
    const checkAchievements = useCallback(async (gameResult: {
        accuracy: number;
        time_seconds: number;
        max_streak: number;
        total_games_played: number;
    }) => {
        if (!user) return;

        const unlocked: string[] = [];

        // First game
        if (gameResult.total_games_played <= 1) {
            unlocked.push('first_game');
        }

        // Perfect score
        if (gameResult.accuracy === 100) {
            unlocked.push('perfect_score');
        }

        // Speed demon: < 2 minutes (120 seconds)
        if (gameResult.time_seconds < 120) {
            unlocked.push('speed_demon');
        }

        // Streak 5
        if (gameResult.max_streak >= 5) {
            unlocked.push('streak_5');
        }

        // 10 games
        if (gameResult.total_games_played >= 10) {
            unlocked.push('games_10');
        }

        // 50 games
        if (gameResult.total_games_played >= 50) {
            unlocked.push('games_50');
        }

        // Attempt to unlock each
        for (const key of unlocked) {
            await unlockAchievement(key);
        }
    }, [user, unlockAchievement]);

    // Clear newly unlocked (after showing notification)
    const clearNewlyUnlocked = useCallback(() => {
        setNewlyUnlocked([]);
    }, []);

    // Check if a specific achievement is unlocked
    const isUnlocked = useCallback((key: string) => {
        return userAchievements.some(a => a.achievement_key === key);
    }, [userAchievements]);

    return {
        achievements: ACHIEVEMENTS,
        userAchievements,
        loading,
        newlyUnlocked,
        checkAchievements,
        clearNewlyUnlocked,
        isUnlocked,
        unlockAchievement,
        refresh: fetchAchievements,
    };
}
