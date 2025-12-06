export const CHRISTMAS_WORDS = [
  'Santa Claus',
  'Christmas Tree',
  'Snowman',
  'Reindeer',
  'Gift',
  'Stocking',
  'Candy Cane',
  'Ornament',
  'Wreath',
  'Mistletoe',
  'Gingerbread',
  'Elf',
  'Sleigh',
  'Star',
  'Angel',
  'Nativity',
  'Bells',
  'Candle',
  'Fireplace',
  'Snowflake',
  'Hot Chocolate',
  'Presents',
  'Ribbon',
  'Holly',
  'Carols',
];

export interface Drawing {
  id: string;
  imageData: string;
  word: string;
  author: string;
  votes: number;
}

export interface GameState {
  phase: 'drawing' | 'voting' | 'results';
  currentWord: string;
  drawings: Drawing[];
  votes: Record<string, string>; // userId -> drawingId
  startTime: number;
  drawingTimeLimit: number; // in seconds
  votingTimeLimit: number; // in seconds
  activePlayers: Record<string, number>; // userId -> lastActive timestamp
}

export function getRandomWord(): string {
  return CHRISTMAS_WORDS[Math.floor(Math.random() * CHRISTMAS_WORDS.length)];
}

export function generateUserId(): string {
  return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function saveGameState(state: GameState): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('christmasDrawingGame', JSON.stringify(state));
  }
}

export function loadGameState(): GameState | null {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('christmasDrawingGame');
    if (saved) {
      return JSON.parse(saved);
    }
  }
  return null;
}

export function clearGameState(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('christmasDrawingGame');
  }
}

export function updateActivePlayer(userId: string): void {
  if (typeof window !== 'undefined') {
    const saved = loadGameState();
    if (saved) {
      const newState = {
        ...saved,
        activePlayers: {
          ...saved.activePlayers,
          [userId]: Date.now(),
        },
      };
      // Remove players inactive for more than 30 seconds
      const thirtySecondsAgo = Date.now() - 30000;
      Object.keys(newState.activePlayers).forEach((id) => {
        if (newState.activePlayers[id] < thirtySecondsAgo) {
          delete newState.activePlayers[id];
        }
      });
      saveGameState(newState);
    }
  }
}

export function getActivePlayerCount(): number {
  if (typeof window !== 'undefined') {
    const saved = loadGameState();
    if (saved && saved.activePlayers) {
      const thirtySecondsAgo = Date.now() - 30000;
      return Object.keys(saved.activePlayers).filter(
        (id) => saved.activePlayers[id] > thirtySecondsAgo
      ).length;
    }
  }
  return 0;
}

