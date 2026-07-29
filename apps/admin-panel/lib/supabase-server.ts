import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@restoran/supabase-client";

/**
 * Server Action / Route Handler daxilinde istifade olunacaq Supabase
 * musterisi. next/headers-in cookies() funksiyasini @restoran/supabase-client
 * paketinin gozlediyi ortaq CookieAdapter formatina cevirir.
 *
 * QEYD: Server Component daxilinde (sehife render zamani) cookie SET/REMOVE
 * cagirmaq Next.js-de xetaya sebeb olur - bu funksiya yalniz Server Action
 * ve Route Handler-lerde istifade edilmelidir.
 */
export function getSupabaseServerClient() {
  const cookieStore = cookies();
  return createSupabaseServerClient({
    get: (name: string) => cookieStore.get(name)?.value,
    set: (name: string, value: string, options) => {
      // Server Component daxilinde cookie set etmek qadagandir (Next.js bunu
      // atir) - middleware.ts artiq sessiya yenilenmesini idare edir, ona gore
      // burada sessiz key kecirik. Server Action/Route Handler-de bu try heç
      // vaxt tetiklenmir, cunki orada cookie set icazelidir.
      try {
        cookieStore.set({ name, value, ...options });
      } catch {
        /* Server Component daxilindeyik - middleware artiq halledir */
      }
    },
    remove: (name: string, options) => {
      try {
        cookieStore.set({ name, value: "", ...options, maxAge: 0 });
      } catch {
        /* Server Component daxilindeyik - middleware artiq halledir */
      }
    },
  });
}
