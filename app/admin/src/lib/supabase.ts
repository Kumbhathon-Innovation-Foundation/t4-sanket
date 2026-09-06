// Dedicated Supabase client module for PRAVAH.
// Safe initialization: falls back gracefully if credentials are not configured (e.g. in DEMO mode).

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_CONFIG, DATA_MODE } from "./config";

let supabaseClientInstance: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient => {
  if (supabaseClientInstance) {
    return supabaseClientInstance;
  }

  const { url, anonKey, isConfigured } = SUPABASE_CONFIG;

  if (!isConfigured) {
    if (DATA_MODE === "supabase") {
      console.warn(
        "[PRAVAH Database] VITE_DATA_MODE is set to 'supabase', but VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY are missing. Please configure your .env file."
      );
    }
    // Safe placeholder client so calling code doesn't throw immediate fatal error
    supabaseClientInstance = createClient(
      url || "https://placeholder-project.supabase.co",
      anonKey || "placeholder-anon-key"
    );
    return supabaseClientInstance;
  }

  supabaseClientInstance = createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  });

  return supabaseClientInstance;
};

export const supabase = getSupabaseClient();
