import { GameState } from './gameUtils';

const API_BASE = '/api/game';

export async function fetchGameState(): Promise<GameState | null> {
  try {
    const response = await fetch(API_BASE, {
      cache: 'no-store',
    });
    const data = await response.json();
    return data.gameState || null;
  } catch (error) {
    console.error('Error fetching game state:', error);
    return null;
  }
}

export async function saveGameStateToServer(gameState: GameState): Promise<boolean> {
  try {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ gameState }),
    });
    const data = await response.json();
    return data.success || false;
  } catch (error) {
    console.error('Error saving game state:', error);
    return false;
  }
}

