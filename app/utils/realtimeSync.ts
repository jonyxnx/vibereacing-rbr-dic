import { GameState } from './gameUtils';

const CHANNEL_NAME = 'christmas-drawing-game-sync';
const STORAGE_KEY = 'christmasDrawingGame';

class RealtimeSync {
  private channel: BroadcastChannel | null = null;
  private listeners: Set<(state: GameState | null) => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      this.channel = new BroadcastChannel(CHANNEL_NAME);
      this.channel.onmessage = (event) => {
        if (event.data.type === 'state-update') {
          this.notifyListeners(event.data.state);
        } else if (event.data.type === 'state-clear') {
          this.notifyListeners(null);
        }
      };
    }
  }

  subscribe(callback: (state: GameState | null) => void) {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyListeners(state: GameState | null) {
    this.listeners.forEach((callback) => callback(state));
  }

  broadcastState(state: GameState) {
    if (this.channel) {
      this.channel.postMessage({
        type: 'state-update',
        state,
        timestamp: Date.now(),
      });
    }
    // Also save to localStorage for persistence
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  getState(): GameState | null {
    if (typeof window === 'undefined') return null;
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  }

  clearState() {
    if (this.channel) {
      this.channel.postMessage({
        type: 'state-clear',
        timestamp: Date.now(),
      });
    }
    localStorage.removeItem(STORAGE_KEY);
  }
}

export const realtimeSync = new RealtimeSync();

