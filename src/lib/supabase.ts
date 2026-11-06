import { createClient, SupabaseClient } from '@supabase/supabase-js';

const DEFAULT_PROJECT_URL = 'https://mgktuovrhmkjvdqhhwbd.supabase.co';
const DEFAULT_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1na3R1b3ZyaG1ranZkcWhod2JkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM5OTE5MTQsImV4cCI6MjEwOTU2NzkxNH0.Tx7JKJGjQFgqKh4C4fBsfhw9TDXWEtkkTvqItqR9XLU';

export function getSupabaseConfig() {
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const localUrl = typeof window !== 'undefined' ? localStorage.getItem('couples_supabase_url') : '';
  const localKey = typeof window !== 'undefined' ? localStorage.getItem('couples_supabase_anon_key') : '';

  const url = (localUrl || envUrl || DEFAULT_PROJECT_URL).trim();
  const anonKey = (localKey || envKey || DEFAULT_ANON_KEY).trim();

  return {
    url,
    anonKey,
    isConfigured: Boolean(url && anonKey && anonKey.length > 20)
  };
}

let supabaseInstance: SupabaseClient | null = null;
let currentKey = '';
let currentUrl = '';

export function getSupabaseClient(): SupabaseClient | null {
  const { url, anonKey, isConfigured } = getSupabaseConfig();
  if (!isConfigured) return null;

  if (!supabaseInstance || currentUrl !== url || currentKey !== anonKey) {
    supabaseInstance = createClient(url, anonKey, {
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    });
    currentUrl = url;
    currentKey = anonKey;
  }

  return supabaseInstance;
}

export async function uploadMediaToStorage(
  fileOrBlob: File | Blob,
  folder: 'stickers' | 'wallpapers' | 'voice' | 'images',
  ext = 'webp'
): Promise<string | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { data, error } = await supabase.storage
      .from('chat-media')
      .upload(fileName, fileOrBlob, {
        cacheControl: '3600',
        upsert: false
      });

    if (error || !data) {
      console.warn('Supabase storage upload fallback to base64:', error?.message);
      return null;
    }

    const { data: publicData } = supabase.storage.from('chat-media').getPublicUrl(data.path);
    return publicData?.publicUrl || null;
  } catch (err) {
    console.warn('Error uploading to chat-media bucket:', err);
    return null;
  }
}
