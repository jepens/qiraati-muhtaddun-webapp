import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useSurahList } from '@/hooks/useQuran';
import { useGameScores, useLeaderboard } from '@/hooks/useGameScores';
import { useAchievements } from '@/hooks/useAchievements';
import { useAuth } from '@/hooks/use-auth';
import { quran } from '@/services/quranService';
import {
    ArrowLeft,
    Play,
    Pause,
    Trophy,
    Clock,
    Volume2,
    Target,
    Link,
    RefreshCw,
    Users,
} from 'lucide-react';
import LoginRequiredDialog from '@/components/LoginRequiredDialog';
import type { Surat } from '@/types/quran';

// ─── Interfaces ───

interface SambungAyatOption {
    surahNomor: number;
    ayatNomor: number;
    arabicText: string;
    audioUrl: string | null;
    isCorrect: boolean;
}

interface SambungAyatQuestion {
    surahNomor: number;
    surahNama: string;
    currentAyatNomor: number;
    currentArabicText: string;
    currentAudioUrl: string | null;
    nextAyatNomor: number;
    options: SambungAyatOption[];
}

interface GameResult {
    questionIndex: number;
    question: SambungAyatQuestion;
    userAnswer: SambungAyatOption | null;
    correctAnswer: SambungAyatOption;
    isCorrect: boolean;
    timeTaken: number;
}

type GameState = 'info' | 'playing' | 'finished';

// ─── Constants ───

const TOTAL_QUESTIONS = 10;
const TIME_PER_QUESTION = 45; // seconds — longer than Tebak Ayat because reading Arabic

// ─── Component ───

const SambungAyat: React.FC = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const { user } = useAuth();
    const { surahs, loading: surahsLoading } = useSurahList();
    const { saveScore, getUserStats } = useGameScores();
    const { checkAchievements, newlyUnlocked, clearNewlyUnlocked } = useAchievements();
    const { leaderboard, loading: leaderboardLoading, refresh: refreshLeaderboard } = useLeaderboard('sambung-ayat');

    const [gameState, setGameState] = useState<GameState>('info');
    const [questions, setQuestions] = useState<SambungAyatQuestion[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [results, setResults] = useState<GameResult[]>([]);
    const [timer, setTimer] = useState(TIME_PER_QUESTION);
    const [totalTime, setTotalTime] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [optionPlayingIdx, setOptionPlayingIdx] = useState<number | null>(null);
    const [showAnswer, setShowAnswer] = useState(false);
    const [maxStreak, setMaxStreak] = useState(0);
    const [currentStreak, setCurrentStreak] = useState(0);
    const [loadingQuestions, setLoadingQuestions] = useState(false);
    const [showLoginDialog, setShowLoginDialog] = useState(false);

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const optionAudioRef = useRef<HTMLAudioElement | null>(null);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const totalTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const questionStartTimeRef = useRef<number>(0);

    // ─── Generate Questions ───

    const generateQuestions = useCallback(async () => {
        if (!surahs || surahs.length === 0) return;
        setLoadingQuestions(true);

        const newQuestions: SambungAyatQuestion[] = [];
        const usedPairs = new Set<string>(); // "surahNomor:ayatNomor"

        // Filter surahs with at least 3 ayat (for distractors from same surah)
        const eligibleSurahs = surahs.filter(s => s.jumlahAyat >= 3);

        for (let i = 0; i < TOTAL_QUESTIONS; i++) {
            // Pick a random surah
            let surah: Surat;
            let ayatIdx: number;
            let pairKey: string;

            do {
                surah = eligibleSurahs[Math.floor(Math.random() * eligibleSurahs.length)];
                // Pick ayat NOT the last one (need next ayat)
                ayatIdx = Math.floor(Math.random() * (surah.jumlahAyat - 1)) + 1;
                pairKey = `${surah.nomor}:${ayatIdx}`;
            } while (usedPairs.has(pairKey) && usedPairs.size < eligibleSurahs.length * 3);
            usedPairs.add(pairKey);

            try {
                // Fetch full surah to get ayat text
                const surahDetail = await quran.getSurat(surah.nomor);
                const currentAyat = surahDetail.ayat.find(a => a.nomorAyat === ayatIdx);
                const nextAyat = surahDetail.ayat.find(a => a.nomorAyat === ayatIdx + 1);

                if (!currentAyat || !nextAyat) continue;

                // Build correct option
                const correctOption: SambungAyatOption = {
                    surahNomor: surah.nomor,
                    ayatNomor: nextAyat.nomorAyat,
                    arabicText: nextAyat.teksArab,
                    audioUrl: nextAyat.audio?.['05'] || null,
                    isCorrect: true,
                };

                // Build distractors (mixed: some from same surah, some from others)
                const distractors: SambungAyatOption[] = [];
                const usedDistractors = new Set<string>();
                usedDistractors.add(`${surah.nomor}:${nextAyat.nomorAyat}`);
                usedDistractors.add(`${surah.nomor}:${currentAyat.nomorAyat}`);

                // Try to get 1-2 distractors from the SAME surah (harder)
                const samesurahAyats = surahDetail.ayat.filter(
                    a => a.nomorAyat !== ayatIdx && a.nomorAyat !== ayatIdx + 1
                );
                const shuffledSame = [...samesurahAyats].sort(() => Math.random() - 0.5);
                const sameCount = Math.min(2, shuffledSame.length);

                for (let j = 0; j < sameCount && distractors.length < 3; j++) {
                    const distAyat = shuffledSame[j];
                    const key = `${surah.nomor}:${distAyat.nomorAyat}`;
                    if (!usedDistractors.has(key)) {
                        usedDistractors.add(key);
                        distractors.push({
                            surahNomor: surah.nomor,
                            ayatNomor: distAyat.nomorAyat,
                            arabicText: distAyat.teksArab,
                            audioUrl: distAyat.audio?.['05'] || null,
                            isCorrect: false,
                        });
                    }
                }

                // Fill remaining distractors from OTHER surahs
                while (distractors.length < 3) {
                    const randSurah = eligibleSurahs[Math.floor(Math.random() * eligibleSurahs.length)];
                    const randAyatNomor = Math.floor(Math.random() * randSurah.jumlahAyat) + 1;
                    const dKey = `${randSurah.nomor}:${randAyatNomor}`;

                    if (usedDistractors.has(dKey)) continue;
                    usedDistractors.add(dKey);

                    try {
                        const randDetail = await quran.getSurat(randSurah.nomor);
                        const randAyat = randDetail.ayat.find(a => a.nomorAyat === randAyatNomor);
                        if (randAyat) {
                            distractors.push({
                                surahNomor: randSurah.nomor,
                                ayatNomor: randAyat.nomorAyat,
                                arabicText: randAyat.teksArab,
                                audioUrl: randAyat.audio?.['05'] || null,
                                isCorrect: false,
                            });
                        }
                    } catch {
                        // Skip if fetch fails
                    }
                }

                // Shuffle options
                const allOptions = [correctOption, ...distractors].sort(() => Math.random() - 0.5);

                newQuestions.push({
                    surahNomor: surah.nomor,
                    surahNama: surah.namaLatin,
                    currentAyatNomor: ayatIdx,
                    currentArabicText: currentAyat.teksArab,
                    currentAudioUrl: currentAyat.audio?.['05'] || null,
                    nextAyatNomor: nextAyat.nomorAyat,
                    options: allOptions,
                });
            } catch {
                console.warn(`Could not generate question for ${surah.namaLatin}:${ayatIdx}`);
            }
        }

        setQuestions(newQuestions);
        setLoadingQuestions(false);
    }, [surahs]);

    // ─── Start Game ───

    const startGame = async () => {
        if (!user) {
            setShowLoginDialog(true);
            return;
        }

        await generateQuestions();
        setGameState('playing');
        setCurrentIndex(0);
        setResults([]);
        setTimer(TIME_PER_QUESTION);
        setTotalTime(0);
        setShowAnswer(false);
        setMaxStreak(0);
        setCurrentStreak(0);
        questionStartTimeRef.current = Date.now();

        // Start total timer
        totalTimerRef.current = setInterval(() => {
            setTotalTime(prev => prev + 1);
        }, 1000);

        // Start question timer
        timerRef.current = setInterval(() => {
            setTimer(prev => {
                if (prev <= 1) {
                    handleTimeout();
                    return TIME_PER_QUESTION;
                }
                return prev - 1;
            });
        }, 1000);
    };

    // ─── Stop All Audio (helper) ───

    const stopAllAudio = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
        if (optionAudioRef.current) {
            optionAudioRef.current.pause();
            optionAudioRef.current = null;
        }
        setIsPlaying(false);
        setOptionPlayingIdx(null);
    }, []);

    // ─── Finish Game ───

    const finishGame = async (finalResults: GameResult[]) => {
        // Clear timers
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        if (totalTimerRef.current) {
            clearInterval(totalTimerRef.current);
            totalTimerRef.current = null;
        }

        setGameState('finished');

        // Calculate score from passed-in results (NOT from state, which may be stale)
        const totalCorrect = finalResults.filter(r => r.isCorrect).length;
        const totalQs = questions.length;
        const accuracy = totalQs > 0 ? Math.round((totalCorrect / totalQs) * 100) : 0;

        // Save score
        await saveScore({
            game_type: 'sambung-ayat',
            score: totalCorrect * 100 + maxStreak * 25,
            correct_answers: totalCorrect,
            total_questions: totalQs,
            accuracy,
            time_seconds: totalTime,
        });

        // Check achievements
        const userStats = await getUserStats();
        const totalGamesPlayed = userStats ? userStats.totalGames : 1;
        await checkAchievements({
            accuracy,
            time_seconds: totalTime,
            max_streak: maxStreak,
            total_games_played: totalGamesPlayed,
        });

        // Refresh leaderboard
        refreshLeaderboard();
    };

    // ─── Handle Timeout ───

    const handleTimeout = useCallback(() => {
        if (showAnswer) return;

        const question = questions[currentIndex];
        if (!question) return;

        const correctOption = question.options.find(o => o.isCorrect)!;
        const timeTaken = (Date.now() - questionStartTimeRef.current) / 1000;

        const result: GameResult = {
            questionIndex: currentIndex,
            question,
            userAnswer: null,
            correctAnswer: correctOption,
            isCorrect: false,
            timeTaken,
        };

        const newResults = [...results, result];
        setResults(newResults);

        // Reset streak
        setCurrentStreak(0);

        // Move to next or finish
        stopAllAudio();
        if (currentIndex + 1 >= questions.length) {
            finishGame(newResults);
        } else {
            setCurrentIndex(prev => prev + 1);
            setTimer(TIME_PER_QUESTION);
            setShowAnswer(false);
            questionStartTimeRef.current = Date.now();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentIndex, questions, showAnswer, results]);

    // ─── Handle Answer ───

    const handleAnswer = useCallback((option: SambungAyatOption) => {
        if (showAnswer) return;

        const question = questions[currentIndex];
        if (!question) return;

        const timeTaken = (Date.now() - questionStartTimeRef.current) / 1000;
        const isCorrect = option.isCorrect;

        const result: GameResult = {
            questionIndex: currentIndex,
            question,
            userAnswer: option,
            correctAnswer: question.options.find(o => o.isCorrect)!,
            isCorrect,
            timeTaken,
        };

        const newResults = [...results, result];
        setResults(newResults);

        if (isCorrect) {
            const newStreak = currentStreak + 1;
            setCurrentStreak(newStreak);
            setMaxStreak(prev => Math.max(prev, newStreak));
        } else {
            setCurrentStreak(0);
        }

        // Move to next or finish
        stopAllAudio();
        if (currentIndex + 1 >= questions.length) {
            finishGame(newResults);
        } else {
            setCurrentIndex(prev => prev + 1);
            setTimer(TIME_PER_QUESTION);
            setShowAnswer(false);
            questionStartTimeRef.current = Date.now();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentIndex, questions, showAnswer, currentStreak, results]);

    // ─── Audio Controls ───

    const toggleCurrentAudio = useCallback(() => {
        const question = questions[currentIndex];
        if (!question?.currentAudioUrl) return;

        if (audioRef.current && isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
            return;
        }

        // Stop option audio if playing
        if (optionAudioRef.current) {
            optionAudioRef.current.pause();
            setOptionPlayingIdx(null);
        }

        const audio = new Audio(question.currentAudioUrl);
        audioRef.current = audio;

        audio.onplay = () => setIsPlaying(true);
        audio.onended = () => setIsPlaying(false);
        audio.onerror = () => setIsPlaying(false);

        audio.play().catch(() => {
            toast({
                title: 'Audio Error',
                description: 'Tidak dapat memutar audio.',
                variant: 'destructive',
            });
        });
    }, [questions, currentIndex, isPlaying, toast]);

    const playOptionAudio = useCallback((optionIdx: number, audioUrl: string | null) => {
        if (!audioUrl) return;

        // If same option is playing, toggle off
        if (optionPlayingIdx === optionIdx && optionAudioRef.current) {
            optionAudioRef.current.pause();
            setOptionPlayingIdx(null);
            return;
        }

        // Stop current audios
        if (audioRef.current) {
            audioRef.current.pause();
            setIsPlaying(false);
        }
        if (optionAudioRef.current) {
            optionAudioRef.current.pause();
        }

        const audio = new Audio(audioUrl);
        optionAudioRef.current = audio;

        audio.onplay = () => setOptionPlayingIdx(optionIdx);
        audio.onended = () => setOptionPlayingIdx(null);
        audio.onerror = () => setOptionPlayingIdx(null);

        audio.play().catch(() => {
            toast({
                title: 'Audio Error',
                description: 'Tidak dapat memutar audio opsi.',
                variant: 'destructive',
            });
        });
    }, [optionPlayingIdx, toast]);

    // ─── Cleanup on unmount ───

    useEffect(() => {
        return () => {
            if (audioRef.current) audioRef.current.pause();
            if (optionAudioRef.current) optionAudioRef.current.pause();
            if (timerRef.current) clearInterval(timerRef.current);
            if (totalTimerRef.current) clearInterval(totalTimerRef.current);
        };
    }, []);

    // Auto-play current question audio
    useEffect(() => {
        if (gameState !== 'playing') return;
        const question = questions[currentIndex];
        if (!question?.currentAudioUrl) return;

        // Auto-play with slight delay
        const timeout = setTimeout(() => {
            const audio = new Audio(question.currentAudioUrl!);
            audioRef.current = audio;
            audio.onplay = () => setIsPlaying(true);
            audio.onended = () => setIsPlaying(false);
            audio.onerror = () => setIsPlaying(false);
            audio.play().catch(() => {
                // Browser may block autoplay
                setIsPlaying(false);
            });
        }, 300);

        return () => clearTimeout(timeout);
    }, [gameState, currentIndex, questions]);

    // Achievement toasts
    useEffect(() => {
        if (newlyUnlocked.length > 0) {
            newlyUnlocked.forEach(achievement => {
                toast({
                    title: `🏆 Achievement Unlocked!`,
                    description: `${achievement.name}: ${achievement.description}`,
                });
            });
            clearNewlyUnlocked();
        }
    }, [newlyUnlocked, toast, clearNewlyUnlocked]);

    // ─── Helpers ───

    const currentQuestion = questions[currentIndex];

    const getPerformanceMessage = (accuracy: number) => {
        if (accuracy >= 90) return { text: 'Luar Biasa! 🌟', sub: 'Hafalan Anda sangat kuat!' };
        if (accuracy >= 70) return { text: 'Hebat! 💪', sub: 'Terus pertahankan!' };
        if (accuracy >= 50) return { text: 'Cukup Baik 👍', sub: 'Terus belajar dan berlatih!' };
        return { text: 'Tetap Semangat! 🔥', sub: 'Latihan membuat sempurna!' };
    };

    // ═══════════════════════════════════════════
    // ─── INFO STATE ───
    // ═══════════════════════════════════════════

    if (gameState === 'info') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-background via-background to-teal-950/20">
                <div className="container mx-auto px-4 py-8 md:py-12">
                    {/* Back button */}
                    <button
                        onClick={() => navigate('/game')}
                        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8 group"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        Kembali ke Game Hub
                    </button>

                    {/* Header */}
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-teal-500/10 rounded-full mb-6">
                            <Link className="w-10 h-10 text-teal-400" />
                        </div>
                        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-teal-400 to-teal-600 bg-clip-text text-transparent">
                            Sambung Ayat
                        </h1>
                        <p className="text-muted-foreground text-xl max-w-2xl mx-auto leading-relaxed">
                            Game menebak ayat selanjutnya berdasarkan ayat yang diputar. Uji hafalan dan pengetahuan sambungan ayat Al-Quran Anda!
                        </p>
                    </div>

                    <div className="max-w-4xl mx-auto space-y-8">
                        {/* Info Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Card className="bg-card/60 backdrop-blur-sm border-border shadow-lg text-center">
                                <CardContent className="p-6">
                                    <div className="inline-flex items-center justify-center w-14 h-14 bg-teal-500/10 rounded-full mb-4">
                                        <Target className="w-7 h-7 text-teal-400" />
                                    </div>
                                    <div className="text-xl font-bold text-foreground mb-1">10 Soal</div>
                                    <p className="text-sm text-muted-foreground">Setiap game terdiri dari 10 soal acak</p>
                                </CardContent>
                            </Card>
                            <Card className="bg-card/60 backdrop-blur-sm border-border shadow-lg text-center">
                                <CardContent className="p-6">
                                    <div className="inline-flex items-center justify-center w-14 h-14 bg-teal-500/10 rounded-full mb-4">
                                        <Clock className="w-7 h-7 text-teal-400" />
                                    </div>
                                    <div className="text-xl font-bold text-foreground mb-1">~8 Menit</div>
                                    <p className="text-sm text-muted-foreground">45 detik per soal untuk membaca dan memilih</p>
                                </CardContent>
                            </Card>
                            <Card className="bg-card/60 backdrop-blur-sm border-border shadow-lg text-center">
                                <CardContent className="p-6">
                                    <div className="inline-flex items-center justify-center w-14 h-14 bg-teal-500/10 rounded-full mb-4">
                                        <Trophy className="w-7 h-7 text-teal-400" />
                                    </div>
                                    <div className="text-xl font-bold text-foreground mb-1">Leaderboard</div>
                                    <p className="text-sm text-muted-foreground">Bersaing dengan pemain lain</p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Start Button */}
                        <div className="text-center mb-10">
                            <Button
                                onClick={startGame}
                                size="lg"
                                disabled={surahsLoading || loadingQuestions}
                                className="h-20 px-12 text-xl font-bold bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 shadow-2xl shadow-teal-500/20 hover:shadow-teal-500/30 transition-all duration-300 transform hover:scale-105"
                            >
                                {loadingQuestions ? (
                                    <>
                                        <RefreshCw className="w-6 h-6 mr-3 animate-spin" />
                                        Menyiapkan Soal...
                                    </>
                                ) : (
                                    <>
                                        <Play className="w-6 h-6 mr-3" />
                                        Mulai Bermain
                                    </>
                                )}
                            </Button>
                        </div>

                        {/* ─── LEADERBOARD ─── */}
                        <div className="border-t border-border/50 pt-8">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                                    <Users className="w-5 h-5 text-teal-400" />
                                    Leaderboard Bulan Ini - Top 10
                                </h2>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={refreshLeaderboard}
                                    disabled={leaderboardLoading}
                                    className="gap-2"
                                >
                                    <RefreshCw className={`w-4 h-4 ${leaderboardLoading ? 'animate-spin' : ''}`} />
                                    Refresh
                                </Button>
                            </div>

                            {leaderboardLoading ? (
                                <div className="space-y-3">
                                    {[...Array(3)].map((_, i) => (
                                        <div key={i} className="h-16 bg-card/30 rounded-xl animate-pulse" />
                                    ))}
                                </div>
                            ) : leaderboard.length === 0 ? (
                                <Card className="bg-card/40 border-border">
                                    <CardContent className="p-8 text-center">
                                        <Trophy className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                                        <p className="text-muted-foreground">Belum ada data leaderboard bulan ini.</p>
                                        <p className="text-sm text-muted-foreground/70 mt-1">Jadilah yang pertama bermain!</p>
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="space-y-3">
                                    {leaderboard.map((entry, idx) => {
                                        const rank = idx + 1;
                                        const isCurrentUser = user?.id === entry.user_id;
                                        const totalMinutes = Math.floor(entry.total_time / 60);
                                        const totalSeconds = entry.total_time % 60;
                                        const avgAccuracy = entry.total_questions > 0
                                            ? Math.round((entry.total_correct / entry.total_questions) * 1000) / 10
                                            : 0;

                                        const getRankIcon = () => {
                                            if (rank === 1) return <span className="text-lg">🥇</span>;
                                            if (rank === 2) return <span className="text-lg">🥈</span>;
                                            if (rank === 3) return <span className="text-lg">🥉</span>;
                                            return <span className="text-sm text-muted-foreground">🏅</span>;
                                        };

                                        return (
                                            <Card
                                                key={entry.user_id}
                                                className={`border shadow-md transition-all duration-200 ${isCurrentUser
                                                    ? 'bg-teal-500/5 border-teal-500/40 ring-1 ring-teal-500/20'
                                                    : 'bg-card/50 border-border hover:bg-card/70'
                                                    }`}
                                            >
                                                <CardContent className="p-4 flex items-center gap-4">
                                                    <div className="flex items-center gap-2 min-w-[60px]">
                                                        {getRankIcon()}
                                                        <span className="font-bold text-foreground">#{rank}</span>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-semibold text-foreground truncate">
                                                                {entry.user_name}
                                                            </span>
                                                            {isCurrentUser && (
                                                                <Badge variant="outline" className="text-xs bg-teal-500/10 text-teal-400 border-teal-500/30">
                                                                    You
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-muted-foreground">
                                                            {entry.total_games} game • {entry.total_correct}/{entry.total_questions} benar • Total: {totalMinutes}m {totalSeconds}s
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className={`text-lg font-bold ${avgAccuracy >= 80 ? 'text-emerald-400' :
                                                            avgAccuracy >= 60 ? 'text-yellow-400' :
                                                                avgAccuracy >= 40 ? 'text-orange-400' : 'text-red-400'
                                                            }`}>
                                                            {avgAccuracy}%
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">Akurasi</div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    <LoginRequiredDialog
                        open={showLoginDialog}
                        onOpenChange={setShowLoginDialog}
                    />
                </div>
            </div>
        );
    }

    // ═══════════════════════════════════════════
    // ─── PLAYING STATE ───
    // ═══════════════════════════════════════════

    if (gameState === 'playing' && currentQuestion) {
        const progressPercent = ((currentIndex) / questions.length) * 100;
        const timerPercent = (timer / TIME_PER_QUESTION) * 100;

        return (
            <div className="min-h-screen bg-gradient-to-br from-background via-background to-teal-950/20">
                <div className="container mx-auto px-4 py-6">
                    {/* Game Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-teal-500/10 rounded-full">
                                <Link className="w-5 h-5 text-teal-400" />
                            </div>
                            <h1 className="text-xl font-bold text-foreground">Sambung Ayat</h1>
                        </div>
                        <div className="flex items-center gap-4">
                            <Badge variant="outline" className="text-sm px-3 py-1">
                                Soal {currentIndex + 1} / {questions.length}
                            </Badge>
                            <Badge
                                variant="outline"
                                className={`text-sm px-3 py-1 ${timer <= 10 ? 'text-red-400 border-red-400/50 animate-pulse' : ''}`}
                            >
                                <Clock className="w-3.5 h-3.5 mr-1" />
                                {timer}s
                            </Badge>
                        </div>
                    </div>

                    {/* Progress bar */}
                    <div className="mb-6">
                        <Progress value={progressPercent} className="h-2" />
                    </div>

                    <div className="max-w-4xl mx-auto space-y-6">
                        {/* Instruction */}
                        <p className="text-center text-muted-foreground text-lg">
                            Dengarkan ayat berikut, lalu pilih ayat selanjutnya:
                        </p>

                        {/* Current Ayat Audio Player */}
                        <Card className="bg-card/60 backdrop-blur-sm border-teal-500/20 shadow-lg">
                            <CardContent className="p-6">
                                {/* Audio Controls */}
                                <div className="flex items-center justify-center gap-4 mb-4">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={toggleCurrentAudio}
                                        className="w-12 h-12 rounded-full bg-teal-500/10 border-teal-500/30 hover:bg-teal-500/20"
                                    >
                                        {isPlaying ? (
                                            <Pause className="w-5 h-5 text-teal-400" />
                                        ) : (
                                            <Play className="w-5 h-5 text-teal-400" />
                                        )}
                                    </Button>
                                </div>
                                <div className="text-center mb-4">
                                    <div className="flex items-center justify-center gap-2 text-sm text-teal-400">
                                        <Volume2 className="w-4 h-4" />
                                        Audio Ayat Saat Ini
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Dengarkan ayat ini, lalu pilih ayat selanjutnya
                                    </p>
                                </div>

                                {/* Timer bar inside card */}
                                <div className="bg-card/50 rounded-full h-2 overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-1000 ${timer <= 10 ? 'bg-red-500' : 'bg-teal-500'
                                            }`}
                                        style={{ width: `${timerPercent}%` }}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Current Arabic Text */}
                        <div className="text-center">
                            <h3 className="text-teal-400 font-semibold mb-3">Ayat Saat Ini</h3>
                            <Card className="bg-card/80 border-border shadow-lg">
                                <CardContent className="p-6">
                                    <p className="text-2xl md:text-3xl leading-loose text-foreground font-arabic text-right" dir="rtl">
                                        {currentQuestion.currentArabicText}
                                    </p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Options: "Pilih Ayat Selanjutnya" */}
                        <div>
                            <h3 className="text-teal-400 font-semibold mb-4 text-center">Pilih Ayat Selanjutnya</h3>
                            <div className="space-y-4">
                                {currentQuestion.options.map((option, idx) => (
                                    <Card
                                        key={idx}
                                        className="bg-card/50 border-border hover:border-teal-500/40 hover:bg-card/70 transition-all duration-200 cursor-pointer shadow-md hover:shadow-lg"
                                        onClick={() => handleAnswer(option)}
                                    >
                                        <CardContent className="p-4 flex items-center gap-4">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-lg md:text-xl leading-relaxed text-foreground font-arabic text-right" dir="rtl">
                                                    {option.arabicText}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                {/* Audio preview button */}
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="w-9 h-9 rounded-full"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        playOptionAudio(idx, option.audioUrl);
                                                    }}
                                                >
                                                    {optionPlayingIdx === idx ? (
                                                        <Pause className="w-4 h-4 text-teal-400" />
                                                    ) : (
                                                        <Volume2 className="w-4 h-4 text-muted-foreground" />
                                                    )}
                                                </Button>
                                                {/* Pilih button */}
                                                <Button
                                                    size="sm"
                                                    className="bg-teal-500/10 text-teal-400 border border-teal-500/30 hover:bg-teal-500/20"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleAnswer(option);
                                                    }}
                                                >
                                                    Pilih
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>

                        {/* Remaining time text */}
                        <div className="text-center text-sm text-muted-foreground">
                            Waktu tersisa: <span className={`font-bold ${timer <= 10 ? 'text-red-400' : 'text-foreground'}`}>{timer} detik</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ═══════════════════════════════════════════
    // ─── FINISHED STATE ───
    // ═══════════════════════════════════════════

    if (gameState === 'finished') {
        const correctCount = results.filter(r => r.isCorrect).length;
        const totalQs = questions.length;
        const accuracy = totalQs > 0 ? Math.round((correctCount / totalQs) * 100) : 0;
        const performance = getPerformanceMessage(accuracy);

        return (
            <div className="min-h-screen bg-gradient-to-br from-background via-background to-teal-950/20">
                <div className="container mx-auto px-4 py-8">
                    {/* Back button */}
                    <button
                        onClick={() => navigate('/game')}
                        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8 group"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        Kembali ke Game Hub
                    </button>

                    <div className="max-w-4xl mx-auto">
                        {/* Results Summary */}
                        <Card className="bg-card/60 backdrop-blur-sm border-border shadow-2xl mb-10">
                            <CardContent className="p-8 text-center">
                                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-yellow-400/20 to-orange-500/20 rounded-full mb-4">
                                    <Trophy className="w-10 h-10 text-yellow-400" />
                                </div>
                                <h2 className="text-3xl font-bold text-foreground mb-6">Game Selesai!</h2>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                                    <div>
                                        <div className="text-3xl font-bold text-teal-400">{correctCount}</div>
                                        <div className="text-sm text-muted-foreground">Benar</div>
                                    </div>
                                    <div>
                                        <div className="text-3xl font-bold text-foreground">{totalQs}</div>
                                        <div className="text-sm text-muted-foreground">Total Soal</div>
                                    </div>
                                    <div>
                                        <div className={`text-3xl font-bold ${accuracy >= 80 ? 'text-emerald-400' :
                                            accuracy >= 60 ? 'text-yellow-400' :
                                                accuracy >= 40 ? 'text-orange-400' : 'text-red-400'
                                            }`}>{accuracy}%</div>
                                        <div className="text-sm text-muted-foreground">Akurasi</div>
                                    </div>
                                    <div>
                                        <div className="text-3xl font-bold text-blue-400">{totalTime}s</div>
                                        <div className="text-sm text-muted-foreground">Waktu</div>
                                    </div>
                                </div>

                                <div className="mb-6">
                                    <div className="text-xl font-bold text-foreground">{performance.text}</div>
                                    <p className="text-muted-foreground">{performance.sub}</p>
                                </div>

                                <div className="flex items-center justify-center gap-4">
                                    <Button
                                        onClick={startGame}
                                        className="bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 shadow-lg shadow-teal-500/20 transition-all duration-300 font-semibold"
                                    >
                                        <Play className="w-5 h-5 mr-2" />
                                        Main Lagi
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setGameState('info');
                                            setQuestions([]);
                                            setResults([]);
                                            setCurrentIndex(0);
                                        }}
                                        className="font-semibold"
                                    >
                                        Kembali ke Menu
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Review Jawaban */}
                        <h2 className="text-2xl font-bold text-foreground mb-6">Review Jawaban</h2>
                        <div className="space-y-6">
                            {results.map((result, idx) => {
                                const isCorrect = result.isCorrect;
                                return (
                                    <Card
                                        key={idx}
                                        className={`border shadow-lg ${isCorrect
                                            ? 'border-emerald-500/30 bg-emerald-500/5'
                                            : 'border-red-500/30 bg-red-500/5'
                                            }`}
                                    >
                                        <CardContent className="p-6">
                                            {/* Question header */}
                                            <div className="flex items-center gap-2 mb-4">
                                                <Badge
                                                    className={`${isCorrect ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'} border-0`}
                                                >
                                                    Soal {idx + 1}
                                                </Badge>
                                                <span className={`text-sm font-semibold ${isCorrect ? 'text-emerald-400' : 'text-red-400'}`}>
                                                    {isCorrect ? '✓ Benar' : '✗ Salah'}
                                                </span>
                                            </div>

                                            {/* Current ayat (question) */}
                                            <div className="mb-4">
                                                <div className="text-sm text-muted-foreground mb-2">Ayat Saat Ini:</div>
                                                <div className="bg-card/80 rounded-lg p-4">
                                                    <p className="text-lg leading-relaxed text-foreground font-arabic text-right" dir="rtl">
                                                        {result.question.currentArabicText}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* User answer vs Correct answer */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <div className="text-sm text-muted-foreground mb-2">Jawaban Anda:</div>
                                                    <div className={`rounded-lg p-4 ${isCorrect ? 'bg-emerald-500/10' : 'bg-red-500/10'
                                                        }`}>
                                                        <p className="text-base leading-relaxed text-foreground font-arabic text-right" dir="rtl">
                                                            {result.userAnswer?.arabicText || '(Waktu habis)'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="text-sm text-muted-foreground mb-2">Jawaban Benar:</div>
                                                    <div className="bg-emerald-500/10 rounded-lg p-4">
                                                        <p className="text-base leading-relaxed text-foreground font-arabic text-right" dir="rtl">
                                                            {result.correctAnswer.arabicText}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Loading/fallback
    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-teal-950/20 flex items-center justify-center">
            <div className="text-center">
                <RefreshCw className="w-8 h-8 text-teal-400 animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Memuat permainan...</p>
            </div>
        </div>
    );
};

export default SambungAyat;
