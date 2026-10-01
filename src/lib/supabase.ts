import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment variables or runtime configuration
const envSupabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const envSupabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

// Check if credentials are stored in secure local configuration
const storedUrl = typeof window !== 'undefined' ? localStorage.getItem('super_db_url') || '' : '';
const storedKey = typeof window !== 'undefined' ? localStorage.getItem('super_db_key') || '' : '';

const activeUrl = envSupabaseUrl || storedUrl;
const activeKey = envSupabaseAnonKey || storedKey;

let supabaseInstance: SupabaseClient | null = null;

if (activeUrl && activeKey && activeUrl.startsWith('http')) {
  try {
    supabaseInstance = createClient(activeUrl, activeKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  } catch (err) {
    console.warn('Database client initialization skipped:', err);
  }
}

export const getSupabaseClient = (): SupabaseClient | null => {
  return supabaseInstance;
};

export const isDatabaseConnected = (): boolean => {
  return supabaseInstance !== null;
};

export const updateDatabaseCredentials = (url: string, key: string) => {
  if (typeof window !== 'undefined') {
    if (url && key) {
      localStorage.setItem('super_db_url', url);
      localStorage.setItem('super_db_key', key);
      try {
        supabaseInstance = createClient(url, key);
        return true;
      } catch {
        return false;
      }
    } else {
      localStorage.removeItem('super_db_url');
      localStorage.removeItem('super_db_key');
      supabaseInstance = null;
    }
  }
  return false;
};
