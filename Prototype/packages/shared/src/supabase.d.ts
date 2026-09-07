import { SupabaseClient } from '@supabase/supabase-js';
import { RouteStatus, RealtimeEvent } from './types';
export declare const isSupabaseClientConfigured: boolean;
export declare const supabaseAnon: SupabaseClient | null;
/**
 * Subscribes frontends to real-time route status changes.
 * Connects directly to Supabase Realtime (read-only using anon key).
 * If Supabase is unconfigured in local dev, gracefully uses BroadcastChannel.
 */
export declare function subscribeToRouteUpdates(onUpdate: (route: RouteStatus) => void, onReset?: () => void): () => void;
/**
 * Broadcasts an event locally across browser tabs (used by admin console)
 */
export declare function broadcastLocalEvent(event: RealtimeEvent): void;
