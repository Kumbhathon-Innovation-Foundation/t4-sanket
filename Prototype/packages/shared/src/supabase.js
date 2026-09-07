import { createClient } from '@supabase/supabase-js';
// Frontends only receive public read-only anon key; NEVER service role key
const metaEnv = typeof import.meta !== 'undefined' ? import.meta.env : undefined;
const envSupabaseUrl = metaEnv ? metaEnv.VITE_SUPABASE_URL : undefined;
const envAnonKey = metaEnv ? metaEnv.VITE_SUPABASE_ANON_KEY : undefined;
export const isSupabaseClientConfigured = Boolean(envSupabaseUrl &&
    envAnonKey &&
    !envSupabaseUrl.includes('your-project'));
export const supabaseAnon = isSupabaseClientConfigured
    ? createClient(envSupabaseUrl, envAnonKey)
    : null;
const BROADCAST_CHANNEL_NAME = 'kumbh_saathi_realtime_v1';
/**
 * Subscribes frontends to real-time route status changes.
 * Connects directly to Supabase Realtime (read-only using anon key).
 * If Supabase is unconfigured in local dev, gracefully uses BroadcastChannel.
 */
export function subscribeToRouteUpdates(onUpdate, onReset) {
    const unsubscribers = [];
    // 1. Supabase Realtime Postgres Changes Subscription
    if (supabaseAnon) {
        try {
            const channel = supabaseAnon
                .channel('public:route_status')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'route_status' }, (payload) => {
                if (payload.new && payload.new.route_id) {
                    const updatedRecord = payload.new;
                    const formattedRoute = {
                        route_id: updatedRecord.route_id,
                        name: updatedRecord.route_id === 'R17'
                            ? 'Modi Ground to Ramkund via Riverside Road'
                            : updatedRecord.route_id === 'R21'
                                ? 'Modi Ground via Panchavati Ghat Diversion'
                                : 'Modi Ground to Tapovan Ghat Bypass Corridor',
                        name_hi: updatedRecord.message_hi || '',
                        name_mr: updatedRecord.message_mr || '',
                        destination: updatedRecord.to_location || 'Ramkund Ghat',
                        from_location: updatedRecord.from_location,
                        to_location: updatedRecord.to_location,
                        tier: updatedRecord.tier,
                        crowd: updatedRecord.crowd,
                        message_en: updatedRecord.message_en || '',
                        message_hi: updatedRecord.message_hi || '',
                        message_mr: updatedRecord.message_mr || '',
                        updated_by: updatedRecord.updated_by || 'Police Command Desk',
                        updated_at: new Date(updatedRecord.updated_at || Date.now()).toLocaleTimeString(),
                        travel_time_min: updatedRecord.tier === 1 ? 999 : updatedRecord.tier === 2 ? 22 : 14,
                        is_closed: updatedRecord.tier === 1,
                        color_code: updatedRecord.tier === 1 ? '#EF4444' : updatedRecord.tier === 2 ? '#3B82F6' : '#2F7A6B'
                    };
                    onUpdate(formattedRoute);
                }
            })
                .subscribe();
            unsubscribers.push(() => {
                supabaseAnon.removeChannel(channel);
            });
        }
        catch (err) {
            console.warn('Supabase Realtime subscription error:', err);
        }
    }
    // 2. BroadcastChannel fallback for multi-tab local dev & offline demos
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        try {
            const bc = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
            const handler = (ev) => {
                if (ev.data?.type === 'RESET_ALL') {
                    onReset?.();
                }
                else if (ev.data?.route) {
                    onUpdate(ev.data.route);
                }
            };
            bc.addEventListener('message', handler);
            unsubscribers.push(() => {
                bc.removeEventListener('message', handler);
                bc.close();
            });
        }
        catch (e) {
            console.warn('BroadcastChannel error:', e);
        }
    }
    return () => {
        unsubscribers.forEach((fn) => fn());
    };
}
/**
 * Broadcasts an event locally across browser tabs (used by admin console)
 */
export function broadcastLocalEvent(event) {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        try {
            const bc = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
            bc.postMessage(event);
            bc.close();
        }
        catch (e) {
            console.warn('Broadcast local event error:', e);
        }
    }
}
