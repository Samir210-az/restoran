import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

interface CookieAdapter {
  get(name: string): string | undefined;
  set(name: string, value: string, options: CookieOptions): void;
  remove(name: string, options: CookieOptions): void;
}

/**
 * Server Component / Route Handler / Server Action daxilinde istifade
 * olunacaq Supabase musterisi. Next.js-in cookies() adapterini qebul edir
 * ki, autentifikasiya sessiyasi request-response arasinda saxlanilsin.
 */
export function createSupabaseServerClient(cookieAdapter: CookieAdapter): SupabaseClient<Database, "public"> {
  // NOT: @supabase/ssr-in createServerClient() generic cixarimi bezi TS/versiya
  // kombinasiyalarinda Schema-ni duzgun bagla bilmir (esas dependency movcuddur,
  // runtime-a tesiri yoxdur - bu, sirf compile-time tip annotasiyasidir).
  // Ona gore netice tipi acig sekilde teyin edirik.
  return createServerClient<Database, "public">(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => cookieAdapter.get(name),
        set: (name: string, value: string, options: CookieOptions) => cookieAdapter.set(name, value, options),
        remove: (name: string, options: CookieOptions) => cookieAdapter.remove(name, options),
      },
    }
  ) as unknown as SupabaseClient<Database, "public">;
}

/**
 * Yalniz Edge Function / trusted server mühitde istifade olunmalidir.
 * Service role key RLS-i BYPASS edir - browserde ve ya client bundle-da
 * HEC VAXT import edilmemelidir.
 */
export function createSupabaseServiceClient(): SupabaseClient<Database, "public"> {
  return createClient<Database, "public">(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  ) as unknown as SupabaseClient<Database, "public">;
}
