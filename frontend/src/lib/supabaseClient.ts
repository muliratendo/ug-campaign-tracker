import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // In development, we might not have them yet, so we warn or return a dummy?
  // Better to throw so we fail fast if config is missing.
  // But during build time it might fail if env vars aren't present.
  // Let's check window typeof to avoid build errors if we want.
}

// For robustness during initial setup/build attempts where keys might be missing
const url = supabaseUrl || "https://placeholder.supabase.co";
const key = supabaseAnonKey || "placeholder-key";

export const supabase = createClient(url, key);
