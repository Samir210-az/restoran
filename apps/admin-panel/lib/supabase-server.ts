import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@restoran/supabase-client";

/**
 * Server Component / Server Action daxilinde cagirilacaq Supabase musterisi.
 * Server Component-lerde cookie YAZMAQ mumkun deyil (Next.js mehdudiyyeti) -
 * ona gore set/remove sessiz key kecir. Real yazma Server Action-larda
 * ve ya middleware-de bas verir.
 */
export function getServerSupabase() {
  const cookieStore = cookies();

  return createSupabaseServerClient({
    get: (name) => cookieStore.get(name)?.value,
    set: (name, value, options) => {
      try {
        cookieStore.set(name, value, options);
      } catch {
        // Server Component daxilinde cookie yazila bilmez - gozlenilendir
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
