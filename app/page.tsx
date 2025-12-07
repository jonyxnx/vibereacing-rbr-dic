'use client';

import { useState, useEffect } from 'react';
import DrawingCanvas from './components/DrawingCanvas';
import VotingGallery from './components/VotingGallery';
import Results from './components/Results';
import {
  GameState,
  Drawing,
  getRandomWord,
  generateUserId,
} from './utils/gameUtils';
import { realtimeSync } from './utils/realtimeSync';

type GamePhase = 'drawing' | 'voting' | 'results';

export default function Home() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [userId, setUserId] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [userVote, setUserVote] = useState<string | null>(null);
  const [activePlayerCount, setActivePlayerCount] = useState<number>(0);
  const [showPlayers, setShowPlayers] = useState<boolean>(false);
  const [isJoined, setIsJoined] = useState<boolean>(false);

  // Initialize user
  useEffect(() => {
    const savedUserId = localStorage.getItem('userId');
    const savedUserName = localStorage.getItem('userName');

    if (savedUserId) {
      setUserId(savedUserId);
    } else {
      const newUserId = generateUserId();
      setUserId(newUserId);
      localStorage.setItem('userId', newUserId);
    }

    if (savedUserName) {
      setUserName(savedUserName);
      setIsJoined(true);
    }
  }, []);

  // Subscribe to real-time updates
  useEffect(() => {
    const unsubscribe = realtimeSync.subscribe((state) => {
      if (state) {
        setGameState(state);

        // Update active player count
        const thirtySecondsAgo = Date.now() - 30000;
        const activePlayers = Object.keys(state.activePlayers || {}).filter(
          (id) => state.activePlayers[id] > thirtySecondsAgo
        );
        setActivePlayerCount(activePlayers.length);

        // Check if user has already submitted
        const userDrawing = state.drawings.find(d => d.id.startsWith(userId));
        if (userDrawing) {
          setHasSubmitted(true);
        }
        // Check if user has voted
        if (state.votes[userId]) {
          setUserVote(state.votes[userId]);
        }

        // Calculate time left
        if (state.phase === 'drawing') {
          const elapsed = Math.floor((Date.now() - state.startTime) / 1000);
          setTimeLeft(Math.max(0, state.drawingTimeLimit - elapsed));
        } else if (state.phase === 'voting') {
          const elapsed = Math.floor((Date.now() - state.startTime) / 1000);
          setTimeLeft(Math.max(0, state.votingTimeLimit - (elapsed - state.drawingTimeLimit)));
        }
      }
    });

    return unsubscribe;
  }, [userId]);

  // Initialize or load game state - DEPRECATED/REMOVED
  // Hydration now handled by realtimeSync subscription
  useEffect(() => {
    // We rely on the Supabase subscription to populate gameState.
    // Presence heartbeat will take over once gameState is populated.
  }, []);

  // Timer effect
  useEffect(() => {
    if (!gameState) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - gameState.startTime) / 1000);

      if (gameState.phase === 'drawing') {
        const remaining = gameState.drawingTimeLimit - elapsed;
        setTimeLeft(Math.max(0, remaining));
        if (remaining <= 0 && !hasSubmitted) {
          checkAndAdvancePhase();
        }
      } else if (gameState.phase === 'voting') {
        const remaining = gameState.votingTimeLimit - elapsed;
        setTimeLeft(Math.max(0, remaining));
        if (remaining <= 0) {
          checkAndAdvancePhase();
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState, hasSubmitted]);

  // Update active player status and sync
  useEffect(() => {
    if (!userId || !gameState) return;

    const interval = setInterval(() => {
      // Update active player status
      const updatedState = {
        ...gameState,
        activePlayers: {
          ...(gameState.activePlayers || {}),
          [userId]: Date.now(),
        },
      };

      // Remove inactive players (30 seconds)
      const thirtySecondsAgo = Date.now() - 30000;
      Object.keys(updatedState.activePlayers).forEach((id) => {
        if (updatedState.activePlayers[id] < thirtySecondsAgo) {
          delete updatedState.activePlayers[id];
        }
      });

      const activeCount = Object.keys(updatedState.activePlayers).length;
      setActivePlayerCount(activeCount);

      // Broadcast updated state
      realtimeSync.broadcastState(updatedState);
    }, 2000); // Update every 2 seconds

    return () => clearInterval(interval);
  }, [gameState, userId]);

  function initializeNewGame() {
    // Check if a game already exists before creating a new one
    const existing = realtimeSync.getState();
    if (existing) {
      // Join existing game instead of creating new one
      const gameStateWithPlayers = {
        ...existing,
        activePlayers: {
          ...(existing.activePlayers || {}),
          ...(userId ? { [userId]: Date.now() } : {}),
        },
      };
      setGameState(gameStateWithPlayers);
      realtimeSync.broadcastState(gameStateWithPlayers);
      return;
    }

    // Only create new game if none exists
    const newState: GameState = {
      phase: 'drawing',
      currentWord: getRandomWord(),
      drawings: [],
      votes: {},
      startTime: Date.now(),
      drawingTimeLimit: 120, // 2 minutes
      votingTimeLimit: 20, // 20 seconds
      activePlayers: userId ? { [userId]: Date.now() } : {},
    };
    setGameState(newState);
    realtimeSync.broadcastState(newState);
    setHasSubmitted(false);
    setUserVote(null);
    setTimeLeft(newState.drawingTimeLimit);
  }

  function checkAndAdvancePhase() {
    if (!gameState) return;

    const elapsed = Math.floor((Date.now() - gameState.startTime) / 1000);

    if (gameState.phase === 'drawing' && elapsed >= gameState.drawingTimeLimit) {
      if (gameState.drawings.length > 0) {
        advanceToVoting();
      } else {
        // No drawings submitted, auto-restart round
        handleNewRound();
      }
    } else if (gameState.phase === 'voting' && elapsed >= gameState.drawingTimeLimit + gameState.votingTimeLimit) {
      if (Object.keys(gameState.votes).length > 0) {
        advanceToResults();
      } else {
        // No votes cast (or handling edge case), show results anyway or restart
        // For now, let's advance to results to show the empty votes (or lack thereof)
        advanceToResults();
      }
    }
  }

  function advanceToVoting() {
    if (!gameState) return;
    const newState: GameState = {
      ...gameState,
      phase: 'voting',
      startTime: Date.now() - gameState.drawingTimeLimit * 1000,
    };
    setGameState(newState);
    realtimeSync.broadcastState(newState);
    setTimeLeft(gameState.votingTimeLimit);
  }

  function advanceToResults() {
    if (!gameState) return;

    // Calculate votes
    const voteCounts: Record<string, number> = {};
    Object.values(gameState.votes).forEach((drawingId) => {
      voteCounts[drawingId] = (voteCounts[drawingId] || 0) + 1;
    });

    const drawingsWithVotes = gameState.drawings.map((drawing) => ({
      ...drawing,
      votes: voteCounts[drawing.id] || 0,
    }));

    const newState: GameState = {
      ...gameState,
      phase: 'results',
      drawings: drawingsWithVotes,
    };
    setGameState(newState);
    realtimeSync.broadcastState(newState);
  }

  async function handleDrawingComplete(imageData: string) {
    if (!gameState || hasSubmitted) return;

    // Fetch latest state to ensure we don't overwrite others' drawings
    const currentRemoteState = await realtimeSync.getRemoteState() || gameState;

    const drawingId = `${userId}_${Date.now()}`;
    const newDrawing: Drawing = {
      id: drawingId,
      imageData,
      word: currentRemoteState.currentWord,
      author: userName || `Player ${userId.slice(-4)}`,
      votes: 0,
    };

    const newState: GameState = {
      ...currentRemoteState,
      drawings: [...currentRemoteState.drawings.filter(d => !d.id.startsWith(userId)), newDrawing],
    };

    setGameState(newState);
    await realtimeSync.broadcastState(newState);
    setHasSubmitted(true);
  }

  function handleVote(drawingId: string) {
    if (!gameState || userVote === drawingId) return;

    const newState: GameState = {
      ...gameState,
      votes: {
        ...gameState.votes,
        [userId]: drawingId,
      },
    };

    setGameState(newState);
    realtimeSync.broadcastState(newState);
    setUserVote(drawingId);
  }

  function handleNewRound() {
    const newState: GameState = {
      phase: 'drawing',
      currentWord: getRandomWord(),
      drawings: [],
      votes: {},
      startTime: Date.now(),
      drawingTimeLimit: 120,
      votingTimeLimit: 20,
      activePlayers: userId ? { [userId]: Date.now() } : {},
    };
    setGameState(newState);
    realtimeSync.broadcastState(newState);
    setHasSubmitted(false);
    setUserVote(null);
    setTimeLeft(newState.drawingTimeLimit);
  }

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  if (!gameState || !isJoined) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-green-50 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Enhanced Christmas Decorations */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          {/* Animated Snowflakes */}
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className={`absolute w-2 h-2 text-red-500 opacity-20 animate-float`}
              style={{
                left: `${(i * 8) % 100}%`,
                top: `${(i * 7) % 100}%`,
                transform: 'rotate(45deg)',
                animationDelay: `${i * 0.5}s`,
                animationDuration: `${3 + (i % 3)}s`,
              }}
            >
              <div className="w-full h-px bg-current absolute top-1/2"></div>
              <div className="w-full h-px bg-current absolute top-1/2 rotate-90"></div>
              <div className="w-full h-px bg-current absolute top-1/2 rotate-45"></div>
            </div>
          ))}

          {/* Ornaments */}
          <div className="absolute top-24 left-24 w-3 h-3 bg-red-500 rounded-full opacity-30 animate-pulse"></div>
          <div className="absolute top-40 right-32 w-2.5 h-2.5 bg-green-500 rounded-full opacity-30 animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute bottom-40 left-32 w-3 h-3 bg-red-500 rounded-full opacity-30 animate-pulse" style={{ animationDelay: '0.5s' }}></div>
          <div className="absolute bottom-24 right-24 w-2.5 h-2.5 bg-green-500 rounded-full opacity-30 animate-pulse" style={{ animationDelay: '1.5s' }}></div>

          {/* Stars */}
          <div className="absolute top-16 right-12 text-yellow-400 opacity-25 text-lg animate-spin-slow" style={{ transform: 'rotate(45deg)' }}>✦</div>
          <div className="absolute bottom-16 left-12 text-yellow-400 opacity-25 text-lg animate-spin-slow" style={{ transform: 'rotate(45deg)', animationDirection: 'reverse' }}>✦</div>

          {/* Garland lines with gradient */}
          <div className="absolute top-0 left-1/4 w-px h-40 bg-gradient-to-b from-red-500/20 via-red-500/10 to-transparent"></div>
          <div className="absolute top-0 right-1/4 w-px h-40 bg-gradient-to-b from-green-500/20 via-green-500/10 to-transparent"></div>
          <div className="absolute bottom-0 left-1/3 w-px h-40 bg-gradient-to-t from-red-500/20 via-red-500/10 to-transparent"></div>
          <div className="absolute bottom-0 right-1/3 w-px h-40 bg-gradient-to-t from-green-500/20 via-green-500/10 to-transparent"></div>
        </div>
        <div className="bg-white/95 backdrop-blur-md border-2 border-gray-200 shadow-2xl p-12 max-w-md w-full relative z-10 rounded-2xl transform hover:scale-105 transition-transform duration-300">
          {/* Decorative corner elements */}
          <div className="absolute -top-3 -right-3 w-6 h-6 bg-red-500 rounded-full opacity-40 animate-pulse"></div>
          <div className="absolute -bottom-3 -left-3 w-6 h-6 bg-green-500 rounded-full opacity-40 animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute -top-3 -left-3 w-4 h-4 bg-yellow-400 rounded-full opacity-30"></div>
          <div className="absolute -bottom-3 -right-3 w-4 h-4 bg-yellow-400 rounded-full opacity-30"></div>

          <h1 className="text-4xl font-light text-center mb-8 text-gray-900 tracking-tight relative">
            <span className="absolute -left-10 top-0 text-red-500 opacity-50 text-xl animate-float" style={{ transform: 'rotate(45deg)' }}>✦</span>
            Christmas Drawing
            <br />
            <span className="text-2xl">Game</span>
            <span className="absolute -right-10 top-0 text-green-500 opacity-50 text-xl animate-float" style={{ transform: 'rotate(45deg)', animationDelay: '1.5s' }}>✦</span>
          </h1>
          <div className="space-y-6">
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (userName.trim()) {
                  const trimmedName = userName.trim();
                  localStorage.setItem('userName', trimmedName);

                  // Ensure game state exists or join existing game
                  // Check remote state to avoid overwriting an active game
                  let saved = realtimeSync.getState();
                  if (!saved) {
                    saved = await realtimeSync.getRemoteState();
                  }

                  if (!saved) {
                    // Create new game
                    const newState: GameState = {
                      phase: 'drawing',
                      currentWord: getRandomWord(),
                      drawings: [],
                      votes: {},
                      startTime: Date.now(),
                      drawingTimeLimit: 120,
                      votingTimeLimit: 20,
                      activePlayers: userId ? { [userId]: Date.now() } : {},
                    };
                    setGameState(newState);
                    await realtimeSync.broadcastState(newState);
                    setTimeLeft(newState.drawingTimeLimit);
                  } else {
                    // Join existing game
                    const gameStateWithPlayers = {
                      ...saved,
                      activePlayers: {
                        ...(saved.activePlayers || {}),
                        ...(userId ? { [userId]: Date.now() } : {}),
                      },
                    };
                    setGameState(gameStateWithPlayers);
                    await realtimeSync.broadcastState(gameStateWithPlayers);
                    if (saved.phase === 'drawing') {
                      const elapsed = Math.floor((Date.now() - saved.startTime) / 1000);
                      setTimeLeft(Math.max(0, saved.drawingTimeLimit - elapsed));
                    } else if (saved.phase === 'voting') {
                      const elapsed = Math.floor((Date.now() - saved.startTime) / 1000);
                      setTimeLeft(Math.max(0, saved.votingTimeLimit - (elapsed - saved.drawingTimeLimit)));
                    }
                    // Check if user already submitted
                    const userDrawing = saved.drawings.find(d => d.id.startsWith(userId));
                    if (userDrawing) {
                      setHasSubmitted(true);
                    }
                    // Check if user already voted
                    if (saved.votes[userId]) {
                      setUserVote(saved.votes[userId]);
                    }
                  }

                  // Set userName last to trigger re-render
                  setUserName(trimmedName);
                  setIsJoined(true);
                }
              }}
            >
              <label className="block mb-6">
                <span className="text-black text-sm font-normal mb-2 block">Enter your name</span>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 focus:outline-none focus:border-gray-900 bg-transparent rounded-lg transition-all text-black"
                  placeholder="Your name"
                />
              </label>
              <button
                type="submit"
                disabled={!userName.trim()}
                className="w-full px-6 py-4 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 hover:from-gray-800 hover:via-gray-700 hover:to-gray-800 disabled:from-gray-200 disabled:to-gray-200 disabled:cursor-not-allowed text-white font-normal text-sm transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105 disabled:transform-none rounded-xl relative overflow-hidden group"
              >
                <span className="relative z-10">Start Playing</span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-green-50 p-4 relative overflow-hidden">
      {/* Enhanced Christmas Decorations */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        {/* Animated Snowflakes */}
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className={`absolute w-2 h-2 text-red-500 opacity-15 animate-float`}
            style={{
              left: `${(i * 7) % 100}%`,
              top: `${(i * 6) % 100}%`,
              transform: 'rotate(45deg)',
              animationDelay: `${i * 0.4}s`,
              animationDuration: `${3 + (i % 4)}s`,
            }}
          >
            <div className="w-full h-px bg-current absolute top-1/2"></div>
            <div className="w-full h-px bg-current absolute top-1/2 rotate-90"></div>
            <div className="w-full h-px bg-current absolute top-1/2 rotate-45"></div>
          </div>
        ))}

        {/* Ornaments */}
        <div className="absolute top-16 left-16 w-3 h-3 bg-red-500 rounded-full opacity-25 animate-pulse"></div>
        <div className="absolute top-32 right-24 w-2.5 h-2.5 bg-green-500 rounded-full opacity-25 animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-32 left-24 w-3 h-3 bg-red-500 rounded-full opacity-25 animate-pulse" style={{ animationDelay: '0.5s' }}></div>
        <div className="absolute bottom-16 right-16 w-2.5 h-2.5 bg-green-500 rounded-full opacity-25 animate-pulse" style={{ animationDelay: '1.5s' }}></div>
        <div className="absolute top-1/3 left-8 w-2 h-2 bg-red-500 rounded-full opacity-20"></div>
        <div className="absolute top-2/3 right-8 w-2 h-2 bg-green-500 rounded-full opacity-20"></div>
        <div className="absolute top-1/4 right-12 w-2 h-2 bg-red-500 rounded-full opacity-20"></div>
        <div className="absolute bottom-1/4 left-12 w-2 h-2 bg-green-500 rounded-full opacity-20"></div>

        {/* Stars */}
        <div className="absolute top-8 left-1/4 text-yellow-400 opacity-20 text-base animate-spin-slow" style={{ transform: 'rotate(45deg)' }}>✦</div>
        <div className="absolute top-8 right-1/4 text-yellow-400 opacity-20 text-base animate-spin-slow" style={{ transform: 'rotate(45deg)', animationDirection: 'reverse' }}>✦</div>
        <div className="absolute bottom-8 left-1/3 text-yellow-400 opacity-20 text-base animate-spin-slow" style={{ transform: 'rotate(45deg)' }}>✦</div>
        <div className="absolute bottom-8 right-1/3 text-yellow-400 opacity-20 text-base animate-spin-slow" style={{ transform: 'rotate(45deg)', animationDirection: 'reverse' }}>✦</div>

        {/* Garland lines */}
        <div className="absolute top-0 left-1/4 w-px h-40 bg-gradient-to-b from-red-500/20 via-red-500/10 to-transparent"></div>
        <div className="absolute top-0 right-1/4 w-px h-40 bg-gradient-to-b from-green-500/20 via-green-500/10 to-transparent"></div>
        <div className="absolute bottom-0 left-1/3 w-px h-40 bg-gradient-to-t from-red-500/20 via-red-500/10 to-transparent"></div>
        <div className="absolute bottom-0 right-1/3 w-px h-40 bg-gradient-to-t from-green-500/20 via-green-500/10 to-transparent"></div>

        {/* Horizontal garland */}
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-red-500/15 to-transparent"></div>
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-green-500/15 to-transparent"></div>
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        <header className="text-center mb-12 pt-8">
          <h1 className="text-3xl font-light text-gray-900 mb-4 tracking-tight relative">
            <span className="absolute -left-12 top-0 text-red-500 opacity-50 text-xl animate-float" style={{ transform: 'rotate(45deg)' }}>✦</span>
            Christmas Drawing Game
            <span className="absolute -right-12 top-0 text-green-500 opacity-50 text-xl animate-float" style={{ transform: 'rotate(45deg)', animationDelay: '1.5s' }}>✦</span>
          </h1>
          <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
            <span className="px-3 py-1 bg-white/80 rounded-lg border border-gray-200">{userName}</span>
            {timeLeft > 0 && (
              <span className="px-3 py-1 bg-white/80 rounded-lg border border-gray-200 text-gray-900 font-medium">{formatTime(timeLeft)}</span>
            )}
            <button
              onClick={() => setShowPlayers(!showPlayers)}
              className="px-4 py-1.5 border-2 border-gray-300 hover:border-gray-900 text-xs text-gray-700 transition-all duration-300 relative rounded-lg hover:shadow-lg transform hover:scale-105 bg-white/80 backdrop-blur-sm"
            >
              Players
              {activePlayerCount > 0 && (
                <span className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-lg animate-pulse">
                  {activePlayerCount}
                </span>
              )}
            </button>
          </div>
          {showPlayers && (
            <div className="mt-4 text-xs text-gray-500 bg-white/60 px-4 py-2 rounded-lg inline-block">
              {activePlayerCount} active player{activePlayerCount !== 1 ? 's' : ''} online
            </div>
          )}
        </header>

        <main className="border-t-2 border-gray-200 pt-8 bg-gradient-to-br from-white/90 via-white/70 to-white/90 backdrop-blur-md rounded-2xl p-8 shadow-2xl border-2 border-gray-100">
          {gameState.phase === 'drawing' && (
            <div>
              {!hasSubmitted ? (
                <DrawingCanvas
                  onDrawingComplete={handleDrawingComplete}
                  word={gameState.currentWord}
                  onSubmit={() => setHasSubmitted(true)}
                />
              ) : (
                <div className="text-center py-16">
                  <div className="inline-block px-6 py-3 bg-green-50 border-2 border-green-200 rounded-xl mb-4">
                    <p className="text-sm text-green-800 font-medium">Drawing submitted!</p>
                  </div>
                  <p className="text-xs text-gray-500 mb-8">
                    {gameState.drawings.length} drawing{gameState.drawings.length !== 1 ? 's' : ''} submitted
                  </p>
                  <div>
                    <button
                      onClick={() => {
                        const saved = realtimeSync.getState();
                        if (saved && saved.drawings.length > 0) {
                          advanceToVoting();
                        }
                      }}
                      className="px-8 py-3 bg-gradient-to-r from-gray-900 to-gray-800 hover:from-gray-800 hover:to-gray-700 text-white text-sm font-normal transition-all duration-300 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      Start voting
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {gameState.phase === 'voting' && (
            <VotingGallery
              drawings={gameState.drawings}
              onVote={handleVote}
              userVote={userVote}
            />
          )}

          {gameState.phase === 'results' && (
            <Results
              drawings={gameState.drawings}
              onNewRound={handleNewRound}
            />
          )}
        </main>

        <footer className="text-center mt-12 pt-8 border-t-2 border-gray-200 text-xs text-gray-400">
          <p className="bg-white/60 px-4 py-2 rounded-lg inline-block">Share this URL to play together • Real-time multiplayer</p>
        </footer>
      </div>
    </div>
  );
}
