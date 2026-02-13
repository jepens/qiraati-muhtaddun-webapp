import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLeaderboard } from '@/hooks/useGameScores';
import { useAchievements, ACHIEVEMENTS } from '@/hooks/useAchievements';
import { useAuth } from '@/hooks/use-auth';
import {
    Gamepad2,
    Users,
    Trophy,
    Award,
    Volume2,
    Puzzle,
    Play,
    Clock,
    HelpCircle,
    RefreshCw,
    Link,
} from 'lucide-react';

const GameHub: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { leaderboard, loading: leaderboardLoading, refresh: refreshLeaderboard } = useLeaderboard('tebak-ayat');
    const { userAchievements, isUnlocked } = useAchievements();

    const games = [
        {
            id: 'tebak-ayat',
            name: 'Tebak Ayat',
            description: 'Dengarkan audio ayat dan tebak nama surat beserta nomor ayatnya. Game klasik yang menguji hafalan Al-Quran Anda.',
            icon: Volume2,
            badge: 'Baru!',
            badgeColor: 'bg-blue-500',
            iconColor: 'text-emerald-400',
            iconBg: 'bg-emerald-500/10',
            questions: 10,
            time: '~5 menit',
            gradient: 'from-emerald-900/40 to-emerald-800/20',
            borderColor: 'border-emerald-500/20',
        },
        {
            id: 'memory-card',
            name: 'Memory Card',
            description: 'Cocokkan nama surah dengan artinya atau nomornya. Latih daya ingat dan pengetahuan surah Al-Quran.',
            icon: Puzzle,
            badge: 'Populer',
            badgeColor: 'bg-emerald-500',
            iconColor: 'text-blue-400',
            iconBg: 'bg-blue-500/10',
            questions: 'Variatif',
            time: '~5 menit',
            gradient: 'from-blue-900/40 to-blue-800/20',
            borderColor: 'border-blue-500/20',
        },
        {
            id: 'sambung-ayat',
            name: 'Sambung Ayat',
            description: 'Dengarkan ayat dan tebak ayat selanjutnya. Uji hafalan dan pengetahuan sambungan ayat Al-Quran Anda!',
            icon: Link,
            badge: 'Baru!',
            badgeColor: 'bg-teal-500',
            iconColor: 'text-teal-400',
            iconBg: 'bg-teal-500/10',
            questions: 10,
            time: '~8 menit',
            gradient: 'from-teal-900/40 to-teal-800/20',
            borderColor: 'border-teal-500/20',
        },
    ];

    const unlockedCount = userAchievements.length;
    const totalAchievements = ACHIEVEMENTS.length;

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-emerald-950/20">
            <div className="container mx-auto px-4 py-8 md:py-12">
                {/* Header */}
                <div className="text-center mb-10">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent">
                        Game Hub
                    </h1>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
                        Uji dan tingkatkan hafalan Al-Quran Anda dengan game edukatif yang menyenangkan!
                    </p>
                </div>

                {/* Stats Bar */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                    <Card className="bg-card/60 backdrop-blur-sm border-border shadow-lg hover:shadow-xl transition-all duration-300">
                        <CardContent className="p-5 text-center">
                            <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-500/10 rounded-full mb-3">
                                <Gamepad2 className="w-6 h-6 text-emerald-400" />
                            </div>
                            <div className="text-2xl font-bold text-foreground">{games.length} Game</div>
                            <div className="text-sm text-muted-foreground">Game edukatif tersedia</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-card/60 backdrop-blur-sm border-border shadow-lg hover:shadow-xl transition-all duration-300">
                        <CardContent className="p-5 text-center">
                            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-500/10 rounded-full mb-3">
                                <Users className="w-6 h-6 text-blue-400" />
                            </div>
                            <div className="text-2xl font-bold text-foreground">Pemain Aktif</div>
                            <div className="text-sm text-muted-foreground">Bergabung dengan komunitas</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-card/60 backdrop-blur-sm border-border shadow-lg hover:shadow-xl transition-all duration-300">
                        <CardContent className="p-5 text-center">
                            <div className="inline-flex items-center justify-center w-12 h-12 bg-yellow-500/10 rounded-full mb-3">
                                <Trophy className="w-6 h-6 text-yellow-400" />
                            </div>
                            <div className="text-2xl font-bold text-foreground">Leaderboard</div>
                            <div className="text-sm text-muted-foreground">Sistem ranking global</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-card/60 backdrop-blur-sm border-border shadow-lg hover:shadow-xl transition-all duration-300">
                        <CardContent className="p-5 text-center">
                            <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-500/10 rounded-full mb-3">
                                <Award className="w-6 h-6 text-purple-400" />
                            </div>
                            <div className="text-2xl font-bold text-foreground">{unlockedCount}/{totalAchievements}</div>
                            <div className="text-sm text-muted-foreground">Pencapaian & badge</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Game Tersedia */}
                <h2 className="text-2xl font-bold text-foreground mb-6">Game Tersedia</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                    {games.map((game) => {
                        const GameIcon = game.icon;
                        return (
                            <Card
                                key={game.id}
                                className={`bg-gradient-to-br ${game.gradient} border ${game.borderColor} shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] cursor-pointer`}
                                onClick={() => navigate(`/game/${game.id}`)}
                            >
                                <CardContent className="p-6">
                                    <div className="flex items-start gap-4 mb-4">
                                        <div className={`inline-flex items-center justify-center w-12 h-12 ${game.iconBg} rounded-full flex-shrink-0`}>
                                            <GameIcon className={`w-6 h-6 ${game.iconColor}`} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="text-xl font-bold text-foreground">{game.name}</h3>
                                                <Badge className={`${game.badgeColor} text-white text-xs`}>
                                                    {game.badge}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>

                                    <p className="text-muted-foreground text-sm leading-relaxed mb-5">
                                        {game.description}
                                    </p>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <HelpCircle className="w-4 h-4" />
                                                {game.questions} soal
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-4 h-4" />
                                                {game.time}
                                            </span>
                                        </div>
                                        <Button
                                            size="sm"
                                            className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 shadow-lg shadow-emerald-500/20 transition-all duration-300"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate(`/game/${game.id}`);
                                            }}
                                        >
                                            <Play className="w-4 h-4 mr-1" />
                                            Main Sekarang
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {/* Game Terpopuler (Featured) */}
                <Card className="bg-gradient-to-r from-emerald-600 to-teal-500 border-0 shadow-2xl mb-10 overflow-hidden">
                    <CardContent className="p-6 md:p-8">
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                            <div>
                                <Badge className="bg-emerald-800/50 text-emerald-100 text-xs mb-3 border-0">
                                    Game Terpopuler
                                </Badge>
                                <h3 className="text-2xl font-bold text-white mb-2">Tebak Ayat</h3>
                                <p className="text-emerald-100/90 text-sm leading-relaxed max-w-md">
                                    Game paling populer untuk menguji hafalan Al-Quran.
                                    Dengarkan audio ayat dan tebak nama surat beserta nomor ayatnya!
                                </p>
                                <div className="flex items-center gap-4 mt-3 text-sm text-emerald-100/80">
                                    <span className="flex items-center gap-1">
                                        <HelpCircle className="w-4 h-4" />
                                        10 soal
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-4 h-4" />
                                        ~5 menit
                                    </span>
                                </div>
                            </div>
                            <Button
                                size="lg"
                                onClick={() => navigate('/game/tebak-ayat')}
                                className="bg-white text-emerald-700 hover:bg-emerald-50 shadow-xl font-semibold transition-all duration-300 hover:scale-105"
                            >
                                <Play className="w-5 h-5 mr-2" />
                                Main Sekarang
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Leaderboard */}
                <div className="mb-10">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                            <Trophy className="w-6 h-6 text-yellow-400" />
                            Leaderboard Bulan Ini - Top 10
                        </h2>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={refreshLeaderboard}
                            className="shadow-md"
                        >
                            <RefreshCw className="w-4 h-4 mr-1" />
                            Refresh
                        </Button>
                    </div>

                    <Card className="bg-card/60 backdrop-blur-sm border-border shadow-xl">
                        <CardContent className="p-0">
                            {leaderboardLoading ? (
                                <div className="p-8 text-center text-muted-foreground">
                                    <div className="animate-pulse">Memuat leaderboard...</div>
                                </div>
                            ) : leaderboard.length === 0 ? (
                                <div className="p-8 text-center">
                                    <Trophy className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                                    <p className="text-muted-foreground">Belum ada skor bulan ini.</p>
                                    <p className="text-sm text-muted-foreground/70 mt-1">Jadilah yang pertama bermain!</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-border">
                                    {leaderboard.map((entry, index) => {
                                        const isCurrentUser = entry.user_id === user?.id;
                                        return (
                                            <div
                                                key={entry.user_id}
                                                className={`flex items-center justify-between p-4 transition-colors ${isCurrentUser ? 'bg-emerald-500/5' : 'hover:bg-card/80'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${index === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                                                        index === 1 ? 'bg-gray-400/20 text-gray-400' :
                                                            index === 2 ? 'bg-amber-600/20 text-amber-500' :
                                                                'bg-muted text-muted-foreground'
                                                        }`}>
                                                        {index === 0 ? '🏆' : `#${index + 1}`}
                                                    </div>
                                                    <div>
                                                        <div className={`font-semibold ${isCurrentUser ? 'text-emerald-400' : 'text-foreground'}`}>
                                                            {isCurrentUser ? 'Anda' : entry.user_name}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {entry.total_games} game • Best: {entry.best_score} poin
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-lg font-bold text-emerald-400">
                                                        {entry.best_accuracy}%
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">Akurasi</div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Achievements */}
                <div>
                    <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
                        <Award className="w-6 h-6 text-purple-400" />
                        Achievement ({unlockedCount}/{totalAchievements})
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        {ACHIEVEMENTS.map((achievement) => {
                            const AchIcon = achievement.icon;
                            const unlocked = isUnlocked(achievement.key);
                            return (
                                <Card
                                    key={achievement.key}
                                    className={`bg-card/60 backdrop-blur-sm border shadow-lg transition-all duration-300 ${unlocked
                                        ? 'border-emerald-500/30 shadow-emerald-500/10'
                                        : 'border-border opacity-50 grayscale'
                                        }`}
                                >
                                    <CardContent className="p-4 text-center">
                                        <div
                                            className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-3"
                                            style={{
                                                backgroundColor: unlocked ? `${achievement.color}20` : undefined,
                                            }}
                                        >
                                            <AchIcon
                                                className="w-6 h-6"
                                                style={{ color: unlocked ? achievement.color : undefined }}
                                            />
                                        </div>
                                        <div className="text-sm font-bold text-foreground">{achievement.name}</div>
                                        <div className="text-xs text-muted-foreground mt-1">{achievement.description}</div>
                                        {unlocked && (
                                            <Badge className="mt-2 bg-emerald-500/20 text-emerald-400 text-xs border-0">
                                                Unlocked
                                            </Badge>
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GameHub;
