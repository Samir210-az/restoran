import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@restoran/supabase-client";

/**
 * Musteri tetbiqinde cookie yazma ehtiyaci minimaldir (henuz musteri
 * autentifikasiyasi yoxdur - QR menyu anonim baxis ucun public RLS
 * policy-lerine etibar edir). Struktur admin-panel ile eynidir ki,
 * gelecekde musteri login-i elave olunanda konsistent qalsin.
 */
export function getServerSupabase() {
  const cookieStore = cookies();

  return createSupabaseServerClient({
    get: (name) => cookieStore.get(name)?.value,
    set: (name, value, options) => {
      try {
        cookieStore.set(name, value, options);
      } catch {
        // Server Component daxilinde cookie yazila bilmez
      }
    },
    remove: (name, options) => {
      try {
        cookieStore.set(name, "", { ...options, maxAge: 0 });
      } catch {
        // eyni sebeb
      }
    },
  });
}
