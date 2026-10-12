import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Default Supabase project credentials (can be overridden via localStorage or .env)
const DEFAULT_SUPABASE_URL = 'https://flodsight-disaster-ai.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZsb2RzaWdodC1kaXNhc3Rlci1haSIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzYwMjg4MDAwLCJleHAiOjIwNzU4NjQwMDB9.samplePublicAnonKeyPlaceholderToken';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isCustom: boolean;
}

export function getSupabaseConfig(): SupabaseConfig {
  try {
    const customUrl = localStorage.getItem('floodsight_supabase_url');
    const customKey = localStorage.getItem('floodsight_supabase_key');
    if (customUrl && customKey) {
      return { url: customUrl.trim(), anonKey: customKey.trim(), isCustom: true };
    }
  } catch (e) {
    // Ignore localStorage errors
  }

  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (envUrl && envKey) {
    return { url: envUrl.trim(), anonKey: envKey.trim(), isCustom: true };
  }

  return {
    url: DEFAULT_SUPABASE_URL,
    anonKey: DEFAULT_SUPABASE_ANON_KEY,
    isCustom: false,
  };
}

export function saveSupabaseConfig(url: string, anonKey: string): void {
  localStorage.setItem('floodsight_supabase_url', url.trim());
  localStorage.setItem('floodsight_supabase_key', anonKey.trim());
  _cachedClient = null; // Invalidate cached instance
}

export function resetSupabaseConfig(): void {
  localStorage.removeItem('floodsight_supabase_url');
  localStorage.removeItem('floodsight_supabase_key');
  _cachedClient = null;
}

let _cachedClient: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (_cachedClient) return _cachedClient;

  const config = getSupabaseConfig();
  _cachedClient = createClient(config.url, config.anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
  return _cachedClient;
}
