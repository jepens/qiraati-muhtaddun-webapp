import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useSurahList } from '@/hooks/useQuran';
import { Gamepad2, RotateCcw, Trophy, Target, Clock, Star } from 'lucide-react';

interface Card {
  id: number;
  type: 'name' | 'meaning' | 'number';
  value: string;
  surahId: number;
  isFlipped: boolean;
  isMatched: boolean;
}

interface GameStats {
  score: number;
  moves: number;
  time: number;
  streak: number;
}

const GameHafalan: React.FC = () => {
  const [gameMode, setGameMode] = useState<'name-meaning' | 'name-number' | 'meaning-number'>('name-meaning');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'paused' | 'gameOver'>('menu');
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [matchedPairs, setMatchedPairs] = useState<number>(0);
  const [stats, setStats] = useState<GameStats>({
    score: 0,
    moves: 0,
    time: 0,
    streak: 0
  });
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);

  const { surahs: allSurahs } = useSurahList();
  const { toast } = useToast();

  // Generate cards based on game mode and difficulty
  const generateCards = () => {
    if (!allSurahs || allSurahs.length === 0) return;

    const cardCount = difficulty === 'easy' ? 8 : difficulty === 'medium' ? 12 : 16;
    const pairsNeeded = cardCount / 2;
    
    // Randomly select surahs from all 114 surahs
    const shuffledSurahs = [...allSurahs].sort(() => Math.random() - 0.5);
    const selectedSurahs = shuffledSurahs.slice(0, pairsNeeded);
    
    const newCards: Card[] = [];
    
    selectedSurahs.forEach((surah, index) => {
      // First card
      newCards.push({
        id: index * 2,
        type: 'name',
        value: surah.namaLatin,
        surahId: surah.nomor,
        isFlipped: false,
        isMatched: false
      });

      // Second card (matching pair)
      if (gameMode === 'name-meaning') {
        newCards.push({
          id: index * 2 + 1,
          type: 'meaning',
          value: surah.arti,
          surahId: surah.nomor,
          isFlipped: false,
          isMatched: false
        });
      } else if (gameMode === 'name-number') {
        newCards.push({
          id: index * 2 + 1,
          type: 'number',
          value: surah.nomor.toString(),
          surahId: surah.nomor,
          isFlipped: false,
          isMatched: false
        });
      } else {
        newCards.push({
          id: index * 2 + 1,
          type: 'number',
          value: surah.nomor.toString(),
          surahId: surah.nomor,
          isFlipped: false,
          isMatched: false
        });
      }
    });

    // Shuffle cards
    const shuffledCards = newCards.sort(() => Math.random() - 0.5);
    setCards(shuffledCards);
  };

  // Start game
  const startGame = () => {
    generateCards();
    setGameState('playing');
    setStats({ score: 0, moves: 0, time: 0, streak: 0 });
    setFlippedCards([]);
    setMatchedPairs(0);
    
    // Start timer
    const interval = setInterval(() => {
      setStats(prev => ({ ...prev, time: prev.time + 1 }));
    }, 1000);
    setTimer(interval);
  };

  // Handle card click
  const handleCardClick = (cardId: number) => {
    if (gameState !== 'playing') return;
    
    const card = cards.find(c => c.id === cardId);
    if (!card || card.isFlipped || card.isMatched) return;

    // Prevent clicking more than 2 cards at once
    if (flippedCards.length >= 2) return;

    const newFlippedCards = [...flippedCards, cardId];
    setFlippedCards(newFlippedCards);

    // Flip the card
    setCards(prev => prev.map(c => 
      c.id === cardId ? { ...c, isFlipped: true } : c
    ));

    // Check for match if two cards are flipped
    if (newFlippedCards.length === 2) {
      const [firstId, secondId] = newFlippedCards;
      const firstCard = cards.find(c => c.id === firstId);
      const secondCard = cards.find(c => c.id === secondId);

      if (firstCard && secondCard && firstCard.surahId === secondCard.surahId) {
        // Match found!
        setCards(prev => prev.map(c => 
          c.id === firstId || c.id === secondId 
            ? { ...c, isMatched: true } 
            : c
        ));
        
        // Update stats and matched pairs
        setMatchedPairs(prev => {
          const newMatchedPairs = prev + 1;
          
          // Update stats with current streak
          setStats(prevStats => ({
            ...prevStats,
            score: prevStats.score + 100 + (prevStats.streak * 10),
            moves: prevStats.moves + 1,
            streak: prevStats.streak + 1
          }));
          
          // Check if game is complete
          if (newMatchedPairs === cards.length / 2) {
            setTimeout(() => {
              endGame();
            }, 500);
          }
          
          return newMatchedPairs;
        });
        
        // Reset flipped cards for next turn
        setFlippedCards([]);
        
        toast({
          title: "Match! 🎉",
          description: `Surah ${firstCard.value} ditemukan!`,
        });
      } else {
        // No match
        setTimeout(() => {
          setCards(prev => prev.map(c => 
            c.id === firstId || c.id === secondId 
              ? { ...c, isFlipped: false } 
              : c
          ));
          setFlippedCards([]);
        }, 1000);

        setStats(prev => ({
          ...prev,
          score: Math.max(0, prev.score - 10),
          moves: prev.moves + 1,
          streak: 0
        }));
      }
    }
  };

  // End game
  const endGame = () => {
    if (timer) {
      clearInterval(timer);
      setTimer(null);
    }
    setGameState('gameOver');
    
    toast({
      title: "Selamat! 🏆",
      description: `Game selesai! Skor: ${stats.score}`,
    });
  };

  // Reset game
  const resetGame = () => {
    if (timer) {
      clearInterval(timer);
      setTimer(null);
    }
    setGameState('menu');
    setCards([]);
    setFlippedCards([]);
    setMatchedPairs(0);
    setStats({ score: 0, moves: 0, time: 0, streak: 0 });
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [timer]);

  // Debug effect to monitor state changes
  useEffect(() => {
    console.log('Game State:', {
      flippedCards,
      matchedPairs,
      stats,
      gameState
    });
  }, [flippedCards, matchedPairs, stats, gameState]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (gameState === 'menu') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
        <div className="container mx-auto px-4 py-12">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-primary rounded-full mb-6 shadow-lg">
              <Gamepad2 className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-5xl font-bold text-primary mb-4 bg-gradient-to-r from-primary to-green-600 bg-clip-text text-transparent">
              Game Hafalan Surah
            </h1>
            <p className="text-muted-foreground text-xl max-w-2xl mx-auto leading-relaxed">
              Tingkatkan hapalan surah Al-Quran dengan cara yang menyenangkan dan interaktif!
            </p>
          </div>

          <div className="max-w-4xl mx-auto space-y-8">
            {/* Game Mode Selection */}
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="text-center pb-6">
                <CardTitle className="flex items-center justify-center gap-3 text-2xl">
                  <div className="p-2 bg-primary/10 rounded-full">
                    <Target className="w-6 h-6 text-primary" />
                  </div>
                  Pilih Mode Game
                </CardTitle>
                <p className="text-muted-foreground">Pilih jenis permainan yang ingin Anda mainkan</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Button
                    variant={gameMode === 'name-meaning' ? 'default' : 'outline'}
                    onClick={() => setGameMode('name-meaning')}
                    className={`h-28 flex flex-col gap-3 transition-all duration-300 ${
                      gameMode === 'name-meaning' 
                        ? 'shadow-lg scale-105' 
                        : 'hover:scale-102 hover:shadow-md'
                    }`}
                  >
                    <div className="text-2xl">📖</div>
                    <span className="font-bold text-lg">Nama ↔ Arti</span>
                    <span className="text-xs opacity-80">Cocokkan nama surah dengan artinya</span>
                  </Button>
                  <Button
                    variant={gameMode === 'name-number' ? 'default' : 'outline'}
                    onClick={() => setGameMode('name-number')}
                    className={`h-28 flex flex-col gap-3 transition-all duration-300 ${
                      gameMode === 'name-number' 
                        ? 'shadow-lg scale-105' 
                        : 'hover:scale-102 hover:shadow-md'
                    }`}
                  >
                    <div className="text-2xl">🔢</div>
                    <span className="font-bold text-lg">Nama ↔ Nomor</span>
                    <span className="text-xs opacity-80">Cocokkan nama surah dengan nomornya</span>
                  </Button>
                  <Button
                    variant={gameMode === 'meaning-number' ? 'default' : 'outline'}
                    onClick={() => setGameMode('meaning-number')}
                    className={`h-28 flex flex-col gap-3 transition-all duration-300 ${
                      gameMode === 'meaning-number' 
                        ? 'shadow-lg scale-105' 
                        : 'hover:scale-102 hover:shadow-md'
                    }`}
                  >
                    <div className="text-2xl">🎯</div>
                    <span className="font-bold text-lg">Arti ↔ Nomor</span>
                    <span className="text-xs opacity-80">Cocokkan arti surah dengan nomornya</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Difficulty Selection */}
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="text-center pb-6">
                <CardTitle className="flex items-center justify-center gap-3 text-2xl">
                  <div className="p-2 bg-primary/10 rounded-full">
                    <Star className="w-6 h-6 text-primary" />
                  </div>
                  Pilih Tingkat Kesulitan
                </CardTitle>
                <p className="text-muted-foreground">Pilih tingkat kesulitan sesuai kemampuan Anda</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Button
                    variant={difficulty === 'easy' ? 'default' : 'outline'}
                    onClick={() => setDifficulty('easy')}
                    className={`h-24 flex flex-col gap-2 transition-all duration-300 ${
                      difficulty === 'easy' 
                        ? 'shadow-lg scale-105' 
                        : 'hover:scale-102 hover:shadow-md'
                    }`}
                  >
                    <div className="text-2xl">😊</div>
                    <span className="font-bold text-lg">Mudah</span>
                    <span className="text-xs opacity-80">4 pasang kartu</span>
                  </Button>
                  <Button
                    variant={difficulty === 'medium' ? 'default' : 'outline'}
                    onClick={() => setDifficulty('medium')}
                    className={`h-24 flex flex-col gap-2 transition-all duration-300 ${
                      difficulty === 'medium' 
                        ? 'shadow-lg scale-105' 
                        : 'hover:scale-102 hover:shadow-md'
                    }`}
                  >
                    <div className="text-2xl">🤔</div>
                    <span className="font-bold text-lg">Sedang</span>
                    <span className="text-xs opacity-80">6 pasang kartu</span>
                  </Button>
                  <Button
                    variant={difficulty === 'hard' ? 'default' : 'outline'}
                    onClick={() => setDifficulty('hard')}
                    className={`h-24 flex flex-col gap-2 transition-all duration-300 ${
                      difficulty === 'hard' 
                        ? 'shadow-lg scale-105' 
                        : 'hover:scale-102 hover:shadow-md'
                    }`}
                  >
                    <div className="text-2xl">😤</div>
                    <span className="font-bold text-lg">Sulit</span>
                    <span className="text-xs opacity-80">8 pasang kartu</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Start Game Button */}
            <div className="text-center">
              <Button 
                onClick={startGame} 
                size="lg" 
                className="h-20 px-12 text-xl font-bold bg-gradient-to-r from-primary to-green-600 hover:from-primary/90 hover:to-green-600/90 shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105"
              >
                <Gamepad2 className="w-6 h-6 mr-3" />
                Mulai Game! 🎮
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Game Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary rounded-full shadow-lg">
                <Gamepad2 className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-green-600 bg-clip-text text-transparent">
                Game Hafalan
              </h1>
            </div>
            <Button 
              variant="outline" 
              onClick={resetGame}
              className="shadow-md hover:shadow-lg transition-all duration-300"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Menu Utama
            </Button>
          </div>

          {/* Game Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-primary mb-1">{stats.score}</div>
                <div className="text-sm text-muted-foreground font-medium">Skor</div>
              </CardContent>
            </Card>
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-primary mb-1">{formatTime(stats.time)}</div>
                <div className="text-sm text-muted-foreground font-medium">Waktu</div>
              </CardContent>
            </Card>
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-primary mb-1">{stats.moves}</div>
                <div className="text-sm text-muted-foreground font-medium">Gerakan</div>
              </CardContent>
            </Card>
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-primary mb-1">{stats.streak}</div>
                <div className="text-sm text-muted-foreground font-medium">Streak</div>
              </CardContent>
            </Card>
          </div>

          {/* Progress */}
          <div className="mb-8">
            <div className="flex justify-between text-sm mb-3 font-medium">
              <span className="text-muted-foreground">Progress: {matchedPairs} / {cards.length / 2}</span>
              <span className="text-primary font-bold">{Math.round((matchedPairs / (cards.length / 2)) * 100)}%</span>
            </div>
            <div className="bg-white/50 rounded-full h-4 overflow-hidden shadow-inner">
              <Progress 
                value={(matchedPairs / (cards.length / 2)) * 100} 
                className="h-4 bg-transparent"
              />
            </div>
          </div>
        </div>

        {/* Game Board */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 max-w-5xl mx-auto">
          {cards.map((card) => (
            <Card
              key={card.id}
              className={`cursor-pointer transition-all duration-500 transform hover:scale-105 shadow-lg hover:shadow-xl ${
                card.isFlipped || card.isMatched ? 'rotate-y-180' : ''
              } ${card.isMatched ? 'bg-gradient-to-br from-green-100 to-green-200 border-green-300 shadow-green-200' : 'bg-white/90 backdrop-blur-sm'}`}
              onClick={() => handleCardClick(card.id)}
            >
              <CardContent className="p-6 h-32 flex items-center justify-center text-center">
                {card.isFlipped || card.isMatched ? (
                  <div className="text-sm font-medium">
                    {card.type === 'number' ? (
                      <Badge variant="secondary" className="text-xl px-4 py-2">
                        {card.value}
                      </Badge>
                    ) : (
                      <span className="text-sm leading-tight font-semibold">{card.value}</span>
                    )}
                  </div>
                ) : (
                  <div className="text-4xl opacity-60">❓</div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Game Over Modal */}
      {gameState === 'gameOver' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="max-w-lg w-full shadow-2xl border-0 bg-white/95 backdrop-blur-md">
            <CardHeader className="text-center pb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full mb-4 shadow-lg">
                <Trophy className="w-10 h-10 text-white" />
              </div>
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-green-600 bg-clip-text text-transparent">
                Selamat! 🎉
              </CardTitle>
              <p className="text-muted-foreground text-lg">Game selesai dengan sempurna!</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center space-y-4">
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-4 rounded-xl">
                    <div className="text-3xl font-bold text-primary mb-1">{stats.score}</div>
                    <div className="text-sm text-muted-foreground font-medium">Skor</div>
                  </div>
                  <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 p-4 rounded-xl">
                    <div className="text-3xl font-bold text-green-600 mb-1">{formatTime(stats.time)}</div>
                    <div className="text-sm text-muted-foreground font-medium">Waktu</div>
                  </div>
                  <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 p-4 rounded-xl">
                    <div className="text-3xl font-bold text-blue-600 mb-1">{stats.moves}</div>
                    <div className="text-sm text-muted-foreground font-medium">Gerakan</div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 p-4 rounded-xl">
                    <div className="text-3xl font-bold text-purple-600 mb-1">{stats.streak}</div>
                    <div className="text-sm text-muted-foreground font-medium">Streak Max</div>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <Button 
                  onClick={startGame} 
                  className="flex-1 h-12 text-lg font-semibold bg-gradient-to-r from-primary to-green-600 hover:from-primary/90 hover:to-green-600/90 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <Gamepad2 className="w-5 h-5 mr-2" />
                  Main Lagi
                </Button>
                <Button 
                  onClick={resetGame} 
                  variant="outline" 
                  className="flex-1 h-12 text-lg font-semibold shadow-md hover:shadow-lg transition-all duration-300"
                >
                  <RotateCcw className="w-5 h-5 mr-2" />
                  Menu Utama
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default GameHafalan; 