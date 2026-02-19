import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useSurahList } from '@/hooks/useQuran';
import { useAudioUrls } from '@/hooks/useQuran';
import { useGameScores, useLeaderboard } from '@/hooks/useGameScores';
import { useAchievements } from '@/hooks/useAchievements';
import { useAuth } from '@/hooks/use-auth';
import { quran } from '@/services/quranService';
import {
    ArrowLeft,
    Play,
    Pause,
    RotateCcw,
    Trophy,
    Clock,
    Volume2,
    CheckCircle2,
    XCircle,
    Target,
    Award,
    ChevronRight,
    SkipForward,
    RefreshCw,
    Users,
} from 'lucide-react';
import LoginRequiredDialog from '@/components/LoginRequiredDialog';
import type { Surat } from '@/types/quran';

interface Question {
    surahNomor: number;
    surahNama: string;
    ayatNomor: number;
    audioUrl: string | null;
    arabicText: string | null; // Arabic text of the ayat
    options: { label: string; value: string; isCorrect: boolean }[];
}

interface GameResult {
    questionIndex: number;
    question: Question;
    userAnswer: string | null;
    correctAnswer: string;
    isCorrect: boolean;
    timeTaken: number;
}

type GameState = 'info' | 'playing' | 'finished';

const TOTAL_QUESTIONS = 10;
const TIME_PER_QUESTION = 30; // seconds

const TebakAyat: React.FC = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const { user } = useAuth();
    const { surahs, loading: surahsLoading } = useSurahList();
    const { getAudioAyat } = useAudioUrls();
    const { saveScore, getUserStats } = useGameScores();
    const { checkAchievements, newlyUnlocked, clearNewlyUnlocked } = useAchievements();
    const { leaderboard, loading: leaderboardLoading, refresh: refreshLeaderboard } = useLeaderboard('tebak-ayat');

    const [gameState, setGameState] = useState<GameState>('info');
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [results, setResults] = useState<GameResult[]>([]);
    const [timer, setTimer] = useState(TIME_PER_QUESTION);
    const [totalTime, setTotalTime] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [showAnswer, setShowAnswer] = useState(false);
    const [showArabicText, setShowArabicText] = useState(true);
    const [maxStreak, setMaxStreak] = useState(0);
    const [currentStreak, setCurrentStreak] = useState(0);
    const [loadingQuestions, setLoadingQuestions] = useState(false);
    const [showLoginDialog, setShowLoginDialog] = useState(false);

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const totalTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const questionStartTimeRef = useRef<number>(0);

    // Generate questions
    const generateQuestions = useCallback(async () => {
        if (!surahs || surahs.length === 0) return;
        setLoadingQuestions(true);

        const newQuestions: Question[] = [];
        const usedSurahs = new Set<number>();

        // Pick random surahs with known ayat counts
        const surahsWithAyat = surahs.filter(s => s.jumlahAyat > 0);

        for (let i = 0; i < TOTAL_QUESTIONS; i++) {
            let surah: Surat;
            do {
                surah = surahsWithAyat[Math.floor(Math.random() * surahsWithAyat.length)];
            } while (usedSurahs.has(surah.nomor) && usedSurahs.size < surahsWithAyat.length);
            usedSurahs.add(surah.nomor);

            const ayatNomor = Math.floor(Math.random() * surah.jumlahAyat) + 1;

            // Generate 4 options (1 correct + 3 distractors)
            const correctAnswer = `${surah.namaLatin}:${ayatNomor}`;
            const distractors: string[] = [];

            while (distractors.length < 3) {
                const randSurah = surahsWithAyat[Math.floor(Math.random() * surahsWithAyat.length)];
                const randAyat = Math.floor(Math.random() * randSurah.jumlahAyat) + 1;
                const option = `${randSurah.namaLatin}:${randAyat}`;
                if (option !== correctAnswer && !distractors.includes(option)) {
                    distractors.push(option);
                }
            }

            // Shuffle options
            const allOptions = [
                { label: correctAnswer, value: correctAnswer, isCorrect: true },
                ...distractors.map(d => ({ label: d, value: d, isCorrect: false })),
            ].sort(() => Math.random() - 0.5);

            // Get audio URL
            let audioUrl: string | null = null;
            try {
                const audio = await getAudioAyat(surah.nomor, ayatNomor);
                if (audio) {
                    audioUrl = typeof audio === 'string' ? audio : (audio as Record<string, string>).url || null;
                }
            } catch {
                console.warn(`Could not load audio for ${surah.namaLatin}:${ayatNomor}`);
            }

            // Get Arabic text from surah detail
            let arabicText: string | null = null;
            try {
                const surahDetail = await quran.getSurat(surah.nomor);
                const ayat = surahDetail.ayat.find((a: { nomorAyat: number }) => a.nomorAyat === ayatNomor);
                if (ayat) {
                    arabicText = ayat.teksArab;
                }
            } catch {
                console.warn(`Could not load Arabic text for ${surah.namaLatin}:${ayatNomor}`);
            }

            newQuestions.push({
                surahNomor: surah.nomor,
                surahNama: surah.namaLatin,
                ayatNomor,
                audioUrl,
                arabicText,
                options: allOptions,
            });
        }

        setQuestions(newQuestions);
        setLoadingQuestions(false);
    }, [surahs, getAudioAyat]);

    // Start game
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
        setShowArabicText(true);
        setMaxStreak(0);
        setCurrentStreak(0);
        questionStartTimeRef.current = Date.now();

        // Start total timer
        totalTimerRef.current = setInterval(() => {
            setTotalTime(prev => prev + 1);
        }, 1000);
    };

    // Auto-play audio when question changes
    useEffect(() => {
        if (gameState !== 'playing') return;
        if (showAnswer) return;

        const question = questions[currentIndex];
        if (!question?.audioUrl) return;

        // Stop previous audio
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }

        // Reset Arabic text visibility
        setShowArabicText(true);

        // Small delay to allow UI to settle, then auto-play
        const playTimer = setTimeout(() => {
            const audio = new Audio(question.audioUrl!);
            audioRef.current = audio;

            audio.play()
                .then(() => setIsPlaying(true))
                .catch(() => {
                    // Browser might block auto-play, user can click manually
                    setIsPlaying(false);
                });

            audio.onended = () => {
                setIsPlaying(false);
                setShowArabicText(false); // Hide Arabic text when audio ends
            };
            audio.onerror = () => {
                setIsPlaying(false);
            };
        }, 300);

        return () => clearTimeout(playTimer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gameState, currentIndex, questions]);

    // Timer countdown
    useEffect(() => {
        if (gameState !== 'playing' || showAnswer) return;

        timerRef.current = setInterval(() => {
            setTimer(prev => {
                if (prev <= 1) {
                    // Time's up — treat as wrong, move to next immediately
                    handleTimeUp();
                    return TIME_PER_QUESTION;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gameState, currentIndex, showAnswer]);

    // Handle time up — wrong answer, skip immediately without showing correct answer
    const handleTimeUp = useCallback(() => {
        if (showAnswer) return;
        if (timerRef.current) clearInterval(timerRef.current);

        // Stop audio
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
            setIsPlaying(false);
        }

        const question = questions[currentIndex];
        if (!question) return;

        const correctAnswer = question.options.find(o => o.isCorrect)!.value;
        const timeTaken = Math.round((Date.now() - questionStartTimeRef.current) / 1000);

        // Reset streak
        setCurrentStreak(0);

        const result: GameResult = {
            questionIndex: currentIndex,
            question,
            userAnswer: null,
            correctAnswer,
            isCorrect: false,
            timeTaken,
        };

        const newResults = [...results, result];
        setResults(newResults);

        // Move to next question immediately (no delay, no answer reveal)
        if (currentIndex < TOTAL_QUESTIONS - 1) {
            setCurrentIndex(prev => prev + 1);
            setTimer(TIME_PER_QUESTION);
            setShowAnswer(false);
            setShowArabicText(true);
            questionStartTimeRef.current = Date.now();
        } else {
            finishGame(newResults);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentIndex, questions, showAnswer, results]);

    // Handle answer selection
    const handleAnswer = useCallback((answer: string) => {
        if (showAnswer) return;

        if (timerRef.current) clearInterval(timerRef.current);

        // Stop audio
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
            setIsPlaying(false);
        }

        const question = questions[currentIndex];
        if (!question) return;

        const correctAnswer = question.options.find(o => o.isCorrect)!.value;
        const isCorrect = answer === correctAnswer;
        const timeTaken = Math.round((Date.now() - questionStartTimeRef.current) / 1000);

        // Update streak
        if (isCorrect) {
            const newStreak = currentStreak + 1;
            setCurrentStreak(newStreak);
            setMaxStreak(prev => Math.max(prev, newStreak));
        } else {
            setCurrentStreak(0);
        }

        setShowAnswer(true);

        const result: GameResult = {
            questionIndex: currentIndex,
            question,
            userAnswer: answer,
            correctAnswer,
            isCorrect,
            timeTaken,
        };

        const newResults = [...results, result];
        setResults(newResults);

        // Auto advance after brief pause — don't show correct answer
        setTimeout(() => {
            if (currentIndex < TOTAL_QUESTIONS - 1) {
                setCurrentIndex(prev => prev + 1);
                setTimer(TIME_PER_QUESTION);
                setShowAnswer(false);
                setShowArabicText(true);
                questionStartTimeRef.current = Date.now();
            } else {
                finishGame(newResults);
            }
        }, 800);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentIndex, questions, showAnswer, results, currentStreak]);

    // Finish game
    const finishGame = async (finalResults: GameResult[]) => {
        if (timerRef.current) clearInterval(timerRef.current);
        if (totalTimerRef.current) clearInterval(totalTimerRef.current);

        // Stop audio
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }

        setGameState('finished');

        const correctCount = finalResults.filter(r => r.isCorrect).length;
        const accuracy = Math.round((correctCount / TOTAL_QUESTIONS) * 100);
        const score = calculateScore(finalResults);

        // Save score to Supabase
        await saveScore({
            game_type: 'tebak-ayat',
            score,
            correct_answers: correctCount,
            total_questions: TOTAL_QUESTIONS,
            accuracy,
            time_seconds: totalTime,
        });

        // Check achievements
        const stats = await getUserStats();
        const totalGamesPlayed = stats ? stats.totalGames : 1;
        await checkAchievements({
            accuracy,
            time_seconds: totalTime,
            max_streak: maxStreak,
            total_games_played: totalGamesPlayed,
        });
    };

    // Calculate score
    const calculateScore = (gameResults: GameResult[]): number => {
        let score = 0;
        let streak = 0;
        gameResults.forEach(r => {
            if (r.isCorrect) {
                streak++;
                score += 100 + (streak * 10); // Bonus for streak
                // Time bonus: faster = more points
                const timeBonus = Math.max(0, TIME_PER_QUESTION - r.timeTaken) * 2;
                score += timeBonus;
            } else {
                streak = 0;
            }
        });
        return score;
    };

    // Play/pause audio (manual control)
    const toggleAudio = useCallback(() => {
        const question = questions[currentIndex];
        if (!question?.audioUrl) {
            toast({
                title: 'Audio tidak tersedia',
                description: 'Audio untuk ayat ini tidak dapat dimuat.',
                variant: 'destructive',
            });
            return;
        }

        if (audioRef.current && isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
            return;
        }

        if (audioRef.current) {
            audioRef.current.pause();
        }

        const audio = new Audio(question.audioUrl);
        audioRef.current = audio;

        audio.play()
            .then(() => setIsPlaying(true))
            .catch(() => {
                toast({
                    title: 'Error',
                    description: 'Gagal memutar audio.',
                    variant: 'destructive',
                });
            });

        audio.onended = () => {
            setIsPlaying(false);
            setShowArabicText(false); // Hide Arabic text when audio ends
        };
        audio.onerror = () => setIsPlaying(false);
    }, [questions, currentIndex, isPlaying, toast]);

    // Cleanup
    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (totalTimerRef.current) clearInterval(totalTimerRef.current);
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, []);

    // Show achievement toast
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

    // ─── INFO PAGE ───
    if (gameState === 'info') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-background via-background to-emerald-950/20">
                <div className="container mx-auto px-4 py-8 max-w-3xl">
                    {/* Back button */}
                    <button
                        onClick={() => navigate('/game')}
                        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8 group"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        Kembali ke Game Hub
                    </button>

                    {/* Title */}
                    <div className="text-center mb-10">
                        <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent">
                            Tebak Ayat
                        </h1>
                        <p className="text-muted-foreground text-lg max-w-lg mx-auto leading-relaxed">
                            Game menebak nama surat dan nomor ayat berdasarkan audio ayat Al-Quran.
                            Uji pengetahuan Anda dan bersaing di leaderboard!
                        </p>
                    </div>

                    {/* Info Cards */}
                    <div className="grid grid-cols-3 gap-4 mb-8">
                        <Card className="bg-card/60 backdrop-blur-sm border-border shadow-lg">
                            <CardContent className="p-5 text-center">
                                <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-500/10 rounded-full mb-3">
                                    <Target className="w-6 h-6 text-emerald-400" />
                                </div>
                                <div className="text-lg font-bold text-foreground">10 Soal</div>
                                <div className="text-xs text-muted-foreground">Setiap game terdiri dari 10 soal acak</div>
                            </CardContent>
                        </Card>
                        <Card className="bg-card/60 backdrop-blur-sm border-border shadow-lg">
                            <CardContent className="p-5 text-center">
                                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-500/10 rounded-full mb-3">
                                    <Clock className="w-6 h-6 text-blue-400" />
                                </div>
                                <div className="text-lg font-bold text-foreground">~5 Menit</div>
                                <div className="text-xs text-muted-foreground">Estimasi waktu untuk menyelesaikan</div>
                            </CardContent>
                        </Card>
                        <Card className="bg-card/60 backdrop-blur-sm border-border shadow-lg">
                            <CardContent className="p-5 text-center">
                                <div className="inline-flex items-center justify-center w-12 h-12 bg-yellow-500/10 rounded-full mb-3">
                                    <Trophy className="w-6 h-6 text-yellow-400" />
                                </div>
                                <div className="text-lg font-bold text-foreground">Leaderboard</div>
                                <div className="text-xs text-muted-foreground">Bersaing dengan pemain lain</div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Start Button */}
                    <div className="text-center mb-10">
                        <Button
                            size="lg"
                            onClick={startGame}
                            disabled={surahsLoading || loadingQuestions}
                            className="h-14 px-10 text-lg font-semibold bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 shadow-xl shadow-emerald-500/20 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                        >
                            {surahsLoading || loadingQuestions ? (
                                <span className="animate-pulse">Memuat...</span>
                            ) : (
                                <>
                                    <Play className="w-5 h-5 mr-2" />
                                    Mulai Bermain
                                </>
                            )}
                        </Button>
                    </div>

                    {/* ─── LEADERBOARD ─── */}
                    <div className="border-t border-border/50 pt-8">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                                <Users className="w-5 h-5 text-emerald-400" />
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

                                    // Rank icon colors
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
                                                ? 'bg-emerald-500/5 border-emerald-500/40 ring-1 ring-emerald-500/20'
                                                : 'bg-card/50 border-border hover:bg-card/70'
                                                }`}
                                        >
                                            <CardContent className="p-4 flex items-center gap-4">
                                                {/* Rank */}
                                                <div className="flex items-center gap-2 min-w-[60px]">
                                                    {getRankIcon()}
                                                    <span className="font-bold text-foreground">#{rank}</span>
                                                </div>

                                                {/* Player Info */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold text-foreground truncate">
                                                            {entry.user_name}
                                                        </span>
                                                        {isCurrentUser && (
                                                            <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                                                                You
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">
                                                        {entry.total_games} game • {entry.total_correct}/{entry.total_questions} benar • Total: {totalMinutes}m {totalSeconds}s
                                                    </p>
                                                </div>

                                                {/* Accuracy */}
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

                    <LoginRequiredDialog
                        open={showLoginDialog}
                        onOpenChange={setShowLoginDialog}
                    />
                </div>
            </div>
        );
    }

    // ─── PLAYING ───
    if (gameState === 'playing') {
        const question = questions[currentIndex];
        const progress = ((currentIndex + 1) / TOTAL_QUESTIONS) * 100;

        return (
            <div className="min-h-screen bg-gradient-to-br from-background via-background to-emerald-950/20">
                <div className="container mx-auto px-4 py-6 max-w-3xl">
                    {/* Back button */}
                    <button
                        onClick={() => navigate('/game')}
                        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6 group"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        Kembali ke Game Hub
                    </button>

                    {/* Game Header */}
                    <Card className="bg-card/80 backdrop-blur-sm border-border shadow-xl mb-6">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <Volume2 className="w-5 h-5 text-emerald-400" />
                                    <span className="font-bold text-foreground">Tebak Ayat</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-sm text-muted-foreground">
                                        Soal {currentIndex + 1} / {TOTAL_QUESTIONS}
                                    </span>
                                    <Badge variant="outline" className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {timer}s
                                    </Badge>
                                </div>
                            </div>
                            <Progress value={progress} className="h-2" />
                        </CardContent>
                    </Card>

                    {/* Question */}
                    <div className="text-center mb-6">
                        <p className="text-muted-foreground text-lg">
                            Dengarkan audio ayat berikut dan pilih nama surat beserta nomor ayatnya:
                        </p>
                    </div>

                    {/* Audio Player + Arabic Text */}
                    <Card className="bg-card/60 backdrop-blur-sm border-border shadow-xl mb-8">
                        <CardContent className="p-6">
                            {/* Arabic Text — shown while audio is playing, hidden after */}
                            {question?.arabicText && showArabicText && (
                                <div className="mb-6 transition-all duration-500">
                                    <p className="font-arabic text-right text-2xl md:text-3xl leading-[2.2] text-foreground/90">
                                        {question.arabicText}
                                    </p>
                                </div>
                            )}

                            {/* Hidden indicator when Arabic text is gone */}
                            {question?.arabicText && !showArabicText && (
                                <div className="mb-4 py-3 text-center">
                                    <p className="text-sm text-muted-foreground italic">
                                        Teks ayat telah disembunyikan. Pilih jawaban Anda!
                                    </p>
                                </div>
                            )}

                            <div className="flex items-center justify-center gap-3">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => {
                                        if (audioRef.current) {
                                            audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 5);
                                        }
                                    }}
                                    className="w-10 h-10 rounded-full"
                                >
                                    <RotateCcw className="w-4 h-4" />
                                </Button>
                                <Button
                                    size="icon"
                                    onClick={toggleAudio}
                                    className="w-14 h-14 rounded-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 shadow-lg"
                                >
                                    {isPlaying ? (
                                        <Pause className="w-6 h-6" />
                                    ) : (
                                        <Play className="w-6 h-6 ml-0.5" />
                                    )}
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => {
                                        if (audioRef.current) {
                                            audioRef.current.currentTime += 5;
                                        }
                                    }}
                                    className="w-10 h-10 rounded-full"
                                >
                                    <SkipForward className="w-4 h-4" />
                                </Button>
                            </div>
                            <p className="text-sm text-emerald-400 flex items-center justify-center gap-1 mt-4">
                                <Volume2 className="w-4 h-4" />
                                {isPlaying ? 'Audio sedang diputar...' : 'Audio Ayat Al-Quran'}
                            </p>
                        </CardContent>
                    </Card>

                    {/* Answer Options */}
                    <div className="space-y-3">
                        {question?.options.map((option, idx) => {
                            let optionClass = 'bg-card/60 border-border hover:border-emerald-500/50 hover:bg-card/80 cursor-pointer';

                            if (showAnswer) {
                                // After answering: show only red for wrong, neutral for others
                                // NEVER show the correct answer
                                if (option.value === results[results.length - 1]?.userAnswer) {
                                    if (results[results.length - 1]?.isCorrect) {
                                        optionClass = 'bg-emerald-500/10 border-emerald-500/50'; // User got it right
                                    } else {
                                        optionClass = 'bg-red-500/10 border-red-500/50'; // User got it wrong
                                    }
                                } else {
                                    optionClass = 'bg-card/30 border-border opacity-50';
                                }
                            }

                            return (
                                <Card
                                    key={idx}
                                    className={`border shadow-md transition-all duration-300 ${optionClass} ${!showAnswer ? 'hover:shadow-lg hover:scale-[1.01]' : ''
                                        }`}
                                    onClick={() => !showAnswer && handleAnswer(option.value)}
                                >
                                    <CardContent className="p-4 flex items-center justify-between">
                                        <span className="font-medium text-foreground">{option.label}</span>
                                        {showAnswer && option.value === results[results.length - 1]?.userAnswer && results[results.length - 1]?.isCorrect && (
                                            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                                        )}
                                        {showAnswer && option.value === results[results.length - 1]?.userAnswer && !results[results.length - 1]?.isCorrect && (
                                            <XCircle className="w-5 h-5 text-red-400" />
                                        )}
                                        {!showAnswer && (
                                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>

                    {/* Timer bar */}
                    <div className="mt-6 flex items-center justify-between text-sm text-muted-foreground">
                        <span>Waktu tersisa:</span>
                        <span>{timer} detik</span>
                    </div>
                    <div className="mt-2 bg-card/30 rounded-full h-2 overflow-hidden">
                        <div
                            className={`h-full transition-all duration-1000 rounded-full ${timer > 10 ? 'bg-emerald-500' : timer > 5 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                            style={{ width: `${(timer / TIME_PER_QUESTION) * 100}%` }}
                        />
                    </div>
                </div>
            </div>
        );
    }

    // ─── FINISHED ───
    const correctCount = results.filter(r => r.isCorrect).length;
    const accuracy = Math.round((correctCount / TOTAL_QUESTIONS) * 100);

    const getMotivation = () => {
        if (accuracy === 100) return { text: 'Masya Allah! Sempurna! 🌟', emoji: '🌟' };
        if (accuracy >= 80) return { text: 'Luar biasa! Pertahankan! 💪', emoji: '💪' };
        if (accuracy >= 60) return { text: 'Bagus! Terus berlatih! 📖', emoji: '📖' };
        if (accuracy >= 40) return { text: 'Tetap Semangat! 💪', emoji: '💪' };
        return { text: 'Perbanyak membaca Al-Quran ya!', emoji: '📚' };
    };

    const motivation = getMotivation();

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-emerald-950/20">
            <div className="container mx-auto px-4 py-8 max-w-3xl">
                {/* Back button */}
                <button
                    onClick={() => navigate('/game')}
                    className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8 group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Kembali ke Game Hub
                </button>

                {/* Score Card */}
                <Card className="bg-card/80 backdrop-blur-sm border-border shadow-2xl mb-8 overflow-hidden">
                    <CardContent className="p-8 text-center">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-yellow-400/20 to-orange-500/20 rounded-full mb-6">
                            <Trophy className="w-10 h-10 text-yellow-400" />
                        </div>
                        <h2 className="text-3xl font-bold text-foreground mb-6">Game Selesai!</h2>

                        <div className="grid grid-cols-4 gap-4 mb-6">
                            <div>
                                <div className="text-3xl font-bold text-emerald-400">{correctCount}</div>
                                <div className="text-sm text-muted-foreground">Benar</div>
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-foreground">{TOTAL_QUESTIONS}</div>
                                <div className="text-sm text-muted-foreground">Total Soal</div>
                            </div>
                            <div>
                                <div className={`text-3xl font-bold ${accuracy >= 70 ? 'text-emerald-400' : accuracy >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                                    {accuracy}%
                                </div>
                                <div className="text-sm text-muted-foreground">Akurasi</div>
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-blue-400">{totalTime}s</div>
                                <div className="text-sm text-muted-foreground">Waktu</div>
                            </div>
                        </div>

                        <p className="text-lg text-muted-foreground mb-6">
                            {motivation.text} {motivation.emoji}
                        </p>

                        <div className="flex gap-3 justify-center">
                            <Button
                                onClick={startGame}
                                className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 shadow-lg shadow-emerald-500/20 transition-all duration-300"
                            >
                                <Play className="w-4 h-4 mr-2" />
                                Main Lagi
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => navigate('/game')}
                                className="shadow-md"
                            >
                                Kembali ke Menu
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Review Answers */}
                <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                    <Award className="w-5 h-5" />
                    Review Jawaban
                </h3>
                <div className="space-y-4">
                    {results.map((result, idx) => (
                        <Card
                            key={idx}
                            className={`border shadow-lg transition-all duration-300 ${result.isCorrect
                                ? 'bg-emerald-500/5 border-emerald-500/20'
                                : 'bg-red-500/5 border-red-500/20'
                                }`}
                        >
                            <CardContent className="p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Badge className={result.isCorrect ? 'bg-emerald-500' : 'bg-red-500'}>
                                        Soal {idx + 1}
                                    </Badge>
                                    <span className={`text-sm font-medium ${result.isCorrect ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {result.isCorrect ? '✓ Benar' : '✗ Salah'}
                                    </span>
                                </div>
                                <div className="text-sm text-muted-foreground space-y-1">
                                    {!result.isCorrect && result.userAnswer && (
                                        <p><strong>Jawaban Anda:</strong> {result.userAnswer}</p>
                                    )}
                                    {!result.isCorrect && !result.userAnswer && (
                                        <p><strong>Jawaban Anda:</strong> <span className="text-yellow-400">Waktu habis</span></p>
                                    )}
                                    {result.isCorrect && (
                                        <p><strong>Jawaban Anda:</strong> {result.userAnswer}</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default TebakAyat;
