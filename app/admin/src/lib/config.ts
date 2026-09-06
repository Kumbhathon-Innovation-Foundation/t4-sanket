// Runtime configuration for PRAVAH (Anubhav)
// Toggles between 'demo' (in-memory mock store) and 'supabase' (live PostgreSQL + PostGIS)

export type DataMode = "demo" | "supabase";

const envMode = ((import.meta.env as Record<string, string | undefined>)["VITE_DATA_MODE"] as string | undefined)?.toLowerCase();

export const DATA_MODE: DataMode = envMode === "demo" ? "demo" : "supabase";

export const isDemoMode = (): boolean => DATA_MODE === "demo";
export const isSupabaseMode = (): boolean => DATA_MODE === "supabase";

const envUrl = (import.meta.env as Record<string, string | undefined>)["VITE_SUPABASE_URL"] || "";
const envKey = (import.meta.env as Record<string, string | undefined>)["VITE_SUPABASE_ANON_KEY"] || "";

export const SUPABASE_CONFIG = {
  url: envUrl,
  anonKey: envKey,
  isConfigured: Boolean(envUrl && envKey),
};
