import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

/**
 * Sessiya/cookie teleb etmeyen, sadece public (anon) oxuma ucun
 * stateless musteri. Server Component-lerde (auth teleb olunmayan
 * meselen musteri QR menyu sehifesi) istifade ucun ideal-dir -
 * @supabase/ssr-in cookie mürəkkəbliyi burada lazim deyil.
 *
 * QEYD (bug duzelisi - "silinmiş restoran yenə görünür" şikayətinin
 * ƏSL KÖKÜ): `dynamic = "force-dynamic"` route seqment ayarı YALNIZ
 * Next.js-in öz render keşini bağlayır - lakin bəzi Supabase RPC
 * çağırışları (STABLE/IMMUTABLE funksiyalar, arqumentsiz) GET
 * sorğusu kimi göndərilir, bu isə Next.js-in fetch Data Cache-i
 * tərəfindən sessizcə keşlənə bilir (route dynamic olsa belə!).
 * Həll: bu client-in İSTİFADƏ ETDİYİ hər fetch çağırışına açıq
 * şəkildə `cache: "no-store"` təyin edirik - artıq heç bir sorğu
 * keşlənmir, nə qədər "stable" elan olunsa da.
 */
export function createSupabasePublicClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: { persistSession: false },
      global: {
        fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }),
      },
    }
  );
}
