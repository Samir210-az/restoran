"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

/**
 * Client Component-lerde ("use client") istifade olunacaq Supabase
 * musterisi. Yalniz public anon key istifade edir - RLS qaydalari
 * her sorgunu server terefinde qoruyur.
 *
 * NOT: netice acig sekilde SupabaseClient<Database,"public"> kimi teyin
 * olunur - bax: server.ts-deki eyni qeyd (createBrowserClient-in generic
 * cixarimi ile bagli compile-time-only mesele).
 */
export function createSupabaseBrowserClient(): SupabaseClient<Database, "public"> {
  return createBrowserClient<Database, "public">(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ) as unknown as SupabaseClient<Database, "public">;
}
