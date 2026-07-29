import { createServerClient, type CookieOptions } from "@supabase/ssr";
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
export function createSupabaseServerClient(cookieAdapter: CookieAdapter) {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => cookieAdapter.get(name),
        set: (name, value, options) => cookieAdapter.set(name, value, options),
        remove: (name, options) => cookieAdapter.remove(name, options),
      },
    }
  );
}

/**
 * Yalniz Edge Function / trusted server mühitde istifade olunmalidir.
 * Service role key RLS-i BYPASS edir - browserde ve ya client bundle-da
 * HEC VAXT import edilmemelidir.
 */
export function createSupabaseServiceClient() {
  const { createClient } = require("@supabase/supabase-js");
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
