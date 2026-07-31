export const dynamic = "force-dynamic";

import Link from "next/link";
import Image from "next/image";
import { UtensilsCrossed } from "lucide-react";
import { createSupabasePublicClient } from "@restoran/supabase-client";

export const metadata = { title: "Restoranlar" };

interface DirectoryRestaurant {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  theme_color: string;
}

/**
 * Platformanin restoran DIREKTORISI. Kod terefinde "hansi restoran"
 * secimi yoxdu ideyasi burada aradan qalxir - musteri bas sehifeye
 * girende butun aktiv/trial restoranlari loqo+ad kimi gorur, birine
 * tiklayanda o restoranin oz [slug] sehifesine kecir (bax: SAD).
 *
 * `get_public_restaurant_directory` RPC-si YALNIZ hessas olmayan
 * sutunlari (id/name/slug/logo/tema) qaytarir - owner_id, plan kimi
 * melumatlar burada YOXDUR.
 */
async function getRestaurants(): Promise<DirectoryRestaurant[]> {
  const supabase = createSupabasePublicClient();
  const { data } = await supabase.rpc("get_public_restaurant_directory");
  return data ?? [];
}

export default async function HomePage() {
  const restaurants = await getRestaurants();

  return (
    <div className="relative flex min-h-screen flex-col">
      {/* TAM SEHIFE foni: `fixed inset-0` ile viewport-a bağlanır - hero-nun
          öz hündürlüyünə DEYİL, BÜTÜN səhifəyə (scroll edəndə də sabit qalır).
          Bu, real DOM elementi olduğu ucun CSS-in `background-attachment:fixed`
          xassesinden FERQLI olaraq mobil Safari-de jank problemi yaratmır.
          `next/image` + `fill` avtomatik WebP/AVIF-e cevirir, CLS yaratmır. */}
      <div className="fixed inset-0 -z-20" aria-hidden="true">
        <Image src="/images/hero-restaurant.jpg" alt="" fill priority sizes="100vw" className="object-cover object-center" />
        {/* Tund overlay - butun sehife boyu oxunaqliligi (WCAG AA) temin edir */}
        <div className="absolute inset-0 bg-black/70" />
        <div
          className="absolute inset-0 opacity-40"
          style={{ background: "radial-gradient(circle at 50% 0%, rgb(var(--accent) / 0.25), transparent 55%)" }}
        />
      </div>

      <section className="relative flex items-center px-4 pb-10 pt-4 text-center md:pb-14 md:pt-6">
        <div className="relative z-10 mx-auto max-w-2xl">
          {/* Kloş/qapaq ikonu - yazinin ustunde, teqriben ayni terpenme
              animasiyasi ile (SAD-daki AI maskotu ile eyni brend dili). */}
          <Image
            src="/images/hero-cloche-icon.png"
            alt=""
            width={200}
            height={300}
            className="mx-auto h-64 w-auto animate-float drop-shadow-2xl md:h-80"
          />
          <h1 className="-mt-4 text-3xl font-semibold tracking-tight text-white md:-mt-6 md:text-5xl">
            Sevimli restoranınızı seçin
          </h1>
          <p className="mt-4 text-base text-white/85 md:text-lg">
            QR menyu, ağıllı tövsiyələr və anında sifariş — hamısı bir yerdə
          </p>
        </div>
      </section>

      <section className="relative px-4 pb-20 md:px-6">
        {restaurants.length === 0 ? (
          <div className="mx-auto max-w-md py-16 text-center">
            <UtensilsCrossed className="mx-auto h-10 w-10 text-white/60" aria-hidden="true" />
            <p className="mt-3 text-sm text-white/70">Hələ heç bir restoran qeydiyyatdan keçməyib</p>
          </div>
        ) : (
          <div className="mx-auto grid max-w-5xl grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {restaurants.map((r) => (
              <Link
                key={r.id}
                href={`/${r.slug}`}
                className="group flex flex-col items-center gap-3 rounded-xl border border-white/15 bg-white/10 p-4 text-center shadow-elevated backdrop-blur-md transition-transform hover:-translate-y-0.5 hover:bg-white/15"
              >
                <div
                  className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-lg"
                  style={{ backgroundColor: `${r.theme_color}33` }}
                >
                  {r.logo_url ? (
                    <Image
                      src={r.logo_url}
                      alt={r.name}
                      width={160}
                      height={160}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl font-semibold" style={{ color: r.theme_color }}>
                      {r.name.slice(0, 1).toUpperCase()}
                    </span>
                  )}
                </div>
                <span className="line-clamp-2 text-sm font-medium text-white group-hover:text-accent">
                  {r.name}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
