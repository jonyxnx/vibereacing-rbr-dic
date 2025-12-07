import { GameState } from './gameUtils';
import { supabase } from './supabase';

// Helper to get room from URL
const getRoomId = () => {
  if (typeof window === 'undefined') return 'default-room';
  const params = new URLSearchParams(window.location.search);
  return params.get('room') || 'default-room';
};

const ROOM_ID = getRoomId();
const STORAGE_KEY = `christmasDrawingGame-${ROOM_ID}`;

class RealtimeSync {
  private listeners: Set<(state: GameState | null) => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      // Subscribe to Postgres Changes
      supabase
        .channel('game-updates')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'game_rooms',
            filter: `id=eq.${ROOM_ID}`,
          },
          (payload) => {
            if (payload.eventType === 'DELETE') {
              this.notifyListeners(null);
            } else if (payload.new && (payload.new as any).state) {
              const newState = (payload.new as any).state as GameState;
              // Update local cache
              localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
              this.notifyListeners(newState);
            }
          }
        )
        .subscribe();

      // Fetch initial state immediately
      this.fetchLatest();
    }
  }

  private async fetchLatest() {
    const { data, error } = await supabase
      .from('game_rooms')
      .select('state')
      .eq('id', ROOM_ID)
      .single();

    if (data && data.state) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data.state));
      this.notifyListeners(data.state);
    } else if (!data) {
      // No game exists on server
      // Maybe clear local partial state if any?
    }
  }

  subscribe(callback: (state: GameState | null) => void) {
    this.listeners.add(callback);
    // Provide current cached state immediately if available
    const cached = this.getState();
    if (cached) callback(cached);

    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyListeners(state: GameState | null) {
    this.listeners.forEach((callback) => callback(state));
  }

  async broadcastState(state: GameState) {
    // 1. Optimistic update for local UI
    this.notifyListeners(state);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

    // 2. Persist to DB
    const { error } = await supabase
      .from('game_rooms')
      .upsert({
        id: ROOM_ID,
        state,
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error syncing state to Supabase:', error);
    }
  }

  // Synchronous read from cache (legacy support)
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

  // Async read for initialization
  async getRemoteState(): Promise<GameState | null> {
    const { data } = await supabase
      .from('game_rooms')
      .select('state')
      .eq('id', ROOM_ID)
      .single();
    return data?.state || null;
  }

  async clearState() {
    await supabase.from('game_rooms').delete().eq('id', ROOM_ID);
    localStorage.removeItem(STORAGE_KEY);
    this.notifyListeners(null);
  }
}

export const realtimeSync = new RealtimeSync();

