import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';

export interface GameScore {
    id: string;
    user_id: string;
    game_type: 'tebak-ayat' | 'memory-card';
    score: number;
    correct_answers: number;
    total_questions: number;
    accuracy: number;
    time_seconds: number;
    played_at: string;
}

export interface LeaderboardEntry {
    user_id: string;
    user_email: string;
    user_name: string;
    total_games: number;
    total_correct: number;
    total_questions: number;
    best_score: number;
    best_accuracy: number;
    total_time: number;
}

export function useGameScores() {
    const { user } = useAuth();

    const saveScore = useCallback(async (data: {
        game_type: 'tebak-ayat' | 'memory-card' | 'sambung-ayat';
        score: number;
        correct_answers: number;
        total_questions: number;
        accuracy: number;
        time_seconds: number;
    }) => {
        if (!user) return null;

        // Get display name from user metadata (Google OAuth provides full_name)
        const displayName = user.user_metadata?.full_name
            || user.user_metadata?.name
            || user.email?.split('@')[0]
            || `Pemain ${user.id.slice(0, 4).toUpperCase()}`;

        const { data: result, error } = await supabase
            .from('game_scores')
            .insert({
                user_id: user.id,
                user_name: displayName,
                ...data,
            })
            .select()
            .single();

        if (error) {
            console.error('Error saving score:', error);
            return null;
        }

        return result;
    }, [user]);

    const getLeaderboard = useCallback(async (
        gameType: 'tebak-ayat' | 'memory-card' | 'sambung-ayat',
        limit = 10
    ): Promise<LeaderboardEntry[]> => {
        // Get current month start
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

        const { data, error } = await supabase
            .from('game_scores')
            .select('user_id, user_name, score, correct_answers, total_questions, accuracy, time_seconds')
            .eq('game_type', gameType)
            .gte('played_at', monthStart)
            .order('score', { ascending: false });

        if (error || !data) {
            console.error('Error fetching leaderboard:', error);
            return [];
        }

        // Aggregate by user
        const userMap = new Map<string, {
            user_id: string;
            user_name: string;
            total_games: number;
            total_correct: number;
            total_questions: number;
            best_score: number;
            best_accuracy: number;
            total_time: number;
        }>();

        data.forEach((entry) => {
            const existing = userMap.get(entry.user_id);
            if (existing) {
                existing.total_games += 1;
                existing.total_correct += entry.correct_answers;
                existing.total_questions += entry.total_questions;
                existing.best_score = Math.max(existing.best_score, entry.score);
                existing.best_accuracy = Math.max(existing.best_accuracy, Number(entry.accuracy));
                existing.total_time += entry.time_seconds;
                // Keep the most recent non-empty name
                if (entry.user_name && entry.user_name.trim()) {
                    existing.user_name = entry.user_name;
                }
            } else {
                userMap.set(entry.user_id, {
                    user_id: entry.user_id,
                    user_name: entry.user_name || `Pemain ${entry.user_id.slice(0, 4).toUpperCase()}`,
                    total_games: 1,
                    total_correct: entry.correct_answers,
                    total_questions: entry.total_questions,
                    best_score: entry.score,
                    best_accuracy: Number(entry.accuracy),
                    total_time: entry.time_seconds,
                });
            }
        });

        // Convert to array, sort by best_score, take top N
        const leaderboard = Array.from(userMap.values())
            .sort((a, b) => b.best_score - a.best_score)
            .slice(0, limit);

        return leaderboard.map(entry => ({
            ...entry,
            user_email: '',
        }));
    }, []);

    const getUserStats = useCallback(async (gameType?: 'tebak-ayat' | 'memory-card' | 'sambung-ayat') => {
        if (!user) return null;

        let query = supabase
            .from('game_scores')
            .select('*')
            .eq('user_id', user.id)
            .order('played_at', { ascending: false });

        if (gameType) {
            query = query.eq('game_type', gameType);
        }

        const { data, error } = await query;

        if (error || !data) {
            console.error('Error fetching user stats:', error);
            return null;
        }

        const totalGames = data.length;
        const totalCorrect = data.reduce((sum, s) => sum + s.correct_answers, 0);
        const totalQuestions = data.reduce((sum, s) => sum + s.total_questions, 0);
        const avgAccuracy = totalGames > 0
            ? data.reduce((sum, s) => sum + Number(s.accuracy), 0) / totalGames
            : 0;
        const bestScore = totalGames > 0
            ? Math.max(...data.map(s => s.score))
            : 0;

        return {
            totalGames,
            totalCorrect,
            totalQuestions,
            avgAccuracy: Math.round(avgAccuracy * 100) / 100,
            bestScore,
            recentScores: data.slice(0, 5),
        };
    }, [user]);

    return { saveScore, getLeaderboard, getUserStats };
}

export function useLeaderboard(gameType: 'tebak-ayat' | 'memory-card' | 'sambung-ayat') {
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const { getLeaderboard } = useGameScores();

    const refresh = useCallback(async () => {
        setLoading(true);
        const data = await getLeaderboard(gameType);
        setLeaderboard(data);
        setLoading(false);
    }, [gameType, getLeaderboard]);

    useEffect(() => {
        refresh();
    }, [refresh]);

    return { leaderboard, loading, refresh };
}
