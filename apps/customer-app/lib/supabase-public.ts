import { createClient } from "@supabase/supabase-js";
import type { Database } from "@restoran/supabase-client";

/**
 * Musteri tetbiqinin public (anon, sessiyasiz) sorgulari ucun.
 * RLS-in "select_public" qaydalari (is_active/is_available = true)
 * hansi setrlerin gorunecegini artiq server terefinde mehdudlasdirir -
 * bu client sadece o qaydalarla icaze verilen datani ala biler.
 */
export function getPublicSupabaseClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );
}
