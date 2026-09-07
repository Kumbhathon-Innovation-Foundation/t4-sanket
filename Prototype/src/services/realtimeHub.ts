import { RealtimeEvent, RouteStatus, RouteTier, CrowdLevel, SupportedLanguage } from '../types';
import { INITIAL_ROUTES } from './mockData';

const BROADCAST_CHANNEL_NAME = 'kumbh_saathi_realtime_v1';
const STORAGE_KEY = 'kumbh_saathi_routes_state';

class RealtimeHubService {
  private channel: BroadcastChannel | null = null;
  private routes: RouteStatus[] = [];
  private listeners: Set<(event: RealtimeEvent) => void> = new Set();
  private queryListeners: Set<(query: string, lang?: SupportedLanguage, autoStart?: boolean) => void> = new Set();
  private audioCtx: AudioContext | null = null;

  constructor() {
    this.initStore();
    this.initBroadcastChannel();
  }

  private initStore() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed) && parsed.some((r: any) => r.route_id === 'R17')) {
          this.routes = parsed;
        } else {
          this.routes = [...INITIAL_ROUTES];
          this.saveStore();
        }
      } else {
        this.routes = [...INITIAL_ROUTES];
        this.saveStore();
      }
    } catch {
      this.routes = [...INITIAL_ROUTES];
    }
  }

  private saveStore() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.routes));
    } catch (e) {
      console.warn('Failed to save to localStorage', e);
    }
  }

  private initBroadcastChannel() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
        this.channel.onmessage = (event: MessageEvent<any>) => {
          const data = event.data;
          if (data && data.type === 'QUERY_BROADCAST') {
            this.notifyQueryListeners(data.query, data.lang, data.autoStart);
          } else if (data) {
            this.applyIncomingEvent(data as RealtimeEvent, false);
          }
        };
      } catch (e) {
        console.warn('BroadcastChannel not supported or blocked:', e);
      }
    }
  }

  public broadcastQuery(query: string, lang?: SupportedLanguage, autoStart?: boolean) {
    this.notifyQueryListeners(query, lang, autoStart);
    if (this.channel) {
      try {
        this.channel.postMessage({ type: 'QUERY_BROADCAST', query, lang, autoStart });
      } catch (e) {
        console.warn('Failed to postMessage:', e);
      }
    }
  }

  public subscribeQuery(listener: (query: string, lang?: SupportedLanguage, autoStart?: boolean) => void): () => void {
    this.queryListeners.add(listener);
    return () => {
      this.queryListeners.delete(listener);
    };
  }

  private notifyQueryListeners(query: string, lang?: SupportedLanguage, autoStart?: boolean) {
    this.queryListeners.forEach((fn) => {
      try {
        fn(query, lang, autoStart);
      } catch (err) {
        console.error('Error in query listener:', err);
      }
    });
  }

  private playTone(freq1: number, freq2: number, duration: number, type: 'alert' | 'info' = 'info') {
    if (typeof window === 'undefined') return;
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!this.audioCtx) {
        this.audioCtx = new AudioContextClass();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = type === 'alert' ? 'sawtooth' : 'sine';

      const now = this.audioCtx.currentTime;
      osc.frequency.setValueAtTime(freq1, now);
      osc.frequency.exponentialRampToValueAtTime(freq2, now + duration * 0.7);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + duration);
    } catch {
      // Audio autoplay policy fallback
    }
  }

  public playAlertSiren() {
    // Two-tone urgent siren for Tier 1 / Tier 2 Tactical Closures
    this.playTone(880, 520, 0.45, 'alert');
    setTimeout(() => {
      this.playTone(980, 600, 0.45, 'alert');
    }, 280);
  }

  public playSoftChime() {
    this.playTone(523.25, 659.25, 0.25, 'info');
  }

  public getRoutes(): RouteStatus[] {
    return [...this.routes];
  }

  public getRouteById(id: string): RouteStatus | undefined {
    return this.routes.find((r) => r.route_id === id);
  }

  public subscribe(listener: (event: RealtimeEvent) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(event: RealtimeEvent) {
    this.listeners.forEach((fn) => {
      try {
        fn(event);
      } catch (err) {
        console.error('Error in realtime listener:', err);
      }
    });
  }

  private applyIncomingEvent(event: RealtimeEvent, isLocalAction: boolean) {
    // Update local cache
    const idx = this.routes.findIndex((r) => r.route_id === event.route.route_id);
    if (idx !== -1) {
      this.routes[idx] = event.route;
    } else {
      this.routes.push(event.route);
    }
    this.saveStore();

    // Sound notification
    if (event.route.tier <= 2) {
      this.playAlertSiren();
    } else {
      this.playSoftChime();
    }

    this.notifyListeners(event);

    // Broadcast to other tabs/windows if triggered locally
    if (isLocalAction && this.channel) {
      this.channel.postMessage(event);
    }
  }

  public updateRouteStatus(
    routeId: string,
    tier: RouteTier,
    crowd: CrowdLevel,
    reason: { en: string; hi: string; mr: string },
    updatedBy: string = 'PRAVAH Police Control Command'
  ): RouteStatus {
    const existing = this.getRouteById(routeId);
    if (!existing) {
      throw new Error(`Route ${routeId} not found`);
    }

    const prevTier = existing.tier;
    const isClosed = tier === 1; // Tier 1 is tactical override / emergency closed

    const updated: RouteStatus = {
      ...existing,
      tier,
      crowd,
      is_closed: isClosed,
      closure_reason: isClosed ? reason.en : undefined,
      message_en: reason.en || existing.message_en,
      message_hi: reason.hi || existing.message_hi,
      message_mr: reason.mr || existing.message_mr,
      updated_by: updatedBy,
      updated_at: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      travel_time_min: isClosed ? 999 : tier === 2 ? existing.travel_time_min + 12 : existing.travel_time_min,
      color_code: isClosed ? '#EF4444' : tier === 2 ? '#3B82F6' : tier === 3 ? '#F59E0B' : '#10B981'
    };

    const event: RealtimeEvent = {
      type: isClosed ? 'TACTICAL_OVERRIDE' : 'ROUTE_UPDATE',
      route: updated,
      previous_tier: prevTier,
      timestamp: new Date().toISOString()
    };

    this.applyIncomingEvent(event, true);
    return updated;
  }

  public resetAllToNormal(): void {
    this.routes = INITIAL_ROUTES.map((r) => ({
      ...r,
      tier: 4,
      is_closed: false,
      closure_reason: undefined,
      updated_at: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    }));
    this.saveStore();

    this.playSoftChime();

    const event: RealtimeEvent = {
      type: 'RESET_ALL',
      route: this.routes[0],
      timestamp: new Date().toISOString()
    };

    this.notifyListeners(event);
    if (this.channel) {
      this.channel.postMessage(event);
    }
  }
}

export const realtimeHub = new RealtimeHubService();
