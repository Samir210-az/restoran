import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

/**
 * Sessiya/cookie teleb etmeyen, sadece public (anon) oxuma ucun
 * stateless musteri. Server Component-lerde (auth teleb olunmayan
 * meselen musteri QR menyu sehifesi) istifade ucun ideal-dir -
 * @supabase/ssr-in cookie mürəkkəbliyi burada lazim deyil.
 */
export function createSupabasePublicClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );
}
