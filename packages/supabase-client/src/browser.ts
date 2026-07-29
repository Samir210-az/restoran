"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";

/**
 * Client Component-lerde ("use client") istifade olunacaq Supabase
 * musterisi. Yalniz public anon key istifade edir - RLS qaydalari
 * her sorgunu server terefinde qoruyur.
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
