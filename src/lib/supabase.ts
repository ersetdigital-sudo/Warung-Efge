import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _supabase: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (_supabase) return _supabase;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  if (!url || !key) {
    // Return a dummy client that won't crash during build
    return createClient("https://placeholder.supabase.co", "placeholder");
  }
  _supabase = createClient(url, key);
  return _supabase;
}

export const supabase = getSupabaseClient();
