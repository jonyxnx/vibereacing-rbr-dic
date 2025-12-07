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
      const channel = supabase.channel('game-updates', {
        config: {
          presence: {
            key: ROOM_ID,
          },
        },
      });

      channel
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

              // Merge with local active players from Presence if needed?
              // For now just raw state update
              localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
              this.notifyListeners(newState);
            }
          }
        )
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState();
          // We can notify listeners about presence here if we want
          // But main game state is separate.
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            // Track presence once connected
            // We need userId for this, so we'll expose a method for it
          }
        });

      this.channelRef = channel;

      // Fetch initial state immediately
      this.fetchLatest();
    }
  }

  private channelRef: any = null;

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

  async trackPresence(userId: string) {
    if (this.channelRef) {
      await this.channelRef.track({
        user: userId,
        onlineAt: new Date().toISOString(),
      });
    }
  }

  getPresenceState() {
    if (!this.channelRef) return {};
    return this.channelRef.presenceState();
  }

  async submitDrawing(drawing: any) {
    const { error } = await supabase.rpc('submit_drawing', {
      room_id: ROOM_ID,
      drawing: drawing
    });
    if (error) console.error('Error submitting drawing:', error);
  }

  async submitVote(userId: string, drawingId: string) {
    const { error } = await supabase.rpc('submit_vote', {
      room_id: ROOM_ID,
      user_id: userId,
      drawing_id: drawingId
    });
    if (error) console.error('Error submitting vote:', error);
  }

  async updatePhase(phase: string, timeLimit: number) {
    // Phase change logic
    const { error } = await supabase.rpc('update_phase', {
      room_id: ROOM_ID,
      new_phase: phase,
      new_time_limit: timeLimit
    });
    if (error) console.error('Error updating phase:', error);
  }

  async resetGame(newState: GameState) {
    const { error } = await supabase.rpc('reset_game', {
      room_id: ROOM_ID,
      new_state: newState
    });
    if (error) console.error('Error resetting game:', error);
  }

  // Legacy broadcast - Try to avoid using this for partial updates!
  async broadcastState(state: GameState) {
    // Only use this for creation of ANY new room
    const { error } = await supabase
      .from('game_rooms')
      .upsert({
        id: ROOM_ID,
        state,
        updated_at: new Date().toISOString()
      });
    if (error) console.error('Error syncing state to Supabase:', error);
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

